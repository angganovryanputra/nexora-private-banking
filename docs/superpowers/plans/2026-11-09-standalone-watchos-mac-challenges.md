# Standalone watchOS & Mac Security Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 standalone security challenges executable using **only the Apple Watch (watchOS) and the researcher's Mac laptop** with zero companion iPhone dependency, verify backend connectivity, eliminate offline payment optimistic decrement in `QRISPaymentView.swift`, and overhaul `docs/APPLE_WATCHOS_GUIDE.md` and related guides with comprehensive writeups and configuration tutorials.

**Architecture:** The Apple Watch client is a standalone watchOS application communicating directly with the Flask backend (`http://127.0.0.1:5000` or local network IP) over HTTP, storing sandboxed data in `UserDefaults` plists and cache databases, registering the custom URL scheme `nexorabank://`, and exposing dynamic Objective-C runtimes for LLDB and Frida memory swizzling.

**Tech Stack:** watchOS 9+ (SwiftUI, WatchKit, Objective-C runtime), Python 3 Flask Backend (`backend/server.py`), SQLite 3 (`backend/nexora_vault.db`), macOS toolchain (`xcrun simctl`, LLDB, Frida, Burp Suite, Python `concurrent.futures`).

**Spec:** [docs/APPLE_WATCHOS_GUIDE.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/docs/APPLE_WATCHOS_GUIDE.md), [BUILD-IOS-WATCHOS.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/BUILD-IOS-WATCHOS.md), and [TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md).

## Global Constraints

- Currency must strictly be Indonesian Rupiah (`Rp`, `IDR`); zero lingering USD dollar signs (`$`).
- Standard customer profile is `Alexander Vance` (`NX-8492014`), initial balance `Rp 888.888.000`. Target IDOR account is `Evelyn Sterling` (`NX-7391048`), balance `Rp 70.250.000`.
- 100% standalone watchOS operation: All 5 challenges must be fully testable on watchOS simulator or device paired directly with a Mac laptop without launching or installing the iPhone companion app.
- All intentional pentest vulnerabilities must remain intact.
- Zero Swift compilation or syntax errors; all tests in `tests/test_watchos_parity.py` and `tests/test_backend_db_integration.py` must pass cleanly.

## Review Focus

1. **Standalone Execution Integrity:** Can a security researcher with only an Apple Watch (or watch simulator) and a Mac laptop execute all 5 challenges without touching an iPhone?
2. **Offline Payment Graceful Handling:** Does `QRISPaymentView.swift` show an authentic private banking network failure dialog without optimistically deducting local balance?
3. **Deep Link BOLA Handler:** Does `nexorabank://account?num=NX-7391048` correctly parse on watchOS and switch the active account to demonstrate unauthorized account inspection?
4. **Runtime Hookability:** Are `WristSensorManager` and `InsecureStorage` structured with `@objc dynamic` methods so LLDB and Frida can easily hook and swizzle them without symbol stripping issues?
5. **Documentation & PoC Reproducibility:** Do all terminal commands (`xcrun simctl`, `lldb`, `curl`, python scripts) work verbatim on macOS?

---

### Task 1: Offline Payment Fallback Fix & Deep Link Custom URL Scheme Support

**Files:**
- Modify: `ios/NexoraWatch/QRISPaymentView.swift`
- Modify: `ios/NexoraWatch/Info.plist`
- Modify: `ios/NexoraWatch/NexoraWatchApp.swift`
- Modify: `ios/NexoraWatch/ContentView.swift`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: `InsecureStorage.shared`, `WatchNetworkManager.shared`.
- Produces: Authentic failure UI state in `QRISPaymentView`; deep link handler `.onOpenURL` handling `nexorabank://account?num=...`.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_qris_offline_fallback_and_deep_link`
Expected: FAIL

- [ ] **Step 3: Implement offline fix and deep link handler**

In `QRISPaymentView.swift`:
Replace lines 183-188:
```swift
                case .failure:
                    WatchTheme.playHaptic(.failure)
                    self.statusMessage = "Transaksi Gagal: Backend Offline"
