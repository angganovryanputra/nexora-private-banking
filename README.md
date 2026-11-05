<p align="center">
  <img src="https://raw.githubusercontent.com/angganovryanputra/vulnbank-omniwear-suite/main/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" width="110" alt="VulnBank OmniWear Logo" />
</p>

<h1 align="center">🏦 VulnBank OmniWear Suite</h1>
<h3 align="center">The Enterprise Smartwatch & Wearable Banking Pentest Framework</h3>

<p align="center">
  <em>A state-of-the-art, dual-device wearable banking lab engineered for security researchers, fintech auditors, and penetration testers to evaluate Wear OS and Apple watchOS attack surfaces.</em>
</p>

<p align="center">
  <!-- Release & Build Badges -->
  <a href="https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest"><img src="https://img.shields.io/github/v/release/angganovryanputra/vulnbank-omniwear-suite?color=blue&style=flat-square" alt="Latest Release" /></a>
  <a href="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/release.yml"><img src="https://github.com/angganovryanputra/vulnbank-omniwear-suite/actions/workflows/release.yml/badge.svg" alt="Multi-Platform Build & Release" /></a>
  <img src="https://img.shields.io/badge/Backend-100%25_Air--Gapped_Local-green?style=flat-square" alt="Air-Gapped Local" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="MIT License" />
</p>

<p align="center">
  <!-- Regulatory & Framework Badges -->
  <img src="https://img.shields.io/badge/Compliance-OJK_POJK_11%2F2022-blue?style=flat-square" alt="OJK POJK 11" />
  <img src="https://img.shields.io/badge/Standards-BI_SNAP_QRIS-red?style=flat-square" alt="SNAP QRIS" />
  <img src="https://img.shields.io/badge/Standard-PCI--DSS_v4.0-gold?style=flat-square" alt="PCI-DSS v4.0" />
  <img src="https://img.shields.io/badge/OWASP-Mobile_Top_10_(2024)-orange?style=flat-square" alt="OWASP Mobile Top 10" />
</p>

---

## 🔍 Overview: The Wearable Banking Blind Spot

Most financial institutions assume that smartwatch companion applications are merely passive mirrors of their smartphone counterparts. In reality, modern smartwatches run autonomous operating systems featuring **local unencrypted key-value caches**, **unauthenticated short-range bridge transports**, **unthrottled ergonomic PINs**, **heart-rate/wrist telemetry**, and **interactive notification approval modals**.

Relying solely on traditional mobile penetration tests leaves up to **80% of the smartwatch attack surface unchecked**.

**VulnBank OmniWear** delivers a full-stack, completely **offline (air-gapped)** assessment playground replicating real-world core banking features, security theaters, and realistic dual-device interaction scenarios for:
1. **Google Wear OS Smartwatches** (Android ART / Hermes, AMOLED 480x480 circular UI).
2. **Apple watchOS Smartwatches** (Native SwiftUI, watchOS 9+, WatchConnectivity `WCSession`).
3. **Android & iPhone Companions** (React Native, Attacker & Device Pairing Console).
4. **Air-Gapped Python Relay Backend** (Flask, SQLite3, `0.0.0.0:5000`).

---

## 📦 Official Multi-Platform Releases (1-Click Download)

Pre-compiled release packages are built automatically via CI/CD and available directly in the [**Releases**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases) tab:

| Target Platform | Package File | Hardware Compatibility | Direct Download |
|---|---|---|---|
| ⌚ **Smartwatch Wear OS** | `vulnbank-wear-release.apk` | Galaxy Watch, Pixel Watch, Wear OS 3+ (`arm64-v8a`, `x86_64`) | [📥 Download Wear APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-wear-release.apk) |
| 📱 **Android Smartphone** | `vulnbank-mobile-companion-release.apk` | Android 10+ Physical Phone & Emulator | [📥 Download Companion APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-mobile-companion-release.apk) |
| 🌐 **Universal Android** | `vulnbank-universal-release.apk` | Universal Phone & Smartwatch Hybrid | [📥 Download Universal APK](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-universal-release.apk) |
| 🍏 **Apple iOS (iPhone 11)** | `vulnbank-ios-companion-release.ipa` | iPhone 11 / iOS 15.1+ (Sideload via Sideloadly / AltStore) | [🍏 Download iOS IPA](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/vulnbank-ios-companion-release.ipa) |
| ⌚ **Apple Watch (watchOS)** | `VulnBank-watchOS-Bundle.zip` | Apple Watch Series 9, Ultra (watchOS 9.0+) Native SwiftUI | [⌚ Download watchOS Bundle](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/VulnBank-watchOS-Bundle.zip) |
| 🔒 **Integrity Verification** | `SHA256SUMS.txt` | Cryptographic SHA-256 Checksums for all binaries | [🔒 Download SHA256SUMS](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest/download/SHA256SUMS.txt) |

---

## 🧭 Pilih Panduan Lingkungan Riset Anda (Choose Your Lab)

Dokumentasi telah dipisahkan menjadi dua panduan lingkungan yang komprehensif dan mandiri:

