# Wearable Companion Bridge & Live Dual-Device Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish true cross-device synchronization between the Smartphone Companion app and the Wear OS Smartwatch app over the local pentest backend and local network, eliminating all mocked alert-only placeholders.

**Architecture:** A dual-layer bridge architecture: (1) **Cloud/LAN Relay** via lightweight REST/polling endpoints in `backend/server.py` allowing phone and watch to pair via 6-digit PIN, exchange real-time balance updates, push 2FA approvals, and inject quick payments; (2) **Native Broadcast & Event Hooking** in React Native subscribing to `BluetoothSyncEvent` and `AuthBroadcastReceiver` so incoming actions dynamically re-render the AMOLED watch UI in real time without app restarts.

**Tech Stack:** Python Flask (SQLite), React Native 0.72+, Android Kotlin (`BroadcastReceiver`, `SharedPreferences`), TypeScript.

**Spec:** Requirement from user review regarding whether Universal and Wear OS are truly connected, resolving 6 identified architectural gaps: mock-only companion triggers, lack of cross-device transport, hardcoded UI balance, missing pairing handshake, absence of React Native event listeners, and identical UI presentation on smartphone viewports.

## Global Constraints

- Minimum Android SDK must remain `29` (Android 10+).
- Intentional vulnerabilities must remain fully exploitable for educational pentest demonstrations (OWASP Mobile Top 10 2024 / Pillars 1-5).
- Communication protocol must intentionally lack cryptographic signing (HMAC) and timestamp freshness/nonce verification to preserve V-B01, V-B02, and V-B03 vulnerabilities.
- UI must support both 480x480 circular Wear OS watch displays and rectangular smartphone aspect ratios.

## Review Focus

1. Phone presses "Sync Balance" while Watch is on Dashboard: Watch balance must update on-screen within 2 seconds without user manual refresh.
2. Phone pushes "2FA Alert": Watch must pop up the 2FA Approval Card in real time with the exact amount and merchant from the phone.
3. Watch clicks "Approve 2FA": Phone Companion screen must reflect "Status: Approved" instantly.
4. Smartwatch pairing code `839-201` entered on Phone Companion: Both devices register as paired in `backend/nexora_vault.db`.
5. Packet sniffer endpoint `GET /api/wearable/packets` in backend exposes full unencrypted sync payloads for MITM demonstrations.

---

### Task 1: Backend Wearable Relay & Pairing Endpoints

**Files:**
- Modify: `backend/server.py:80-125` (database schema)
- Modify: `backend/server.py:340-391` (endpoints)
- Test: `backend/test_wearable_relay.py`

**Interfaces:**
- Consumes: `backend/nexora_vault.db` SQLite connection.
- Produces: 
  - `POST /api/wearable/pair` (`{pairing_code, device_name, device_type}`) -> `{status, device_id, paired_account, auth_token}`
  - `POST /api/wearable/dispatch` (`{target_device_id, action, payload}`) -> `{status, event_id}`
  - `GET /api/wearable/events/<device_id>` -> `{events: [...]}`
  - `POST /api/wearable/resolve-event` (`{event_id, resolution, signature}`) -> `{status}`
  - `GET /api/wearable/packets` -> `{packets: [...]}`

- [ ] **Step 1: Write the failing test for backend wearable endpoints**

```python
# backend/test_wearable_relay.py
import unittest
import json
from server import app, init_db

class TestWearableRelay(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = app.test_client()

    def test_pair_and_dispatch_event(self):
        # 1. Pair watch
        pair_res = self.client.post('/api/wearable/pair', json={
            'pairing_code': '839-201',
            'device_type': 'WEAR_OS_WATCH',
            'device_name': 'Pixel Watch 2'
        })
        self.assertEqual(pair_res.status_code, 200)
        data = pair_res.get_json()
        device_id = data['device_id']
        self.assertEqual(data['paired_account'], 'ADMIN001')

        # 2. Dispatch balance update from phone
        dispatch_res = self.client.post('/api/wearable/dispatch', json={
            'target_device_id': device_id,
            'action': 'UPDATE_BALANCE',
            'payload': {'amount': 777888.0, 'currency': 'USD'}
        })
        self.assertEqual(dispatch_res.status_code, 200)
        event_id = dispatch_res.get_json()['event_id']

        # 3. Poll events on watch
        poll_res = self.client.get(f'/api/wearable/events/{device_id}')
        self.assertEqual(poll_res.status_code, 200)
        events = poll_res.get_json()['events']
        self.assertTrue(any(e['id'] == event_id for e in events))

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend/test_wearable_relay.py`
Expected: FAIL with 404 Not Found for `/api/wearable/pair`

- [ ] **Step 3: Implement wearable relay tables and routes in `backend/server.py`**

