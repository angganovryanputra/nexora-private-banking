# WatchOS Full Feature & Pentest Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete 1:1 feature and pentesting parity from Wear OS into Apple watchOS (`ios/NexoraWatch`), with Dual-Mode networking (HTTP `URLSession` + `WCSession`), Cardless ATM Cash-Out, Emergency Wrist Card Freeze, SNAP QRIS, Out-of-Band 2FA, iOS Jailbreak Anti-Tamper detection, full Indonesian Rupiah (IDR) currency, and seamless backend integration.

**Architecture:** Native SwiftUI application for watchOS structured across clear modular components. Insecure local storage mirrors Android SharedPreferences via `UserDefaults.standard` plist (CWE-312). Networking operates in Dual-Mode via `WatchNetworkManager` (direct HTTP `URLSession` with Python Flask core banking) and `WatchSessionManager` (`WCSession` for iPhone Companion bridge). Interactive Security Audit Lab provides live triggers for all 21 pentesting scenarios.

**Tech Stack:** Swift 5.9, SwiftUI, WatchKit, WatchConnectivity, Foundation (URLSession), Python 3.14 Flask backend, SQLite (`nexora_vault.db`).

**Spec:** [PANDUAN-DEMO-PENTEST.md](../../PANDUAN-DEMO-PENTEST.md) and [docs/APPLE_WATCHOS_GUIDE.md](../APPLE_WATCHOS_GUIDE.md).

## Global Constraints
- Currency must strictly be Indonesian Rupiah (`Rp`, `IDR`), zero dangling dollar signs (`$`).
- Default primary account: `Alexander Vance` (`NX-8492014`), default starting liquid balance: `Rp 888.888.000`. No legacy `ADMIN001` or `admin` placeholders.
- Swift code must be syntactically valid and idiomatic SwiftUI/WatchKit without missing symbols or malformed braces.
- Dual-mode networking must support both direct HTTP to backend (`http://localhost:5000` / Wi-Fi IP) and `WCSession` messages.
- Must run cleanly across all Apple Watch form factors (40mm, 41mm, 44mm, 45mm, and 49mm Apple Watch Ultra).

## Review Focus
1. **Unsaved / Null Backend Target**: When running on physical watch without saved URL, default gracefully to `http://localhost:5000` and LAN IP fallback instead of crashing or silent hanging.
2. **Missing Network Connectivity in Standalone Mode**: When iPhone is unreachable, direct `URLSession` must still function seamlessly if watch is on Wi-Fi.
3. **Cardless Cash Race Condition**: Ensure OTP token verification on watch handles both single verification and dual-dispense race condition without UI lock.
4. **Card Freeze State Synchronization**: Ensure toggling card freeze on wrist immediately updates local storage and transmits status over HTTP and WCSession.
5. **Jailbreak Detection Bypass Persistence**: Ensure toggle for bypass flag persists across app restarts in UserDefaults plist.

---

### Task 1: Comprehensive Parity & Syntax Verification Suite

**Files:**
- Create: `tests/test_watchos_parity.py`

**Interfaces:**
- Produces: Automated Python test suite verifying Swift syntax, symbol exports, contract parity with `backend/server.py`, currency formatting, and scenario coverage.

- [ ] **Step 1: Write the failing parity test suite**
Create `tests/test_watchos_parity.py` testing for the existence and structural correctness of `WatchNetworkManager.swift`, `CardlessCashView.swift`, `CardFreezeView.swift`, `SecurityCheckModule.swift`, IDR currency usage, and backend endpoint compatibility.

- [ ] **Step 2: Run test to verify it fails**
Run: `python -m unittest tests/test_watchos_parity.py`
Expected: FAIL due to missing files and legacy currency/account references in `InsecureStorage.swift` and `BalanceView.swift`.

---

### Task 2: Core Data, IDR Currency & Insecure Storage Overhaul

**Files:**
- Modify: `ios/NexoraWatch/InsecureStorage.swift`
- Modify: `ios/NexoraWatch/WatchTheme.swift`

**Interfaces:**
- Consumes: None (Root storage layer)
- Produces: `InsecureStorage.shared` providing persistent access to `accountNumber` (`NX-8492014`), `accountHolder` (`Alexander Vance`), `balance` (`888888000.0`), `currency` (`IDR`), `quickPin` (`1234`), `backendUrl` (`http://localhost:5000`), `isFrozen`, `cachedOtp`, and `bypassJailbreakCheck`.

- [ ] **Step 1: Update `InsecureStorage.swift` with enterprise banking defaults**
Replace legacy `ADMIN001` and `999999.0` with `NX-8492014`, `Alexander Vance`, and `888888000.0`. Add methods for backend URL configuration, card freeze state, cardless ATM OTP, and jailbreak detection flags.
- [ ] **Step 2: Update `WatchTheme.swift` with IDR currency formatter helper**
Add `formatRupiah(Double) -> String` producing `Rp 888.888.000` format.
- [ ] **Step 3: Run parity test to verify storage improvements**
Run: `python -m unittest tests/test_watchos_parity.py -k test_insecure_storage`
Expected: PASS.

