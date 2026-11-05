# Technical Design Document: Enterprise Organic Overhaul & Real-Time Sync

**Author:** Antigravity Engineering
**Date:** 2026-11-05
**Topic:** Nexora Bank Full Enterprise Real-Time Synchronization & Authentic Vulnerability Architecture

---

## 1. Intent & The "Why"
Nexora Bank is designed as an ultra-realistic Smartwatch & Companion Private Banking security demonstration and research environment. Previously, several areas contained artificial artifacts (such as mock fallback alerts, hardcoded "bob/alice" test accounts, USD currency mismatches, static CTF strings in insecure storage, and missing real-time event dissemination when transfers or bill payments occur).

This overhaul eliminates all "toy demo" appearances and upgrades the entire platform into a production-grade, highly cohesive digital banking ecosystem in Indonesian Rupiah (IDR), where vulnerabilities (such as BOLA, SQL injection, insecure storage, unauthenticated BLE sync, and 2FA push replay) exist organically as structural architectural flaws rather than contrived prompts.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Full Currency Consistency (Rupiah / IDR)**: All financial modules (Balance, Transfer, Bills, Virtual Cards, Loans, ATM Cardless Cash, and Companion Screen) display and calculate amounts exclusively in Indonesian Rupiah (`Rp`, `IDR`).
2. **Realistic Customer Database**: Completely eradicate dummy names like `admin`, `bob`, `alice`, `ADMIN001`, `ACC_BOB88`. Replace with realistic Indonesian / International HNW private banking accounts (e.g. `Alexander Vance`, `Evelyn Sterling`, `Marcus Holloway`, `Sophia Rodriguez`, `Julian Drake`, `Clara Beaumont`).
3. **Real-Time Cross-Device Event Bus**: All financial mutations on the backend (`transfer`, `bill_payments`, `virtual_cards`, `loans`) automatically insert real-time events into `wearable_events`. Both the Wear OS watch and Companion App instantly reflect balance deductions and transaction records without requiring manual reload or app restarts.
4. **Authentic Insecure Storage (OWASP Mobile M2)**: `NexoraVaultPrefs.xml` (SharedPreferences) and React Native `AsyncStorage` serialize and store the genuine active user profile, session token, unencrypted balance snapshot, cached offline transaction ledgers, and raw PPG sensor telemetry (`health_telemetry_json`).
5. **Responsive & Scrollable Welcome Screen**: Wrap `WelcomeScreen` in an adaptive `ScrollView` respecting Wear OS circular display insets (`ROUND_INSET`, `CIRCULAR_PADDING_TOP`, `CIRCULAR_PADDING_BOTTOM`) so that no buttons or text are clipped on 480x480 circular screens or mobile phones.
6. **Two New Organic Pentest Scenarios**:
   - **V-B04 (Pillar 2 - BLE / Relay)**: Wearable 2FA Push Authorization Replay Attack (lacks cryptographic nonce / timestamp expiry).
   - **V-S04 (Pillar 1 - Insecure Storage)**: Plaintext Health & PPG Biometric Telemetry Exfiltration from SharedPreferences.
7. **Comprehensive Documentation Sync**: Update `PANDUAN-DEMO-PENTEST.md` with new account numbers, IDR values, and reproduction commands.

### Non-Goals
- Replacing the core React Native or Flask stack.
- Modifying standard Android build toolchains or iOS Xcode project structure unnecessarily.

### Anti-Goals
- Leaving any user-visible string that says "Simulated Demo", "Offline Mock", "CTF Flag", or "Toy".
- Breaking backward compatibility of ADB exploit commands used by researchers.

---

## 3. Approaches Considered & Selected

- **Approach 1: Full Enterprise Organic Overhaul (Selected)**:
  Unify backend database, event bus, frontend state, currency (IDR), insecure storage structure, and responsive layout across both Wear OS and Companion apps.
  *Rationale*: Satisfies 100% of the user's requirements for a realistic private banking experience and authentic pentest lab.
