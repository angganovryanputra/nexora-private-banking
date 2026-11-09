# iOS & watchOS Banking Simulation Parity, Pentest Guide Overhaul, and Xcode Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the iOS & watchOS application suite into an authentic tier-1 private digital banking experience on Apple Watch with native haptics and lifelike micro-interactions, expand `docs/APPLE_WATCHOS_GUIDE.md` with complete step-by-step reproduction writeups for all 11 pentest scenarios, eliminate lingering USD currency references, and provide an exhaustive Xcode setup tutorial for end-to-end backend and SQLite DB connectivity.

**Architecture:** The Apple Watch client is built with native SwiftUI using continuous dynamic scaling across all 40/41/44/45/49mm form factors. It pairs dual-mode networking (`WatchNetworkManager` via direct HTTP URLSession and `WatchSessionManager` via `WCSession`) with native Apple Watch haptic feedback (`WKInterfaceDevice.current().play`). Core banking transactions mutate the shared SQLite database (`backend/nexora_vault.db`) via the Flask server (`0.0.0.0:5000`), maintaining 1:1 ledger parity with the React Native companion and Wear OS applications.

**Tech Stack:** watchOS 9+ (SwiftUI, WatchKit, WatchConnectivity), iOS 15+ (React Native 0.79.1, Swift/ObjC Native Modules), Python 3 Flask Backend, SQLite 3 (`nexora_vault.db`), Xcode 15/16, Frida / Cycript.

**Spec:** [docs/APPLE_WATCHOS_GUIDE.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/docs/APPLE_WATCHOS_GUIDE.md), [BUILD-IOS-WATCHOS.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/BUILD-IOS-WATCHOS.md), and [TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md).

## Global Constraints

- Currency must strictly be Indonesian Rupiah (`Rp`, `IDR`); zero lingering USD dollar signs (`$`).
- Standard customer profile is `Alexander Vance` (`NX-8492014`), initial balance `Rp 888.888.000`. Wire transfer recipient is `Evelyn Sterling` (`NX-7391048`) for `Rp 50.000.000`.
- All intentional pentest vulnerabilities (V-AP01 through V-AP06, V-B01, V-L04, V-W09, V-07, and CISO audit) MUST be strictly preserved as training targets.
- iOS `PRODUCT_BUNDLE_IDENTIFIER` must remain `com.nexorabank.omniwear`, and watch target must be `com.nexorabank.omniwear.watchkitapp`.
- All automated unit and integration tests (`tests/test_watchos_parity.py` and `tests/test_backend_db_integration.py`) must pass with 100% success.

## Review Focus

1. **Haptic Feedback Graceful Degradation:** When views run in SwiftUI previews, unit tests, or headless environments without WatchKit hardware, `WatchTheme.playHaptic()` must safely no-op without runtime crashes.
2. **Offline / Unreachable Backend Graceful Handling:** When watchOS triggers direct HTTP requests and backend is offline, views must display clean private banking error alerts rather than raw Swift network exception dumps.
3. **Double-Dispense Race Condition Integrity:** When ATM cash OTP verify endpoint is called concurrently, both requests must correctly reflect double debit in SQLite ledger for pentest verification.
4. **Card Kill-Switch Desynchronization State:** Toggling card freeze in offline simulation must update local UI state immediately while preserving backend divergence demonstration.
5. **Xcode Setup Guide Reproducibility:** Every terminal command, Xcode menu path, bundle identifier, and code signing step in the tutorial must be 100% executable without missing dependencies or undocumented assumptions.

---

### Task 1: WatchTheme Native Haptics & Authentication Micro-Interactions

