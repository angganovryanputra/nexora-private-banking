package com.vulnerablebankapp

import android.app.KeyguardManager
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
        const val LOG_TAG = "VULN_RUNTIME_CHECK"
    }

    override fun getName() = NAME

    // ------------------------------------------------------------- 1. ROOT CHECK
    /**
     * V-R01: Naive root detection.
     * Frida Bypass Target:
     *   Java.perform(function() {
     *     var SecurityCheckModule = Java.use("com.vulnerablebankapp.SecurityCheckModule");
     *     SecurityCheckModule.isDeviceRooted.implementation = function() {
     *       console.log("[*] Frida hooked isDeviceRooted -> returning false");
     *       return false;
     *     };
     *   });
     */
    fun isDeviceRooted(): Boolean {
        // V-R02: Check if client-side bypass flag is enabled
        val prefs = reactContext.getSharedPreferences("VulnBankPrefs", Context.MODE_PRIVATE)
        if (prefs.getBoolean("bypass_root_check", false)) {
            Log.d(LOG_TAG, "Root check bypassed via client SharedPreferences flag!")
            return false
        }

        // Standard naive su binary paths
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

        // Test-keys build check
        val buildTags = Build.TAGS
        if (buildTags != null && buildTags.contains("test-keys")) {
            Log.w(LOG_TAG, "Root detected via test-keys: $buildTags")
            return true
        }

        return false
    }

    // ------------------------------------------------------------ 2. FRIDA CHECK
    /**
     * V-R03: Naive Frida Detection.
     * Checks default Frida port 27042.
     * Easily bypassed by running frida-server on custom port (`frida-server -l 0.0.0.0:1337`)
     * or hooking this method.
     */
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

    // --------------------------------------------------------- 3. EMULATOR CHECK
    fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.PRODUCT.contains("sdk_google"))
    }

    // ---------------------------------------------------- 4. DEVICE LOCK STATUS
    fun isDeviceLockEnabled(): Boolean {
        val keyguardManager = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        return keyguardManager.isDeviceSecure
    }

    // ------------------------------------------------- REACT METHODS
    @ReactMethod
    fun getRuntimeSecurityReport(promise: Promise) {
        val rooted = isDeviceRooted()
        val frida = isFridaRunning()
        val emu = isEmulator()
        val lockEnabled = isDeviceLockEnabled()

        val map = Arguments.createMap().apply {
            putBoolean("isRooted", rooted)
            putBoolean("isFridaDetected", frida)
            putBoolean("isEmulator", emu)
            putBoolean("isDeviceSecure", lockEnabled)
            putString("buildFingerprint", Build.FINGERPRINT)
            putString("suCheckMethod", "Naive file-path & test-keys check (Frida hookable)")
            putString("bypassFlagLocation", "VulnBankPrefs.xml -> bypass_root_check")
        }

        Log.i(LOG_TAG, "Runtime security report generated: Rooted=$rooted Frida=$frida Emu=$emu Lock=$lockEnabled")
        promise.resolve(map)
    }

    @ReactMethod
    fun toggleClientRootBypass(enable: Boolean, promise: Promise) {
        // V-R02: Insecure client-side bypass toggle
        val prefs = reactContext.getSharedPreferences("VulnBankPrefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("bypass_root_check", enable).apply()
        promise.resolve(enable)
    }
}

