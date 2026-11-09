# 🍎 Build & Run — iOS App + Apple Watch (watchOS) Setup Guide

Panduan komprehensif implementasi, build, dan debugging **Nexora OmniWear** di iOS Simulator, Apple Watch Simulator, serta perangkat fisik iPhone dan Apple Watch melalui Apple Xcode.

> ⚠️ **Wajib macOS + Xcode:** Toolchain iOS/watchOS membutuhkan macOS 14+ (Sonoma) atau macOS 15+ (Sequoia) dengan Xcode 15+ / 16+.

---

## 1. Prasyarat Sistem & Toolchain (di macOS)

Pastikan dependensi sistem berikut terinstal pada Mac Anda (mendukung Apple Silicon M1/M2/M3/M4 maupun Intel Core i7/i9):

1. **Xcode & SDKs**:
   - Xcode 15.0+ atau Xcode 16.0+ (tersedia di Mac App Store).
   - SDK iOS 17/18 dan watchOS 10/11 (**Xcode** → **Settings** → **Platforms**).
   - Xcode Command Line Tools:
     ```bash
     xcode-select --install
     sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
     ```
2. **Ruby & Build Gems**:
   - CocoaPods & `xcodeproj` gem (dibutuhkan untuk otomasi integrasi target watchOS):
     ```bash
     sudo gem install cocoapods xcodeproj
     ```
3. **JavaScript & Python Runtimes**:
   - Node.js ≥ 18 (LTS), npm/Yarn, dan Watchman:
     ```bash
     brew install watchman
     node --version # >= v18.0.0
     ```
   - Python 3.10+ (untuk core banking backend):
     ```bash
     python3 --version # >= 3.10.0
     pip3 install flask werkzeug
     ```

---

## 2. Inisialisasi Core Banking Backend & SQLite Database

Aplikasi companion iOS dan smartwatch Apple Watch terhubung langsung ke air-gapped core banking engine berbasis Flask dan database relasional SQLite (`backend/nexora_vault.db`).

1. **Jalankan Backend Service**:
   Buka terminal khusus di Mac dan jalankan:
   ```bash
   cd backend
   python3 server.py
   ```
   Backend akan menginisialisasi tabel database dan melakukan listening pada `http://0.0.0.0:5000`.

2. **Verifikasi Database SQLite (`nexora_vault.db`)**:
   Di jendela terminal baru, periksa seed data nasabah private banking:
   ```bash
   sqlite3 backend/nexora_vault.db "SELECT account_number, username, balance FROM users WHERE username = 'alexander.vance';"
   ```
   **Output yang diharapkan**:
   ```text
   NX-8492014|alexander.vance|888888000.0
   ```
   Alexander Vance terkonfigurasi dengan rekening `NX-8492014` dan saldo awal Rp 888.888.000 (IDR).

3. **Verifikasi Endpoint Saldo REST**:
   ```bash
   curl -s http://127.0.0.1:5000/check_balance/NX-8492014
   ```
   Respon JSON:
   ```json
   {"accountNumber":"NX-8492014","balance":888888000.0,"currency":"IDR"}
   ```

---

## 3. Siapkan Dependensi React Native iOS & CocoaPods

Scaffold dependensi JavaScript dan native pod companion app:

```bash
# Dari root repositori
npm install --legacy-peer-deps

# Masuk ke direktori iOS dan install pods
cd ios
pod install --repo-update
cd ..
```

---

## 4. Otomasi Integrasi Target Apple Watch (`add_watch_target.rb`)

Direktori `ios/NexoraWatch/` memuat 16 file source code SwiftUI murni untuk watchOS. Jalankan skrip otomasi integrasi project Xcode:

```bash
cd ios
ruby add_watch_target.rb
```

### Apa yang Dilakukan oleh `add_watch_target.rb`:
- Menyamakan bundle identifier companion iOS menjadi **`com.nexorabank.omniwear`**.
- Membuat target native watchOS **`NexoraWatch`** dengan bundle identifier **`com.nexorabank.omniwear.watchkitapp`**.
- Menetapkan `WKCompanionAppBundleIdentifier` ke `com.nexorabank.omniwear` agar sinkronisasi `WCSession` Bluetooth LE valid.
- Menambahkan seluruh file Swift (`ContentView.swift`, `WatchNetworkManager.swift`, dll.) dan `Assets.xcassets` ke dalam build phase `NexoraWatch`.
- Mengkonfigurasi build phase **Embed Watch Content** dan target dependency pada `VulnerableBankApp.xcodeproj`.

Setelah menjalankan skrip, sinkronkan ulang pods:
```bash
pod install
cd ..
```
*(Catatan: Target `NexoraWatch` mandiri dan tidak menggunakan pod React Native).*

---

