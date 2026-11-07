# 🍎 Build & Run — iOS app + Apple Watch (watchOS)

Panduan menjalankan **Nexora OmniWear** di iPhone/iOS Simulator dan Apple Watch/watchOS Simulator lewat Xcode.

> ⚠️ **Wajib macOS + Xcode.** iOS/watchOS tidak bisa di-build di Windows/Linux.
> Kode watchOS di bawah ditulis & dianalisa statis di lingkungan Windows (tanpa Mac), jadi **belum di-compile**. Error compile kecil mungkin muncul di build pertama — perbaiki sesuai pesan Xcode (atau minta bantuan).

---

## 1. Prasyarat (di Mac)
- Xcode 15+ (watchOS 9+ SDK)
- Node ≥ 18, Yarn/npm, Watchman
- CocoaPods: `sudo gem install cocoapods`
- xcodeproj gem (untuk membuat target watch): `sudo gem install xcodeproj`

## 2. Siapkan JS + Pods (app iOS React Native)
```bash
# dari root repo
npm install
cd ios
pod install
```

## 3. Buat watchOS target (sekali saja)
Folder `ios/NexoraWatch/` berisi app watch (SwiftUI) tapi **belum terdaftar** sebagai target Xcode. Jalankan skrip:
```bash
# dari ios/
ruby add_watch_target.rb
pod install            # integrasi ulang pods setelah target baru
```
Skrip ini otomatis:
- menyamakan **bundle id app iOS → `com.nexorabank.omniwear`** (agar cocok dengan companion watch),
- membuat target **`NexoraWatch`** (bundle `com.nexorabank.omniwear.watchkitapp`, watchOS 9),
- memasukkan semua `*.swift` + `Assets.xcassets`,
- meng-embed watch app ke dalam app iOS (Embed Watch Content) + dependency.

## 4. Buka workspace & set signing
```bash
open VulnerableBankApp.xcworkspace   # SELALU .xcworkspace, bukan .xcodeproj
```
Di Xcode:
- Target **VulnerableBankApp** → Signing & Capabilities → pilih **Team** Anda.
- Target **NexoraWatch** → Signing & Capabilities → **Team** yang sama.
- (Device fisik) tambahkan ikon di `NexoraWatch/Assets.xcassets/AppIcon` (1024×1024). Untuk Simulator boleh kosong.

## 5. Arahkan ke backend
Jalankan backend di Mac: `python backend/server.py` (listen `0.0.0.0:5000`).
- **iOS Simulator** → `src/utils/api.ts` default `http://localhost:5000` ✓
- **Apple Watch Simulator** → default `http://localhost:5000` ✓ (lihat `InsecureStorage.getBackendUrl()`)
- **iPhone/Apple Watch fisik** (satu Wi-Fi dengan Mac) → ganti ke `http://<IP-MAC>:5000`:
  - iOS: in-app **Pentest Lab → API**, atau `setApiBase`.
  - watchOS: ubah default di `ios/NexoraWatch/InsecureStorage.swift` (`keyBackendUrl`).

## 6. Jalankan
- **App iOS:** pilih scheme **VulnerableBankApp** + Simulator/iPhone → ⌘R.
- **App watch:** pilih scheme **NexoraWatch** + Apple Watch Simulator (yang paired) → ⌘R.
  - Login: Quick-PIN **1234** → otomatis login backend (`alexander.vance`), saldo/transaksi/transfer/loans/cards/QRIS/ATM semuanya dari ledger yang sama dengan Android/HP.

---

## Troubleshooting
| Gejala | Penyebab / solusi |
|---|---|
| Watch tak muncul / tak pairing | Bundle id iOS harus `com.nexorabank.omniwear` = `WKCompanionAppBundleIdentifier` watch. Skrip sudah set; cek jika diubah manual. |
| "App Transport Security blocked" | `http` cleartext. Sudah ditambah `NSAllowsArbitraryLoads` di `NexoraWatch/Info.plist` & `VulnerableBankApp/Info.plist`. |
| Backend unreachable di watch fisik | Watch pakai Wi-Fi iPhone; set `keyBackendUrl` ke IP-Mac LAN, pastikan firewall izinkan :5000. |
| Error "No such module 'React'" (watch) | Target watch TIDAK boleh link pod RN. File watch mandiri (URLSession); jangan tambahkan ke Podfile. |
| Build device gagal: missing AppIcon | Tambah ikon 1024² di `Assets.xcassets/AppIcon` (Simulator tak wajib). |

## Arsitektur singkat
- **App iOS** = React Native (JS sama dengan Android → full parity + backend).
- **App watch** = SwiftUI mandiri; `WatchNetworkManager` (URLSession) bicara **langsung** ke Flask backend (tak butuh iPhone proxy), plus `WatchSessionManager` (WatchConnectivity) untuk sinkron dari iPhone.
- Semua kerentanan latihan dipertahankan (V-AP01 insecure storage, V-AP03 quick-PIN, dll.).
