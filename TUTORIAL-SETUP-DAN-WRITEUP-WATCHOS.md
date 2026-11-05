# 🍎 TUTORIAL SETUP, WORKFLOW & WRITEUP PENTEST SMARTWATCH (APPLE WATCHOS & IPHONE 11)
## Nexora OmniWear (OmniWear Suite): Enterprise Assessment Framework for Apple Watch & iOS Companion
### Standar Kepatuhan: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

> [!IMPORTANT]
> **DOKUMENTASI RESMI TERPISAH BERDASARKAN LINGKUNGAN:**
> - 🍏 **Dokumentasi Utama Apple iOS & watchOS**: Kunjungi [**`docs/APPLE_WATCHOS_GUIDE.md`**](docs/APPLE_WATCHOS_GUIDE.md) untuk panduan instalasi di MacBook Intel/M-series, setup Paired Simulator, sideloading iPhone 11, serta writeup detail 8 skenario eksploitasi.
> - 🤖 **Dokumentasi Utama Android & Wear OS**: Kunjungi [**`docs/ANDROID_WEAROS_GUIDE.md`**](docs/ANDROID_WEAROS_GUIDE.md).
> - 📦 **Unduh Biner Siap Pakai**: Unduh berkas `.ipa`, `.apk`, dan `.zip` di [**GitHub Releases Tab**](https://github.com/angganovryanputra/nexora-private-banking/releases/latest).

---

## 🎯 Executive Pitch: Urgensi Asesmen Apple watchOS & iPhone 11

> **Pesan Kunci untuk Evaluator Tender & Dewan Penguji:**
> *"Banyak institusi perbankan mengasumsikan bahwa perangkat Apple secara otomatis terlindungi oleh App Sandbox dan Secure Enclave. Fakta di lapangan menunjukkan bahwa celah perbankan terbesar di ekosistem Apple berasal dari kesalahan arsitektur pengembang: menyimpan token sesi di `UserDefaults.standard` (unencrypted Plist), sinkronisasi kamus data via `WCSession` tanpa enkripsi lapis aplikasi, serta pengesahan otorisasi transfer bernilai tinggi ($50,000) melalui interaksi notifikasi smartwatch tanpa cryptographic signature hardware. Framework ini membuktikan secara nyata bagaimana seluruh celah tersebut dieksploitasi dan diaudit sesuai standar OJK & PCI-DSS."*

---

## 📑 Daftar Isi
1. [Arsitektur Sistem & Spesifikasi Dual-Device (watchOS + iPhone 11)](#1-arsitektur-sistem--spesifikasi-dual-device-watchos--iphone-11)
2. [Tutorial Setup Lingkungan Pengujian (3 Metode Praktis)](#2-tutorial-setup-lingkungan-pengujian-3-metode-praktis)
   - [Metode A: Setup via Xcode Simulator (macOS)](#metode-a-setup-via-xcode-simulator-macos)
   - [Metode B: Setup Sideloading ke iPhone 11 Fisik dari Windows](#metode-b-setup-sideloading-ke-iphone-11-fisik-dari-windows)
   - [Metode C: Setup Proxy Burp Suite / Charles untuk iOS & watchOS](#metode-c-setup-proxy-burp-suite--charles-untuk-ios--watchos)
3. [Master Writeup 8 Skenario Pentest watchOS & Panduan Screenshot POC](#3-master-writeup-8-skenario-pentest-watchos--panduan-screenshot-poc)
   - [Skenario 1: V-AP01 — Insecure Local Plist Storage (`UserDefaults` Token Dump)](#skenario-1-v-ap01--insecure-local-plist-storage-userdefaults-token-dump)
   - [Skenario 2: V-AP02 — Unencrypted `WCSession` Bridge Packet Sniffing](#skenario-2-v-ap02--unencrypted-wcsession-bridge-packet-sniffing)
   - [Skenario 3: V-AP03 — Quick-PIN 4-Digit Brute-Force Tanpa Rate Limiting](#skenario-3-v-ap03--quick-pin-4-digit-brute-force-tanpa-rate-limiting)
   - [Skenario 4: V-AP04 — High-Value ($50,000) Out-of-Band 2FA Transaction Hijack](#skenario-4-v-ap04--high-value-50000-out-of-band-2fa-transaction-hijack)
   - [Skenario 5: V-AP05 — Wrist-Off Sensor Lockout Spoofing via Frida](#skenario-5-v-ap05--wrist-off-sensor-lockout-spoofing-via-frida)
   - [Skenario 6: V-AP06 — Contactless Dynamic SNAP QRIS Replay Attack](#skenario-6-v-ap06--contactless-dynamic-snap-qris-replay-attack)
   - [Skenario 7: V-B01 — Remote Balance Injection over Wearable Bridge](#skenario-7-v-b01--remote-balance-injection-over-wearable-bridge)
   - [Skenario 8: CISO Executive Scorecard — Audit Kepatuhan POJK 11, SNAP, & PCI-DSS](#skenario-8-ciso-executive-scorecard--audit-kepatuhan-pojk-11-snap--pci-dss)
4. [Koleksi Skrip Frida Khusus watchOS & iOS](#4-koleksi-skrip-frida-khusus-watchos--ios)
5. [Tabel Pemetaan Regulasi & Rekomendasi Remedi](#5-tabel-pemetaan-regulasi--rekomendasi-remedi)

---

## 🏛️ 1. Arsitektur Sistem & Spesifikasi Dual-Device (watchOS + iPhone 11)

```
        ┌────────────────────────────────────────────────────────┐
        │  Laptop Penguji: Localhost Python Relay (0.0.0.0:5000) │
        └───────────────────────────┬────────────────────────────┘
                                    │ Wi-Fi LAN / Burp Proxy
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  iPhone 11 Fisik / Simulator │              │   Apple Watch (watchOS 9+)   │
│  (React Native Companion)    │◄────────────►│   (Native SwiftUI Target)    │
│  - Pusat Kendali Penyerang   │  WCSession   │   - Target Korban            │
│  - Inject Saldo & 2FA Push   │  Bluetooth/  │   - Quick-PIN 3x4 Dial       │
│  - Sniffer Paket Nirkabel    │  Ad-hoc Wi-Fi│   - Dynamic SNAP QRIS        │
│  - Layar 6.1" Liquid Retina  │              │   - Sensor Wrist-Off Lockout │
└──────────────────────────────┘              └──────────────────────────────┘
```

### Spesifikasi Responsif Layar:
- **iPhone 11 Fisik:** Layar 6.1 inci (828 × 1792 piksel @2x). Top Safe Area Inset 48 pt (Notch kamera) dan Bottom Inset 36 pt (Home Indicator).
- **Apple Watch:** Mendukung seluruh form-factor Apple Watch secara dinamis:
  - 40mm / 41mm: Layout kompak dengan tombol 25 pt dan grid keypad adaptif.
  - 44mm / 45mm: Tampilan standar dengan tombol 29 pt.
  - 49mm (Apple Watch Ultra): Tampilan luas dengan tombol 34 pt dan tipografi saldo membesar otomatis.

---

## ⚡ 2. Tutorial Setup Lingkungan Pengujian (3 Metode Praktis)

### Metode A: Setup via Xcode Simulator (Panduan Lengkap MacBook Pro 2019 Intel)

Panduan ini disusun secara bertahap khusus untuk pengguna **macOS (MacBook Pro 2019 berbasis Intel x86_64)** mulai dari instalasi prasyarat hingga menjalankan dua simulator berdampingan (**iPhone Simulator 📱 + Apple Watch Simulator ⌚**).

#### 🛠️ Langkah 0: Verifikasi & Instalasi Prasyarat Toolchain (Terminal macOS)

Buka aplikasi **Terminal** di MacBook Pro dan pastikan komponen berikut telah terpasang:

1. **Install Xcode Command Line Tools:**
   ```bash
   xcode-select --install
   ```
   *(Jika sudah terpasang, terminal akan menampilkan pesan bahwa tool sudah up-to-date).*

2. **Pastikan Node.js (v18 atau v20 LTS) & Python 3 Terpasang:**
   ```bash
   node -v     # Rekomendasi: v18.x.x atau v20.x.x
   npm -v      # Rekomendasi: v9.x.x atau v10.x.x
   python3 -v  # Rekomendasi: Python 3.9+
   ```
   *Jika belum terpasang, pasang cepat via Homebrew:*
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install node python
   ```

3. **Install CocoaPods (Manajer Dependensi iOS/watchOS):**
   ```bash
   sudo gem install cocoapods
   # atau via Homebrew:
   brew install cocoapods
   ```

---

#### 📥 Langkah 1: Clone Repository GitHub

Jalankan perintah berikut di Terminal untuk mengunduh source code lengkap:

```bash
cd ~/Desktop
git clone https://github.com/angganovryanputra/nexora-private-banking.git
cd nexora-private-banking
```

---

#### 📦 Langkah 2: Install Dependensi NPM & CocoaPods

Karena MacBook Pro 2019 menggunakan prosesor **Intel (x86_64)**, instalasi CocoaPods berjalan sangat stabil tanpa perlu konfigurasi Rosetta atau exclusion flag arsitektur:

```bash
# 1. Install dependensi React Native (Companion)
npm install --legacy-peer-deps

# 2. Masuk ke folder ios dan install pods
cd ios
pod install --repo-update
cd ..
```

> **Hasil yang Diharapkan:** Terminal menampilkan `Pod installation complete! There are X dependencies from the Podfile and Y total pods installed.`

---

#### ⌚ Langkah 3: PENTING — Unduh watchOS Simulator Runtime di Xcode

Secara default pada Xcode 15 dan 16, Apple **tidak menyertakan runtime watchOS** untuk menghemat ukuran instalasi awal. Jika langkah ini dilewati, simulator Apple Watch tidak akan muncul di daftar pilihan Xcode.

1. Buka aplikasi **Xcode**.
2. Di menu bar atas, klik **Xcode > Settings...** (atau tekan `Cmd + ,`).
3. Pilih tab **Platforms** (di samping Locations).
4. Cek apakah ada **watchOS 10.x** (atau watchOS 9.x):
   - Jika belum ada, klik tombol **`+`** (di pojok kiri bawah) > pilih **watchOS**.
   - Klik **Download & Install**.
   - *Alternatif via Terminal:*
     ```bash
     xcodebuild -downloadPlatform watchOS
     ```
5. Tunggu hingga proses unduhan selesai (sekitar 3–5 GB).

---

#### 🔗 Langkah 4: Membuat & Memverifikasi "Paired Simulator" (iPhone + Apple Watch)

Simulator iPhone dan Apple Watch harus berstatus "Paired" agar komunikasi `WCSession` dan Bluetooth simulasi bekerja:

1. Di Xcode, buka menu **Window > Devices and Simulators** (atau tekan `Cmd + Shift + 2`).
2. Klik tab **Simulators** di bagian atas.
3. Di panel sebelah kiri, pilih salah satu simulator iPhone (misalnya **iPhone 15** atau **iPhone 11**):
   - Periksa bagian **Paired Watch**:
   - Jika sudah tertulis misalnya *Apple Watch Series 9 (45mm)*, berarti sudah terpasang (*paired*).
   - Jika belum ada (*None*), klik tombol **`+`** di bawah panel Paired Watches > beri nama watch baru (misal: *Nexora Apple Watch*) > pilih Watch Model (*Apple Watch Series 9*) dan OS (*watchOS 10*) > klik **Pair**.
4. Tutup jendela Devices and Simulators.

---

#### 🖥️ Langkah 5: Jalankan Backend Relay & Metro Bundler (Buka 2 Tab Terminal)

Agar skenario transfer uang, push 2FA, dan injeksi saldo bekerja secara real-time, jalankan backend lokal terlebih dahulu:

- **Tab Terminal 1 (Backend Flask Relay):**
  ```bash
  cd ~/Desktop/nexora-private-banking
  python3 backend/server.py
  ```
  *Output:* `* Running on all addresses (0.0.0.0:5000)`

- **Tab Terminal 2 (React Native Metro Bundler):**
  ```bash
  cd ~/Desktop/nexora-private-banking
  npm start
  ```
  *Output:* `Welcome to Metro v0.82.1... Type 'i' to run on iOS`

---

#### 🚀 Langkah 6: Buka Workspace di Xcode & Eksekusi Build

> ⚠️ **PERINGATAN PENTING:** Selalu buka file berakhiran **`.xcworkspace`**, JANGAN membuka `.xcodeproj`!

1. Jalankan perintah ini di terminal (atau double click file via Finder):
   ```bash
   cd ~/Desktop/nexora-private-banking/ios
   open VulnerableBankApp.xcworkspace
   ```
2. Tunggu hingga proses indexing Xcode selesai (bar indikator di tengah atas Xcode menampilkan status *Ready*).
3. **Pilih Skema & Target Perangkat:**
   - Di toolbar bagian atas Xcode, klik pemilih skema (di sebelah tombol Play ▶️).
   - Pastikan skema yang dipilih adalah **`VulnerableBankApp`**.
   - Di bagian target device (di sebelah kanan skema), klik dan pilih simulator pasangan yang sudah kita buat tadi, misalnya:
     **`iPhone 15 + Apple Watch Series 9 (45mm)`** (atau `iPhone 11 + Apple Watch`).
4. **Tekan Tombol Build & Run:**
   - Tekan tombol **Play ▶️** (atau shortcut keyboard **`Cmd + R`**).
5. **Xcode akan secara otomatis:**
   - Mem-build aplikasi iOS Companion dan menginstalnya ke Simulator iPhone.
   - Mem-build aplikasi SwiftUI watchOS dan menginstalnya ke Simulator Apple Watch.
   - Membuka **DUA JENDELA SIMULATOR** berdampingan di layar Mac teman Anda!

---

#### 💡 Langkah 7: Tips Kinerja Khusus MacBook Pro 2019 (Intel Core i7/i9)

1. **Penggunaan Memori (RAM):**
   - Menjalankan 2 simulator sekaligus (iOS + watchOS) memakan memori sekitar 3–4 GB RAM.
   - Tutup tab browser Chrome yang berat atau aplikasi editing video sebelum menekan `Cmd + R` agar simulator berjalan mulus 60 FPS.
2. **Thermal & Kipas Intel:**
   - Pada MacBook Pro 2019 Intel, saat build pertama kali (*clean build*), kipas Mac wajar akan berputar kencang selama 1–2 menit karena CPU mengompilasi ratusan file C++/Swift secara paralel di seluruh core Intel. Setelah aplikasi terinstal di simulator, penggunaan CPU akan kembali normal (idle ~3-5%).
3. **Ukuran Simulator di Layar Mac:**
   - Untuk mengatur ukuran simulator agar pas berdampingan di layar MacBook Pro 15/16 inci:
   - Klik jendela simulator iPhone > tekan **`Cmd + 2`** (Skala 75%) atau **`Cmd + 3`** (Skala 50%).
   - Klik jendela simulator Apple Watch > geser ke sebelah kanan layar iPhone.

---

#### ✅ Checklist Verifikasi: Memastikan Kedua Simulator Terhubung

1. Di Simulator Apple Watch: Aplikasi menampilkan layar **Quick-PIN Dial**. Masukkan PIN `1234` atau tekan tombol **1234**. Saldo `Rp 12.500.000` akan muncul dengan indikator hijau `Linked`.
2. Di Simulator iPhone: Buka menu **Phone Companion Screen**.
3. Di iPhone, tap tombol **Sync Balance to Watch (V-B01)**.
4. Perhatikan layar Apple Watch di sebelahnya: Saldo di Apple Watch akan langsung berubah secara instan menjadi **$888,888**! Ini membuktikan koneksi `WCSession` dual-device telah aktif 100%.

---

### Metode B: Setup Sideloading ke iPhone 11 Fisik dari Windows (Tanpa Mac)

Metode ini memungkinkan Anda menginstal aplikasi ke iPhone 11 fisik langsung dari laptop Windows menggunakan Apple ID gratis.

1. **Unduh File IPA dari GitHub Actions:**
   - Buka: [https://github.com/angganovryanputra/nexora-private-banking/actions](https://github.com/angganovryanputra/nexora-private-banking/actions)
   - Pilih workflow run terbaru dan unduh artefak `Nexora-watchOS-Bundle.zip`.
2. **Install Tool Sideloading di Windows:**
   - Unduh dan instal **[Sideloadly](https://sideloadly.io/)** (atau AltStore Windows).
   - Pastikan **iTunes** dan **iCloud for Windows** (versi non-Microsoft Store) sudah terinstal agar driver Apple Mobile Device Service aktif.
3. **Sambungkan iPhone 11 ke Laptop:**
   - Sambungkan iPhone 11 via kabel USB Lightning ke laptop Windows.
   - Pada layar iPhone, pilih **"Trust This Computer"** dan masukkan passcode.
4. **Sideload File IPA:**
   - Buka Sideloadly, pilih device iPhone 11 Anda.
   - Drag & drop file `.ipa` ke kotak aplikasi Sideloadly.
   - Masukkan Apple ID gratis Anda (digunakan hanya untuk meminta sertifikat pengembang sementara 7 hari dari Apple).
   - Klik **Start**. Dalam 60 detik aplikasi terpasang di iPhone 11!
5. **Aktivasi Profil Pengembang di iPhone 11:**
   - Di iPhone 11, buka **Settings > General > VPN & Device Management**.
   - Di bawah *Developer App*, tap Apple ID Anda lalu pilih **Trust**.
   - Untuk iOS 16+, aktifkan **Settings > Privacy & Security > Developer Mode > On** (iPhone akan reboot sekali).

---

### Metode C: Setup Proxy Burp Suite / Charles untuk iOS & watchOS

1. **Konfigurasi Burp Suite di Laptop Windows:**
   - Buka Burp Suite > **Proxy Settings > Proxy Listeners**.
   - Edit listener port `8080` dan atur ke **All interfaces** (atau IP Wi-Fi laptop, misal `192.168.1.15`).
2. **Unduh & Pasang Sertifikat CA di iPhone 11:**
   - Di iPhone 11, sambungkan Wi-Fi ke jaringan yang sama dengan laptop.
   - Buka browser Safari di iPhone, ketik: `http://192.168.1.15:8080/`
   - Klik **CA Certificate** untuk mengunduh profil sertifikat.
   - Buka **Settings > Profile Downloaded > Install**.
3. **Aktifkan Full SSL Trust di iPhone 11:**
   - Buka **Settings > General > About > Certificate Trust Settings**.
   - Di bawah *Enable full trust for root certificates*, aktifkan toggle **PortSwigger CA**.
4. **Konfigurasi Wi-Fi Proxy:**
   - Buka **Settings > Wi-Fi > (i) nama Wi-Fi Anda > Configure Proxy > Manual**.
   - Masukkan Server: `192.168.1.15`, Port: `8080`.
   - Seluruh traffic HTTPS perbankan dari iPhone dan Apple Watch sekarang akan tertangkap di Burp Suite HTTP History!

---

## 🔬 3. Master Writeup 8 Skenario Pentest watchOS & Panduan Screenshot POC

### Skenario 1: V-AP01 — Insecure Local Plist Storage (`UserDefaults` Token Dump)

- **Kategori:** Data Storage Security (CWE-312, OWASP MASVS-STORAGE)
- **Ringkasan:** Aplikasi smartwatch menyimpan token JWT otentikasi, PIN 4-digit, dan data rekening di dalam file `UserDefaults.standard` unencrypted XML `.plist` di sandboxed container jam, alih-alih di Secure Enclave / iOS Keychain.
- **Langkah Eksploitasi:**
  1. Jalankan aplikasi di Apple Watch dan lakukan autentikasi PIN (`1234`).
  2. Buka layar **Pentest Lab** di Apple Watch, tap tombol **V-AP01: Plist Storage Dump**.
  3. Atau jalankan inspeksi container simulator via terminal:
     ```bash
     xcrun simctl get_app_container booted com.nexorabank.omniwear.watchkitapp data
     cat <CONTAINER_PATH>/Library/Preferences/com.nexorabank.omniwear.watchkitapp.plist
     ```
- **Panduan Screenshot POC:**
  - `[POC-AP-1A]` Tangkapan layar Apple Watch menampilkan banner kuning: `[V-AP01] Dumped Plist Token: eyJhbGciOiJIUzI1...`
  - `[POC-AP-1B]` Tangkapan terminal / Plist Editor menampilkan kunci `nexora_auth_token` dan `nexora_quick_pin` dalam bentuk teks polos (plaintext).

---

### Skenario 2: V-AP02 — Unencrypted `WCSession` Bridge Packet Sniffing

- **Kategori:** Network & Wireless Security (CWE-319, OWASP MASVS-NETWORK)
- **Ringkasan:** Komunikasi data sensitif (update saldo, profil nasabah, otorisasi transaksi) yang dikirim antara iPhone dan Apple Watch melalui framework `WCSession` (`sendMessage` / `updateApplicationContext`) tidak menggunakan enkripsi lapis aplikasi (plaintext dictionary).
- **Langkah Eksploitasi:**
  1. Buka iPhone Companion Screen di iPhone 11.
  2. Sambungkan skrip Frida ke proses iPhone:
     ```bash
     frida -U -n "VulnerableBankApp" -l frida_wcsession_hook.js
     ```
  3. Tekan tombol **Sync Balance to Watch** di iPhone 11.
  4. Amati konsol Frida yang menyadap seluruh kamus data `{"action": "UPDATE_BALANCE", "amount": 888888.0}`.
- **Panduan Screenshot POC:**
  - `[POC-AP-2A]` Tangkapan layar iPhone 11 Companion menampilkan popup sukses `📶 BLE & WCSession Sync Dispatched`.
  - `[POC-AP-2B]` Terminal konsol Frida menampilkan struktur dictionary paket `WCSession` yang tersadap secara plaintext.

---

### Skenario 3: V-AP03 — Quick-PIN 4-Digit Brute-Force Tanpa Rate Limiting

- **Kategori:** Authentication Security (CWE-307, OWASP MASVS-AUTH)
- **Ringkasan:** Antarmuka keypad smartwatch 3x4 tidak menerapkan rate limiting, delay perangkat keras, maupun penghapusan sesi setelah kegagalan berulang.
- **Langkah Eksploitasi:**
  1. Pada Apple Watch, buka layar **Quick-PIN Keypad**.
  2. Masukkan PIN yang salah secara berulang-ulang sebanyak 10 kali berturut-turut.
  3. Perhatikan label di bawah keypad: counter terus bertambah `Invalid PIN (10 tries)` tanpa ada pemblokiran.
  4. Masukkan PIN benar `1234` atau tekan tombol pintas **1234**; aplikasi langsung terbuka.
- **Panduan Screenshot POC:**
  - `[POC-AP-3A]` Layar Apple Watch menunjukkan counter kegagalan berkali-kali tanpa penguncian (`No Rate Limit (15 tries)`).
  - `[POC-AP-3B]` Layar dashboard berhasil diakses langsung setelah PIN valid dimasukkan.

---

### Skenario 4: V-AP04 — High-Value ($50,000) Out-of-Band 2FA Transaction Hijack

- **Kategori:** Authorization & 2FA Bypasses (CWE-287, OWASP MASVS-AUTH)
- **Ringkasan:** Otorisasi transfer bernilai tinggi (\$50,000) dimunculkan sebagai notifikasi interaktif di jam. Menekan tombol "APPROVE" hanya mengirimkan flag JSON sederhana tanpa tanda tangan kunci privat Secure Enclave atau otentikasi biometrik ulang.
- **Langkah Eksploitasi:**
  1. Buka iPhone 11 Companion App, tap kartu merah **Trigger High-Value 2FA ($50,000 Transfer)**.
  2. Seketika layar Apple Watch bergetar dan memunculkan modal peringatan merah berkedip: `HIGH-VALUE 2FA: Wire Transfer $50,000 to OFFSHORE-SWIFT-991`.
  3. Tekan tombol hijau **APPROVE** di Apple Watch.
  4. iPhone Companion dan backend relay langsung mengonfirmasi status transfer: `APPROVED (V-AP04 Exploited)`.
- **Panduan Screenshot POC:**
  - `[POC-AP-4A]` Tangkapan layar Apple Watch menampilkan modal darurat otorisasi transfer \$50,000.
  - `[POC-AP-4B]` Tangkapan layar iPhone 11 menampilkan konfirmasi approval tanpa cryptographic challenge.

---

### Skenario 5: V-AP05 — Wrist-Off Sensor Lockout Spoofing via Frida

- **Kategori:** Sensor & Biometric Security (CWE-807, OWASP MASVS-PLATFORM)
- **Ringkasan:** Aplikasi smartwatch mengandalkan deteksi sensor pergelangan tangan klien (`isWristAttached` / `WKInterfaceDevice.isWristDetectEnabled`). Penyerang yang mengambil jam tangan korban dapat mem-bypass penguncian ini melalui runtime method swizzling.
- **Langkah Eksploitasi:**
  1. Di layar Apple Watch, tekan tombol merah **Test Wrist Lock (V-AP05)**.
  2. Jam seketika masuk ke status terkunci: `SESSION LOCKED: Watch removed from wrist. Biometric telemetry halted.`
  3. Untuk mendemonstrasikan eksploitasi, tekan tombol **Bypass (V-AP05 Frida)** pada layar jam (atau jalankan script hooking Frida).
  4. Sesi jam tangan langsung pulih dan saldo terbuka kembali tanpa menanyakan PIN.
- **Panduan Screenshot POC:**
  - `[POC-AP-5A]` Layar Apple Watch dalam keadaan terkunci `SESSION LOCKED` dengan ikon perisai merah.
  - `[POC-AP-5B]` Layar jam pulih ke tampilan saldo VIP setelah bypass dijalankan.

---

### Skenario 6: V-AP06 — Contactless Dynamic SNAP QRIS Replay Attack

- **Kategori:** Payment Token Replay (CWE-294, Bank Indonesia SNAP Specification)
- **Ringkasan:** String QRIS dinamis yang dihasilkan di layar jam menggunakan pengenal transaksi statis dan tidak divalidasi timestamp kedaluwarsanya di server backend, memungkinkan serangan replay pembayaran berulang kali.
- **Langkah Eksploitasi:**
  1. Buka layar **QRIS Pay** di Apple Watch.
  2. Tangkap string SNAP QRIS yang muncul di bawah frame QR (`00020101021226610016ID.NEXORA...`).
  3. Lakukan pembayaran merchant simulasi pertama.
  4. Tunggu countdown 120 detik habis, lalu gunakan kembali payload string QR yang sama untuk pembayaran kedua.
  5. Backend menerima transaksi kedua tanpa penolakan kedaluwarsa.
- **Panduan Screenshot POC:**
  - `[POC-AP-6A]` Tampilan layar Apple Watch menampilkan frame QR dinamis dengan hitung mundur kedaluwarsa.
  - `[POC-AP-6B]` Terminal / Burp Suite menampilkan HTTP 200 OK untuk transaksi replay kedua dengan payload QRIS yang sama.

---

### Skenario 7: V-B01 — Remote Balance Injection over Wearable Bridge

- **Kategori:** Integrity & Anti-Tampering (CWE-345, OWASP MASVS-NETWORK)
- **Ringkasan:** Penyerang yang menyusupi koneksi BLE atau relay backend dapat menginjeksikan saldo palsu (\$888,888) ke tampilan jam tangan tanpa verifikasi otentikasi sekunder.
- **Langkah Eksploitasi:**
  1. Buka iPhone 11 Companion App, tap tombol biru **Sync Balance to Watch (V-B01)**.
  2. Perhatikan layar Apple Watch: dalam hitungan detik saldo yang awalnya `Rp 12.500.000` berubah menjadi `Rp 888.888`.
- **Panduan Screenshot POC:**
  - `[POC-AP-7A]` Tombol injection di iPhone 11 Companion memicu paket update saldo.
  - `[POC-AP-7B]` Layar Apple Watch berubah menampilkan saldo yang telah dimanipulasi secara real-time.

---

### Skenario 8: CISO Executive Scorecard — Audit Kepatuhan POJK 11, SNAP, & PCI-DSS

- **Kategori:** Regulatory Compliance & Governance
- **Ringkasan:** Menampilkan hasil rekapitulasi audit kepatuhan terhadap 3 regulasi finansial utama secara otomatis di dalam layar jam.
- **Langkah Demonstrasi:**
  1. Buka **Pentest Lab** di Apple Watch, scroll ke bagian bawah ke kartu **CISO Regulatory Audit Scorecard**.
  2. Tunjukkan status kegagalan kepatuhan kepada tim evaluator tender:
     - `OJK POJK 11/2022: NON-COMPLIANT`
     - `SNAP QRIS: NON-COMPLIANT`
     - `PCI-DSS v4.0 Req 3.5: FAIL`
- **Panduan Screenshot POC:**
  - `[POC-AP-8A]` Layar Apple Watch menampilkan CISO Regulatory Audit Scorecard.
  - `[POC-AP-8B]` Dokumen tabel gap audit per pasal untuk lampiran laporan pengadaan.

---

## 💻 4. Koleksi Skrip Frida Khusus watchOS & iOS

Simpan skrip di bawah ini dengan nama `frida_watchos_suite.js`:

```javascript
/*
 * Nexora OmniWear — Frida Instrumentation Suite for iOS & watchOS
 * Usage: frida -U -n "VulnerableBankApp" -l frida_watchos_suite.js
 */

if (ObjC.available) {
    console.log("[*] Objective-C Runtime detected. Attaching hooks...");

    // 1. Hook WCSession - Intercept Plaintext Packets
    var WCSession = ObjC.classes.WCSession;
    if (WCSession) {
        Interceptor.attach(WCSession['- sendMessage:replyHandler:errorHandler:'].implementation, {
            onEnter: function (args) {
                console.log("\n[+] [V-AP02] Intercepted WCSession sendMessage:");
                var dict = new ObjC.Object(args[2]);
                console.log("    📦 Payload Dictionary: " + dict.toString());
            }
        });
        console.log("[+] Hooked WCSession sendMessage:replyHandler:errorHandler:");
    }

    // 2. Hook UserDefaults - Dump Tokens on Access
    var NSUserDefaults = ObjC.classes.NSUserDefaults;
    if (NSUserDefaults) {
        Interceptor.attach(NSUserDefaults['- stringForKey:'].implementation, {
            onEnter: function (args) {
                var key = ObjC.Object(args[2]).toString();
                if (key.indexOf("nexorabank") !== -1) {
                    console.log("[!] [V-AP01] UserDefaults access for sensitive key: " + key);
                }
            }
        });
        console.log("[+] Hooked NSUserDefaults stringForKey:");
    }

    // 3. Hook WKInterfaceDevice - Wrist Detection Spoofing
    var WKInterfaceDevice = ObjC.classes.WKInterfaceDevice;
    if (WKInterfaceDevice) {
        Interceptor.attach(WKInterfaceDevice['- isWristDetectEnabled'].implementation, {
            onLeave: function (retval) {
                console.log("[+] [V-AP05] Spoofed WKInterfaceDevice.isWristDetectEnabled -> Forced TRUE");
                retval.replace(ptr(1));
            }
        });
        console.log("[+] Hooked WKInterfaceDevice isWristDetectEnabled");
    }
} else {
    console.log("[-] Objective-C Runtime unavailable.");
}
```

---

## 📊 5. Tabel Pemetaan Regulasi & Rekomendasi Remedi

| Kode Temuan | Pelanggaran Regulasi | Resiko Bisnis | Rekomendasi Remedi (Fix) |
|---|---|---|---|
| **V-AP01** | **OJK POJK 11/2022 Pasal 19** & **PCI-DSS Req 3.5** | Pembajakan akun nasabah akibat pencurian token dari backup tidak terenkripsi. | Pindahkan penyimpanan ke **Apple Keychain Services** dengan aksesibilitas `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. |
| **V-AP02** | **OJK POJK 11/2022 Pasal 24** & **PCI-DSS Req 4.1** | Penyadapan paket nirkabel Bluetooth LE di area publik. | Terapkan enkripsi lapis aplikasi **AES-GCM 256-bit** dengan pertukaran kunci ECDH sebelum dictionary dikirim ke `WCSession`. |
| **V-AP03** | **OJK POJK 11/2022 Pasal 21** & **PCI-DSS Req 8.3** | PIN 4-digit dapat ditebak secara otomatis dalam hitungan menit. | Terapkan pembatasan maksimal 3–5 kali percobaan dengan **Hardware Backoff Delay** bertahap (1m, 5m, 15m). |
| **V-AP04** | **OJK POJK 11/2022 Pasal 22** | Transfer dana bernilai tinggi disetujui tanpa pembuktian identitas sah. | Wajibkan otentikasi **LocalAuthentication (FaceID/Passcode)** dan penandatanganan payload transaksi menggunakan kunci privat Secure Enclave. |
| **V-AP05** | **OJK POJK 11/2022 Pasal 20** | Jam tangan yang dicuri dari korban tetap dapat mengakses saldo perbankan. | Gabungkan deteksi wrist-off dengan verifikasi biometrik berulang dan invalidasi sesi server secara seketika saat sensor lepas. |
| **V-AP06** | **Bank Indonesia SNAP QRIS Bab IV** | Kerugian finansial akibat duplikasi kode bayar QRIS yang ditangkap foto. | Terapkan validasi **Nonce Sekali Pakai** dan validasi masa berlaku (maksimal 60 detik) terikat server timestamp. |

