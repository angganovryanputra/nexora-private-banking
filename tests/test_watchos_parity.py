import os
import re
import unittest
import urllib.request
import json

WATCHOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "NexoraWatch"))
IOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "VulnerableBankApp"))
DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

REQUIRED_SWIFT_FILES = [
    "NexoraWatchApp.swift",
    "ContentView.swift",
    "BalanceView.swift",
    "InsecureStorage.swift",
    "WatchTheme.swift",
    "WatchNetworkManager.swift",
    "WatchSessionManager.swift",
    "CardlessCashView.swift",
    "CardFreezeView.swift",
    "QRISPaymentView.swift",
    "QuickPinPadView.swift",
    "TwoFactorApprovalView.swift",
    "SecurityCheckModule.swift",
    "WatchPentestLabView.swift",
    "WristLockoutView.swift",
    "WristSensorManager.swift",
]

class TestWatchOSParity(unittest.TestCase):
    def test_watch_theme_haptic_support(self):
        """WatchTheme must declare haptic playback helper with WKInterfaceDevice for native Apple Watch feedback."""
        filepath = os.path.join(WATCHOS_DIR, "WatchTheme.swift")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("playHaptic", content, "WatchTheme missing playHaptic helper")
        self.assertIn("WKInterfaceDevice", content, "WatchTheme missing WatchKit haptic integration")
        self.assertIn("HapticType", content, "WatchTheme missing HapticType definition")
        self.assertIn("device.play", content, "WatchTheme missing device.play haptic trigger")

        # Verify authentication and sensory views integrate haptic feedback
        pin_path = os.path.join(WATCHOS_DIR, "QuickPinPadView.swift")
        with open(pin_path, "r", encoding="utf-8") as f:
            pin_content = f.read()
        self.assertIn("playHaptic", pin_content, "QuickPinPadView missing playHaptic integration")

        twofa_path = os.path.join(WATCHOS_DIR, "TwoFactorApprovalView.swift")
        with open(twofa_path, "r", encoding="utf-8") as f:
            twofa_content = f.read()
        self.assertIn("playHaptic", twofa_content, "TwoFactorApprovalView missing playHaptic integration")

        wrist_path = os.path.join(WATCHOS_DIR, "WristLockoutView.swift")
        with open(wrist_path, "r", encoding="utf-8") as f:
            wrist_content = f.read()
        self.assertIn("playHaptic", wrist_content, "WristLockoutView missing playHaptic integration")

    def test_transaction_views_haptic_and_workflow_polish(self):
        """Core transaction views must utilize native haptics and contain polished enterprise indicators."""
        for view_name in ["BalanceView.swift", "QRISPaymentView.swift", "CardlessCashView.swift", "CardFreezeView.swift"]:
            fpath = os.path.join(WATCHOS_DIR, view_name)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("playHaptic", content, f"{view_name} missing playHaptic integration")
        
        # BalanceView specifics: WIB timestamp and masked account
        with open(os.path.join(WATCHOS_DIR, "BalanceView.swift"), "r", encoding="utf-8") as f:
            balance_content = f.read()
        self.assertIn("WIB", balance_content, "BalanceView missing WIB timestamp indicator")
        self.assertIn("••••", balance_content, "BalanceView missing account number masking")

        # QRISPaymentView specifics: NMID
        with open(os.path.join(WATCHOS_DIR, "QRISPaymentView.swift"), "r", encoding="utf-8") as f:
            qris_content = f.read()
        self.assertIn("ID1020021189360", qris_content, "QRISPaymentView missing NMID")

        # CardFreezeView specifics: EMV chip icon or brand badge
        with open(os.path.join(WATCHOS_DIR, "CardFreezeView.swift"), "r", encoding="utf-8") as f:
            freeze_content = f.read()
        self.assertTrue("chip" in freeze_content.lower() or "creditcard" in freeze_content, "CardFreezeView missing chip/card design")

    def test_required_files_exist(self):
        """All 16 core watchOS Swift files and configuration assets must exist."""
        for filename in REQUIRED_SWIFT_FILES:
            filepath = os.path.join(WATCHOS_DIR, filename)
            self.assertTrue(os.path.exists(filepath), f"Missing required file: {filename}")
        
        # Also verify Info.plist and Assets
        info_plist = os.path.join(WATCHOS_DIR, "Info.plist")
        self.assertTrue(os.path.exists(info_plist), "Missing Info.plist in NexoraWatch")
        
        assets_dir = os.path.join(WATCHOS_DIR, "Assets.xcassets")
        self.assertTrue(os.path.exists(assets_dir), "Missing Assets.xcassets in NexoraWatch")

    def test_insecure_storage(self):
        """InsecureStorage must use IDR defaults and enterprise customer Alexander Vance."""
        filepath = os.path.join(WATCHOS_DIR, "InsecureStorage.swift")
        self.assertTrue(os.path.exists(filepath), "InsecureStorage.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertNotIn("ADMIN001", content, "Legacy ADMIN001 found in InsecureStorage")
        self.assertNotIn("999999.0", content, "Legacy 999999.0 found in InsecureStorage")
        self.assertIn("NX-8492014", content, "NX-8492014 account number not found in InsecureStorage")
        self.assertIn("Alexander Vance", content, "Alexander Vance customer name not found in InsecureStorage")
        self.assertIn("888888000.0", content, "IDR 888.888.000 initial balance not found")
        self.assertIn("getBackendUrl", content, "getBackendUrl method missing")
        self.assertIn("setBackendUrl", content, "setBackendUrl method missing")
        self.assertIn("isCardFrozen", content, "isCardFrozen method missing")
        self.assertIn("setCardFrozen", content, "setCardFrozen method missing")
        self.assertIn("cardId: Int = 1", content, "Per-card freeze key support missing")

    def test_currency_and_accounts_no_dangling_dollars(self):
        """Ensure watchOS views, iOS views, and markdown guides use Indonesian Rupiah (Rp / IDR) and 0 dangling USD signs."""
        # 1. Check all watchOS Swift files
        watch_swift_files = [f for f in os.listdir(WATCHOS_DIR) if f.endswith(".swift")]
        for fname in watch_swift_files:
            fpath = os.path.join(WATCHOS_DIR, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            # Match currency dollar like "$50k", "$75", "$\(" or "$999" (excluding Swift closure params $0, $1)
            dollar_matches = re.findall(r'\$(?:\(|[1-9][0-9]*)', content)
            self.assertEqual(len(dollar_matches), 0, f"Found dangling dollar signs in {fname}: {dollar_matches}")

        # 2. Check all iOS Swift files
        ios_swift_files = [f for f in os.listdir(IOS_DIR) if f.endswith(".swift")]
        for fname in ios_swift_files:
            fpath = os.path.join(IOS_DIR, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            dollar_matches = re.findall(r'\$(?:\(|[1-9][0-9]*)', content)
            self.assertEqual(len(dollar_matches), 0, f"Found dangling dollar signs in {fname}: {dollar_matches}")

        # 3. Check core documentation and markdown guides
        markdown_files = [
            os.path.join(DOCS_DIR, "APPLE_WATCHOS_GUIDE.md"),
            os.path.join(PROJECT_ROOT, "BUILD-IOS-WATCHOS.md"),
            os.path.join(PROJECT_ROOT, "TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md"),
        ]
        for md_path in markdown_files:
            if os.path.exists(md_path):
                with open(md_path, "r", encoding="utf-8") as f:
                    md_content = f.read()
                # Matches numeric dollar amounts like "$50,000", "$75", "$13,370,000"
                dangling = re.findall(r'\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)', md_content)
                self.assertEqual(dangling, [], f"Found lingering USD dollar amounts in {os.path.basename(md_path)}: {dangling}")

    def test_network_manager(self):
        """WatchNetworkManager must provide direct HTTP methods matching backend API."""
        filepath = os.path.join(WATCHOS_DIR, "WatchNetworkManager.swift")
        self.assertTrue(os.path.exists(filepath), "WatchNetworkManager.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        for method in [
            "checkBalance",
            "checkoutQRIS",
            "generateCardlessOtp",
            "verifyCardlessOtp",
            "toggleCardFreeze",
            "authorize2FA",
            "pingBackend",
            "quickPay",
            "fetchTransactions",
            "fetchCards",
        ]:
            self.assertIn(method, content, f"Missing method {method} in WatchNetworkManager.swift")

    def test_cardless_cash_view(self):
        """CardlessCashView must support OTP generation, 15m timer, and double-dispense demo."""
        filepath = os.path.join(WATCHOS_DIR, "CardlessCashView.swift")
        self.assertTrue(os.path.exists(filepath), "CardlessCashView.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("CardlessCashView", content)
        self.assertIn("generateCardlessOtp", content)
        self.assertIn("verifyCardlessOtp", content)
        self.assertIn("Rp 100.000", content)

    def test_card_freeze_view(self):
        """CardFreezeView must provide wrist card kill-switch for virtual cards."""
        filepath = os.path.join(WATCHOS_DIR, "CardFreezeView.swift")
        self.assertTrue(os.path.exists(filepath), "CardFreezeView.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("CardFreezeView", content)
        self.assertIn("NX-VIRT-4401", content)
        self.assertIn("NX-VIRT-9812", content)
        self.assertIn("toggleCardFreeze", content)
        self.assertIn("cardId: selectedCardIndex + 1", content)

    def test_security_check_module(self):
        """SecurityCheckModule must inspect iOS jailbreak indicators and support bypass."""
        filepath = os.path.join(WATCHOS_DIR, "SecurityCheckModule.swift")
        self.assertTrue(os.path.exists(filepath), "SecurityCheckModule.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("SecurityCheckModule", content)
        self.assertIn("isDeviceJailbroken", content)
        self.assertIn("isFridaDetected", content)
        self.assertIn("toggleBypass", content)

    def test_qris_view(self):
        """QRISPaymentView must use IDR and simulate checkout."""
        filepath = os.path.join(WATCHOS_DIR, "QRISPaymentView.swift")
        self.assertTrue(os.path.exists(filepath), "QRISPaymentView.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("Rp 75.000", content)
        self.assertIn("V-AP06 EXPLOIT", content)
        self.assertNotIn("$75", content)

    def test_two_factor_view(self):
        """TwoFactorApprovalView must use Rp 50.000.000 and Evelyn Sterling."""
        filepath = os.path.join(WATCHOS_DIR, "TwoFactorApprovalView.swift")
        self.assertTrue(os.path.exists(filepath), "TwoFactorApprovalView.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("Rp 50.000.000", content)
        self.assertIn("Evelyn Sterling", content)
        self.assertIn("V-AP04", content)
        self.assertNotIn("$50,000", content)

    def test_dashboard_and_router(self):
        """ContentView must route across all core views."""
        filepath = os.path.join(WATCHOS_DIR, "ContentView.swift")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("cardless", content)
        self.assertIn("cards", content)
        self.assertIn("qris", content)
        self.assertIn("lab", content)

    def test_pentest_lab(self):
        """WatchPentestLabView must cover 5 pillars with interactive exploit triggers."""
        filepath = os.path.join(WATCHOS_DIR, "WatchPentestLabView.swift")
        self.assertTrue(os.path.exists(filepath), "WatchPentestLabView.swift missing")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("WatchPentestLabView", content)
        self.assertIn("V-AP01", content)
        self.assertIn("V-AP02", content)
        self.assertIn("V-AP03", content)
        self.assertIn("V-W09", content)
        self.assertIn("V-L04", content)
        self.assertIn("V-W11", content)
        self.assertIn("V-07", content)

    def test_swift_syntax_and_braces(self):
        """Verify balanced curly braces, parentheses, and square brackets across all Swift files."""
        swift_files = [f for f in os.listdir(WATCHOS_DIR) if f.endswith(".swift")]
        self.assertGreaterEqual(len(swift_files), 16, f"Expected at least 16 Swift files in {WATCHOS_DIR}, found {len(swift_files)}")
        for fname in swift_files:
            fpath = os.path.join(WATCHOS_DIR, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertGreater(len(content.strip()), 50, f"File {fname} appears empty or truncated")

            open_curly = content.count('{')
            close_curly = content.count('}')
            self.assertEqual(open_curly, close_curly, f"Unbalanced curly braces in {fname}: {open_curly} vs {close_curly}")

            open_paren = content.count('(')
            close_paren = content.count(')')
            self.assertEqual(open_paren, close_paren, f"Unbalanced parentheses in {fname}: {open_paren} vs {close_paren}")

            open_bracket = content.count('[')
            close_bracket = content.count(']')
            self.assertEqual(open_bracket, close_bracket, f"Unbalanced square brackets in {fname}: {open_bracket} vs {close_bracket}")

    def test_backend_contract_endpoints(self):
        """Backend must successfully respond to endpoints invoked by watchOS."""
        try:
            req = urllib.request.Request("http://127.0.0.1:5000/check_balance/NX-8492014")
            with urllib.request.urlopen(req, timeout=3) as res:
                self.assertEqual(res.status, 200)
                data = json.loads(res.read())
                self.assertEqual(data.get("accountNumber"), "NX-8492014")
                self.assertEqual(data.get("currency"), "IDR")
        except Exception as e:
            self.fail(f"Backend test failed: {e}")

    def test_apple_watchos_guide_full_writeup_coverage(self):
        """docs/APPLE_WATCHOS_GUIDE.md must provide complete writeups with PoC for all 11 scenarios."""
        guide_path = os.path.abspath(os.path.join(DOCS_DIR, "APPLE_WATCHOS_GUIDE.md"))
        with open(guide_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios", content)
        
        # Verify all 11 scenarios are explicitly documented
        scenarios = [
            ("Scenario 1", "V-AP02"),
            ("Scenario 2", "V-AP01"),
            ("Scenario 3", "V-AP03"),
            ("Scenario 4", "V-AP04"),
            ("Scenario 5", "V-AP05"),
            ("Scenario 6", "V-AP06"),
            ("Scenario 7", "V-B01"),
            ("Scenario 8", "V-L04"),
            ("Scenario 9", "V-W09"),
            ("Scenario 10", "V-07"),
            ("Scenario 11", "POJK 11"),
        ]
        for sc_name, vuln_id in scenarios:
            self.assertIn(sc_name, content, f"{sc_name} missing from guide")
            self.assertIn(vuln_id, content, f"{vuln_id} missing from guide under {sc_name}")

        # Verify scenarios have full PoC commands, regulatory citations, and remediation
        self.assertIn("curl -X POST", content, "Missing curl PoC in guide")
        self.assertIn("POJK 11/POJK.03/2022", content, "Missing POJK 11 regulatory references")
        self.assertIn("PCI-DSS v4.0", content, "Missing PCI-DSS references")
        self.assertIn("Enterprise Remediation", content, "Missing Enterprise Remediation section in guide")

    def test_xcode_setup_tutorial_completeness(self):
        """docs/APPLE_WATCHOS_GUIDE.md and BUILD-IOS-WATCHOS.md must contain comprehensive Xcode and DB setup instructions."""
        guide_path = os.path.abspath(os.path.join(DOCS_DIR, "APPLE_WATCHOS_GUIDE.md"))
        with open(guide_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("add_watch_target.rb", content, "add_watch_target.rb missing from tutorial")
        self.assertIn("nexora_vault.db", content, "nexora_vault.db inspection missing from tutorial")
        self.assertIn("com.nexorabank.omniwear.watchkitapp", content, "Watch bundle identifier missing from tutorial")
        self.assertIn("NSAllowsArbitraryLoads", content, "App Transport Security explanation missing")
        self.assertIn("Pair Apple Watch", content, "Paired simulator instructions missing")

        build_path = os.path.abspath(os.path.join(PROJECT_ROOT, "BUILD-IOS-WATCHOS.md"))
        with open(build_path, "r", encoding="utf-8") as f:
            build_content = f.read()

        self.assertIn("add_watch_target.rb", build_content, "add_watch_target.rb missing from BUILD-IOS-WATCHOS.md")
        self.assertIn("nexora_vault.db", build_content, "nexora_vault.db missing from BUILD-IOS-WATCHOS.md")
        self.assertIn("com.nexorabank.omniwear.watchkitapp", build_content, "Watch bundle identifier missing from BUILD-IOS-WATCHOS.md")
        self.assertIn("NSAllowsArbitraryLoads", build_content, "NSAllowsArbitraryLoads missing from BUILD-IOS-WATCHOS.md")

    def test_qris_offline_fallback_and_deep_link(self):
        """QRISPaymentView must not optimistically deduct balance on failure, and Info.plist/ContentView must support nexorabank URL scheme."""
        qris_path = os.path.join(WATCHOS_DIR, "QRISPaymentView.swift")
        with open(qris_path, "r", encoding="utf-8") as f:
            qris_content = f.read()
        self.assertNotIn("Offline Paid: Rp 75.000", qris_content, "QRISPaymentView must not optimistically mark payment as paid on offline failure")
        self.assertIn("Transaksi Gagal", qris_content, "QRISPaymentView must display realistic transaction failure message")

        plist_path = os.path.join(WATCHOS_DIR, "Info.plist")
        with open(plist_path, "r", encoding="utf-8") as f:
            plist_content = f.read()
        self.assertIn("nexorabank", plist_content, "Info.plist missing nexorabank custom URL scheme")

        app_path = os.path.join(WATCHOS_DIR, "ContentView.swift")
        with open(app_path, "r", encoding="utf-8") as f:
            app_content = f.read()
        self.assertIn("onOpenURL", app_content, "ContentView missing onOpenURL deep link handler")

    def test_add_watch_target_ruby_automation(self):
        """ios/add_watch_target.rb must automate target creation and bundle identifier alignment."""
        rb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ios", "add_watch_target.rb"))
        self.assertTrue(os.path.exists(rb_path), "ios/add_watch_target.rb does not exist")
        with open(rb_path, "r", encoding="utf-8") as f:
            rb_content = f.read()

        self.assertIn("com.nexorabank.omniwear", rb_content)
        self.assertIn("com.nexorabank.omniwear.watchkitapp", rb_content)
        self.assertIn("Xcodeproj::Project", rb_content)
        self.assertIn("add_file_references", rb_content)

if __name__ == "__main__":
    unittest.main()
