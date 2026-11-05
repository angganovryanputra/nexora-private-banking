package com.nexorabank.omniwear

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
 * Wear OS biometric telemetry module.
 *
 * INTENTIONALLY VULNERABLE (watch-specific attack surface):
 *  - V-W1: every reading is persisted to *plaintext* SharedPreferences
 *          (co-located with credentials in NexoraVaultPrefs).
 *  - V-W3: every reading — including user identity — is written to
 *          the system log, readable by any app holding READ_LOGS / adb.
 */
class HeartRateModule(private val reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        const val NAME = "HeartRate"
        const val PREFS_NAME = "NexoraVaultPrefs"
        const val HISTORY_KEY = "heart_rate_history"
        const val LOG_TAG = "NEXORA_HEALTH_TELEMETRY"
        const val MAX_HISTORY = 500
    }

    private var sensorManager: SensorManager? = null
    private var heartSensor: Sensor? = null
    private var offBodySensor: Sensor? = null
    private var simHandler: Handler? = null
    private var simBpm = 72

    // V-W11: client-side-only "is the watch on the wrist?" state. There is NO
    // hardware attestation to the backend, so this boolean is trivially spoofed
    // with a one-line Frida hook on isWristDetected().
    @Volatile private var wristPresent = true

    override fun getName() = NAME

    private fun prefs(): SharedPreferences =
            reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun persistReading(bpm: Int, timestampSec: Long) {
        val json = JSONArray(prefs().getString(HISTORY_KEY, "[]"))
        val acct = prefs().getString("account_number", "NX-8492014") ?: "NX-8492014"
        val entry = JSONObject()
        entry.put("bpm", bpm)
        entry.put("timestamp", timestampSec)
        entry.put("account_number", acct)
        entry.put("sensor_type", "OPTICAL_PPG_ARRAY")
        entry.put("stress_index", (bpm * 0.82).toInt())
        json.put(entry)
        while (json.length() > MAX_HISTORY) {
            json.remove(0)
        }
        val serialized = json.toString()
        prefs().edit()
            .putString(HISTORY_KEY, serialized)
            .putString("health_telemetry_json", serialized)
            .apply()
    }

    private fun emit(bpm: Int, timestampSec: Long) {
        val acct = prefs().getString("account_number", "NX-8492014") ?: "NX-8492014"
        val user = prefs().getString("username", "alexander.vance") ?: "alexander.vance"
        Log.d(
            LOG_TAG,
            "user=$user account=$acct bpm=$bpm ts=$timestampSec",
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

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return
        when (event.sensor?.type) {
            Sensor.TYPE_LOW_LATENCY_OFFBODY_DETECT -> {
                // 1.0 = on body, 0.0 = off body.
                val onBody = (event.values.firstOrNull() ?: 1f) >= 1f
                updateWrist(onBody)
            }
            Sensor.TYPE_HEART_RATE -> {
                val bpm = event.values.firstOrNull()?.toInt() ?: return
                // A 0 BPM reading from the PPG array is the classic off-wrist signal.
                updateWrist(bpm > 0)
                if (bpm > 0) handleReading(bpm)
            }
            else -> {
                val bpm = event.values.firstOrNull()?.toInt() ?: return
                handleReading(bpm)
            }
        }
    }

    private fun updateWrist(onBody: Boolean) {
        if (wristPresent == onBody) return
        wristPresent = onBody
        emitWristState()
    }

    private fun emitWristState() {
        val params = Arguments.createMap().apply { putBoolean("wristPresent", wristPresent) }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("WristStateChanged", params)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

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
        // Off-body / wrist-detect sensor (V-W11). Present on most real Wear OS
        // hardware; absent on emulators (handled by the simulator path).
        offBodySensor = sensorManager?.getDefaultSensor(Sensor.TYPE_LOW_LATENCY_OFFBODY_DETECT)
        offBodySensor?.let {
            sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
        if (heartSensor != null) {
            sensorManager?.registerListener(
                this, heartSensor, SensorManager.SENSOR_DELAY_NORMAL,
            )
            Log.d(LOG_TAG, "using hardware heart-rate sensor")
        } else {
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
        offBodySensor = null
        simHandler?.removeCallbacks(simRunnable)
        simHandler = null
    }

    // ------------------------------------------------------- V-W11 WRIST STATE
    /**
     * Client-side wrist-on check with NO backend attestation. This is the method
     * the pentest guide's Frida script hooks to defeat the "wrist-off lockout":
     *   HeartRateModule.isWristDetected.implementation = function() { return true; }
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isWristDetected(): Boolean {
        if (prefs().getBoolean("force_wrist_present", false)) return true
        return wristPresent
    }

    @ReactMethod
    fun getWristState(promise: Promise) {
        promise.resolve(isWristDetected())
    }

    @ReactMethod
    fun setWristPresent(present: Boolean, promise: Promise) {
        // Lab helper for emulators that lack a hardware off-body sensor:
        // lets a tester simulate taking the watch off the wrist.
        updateWrist(present)
        promise.resolve(wristPresent)
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

    @ReactMethod
    fun addListener(eventName: String?) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

