package com.nexorabank.omniwear;

import android.content.Context;
import android.content.SharedPreferences;

public class PrefsHelper {

    public static final String PREFS_NAME = "NexoraVaultPrefs";

    public static void storeSecrets(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        editor.putString("username", "admin");
        editor.putString("password", "admin123");
        editor.putString("balance", "Rp 99.999.000");
        editor.putString("debug_flag", "FLAG{NexoraVault_HardcodedSecrets_CWE312}");
        editor.apply();
    }
}

