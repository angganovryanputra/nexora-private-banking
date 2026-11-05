# Enterprise Organic Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Nexora Bank into a 100% authentic, production-grade private digital banking ecosystem in Indonesian Rupiah (IDR) with real-time cross-device event synchronization, realistic high-net-worth customer profiles, genuine insecure data storage, responsive scrollable welcome screen, and 2 new organic pentest scenarios.

**Architecture:** Python Flask backend with SQLite WAL mode as the core banking engine and wearable event broker; React Native (Android Wear OS + Mobile Companion) consuming the real-time event bus via 1s polling and native broadcast listeners; Native Kotlin modules storing authentic serialized user profiles and telemetry in SharedPreferences.

**Tech Stack:** Python 3 (Flask, SQLite3), React Native 0.73+, TypeScript, Android SDK 33+ (Kotlin, Java), Wear OS 4+.

**Spec:** `docs/superpowers/specs/2026-11-05-enterprise-organic-overhaul-design.md`

## Global Constraints
- All currency representations must strictly use Indonesian Rupiah (`Rp`, `IDR`), eliminating all `$`/`USD` references in user flows.
- Eradicate textbook dummy accounts (`admin`, `bob`, `alice`, `ADMIN001`, `ACC_BOB88`, `ACC_ALICE12`).
- Primary user account is `alexander.vance` (Account: `NX-8492014`, Password: `Password123!`, Balance: `Rp 999.999.000`).
- No visible UI string may contain "Simulated", "Demo", "Offline fallback", or "CTF Flag".
- Android Wear OS UI must remain 100% responsive on 480x480 circular displays with zero text/button truncation.

## Review Focus
1. Negative transfer vulnerability must still succeed mathematically in IDR while automatically notifying the Wear OS watch.
2. Insecure SharedPreferences (`NexoraVaultPrefs.xml`) must contain authentic enterprise serialized JSON (`user_profile`, `cached_balance_idr`, `offline_ledger`, `health_telemetry_json`).
3. Bill payment must debit the actual logged-in user's balance and dispatch a real-time event.
4. Welcome screen must scroll smoothly without clipping on both circular watch displays and rectangular smartphones.
5. All 14 existing backend tests plus new tests must pass cleanly.

---

### Task 1: Backend Database & Realistic Customer Seed Overhaul (IDR)

**Files:**
- Modify: `backend/server.py:106-340`
- Modify: `backend/test_server.py`

**Interfaces:**
- Consumes: SQLite schema `users`, `transactions`, `virtual_cards`, `loans`, `bill_payments`.
- Produces: Seeded accounts `alexander.vance` (`NX-8492014`), `Evelyn Sterling` (`NX-7391048`), `Marcus Holloway` (`NX-9201482`), `Sophia Rodriguez` (`NX-5182930`), `Julian Drake` (`NX-6302914`), `Clara Beaumont` (`NX-4102945`).

- [ ] **Step 1: Write unit tests for new customer accounts & IDR currency**
Update `backend/test_server.py` to assert login and balance for `alexander.vance` (`NX-8492014`) with initial balance `999999000.0`.

- [ ] **Step 2: Run test to verify it fails**
Run: `python -m unittest backend/test_server.py`
Expected: FAIL due to legacy `admin` expectation.

- [ ] **Step 3: Update `init_db()` in `backend/server.py`**
Replace legacy seed data with the 6 realistic private banking accounts, IDR balances, IDR virtual cards, and realistic billers/merchants.

- [ ] **Step 4: Run test to verify it passes**
Run: `python -m unittest backend/test_server.py`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/server.py backend/test_server.py
git commit -m "feat(backend): seed realistic private banking customer accounts in IDR currency"
```

---

### Task 2: Backend Real-Time Cross-Device Event Bus & Mutation Endpoints

**Files:**
- Modify: `backend/server.py:403-460` (transfer)
- Modify: `backend/server.py:754-800` (bill-payments)
- Modify: `backend/server.py:500-580` (virtual-cards)
- Modify: `backend/server.py:653-700` (loans)
- Test: `backend/test_server.py`

**Interfaces:**
- Consumes: HTTP POST `/transfer`, `/api/bill-payments/create`, `/api/virtual-cards/<id>/toggle-freeze`, `/request_loan`.
- Produces: Automatic records in `wearable_events` with `action='UPDATE_BALANCE'` and `action='CARD_STATUS_CHANGED'`.

- [ ] **Step 1: Write unit tests for real-time wearable event dispatch on transfer**
Add test in `backend/test_server.py` asserting that executing `/transfer` creates an event in `wearable_events` with the updated balance.

- [ ] **Step 2: Run test to verify it fails**
Run: `python -m unittest backend/test_server.py`
Expected: FAIL (no event generated).

- [ ] **Step 3: Implement event dispatch in `server.py` mutations**
In `transfer()`:
```python
cur.execute(
    "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('watch_9201', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
    (json.dumps({"amount": new_from_balance, "currency": "IDR", "account": from_acct}),)
)
```
Add corresponding event dispatch to `create_bill_payment` and `toggle_freeze`. Return `new_balance` in the JSON response.

- [ ] **Step 4: Run test to verify it passes**
Run: `python -m unittest backend/test_server.py`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/server.py backend/test_server.py
git commit -m "feat(backend): wire real-time wearable event bus into all financial mutations"
```