**Files:**
- Modify: `ios/NexoraWatch/WatchTheme.swift`
- Modify: `ios/NexoraWatch/QuickPinPadView.swift`
- Modify: `ios/NexoraWatch/TwoFactorApprovalView.swift`
- Modify: `ios/NexoraWatch/WristLockoutView.swift`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: `WatchTheme`, `InsecureStorage`, `WatchSessionManager`, `WristSensorManager`.
- Produces: `WatchTheme.playHaptic(_ type: WatchTheme.HapticType)` callable across all SwiftUI views.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_watch_theme_haptic_support(self):
    """WatchTheme must declare haptic playback helper for native Apple Watch feedback."""
    filepath = os.path.join(WATCHOS_DIR, "WatchTheme.swift")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    self.assertIn("playHaptic", content, "WatchTheme missing playHaptic helper")
    self.assertIn("WKInterfaceDevice", content, "WatchTheme missing WatchKit haptic integration")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_watch_theme_haptic_support`
Expected: FAIL with `AssertionError: 'playHaptic' not found in content`

- [ ] **Step 3: Implement `WatchTheme.playHaptic` and integrate into authentication views**

In `ios/NexoraWatch/WatchTheme.swift`, import `WatchKit` conditionally and implement:
```swift
#if canImport(WatchKit)
import WatchKit
#endif

public struct WatchTheme {
    // ...
    public enum HapticType {
        case click
        case success
        case failure
        case warning
        case notification
    }

    public static func playHaptic(_ type: HapticType = .click) {
        #if os(watchOS)
        let device = WKInterfaceDevice.current()
        switch type {
        case .click: device.play(.click)
        case .success: device.play(.success)
        case .failure: device.play(.failure)
        case .warning: device.play(.retry)
        case .notification: device.play(.notification)
        }
        #endif
    }
}
```
Update `QuickPinPadView.swift` to invoke `WatchTheme.playHaptic(.click)` on each key press, `WatchTheme.playHaptic(.success)` on correct PIN, and `WatchTheme.playHaptic(.failure)` on wrong PIN.
Update `TwoFactorApprovalView.swift` to trigger `WatchTheme.playHaptic(.notification)` on modal appear and `WatchTheme.playHaptic(.success)` on approval.
Update `WristLockoutView.swift` to trigger `WatchTheme.playHaptic(.warning)` on lock appear.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_watch_theme_haptic_support`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ios/NexoraWatch/WatchTheme.swift ios/NexoraWatch/QuickPinPadView.swift ios/NexoraWatch/TwoFactorApprovalView.swift ios/NexoraWatch/WristLockoutView.swift tests/test_watchos_parity.py
git commit -m "feat(watchos): add native WatchKit haptic engine and realistic auth micro-interactions"
```

---

### Task 2: Authentic Banking Workflow & Micro-Interactions across Core Transaction Views

**Files:**
- Modify: `ios/NexoraWatch/BalanceView.swift`
- Modify: `ios/NexoraWatch/QRISPaymentView.swift`
- Modify: `ios/NexoraWatch/CardlessCashView.swift`
- Modify: `ios/NexoraWatch/CardFreezeView.swift`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: `WatchTheme.playHaptic`, `WatchNetworkManager`, `InsecureStorage`.
- Produces: Polished interactive banking flows with animated states, haptics, masked account numbers, and realistic transaction feedbacks.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_transaction_views_haptic_and_workflow_polish(self):
    """Core transaction views must utilize native haptics and contain polished status transitions."""
    for view_name in ["QRISPaymentView.swift", "CardlessCashView.swift", "CardFreezeView.swift"]:
        fpath = os.path.join(WATCHOS_DIR, view_name)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("playHaptic", content, f"{view_name} missing playHaptic integration")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_transaction_views_haptic_and_workflow_polish`
Expected: FAIL with `AssertionError: 'playHaptic' not found in content`

- [ ] **Step 3: Implement authentic banking polish and haptics in transaction views**

1. In `BalanceView.swift`:
   - Add haptic feedback on pull-to-refresh tap (`.click`), balance mask toggle (`.click`), and screen switches.
   - Add formatted timestamp of last synchronization ("Updated 21:45 WIB").
   - Add masked account number toggle (`NX-••••014` vs `NX-8492014`).
2. In `QRISPaymentView.swift`:
   - Add haptic `.click` on POS simulation scan, and `.success` on checkout completion.
   - Add visual dynamic QR barcode matrix representation and simulated NMID ("ID1020021189360").
