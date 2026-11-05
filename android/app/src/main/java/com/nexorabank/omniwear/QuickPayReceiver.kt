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

        // V-W06: actually move money. The unauthenticated broadcast triggers a
        // real debit on the backend ledger (visible in GET /transactions), not
        // just a local note — matching the documented impact.
        val victim = prefs.getString("account_number", "NX-8492014") ?: "NX-8492014"
        NexoraHttp.postJsonAsync(
            "/transfer",
            JSONObject().apply {
                put("from_account", victim)
                put("to_account", recipient)
                put("amount", amount.toDouble())
                put("description", "Quick Pay Injection via exported receiver (V-W06, no PIN)")
            }.toString()
        )

        Toast.makeText(
            context,
            "💸 [V-W06 Exploit] Sent Rp ${amount.toLong()} to $recipient without PIN!",
            Toast.LENGTH_LONG
        ).show()
    }
}

