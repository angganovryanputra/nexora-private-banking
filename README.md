<p align="center">
  <img src="https://raw.githubusercontent.com/angganovryanputra/vulnbank-omniwear-suite/main/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" width="110" alt="VulnBank OmniWear Logo" />
</p>

<h1 align="center">🏦 VulnBank OmniWear</h1>
<h3 align="center">The Enterprise Smartwatch & Wearable Banking Pentest Framework</h3>

<p align="center">
  <em>An intentionally vulnerable, dual-device banking ecosystem engineered for security researchers, CISO audit teams, and penetration testers to evaluate Wear OS and Apple watchOS attack surfaces.</em>
</p>

<p align="center">
  <!-- Platform Badges -->
  <img src="https://img.shields.io/badge/Platform-Wear_OS_480x480-4285F4?style=for-the-badge&logo=android&logoColor=white" alt="Wear OS" />
  <img src="https://img.shields.io/badge/Platform-Apple_watchOS_9%2B-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Apple watchOS" />
  <img src="https://img.shields.io/badge/Companion-Android_%26_iPhone_11-3DDC84?style=for-the-badge&logo=react&logoColor=white" alt="Companion" />
</p>

<p align="center">
  <!-- CI/CD Badges -->
  <a href="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/build-android-apk.yml"><img src="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/build-android-apk.yml/badge.svg" alt="Build Android & Wear OS APKs" /></a>
  <a href="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/build-watchos.yml"><img src="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/build-watchos.yml/badge.svg" alt="Build iOS & Apple WatchOS" /></a>
</p>

<p align="center">
  <!-- Standards Badges -->
  <img src="https://img.shields.io/badge/Compliance-OJK_POJK_11%2F2022-blue?style=flat-square" alt="OJK POJK 11" />
  <img src="https://img.shields.io/badge/Standards-BI_SNAP_QRIS-red?style=flat-square" alt="SNAP QRIS" />
  <img src="https://img.shields.io/badge/Standard-PCI--DSS_v4.0-gold?style=flat-square" alt="PCI-DSS v4.0" />
  <img src="https://img.shields.io/badge/OWASP-Mobile_Top_10_(2024)-orange?style=flat-square" alt="OWASP" />
  <img src="https://img.shields.io/badge/Backend-100%25_Air--Gapped_Local-green?style=flat-square" alt="Air-Gapped Local" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="MIT License" />
</p>

---

## 🔍 Overview: The Wearable Banking Blind Spot

Most financial institutions assume that smartwatch companion applications are merely passive mirrors of their smartphone counterparts. In reality, modern smartwatches run autonomous operating systems featuring **local unencrypted key-value caches**, **unauthenticated short-range bridge transports**, **unthrottled ergonomic PINs**, **heart-rate/wrist telemetry**, and **interactive notification approval modals**.

Relying solely on traditional mobile penetration tests leaves up to **80% of the smartwatch attack surface unchecked**.

**VulnBank OmniWear** delivers a full-stack, completely **offline (air-gapped)** assessment playground replicating real-world core banking features, security theaters, and realistic dual-device interaction scenarios for:
1. **Google Wear OS Smartwatches** (Android ART / Hermes, AMOLED 480x480 circular UI).
2. **Apple watchOS Smartwatches** (Native SwiftUI, watchOS 9+, WatchConnectivity `WCSession`).
3. **Android & iPhone Companions** (React Native, Attacker & Device Pairing Console).
4. **Air-Gapped Python Relay Backend** (Flask, SQLite3, 0.0.0.0:5000).

---

## 🏛️ System Architecture

All traffic, bridge events, and device synchronization are routed through your local development machine with **zero external internet dependencies**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │   Local Machine: Python / Flask Relay (0.0.0.0:5000)   │
                       │   - Device Registry & Token Store (SQLite3)            │
                       │   - Real-Time Wearable Event Dispatcher                │
                       │   - CISO Regulatory Audit Engine                       │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                  ┌────────────────────────────────┴────────────────────────────────┐
                  ▼                                                                 ▼