3. In `CardlessCashView.swift`:
   - Add haptic `.click` on OTP refresh and `.success` on simulated ATM dispense.
   - Add visual progress bar for 15-minute countdown and ATM terminal sound simulation cue.
4. In `CardFreezeView.swift`:
   - Render luxury virtual cards with Obsidian & Emerald metallic gradient frames, EMV chip icon, and card brand badge.
   - Add haptic `.notification` when card freeze toggle is switched, and instant visual state flip.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_transaction_views_haptic_and_workflow_polish`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ios/NexoraWatch/BalanceView.swift ios/NexoraWatch/QRISPaymentView.swift ios/NexoraWatch/CardlessCashView.swift ios/NexoraWatch/CardFreezeView.swift tests/test_watchos_parity.py
git commit -m "feat(watchos): elevate transaction screens with authentic private banking visuals and haptics"
```

---

### Task 3: Master Pentest Guide Overhaul — Full Writeups for Scenarios 8 to 11 in `APPLE_WATCHOS_GUIDE.md`

**Files:**
- Modify: `docs/APPLE_WATCHOS_GUIDE.md`
- Modify: `TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: Scenarios 1–11 technical implementation in `ios/NexoraWatch` and `backend/server.py`.
- Produces: Exhaustive writeups with CVSS v4.0 scores, CWEs, root cause lines, step-by-step reproduction procedures, PoC Frida scripts, curl commands, and enterprise remediation snippets.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_apple_watchos_guide_full_writeup_coverage(self):
    """docs/APPLE_WATCHOS_GUIDE.md must provide complete writeups with PoC for all 11 scenarios."""
    guide_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "APPLE_WATCHOS_GUIDE.md"))
    with open(guide_path, "r", encoding="utf-8") as f:
        content = f.read()

    self.assertIn("Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios", content)
    for sc_num in range(1, 12):
        self.assertIn(f"Scenario {sc_num}:", content, f"Scenario {sc_num} missing in guide")
    
    # Verify scenarios 8 to 11 have full PoC commands and remediation
    self.assertIn("curl -X POST", content, "Missing curl PoC in guide")
    self.assertIn("POJK 11/POJK.03/2022", content, "Missing POJK 11 regulatory references")
    self.assertIn("PCI-DSS v4.0", content, "Missing PCI-DSS references")
    
    # Ensure no lingering USD dollar amounts like "$50,000" or "$13,370,000"
    dollar_matches = re.findall(r'\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)', content)
    self.assertEqual(dollar_matches, [], f"Lingering USD dollar amounts in guide: {dollar_matches}")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_apple_watchos_guide_full_writeup_coverage`
Expected: FAIL with `AssertionError: 'Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios' not found in content`

- [ ] **Step 3: Expand Scenarios 8 through 11 and standardize currency in `APPLE_WATCHOS_GUIDE.md`**

1. Update Section 5 Title: `## 🎯 5. Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios`.
2. Expand **Scenario 8: ATM Cardless Cash-Out OTP Brute-Force & Race Condition (V-L04)**:
   - CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N (Score: 8.2).
   - CWE-307, CWE-362.
   - Root Cause Code citation: `backend/server.py` lines around `/api/atm/cardless-cash/verify` and `CardlessCashView.swift`.
   - Complete PoC Python multithreading script (`exploit_double_dispense.py`) executing concurrent requests to dispense cash twice.
   - Expected Output & Database evidence in `backend/nexora_vault.db`.
   - Remediation: Distributed Redis mutex lock, single-use token invalidation, exponential backoff.
3. Expand **Scenario 9: Emergency Wrist Card Kill-Switch Desynchronization (V-W09)**:
   - CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:N/SC:N/SI:H/SA:N (Score: 6.9).
   - CWE-306, CWE-345.
   - Root Cause Code citation: `CardFreezeView.swift` and `WatchNetworkManager.swift`.
   - Complete PoC procedure: Intercepting `/api/wearable/card-freeze` with Burp Suite / proxy drop, demonstrating UI shows FROZEN while physical card remains ACTIVE on backend.
   - Remediation: Two-phase commit with cryptographic confirmation nonce from core banking.
