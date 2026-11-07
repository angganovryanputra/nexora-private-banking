# Backend DB & iOS/watchOS Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full database and backend synchronization across Apple watchOS (`ios/NexoraWatch`) and iOS Companion (`ios/VulnerableBankApp`), resolving Bundle ID mismatches, adding missing iOS React Native native modules, and ensuring 100% data correlation with SQLite `nexora_vault.db`.

**Architecture:** Approach 1 (Direct Synchronous Dual-Channel Relay). WatchOS interacts directly with Flask backend REST endpoints (`URLSession`) and mirrors state with iPhone Companion (`WCSession`). All financial operations (QRIS, ATM Cash-Out, Card Freeze, 2FA, Quick Pay) atomically alter tables `users`, `transactions`, `virtual_cards`, and `cardless_cash_tokens` in `nexora_vault.db`. iOS Companion gains native parity modules for SecurityCheck, HeartRate, PinnedNetwork, and BluetoothSync.

**Tech Stack:** Swift 5.0+, Objective-C (React Native Bridge), Python 3.14 Flask, SQLite 3, React Native 0.79.

**Spec:** [PANDUAN-DEMO-PENTEST.md](../../PANDUAN-DEMO-PENTEST.md) and [docs/APPLE_WATCHOS_GUIDE.md](../APPLE_WATCHOS_GUIDE.md).

## Global Constraints
- Core customer profile must remain `Alexander Vance` (`NX-8492014`), initial balance `888888000.0` IDR.
- Currency must strictly be Indonesian Rupiah (`Rp`, `IDR`), zero dangling dollar signs (`$`).
- iOS Companion Bundle Identifier in `project.pbxproj` must match `WKCompanionAppBundleIdentifier = com.nexorabank.omniwear`.
- All database transactions must write real audit records in `transactions` and update `users.balance`.

## Review Focus
1. **Bundle Identifier Alignment**: Verify that `PRODUCT_BUNDLE_IDENTIFIER` equals `com.nexorabank.omniwear` across all build configurations in `project.pbxproj`.
2. **Database Atomic Balance Deduction**: Ensure all financial endpoints debit `users.balance` and insert matching rows in `transactions`.
3. **Double-Dispense ATM Race Condition**: Ensure `/api/atm/cardless-cash/verify` marks token status `DISPENSED` and records cash withdrawal.
4. **iOS Native Modules Nullability**: Ensure `SecurityCheck`, `HeartRate`, `PinnedNetwork`, and `BluetoothSync` export expected methods and do not cause unhandled runtime exceptions.
5. **WCSession Quick Pay Routing**: Ensure `WatchSessionManager` handles `QUICK_PAY` actions sent from the phone companion.

---

### Task 1: Automated Backend DB & Contract Integration Suite

**Files:**
- Create: `tests/test_backend_db_integration.py`

**Interfaces:**
- Produces: Integration test suite validating DB updates for check balance, QRIS payment, cardless ATM cash-out, card freeze, 2FA authorization, quick pay transfer, and bundle ID alignment.

- [ ] **Step 1: Write `tests/test_backend_db_integration.py`**
Test against live backend at `http://127.0.0.1:5000` and direct queries against `backend/nexora_vault.db`.
- [ ] **Step 2: Run test to verify initial state & discover any contract gaps**
Run: `python -m unittest tests/test_backend_db_integration.py`
Expected: Passes for existing backend endpoints, highlights bundle ID mismatch and missing watch quick pay handler.

---

### Task 2: WatchOS Quick Pay & Financial Sync Overhaul

**Files:**
- Modify: `ios/NexoraWatch/WatchNetworkManager.swift`
- Modify: `ios/NexoraWatch/WatchSessionManager.swift`

**Interfaces:**
- Consumes: Backend endpoints `/transfer`, `/check_balance/<acct>`
- Produces: `WatchNetworkManager.shared.quickPay(recipient:amount:completion:)` and `WatchSessionManager` handling `action == "QUICK_PAY"`.

