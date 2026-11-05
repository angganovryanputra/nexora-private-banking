# 🍏 Comprehensive Security Research Guide: Apple iOS & watchOS
## Nexora OmniWear — Apple Ecosystem Banking Security Assessment Lab
### Compliance Standards: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Table of Contents
1. [Architecture & Apple Binary Specifications](#1-architecture--apple-binary-specifications)
2. [Lab Setup Using Xcode Simulator (MacBook Intel / Apple Silicon)](#2-lab-setup-using-xcode-simulator-macbook-intel--apple-silicon)
3. [Lab Setup Using Physical Devices (Real iPhone 11 & Apple Watch)](#3-lab-setup-using-physical-devices-real-iphone-11--apple-watch)
4. [Authentic Dummy Banking Application User Flow](#4-authentic-dummy-banking-application-user-flow)
5. [Master Writeup: 8 Apple iOS & watchOS Pentest Scenarios](#5-master-writeup-8-apple-ios--watchos-pentest-scenarios)
   - [Scenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)](#scenario-1-plaintext-dictionary-wcsession-interception--replay-v-ap02)
   - [Scenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)](#scenario-2-userdefaults-plist-insecure-storage--keychain-bypass-v-ap01)
   - [Scenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Memory Exfiltration (V-AP03)](#scenario-3-unthrottled-quick-pin-4-digit-brute-force--memory-exfiltration-v-ap03)
   - [Scenario 4: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)](#scenario-4-high-value-50000-out-of-band-2fa-wire-transfer-hijack-v-ap04)
   - [Scenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)](#scenario-5-sensor-wrist-off-lockout-spoofing--heart-rate-leak-v-ap05)
   - [Scenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)](#scenario-6-contactless-dynamic-snap-qris-static-replay-v-ap06)
   - [Scenario 7: Remote Balance Injection via Insecure WatchBridge (V-B01)](#scenario-7-remote-balance-injection-via-insecure-watchbridge-v-b01)
   - [Scenario 8: CISO Governance & Audit Compliance Assessment (POJK 11 / PCI-DSS v4.0)](#scenario-8-ciso-governance--audit-compliance-assessment-pojk-11--pci-dss-v40)
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
│  - High-Value 2FA Approval Modal ($50,000 Transfer)         │
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
│       - Liquid Balance: $999,999.00 / Rp 99.999.000    │
│       - PPG Heart Rate: 74 BPM                         │
│       - WCSession Sync: Active                         │
│         │                                              │
│         ├─► [SNAP QRIS Pay] ──► Merchant QR Barcode    │
│         │                        NMID & 120s Timer     │
│         │                                              │
│         ├─► [Audit Lab] ──────► 14 Exploit Vectors     │
│         │                        Frida Sniffer Active  │
│         │                                              │
│         └─► [High-Value 2FA] ─► $50,000 Wire Approval  │
│                                  Haptic Dialog Modal   │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 5. Master Writeup: 8 Apple iOS & watchOS Pentest Scenarios

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
  Inject an arbitrary balance (`$13,370,000.00`) directly into Apple Watch memory via Frida:
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

### Scenario 4: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.7)
- **Vulnerability Standard**: CWE-287 (Improper Authentication), CWE-345 (Insufficient Verification)
- **Description**:
  Approving a $50,000 international wire transfer on Apple Watch sends a bare dictionary `{"action": "APPROVE_2FA", "tx_id": ...}` without Secure Enclave biometric validation (`LocalAuthentication.LAContext`).
- **Root Cause Code** ([`ios/NexoraWatch/TwoFactorApprovalView.swift`](file:///ios/NexoraWatch/TwoFactorApprovalView.swift#L50-L68)):
  ```swift
  Button(action: {
      sessionManager.send2FAResolution(txId: tx["tx_id"] as? String ?? "", approved: true)
  }) {
      Text("APPROVE") // Lacks LAContext biometric prompt
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

### Scenario 8: CISO Governance & Audit Compliance Assessment (POJK 11 / PCI-DSS v4.0)
- **Severity**: **HIGH** (Regulatory Compliance Failure)
- **Summary**:
  1. **POJK 11/POJK.03/2022 Article 25**: "Banks must ensure end-point security on customer IT devices." (Failed: Cleartext Plist storage).
  2. **Bank Indonesia PADG 24/1/PADG/2022**: "Dynamic QRIS technical specifications." (Failed: Replayable static token).
  3. **PCI-DSS v4.0 Req 3.4 & 4.1**: "Protect cardholder data in storage and transit." (Failed: Unencrypted WCSession sync).

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
| **V-AP04** | OOB $50k Transfer Hijack | Fraudulent wire transfer authorization. | POJK 11/2022 Pasal 31 (MFA) | Require biometric authorization via `LAContext` and Secure Enclave asymmetric signature. |
| **V-AP05** | Wrist-Off Sensor Spoofing | Stolen watch remains usable off-wrist. | ISO 27001 A.8.1, POJK 11/2022 | Validate wrist status via native hardware queries verified on backend. |
| **V-AP06** | Dynamic QRIS Replay | Replayable merchant checkout tokens. | SNAP PADG 24/1/PADG/2022 | Implement 60-second TOTP nonce freshness and backend HMAC signature validation. |
