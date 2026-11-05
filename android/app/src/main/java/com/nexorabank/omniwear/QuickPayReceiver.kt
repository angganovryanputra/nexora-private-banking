package com.nexorabank.omniwear

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
 */
class QuickPayReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_QUICK_PAY = "com.nexorabank.omniwear.ACTION_QUICK_PAY"
        const val LOG_TAG = "NEXORA_QUICK_PAY"
        const val PREFS_NAME = "NexoraVaultPrefs"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null) return
        val act = intent.action
        if (act != ACTION_QUICK_PAY) return

        val recipient = intent.getStringExtra("recipient") ?: "UNKNOWN_RECIPIENT"
        val amount = intent.getFloatExtra("amount", 0.0f)
        val note = intent.getStringExtra("note") ?: "Quick Pay from Watch Companion"

        Log.w(
            LOG_TAG,
            "⚠️ EXPLOIT DETECTED (V-W06): Unauthenticated Quick Pay triggered! To=$recipient Amount=$amount Note=$note"
        )

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        val txJson = JSONArray(prefs.getString("recent_transactions", "[]"))
        val newTx = JSONObject().apply {
            put("type", "QUICK_PAY_INJECTION")
            put("recipient", recipient)
            put("amount", amount.toDouble())
            put("timestamp", System.currentTimeMillis())
            put("status", "SUCCESS_UNAUTHENTICATED")
        }
        txJson.put(newTx)

        val txStr = txJson.toString()
        prefs.edit().putString("recent_transactions", txStr).apply()

        Toast.makeText(
            context,
            "💸 [V-W06 Exploit] Sent $$amount to $recipient without PIN!",
            Toast.LENGTH_LONG
        ).show()
    }
}

