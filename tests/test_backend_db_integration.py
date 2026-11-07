import os
import re
import json
import sqlite3
import unittest
import urllib.request

BASE_URL = "http://127.0.0.1:5000"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "nexora_vault.db"))
PBXPROJ_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "VulnerableBankApp.xcodeproj", "project.pbxproj"))
IOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "VulnerableBankApp"))
WATCHOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "NexoraWatch"))

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        return json.loads(res.read().decode("utf-8")), res.status

def get_json(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req, timeout=5) as res:
        return json.loads(res.read().decode("utf-8")), res.status

class TestBackendDbIntegration(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.cur = self.conn.cursor()

    def tearDown(self):
        self.conn.close()

    def test_check_balance_and_db(self):
        """Verify check_balance endpoint matches live SQLite balance for Alexander Vance."""
        data, status = get_json("/check_balance/NX-8492014")
        self.assertEqual(status, 200)
        self.assertEqual(data.get("accountNumber"), "NX-8492014")
        self.assertEqual(data.get("currency"), "IDR")

        db_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        self.assertAlmostEqual(data.get("balance"), db_bal, places=2)

    def test_qris_checkout_mutates_db(self):
        """SNAP QRIS checkout must deduct user balance and insert an audit row in transactions."""
        initial_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        payload = {
            "account_number": "NX-8492014",
            "amount": 75000.0,
            "merchant_name": "TEST MERCH INTEGRATION",
            "qr_payload": "00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2",
            "currency": "IDR"
        }
        res, status = post_json("/api/qris/checkout", payload)
        self.assertEqual(status, 200)

        new_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        self.assertAlmostEqual(new_bal, initial_bal - 75000.0, places=2)

        tx = self.cur.execute(
            "SELECT amount, description FROM transactions WHERE from_account='NX-8492014' AND description LIKE '%TEST MERCH INTEGRATION%' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        self.assertIsNotNone(tx, "Transaction record not found in SQLite transactions table")
        self.assertAlmostEqual(tx[0], 75000.0, places=2)

    def test_atm_cardless_cash_lifecycle(self):
        """Generate ATM OTP, verify in DB, then verify/dispense and check DB transaction."""
        gen_payload = {
            "account_number": "NX-8492014",
            "amount": 100000.0,
            "device_id": "watch_apple_01"
        }
        gen_res, gen_status = post_json("/api/atm/cardless-cash/generate", gen_payload)
        self.assertEqual(gen_status, 200)
        token = gen_res.get("token")
        self.assertIsNotNone(token)

        # Check DB row
        db_token = self.cur.execute("SELECT status, amount FROM cardless_cash_tokens WHERE token=?", (token,)).fetchone()
        self.assertIsNotNone(db_token)
        self.assertIn(db_token[0], ["ACTIVE", "PENDING"])

        # Verify / Dispense
        verify_payload = {"token": token, "atm_id": "ATM-JKT-INTEGRATION-01"}
        ver_res, ver_status = post_json("/api/atm/cardless-cash/verify", verify_payload)
        self.assertEqual(ver_status, 200)

        # Check DB updated to DISPENSED
        updated_status = self.cur.execute("SELECT status FROM cardless_cash_tokens WHERE token=?", (token,)).fetchone()[0]
        self.assertEqual(updated_status, "DISPENSED")

    def test_card_freeze_mutates_db(self):
        """Card freeze toggle must update virtual_cards.is_frozen in SQLite."""
        # Freeze card 1
        post_json("/api/wearable/card-freeze", {"card_id": 1, "frozen": True, "device_id": "watch_apple_01"})
        f1 = self.cur.execute("SELECT is_frozen FROM virtual_cards WHERE id=1").fetchone()[0]
        self.assertEqual(f1, 1)

        # Unfreeze card 1
        post_json("/api/wearable/card-freeze", {"card_id": 1, "frozen": False, "device_id": "watch_apple_01"})
        f0 = self.cur.execute("SELECT is_frozen FROM virtual_cards WHERE id=1").fetchone()[0]
        self.assertEqual(f0, 0)

    def test_2fa_wire_transfer_mutates_db(self):
        """Authorize 2FA must debit balance and record wire transfer in transactions."""
        initial_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        payload = {
            "tx_id": "TX-WIRE-INTEGRATION-01",
            "amount": 50000000.0,
            "resolution": "APPROVED",
            "device_id": "watch_apple_01"
        }
        res, status = post_json("/api/wearable/authorize_2fa", payload)
        self.assertEqual(status, 200)

        new_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        self.assertAlmostEqual(new_bal, initial_bal - 50000000.0, places=2)

        tx = self.cur.execute(
            "SELECT amount, description FROM transactions WHERE description LIKE '%TX-WIRE-INTEGRATION-01%' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        self.assertIsNotNone(tx)

    def test_quick_pay_mutates_db(self):
        """Quick pay transfer must record transfer in transactions table."""
        initial_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        payload = {
            "sender_account": "NX-8492014",
            "recipient_account": "NX-7391048",
            "amount": 50000.0,
            "note": "Watch Quick Pay Integration"
        }
        res, status = post_json("/transfer", payload)
        self.assertEqual(status, 200)

        new_bal = self.cur.execute("SELECT balance FROM users WHERE account_number='NX-8492014'").fetchone()[0]
        self.assertAlmostEqual(new_bal, initial_bal - 50000.0, places=2)

    def test_watch_quick_pay(self):
        """WatchNetworkManager and WatchSessionManager must support quickPay."""
        with open(os.path.join(WATCHOS_DIR, "WatchNetworkManager.swift"), "r", encoding="utf-8") as f:
            net_code = f.read()
        self.assertIn("quickPay", net_code, "WatchNetworkManager missing quickPay method")

        with open(os.path.join(WATCHOS_DIR, "WatchSessionManager.swift"), "r", encoding="utf-8") as f:
            sess_code = f.read()
        self.assertIn('case "QUICK_PAY":', sess_code, "WatchSessionManager missing QUICK_PAY case")

    def test_bundle_identifier_alignment(self):
        """iOS project.pbxproj must set PRODUCT_BUNDLE_IDENTIFIER to com.nexorabank.omniwear."""
        with open(PBXPROJ_PATH, "r", encoding="utf-8") as f:
            pbx = f.read()
        self.assertNotIn("org.reactjs.native.example", pbx, "Legacy default bundle ID still in project.pbxproj")
        self.assertIn("PRODUCT_BUNDLE_IDENTIFIER = com.nexorabank.omniwear;", pbx)

    def test_ios_native_modules(self):
        """iOS project must implement SecurityCheck, HeartRate, PinnedNetwork, and BluetoothSync."""
        for mod in ["SecurityCheck", "HeartRate", "PinnedNetwork", "BluetoothSync"]:
            swift_path = os.path.join(IOS_DIR, f"{mod}.swift")
            m_path = os.path.join(IOS_DIR, f"{mod}.m")
            self.assertTrue(os.path.exists(swift_path), f"Missing {mod}.swift in {IOS_DIR}")
            self.assertTrue(os.path.exists(m_path), f"Missing {mod}.m in {IOS_DIR}")

if __name__ == "__main__":
    unittest.main()
