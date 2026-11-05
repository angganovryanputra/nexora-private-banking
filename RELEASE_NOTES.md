# 🏦 Nexora OmniWear Suite v1.1.0 — Enterprise Wearable Banking Security Lab
## Multi-Platform Release Notes (Android, Wear OS, Apple iOS & watchOS)

---

### 🌟 Executive Overview & Rebranding
**Nexora OmniWear Suite v1.1.0** introduces a ground-up transformation, retiring generic vulnerable naming conventions in favor of **Nexora Bank** — a distinctive, hyper-realistic tier-1 autonomous digital bank and wearable assessment environment.

Engineered specifically for financial cybersecurity researchers, penetration testers, and regulatory compliance auditors (OJK POJK 11/2022, Bank Indonesia SNAP QRIS, PCI-DSS v4.0), the suite delivers an authentic dual-persona experience: **100% genuine banking aesthetics** for normal users and a **stealth Security Audit Mode** with deep runtime telemetry for security evaluators.

---

### 🚀 Key Enhancements & Business Flow Gaps Resolved

1. **Complete Brand Neutralization & Identifier Migration (`com.nexorabank.omniwear`)**:
   - Replaced all legacy package identifiers with `com.nexorabank.omniwear` across all native Java/Kotlin code, build configurations, and AndroidManifest.
   - Dual-intent filter architecture maintained: accepts both `com.nexorabank.omniwear.*` and `com.vulnerablebankapp.*` intents and deep links (`nexorabank://` and `vulnbank://`) to ensure 100% backward compatibility with existing automated testing scripts.
   - Rebranded app icons with bespoke high-resolution vector-rendered luxury banking iconography (Obsidian base, sapphire glow, dual gold bezel, architectural monogram N, emerald key center) across all Android mipmap densities (`mdpi` to `xxxhdpi`) and iOS asset sets.

2. **WCAG 2.2 Accessibility & Circular Smartwatch Ergonomics**:
   - Enhanced all interactive UI elements with comprehensive accessibility roles (`accessibilityRole="button"`), accessible names, hit slop margins (at least 48x48dp tap target area), and high contrast colors.
   - Screen layouts rewritten with dynamic circular inset calculation (`ROUND_INSET`, `CIRCULAR_PADDING_TOP`, `CIRCULAR_PADDING_BOTTOM`) ensuring zero button clipping or text occlusion on circular Wear OS (480x480 AMOLED) and curved Apple Watch displays.

3. **Core Challenge Functional Gap Fixes**:
   - **Loan Management**: Integrated `/loans/<account_number>` endpoint in `LoansScreen.tsx` and backend, allowing dynamic query and display of pending/approved loans.
   - **Admin Account Management**: Resolved HTTP method mismatch in `AdminScreen.tsx` for account deletion, supporting both `DELETE` and `POST`.
   - **Reset Password Screen**: Completely transformed `ResetPasswordScreen.tsx` into an ergonomically scrollable, accessible interface with instant input validation.
   - **Biometric Health Telemetry**: Refactored `HealthScreen.tsx` to communicate via centralized API helpers with responsive circular safe areas.

4. **Dual-Persona Architecture (Client Banking UI vs. Security Auditor Mode)**:
   - Conspicuous pentest banners have been removed from the primary customer dashboard.
   - The default UI is now an ultra-sleek, prestigious digital banking experience featuring Platinum Private Banking status, masked liquid balance cards, and quick services.
   - Researchers can unlock **Auditor & Pentest Mode** via a discreet easter egg (tapping the security shield or app version 5 times in Profile), granting immediate access to all 14 active exploit vectors, live BLE packet sniffers, and Frida hooking scripts.

2. **Smartwatch ATM Cardless Cash-Out OTP (Tarik Tunai Tanpa Kartu)**:
   - Wearable smartwatch users can now generate a dynamic, 6-digit withdrawal OTP (`token`) directly on their wrist, valid for 5 minutes at any ATM terminal.
   - Simulates realistic ATM cash dispensing and security challenges (CWE-307 / CWE-330 short-entropy brute force).

3. **Smartwatch Emergency Card Kill-Switch (Wrist Freeze)**:
   - Users can instantly freeze or unfreeze their physical/virtual debit cards with a single tap on Wear OS or Apple Watch to mitigate POS or contactless NFC skimming in transit.
   - State synchronizes automatically across phone, smartwatch, and local backend via WCSession / Bluetooth LE packets.

4. **Bank Indonesia SNAP QRIS Harmonization (PADG 24/1/PADG/2022)**:
   - Contactless QR payment screens now follow official Bank Indonesia SNAP QRIS EMVCo specifications with Merchant ID `NMID: ID1020029988112`, dynamic countdown timers (120s), Retrieval Reference Numbers (RRN), and dual currency support (IDR `Rp` / USD `$`).
   - Simulates real-world static token replay attacks (V-W15 / V-AP06).

5. **Cross-Platform Bug Fixes & iOS Build Pipeline Optimization**:
   - Fixed Xcode build failures caused by duplicate vector font bundle copying in CocoaPods.
   - Automated compilation of full-scale `.ipa` installer (`nexora-ios-companion-release.ipa`, ~6.2 MB) ready for sideloading via Sideloadly or AltStore without an Apple Developer subscription.
   - Native Apple watchOS SwiftUI bundle (`Nexora-watchOS-Bundle.zip`) with paired WCSession relay.

---

### 📦 Official Release Binaries

All binaries are compiled, verified, and downloadable directly from [**GitHub Releases**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest):

| Binary Artifact | Platform & Target | Role & Hardware Compatibility |
|---|---|---|
| **`nexora-wear-release.apk`** | ⌚ **Wear OS Smartwatch** | Victim Watch UI: AMOLED 480x480 circular layout, Glanceable Balance, Quick-PIN 3x4, rotating QRIS, & wrist lockout. |
| **`nexora-companion-release.apk`** | 📱 **Android Smartphone** | Attacker Console: Controls BLE sync, injects balances, triggers $50,000 OOB wire transfers, and sniffs relay packets. |
| **`nexora-universal-release.apk`** | 🌐 **Android Universal** | Standalone hybrid binary compatible with both Android smartphones and smartwatches. |
| **`nexora-ios-companion-release.ipa`** | 🍏 **Apple iOS (iPhone 11)** | Native React Native companion for iOS 15.1+ (sideloadable via Sideloadly / AltStore). |
| **`Nexora-watchOS-Bundle.zip`** | ⌚ **Apple watchOS 9+** | Native SwiftUI Watch App (`NexoraWatch`) + WatchBridge for direct deployment via Xcode. |
| **`SHA256SUMS.txt`** | 🔒 **Forensic Checksums** | Cryptographic verification hashes ensuring complete chain of custody integrity. |

*(Note: Legacy file names e.g. `vulnbank-wear-release.apk` remain attached as backwards-compatibility aliases).*

---

### 🛡️ Compliance & Standards Coverage
- **OJK POJK No. 11/POJK.03/2022**: Cyber Resilience & Customer Data Protection in Commercial Banking IT.
- **Bank Indonesia PADG No. 24/1/PADG/2022**: Standar Nasional Open API Pembayaran (SNAP) & Dynamic QRIS.
- **PCI-DSS v4.0**: Requirements 3 & 4 (Protection of Cardholder Data in Storage & Transit).
- **OWASP Mobile Top 10 (2024)**: M1 (Improper Credential Usage), M3 (Insecure Authentication), M5 (Insecure Communication), M8 (Security Misconfiguration), M9 (Insecure Data Storage).
