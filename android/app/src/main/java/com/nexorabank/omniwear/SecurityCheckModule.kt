package com.nexorabank.omniwear

import android.content.Context
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.net.Socket

/**
 * PILLAR 4: RUNTIME CHECKS & ANTI-TAMPERING
 *
 * Demonstrates typical mobile banking runtime security checks on Wear OS,
 * and how they are easily bypassed using Frida, Smali patching, or SharedPreferences manipulation.
 *
 * INTENTIONALLY VULNERABLE:
 *  - V-R01: Naive Root Detection (checks hardcoded /system/bin/su files)
 *  - V-R02: Client-side Invertible Flag (reads 'bypass_root_check' from SharedPreferences)
 *  - V-R03: Naive Frida Detection (easily hooked with 1 line of JS)
 *  - V-R04: Missing Wrist-Detection / Lockout enforcement
 */
class SecurityCheckModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SecurityCheck"
        const val LOG_TAG = "NEXORA_SECURITY_CHECK"
        const val PREFS_NAME = "NexoraVaultPrefs"
    }

    override fun getName() = NAME

    // ------------------------------------------------------------- 1. ROOT CHECK
    @ReactMethod
    fun isDeviceRooted(): Boolean {
        // V-R02: Check if client-side bypass flag is enabled in primary prefs
        val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        if (prefs.getBoolean("bypass_root_check", false)) {
            Log.d(LOG_TAG, "Root check bypassed via client SharedPreferences flag!")
            return false
        }

        val suPaths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        for (path in suPaths) {
            if (File(path).exists()) {
                Log.w(LOG_TAG, "Root detected via binary: $path")
                return true
            }
        }

        val buildTags = Build.TAGS
        if (buildTags != null && buildTags.contains("test-keys")) {
            Log.w(LOG_TAG, "Root detected via test-keys: $buildTags")
            return true
        }

        return false
    }

    // ------------------------------------------------------------ 2. FRIDA CHECK
    @ReactMethod
    fun isFridaRunning(): Boolean {
        return try {
            val socket = Socket("127.0.0.1", 27042)
            socket.close()
            Log.w(LOG_TAG, "Frida server detected listening on port 27042!")
            true
        } catch (e: Exception) {
            false
        }
    }

    // ----------------------------------------------------- 3. CLIENT-SIDE TOGGLE
    @ReactMethod
    fun toggleClientRootBypass(enable: Boolean, promise: Promise) {
        reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean("bypass_root_check", enable)
            .apply()

        Log.i(LOG_TAG, "V-R02: Toggled bypass_root_check to: $enable")
        promise.resolve(enable)
    }

    // ------------------------------------------------- 4. COMPREHENSIVE REPORT
    @ReactMethod
    fun getRuntimeSecurityReport(promise: Promise) {
        val rooted = isDeviceRooted()
        val frida = isFridaRunning()
        val isEmulator = Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.startsWith("unknown") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86")

        val map = Arguments.createMap().apply {
            putBoolean("isRooted", rooted)
            putBoolean("isFridaDetected", frida)
            putBoolean("isEmulator", isEmulator)
            putString("buildFingerprint", Build.FINGERPRINT)
            putString("osVersion", "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
            putBoolean("isBypassFlagActive", reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean("bypass_root_check", false))
        }
        promise.resolve(map)
    }

    // ------------------------------------------- 5. REAL QUICK-PIN BRUTE FORCE
    /**
     * V-W10: genuinely brute-forces the stored unsalted MD5 Quick-PIN hash by
     * iterating the entire 0000–9999 keyspace and comparing MD5 digests. This is
     * NOT a simulation — it reads the real hash from quick_pin.xml and recovers
     * the PIN, demonstrating why reversible/unsalted PIN storage plus no
     * rate-limiting is catastrophic (CWE-312 + CWE-307).
     */
    @ReactMethod
    fun bruteForcePin(promise: Promise) {
        Thread {
            val prefs = reactContext.getSharedPreferences("quick_pin", Context.MODE_PRIVATE)
            val target = (prefs.getString("pin_hash", "81dc9bdb52d04dc20036dbd8313ed055") ?: "")
                .trim().lowercase()
            val start = System.currentTimeMillis()
            var found: String? = null
            var attempts = 0
            for (i in 0..9999) {
                attempts++
                val candidate = String.format("%04d", i)
                if (md5Hex(candidate) == target) {
                    found = candidate
                    break
                }
            }
            val elapsed = System.currentTimeMillis() - start
            Log.w(
                LOG_TAG,
                "V-W10 brute-force complete: cracked=${found ?: "NONE"} attempts=$attempts time=${elapsed}ms"
            )
            promise.resolve(Arguments.createMap().apply {
                putString("targetHash", target)
                putString("crackedPin", found ?: "NOT_FOUND")
                putInt("attempts", attempts)
                putDouble("elapsedMs", elapsed.toDouble())
                putBoolean("success", found != null)
            })
        }.start()
    }

    private fun md5Hex(input: String): String {
        val digest = java.security.MessageDigest.getInstance("MD5").digest(input.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
