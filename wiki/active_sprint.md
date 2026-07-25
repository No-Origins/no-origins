# Active Session Tracker

This document tracks active development goals, session checklists, and staged documentation modifications. It acts as the living "sprint board" for human developers and AI agents working on the No Origins workspace.

---

## Current Goal
- **Focus**: Finish EAS device pipeline after **paid Apple Developer Program** enrollment, then resume product work (haptics port, Feed/Compose unify, device smoke).
- **Blocked until tonight (user)**: Paid Apple Developer membership for physical iPhone builds, TestFlight, and production push entitlements.
- **Prior session completed (2026-07-24)**: EAS fully configured; iOS **simulator** + Android **development** builds finished; PRs open for web + mobile; GitHub under No-Origins org.

---

## Resume here (next session)

### 1. First prompt after Apple membership (device iOS)
```
cd visual-labs-mobile
eas build -p ios --profile development
```
- Interactive: Apple login → certs for `com.noorigins.visuallabs` → register HiddenStack iPhone UDID.
- Install from build page QR/link on device.
- Then: `npx expo start --dev-client` (same Wi‑Fi or tunnel).

### 2. Or continue without device (no Apple yet)
- **iOS Simulator**: already installed once; re-run `./scripts/run-ios-sim.sh` or `eas build:run -p ios --latest`
- **Android APK**: install finished development build (link below)
- Product work that does not need device: haptic port, Feed/Compose unify, web PR review/merge

### 3. Open PRs (do not lose these)
| Repo | PR | Branch |
| :--- | :--- | :--- |
| **visual-labs** (web) | https://github.com/bhargavAtgithub/visual-labs/pull/10 | `feat/social-feed-profile-and-mobile-parity` |
| **visual-labs-mobile** | https://github.com/No-Origins/visual-labs-mobile/pull/1 | `feat/initial-mobile-companion` |

Suggested merge order: **web PR #10 first** (migrations 0005–0010), then mobile PR #1.

---

## Active Checklist

### Shipped this arc (EAS / shipping infrastructure)
- [x] Mobile repo under **No-Origins** GitHub: `https://github.com/No-Origins/visual-labs-mobile`
- [x] Expo project **@no-origins/visual-labs-mobile** — `projectId` `1621f8c3-ceaa-497e-b9e0-0285e18cf2a5`, owner `no-origins`
- [x] `eas.json` profiles: `development`, `development-simulator`, `preview`, `production`
- [x] EAS env vars (development / preview / production): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive), `EXPO_PUBLIC_WEB_URL`
- [x] Bundle / package: **`com.noorigins.visuallabs`** (was `com.anonymous…`)
- [x] `expo-dev-client` + `expo-updates` (channels + `runtimeVersion: appVersion`)
- [x] EAS Workflow stub: `.eas/workflows/build-development.yml`
- [x] Helper: `visual-labs-mobile/scripts/run-ios-sim.sh`
- [x] **iOS simulator build FINISHED** — installable on Mac Simulator
- [x] **Android development build FINISHED** — APK available
- [ ] **iOS device development build** — needs paid Apple account + interactive `eas build -p ios --profile development`
- [ ] iOS push entitlements / APNs after paid program
- [ ] Merge PRs #10 (web) and #1 (mobile)

