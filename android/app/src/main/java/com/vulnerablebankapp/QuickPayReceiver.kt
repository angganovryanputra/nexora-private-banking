package com.vulnerablebankapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

/**
 * V-W06: Insecure Wearable Broadcast Receiver (Unauthorized Quick-Transfer Injection).
 *
 * INTENTIONALLY VULNERABLE:
 * This receiver is exported with NO signature or custom permission protection.
 * Any third-party app installed on the watch — or an attacker using adb — can
 * broadcast an intent to silently inject a transfer or manipulate balance.
 *
 * Demo command:
 *   adb shell am broadcast -a com.vulnerablebankapp.ACTION_QUICK_PAY \
 *     --es recipient "HACKER_ACCT_999" \
 *     --ef amount 150000.0 \
 *     -n com.vulnerablebankapp.wear/com.vulnerablebankapp.QuickPayReceiver
 */
class QuickPayReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_QUICK_PAY = "com.vulnerablebankapp.ACTION_QUICK_PAY"
        const val LOG_TAG = "VULN_QUICK_PAY"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null || intent.action != ACTION_QUICK_PAY) return

        val recipient = intent.getStringExtra("recipient") ?: "UNKNOWN_RECIPIENT"
        val amount = intent.getFloatExtra("amount", 0.0f)
        val note = intent.getStringExtra("note") ?: "Quick Pay from Watch Companion"

        Log.w(
            LOG_TAG,
            "⚠️ EXPLOIT DETECTED (V-W06): Unauthenticated Quick Pay triggered! To=$recipient Amount=$amount Note=$note"
        )

        val prefs = context.getSharedPreferences("VulnBankPrefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        // Deduct simulated balance in SharedPreferences
        val rawBal = prefs.getString("balance", "$999999")?.replace("$", "")?.toDoubleOrNull() ?: 999999.0
        val newBal = (rawBal - amount).coerceAtLeast(0.0)
        editor.putString("balance", "$$newBal")

        // Append to local transaction history
        val txJson = JSONArray(prefs.getString("recent_transactions", "[]"))
        val newTx = JSONObject().apply {
            put("type", "QUICK_PAY_INJECTION")
            put("recipient", recipient)
            put("amount", amount.toDouble())
            put("timestamp", System.currentTimeMillis())
            put("status", "SUCCESS_UNAUTHENTICATED")
        }
        txJson.put(newTx)
        editor.putString("recent_transactions", txJson.toString())
        editor.apply()

        Toast.makeText(
            context,
            "💸 [V-W06 Exploit] Sent $$amount to $recipient without PIN!",
            Toast.LENGTH_LONG
        ).show()
    }
}

