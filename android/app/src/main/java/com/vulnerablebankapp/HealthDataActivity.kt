package com.vulnerablebankapp

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.util.Log
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray

/**
 * V-W2: Exported activity with NO authentication.
 *
 * Any app installed on the watch — or anyone with adb access — can launch
 * this screen and read the victim's stored banking credentials and full
 * heart-rate history, because the data lives in plaintext SharedPreferences.
 *
 * Demo (no unlock, no login required):
 *   adb shell am start -n com.vulnerablebankapp.wear/com.vulnerablebankapp.HealthDataActivity
 */
class HealthDataActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences("VulnBankPrefs", MODE_PRIVATE)
        val sb = StringBuilder()
        sb.append("VulnBank Health Data\n")
        sb.append("(exported component, no auth)\n")
        sb.append("==========================\n\n")
        sb.append("username    : ").append(prefs.getString("username", "-")).append('\n')
        sb.append("password    : ").append(prefs.getString("password", "-")).append('\n')
        sb.append("balance     : ").append(prefs.getString("balance", "-")).append('\n')
        sb.append("debug_flag  : ").append(prefs.getString("debug_flag", "-")).append('\n')
        sb.append("\nheart-rate history (plaintext):\n")

        val hist = JSONArray(prefs.getString("heart_rate_history", "[]"))
        for (i in 0 until hist.length()) {
            sb.append("  ").append(hist.getJSONObject(i).toString()).append('\n')
        }
        if (hist.length() == 0) {
            sb.append("  (no readings recorded yet)\n")
        }

        // V-W3 bonus: mirror the whole dump into logcat as well.
        Log.d("HEART_RATE_LEAK", sb.toString())

        val tv = TextView(this).apply {
            text = sb
            setPadding(24, 24, 24, 24)
            setTextColor(Color.WHITE)
            textSize = 11f
            typeface = Typeface.MONOSPACE
        }
        setContentView(
            ScrollView(this).apply {
                setBackgroundColor(0xFF000000.toInt())
                addView(tv)
            },
        )
    }
}