4. Expand **Scenario 10: Client-Side iOS Jailbreak Anti-Tamper Detection Bypass (V-07)**:
   - CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N (Score: 5.8).
   - CWE-693.
   - Root Cause Code citation: `SecurityCheckModule.swift` lines around `isJailbroken()` and `nexora_bypass_jailbreak_check`.
   - Complete PoC Frida script (`bypass_jailbreak.js`) hooking `fileExistsAtPath:` and setting `UserDefaults` bypass flag.
   - Remediation: Remote attestation via Apple DeviceCheck API and App Attest service.
5. Expand **Scenario 11: CISO Governance & Regulatory Compliance Assessment (POJK 11 / PCI-DSS v4.0)**:
   - Full regulatory mapping table with POJK 11/POJK.03/2022 Pasal 25 & 31, Bank Indonesia PADG 24/1/PADG/2022 SNAP QRIS, and PCI-DSS v4.0 Requirements 3.4 & 4.1.
   - Actionable CISO executive scorecard and remediation checklist.
6. Reconcile `TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`:
   - Replace any remaining `$50,000` with `Rp 50.000.000` and align with the 11 scenarios.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_apple_watchos_guide_full_writeup_coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/APPLE_WATCHOS_GUIDE.md TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md tests/test_watchos_parity.py
git commit -m "docs(watchos): expand master pentest writeups for scenarios 8-11 and standardize currency"
```

---

### Task 4: Complete Step-by-Step Xcode Setup Tutorial for watchOS & iOS Backend/DB Connectivity

**Files:**
- Modify: `docs/APPLE_WATCHOS_GUIDE.md`
- Modify: `BUILD-IOS-WATCHOS.md`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: Xcode project structure (`ios/VulnerableBankApp.xcodeproj`, `ios/NexoraWatch`, `ios/add_watch_target.rb`).
- Produces: Definitive guide detailing prerequisites, workspace configuration, paired simulator provisioning, backend & DB verification, and troubleshooting.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_xcode_setup_tutorial_completeness(self):
    """docs/APPLE_WATCHOS_GUIDE.md and BUILD-IOS-WATCHOS.md must contain comprehensive Xcode and DB setup instructions."""
    guide_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "APPLE_WATCHOS_GUIDE.md"))
    with open(guide_path, "r", encoding="utf-8") as f:
        content = f.read()

    self.assertIn("add_watch_target.rb", content, "add_watch_target.rb missing from tutorial")
    self.assertIn("nexora_vault.db", content, "nexora_vault.db inspection missing from tutorial")
    self.assertIn("com.nexorabank.omniwear.watchkitapp", content, "Watch bundle identifier missing from tutorial")
    self.assertIn("NSAllowsArbitraryLoads", content, "App Transport Security explanation missing")
    self.assertIn("Pair Apple Watch", content, "Paired simulator instructions missing")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_xcode_setup_tutorial_completeness`
Expected: FAIL with `AssertionError`

- [ ] **Step 3: Author the comprehensive Xcode Setup Tutorial**

In `docs/APPLE_WATCHOS_GUIDE.md` (Section 2 & 3) and `BUILD-IOS-WATCHOS.md`:
1. **Section 2.1 — Prerequisites & Toolchain Setup**:
   - macOS Sonoma / Sequoia on Apple Silicon (M1/M2/M3/M4) or Intel Core i7/i9.
   - Xcode 15+ / 16+ with iOS 17/18 and watchOS 10/11 SDKs.
   - Command Line Tools: `xcode-select --install`.
   - Ruby Gems: `sudo gem install cocoapods xcodeproj`.
   - Node.js 18+ and Python 3.10+.
2. **Section 2.2 — Core Banking Backend & DB Initialization**:
   - Starting the server: `python3 backend/server.py` (listens on `0.0.0.0:5000`).
   - SQLite DB verification command: `sqlite3 backend/nexora_vault.db "SELECT account_number, customer_name, balance FROM users;"`.
   - Verifying initial state: `NX-8492014 | Alexander Vance | 888888000.0`.
