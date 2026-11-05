# 🌐 Panduan Koneksi Backend & Skenario Companion Dual-Device Nexora OmniWear

Panduan lengkap mengenai cara menghubungkan aplikasi **Nexora OmniWear** (baik di emulator maupun perangkat fisik) ke local Flask backend, serta cara melakukan pengujian skenario *Companion App* (Smartphone + Smartwatch).

---

## 🏛️ 1. Arsitektur Koneksi Backend

Backend Python Flask (`backend/server.py`) berjalan di PC Windows Anda pada port `5000` dan bertindak sebagai pusat database (`nexora_vault.db`) sekaligus *relay* komunikasi antara smartphone dan smartwatch.

```
┌────────────────────────┐         ┌────────────────────────┐
│  Smartphone Companion  │         │   Smartwatch Wear OS   │
│   (Real Device / Emul) │         │    (Emulator / Watch)  │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            └─────────────────┬────────────────┘
                              ▼
               ┌──────────────────────────────┐
               │    Python Flask Backend      │
               │   (http://<IP>:5000)         │
               └──────────────────────────────┘
```

---

## 🔌 2. Panduan Koneksi Berdasarkan Perangkat

### A. Jika Menggunakan Emulator (Android / Wear OS Emulator)
Emulator di PC dapat langsung mengakses localhost Windows melalui IP khusus `10.0.2.2`.

1. **Jalankan Backend di Windows:**
   ```cmd
   python backend/server.py
   ```
2. **Setup ADB Reverse (Sangat Direkomendasikan):**
   Untuk menghindari masalah *loopback network* pada emulator Wear OS, jalankan perintah ini di terminal:
   ```cmd
   adb reverse tcp:5000 tcp:5000
   ```
   *Perintah ini secara otomatis meneruskan trafik port `5000` di emulator langsung ke Flask backend di PC.*

---

### B. Jika Menggunakan Perangkat Fisik (Real Smartphone / Smartwatch Fisik)
Perangkat fisik memerlukan alamat IP lokal PC Anda di jaringan Wi-Fi yang sama.

1. **Cek IP Lokal PC Anda:**
   Buka CMD / PowerShell dan ketik `ipconfig`. Amati IPv4 Address pada adapter Wi-Fi Anda (contoh: `192.168.100.19`).
2. **Pastikan Satu Jaringan:** Pastikan HP/Smartwatch fisik terhubung ke jaringan Wi-Fi yang sama dengan PC.
3. **Ubah API Base URL di Aplikasi:**
   * Di dalam aplikasi NexoraBank pada perangkat fisik, masuk ke menu **Pentest Lab** atau pengaturan Companion, lalu arahkan URL backend ke:
     `http://192.168.100.19:5000`
4. **Firewall Windows:** Pastikan Windows Firewall mengizinkan akses ke port `5000`.

---

## 📱 3. Skenario Uji Coba Dual-Device (Smartphone + Smartwatch)

Untuk mendemonstrasikan integrasi *Companion App*, Anda dapat menggunakan kombinasi **Real Smartphone + Emulator Smartwatch** atau **2 Emulator Sekaligus**.

### Langkah-Langkah Pengujian:
1. **Instal APK di Kedua Perangkat:**
   * **Smartphone (Companion):** Pasang `nexora-companion-release.apk`
   * **Smartwatch (Wear OS):** Pasang `nexora-wear-release.apk`
2. **Pastikan Keduanya Terhubung ke Backend yang Sama:**
   * Pastikan HP dan Watch dapat mengakses Flask backend (`http://...:5000`).
3. **Lakukan Pair Perangkat:**
   * Di Smartwatch: Buka menu **Phone Companion** atau masukkan kode pairing `839-201`.
4. **Simulasi Aksi Companion (Live Demo):**
   * **Sync Balance:** Di HP Companion, tekan *"Sync Balance to Watch"*. Saldo di layar smartwatch akan langsung berubah secara *real-time* menjadi `$888,888.00` (Eksploitasi V-B01).
   * **Push 2FA Alert:** Di HP Companion, tekan *"Push 2FA Alert to Watch"*. Kartu persetujuan debit `$250.00` akan muncul secara instan di layar jam tangan (Eksploitasi V-W09).
   * **Quick Pay Hijack:** Kirim perintah transfer instan dari companion ke jam tanpa verifikasi PIN.

---

## 🛠️ 4. Troubleshooting Koneksi

| Gejala Kendala | Penyebab Utama | Solusi Perbaikan |
|---|---|---|
| **Network Error / Login Gagal** | Backend belum menyala atau IP salah | Pastikan `python backend/server.py` menyala dan jalankan `adb reverse tcp:5000 tcp:5000`. |
| **Perangkat Fisik Timeout** | Terhalang Firewall / Beda Wi-Fi | Pastikan HP & PC dalam 1 jaringan Wi-Fi, gunakan IP lokal PC (misal `192.168.100.19`), dan cek Windows Firewall. |
| **Data Companion Tidak Sinkron** | Device ID berbeda | Pastikan kedua perangkat terdaftar pada akun dan target ID (`watch_9201`) yang sama di backend. |
