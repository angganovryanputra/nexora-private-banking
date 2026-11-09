# 🏦 Nexora OmniWear Suite v1.3.0 — Enterprise Wearable Banking Security Lab
## Multi-Platform Release Notes (Apple iOS & watchOS Full Parity, Android, & Wear OS)

---

### 🌟 Executive Overview & Release v1.3.0 Highlights
**Nexora OmniWear Suite v1.3.0** is a landmark milestone, introducing complete multi-platform parity between the Android/Wear OS ecosystem and the Apple iOS/watchOS banking environment. 

Designed specifically for tier-1 financial cybersecurity researchers, penetration testers, and regulatory compliance evaluators (**OJK POJK 11/POJK.03/2022**, **Bank Indonesia SNAP QRIS PADG 24/1/PADG/2022**, and **PCI-DSS v4.0**), this release establishes an authentic, dual-persona private banking application (`com.nexorabank.omniwear`) with deep runtime telemetry, interactive audit controls, and turnkey exploit automation scripts.

---

### 🚀 Key Capabilities in v1.3.0

#### 1. Native Apple watchOS 1:1 Banking Parity (`NexoraWatch`)
- **SwiftUI Native Client**: Custom-engineered for Apple Watch Ultra (49mm), Series 8/9/10 (41mm/45mm), and SE (40mm/44mm) with authentic private banking obsidian/sapphire/gold aesthetics (`WatchTheme.swift`).
- **Core Banking Modules**:
  - **Live Balance Dashboard**: Real-time balance display (`Alexander Vance`, default `Rp 888.888.000`), dynamic account masking (`NX-••••048`), and live synchronization with core SQLite ledger (`backend/nexora_vault.db`).
  - **Contactless Dynamic SNAP QRIS**: Bank Indonesia PADG 24/1/PADG/2022 compliant EMVCo payload with National Merchant ID (`NMID: ID1020021189360`), 60s countdown timer, and intentional static replay vulnerability (V-AP06).
  - **4-Digit Quick-PIN Keypad**: Haptic-responsive 3x4 layout scaling dynamically across small and large watch cases with demo autofill.
  - **ATM Cardless Cash-Out**: Generates 6-digit one-time cash tokens with live 15-minute expiration countdown and standalone double-dispense race condition demonstration (V-L04).
  - **Emergency Virtual Card Freeze**: Wrist kill-switch for debit cards with real-time optimistic desynchronization simulation (V-W09).
  - **High-Value Out-of-Band 2FA Modal**: Rp 50.000.000 wire transfer approval prompt with Evelyn Sterling recipient mapping (V-AP04).
  - **Dual-Mode Network Architecture**: Inter-device Bluetooth LE sync via `WCSession` or direct standalone Wi-Fi HTTP queries (`WatchNetworkManager.swift`).

#### 2. Dual Pentest Track Architecture (Track A & Track B)
- **Track A (Standalone Apple Watch + Mac Laptop — 100% Without iPhone)**:
  - Complete operational independence for researchers using Xcode Simulator or physical Apple Watch directly against backend.
  - Custom URL Scheme deep-linking (`nexorabank://account?num=...`) allowing instant PIN bypass and BOLA/IDOR balance peeking (V-AP07).
  - Runtime memory swizzling hooks (`@objc dynamic isWristAttachedToBody` and `verifyPin:`) for LLDB and Frida over USB.
- **Track B (Paired Dual-Device — Apple Watch + iPhone 11 Companion)**:
  - Native Objective-C/Swift bridge (`WatchBridge.m` / `WatchBridge.swift`) implementing `WCSessionDelegate`.
  - TypeScript inter-device communication layer (`src/utils/watchOSBridge.ts`) driving live push events from the companion app.

