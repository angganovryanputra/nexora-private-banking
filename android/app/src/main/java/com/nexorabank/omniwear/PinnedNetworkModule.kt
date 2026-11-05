package com.nexorabank.omniwear

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.URI
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLPeerUnverifiedException

/**
 * V-08 / Scenario 1 — REAL "bank-grade" SSL certificate pinning.
 *
 * This is a genuine OkHttp [CertificatePinner] on a real HTTPS request, NOT a
 * UI simulation. The pin is deliberately bogus, so a normal run fails the pin
 * check and the connection is blocked (ENFORCED). When an attacker neutralizes
 * `okhttp3.CertificatePinner.check()` at runtime (the Frida hook documented in
 * the pentest guide), the very same request succeeds (BYPASSED) and traffic
 * becomes interceptable in Burp — demonstrating "security theater" pinning with
 * no app-integrity attestation.
 *
 * Frida PoC (from the guide):
 *   Java.use("okhttp3.CertificatePinner").check
 *       .overload('java.lang.String','java.util.List')
 *       .implementation = function(h, p) { return; };
 */
class PinnedNetworkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "PinnedNetwork"
        const val LOG_TAG = "NEXORA_SSL_PINNING"
        // Intentionally wrong SHA-256 pin: a legitimate chain can never match it,
        // so only a bypassed check lets the request through.
        const val BOGUS_PIN = "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
        const val DEFAULT_URL = "https://www.google.com/generate_204"
    }

    override fun getName() = NAME

    @ReactMethod
    fun testPinnedRequest(targetUrl: String?, promise: Promise) {
        val url = if (targetUrl.isNullOrBlank()) DEFAULT_URL else targetUrl
        Thread {
            try {
                val host = try { URI(url).host } catch (_: Exception) { null } ?: "www.google.com"
                val pinner = CertificatePinner.Builder().add(host, BOGUS_PIN).build()
                val client = OkHttpClient.Builder()
                    .certificatePinner(pinner)
                    .callTimeout(10, TimeUnit.SECONDS)
                    .build()
                val req = Request.Builder().url(url).get().build()

                client.newCall(req).execute().use { resp ->
                    // We only get here if CertificatePinner.check() did NOT throw —
                    // i.e. pinning was bypassed/neutralized.
                    Log.w(LOG_TAG, "⚠️ [V-08] Pinned request SUCCEEDED → pinning bypassed (HTTP ${resp.code})")
                    promise.resolve(Arguments.createMap().apply {
                        putString("status", "BYPASSED")
                        putInt("httpCode", resp.code)
                        putString("host", host)
                        putString(
                            "message",
                            "CertificatePinner.check() was neutralized — HTTPS to $host succeeded and is now interceptable."
                        )
                    })
                }
            } catch (e: SSLPeerUnverifiedException) {
                Log.d(LOG_TAG, "Pinning ENFORCED: ${e.message}")
                promise.resolve(Arguments.createMap().apply {
                    putString("status", "ENFORCED")
                    putString(
                        "message",
                        "Certificate pin mismatch — connection blocked by CertificatePinner (pinning active)."
                    )
                    putString("error", e.message ?: "SSLPeerUnverifiedException")
                })
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Pinned request error: ${e.message}")
                promise.resolve(Arguments.createMap().apply {
                    putString("status", "ERROR")
                    putString(
                        "message",
                        "Request could not complete (offline / DNS / timeout): ${e.message}"
                    )
                })
            }
        }.start()
    }
}