```
In `Info.plist`:
Add `CFBundleURLTypes` registering the `nexorabank` URL scheme.
In `ContentView.swift`:
Add `.onOpenURL { url in handleDeepLink(url) }` that parses `url.queryParameters` or `URLComponents`, extracts `num`, stores it in `InsecureStorage.shared.saveAccountNumber(acct)`, sets `isAuthenticated = true`, and sets `currentScreen = "balance"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_qris_offline_fallback_and_deep_link`
Expected: PASS

---

### Task 2: Standalone Security Lab UI & Runtime Hooking Enhancements

**Files:**
- Modify: `ios/NexoraWatch/WristSensorManager.swift`
- Modify: `ios/NexoraWatch/InsecureStorage.swift`
- Modify: `ios/NexoraWatch/WatchPentestLabView.swift`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: `WristSensorManager`, `InsecureStorage`, `WatchNetworkManager`.
- Produces: `@objc dynamic` methods in `WristSensorManager` (`isWristAttachedToBody`) and `InsecureStorage` (`verifyPin`), and interactive triggers for all 5 standalone challenges in `WatchPentestLabView`.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_standalone_pentest_lab_and_runtime_hooks(self):
    """WristSensorManager and InsecureStorage must support @objc dynamic hooks, and WatchPentestLabView must expose standalone triggers."""
    wrist_path = os.path.join(WATCHOS_DIR, "WristSensorManager.swift")
    with open(wrist_path, "r", encoding="utf-8") as f:
        wrist_content = f.read()
    self.assertIn("@objc", wrist_content, "WristSensorManager missing @objc dynamic hook declaration")
    
    storage_path = os.path.join(WATCHOS_DIR, "InsecureStorage.swift")
    with open(storage_path, "r", encoding="utf-8") as f:
        storage_content = f.read()
    self.assertIn("@objc", storage_content, "InsecureStorage missing @objc dynamic verifyPin declaration")
    
    lab_path = os.path.join(WATCHOS_DIR, "WatchPentestLabView.swift")
    with open(lab_path, "r", encoding="utf-8") as f:
        lab_content = f.read()
    self.assertIn("Standalone", lab_content, "WatchPentestLabView missing Standalone pentest indicators")
    self.assertIn("NX-7391048", lab_content, "WatchPentestLabView missing IDOR target account trigger")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_standalone_pentest_lab_and_runtime_hooks`
Expected: FAIL

- [ ] **Step 3: Implement runtime hooks and standalone triggers**

In `WristSensorManager.swift`:
Make `public class WristSensorManager: NSObject, ObservableObject` and declare:
```swift
    @objc public dynamic func isWristAttachedToBody() -> Bool {
        return bypassActive ? true : isWristAttached
    }
```
In `InsecureStorage.swift`:
Make `public class InsecureStorage: NSObject` and declare:
```swift
    @objc public dynamic func verifyPin(_ inputPin: String) -> Bool {
        let stored = defaults.string(forKey: keyPin) ?? "1234"
        return inputPin == stored
    }
```
In `WatchPentestLabView.swift`:
Add standalone triggers for:
- Standalone Sandbox Plist & Cache Dump (Pillar 1)
- Standalone Cleartext Wi-Fi Direct HTTP Replay (Pillar 2)
- Standalone LLDB/Frida Wrist Hook Simulation (Pillar 3)
- Standalone ATM Cash Double-Dispense Race Condition (Pillar 4)
- Standalone Wrist BOLA / IDOR Account Switch to `NX-7391048` (Evelyn Sterling) (Pillar 4)

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_standalone_pentest_lab_and_runtime_hooks`
Expected: PASS

---

### Task 3: Overhaul Scenarios 5, 6, 7 in `docs/APPLE_WATCHOS_GUIDE.md`

**Files:**
- Modify: `docs/APPLE_WATCHOS_GUIDE.md`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: Scenarios 5, 6, 7 in `docs/APPLE_WATCHOS_GUIDE.md`.
- Produces: Publication-grade writeups with CVSS v4.0 vectors, CWE IDs, vulnerable code citations, copy-pasteable Frida/LLDB/curl PoC scripts, SQLite verification queries, and POJK 11 / PCI-DSS v4.0 remediation.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_apple_watchos_guide_scenarios_5_6_7_deep_writeups(self):
    """Scenarios 5, 6, and 7 must feature publication-grade writeups with CVSS v4.0 and PoC scripts."""
    guide_path = os.path.join(REPO_ROOT, "docs", "APPLE_WATCHOS_GUIDE.md")
    with open(guide_path, "r", encoding="utf-8") as f:
        guide = f.read()
    self.assertIn("Skenario 5: Sensor Wrist-Off", guide)
    self.assertIn("CVSS:4.0", guide)
    self.assertIn("Skenario 6: Contactless Dynamic SNAP QRIS Replay", guide)
    self.assertIn("Skenario 7: Standalone Watch IDOR / BOLA Account Peeking", guide)
    self.assertIn("NX-7391048", guide)
```