### Carry-forward product (not blocked on Apple)
- [x] Profile parity, pills, avatars, social migrations (in web PR #10)
- [ ] Port haptic scroll + click to mobile InfiniteMenu
- [ ] Unify Feed / Compose UI web ↔ mobile
- [ ] Device smoke: profile photo + username, report/block, delete cancel path

---

## EAS / Expo reference (copy-paste)

| Item | Value |
| :--- | :--- |
| Expo dashboard | https://expo.dev/accounts/no-origins/projects/visual-labs-mobile |
| Builds | https://expo.dev/accounts/no-origins/projects/visual-labs-mobile/builds |
| Env vars | https://expo.dev/accounts/no-origins/projects/visual-labs-mobile/environment-variables |
| Logged-in CLI user | `hiddenstack` (Owner of `no-origins` org) |
| Local path | `/Users/hiddenstack/Creatives/no-origins/visual-labs-mobile` |
| Git remote | `https://github.com/No-Origins/visual-labs-mobile.git` |
| Branch | `feat/initial-mobile-companion` @ `29084e3` |

### Finished builds (as of handoff)
| Platform | Profile | ID | Artifact |
| :--- | :--- | :--- | :--- |
| **iOS Simulator** | `development-simulator` | `9a84623f-fc9d-427a-963f-15d97c6e7ae2` | [build](https://expo.dev/accounts/no-origins/projects/visual-labs-mobile/builds/9a84623f-fc9d-427a-963f-15d97c6e7ae2) · [tar.gz](https://expo.dev/artifacts/eas/_ffpY952aOcO1LaqB31Csqjbh-4GiooGQ2xrBArJ7wg.tar.gz) |
| **Android** | `development` | `bf98509c-fe66-4829-822a-148985174d0c` | [build](https://expo.dev/accounts/no-origins/projects/visual-labs-mobile/builds/bf98509c-fe66-4829-822a-148985174d0c) · [APK](https://expo.dev/artifacts/eas/HYisQYaoK9bxYfkwYZ-J6T_Bi4DyPq-w6RYW_5ac26Q.apk) |

### Local sim install (already done once; re-run if needed)
```bash
cd visual-labs-mobile
open -a Simulator
xcrun simctl boot "iPhone 17 Pro" 2>/dev/null || true
# Prefer:
eas build:run -p ios --id 9a84623f-fc9d-427a-963f-15d97c6e7ae2
# Or extract tar.gz → VisualLabs.app:
# xcrun simctl install booted ./VisualLabs.app
# xcrun simctl launch booted com.noorigins.visuallabs
# Deep link scheme: exp+visual-labs-mobile
xcrun simctl openurl booted "exp+visual-labs-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
npx expo start --dev-client
```

### Known limits without paid Apple
- Cannot EAS-build **device** iOS (`development` profile failed non-interactive: no internal distribution credentials).
- No TestFlight / App Store / production APNs.
- Free personal team also cannot add push entitlement (documented earlier).

---

## Key paths
| Area | Where |
| :--- | :--- |
| **Mobile EAS config** | `visual-labs-mobile/eas.json` |
| **App identity** | `visual-labs-mobile/app.json` — `com.noorigins.visuallabs`, owner `no-origins` |
| **Sim helper** | `visual-labs-mobile/scripts/run-ios-sim.sh` |
| **Web PR branch** | `visual-labs` → `feat/social-feed-profile-and-mobile-parity` |
| **Web profile** | `visual-labs/src/app/(base)/(cards)/profile/page.tsx` |
| **Migrations** | `visual-labs/supabase/migrations/0005`–`0010` |
| **Mobile profile** | `visual-labs-mobile/app/(tabs)/profile.tsx` |
| **Mobile menu (haptics port)** | `visual-labs-mobile/src/InfiniteMenu.tsx` |
| **Web haptics source** | `visual-labs/src/audio.ts`, `visual-labs/src/components/InfiniteMenu.tsx` |
| **Social schema** | [social_schema.md](realm/social_schema.md) |
| **Mobile plan** | [app_plan.md](visual-labs-mobile/app_plan.md) |

---

## Session Notes & Context
- **GitHub mobile** moved to org **No-Origins** (not personal `bhargavAtgithub`). Local `origin` updated.
- **Expo account** `hiddenstack` owns org **no-origins**; project already had `extra.eas.projectId`.
- **Env**: local `.env` gitignored; EAS mirrors values for cloud builds. Prefer EAS secrets / no hardcoded anon key fallback long-term (`src/supabase.ts` still has publishable fallback).
- **Simulator**: biometrics N/A — leave toggle off. Smoke auth/feed/profile/projects open-on-web on sim.
- **Android APK** finished after sim; install anytime for physical device testing without Apple.
- **Web** uncommitted work was committed on `feat/social-feed-profile-and-mobile-parity` and opened as PR #10; local `next-env.d.ts` drift intentionally not committed.
- **Wiki parent** `no-origins` has **no git remote** — wiki notes stay local unless user adds one.
- **Device:** HiddenStack (iPhone 14 Pro) · **Web:** https://no-origins.com

---

## Suggested first prompts next session

**A — Apple membership obtained**
1. “Run interactive iOS device development build and walk me through installing on HiddenStack.”
2. “After device install, smoke profile photo + feed + push registration path.”

**B — Still no Apple / product focus**
1. “Port InfiniteMenu scroll + click haptic sounds to visual-labs-mobile, matching the web feel.”
2. “Install/verify Android development APK and smoke auth + feed.”
3. “Review and merge visual-labs PR #10, then mobile PR #1.”
