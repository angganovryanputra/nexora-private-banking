# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

An **intentionally vulnerable** banking app ("Nexora Bank OmniWear" / `com.nexorabank.omniwear`) built for **security education and penetration-testing demos on Wear OS**. It is a Wear OS port of the upstream phone app [Commando-X/vuln-bank-mobile](https://github.com/Commando-X/vuln-bank-mobile), preserving the original web/mobile vulnerabilities and adding smartwatch-specific attack surface (health sensors, companion pairing, Bluetooth relay, tapjacking).

**CRITICAL:** The security weaknesses in this codebase are deliberate training targets, not bugs. Do **not** "fix", harden, or remove them unless explicitly asked — doing so breaks the demos. Vulnerabilities are catalogued with `V-##` / `V-W##` IDs (see `docs/`) and are usually marked with comments like `// INTENTIONALLY VULNERABLE`. When editing near them, preserve the vulnerable behavior.

## Architecture

Two independently-runnable halves that talk over plain HTTP:

### 1. Mobile/wearable client — React Native 0.79.1 + TypeScript (React 19)
- Entry: `index.js` → `App.tsx` → `src/navigation/AppNavigator.tsx`.
- **Navigation is manual, state-based** (no react-navigation): `AppNavigator` holds `currentScreen` state and a `navigate()` function; screens live in `src/screens/*.tsx` and `ScreenType`/`ScreenParams` are defined in `src/navigation/types.ts`.
- **Auth** is in `src/contexts/AuthContext.tsx` — JWT + user info stored **plaintext in AsyncStorage**; admin status derived client-side (`isAdmin`). Intentional.
- **All HTTP** goes through `src/utils/api.ts`: `apiRequest`/`get`/`post`/`put`/`del`, the central `ENDPOINTS` map, and `API_BASE` (defaults `http://10.0.2.2:5000` on Android emulator, `http://localhost:5000` on iOS; overridable at runtime via `setApiBase`, persisted to AsyncStorage key `custom_api_base`). Add new endpoints to `ENDPOINTS`, not inline strings.
- **Styling** auto-scales for tiny round/square watch screens via `src/styles/theme.ts` (font ×0.75, spacing ×0.55, radius ×0.6) and `src/styles/globalStyles.ts` (circular BoxInset approximation). Use these tokens — don't hardcode sizes.
- `src/utils/watchOSBridge.ts` bridges to the native iOS `WatchBridge` module (WatchConnectivity).

### 2. Native Android layer — Kotlin/Java, `android/app/src/main/java/com/nexorabank/omniwear/`
- React Native native modules registered in `MainApplication.kt`: `HeartRateModule`/`HeartRatePackage` (BODY_SENSORS heart rate, simulated on emulator), `BluetoothSyncModule`, `SecurityCheckModule`.
- Intentionally insecure components: `Secrets.java` (hardcoded JWT/API key/internal IP), `PrefsHelper.java` (plaintext credentials in SharedPreferences, JWT leaked to logcat), exported activities/receivers (`HealthDataActivity`, `TapjackDemoActivity`, `AuthBroadcastReceiver`, `QuickPayReceiver`). Keep these exported and unauthenticated — see `AndroidManifest.xml`.
- `res/xml/network_security_config.xml` trusts user CAs + cleartext (for Burp MITM demos); release builds are `debuggable true` (for `adb run-as`).

### 3. Backend — single-file Python Flask, `backend/server.py`
- Run with `python server.py` → listens on `0.0.0.0:5000`. SQLite DB `backend/nexora_vault.db` (WAL mode), auto-created/seeded by `init_db()`. Currency is IDR.
- ~40 routes decorated with `@app.route`; the central `ENDPOINTS` map in `src/utils/api.ts` mirrors them. Key intentional flaws: SQLi on `POST /login`, BOLA/IDOR on `/check_balance/<acct>` & `/transactions/<acct>`, negative-amount logic flaw on `POST /transfer`, info disclosure on `GET /sup3r_s3cr3t_admin` & `/debug/users`, unauth exfil on `POST /debug/heart`, QRIS replay on `/api/qris/checkout`, unsigned wearable event bus under `/api/wearable/*`, weak OTP on `/api/atm/cardless-cash/verify`. `MASTER_JWT` is hardcoded and matches `Secrets.java`.
- The `/api/wearable/*` routes implement a polling-based event bus (pair → dispatch → poll events → resolve) that is the phone↔watch companion relay; `src/utils/api.ts` has helpers (`pairWearable`, `dispatchWearableEvent`, `pollWearableEvents`, etc.).

## Commands

Run RN (Metro) and Python backend commands from the repo root; the backend tests from `backend/`.

```bash
# Client (React Native)
npm install                 # install JS deps
npm start                   # Metro bundler
npm run android             # build + run on connected device/emulator
npm run ios                 # iOS
npm run lint                # ESLint (@react-native config)
npm test                    # Jest (all)
npx jest __tests__/App.test.tsx   # single JS test

# Android release APK (intentionally debuggable; debug keystore)
cd android && ./gradlew assembleRelease   # Windows: gradlew.bat assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk

# Backend (Flask, needs: pip install flask)
cd backend && python server.py            # serves http://0.0.0.0:5000
python -m unittest test_all_banking_flows   # or: test_pentest_challenges / test_wearable_relay
python -m unittest test_all_banking_flows.TestEnterpriseBankingFlows.test_qris_checkout_and_replay  # single test
```

Backend tests import `app`/`init_db` from `server.py` and use Flask's `test_client()` (no network). They assert the vulnerable behaviors still hold (e.g. QRIS replay succeeds), so a failing test may mean a vulnerability was accidentally removed.

Build toolchain: JDK 17/21, Android SDK platform 35, build-tools 36.0.0, Kotlin 2.0.21, Node ≥18. `minSdk 29`, `target/compileSdk 35`.

## Environment notes

- Primary dev OS is Windows (PowerShell). Prefer forward-slash absolute paths in tools; `gradlew.bat` on Windows vs `./gradlew` elsewhere.
- Physical watch/phone: set backend URL to `http://<PC-IP>:5000` in-app (Pentest Lab / companion pairing screen) or via `setApiBase`.
- Reference docs live in `docs/` (`ANDROID_WEAROS_GUIDE.md`, `APPLE_WATCHOS_GUIDE.md`, `docs/references/*`); design/plan notes under `docs/superpowers/`. The `V-##`/`V-W##` vulnerability catalog is the source of truth for what each weakness is and why it exists.