- [ ] **Step 2: Run test to verify it fails (or checks specific sections)**

Run: `python -m unittest tests/test_watchos_parity.py -k test_apple_watchos_guide_scenarios_5_6_7_deep_writeups`

- [ ] **Step 3: Update `docs/APPLE_WATCHOS_GUIDE.md` for Scenarios 5, 6, and 7**

Expand Scenarios 5, 6, and 7 with comprehensive structure:
- Vulnerability Description & Threat Profile
- CVSS v4.0 Score & Vector
- CWE Classification
- Vulnerable watchOS Source Code Snippets
- Proof-of-Concept Exploit (Frida script, LLDB breakpoint commands, curl script)
- Impact & SQLite Verification Queries
- Remediation (Swift code diff & Regulatory mapping: OJK POJK 11/2022, Bank Indonesia SNAP QRIS, PCI-DSS v4.0).

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_apple_watchos_guide_scenarios_5_6_7_deep_writeups`
Expected: PASS

---

### Task 4: Dedicated Standalone WatchOS & Mac Pentest Guide & Configuration Tutorial

**Files:**
- Modify: `docs/APPLE_WATCHOS_GUIDE.md`
- Modify: `TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`
- Modify: `BUILD-IOS-WATCHOS.md`
- Test: `tests/test_watchos_parity.py`

**Interfaces:**
- Consumes: Standalone watchOS architecture and Mac testing workflow.
- Produces: Dedicated chapter "Panduan Pentest Standalone watchOS + Mac (Tanpa Companion iPhone)" and updated configuration tutorials.

- [ ] **Step 1: Write the failing test**

```python
# In tests/test_watchos_parity.py
def test_standalone_watchos_mac_guide_presence(self):
    """Guide must contain dedicated section for standalone watchOS and Mac pentesting without companion."""
    guide_path = os.path.join(REPO_ROOT, "docs", "APPLE_WATCHOS_GUIDE.md")
    with open(guide_path, "r", encoding="utf-8") as f:
        guide = f.read()
    self.assertIn("Panduan Pentest Standalone watchOS + Mac (Tanpa Companion iPhone)", guide)
    self.assertIn("xcrun simctl get_app_container", guide)
    self.assertIn("xcrun simctl openurl", guide)
    self.assertIn("nexorabank://account?num=NX-7391048", guide)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_watchos_parity.py -k test_standalone_watchos_mac_guide_presence`
Expected: FAIL

- [ ] **Step 3: Author standalone pentest chapter and tutorials**

Add dedicated chapter in `docs/APPLE_WATCHOS_GUIDE.md` and synchronize `TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md` and `BUILD-IOS-WATCHOS.md`.
Document:
1. Challenge 1: Forensic Plist & Cache Dump via `xcrun simctl`
2. Challenge 2: Direct Cleartext Wi-Fi HTTP MITM & Reversal via Burp Suite
3. Challenge 3: Standalone Runtime Memory Swizzling via LLDB & Frida
4. Challenge 4: Standalone ATM Double-Dispense Race Condition via Python Multi-threading
5. Challenge 5: Standalone Wrist BOLA / IDOR Account Peeking via Deep Link & Direct API

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_watchos_parity.py -k test_standalone_watchos_mac_guide_presence`
Expected: PASS

---

### Task 5: Whole-Branch Parity & Integration Verification

**Files:**
- Modify: `tests/test_watchos_parity.py`
- Modify: `tests/test_backend_db_integration.py`
- Verify: Full test suite

**Interfaces:**
- Consumes: All Swift code, backend endpoints, database, documentation.
- Produces: 100% green test suite, zero dangling dollar signs, verified backend connectivity.

- [ ] **Step 1: Update test suite with complete assertions**
- [ ] **Step 2: Run test suite and verify 100% PASS**
Run: `python -m unittest discover tests/ -v`
Expected: All tests pass.
- [ ] **Step 3: Verify backend response & SQLite database**
Run live checks against backend port 5000 and `backend/nexora_vault.db`.