#### 3. Publication-Grade 8-Part Master Pentest Writeup
- Full documentation in [`docs/APPLE_WATCHOS_GUIDE.md`](file:///docs/APPLE_WATCHOS_GUIDE.md) covering all 11 enterprise scenarios:
  1. **V-AP02**: Plaintext Dictionary WCSession Interception & Replay (`CVSS:4.0 Score: 8.8`)
  2. **V-AP01**: UserDefaults Plist Storage & Keychain Bypass (`CVSS:4.0 Score: 7.8`)
  3. **V-AP03**: Unthrottled Quick-PIN 4-Digit Brute-Force (`CVSS:4.0 Score: 7.5`)
  4. **V-AP04**: High-Value (Rp 50.000.000) 2FA Wire Transfer Hijack (`CVSS:4.0 Score: 8.7`)
  5. **V-AP05**: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (`CVSS:4.0 Score: 7.2`)
  6. **V-AP06**: Contactless Dynamic SNAP QRIS Static Replay (`CVSS:4.0 Score: 7.7`)
  7. **V-B01 / V-AP07**: Remote Balance Injection & Standalone IDOR (`CVSS:4.0 Score: 8.6`)
  8. **V-L04**: ATM Cardless Cash-Out Race Condition & Double Dispense (`CVSS:4.0 Score: 8.2`)
  9. **V-W09**: Emergency Wrist Card Kill-Switch Desynchronization (`CVSS:4.0 Score: 6.9`)
  10. **V-07**: Client-Side iOS Jailbreak Detection Bypass (`CVSS:4.0 Score: 6.5`)
  11. **GOV-01**: CISO Regulatory Compliance & Governance Assessment (`Score: 24/100`)

#### 4. Turnkey Exploit Tooling Suite (`scripts/`)
- `scripts/frida_sniff_wcsession.js`: Dynamic WCSession packet sniffer and in-memory balance tampering injector.
- `scripts/frida_bypass_wrist.js`: Automated Objective-C method swizzling script for wrist-off auto-lockout evasion.
- `scripts/exploit_double_dispense.py`: Multi-threaded Python exploit targeting the ~60ms TOCTOU race window for ATM cash withdrawal.
- `scripts/trigger_2fa_push.py`: CLI dispatcher to trigger an unauthenticated Rp 50.000.000 wire transfer prompt on the watch face.

---

### 📦 Official Release Binaries & Artifacts

All binaries are compiled, verified, and downloadable directly from [**GitHub Releases**](https://github.com/angganovryanputra/nexora-private-banking/releases/latest):

| Binary Artifact | Platform & Target | Role & Hardware Compatibility |
|---|---|---|
| **`nexora-wear-release.apk`** | ⌚ **Wear OS Smartwatch** | AMOLED circular banking UI: Balance glance, Quick-PIN 3x4, SNAP QRIS, & Wrist Lockout. |
| **`nexora-companion-release.apk`** | 📱 **Android Smartphone** | Companion attacker & auditor console: BLE sync, balance injection, and 2FA trigger. |
| **`nexora-universal-release.apk`** | 🌐 **Android Universal** | Standalone hybrid APK compatible with both Android smartphones and smartwatches. |
| **`nexora-ios-companion-release.ipa`** | 🍏 **Apple iOS (iPhone 11)** | React Native iOS Companion for iOS 15.1+ (sideloadable via Sideloadly / AltStore). |
| **`Nexora-watchOS-Bundle.zip`** | ⌚ **Apple watchOS 9+** | Native SwiftUI Watch App (`NexoraWatch`) + WatchBridge for turnkey Xcode deployment. |
| **`SHA256SUMS.txt`** | 🔒 **Forensic Checksums** | Unified cryptographic SHA-256 verification hashes for chain of custody integrity. |

---

### 🛡️ Compliance & Standards Coverage
- **OJK POJK No. 11/POJK.03/2022**: Cyber Resilience & Customer Data Protection in Commercial Banking IT.
- **Bank Indonesia PADG No. 24/1/PADG/2022**: Standar Nasional Open API Pembayaran (SNAP) & Dynamic QRIS.
- **PCI-DSS v4.0**: Requirements 3, 4, 6, & 8 (Protection of Cardholder Data, Strong Cryptography, & Secure State).
- **NIST SP 800-63B**: Memorized Secret Authenticators & Multi-Factor Authentication.
