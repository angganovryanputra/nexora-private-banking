package com.vulnerablebankapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "VulnerableBankApp"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // V-04: Log the hardcoded JWT to system logcat
    Log.d("Secrets", Secrets.HARDCODED_ADMIN_JWT)

    // V-03: Store plaintext secrets in SharedPreferences
    val prefs = getSharedPreferences("VulnBankPrefs", Context.MODE_PRIVATE)
    val editor = prefs.edit()
    editor.putString("username", "admin")
    editor.putString("password", "admin123")
    editor.putString("balance", "$999999")
    editor.putString("debug_flag", "FLAG{HardcodedSecretsAreBad}")
    editor.apply()

    // V-W10: Quick-PIN stored as weak unsalted MD5 hash ('1234' = 81dc9bdb52d04dc20036dbd8313ed055)
    val pinPrefs = getSharedPreferences("quick_pin", Context.MODE_PRIVATE)
    if (!pinPrefs.contains("pin_hash")) {
      pinPrefs.edit()
        .putString("pin_hash", "81dc9bdb52d04dc20036dbd8313ed055")
        .putString("pin_hint", "4-digit PIN default: 1234")
        .putString("aes_secret_key", "VULN_WEAR_KEY123")
        .apply()
    }

    // V-W07: Deep Link Handling (vulnbank://transfer)
    handleDeepLinkIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    handleDeepLinkIntent(intent)
  }

  private fun handleDeepLinkIntent(intent: Intent?) {
    val data = intent?.data ?: return
    if (data.scheme == "vulnbank" && data.host == "transfer") {
      val to = data.getQueryParameter("to") ?: "UNKNOWN"
      val amount = data.getQueryParameter("amount") ?: "0"
      val auto = data.getQueryParameter("auto") == "true"

      Log.w("VULN_DEEPLINK", "⚠️ EXPLOIT DETECTED (V-W07): Deep link triggered transfer to $to amount $amount (auto=$auto)")
      Toast.makeText(
        this,
        "⚡ [V-W07 Deep Link] Transfer to $to ($$amount) triggered!",
        Toast.LENGTH_LONG
      ).show()
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
