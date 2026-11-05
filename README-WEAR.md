# VulnBank Wear OS — Catatan Porting

Porting **VulnBank mobile** (React Native 0.79.1, upstream:
[Commando-X/vuln-bank-mobile](https://github.com/Commando-X/vuln-bank-mobile))
dari ponsel Android ke **Wear OS**, mempertahankan seluruh kerentanan asli
dan menambahkan attack surface khas smartwatch.

## Identitas

| | Ponsel (asli) | Wear (port) |
|---|---|---|
| applicationId | `com.vulnerablebankapp` | `com.vulnerablebankapp.wear` |
| minSdk | 24 (Android 7) | 33 (Wear OS 4) |
| targetSdk | 35 | 35 |
| Layar | ~390dp lebar | ~180-230dp, bundar/bujur sangkar |
| APK | 51 MB (4 ABI) | ~18 MB (arm64-v8a + x86_64) |

> Package berbeda agar kedua APK bisa terpasang **berdampingan** di jam yang
> sama — berguna untuk demo before/after.

## Apa yang berubah

### UI / styling (src/styles/)
- `theme.ts` — token tipografi/spacing/radius otomatis diskalakan:
  font ×0.75 (min 10), spacing ×0.55, radius ×0.6. Seluruh screen memakai
  token yang sama sehingga UI menyusut konsisten tanpa ditulis ulang.
- `globalStyles.ts` — inset melingkar untuk layar bundar (approximasi
  BoxInsetLayout: padding horizontal ≈ 14% lebar layar), menu jadi full-screen.
- Nilai hardcoded (fontSize 80/48/40, avatar 100px, ikon 60/40/24/16/20/18)
  diganti token skala di semua screen.
- `DashboardScreen` — grid 2 kolom diubah jadi list vertikal (pola UI jam).

### Navigasi
- Navigasi manual berbasis state (upstream tidak pakai react-navigation) —
  ideal untuk jam; ditambah screen `health` (Health Monitor).
- `MenuModal` full-screen dengan item "Health Monitor".

### Fitur baru khas jam (intentionally vulnerable)
- `HeartRateModule.kt` — modul native sensor `TYPE_HEART_RATE`
  (fallback simulator bila sensor tidak ada, mis. di emulator).
  Kerentanan: penyimpanan plaintext (V-W1), logcat leak (V-W3).
- `HealthDataActivity.kt` — activity exported tanpa auth yang mem-dump
  kredensial + riwayat heart rate (V-W2).
- `HealthScreen.tsx` — UI monitor: BPM live, riwayat plaintext, tombol
  Sync yang mengirim data kesehatan + nomor rekening tanpa auth (V-W4).

### Konfigurasi Android
- `AndroidManifest.xml`: `uses-feature android.hardware.type.watch`,
  `com.google.android.wearable.standalone_app`, permission `BODY_SENSORS`,
  registrasi `HealthDataActivity` (exported), **seluruh meta-data kerentanan
  asli dipertahankan** (admin_username, admin_password, debug_endpoint).
- `network_security_config.xml` — percaya user CA + cleartext (V-08) agar
  demo MITM Burp bekerja.
- Release build `debuggable true` (V-09) agar demo `run-as` bekerja.
- `build.gradle`: abiFilters `arm64-v8a`, `x86_64`; buildTools 36.0.0.

### Yang TIDAK berubah (kerentanan asli dipertahankan)
- `API_BASE = https://vulnbank.org` (src/utils/api.ts)
- JWT di AsyncStorage plaintext (AuthContext.tsx)
- Otorisasi admin client-side (`username === 'admin'`)
- `Secrets.java` (hardcoded JWT, IP internal, API key)
- `PrefsHelper.java` + `MainActivity.kt` (kredensial plaintext di
  SharedPreferences, JWT di logcat, FLAG CTF)

## Build

```cmd
cd android
gradlew.bat assembleRelease
:: output: app\build\outputs\apk\release\app-release.apk
```

Persyaratan: JDK 17/21 (mis. Android Studio JBR), Android SDK
(platforms;android-35, build-tools 36.0.0), Node + npm install.

## Test di emulator

```cmd
emulator.exe -avd Pentest          :: Wear OS 4 round XL (sudah ada)
adb install -r app-release.apk
```

## Struktur kerentanan (ringkas)

- Asli (ponsel): lihat PANDUAN-DEMO-PENTEST.md §2 (V-01..V-10)
- Khas jam: §3 (V-W1..V-W5)