- [ ] **Step 1: Update `WatchNetworkManager.swift`**
Add `quickPay(recipient: String, amount: Double, completion: @escaping (Result<[String: Any], Error>) -> Void)` sending POST `/transfer`.
- [ ] **Step 2: Update `WatchSessionManager.swift`**
Add `case "QUICK_PAY":` in `didReceiveMessage` handler that debits local balance and relays transaction to backend.
- [ ] **Step 3: Run integration test**
Run: `python -m unittest tests/test_backend_db_integration.py -k test_watch_quick_pay`
Expected: PASS.

---

### Task 3: iOS React Native Native Modules Parity Suite

**Files:**
- Create: `ios/VulnerableBankApp/SecurityCheck.swift`
- Create: `ios/VulnerableBankApp/SecurityCheck.m`
- Create: `ios/VulnerableBankApp/HeartRate.swift`
- Create: `ios/VulnerableBankApp/HeartRate.m`
- Create: `ios/VulnerableBankApp/PinnedNetwork.swift`
- Create: `ios/VulnerableBankApp/PinnedNetwork.m`
- Create: `ios/VulnerableBankApp/BluetoothSync.swift`
- Create: `ios/VulnerableBankApp/BluetoothSync.m`

**Interfaces:**
- Produces: Full React Native native modules parity for iOS Companion (`NativeModules.SecurityCheck`, `NativeModules.HeartRate`, `NativeModules.PinnedNetwork`, `NativeModules.BluetoothSync`).

- [ ] **Step 1: Implement `SecurityCheck.swift` and export header `SecurityCheck.m`**
Implement `getRuntimeSecurityReport`, `toggleClientRootBypass`, and `bruteForcePin`.
- [ ] **Step 2: Implement `HeartRate.swift` and export header `HeartRate.m`**
Implement `getWristState`, `setWristPresent`, `start`, `stop`, `getHistory`, `clearHistory`, and event emitter for `'HeartRate'`.
- [ ] **Step 3: Implement `PinnedNetwork.swift` and export header `PinnedNetwork.m`**
Implement `testPinnedRequest`.
- [ ] **Step 4: Implement `BluetoothSync.swift` and export header `BluetoothSync.m`**
Implement `simulatePhoneBeacon` and `getLastSyncData`.
- [ ] **Step 5: Run parity tests**
Run: `python -m unittest tests/test_backend_db_integration.py -k test_ios_native_modules`
Expected: PASS.

---

### Task 4: iOS Bundle Identifier & Xcode Project Target Synchronization

**Files:**
- Modify: `ios/VulnerableBankApp.xcodeproj/project.pbxproj`
- Create: `ios/add_watch_target.py`

**Interfaces:**
- Consumes: `ios/NexoraWatch/Info.plist` (`WKCompanionAppBundleIdentifier`)
- Produces: Aligned `PRODUCT_BUNDLE_IDENTIFIER = com.nexorabank.omniwear` in `project.pbxproj`, and cross-platform target integration script `add_watch_target.py`.

- [ ] **Step 1: Align Bundle Identifier in `project.pbxproj`**
Change `PRODUCT_BUNDLE_IDENTIFIER` from `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` to `com.nexorabank.omniwear`.
- [ ] **Step 2: Implement `ios/add_watch_target.py`**
Provide python script to configure and inspect watch target references inside `project.pbxproj`.
- [ ] **Step 3: Run integration test**
Run: `python -m unittest tests/test_backend_db_integration.py -k test_bundle_identifier_alignment`
Expected: PASS.

---

### Task 5: End-to-End Suite Verification & Commit

**Files:**
- All modified and created files across `tests/`, `ios/NexoraWatch/`, `ios/VulnerableBankApp/`, and `docs/`

- [ ] **Step 1: Run complete test suite**
Run: `python -m unittest discover tests/ -v`
Expected: ALL TESTS PASS.
- [ ] **Step 2: Verify git status and commit**
Commit with descriptive commit message.