- **Approach 2: Frontend-Only Cosmetic Patch (Rejected)**:
  Only changes UI strings without wiring real-time event dissemination in backend endpoints.
  *Rationale*: Leaves multi-device synchronization brittle and out-of-sync.

---

## 4. Architectural Specifications

### 4.1. Seed Accounts & Currency Standard (IDR)
Primary User Account (Admin / High-Net-Worth VIP):
- Username: `alexander.vance` (Display: `Alexander Vance`)
- Password: `Password123!` (or quick bypass)
- Account Number: `NX-8492014`
- Role: Private Banking Ultra HNW
- Initial Balance: `Rp 999.999.000` (IDR)

Counterparty & Peer Accounts:
1. `Evelyn Sterling` (`NX-7391048`) — Balance: `Rp 52.800.000`
2. `Marcus Holloway` (`NX-9201482`) — Balance: `Rp 18.750.000`
3. `Sophia Rodriguez` (`NX-5182930`) — Balance: `Rp 125.400.000`
4. `Julian Drake` (`NX-6302914`) — Balance: `Rp 7.500.000`
5. `Clara Beaumont` (`NX-4102945`) — Balance: `Rp 94.100.000`

### 4.2. Backend Real-Time Event Bus (`backend/server.py`)
Whenever a transaction occurs:
1. `transfer()` updates `from_account` and `to_account`.
2. Inserts into `transactions` table with formatted IDR description.
3. Automatically inserts event:
   ```python
   cur.execute(
       "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('watch_9201', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
       (json.dumps({"amount": new_sender_balance, "currency": "IDR", "account": from_acct}),)
   )
   ```
4. Returns `{ "status": "success", "new_balance": new_sender_balance, "currency": "IDR", "reference": "..." }`.

Similar event dispatch logic is wired into:
- `/api/bill-payments/create`
- `/api/virtual-cards/<id>/toggle-freeze`
- `/api/virtual-cards/<id>/update-limit`
- `/request_loan`

### 4.3. Insecure Data Storage Serialization
In `PrefsHelper.java`, `AuthBroadcastReceiver.kt`, and `AuthContext.tsx`:
Store authentic enterprise JSON objects:
- `user_profile`: `{"name":"Alexander Vance","account":"NX-8492014","tier":"Ultra HNW","kyc":"VERIFIED"}`
- `cached_balance_idr`: `"Rp 999.999.000"`
- `offline_ledger`: serialized array of recent transactions.
- `health_telemetry_json`: array of PPG pulse sensor readings with user IDs.

### 4.4. UI Layout Overhaul
- `WelcomeScreen.tsx`: Wrapped in `ScrollView` with responsive insets and circular device geometry.
- `TransferScreen.tsx`: Recipient picker populated with real counterparty accounts, dynamic balance deduction, and immediate navigation back to Dashboard with refreshed state.
- `DashboardScreen.tsx` & `BalanceScreen.tsx`: Native IDR formatting (`Rp 999.999.000`) and immediate listener for `UPDATE_BALANCE`.
- `SmartphoneCompanionScreen.tsx`: Dispatches IDR sync events (`Rp 50.000.000` etc.) to the watch relay.

---

## 5. Verification & Testing Strategy
1. **Unit & Backend Regression Tests**: Run `python -m unittest discover backend -p "test_*.py"` to ensure all 14+ tests pass and updated endpoints adhere to IDR contracts.
2. **Transfer Real-Time Verification**: Execute transfer via API and confirm `wearable_events` contains the pending event with new balance.
3. **Android Release Build**: Execute `./gradlew assembleRelease --no-daemon` to ensure 0 build errors.
4. **Emulator Installation & Runtime Check**: Push and install to `emulator-5554`, verify `WelcomeScreen` scrolling, login as `alexander.vance`, execute transfer, and verify real-time balance decrease.