## 5. Konfigurasi Paired Simulator di Xcode

Untuk menguji komunikasi dua arah iPhone dan Apple Watch di simulator:

1. Di menu bar Xcode, pilih **Window** → **Devices and Simulators** (`Cmd + Shift + 2`).
2. Masuk ke tab **Simulators**.
3. Klik tombol **`+`** di sudut kiri bawah untuk menambah simulator baru.
4. **Konfigurasi iPhone Simulator**:
   - **Simulator Name**: `iPhone 15 Pro Lab` (atau `iPhone 11 Lab`).
   - **Device Type**: `iPhone 15 Pro` (atau `iPhone 11`).
   - **OS Version**: `iOS 17.4` (atau versi terinstal).
5. **Pairing dengan Apple Watch Simulator**:
   - Centang opsi: **Pair Apple Watch**.
   - **Watch Simulator Name**: `Apple Watch Series 9 Lab`.
   - **Watch Device Type**: `Apple Watch Series 9 (45mm)`.
   - **Watch OS Version**: `watchOS 10.4` (atau `watchOS 9.x` / `watchOS 10.x`).
6. Klik **Create**. Virtual paired environment siap digunakan.

---

## 6. Konfigurasi Jaringan & App Transport Security (ATS)

Nexora OmniWear mendukung konektivitas dual-mode:

| Lingkungan Target | URL Backend | Mekanisme Komunikasi |
|---|---|---|
| **Xcode Simulator** | `http://localhost:5000` | Apple Watch Simulator berbagi antarmuka loopback host Mac melalui `WatchNetworkManager` (URLSession) langsung. |
| **iPhone & Watch Fisik** | `http://<IP_LAN_MAC>:5000` | Menghubungi host Mac melalui satu subnet Wi-Fi yang sama (atur di `InsecureStorage.swift` atau menu Pentest Lab). |

### App Transport Security (ATS):
Karena lab pengujian penetrasi ini menggunakan HTTP cleartext untuk memfasilitasi inspeksi lalu lintas (misalnya via Burp Suite), `Info.plist` pada target iOS dan target watchOS (`ios/NexoraWatch/Info.plist`) telah dikonfigurasi dengan:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

## 7. Buka Workspace, Set Signing, & Jalankan Aplikasi

> [!IMPORTANT]
> **Selalu buka file `.xcworkspace`**, BUKAN `.xcodeproj`!
```bash
open ios/VulnerableBankApp.xcworkspace
```

### Konfigurasi Signing di Xcode:
1. Pilih project root **`VulnerableBankApp`** di Project Navigator.
2. Target **`VulnerableBankApp`** → tab **Signing & Capabilities** → centang *Automatically manage signing* → pilih **Team** Anda (Personal Team gratis).
3. Target **`NexoraWatch`** → tab **Signing & Capabilities** → pilih **Team** yang sama.

### Menjalankan Aplikasi:
1. **Jalankan iOS Companion**:
   - Scheme selector: pilih **`VulnerableBankApp`** dengan destination **`iPhone 15 Pro Lab`**.
   - Tekan **Run** (`Cmd + R`).
   - Login dengan username `admin` / password `admin123`.
2. **Jalankan Apple Watch Target**:
   - Scheme selector: pilih **`NexoraWatch`** dengan destination **`Apple Watch Series 9 Lab`**.
   - Tekan **Run** (`Cmd + R`).
   - Layar Apple Watch akan menampilkan Quick-PIN pad (masukkan PIN default: `1234`).
   - Masuk ke dashboard nasabah Alexander Vance (saldo Rp 888.888.000).

---

## 8. Verifikasi Transaksi End-to-End pada SQLite Database

Lakukan uji transaksi langsung dari Apple Watch untuk memastikan sinkronisasi data ke backend dan database:

1. Pada Apple Watch Simulator:
   - Pilih menu **SNAP QRIS Pay**.
   - Tekan tombol **Scan & Pay Rp 75.000** (Merchant: `Warung Kopi Seduh`, NMID: `ID1020021189360`).
   - Tekan **Confirm Payment**. Jam akan memberikan konfirmasi haptic dan status `Payment Approved`.
2. Verifikasi mutasi transaksi pada database SQLite di host Mac:
   ```bash
   sqlite3 backend/nexora_vault.db "SELECT id, from_account, to_account, amount, description, timestamp FROM transactions ORDER BY id DESC LIMIT 1;"
   ```
   **Hasil query**:
   ```text
   |NX-8492014|ID1020021189360|75000.0|SNAP QRIS Payment - Warung Kopi Seduh|...
   ```
3. Verifikasi saldo berkurang pada tabel `users`:
   ```bash
   sqlite3 backend/nexora_vault.db "SELECT balance FROM users WHERE account_number = 'NX-8492014';"
   ```

---

