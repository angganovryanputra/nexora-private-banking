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
}
