package com.nexorabank.omniwear

import android.util.Log
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Minimal fire-and-forget HTTP helper used by the *native* attack surface
 * (exported broadcast receivers + deep-link handler) so those exploits produce
 * a REAL backend side-effect (an actual debit recorded in the ledger), instead
 * of only writing to local SharedPreferences.
 *
 * Kept dependency-free (HttpURLConnection) and always off the main thread.
 * Points at the local air-gapped Flask relay; override via Secrets.BASE_URL.
 */
object NexoraHttp {
    private const val TAG = "NEXORA_NET"

    fun baseUrl(): String = Secrets.BASE_URL

    /** Fire-and-forget JSON POST. onResult (optional) is invoked on the worker thread. */
    fun postJsonAsync(path: String, jsonBody: String, onResult: ((Int, String) -> Unit)? = null) {
        thread(name = "nexora-http") {
            var conn: HttpURLConnection? = null
            try {
                val url = URL(baseUrl().trimEnd('/') + path)
                conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 7000
                    readTimeout = 7000
                    setRequestProperty("Content-Type", "application/json")
                }
                conn.outputStream.use { it.write(jsonBody.toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.use { it.readText() } ?: ""
                Log.d(TAG, "POST $path -> HTTP $code")
                onResult?.invoke(code, body)
            } catch (e: Exception) {
                Log.e(TAG, "POST $path failed: ${e.message}")
                onResult?.invoke(0, e.message ?: "network error")
            } finally {
                conn?.disconnect()
            }
        }
    }
}
