package com.nexorabank.omniwear;

import android.content.Context;
import android.content.SharedPreferences;

public class PrefsHelper {

    public static final String PREFS_NAME = "NexoraVaultPrefs";

    public static void storeSecrets(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        // Authentic enterprise session cache (OWASP Mobile M2 / MASVS-STORAGE-1)
        editor.putString("username", "alexander.vance");
        editor.putString("account_number", "NX-8492014");
        editor.putString("full_name", "Alexander Vance");
        editor.putString("client_tier", "Private Wealth Ultra HNW");
        editor.putString("cached_balance_idr", "Rp 999.999.000");
        editor.putString("balance", "Rp 999.999.000");
        editor.putString("masked_primary_card", "4532 8819 •••• 9921");
        editor.putString("user_profile_json", "{\"name\":\"Alexander Vance\",\"account\":\"NX-8492014\",\"tier\":\"Ultra HNW\",\"email\":\"alexander.vance@nexorabank.internal\",\"kyc_status\":\"VERIFIED\",\"branch\":\"SCBD Jakarta Premier Lounge\"}");
        editor.putString("offline_ledger_cache", "[{\"tx\":\"TX-948201\",\"desc\":\"Private Retainer - Evelyn Sterling\",\"amount\":-5000000,\"ts\":1730823400},{\"tx\":\"TX-948199\",\"desc\":\"Yield Portfolio Payout\",\"amount\":12500000,\"ts\":1730792000}]");
        editor.apply();
    }
}