3. **Section 2.3 — Scaffolding React Native iOS & CocoaPods**:
   - `npm install --legacy-peer-deps`.
   - `cd ios && pod install --repo-update && cd ..`.
4. **Section 2.4 — Automated Apple Watch Target Integration**:
   - Running `cd ios && ruby add_watch_target.rb`.
   - Verifying `VulnerableBankApp.xcodeproj` incorporates `NexoraWatch` with `com.nexorabank.omniwear.watchkitapp`.
   - Running `pod install` again to finalize target integration.
5. **Section 2.5 — Paired Simulator Configuration (iPhone 11/15 + Apple Watch Series 9/Ultra)**:
   - Window -> Devices and Simulators (`Cmd + Shift + 2`).
   - Step-by-step UI guide to create paired virtual device.
6. **Section 2.6 — Dual-Mode Network Configuration**:
   - Simulator: Automatically routes to `http://localhost:5000`.
   - Physical iPhone / Watch: Setting `http://<MAC_LAN_IP>:5000` in Pentest Lab API menu and `InsecureStorage.swift`.
   - Explaining App Transport Security (`NSAllowsArbitraryLoads = true`).
7. **Section 2.7 — End-to-End Database Verification Test**:
   - Perform a transaction on Watch (e.g., SNAP QRIS Rp 75.000 or Cardless Cash OTP).
   - Run verification query: `sqlite3 backend/nexora_vault.db "SELECT * FROM transactions ORDER BY id DESC LIMIT 1;"`.
8. **Section 2.8 — Xcode Error Resolution Matrix**:
   - `No such module 'React'` on watch target (Watch must not link RN pods).
   - `Code signing failed` (Selecting Personal Team in Signing & Capabilities).
   - `WCSession not paired` (Verifying bundle ID match).

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_xcode_setup_tutorial_completeness`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/APPLE_WATCHOS_GUIDE.md BUILD-IOS-WATCHOS.md tests/test_watchos_parity.py
git commit -m "docs(xcode): add exhaustive Xcode setup tutorial for watchOS and iOS with DB integration"
```

---

### Task 5: Full Automated Parity & Integration Verification

**Files:**
- Modify: `tests/test_watchos_parity.py`
- Modify: `tests/test_backend_db_integration.py`

**Interfaces:**
- Consumes: All 16 Swift files in `ios/NexoraWatch`, `docs/APPLE_WATCHOS_GUIDE.md`, and running Flask backend.
- Produces: 100% passing automated test suite verifying all 11 scenarios, syntax, and currency.

- [ ] **Step 1: Write integration tests for new capabilities**

Ensure `tests/test_watchos_parity.py` covers:
- Haptic helper in `WatchTheme.swift`.
- All 11 pentest scenarios documented in `docs/APPLE_WATCHOS_GUIDE.md`.
- No dangling USD dollar signs across all markdown guides and Swift files.
- Balanced braces and valid Swift syntax across all 16 files.
Ensure `tests/test_backend_db_integration.py` verifies:
- Live SQLite database mutations for QRIS, Cardless Cash, Card Freeze, 2FA, and Quick Pay.

- [ ] **Step 2: Run all tests**

Run: `python -m unittest discover tests/ -v`
Expected: All tests PASS with code 0 (24+ tests passing).

- [ ] **Step 3: Commit**

```bash
git add tests/test_watchos_parity.py tests/test_backend_db_integration.py
git commit -m "test(parity): verify full watchOS banking simulation, 11-scenario guide, and DB integration"
```

---

## Plan Self-Review Checklist

- **Spec Coverage:**
  - Visual and workflow audit: Tasks 1 & 2.
  - 11 scenarios writeup in `APPLE_WATCHOS_GUIDE.md`: Task 3.
  - Xcode setup tutorial for watchOS & iOS with backend and DB: Task 4.
  - Parity & automated verification: Task 5.
- **Step Scan:** Every step has an exact test, command, or file change with clear checkable criteria.
- **Type Consistency:** Method signatures like `WatchTheme.playHaptic(_ type: HapticType)` match between definition and consumption.
- **Proportion:** Clear, actionable tasks without redundant transcript dumps.

