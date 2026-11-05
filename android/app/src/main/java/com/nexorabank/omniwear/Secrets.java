package com.nexorabank.omniwear;

public class Secrets {

    // Hardcoded admin JWT token (valid for pentest testing)
    public static final String HARDCODED_ADMIN_JWT =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNfYWRtaW4iOnRydWUsImlhdCI6MTc0NDk3NjIyM30.yXm-7iN-6sn3kvvXkOiOLVRHXSn6MBSpwbM2VcXVds8";

    // Base URL of the local air-gapped core-banking relay. Native exploit
    // components (QuickPayReceiver, AuthBroadcastReceiver, deep-link handler)
    // POST here so the attacks cause a real backend debit. Android emulator
    // reaches the host loopback via 10.0.2.2; change to your PC LAN IP for a
    // physical watch/phone (e.g. "http://192.168.1.100:5000").
    public static final String BASE_URL = "http://10.0.2.2:5000";

    // Debug API endpoint embedded in binary (CWE-200)
    public static final String DEBUG_ENDPOINT = "http://10.0.2.2:5000/debug/users";

    // Legacy backup API key
    public static final String OLD_API_KEY = "sk_live_nexora_vault_master_test1234567890";
}

