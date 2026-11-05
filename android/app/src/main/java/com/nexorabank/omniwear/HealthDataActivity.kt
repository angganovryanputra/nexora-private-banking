package com.nexorabank.omniwear

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.util.Log
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray

/**
 * V-W02: Exported activity with NO authentication.
 *
 * Any app installed on the watch — or anyone with adb access — can launch
 * this screen and read the victim's stored banking credentials and full
 * heart-rate history, because the data lives in plaintext SharedPreferences.
 *
 * Demo (no unlock, no login required):
 *   adb shell am start -n com.nexorabank.omniwear/.HealthDataActivity
 */
class HealthDataActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences("NexoraVaultPrefs", MODE_PRIVATE)
        val sb = StringBuilder()
        sb.append("Nexora Vault Telemetry\n")
        sb.append("(exported component, unauthenticated)\n")
        sb.append("==========================\n\n")
        sb.append("username    : ").append(prefs.getString("username", "admin")).append('\n')
        sb.append("password    : ").append(prefs.getString("password", "admin123")).append('\n')
        sb.append("balance     : ").append(prefs.getString("balance", "Rp 99.999.000")).append('\n')
        sb.append("debug_flag  : ").append(prefs.getString("debug_flag", "FLAG{NexoraVault_HardcodedSecrets_CWE312}")).append('\n')
        sb.append("\nheart-rate telemetry (plaintext):\n")

        val hist = JSONArray(prefs.getString("heart_rate_history", "[]"))
        for (i in 0 until hist.length()) {
            sb.append("  ").append(hist.getJSONObject(i).toString()).append('\n')
        }
        if (hist.length() == 0) {
            sb.append("  (no readings recorded yet)\n")
        }

        // Mirror to logcat
        Log.d("NEXORA_HEALTH_LEAK", sb.toString())

        val tv = TextView(this).apply {
            text = sb
            setPadding(28, 28, 28, 28)
            setTextColor(Color.WHITE)
            textSize = 11f
            typeface = Typeface.MONOSPACE
        }
        setContentView(
            ScrollView(this).apply {
                setBackgroundColor(0xFF080A0F.toInt()) // Deep Obsidian
                addView(tv)
            },
        )
    }
}