## 9. Matriks Resolusi Masalah (Troubleshooting Matrix)

| Gejala Error di Xcode | Penyebab Utama | Solusi Terverifikasi |
|---|---|---|
| `No such module 'React'` pada target watch | Target watchOS mencoba me-link CocoaPods React Native iOS. | `NexoraWatch` adalah 100% native SwiftUI. Pastikan `NexoraWatch` **tidak** dimasukkan ke dalam `ios/Podfile`. Pods hanya untuk `VulnerableBankApp`. |
| `Signing for 'NexoraWatch' requires a development team` | Apple Team signing belum dipilih. | Di Xcode, pilih target `NexoraWatch` → **Signing & Capabilities** → pilih **Personal Team**. |
| `WCSession is not paired` atau session watch tidak terdeteksi | Ketidakcocokan Bundle Identifier antara companion iOS dan watch. | Bundle ID harus sinkron: iOS `com.nexorabank.omniwear` dan watch `com.nexorabank.omniwear.watchkitapp`. Jalankan `ruby add_watch_target.rb` untuk memperbaiki secara otomatis. |
| `App Transport Security has blocked a cleartext HTTP connection` | ATS memblokir lalu lintas HTTP cleartext. | Pastikan `NSAllowsArbitraryLoads = true` tercantum dalam `Info.plist` kedua target (`VulnerableBankApp` dan `NexoraWatch`). |
| `Cycle inside VulnerableBankApp; building could produce unreliable results` | Urutan build phase Embed Watch Content mendahului kompilasi. | Di tab Build Phases `VulnerableBankApp`, geser **Embed Watch Content** ke posisi setelah **Compile Sources** dan **Link Binary With Libraries**. |
| Backend unreachable di jam fisik | Jam fisik tidak dapat menghubungi `localhost`. | Sambungkan iPhone & Mac ke Wi-Fi yang sama, izinkan port 5000 di firewall macOS, lalu set IP Mac LAN di `InsecureStorage.swift`. |

---

## 10. Ringkasan Arsitektur

- **iOS Companion App**: React Native (berbagi core logic finansial & autentikasi dengan versi Android) + Native Bridge `WatchBridge.swift` (`WCSession`).
- **watchOS App (`NexoraWatch`)**: SwiftUI native mandiri; menggunakan `WatchNetworkManager` (`URLSession`) untuk HTTP REST langsung ke backend Flask, serta `WatchSessionManager` (`WatchConnectivity`) untuk sinkronisasi token dan status kartu dari iPhone.
---

## 11. Pengujian Standalone watchOS & Mac (Tanpa Companion iPhone)

Bagi pengujian keamanan dan simulasi yang **hanya menggunakan Apple Watch dan Laptop Mac** (tanpa memerlukan emulator/perangkat iPhone):

1. **Jalankan Skema NexoraWatch Langsung di Xcode**:
   - Di Xcode scheme selector (sebelah tombol Run ▶️), pilih scheme **`NexoraWatch`** (bukan `VulnerableBankApp`).
   - Pilih destination simulator watchOS mandiri, misal: **Apple Watch Series 9 (45mm)** atau **Apple Watch Ultra 2 (49mm)**.
   - Tekan **Cmd + R** untuk build dan jalankan. Simulator Apple Watch akan terbuka dan langsung menampilkan antarmuka perbankan Nexora.
2. **Koneksi Langsung ke Backend**:
   - Smartwatch berkomunikasi secara mandiri via HTTP REST (`WatchNetworkManager.swift`) ke `http://127.0.0.1:5000`.
   - Pastikan backend aktif: `cd backend && python3 server.py`.
3. **Eksekusi 5 Standalone Challenge**:
   - **Challenge 1 (Forensic Plist & Cache)**: `xcrun simctl get_app_container booted com.nexorabank.omniwear.watchkitapp data`.
   - **Challenge 2 (Cleartext Wi-Fi MITM)**: Intercept traffic watch di Burp Suite port 8080.
   - **Challenge 3 (Runtime Memory Swizzling)**: `frida -n NexoraWatch -l scripts/frida_bypass_wrist.js` atau LLDB `breakpoint set -n "-[WristSensorManager isWristAttachedToBody]"`.
   - **Challenge 4 (ATM Cash Double-Dispense Race)**: `python3 scripts/exploit_double_dispense.py <OTP-TOKEN>`.
   - **Challenge 5 (Wrist BOLA / IDOR)**: `xcrun simctl openurl booted "nexorabank://account?num=NX-7391048"`.
   - Detail panduan lengkap dapat dilihat di [docs/APPLE_WATCHOS_GUIDE.md](docs/APPLE_WATCHOS_GUIDE.md#6-panduan-pentest-standalone-watchos--mac-tanpa-companion-iphone).