┌──────────────────────────────────────┐                         ┌──────────────────────────────────────┐
│       ANDROID / WEAR OS SUITE        │                         │        APPLE / WATCHOS SUITE         │
│                                      │                         │                                      │
│  📱 Android Smartphone (Companion)   │                         │  📱 iPhone 11 / Simulator (iOS)      │
│     - Attacker Control Center        │                         │     - Attacker Control Center        │
│     - Trigger $50,000 2FA Push       │                         │     - Native WatchBridge (Swift/ObjC)│
│     - Sniff BLE Sync Packets         │                         │     - Dispatch WCSession Events      │
│                 │                    │                         │                 │                    │
│                 ▼ Bluetooth LE / HTTP│                         │                 ▼ WCSession Messaging│
│  ⌚ Wear OS Smartwatch (480x480)     │                         │  ⌚ Apple Watch (SwiftUI Target)     │
│     - Circular AMOLED Glanceable UI  │                         │     - Responsive 40mm to 49mm Ultra  │
│     - Fast 4-Digit Quick-PIN Dial    │                         │     - Unthrottled Quick-PIN Dial     │
│     - Dynamic Rotating SNAP QRIS     │                         │     - Dynamic Rotating SNAP QRIS     │
│     - Wrist-Off Sensor Lockout       │                         │     - Wrist-Off Sensor Telemetry     │
└──────────────────────────────────────┘                         └──────────────────────────────────────┘
```

---

## 📦 Official Multi-Platform Releases (Instant Download)

Pre-compiled release packages are published directly to the repository's [**Releases**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases) section:

| Platform / Target | Package Name | Target Hardware | 1-Click Download |
|---|---|---|---|
| **Smartwatch Wear OS** | `vulnbank-wear-release.apk` | Galaxy Watch, Pixel Watch, Wear OS 3+ (`arm64-v8a`, `x86_64`) | [📥 Download Wear APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-wear-release.apk) |
| **Android Smartphone** | `vulnbank-mobile-companion-release.apk` | Android 10+ Physical Phone & Emulator | [📥 Download Companion APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-mobile-companion-release.apk) |
| **Universal Android** | `vulnbank-universal-release.apk` | Universal Phone & Smartwatch Hybrid | [📥 Download Universal APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-universal-release.apk) |
| **Apple iOS (iPhone 11)** | `vulnbank-ios-companion-release.ipa` | iPhone 11 / iOS 15.1+ (Sideload via AltStore / Sideloadly) | [🍏 Download iOS IPA](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-ios-companion-release.ipa) |
| **Apple Watch (watchOS)** | `VulnBank-watchOS-Bundle.zip` | Apple Watch Series 9, Ultra (watchOS 9.0+) Native SwiftUI | [⌚ Download watchOS Bundle](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/VulnBank-watchOS-Bundle.zip) |
| **Integrity Verification** | `SHA256SUMS.txt` | Cryptographic SHA-256 Checksums | [🔒 Download SHA-256 Checksums](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/SHA256SUMS.txt) |

---

## ⚡ 5-Minute Quick Start

### 1. Start the Air-Gapped Local Backend
Clone the repository and launch the local Flask relay:
```bash
git clone https://github.com/angganovryanputra/vulnbank-omniwear-suite.git
cd vulnbank-omniwear-suite/backend

# Install minimal requirements
pip install flask flask-cors

# Start server on 0.0.0.0:5000
python server.py
```

### 2. Run Android / Wear OS Assessment
Install the APKs via ADB:
```bash
# Install to Wear OS Emulator or Physical Watch:
adb -s <WATCH_DEVICE_ID> install -r vulnbank-wear-release.apk

