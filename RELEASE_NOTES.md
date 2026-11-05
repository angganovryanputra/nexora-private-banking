# 🏦 VulnBank OmniWear Suite v1.0.0
## Enterprise Smartwatch & Mobile Banking Assessment Framework
### Standar Kepatuhan: OJK POJK 11/POJK.03/2022, Bank Indonesia SNAP QRIS, & PCI-DSS v4.0

Selamat datang di rilis resmi pertama **VulnBank OmniWear Suite v1.0.0**. Framework ini dirancang khusus untuk pengujian penetrasi (penetration testing), audit keamanan siber, dan demonstrasi tender pengadaan perbankan pada ekosistem **Smartwatch (Wear OS & Apple watchOS)** serta **Smartphone Companion (Android & iOS)**.

---

### 📦 Paket Instalasi Rilis Multi-Platform (Release Assets)

Seluruh file installer telah dikompilasi secara otomatis melalui pipeline CI/CD dan siap diunduh:

| File Artefak | Ukuran | Lingkungan Target | Deskripsi |
|---|---|---|---|
| **`vulnbank-wear-release.apk`** | ~61 MB | **Smartwatch Wear OS** (Galaxy Watch, Pixel Watch, Emulator 480x480) | UI AMOLED bulat responsif, Glanceable Balance, Quick-PIN 3x4, Rotating QRIS, Sensor denyut nadi, & Off-wrist lockout. |
| **`vulnbank-mobile-companion-release.apk`** | ~61 MB | **Smartphone Android** (Fisik / Emulator) | Pusat kendali penyerang: Remote balance sync, pemicu push 2FA $50,000, trigger quick pay, dan packet sniffer nirkabel. |
| **`vulnbank-universal-release.apk`** | ~61 MB | **Universal Android** (HP / Jam) | Paket universal fleksibel untuk demonstrasi mandiri (standalone). |
| **`vulnbank-ios-companion-release.ipa`** | ~25 MB | **Apple iPhone 11 Fisik / iOS 15.1+** | Aplikasi pendamping iOS dengan layout responsif Liquid Retina (Safe Area Notch/Home Bar) dan jembatan WCSession. |
| **`VulnBank-watchOS-Bundle.zip`** | ~2 MB | **Apple Watch (watchOS 9.0+)** | Proyek native SwiftUI lengkap untuk Xcode Simulator & Apple Watch fisik (40mm s/d 49mm Ultra). |
| **`SHA256SUMS.txt`** | ~1 KB | **Semua Platform** | Checksum kriptografis SHA-256 untuk verifikasi integritas biner rilis. |

---

### 🛡️ 8 Skenario Pentest Perbankan Dunia Nyata (Real-World Banking Simulation)

1. **Skenario 1 (V-B01 / V-AP02): Remote Balance Injection & Replay**
   - Eksploitasi sinkronisasi Bluetooth LE / WCSession tanpa HMAC signature. Menyuntikkan saldo `$888,888.00` secara nirkabel ke smartwatch secara real time.
2. **Skenario 2 (V-W09 / V-AP04): High-Value ($50,000) Out-of-Band 2FA Wire Transfer Hijack**
   - Transaksi transfer kawat $50,000 dikonfirmasi melalui pop-up jam tangan tanpa verifikasi biometrik / Secure Enclave hardware, memotong saldo akun secara nyata di database core banking.
3. **Skenario 3 (V-W15 / V-AP06): Contactless Dynamic SNAP QRIS Replay Attack**
   - QRIS dinamis di pergelangan tangan tidak memiliki timestamp freshness TOTP dan tidak memeriksa *idempotency key*. Kasir/penyerang dapat mendebit saldo nasabah berulang kali dengan kode QR yang sama.
4. **Skenario 4 (V-W10 / V-AP03): Quick-PIN 4-Digit Brute-Force Tanpa Rate Limiting**
   - Smartwatch mengizinkan brute-force seluruh ruang kunci PIN (0000-9999) dalam waktu **0.6 detik** tanpa penalti jeda waktu (*exponential backoff delay*) atau *account lockout*.
5. **Skenario 5 (V-R01 / V-R02): Client-Side Anti-Tamper & Root Check Bypass**
   - Perlindungan anti-root perbankan hanya berupa pengecekan client-side yang dapat dinetralisir dalam hitungan detik via Frida hook atau manipulasi SharedPreferences flag.
6. **Skenario 6 (V-08): Bypass Bank-Grade SSL Pinning (Security Theater)**
   - Sertifikat pinning dapat dinonaktifkan atau dibypass dengan *universal TrustManager fallback* untuk melakukan inspeksi MITM penuh pada Burp Suite / Charles.
7. **Skenario 7 (V-W11 / V-AP05): Wrist-Off Sensor Lockout Spoofing & Health Telemetry Leak**
   - Sensor lepas-tangan (*off-wrist*) dapat dimanipulasi di memori runtime, sementara data denyut nadi nasabah bocor secara unauthenticated ke endpoint telemetri.
8. **Skenario 8: CISO Executive Regulatory Compliance Audit**
   - Evaluasi menyeluruh terhadap standar kepatuhan regulasi: **OJK POJK No. 11/POJK.03/2022 Pasal 38, 39, & 42**, **Bank Indonesia SNAP PADG No. 24/1/PADG/2022**, dan **PCI-DSS v4.0 Requirement 3, 4, & 8**.

---

### ⚡ Panduan Cepat Menjalankan Backend Lokal (Air-Gapped)

Aplikasi telah dikonfigurasi 100% menggunakan backend lokal yang mandiri (zero-dependency Python Flask):

```bash
# Jalankan backend lokal di PC/Laptop Anda
python backend/server.py
```
- **Localhost:** `http://127.0.0.1:5000`
- **Android Emulator Alias:** `http://10.0.2.2:5000`
- **Perangkat Fisik (Wi-Fi):** `http://<IP_LAPTOP_ANDA>:5000`

---

### 📲 Panduan Instalasi Cepat

#### Android & Wear OS:
```bash
# Instalasi ke Smartwatch Wear OS (Fisik via Wi-Fi Debugging atau Emulator)
adb -s <DEVICE_ID> install -r vulnbank-wear-release.apk

# Instalasi ke Smartphone Android
adb -s <DEVICE_ID> install -r vulnbank-mobile-companion-release.apk
```

#### Apple iOS (iPhone 11) & watchOS:
- **iPhone Fisik:** Sideload file `vulnbank-ios-companion-release.ipa` menggunakan [Sideloadly](https://sideloadly.io/) atau [AltStore](https://altstore.io/) dengan Apple ID gratis.
- **Apple Watch Simulator:** Buka folder `ios/VulnBankWatch/` di Xcode, pilih target scheme `VulnBankWatch`, lalu tekan **Cmd + R** untuk menjalankan aplikasi pada Apple Watch Series 9 / Ultra Simulator.

---

### 📜 Lisensi & Etika Pengujian
Framework ini dibuat semata-mata untuk tujuan riset akademis, pengujian keamanan terotorisasi, dan demonstrasi tender pengadaan perbankan. Dilarang keras menggunakan teknik ini terhadap sistem tanpa izin tertulis dari pemilik aset.
