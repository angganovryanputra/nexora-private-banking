package com.vulnerablebankapp

import android.content.Context
import android.content.SharedPreferences
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.random.Random

/**
 * Wear OS heart-rate telemetry module.
 *
 * INTENTIONALLY VULNERABLE (watch-specific attack surface):
 *  - V-W1: every reading is persisted to *plaintext* SharedPreferences
 *          (same "VulnBankPrefs" file that stores the hardcoded credentials).
 *  - V-W3: every reading — including the stored username — is written to
 *          the system log, readable by any app holding READ_LOGS / adb.
 *
 * When no hardware heart-rate sensor exists (e.g. emulator), a simulator
 * produces plausible telemetry so the vulnerability surface stays
 * demonstrable everywhere.
 */
class HeartRateModule(private val reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        const val NAME = "HeartRate"
        const val PREFS_NAME = "VulnBankPrefs"
        const val HISTORY_KEY = "heart_rate_history"
        const val LOG_TAG = "HEART_RATE_LEAK"
        const val MAX_HISTORY = 500
    }

    private var sensorManager: SensorManager? = null
    private var heartSensor: Sensor? = null
    private var simHandler: Handler? = null
    private var simBpm = 72

    override fun getName() = NAME

    private fun prefs(): SharedPreferences =
            reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // ---------------------------------------------------------------- storage
    // V-W1: plaintext storage of health data, co-located with credentials.
    private fun persistReading(bpm: Int, timestampSec: Long) {
        val json = JSONArray(prefs().getString(HISTORY_KEY, "[]"))
        val entry = JSONObject()
        entry.put("bpm", bpm)
        entry.put("timestamp", timestampSec)
        json.put(entry)
        while (json.length() > MAX_HISTORY) {
            json.remove(0)
        }
        prefs().edit().putString(HISTORY_KEY, json.toString()).apply()
    }

    private fun emit(bpm: Int, timestampSec: Long) {
        // V-W3: health data + identity leaked to system logcat.
        Log.d(
            LOG_TAG,
            "user=${prefs().getString("username", "unknown")} bpm=$bpm ts=$timestampSec",
        )
        persistReading(bpm, timestampSec)

        val params = Arguments.createMap().apply {
            putInt("bpm", bpm)
            putDouble("timestamp", timestampSec.toDouble())
        }
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("HeartRate", params)
    }

    private fun handleReading(bpm: Int) {
        emit(bpm, TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis()))
    }

    // ---------------------------------------------------------------- sensor
    override fun onSensorChanged(event: SensorEvent?) {
        val bpm = event?.values?.firstOrNull()?.toInt() ?: return
        handleReading(bpm)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    // ------------------------------------------------------------- simulator
    private val simRunnable: Runnable = object : Runnable {
        override fun run() {
            simBpm = (simBpm + Random.nextInt(-3, 4)).coerceIn(60, 100)
            handleReading(simBpm)
            simHandler?.postDelayed(this, 2000)
        }
    }

    @ReactMethod
    fun start() {
        stop()
        sensorManager = reactContext.getSystemService(SensorManager::class.java)
        heartSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_HEART_RATE)
        if (heartSensor != null) {
            sensorManager?.registerListener(
                this, heartSensor, SensorManager.SENSOR_DELAY_NORMAL,
            )
            Log.d(LOG_TAG, "using hardware heart-rate sensor")
        } else {
            // Emulator / watch without a heart-rate sensor: simulate telemetry
            // so the demo (and its leaks) still works end-to-end.
            simHandler = Handler(Looper.getMainLooper())
            simHandler?.post(simRunnable)
            Log.d(LOG_TAG, "no hardware sensor; simulated heart-rate telemetry active")
        }
    }

    @ReactMethod
    fun stop() {
        sensorManager?.unregisterListener(this)
        sensorManager = null
        heartSensor = null
        simHandler?.removeCallbacks(simRunnable)
        simHandler = null
    }

    @ReactMethod
    fun getHistory(promise: Promise) {
        promise.resolve(prefs().getString(HISTORY_KEY, "[]"))
    }

    @ReactMethod
    fun clearHistory(promise: Promise) {
        prefs().edit().remove(HISTORY_KEY).apply()
        promise.resolve(null)
    }

    // NativeEventEmitter parity (RN >= 0.65)
    @ReactMethod
    fun addListener(eventName: String?) {}

    @ReactMethod
    fun removeListeners(count: Double) {}
}