# Install to Android Phone or Emulator:
adb -s <PHONE_DEVICE_ID> install -r vulnbank-mobile-companion-release.apk
```
📖 *Complete step-by-step instructions:* **[`PANDUAN-DEMO-PENTEST.md`](PANDUAN-DEMO-PENTEST.md)**

### 3. Run Apple watchOS & iPhone Assessment (MacBook / Simulator)
```bash
cd ios
pod install --repo-update
open VulnerableBankApp.xcworkspace
```
Select **`iPhone 15 + Apple Watch Series 9`** paired simulator and press **`Cmd + R`**.
📖 *Complete step-by-step instructions:* **[`TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`](TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md)**

---

## 🎯 Vulnerability Matrix & Compliance Mapping

VulnBank OmniWear features **14 educational vulnerability challenges** mapped to official regulatory standards:

| Vuln ID | Title / Vulnerability Class | Wear OS Specimen | Apple watchOS Specimen | OJK POJK 11/2022 | Bank Indonesia SNAP QRIS | PCI-DSS v4.0 |
|---|---|---|---|---|---|---|
| **V-01** | Insecure Local Storage | Plaintext SharedPreferences | Plaintext `UserDefaults.standard` | Pasal 19 & 20 | N/A | Req 3.5 |
| **V-02** | Unencrypted Bridge Transport | Plaintext BLE Broadcast | Plaintext `WCSession` Dictionary | Pasal 24 | N/A | Req 4.1 |
| **V-03** | Weak Secondary Authentication | Unthrottled 4-Digit Quick-PIN | Keypad without Hardware Delay | Pasal 21 | N/A | Req 8.3 |
| **V-04** | High-Value 2FA Push Hijack | Unauthenticated Wear Push Modal | Unsigned Interactive 2FA Modal | Pasal 22 | N/A | Req 8.4 |
| **V-05** | Sensor / Telemetry Spoofing | Spoofed Heartbeat / Wrist Off | Swizzled `WKInterfaceDevice` | Pasal 20 | N/A | Req 8.2 |
| **V-06** | Contactless Payment Replay | Dynamic QRIS Replay Attack | Dynamic QRIS Static ID Replay | Pasal 24 | Bab IV Butir 3 | Req 6.5 |
| **V-07** | Remote Balance Injection | Unauthenticated BLE Injection | Unauthenticated Bridge Sync | Pasal 24 | N/A | Req 6.5 |
| **V-08** | Client-Side Security Theater | Trivial SSL Pinning Bypass | Trivial ATS / Root Bypass | Pasal 18 | N/A | Req 11.4 |

---

## 🔬 Featured Skenario Walkthroughs

```carousel
![Quick-PIN Dial](https://img.shields.io/badge/Scenario_01-Fast_Quick--PIN_Brute--Force-F59E0B?style=for-the-badge)
<!-- slide -->
![High-Value 2FA](https://img.shields.io/badge/Scenario_02-High--Value_$50,000_2FA_Hijack-EF4444?style=for-the-badge)
<!-- slide -->
![Dynamic QRIS](https://img.shields.io/badge/Scenario_03-Dynamic_QRIS_Payment_Replay-10B981?style=for-the-badge)
<!-- slide -->
![Wrist Lockout](https://img.shields.io/badge/Scenario_04-Wrist--Off_Sensor_Lockout_Bypass-6366F1?style=for-the-badge)
```

1. **High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack:**
   Pushed from the Smartphone Companion console. Smartwatch vibrates and displays an emergency alert. Tapping **"APPROVE"** transmits authorization without hardware biometric signature verification.
2. **Contactless Dynamic SNAP QRIS Replay Attack:**
   Capturing dynamic payment QR codes displayed on the watch screen. The static transaction payload is replayed after countdown expiry and accepted by the merchant backend.
3. **Wrist-Off Sensor Lockout Spoofing via Frida:**
   Removing the watch triggers a visual `DEVICE LOCKED` screen. Hooking `WKInterfaceDevice.isWristDetectEnabled` or client flags immediately restores active session balance access.
4. **CISO Executive Scorecard:**
   One-tap in-app automated compliance assessment scoring the wearable against Bank Indonesia and OJK regulatory audit mandates.

---

## 🛠️ Frida Instrumentation Cheatsheet

Inspect bridge packets and bypass client controls on either platform:

```javascript
/* Hooking Apple watchOS WCSession messaging */
if (ObjC.available) {
    var WCSession = ObjC.classes.WCSession;
    Interceptor.attach(WCSession['- sendMessage:replyHandler:errorHandler:'].implementation, {
        onEnter: function (args) {
            console.log("\n[+] Intercepted WCSession Packet:");
            console.log("    📦 " + new ObjC.Object(args[2]).toString());
        }
    });
}

/* Hooking Android SharedPreferences on Wear OS */
Java.perform(function() {
    var SharedPreferencesImpl = Java.use("android.app.SharedPreferencesImpl");
    SharedPreferencesImpl.getString.overload("java.lang.String", "java.lang.String").implementation = function(k, v) {
        var ret = this.getString(k, v);
        if (k.indexOf("token") !== -1 || k.indexOf("pin") !== -1) {
            console.log("[!] SharedPreferences Access: " + k + " = " + ret);
        }
        return ret;
    };
});
```

---

## 📖 Complete Documentation & Assessment Guides

- 📘 **[`PANDUAN-DEMO-PENTEST.md`](PANDUAN-DEMO-PENTEST.md)**: Master demonstration guide for Android & Wear OS Dual-Device testing, with step-by-step reproduction and POC screenshot references (`POC-1A` to `POC-8B`).
- 🍎 **[`TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`](TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md)**: Dedicated setup guide for MacBook Pro 2019 (Intel), Xcode paired simulators, Sideloadly iPhone 11 installation, and 8 Apple watchOS writeups (`POC-AP-1A` to `POC-AP-8B`).
- ⚡ **[`ADVANCED_SCENARIOS_TENDER.md`](docs/references/ADVANCED_SCENARIOS_TENDER.md)**: Enterprise assessment pitch and scoring rubric for procurement tenders.
- 🔗 **[`CONNECTIVITY_GUIDE.md`](docs/references/CONNECTIVITY_GUIDE.md)**: Network relay configuration notes for real hardware and Wi-Fi adapters.
- 📝 **[`README-WEAR.md`](docs/references/README-WEAR.md)**: Engineering notes from initial Wear OS port.

---

## 🤝 Contributing

Contributions to expand smartwatch security testbeds are warmly welcomed!
1. Fork this repository.
2. Create your feature branch (`git checkout -b feature/new-wearable-vuln`).
3. Commit your changes (`git commit -m 'feat: add NFC emulation attack challenge'`).
4. Push to the branch (`git push origin feature/new-wearable-vuln`).
5. Open a Pull Request.

---

## ⚠️ Disclaimer

*VulnBank OmniWear is created strictly for authorized educational research, security testing, and training purposes. The authors assume no liability for misuse or damage caused by the tools, techniques, or code provided within this repository. Always obtain explicit authorization before assessing target networks or devices.*

---

<p align="center">
  <b>Developed for Advanced Wearable Security Research & Penetration Testing</b><br />
  Maintained by <a href="https://github.com/angganovryanputra">@angganovryanputra</a>
</p>