---

### Task 3: Dual-Mode Network Manager (HTTP URLSession + WCSession)

**Files:**
- Create: `ios/NexoraWatch/WatchNetworkManager.swift`
- Modify: `ios/NexoraWatch/WatchSessionManager.swift`

**Interfaces:**
- Consumes: `InsecureStorage.shared`
- Produces: `WatchNetworkManager.shared` providing async HTTP methods: `checkBalance()`, `checkoutQRIS()`, `generateCardlessOtp()`, `verifyCardlessOtp()`, `toggleCardFreeze()`, `authorize2FA()`, and `pingBackend()`.
- Produces: `WatchSessionManager.shared` updated to handle `FREEZE_CARD`, `CARDLESS_OTP`, `SYNC_BALANCE`, and `TRIGGER_HIGH_VALUE_2FA`.

- [ ] **Step 1: Implement `WatchNetworkManager.swift`**
Direct `URLSession` implementation with timeout control, JSON serialization, and automatic synchronization with `InsecureStorage`.
- [ ] **Step 2: Update `WatchSessionManager.swift`**
Add support for card freeze, cardless cash OTP packets, and IDR transaction payloads.
- [ ] **Step 3: Run parity test to verify network manager**
Run: `python -m unittest tests/test_watchos_parity.py -k test_network_manager`
Expected: PASS.

---

### Task 4: ATM Cardless Cash-Out OTP Screen (Skenario 8 & 21)

**Files:**
- Create: `ios/NexoraWatch/CardlessCashView.swift`

**Interfaces:**
- Consumes: `WatchNetworkManager.shared`, `InsecureStorage.shared`, `WatchTheme`
- Produces: `CardlessCashView` providing 6-digit OTP generation, 15-minute countdown, 1-tap ATM dispense simulation, and double-dispense exploit demonstration.

- [ ] **Step 1: Implement `CardlessCashView.swift`**
Build responsive SwiftUI layout with OTP display pill, remaining time ticker, "Generate New OTP", and "Simulate ATM Withdrawal (Rp 100.000)".
- [ ] **Step 2: Run parity test to verify cardless cash view**
Run: `python -m unittest tests/test_watchos_parity.py -k test_cardless_cash_view`
Expected: PASS.

---

### Task 5: Emergency Wrist Card Freeze / Kill-Switch Screen (Skenario 9 & 16)

**Files:**
- Create: `ios/NexoraWatch/CardFreezeView.swift`

**Interfaces:**
- Consumes: `WatchNetworkManager.shared`, `InsecureStorage.shared`, `WatchTheme`
- Produces: `CardFreezeView` providing wrist-based emergency card kill-switch for virtual cards (`NX-VIRT-4401` & `NX-VIRT-9812`), status badge, and backend sync.

- [ ] **Step 1: Implement `CardFreezeView.swift`**
Build responsive card list with freeze toggle button, visual status indicators (Emerald Active vs Ruby Frozen), and immediate backend dispatch.
- [ ] **Step 2: Run parity test to verify card freeze view**
Run: `python -m unittest tests/test_watchos_parity.py -k test_card_freeze_view`
Expected: PASS.

---

### Task 6: Bank Indonesia SNAP QRIS IDR Overhaul (Skenario 6)

**Files:**
- Modify: `ios/NexoraWatch/QRISPaymentView.swift`

**Interfaces:**
- Consumes: `WatchNetworkManager.shared`, `InsecureStorage.shared`, `WatchTheme`
- Produces: `QRISPaymentView` with Bank Indonesia SNAP QRIS standard EMVCo payload, 120s rotating countdown, POS scan simulation in IDR (`Rp 75.000`), and backend checkout.

- [ ] **Step 1: Overhaul `QRISPaymentView.swift`**
Replace USD references with `Rp 75.000`, connect to `WatchNetworkManager.shared.checkoutQRIS(...)`, and preserve static token replay vulnerability (V-W15).
- [ ] **Step 2: Run parity test to verify QRIS payment view**
Run: `python -m unittest tests/test_watchos_parity.py -k test_qris_view`
Expected: PASS.

---

### Task 7: Out-of-Band 2FA Wire Transfer Hijacking Overhaul (Skenario 4 & 17)

**Files:**
- Modify: `ios/NexoraWatch/TwoFactorApprovalView.swift`

**Interfaces:**
- Consumes: `WatchNetworkManager.shared`, `WatchSessionManager.shared`, `InsecureStorage.shared`
- Produces: `TwoFactorApprovalView` configured for `Rp 50.000.000` wire transfer to `Evelyn Sterling (NX-7391048)`, with 1-tap unauthenticated approval and dual-channel dispatch.