---

### Task 3: Insecure Data Storage Enterprise Serialization (Native Android & React Native)

**Files:**
- Modify: `android/app/src/main/java/com/nexorabank/omniwear/PrefsHelper.java`
- Modify: `android/app/src/main/java/com/nexorabank/omniwear/HeartRateModule.kt`
- Modify: `android/app/src/main/java/com/nexorabank/omniwear/AuthBroadcastReceiver.kt`
- Modify: `src/contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: User login & sync responses.
- Produces: Serialized `user_profile`, `cached_balance_idr`, `offline_ledger`, and `health_telemetry_json` in `NexoraVaultPrefs.xml` and `AsyncStorage`.

- [ ] **Step 1: Update `PrefsHelper.java` to save enterprise user profile and IDR balance**
Add methods to serialize and store `user_profile` JSON, `cached_balance_idr`, and `offline_ledger` in `NexoraVaultPrefs`.

- [ ] **Step 2: Update `HeartRateModule.kt` for authentic PPG biometric telemetry storage (V-S04)**
Record authentic heart rate telemetry array `health_telemetry_json` with timestamp, BPM, HRV, and user account into `NexoraVaultPrefs`.

- [ ] **Step 3: Update `AuthContext.tsx`**
Update `login` to store the full authentic user profile, account `NX-8492014`, and real balance in `AsyncStorage`.

- [ ] **Step 4: Verify Java/Kotlin syntax & compilation**
Run: `cd android && ./gradlew compileReleaseKotlin && cd ..`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**
```bash
git add android/app/src/main/java/com/nexorabank/omniwear/PrefsHelper.java android/app/src/main/java/com/nexorabank/omniwear/HeartRateModule.kt android/app/src/main/java/com/nexorabank/omniwear/AuthBroadcastReceiver.kt src/contexts/AuthContext.tsx
git commit -m "feat(storage): implement authentic enterprise session caching and PPG biometric telemetry (V-S04)"
```

---

### Task 4: Responsive & Scrollable Welcome Screen (`WelcomeScreen.tsx`)

**Files:**
- Modify: `src/screens/WelcomeScreen.tsx`

**Interfaces:**
- Consumes: Screen navigation, circular display dimensions (`ROUND_INSET`, `CIRCULAR_PADDING_TOP`, `CIRCULAR_PADDING_BOTTOM`).
- Produces: Smoothly scrollable landing page that scales to any screen size without clipping.

- [ ] **Step 1: Wrap `WelcomeScreen.tsx` in `ScrollView` with responsive container style**
Replace outer `View` with `ScrollView`, apply `showsVerticalScrollIndicator={false}`, set `contentContainerStyle` with circular padding, and center the action buttons.

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/screens/WelcomeScreen.tsx
git commit -m "fix(ui): make WelcomeScreen fully responsive and scrollable for circular Wear OS displays"
```

---

