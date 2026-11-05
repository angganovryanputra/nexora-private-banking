package com.nexorabank.omniwear

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import org.json.JSONObject
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "NexoraBankApp"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // V-04: Log the hardcoded JWT to system logcat
    Log.d("NEXORA_SECRETS", Secrets.HARDCODED_ADMIN_JWT)

    // V-03: Store plaintext authentic enterprise secrets in SharedPreferences
    PrefsHelper.storeSecrets(this)

    // V-W10: Quick-PIN stored as weak unsalted MD5 hash ('1234' = 81dc9bdb52d04dc20036dbd8313ed055)
    val pinPrefs = getSharedPreferences("quick_pin", Context.MODE_PRIVATE)
    if (!pinPrefs.contains("pin_hash")) {
      pinPrefs.edit()
        .putString("pin_hash", "81dc9bdb52d04dc20036dbd8313ed055")
        .putString("pin_hint", "4-digit PIN default: 1234")
        .putString("aes_secret_key", "NEXORA_VAULT_KEY123")
        .apply()
    }

    // V-W07: Deep Link Handling (nexorabank://transfer)
    handleDeepLinkIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    handleDeepLinkIntent(intent)
  }

  private fun handleDeepLinkIntent(intent: Intent?) {
    val data = intent?.data ?: return
    if (data.scheme == "nexorabank" && data.host == "transfer") {
      val to = data.getQueryParameter("to") ?: "UNKNOWN"
      val amount = data.getQueryParameter("amount") ?: "0"
      val auto = data.getQueryParameter("auto") == "true"

      Log.w("NEXORA_DEEPLINK", "⚠️ EXPLOIT DETECTED (V-W07): Deep link triggered transfer to $to amount $amount (auto=$auto)")

      // V-W07: the unvalidated deep link actually executes the wire on the
      // backend (no session / signature check on the calling app), so an
      // attacker's `am start` genuinely debits the victim — not just a Toast.
      val victim = getSharedPreferences("NexoraVaultPrefs", Context.MODE_PRIVATE)
        .getString("account_number", "NX-8492014") ?: "NX-8492014"
      NexoraHttp.postJsonAsync(
        "/transfer",
        JSONObject().apply {
          put("from_account", victim)
          put("to_account", to)
          put("amount", amount.toDoubleOrNull() ?: 0.0)
          put("description", "Deep Link CSRF transfer (V-W07, unvalidated nexorabank://transfer)")
        }.toString()
      )

      Toast.makeText(
        this,
        "⚡ [V-W07 Deep Link] Wire transfer of Rp $amount to $to triggered!",
        Toast.LENGTH_LONG
      ).show()
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}

