package com.nexorabank.omniwear

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

/**
 * PILLAR 2: BLUETOOTH SYNC & WEARABLE DATA LAYER
 *
 * Simulates companion smartphone communication over Bluetooth Low Energy (BLE)
 * and Google Play Services Wearable Data Layer.
 *
 * INTENTIONALLY VULNERABLE:
 *  - V-B01: Insecure Companion Sync Receiver (No HMAC / Signature verification)
 *  - V-B02: BLE Packet Replay Attack (No timestamp freshness / nonce check)
 *  - V-B03: Companion Token Bleed (Broadcasts sensitive JWT over simulated BLE)
 */
class BluetoothSyncModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "BluetoothSync"
        const val ACTION_BT_SYNC = "com.nexorabank.omniwear.ACTION_BT_SYNC"
        const val LEGACY_ACTION_BT_SYNC = "com.vulnerablebankapp.ACTION_BT_SYNC"
        const val ACTION_BT_BEACON = "com.nexorabank.omniwear.ACTION_BT_BEACON"
        const val LOG_TAG = "NEXORA_BT_SYNC"
        const val PREFS_NAME = "NexoraVaultPrefs"
        const val LEGACY_PREFS_NAME = "VulnBankPrefs"
    }

    override fun getName() = NAME

    private val syncReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null) return
            val act = intent.action
            if (act != ACTION_BT_SYNC && act != LEGACY_ACTION_BT_SYNC) return

            val payloadStr = intent.getStringExtra("sync_payload") ?: "{}"
            Log.w(LOG_TAG, "⚠️ [V-B01 EXPLOIT] Received unauthenticated BLE sync packet: $payloadStr")

            try {
                val json = JSONObject(payloadStr)
                val action = json.optString("action", "SYNC_BALANCE")
                val amount = json.optDouble("amount", 0.0)

                // V-B02: Replay vulnerability - packet is processed unconditionally without nonce check
                val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val legacyPrefs = reactContext.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
                if (action == "UPDATE_BALANCE") {
                    prefs.edit().putString("balance", "Rp ${amount.toLong()}").apply()
                    legacyPrefs.edit().putString("balance", "$$amount").apply()
                }

                // Store last synced payload for inspection
                reactContext.getSharedPreferences("quick_pin", Context.MODE_PRIVATE)
                    .edit()
                    .putString("last_bt_payload", payloadStr)
                    .putLong("last_bt_sync_time", System.currentTimeMillis())
                    .apply()

                Toast.makeText(
                    reactContext,
                    "📶 [BLE Sync] Executed action: $action ($$amount)",
                    Toast.LENGTH_LONG
                ).show()

                // Notify React Native UI
                val params = Arguments.createMap().apply {
                    putString("action", action)
                    putDouble("amount", amount)
                    putString("raw", payloadStr)
                }
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("BluetoothSyncEvent", params)

            } catch (e: Exception) {
                Log.e(LOG_TAG, "Error parsing sync packet", e)
            }
        }
    }

    init {
        val filter = IntentFilter().apply {
            addAction(ACTION_BT_SYNC)
            addAction(LEGACY_ACTION_BT_SYNC)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(syncReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            reactContext.registerReceiver(syncReceiver, filter)
        }
    }

    @ReactMethod
    fun simulatePhoneBeacon(promise: Promise) {
        // V-B03: Leak victim JWT token and pairing keys via simulated BLE advertisement
        val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val username = prefs.getString("username", "admin") ?: "admin"
        val jwt = Secrets.HARDCODED_ADMIN_JWT

        val beaconPayload = JSONObject().apply {
            put("device_type", "WEAR_OS_480X480")
            put("paired_user", username)
            put("auth_token", jwt)
            put("bt_mac", "DC:A6:32:8B:11:04")
            put("replay_nonce_supported", false)
        }

        Log.w(LOG_TAG, "⚠️ [V-B03 BLE LEAK] Broadcasting unencrypted BLE beacon: $beaconPayload")

        val intent = Intent(ACTION_BT_BEACON).apply {
            putExtra("beacon_data", beaconPayload.toString())
        }
        reactContext.sendBroadcast(intent)

        promise.resolve(beaconPayload.toString())
    }

    @ReactMethod
    fun getLastSyncData(promise: Promise) {
        val prefs = reactContext.getSharedPreferences("quick_pin", Context.MODE_PRIVATE)
        val payload = prefs.getString("last_bt_payload", "No Bluetooth sync received yet")
        val timestamp = prefs.getLong("last_bt_sync_time", 0)
        val map = Arguments.createMap().apply {
            putString("payload", payload)
            putDouble("timestamp", timestamp.toDouble())
        }
        promise.resolve(map)
    }
}