### Task 5: Frontend UI Currency & Real-Time Sync Overhaul

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`
- Modify: `src/screens/BalanceScreen.tsx`
- Modify: `src/screens/TransferScreen.tsx`
- Modify: `src/screens/BillsScreen.tsx`
- Modify: `src/screens/CardsScreen.tsx`
- Modify: `src/screens/LoansScreen.tsx`
- Modify: `src/screens/QRPayScreen.tsx`
- Modify: `src/screens/SmartphoneCompanionScreen.tsx`
- Modify: `src/screens/CompanionPairingScreen.tsx`

**Interfaces:**
- Consumes: `UPDATE_BALANCE` events, `new_balance` API responses.
- Produces: 100% IDR formatting (`Rp xxx.xxx.xxx`), instant UI updates on transfer, removal of all mock/simulated text.

- [ ] **Step 1: Update `DashboardScreen.tsx` & `BalanceScreen.tsx`**
Standardize on IDR currency formatting (`Rp`). Wire real-time balance state update when `UPDATE_BALANCE` event arrives.

- [ ] **Step 2: Overhaul `TransferScreen.tsx`**
Add quick recipient selector with the 5 realistic seeded accounts (`NX-7391048` Evelyn, `NX-9201482` Marcus, etc.). Remove "Simulated Transfer" fallback. Upon transfer success, update balance and return to Dashboard.

- [ ] **Step 3: Update `BillsScreen.tsx`, `CardsScreen.tsx`, `LoansScreen.tsx`, `QRPayScreen.tsx`**
Switch amounts to realistic IDR (e.g., PLN Token Rp 100.000, Water Rp 75.000). Remove mock labels.

- [ ] **Step 4: Update `SmartphoneCompanionScreen.tsx` & `CompanionPairingScreen.tsx`**
Default sync balance to realistic IDR amounts (`Rp 50.000.000`). Wire push 2FA with realistic IDR amounts.

- [ ] **Step 5: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/screens/DashboardScreen.tsx src/screens/BalanceScreen.tsx src/screens/TransferScreen.tsx src/screens/BillsScreen.tsx src/screens/CardsScreen.tsx src/screens/LoansScreen.tsx src/screens/QRPayScreen.tsx src/screens/SmartphoneCompanionScreen.tsx src/screens/CompanionPairingScreen.tsx
git commit -m "feat(ui): standardize on IDR currency and bind live balance synchronization across all screens"
```

---

### Task 6: New 5-Pillar Skenario Implementation (V-B04 & V-S04) & Pentest Lab Updates

**Files:**
- Modify: `src/screens/PentestLabScreen.tsx`
- Modify: `backend/server.py`

**Interfaces:**
- Consumes: Wearable 2FA push events, SharedPreferences health telemetry.
- Produces: Interactive researcher inspection for V-B04 and V-S04 in Pentest Lab.

- [ ] **Step 1: Add V-B04 (2FA Push Replay) handler and V-S04 (PPG Health Telemetry) card in `PentestLabScreen.tsx`**
Update Pillar 1 (Storage) to show live SharedPreferences dump of real user session and PPG telemetry. Update Pillar 2 (BLE) with V-B04 replay attack card.

- [ ] **Step 2: Add replayable 2FA authorization endpoint in `backend/server.py`**
Endpoint `/api/wearable/authorize_2fa` that accepts authorization payloads without nonce validation.

- [ ] **Step 3: Commit**
```bash
git add src/screens/PentestLabScreen.tsx backend/server.py
git commit -m "feat(lab): implement V-B04 2FA replay and V-S04 PPG telemetry pentest scenarios"
```

---

### Task 7: Comprehensive Documentation Update (`PANDUAN-DEMO-PENTEST.md`)

**Files:**
- Modify: `PANDUAN-DEMO-PENTEST.md`

**Interfaces:**
- Consumes: Updated account numbers, IDR values, V-B04, V-S04.
- Produces: Accurate, production-grade pentest walkthrough and cheatsheet.

- [ ] **Step 1: Update documentation accounts & currency**
Replace all references to `admin`, `bob`, `alice`, `$`, and `USD` with `alexander.vance`, `NX-8492014`, and Indonesian Rupiah (`Rp`).

- [ ] **Step 2: Add detailed writeups for V-B04 and V-S04**
Document root causes, ADB/cURL/Frida commands, and compliance violations (OJK POJK 11/2022, UU PDP No. 27/2022).

- [ ] **Step 3: Commit**
```bash
git add PANDUAN-DEMO-PENTEST.md
git commit -m "docs: update pentest guide with IDR currency, realistic accounts, and V-B04/V-S04 scenarios"
```

---

### Task 8: Test Suite, Release Compilation & Emulator Verification

**Files:**
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release Aliases: `nexora-wear-release.apk`, `nexora-companion-release.apk`, `nexora-universal-release.apk`

- [ ] **Step 1: Run complete backend test suite**
Run: `python -m unittest discover backend -p "test_*.py"`
Expected: 100% tests PASS.

- [ ] **Step 2: Compile fresh release APK**
Run: `cd android && ./gradlew assembleRelease --no-daemon && cd ..`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Copy to release aliases**
Copy `app-release.apk` to root release aliases.

- [ ] **Step 4: Push and install to emulator**
Execute: `adb -s emulator-5554 push nexora-wear-release.apk /data/local/tmp/nexora.apk && adb -s emulator-5554 shell pm install -r -d -t /data/local/tmp/nexora.apk`
Expected: Success.

- [ ] **Step 5: Launch app and take verification screenshot**
Launch `com.nexorabank.omniwear/.MainActivity` and capture raw screen to confirm scrollable welcome screen and authentic banking UI.

- [ ] **Step 6: Commit and push all changes**
```bash
git push origin main
```

