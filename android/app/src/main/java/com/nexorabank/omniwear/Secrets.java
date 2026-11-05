package com.nexorabank.omniwear;

public class Secrets {

    // Hardcoded admin JWT token (valid for pentest testing)
    public static final String HARDCODED_ADMIN_JWT =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNfYWRtaW4iOnRydWUsImlhdCI6MTc0NDk3NjIyM30.yXm-7iN-6sn3kvvXkOiOLVRHXSn6MBSpwbM2VcXVds8";

    // Debug API endpoint embedded in binary (CWE-200)
    public static final String DEBUG_ENDPOINT = "http://10.0.2.2:5000/debug/users";

    // Legacy backup API key
    public static final String OLD_API_KEY = "sk_live_nexora_vault_master_test1234567890";
}

