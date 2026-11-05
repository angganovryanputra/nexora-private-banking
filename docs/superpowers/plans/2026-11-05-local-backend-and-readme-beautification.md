# Local-Only Backend Enforcement & GitHub Repository Beautification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip all external internet backend URLs across Wear OS, Android, watchOS, and iOS applications so they operate strictly with the local air-gapped Python/Flask backend, rebuild updated APKs, and transform the main repository `README.md` into an elite, search-optimized (SEO) cybersecurity showcase for smartwatch pentesting researchers and tender evaluators.

**Architecture:** The entire ecosystem (Android Phone, Wear OS Smartwatch, iPhone 11, Apple Watch) routes exclusively through the local Python Flask relay (`0.0.0.0:5000`) and local ad-hoc channels (`WCSession` / Bluetooth LE). All external domain dependencies (such as `nexorabank.internal`) are removed and replaced with local network targeting (Emulator `10.0.2.2:5000`, Simulator `localhost:5000`, and LAN `192.168.1.X:5000`).

**Tech Stack:** React Native 0.82, Native SwiftUI (watchOS 9+), Python 3 / Flask / SQLite3, Markdown (GitHub Flavored with Badges & Mermaid).

**Spec:** User instruction to eliminate external internet backend references and beautify the repository README for maximum discoverability and academic/enterprise research value.

## Global Constraints
- Zero external internet network dependencies; all features must work 100% offline or on a local LAN/air-gapped network.
- Maintain compatibility with Android 10+ (API 29+) and watchOS 9.0+ / iOS 15.1+.
- All 14 vulnerable challenge pillars and compliance scorecards (OJK POJK 11/2022, SNAP QRIS, PCI-DSS v4.0) must remain functional.

## Review Focus
1. Verifying that switching backend targets in the app only toggles between local targets (Emulator localhost vs LAN IP) and has zero outbound internet calls.
2. Confirming that `npx tsc --noEmit` and backend unit tests pass without error.
3. Ensuring the main `README.md` features prominent search tags, badges, clear architecture diagrams, download tables, and direct links to both demo guides.

---

### Task 1: Enforce 100% Local-Only Backend Across All Screen Components

**Files:**
- Modify: `src/screens/PentestLabScreen.tsx:410-435`
- Modify: `src/utils/api.ts:1-25`

**Interfaces:**
- Consumes: `setApiBase(url: string)`
- Produces: Clean local network endpoints (`10.0.2.2:5000`, `localhost:5000`, `192.168.1.x:5000`) with zero references to `nexorabank.internal`.

- [ ] **Step 1: Check existing references to external URLs**
  Run: `git grep -i "nexorabank.internal"`
  Expected: Found in `PentestLabScreen.tsx` and comments.

- [ ] **Step 2: Update `PentestLabScreen.tsx` to replace Cloud switcher with LAN Wi-Fi Switcher**
  Replace `https://nexorabank.internal` with local Wi-Fi LAN target (`http://192.168.1.100:5000`).
  
- [ ] **Step 3: Update `src/utils/api.ts` comments to remove any external cloud references**
  Ensure default comments explicitly denote local air-gapped execution.

- [ ] **Step 4: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Verify zero external cloud references in codebase**
  Run: `powershell -Command "Get-ChildItem -Recurse -Path 'src', 'backend', 'ios', 'android' -File | Select-String -Pattern 'nexorabank\.org'"`
  Expected: Empty output (zero matches).

---

### Task 2: Recompile Android Release APKs (Local Backend Only)

**Files:**
- Modify: `nexora-universal-release.apk`
- Modify: `nexora-wear-release.apk`
- Modify: `nexora-companion-release.apk`

- [ ] **Step 1: Execute Gradle release build**
  Run: `cd android && ./gradlew assembleRelease`
  Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2: Distribute new APK binaries to root folder**
  Copy `app-release.apk` to `nexora-universal-release.apk`, `nexora-wear-release.apk`, and `nexora-companion-release.apk`.

---

### Task 3: Author Elite, Search-Optimized GitHub `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Structure comprehensive README with high-impact elements**
  - Badges (OWASP, OJK, SNAP QRIS, PCI-DSS, Wear OS, watchOS, Android, iOS, License).
  - Search keywords & meta tags for researcher discoverability.
  - ASCII / Mermaid System Architecture.
  - Vulnerability matrix table (Wear OS vs Apple watchOS vs Companion).
  - Quick 5-Minute Setup for local backend and dual-device testing.
  - Quick Download table for Release APKs and IPA.
  - Direct links to `PANDUAN-DEMO-PENTEST.md` and `TUTORIAL-SETUP-DAN-WRITEUP-WATCHOS.md`.

- [ ] **Step 2: Review formatted markdown for layout clarity and link accuracy**

---

### Task 4: Git Commit & Remote Synchronization

- [ ] **Step 1: Stage and commit all changes**
- [ ] **Step 2: Push to `main` branch on GitHub repository `angganovryanputra/nexora-private-banking`**
- [ ] **Step 3: Verify GitHub remote state**