<table width="100%">
  <tr>
    <td width="50%" align="center" valign="top">
      <h3>🤖 Lingkungan 1: Android & Wear OS</h3>
      <p><em>Untuk pengujian smartwatch Wear OS (Galaxy Watch, Pixel Watch) dan smartphone companion Android.</em></p>
      <ul align="left">
        <li>Setup Emulator AVD (Wear OS 480x480 & Phone)</li>
        <li>Setup Perangkat Fisik (via Wi-Fi Debugging ADB)</li>
        <li>Panduan Penggunaan Aplikasi Dummy</li>
        <li>Writeup Lengkap 8 Skenario Pentest Android</li>
        <li>Cheatsheet Perintah ADB & Skrip Frida</li>
      </ul>
      <a href="docs/ANDROID_WEAROS_GUIDE.md"><strong>👉 Buka Panduan Android & Wear OS</strong></a>
    </td>
    <td width="50%" align="center" valign="top">
      <h3>🍏 Lingkungan 2: Apple iOS & watchOS</h3>
      <p><em>Untuk pengujian Apple Watch (Series 9, Ultra, watchOS 9+) dan iPhone 11 fisik / iOS Simulator.</em></p>
      <ul align="left">
        <li>Setup Xcode Simulator (macOS Intel / Apple Silicon)</li>
        <li>Setup iPhone 11 Fisik (Sideloading .IPA via AltStore)</li>
        <li>Panduan Penggunaan Aplikasi Dummy SwiftUI</li>
        <li>Writeup Lengkap 8 Skenario Pentest watchOS</li>
        <li>Koleksi Skrip Frida Khusus watchOS / iOS</li>
      </ul>
      <a href="docs/APPLE_WATCHOS_GUIDE.md"><strong>👉 Buka Panduan Apple watchOS & iOS</strong></a>
    </td>
  </tr>
</table>

---

## 🏛️ Arsitektur Sistem & Relay Nirkabel

Seluruh transmisi event, sinkronisasi saldo nirkabel, dan persetujuan 2FA berjalan melalui mesin relay lokal **100% air-gapped** tanpa dependensi internet:

```
                       ┌────────────────────────────────────────────────────────┐
                       │   Local Machine: Python / Flask Relay (0.0.0.0:5000)   │
                       │   - SQLite3 Persistent Core Banking Ledger             │
                       │   - Real-Time Wearable Event Dispatcher                │
                       │   - SNAP QRIS Merchant POS Simulator                   │
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
│     - Packet Sniffer & QRIS Replay   │                         │     - Packet Sniffer & QRIS Replay   │
│                                      │                         │                                      │
│                 ▲                    │                         │                 ▲                    │
│                 │ (BLE / Relay Sync) │                         │                 │ (WCSession Bridge) │
│                 ▼                    │                         │                 ▼                    │
│  ⌚ Wear OS Smartwatch (AMOLED 480)   │                         │  ⌚ Apple Watch (Native SwiftUI)     │
│     - Glanceable Balance ($999,999)  │                         │     - Glanceable Balance ($999,999)  │
│     - 4-Digit Quick-PIN Dial         │                         │     - 4-Digit Quick-PIN Dial         │
│     - Contactless Dynamic QRIS       │                         │     - Contactless Dynamic QRIS       │
│     - High-Value 2FA Approval Card   │                         │     - High-Value 2FA Approval Card   │
│     - Off-Wrist Lockout Sensor       │                         │     - Off-Wrist Lockout Sensor       │
└──────────────────────────────────────┘                         └──────────────────────────────────────┘
```

---

## ⚡ 3-Minute Quick Start: Menjalankan Backend Lokal

Backend VulnBank dirancang *zero-dependency* menggunakan Python standar dan SQLite3:

```bash
# 1. Clone repositori
git clone https://github.com/angganovryanputra/vulnbank-omniwear-suite.git
cd vulnbank-omniwear-suite/backend

# 2. Pasang library minimal
pip install flask flask-cors

# 3. Jalankan server lokal
python server.py
```

Server akan aktif pada:
- **Localhost:** `http://127.0.0.1:5000`
- **Android Emulator Alias:** `http://10.0.2.2:5000`
- **Perangkat Fisik (Wi-Fi LAN):** `http://<IP_LAPTOP_ANDA>:5000`

---

## ⚖️ Standar Kepatuhan & Regulasi yang Diuji

Setiap kerentanan dalam suite ini dipetakan secara matematis ke standar perbankan aktif:

| Regulasi / Framework | Pasal / Klausul Terkait | Dampak Pelanggaran di VulnBank |
|---|---|---|
| **OJK POJK No. 11/POJK.03/2022** | Pasal 38 & 39 (Kerahasiaan Data Nasabah) | Kredensial, PIN, dan token sesi tersimpan dalam format plaintext di `VulnBankPrefs.xml` dan `UserDefaults.plist`. |
| **OJK POJK No. 11/POJK.03/2022** | Pasal 42 (Pencegahan Serangan Siber) | Perlindungan anti-root dan anti-tamper hanya berada di sisi *client* dan dapat dinetralisir dalam hitungan detik. |
| **Bank Indonesia SNAP QRIS** | PADG No. 24/1/PADG/2022 (Integritas Pesan QRIS) | Token QRIS dinamis tidak memiliki timestamp HMAC TOTP dan tidak memeriksa idempotensi (*Replay Attack*). |
| **PCI-DSS v4.0** | Requirement 3, 4, & 8 (Proteksi Data Pemegang Kartu & Autentikasi) | Transmisi paket nirkabel tanpa enkripsi aplikasi serta PIN 4-digit tanpa pembatasan frekuensi (*rate limiting*). |
| **OWASP Mobile Top 10 (2024)** | M1 (Credential Theft), M3 (Insecure Auth), M5 (Communication), M8 (Tampering) | 14 vektor eksploitasi aktif di seluruh 5 pilar keamanan perbankan wearable. |

---

## 📜 Lisensi & Etika Riset

Framework ini dibuat semata-mata untuk tujuan **riset akademis, pengujian keamanan siber terotorisasi, dan demonstrasi tender pengadaan perbankan**. Dilarang keras menggunakan teknik-teknik dalam framework ini terhadap aplikasi atau infrastruktur tanpa izin tertulis dari pemilik aset.

**Hak Cipta © 2026 Angga Novryan Putra & VulnBank Security Research Team. Berlisensi MIT.**
