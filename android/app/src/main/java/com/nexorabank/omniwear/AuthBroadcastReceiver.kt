package com.nexorabank.omniwear

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import org.json.JSONObject

/**
 * V-W09: Insecure 2FA Broadcast Receiver & OTP Exposure.
 *
 * INTENTIONALLY VULNERABLE:
 * 1. An exported broadcast receiver that allows anyone to approve login/2FA sessions remotely
 *    without user biometric/PIN verification.
 * 2. Emits local notifications with VISIBILITY_PUBLIC containing full plaintext 6-digit OTP,
 *    leaking sensitive credentials to Ambient Mode (AOD) / Lockscreen.
 */
class AuthBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_APPROVE_2FA = "com.nexorabank.omniwear.ACTION_APPROVE_2FA"
        const val ACTION_TRIGGER_OTP = "com.nexorabank.omniwear.ACTION_TRIGGER_OTP"
        const val CHANNEL_ID = "nexora_security_alerts"
        const val LOG_TAG = "NEXORA_2FA"
        const val PREFS_NAME = "NexoraVaultPrefs"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null) return

        when (intent.action) {
            ACTION_APPROVE_2FA -> {
                val sessionId = intent.getStringExtra("session_id") ?: "DEFAULT_SESSION"
                Log.w(LOG_TAG, "⚠️ EXPLOIT DETECTED (V-W09): 2FA approval bypassed for session $sessionId!")

                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit().putBoolean("session_approved_${sessionId}", true).apply()

                // V-W09: the exported receiver actually approves the high-value
                // wire on the backend (no watch biometric), so the account is
                // genuinely debited — matching the documented OOB-2FA hijack.
                NexoraHttp.postJsonAsync(
                    "/api/wearable/authorize_2fa",
                    JSONObject().apply {
                        put("tx_id", sessionId)
                        put("amount", 50000000.0)
                        put("account_number", "NX-8492014")
                        put("recipient", "HACKER_SWIFT_CORP")
                    }.toString()
                )

                Toast.makeText(
                    context,
                    "🔓 [V-W09 Exploit] 2FA Approved for $sessionId without watch confirmation!",
                    Toast.LENGTH_LONG
                ).show()
            }

            ACTION_TRIGGER_OTP -> {
                val otp = intent.getStringExtra("otp") ?: "849201"
                Log.d(LOG_TAG, "LEAKED OTP CODE: $otp")
                showInsecureNotification(context, otp)
            }
        }
    }

    private fun showInsecureNotification(context: Context, otp: String) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Nexora Bank Security Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "2FA verification codes"
            }
            notificationManager.createNotificationChannel(channel)
        }

        // INTENTIONALLY VULNERABLE: VISIBILITY_PUBLIC shows complete OTP text on lockscreen/AOD
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Nexora Security Verification")
            .setContentText("Your OTP is: $otp. Never share this code.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(1001, notification)
    }
}