- [ ] **Step 1: Overhaul `TwoFactorApprovalView.swift`**
Format transfer amount as `Rp 50.000.000`, wire transfer destination as `Evelyn Sterling (NX-7391048)`, and hook into backend `/api/wearable/authorize_2fa`.
- [ ] **Step 2: Run parity test to verify 2FA approval view**
Run: `python -m unittest tests/test_watchos_parity.py -k test_two_factor_view`
Expected: PASS.

---

### Task 8: iOS Jailbreak & Anti-Tamper Security Module (Skenario 2)

**Files:**
- Create: `ios/NexoraWatch/SecurityCheckModule.swift`

**Interfaces:**
- Consumes: `InsecureStorage.shared`
- Produces: `SecurityCheckModule.shared` providing `isDeviceJailbroken()`, `isFridaDetected()`, `toggleBypass(Bool)`, and sandbox integrity check.

- [ ] **Step 1: Implement `SecurityCheckModule.swift`**
Inspect known jailbreak filesystem paths (`/Applications/Cydia.app`, `/bin/bash`, `/usr/sbin/sshd`, `/Library/MobileSubstrate/MobileSubstrate.dylib`), sandbox escape write test, and respect client-side toggle in `InsecureStorage`.
- [ ] **Step 2: Run parity test to verify security module**
Run: `python -m unittest tests/test_watchos_parity.py -k test_security_check_module`
Expected: PASS.

---

### Task 9: Luxury Dashboard, Navigation Hub & Router Update

**Files:**
- Modify: `ios/NexoraWatch/BalanceView.swift`
- Modify: `ios/NexoraWatch/ContentView.swift`

**Interfaces:**
- Consumes: All views and managers
- Produces: Unified navigation flow connecting Dashboard (`BalanceView`), `QRISPaymentView`, `CardlessCashView`, `CardFreezeView`, `WatchPentestLabView`, `QuickPinPadView`, and `WristLockoutView`.

- [ ] **Step 1: Overhaul `BalanceView.swift`**
Add masked balance toggle, full IDR display (`Rp 888.888.000`), account `NX-8492014`, real-time sync with backend, and menu buttons for Cardless Cash and Card Freeze.
- [ ] **Step 2: Update `ContentView.swift`**
Expand router to navigate between all 7 screen targets.
- [ ] **Step 3: Run parity test to verify navigation and dashboard**
Run: `python -m unittest tests/test_watchos_parity.py -k test_dashboard_and_router`
Expected: PASS.

---

### Task 10: 21-Scenario Master Watch Pentest Lab (Pillar 1 - 5)

**Files:**
- Modify: `ios/NexoraWatch/WatchPentestLabView.swift`

**Interfaces:**
- Consumes: All modules and managers
- Produces: Complete 21-scenario interactive penetration testing matrix for Apple watchOS, categorized across 5 pillars, with live exploit triggers and CISO regulatory scorecard.

- [ ] **Step 1: Overhaul `WatchPentestLabView.swift`**
Include triggers for all 5 pillars:
- Pillar 1: Plist Storage Dump, Hardcoded AES Key, MD5 PIN Hash.
- Pillar 2: WCSession Dictionary Sniff, HTTP Direct Relay, TLS Unpinning.
- Pillar 3: Wrist-Off Lockout Evasion, Jailbreak Anti-Tamper Bypass, Ambient Screen Snooping.
- Pillar 4: High-Value 2FA Push Hijack (Rp 50M), Cardless ATM OTP Brute-Force & Race Condition, Card Freeze Desync.
- Pillar 5: Backend Target URL Config & Ping, CISO Regulatory Scorecard (OJK, SNAP, PCI-DSS).
- [ ] **Step 2: Run parity test to verify full pentest lab**
Run: `python -m unittest tests/test_watchos_parity.py -k test_pentest_lab`
Expected: PASS.

---

### Task 11: End-to-End Suite Verification & Documentation Update

**Files:**
- Modify: `docs/APPLE_WATCHOS_GUIDE.md`
- Modify: `PANDUAN-DEMO-PENTEST.md`

**Interfaces:**
- Consumes: Whole codebase
- Produces: Complete end-to-end verified suite, passing all automated unit and integration tests, and updated dual-platform demonstration guides.

- [ ] **Step 1: Run full test suite**
Run: `python -m unittest discover tests/ -v`
Expected: ALL TESTS PASS.
- [ ] **Step 2: Update `docs/APPLE_WATCHOS_GUIDE.md` and `PANDUAN-DEMO-PENTEST.md`**
Update watchOS instructions, dual-mode backend reachability steps, and cross-platform verification table.
- [ ] **Step 3: Git commit**
Commit all additions and updates with a comprehensive semantic message.