Add `wearable_devices` table (`id, device_id, device_type, device_name, pairing_code, paired_account, last_seen`) and `wearable_events` table (`id, target_device_id, action, payload, status, created_at`).
Implement the 5 REST routes with unauthenticated, intentionally vulnerable payload logging.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest backend/test_wearable_relay.py`
Expected: Ran 1 test, OK.

---

### Task 2: React Native API Client Extensions & Dynamic Balance Hook

**Files:**
- Modify: `src/utils/api.ts`
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/screens/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `ENDPOINTS` from `src/utils/api.ts`.
- Produces:
  - `ENDPOINTS.wearablePair`
  - `ENDPOINTS.wearableDispatch`
  - `ENDPOINTS.wearableEvents(deviceId)`
  - `ENDPOINTS.wearableResolveEvent`
  - Dynamic `balance` state in `DashboardScreen.tsx` updated via `DeviceEventEmitter` and periodic sync polling.

- [ ] **Step 1: Write type definitions and endpoint contracts in `src/utils/api.ts`**

Add endpoints for wearable pairing and event polling to `ENDPOINTS` object.
Add helper functions `pairWearableDevice()`, `dispatchWearableAction()`, `pollWearableEvents()`, and `resolveWearableEvent()`.

- [ ] **Step 2: Connect `DashboardScreen.tsx` to live balance and `DeviceEventEmitter`**

Replace hardcoded `'$999,999.00'` in `DashboardScreen.tsx` with dynamic state `currentBalance`.
Add `DeviceEventEmitter.addListener('BluetoothSyncEvent', (event) => ...)` to update balance instantly when BLE sync or ADB broadcast fires.
Add lightweight 3-second background polling against `/api/wearable/events/<deviceId>` when logged in, popping up 2FA approval modal or updating balance dynamically.

- [ ] **Step 3: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: No type errors.

---

### Task 3: Smartphone Companion Screen Operationalization

**Files:**
- Modify: `src/screens/SmartphoneCompanionScreen.tsx`
- Modify: `src/screens/CompanionPairingScreen.tsx`

**Interfaces:**
- Consumes: `pairWearableDevice` and `dispatchWearableAction` from `src/utils/api.ts`.
- Produces: Live trigger dispatch that sends real HTTP/BLE payloads to the watch via the backend relay and Android local broadcast.

- [ ] **Step 1: Wire "Sync Balance to Watch" in `SmartphoneCompanionScreen.tsx`**

Make `handleSyncBalanceToWatch()` send an actual POST request to `/api/wearable/dispatch` with action `UPDATE_BALANCE` and amount `888888.0`. Also invoke local Android broadcast if running on same device.

- [ ] **Step 2: Wire "Push 2FA Alert" in `SmartphoneCompanionScreen.tsx`**

Make `handlePush2FAToWatch()` send a POST request with action `PUSH_2FA` containing merchant `CyberStore`, amount `250.00`, and OTP `992104`. Display pending status until watch approves/denies.

- [ ] **Step 3: Wire "Quick Pay Hijack" in `SmartphoneCompanionScreen.tsx`**

Make `handleInjectTransfer()` dispatch action `QUICK_PAY` with recipient `HACKER_CORP` and amount `50000.0`.

- [ ] **Step 4: Update `CompanionPairingScreen.tsx` to register real device ID**

Generate or store a persistent device UUID in `AsyncStorage`. Send pairing request to backend so both smartphone and smartwatch know their peer device IDs.

- [ ] **Step 5: Run TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: Clean pass with 0 errors.

---

### Task 4: Responsive Viewport Adaptation (Phone vs Round Watch)

**Files:**
- Modify: `src/styles/globalStyles.ts`
- Modify: `src/screens/SmartphoneCompanionScreen.tsx`
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `Dimensions.get('window')` from `react-native`.
- Produces: Conditional layout padding (`isWatch` check: width <= 480 && height <= 480 vs Phone aspect ratio: height > 600).

- [ ] **Step 1: Add dynamic device viewport detection in `globalStyles.ts`**

Export `IS_WATCH_VIEWPORT = SCREEN_WIDTH <= 480 && SCREEN_HEIGHT <= 520`.
Adapt `ROUND_INSET` to `0` on rectangular smartphone displays and preserve circular inset on 480x480 Wear OS devices.

- [ ] **Step 2: Adapt `SmartphoneCompanionScreen.tsx` for full phone view**

Remove watch-constrained circular margins when running on phone screens, providing comfortable cards, live event log console, and device status indicators.

---

### Task 5: Master Panduan & Verification Build

**Files:**
- Modify: `PANDUAN-DEMO-PENTEST.md`
- Compile: Release APK deliverables via `./gradlew assembleRelease`

- [ ] **Step 1: Update `PANDUAN-DEMO-PENTEST.md` with Live Dual-Device Testing Steps**

Document step-by-step instructions for:
1. Setting up Phone on Wi-Fi and Watch on Emulator.
2. Linking via Pairing Code `839-201`.
3. Demonstrating live Balance tampering without touching the watch.
4. Demonstrating live 2FA authorization interception and bypass.

- [ ] **Step 2: Build release APKs and verify badging**

Run: `cd android && ./gradlew assembleRelease`
Verify all 3 APK deliverables in root directory.

