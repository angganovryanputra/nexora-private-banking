package com.nexorabank.omniwear;

import android.content.Context;
import android.content.SharedPreferences;

public class PrefsHelper {

    public static final String PREFS_NAME = "NexoraVaultPrefs";
    public static final String LEGACY_PREFS_NAME = "VulnBankPrefs";

    public static void storeSecrets(Context context) {
        // Primary modern storage
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        editor.putString("username", "admin");
        editor.putString("password", "admin123");
        editor.putString("balance", "Rp 99.999.000");
        editor.putString("debug_flag", "FLAG{NexoraVault_HardcodedSecrets_CWE312}");
        editor.apply();

        // Legacy compatibility mirror
        SharedPreferences legacyPrefs = context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor legacyEditor = legacyPrefs.edit();
        legacyEditor.putString("username", "admin");
        legacyEditor.putString("password", "admin123");
        legacyEditor.putString("balance", "$999999");
        legacyEditor.putString("debug_flag", "FLAG{NexoraVault_HardcodedSecrets_CWE312}");
        legacyEditor.apply();
    }
}

