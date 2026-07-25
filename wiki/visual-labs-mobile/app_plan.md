# Visual Labs — Mobile App Plan

> **Status:** Draft for review. Companion mobile app for Visual Labs (native React Native / Expo), iOS + Android, both app stores. This doc is the planning source of truth; nothing is built yet.
>
> **Companion to:** [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md) (web visual system) and the existing [visual-labs](file:///Users/hiddenstack/Creatives/no-origins/visual-labs) Next.js app.
> **Last revised:** 2026-07-15

---

## 0. Decisions locked (from kickoff)

| Question | Decision |
| :--- | :--- |
| **Purpose / scope** | **Companion app** — do what mobile is good at (browse, notify, quick capture, light interaction). Heavy editing (tldraw canvas, long-form editor) stays on web. |
| **Build approach** | **Native rewrite in React Native / Expo** — not a Capacitor/web wrapper. Best feel + full access to native APIs. |
| **Platforms / distribution** | **iOS + Android**, shipped to **Apple App Store + Google Play**. |
| **Must-have native features (v1)** | **Push notifications, biometric login, offline access, camera/photo capture.** |
| **WebGL shell** | **IN scope** — the `LiquidMetalSphere`, `InfiniteMenu`, and particle fields (`DotField`/`BackdropField`) ARE wanted on mobile. Reimplemented natively, not reused (RN has no `<canvas>`). |
| **Render engine** | **Skia-first, per-component** — particle fields + liquid-metal sphere in `react-native-skia` (SkSL). `expo-gl`/three.js used **only if** the infinite menu proves to need true 3D. |
| **Navigation** | **Hybrid** — sphere/infinite-menu is the signature **Home** experience; a native **bottom tab bar** handles reliable everyday navigation. |
| **AI assistant** | **Deferred** — not in v1 (removes the Gemini→Edge-Function dependency from the critical path). |
| **Sphere fidelity** | **"Same general vibe"** — not pixel-identical to web. Keeps us **Skia-only**; the expo-gl/three.js escalation is off the table. |
| **Social feed** | **IN scope** — build real feed tables + screens (not Projects-only). Gives Capture somewhere to post. Exact shape being defined (§9.1). |

Feature scope stays "companion" (browse / notify / capture / light interaction — no editing), but the **brand-defining visual shell is now in scope**. RN has no DOM/`<canvas>`, so those three components are **reimplemented in Skia**, not ported. This changes the effort profile materially — see §10/§11: this is now a graphics-engineering track, not a light wrapper. Still **out of scope**: the editable `tldraw` canvas and `TipTap` editor (editing stays on web).

---

## ⏱ RESUME HERE — build status (2026-07-24 evening) · EAS handoff

**Device:** HiddenStack (iPhone 14 Pro) · **Metro:** `npx expo start --dev-client` · **Web:** https://no-origins.com  
**Handoff board (canonical):** [active_sprint.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md) — build IDs, PRs, first prompts.

### v1 companion — largely DONE
| Track | Status |
| :--- | :--- |
| Auth / MFA / Profile / Face ID | Done |
| Projects browse + open-on-web | Done |
| Feed + compose + likes/comments/follow | Done |
| Offline Query cache | Done |
| Home field-only + InfiniteMenu | Done; `FORCE_WAVES_ONLY` |
| Report / Block + feed filters | Done |
| Admin reports queue | Done |
| Account deletion (soft RPC) | Done |
| GitHub | **No-Origins/visual-labs-mobile** · branch `feat/initial-mobile-companion` · [PR #1](https://github.com/No-Origins/visual-labs-mobile/pull/1) |
| Expo / EAS | **@no-origins/visual-labs-mobile** · `projectId` `1621f8c3-ceaa-497e-b9e0-0285e18cf2a5` · `eas.json` profiles + env vars |
| Bundle ID | **`com.noorigins.visuallabs`** (no longer anonymous) |
| iOS **simulator** EAS build | **Finished** `9a84623f-fc9d-427a-963f-15d97c6e7ae2` — installed on iPhone 17 Pro sim once |
| Android **development** EAS build | **Finished** `bf98509c-fe66-4829-822a-148985174d0c` — [APK](https://expo.dev/artifacts/eas/HYisQYaoK9bxYfkwYZ-J6T_Bi4DyPq-w6RYW_5ac26Q.apk) |
| iOS **device** EAS build | **Blocked** — needs paid Apple Developer Program + interactive `eas build -p ios --profile development` |
| iOS Expo push / APNs | **Blocked** — same paid program |

### Hard constraints (don’t relearn)
1. **Thermal:** no full-screen raymarch sphere; mobile field is WAVES-only.
2. **iOS push:** do **not** add `aps-environment` until paid Apple Developer Program.
3. **Native rebuild env:** always `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
4. **UIScene:** keep SceneDelegate + `plugins/withSceneDelegate.js` for iOS 27 blank-screen fix.
5. **Shared Supabase** with web; migrations `0005`–`0010` (social + profile) — ensure applied; live in web PR #10.
6. **Deep link scheme for dev client:** `exp+visual-labs-mobile` (not `exp+visuallabs`).
7. **Local `.env` never commit**; EAS has the three `EXPO_PUBLIC_*` vars for all environments.

### Next actions (new session)
1. **After paid Apple:** `eas build -p ios --profile development` (interactive credentials) → install on HiddenStack → smoke + optional push entitlements.
2. **Without Apple:** Android APK smoke; iOS Simulator via `./scripts/run-ios-sim.sh`; product (haptics port, Feed/Compose unify).
3. **Merge PRs:** web [PR #10](https://github.com/bhargavAtgithub/visual-labs/pull/10) first, then mobile PR #1.
4. Optional: Edge Function hard-delete `auth.users` after soft account teardown.

---

## Earlier status (2026-07-15)

**Design phase complete + graphics spike DONE (validated on web).** The riskiest track — the WebGL shell reimplemented in Skia — is proven.

### What's built
- Repo scaffolded: [visual-labs-mobile](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/) (sibling of [visual-labs](file:///Users/hiddenstack/Creatives/no-origins/visual-labs)), **Expo SDK 57** (RN 0.86, React 19.2, New Arch) — note: **SDK 57, not the 56 originally assumed.**
- Deps: `@shopify/react-native-skia` 2.6.2, `react-native-reanimated` 4.5 (+ `react-native-worklets` 0.10), `react-native-gesture-handler` 2.32, `expo-blur` pending. Web target: `react-native-web` + `react-dom` + `canvaskit-wasm` (served from `public/canvaskit.wasm`).
- Spike files: [sphereShader.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/sphereShader.ts) (GLSL→SkSL sphere port), [SpikeScreen.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/SpikeScreen.tsx) (Atlas dot field + one `touchPoint` gesture), [App.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/App.tsx) (platform gate: `WithSkiaWeb` on web, direct on native), [babel.config.js](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/babel.config.js) (worklets plugin).

### Spike results (all ✅, verified in-browser via the preview tools)
- **Sphere SkSL port** compiles + renders faithfully — liquid-mercury chrome, 4-octave fBm surface, studio lighting, fresnel, ambient rotation. "Same vibe" bar met. (Dropped for spike: click ripple, mouse-velocity stretch, camera parallax — all straightforward to re-add.)
- **Atlas dot field** renders as a backdrop; `useRSXformBuffer` worklet runs on web; per-frame transforms animate (ambient flow).
- **Touch behavior** works: one `touchPoint` shared value, dots flow radially outward within a radius following the finger. Exactly the locked single-interaction spec.

### Hard-won environment findings (don't relearn these)
1. **`MakeOffscreen` snapshots come back BLANK on the CanvasKit/web backend.** Build Atlas textures from an **encoded PNG** via `Skia.Data.fromBase64` + `Skia.Image.MakeImageFromEncoded` instead (see [SpikeScreen.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/SpikeScreen.tsx) — `DOT_PNG_B64`). Untested whether native offscreen works; the PNG path is cross-platform so we standardized on it.
2. **`babel-preset-expo` was missing** from the scaffold and must be a devDependency, else Metro fails to construct the transformer.
3. **iOS Simulator is BLOCKED (needs user action).** `simctl` hangs because Xcode 26.6's **first-launch components aren't installed** (`xcodebuild -checkFirstLaunchStatus` → exit 69). Fix = `sudo xcodebuild -runFirstLaunch`, which needs an **admin password**. This machine has **no passwordless sudo** and the user is **remote** (can't type a password), so the native build is parked until they can run it locally. Symptom if you forget: every `simctl`/`expo run:ios` hangs forever — kill with `pkill -9 -f simctl`.
4. Disk was at 100% early on; freed ~9 GB (npm cache + Xcode `iOS DeviceSupport`). Keep an eye on it — an iOS build needs several GB.

### Web dev loop (reusable, no Xcode)
`.claude/launch.json` has an **`expo-web`** config → `expo start --web --port 8082`. Start it with the preview tooling; then screenshot / eval / inspect in the browser. This validates SkSL shaders, Atlas, gestures, and layout without a simulator. Pointer events drive gesture-handler on web (dispatch `PointerEvent`s to simulate touch).

### Admin-config wiring (DONE — Supabase-driven)
The sphere + field now read the **admin-set configuration** from the shared Supabase backend, exactly like the web. Resolution mirrors the web: `stages[name].state_id → states[id].presets.{liquid,field} → component_presets[id].settings`.

Mobile reads the **`RELEASE`** stage by default. Files: [supabase.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/supabase.ts) (anon client, `persistSession:false`), [useVisualConfig.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/useVisualConfig.ts) (fetch + resolve, CALM defaults as fallback), [sphereShader.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/sphereShader.ts) (all params are now **uniforms**, all 5 themes ported).

RLS: `component_presets`/`states`/`stages` have `Allow public read access` (SELECT for `public`), so the anon key reads them. Proven end-to-end: setting the default theme to 4 (emerald) still rendered obsidian (theme 3 from the DB). An admin change in the web panel shows up **live** via a Supabase Realtime subscription (added the 3 config tables to the `supabase_realtime` publication in migration `enable_realtime_visual_config`; the hook opens a `postgres_changes` channel on all 3 and re-resolves on any change, bumping a `revision`).

Field `settings` map: `fieldGap`→grid, `fieldDotSize`→dot scale (`/16`), `fieldRepulsionRadius/Strength`→touch, `fieldState`→mode, `rainSpeed/rainDirection/rainLineLength`→rain. Liquid `size`→zoom (`1.05 / size`), `transparency`→sphere alpha. NOTE: `useRSXformBuffer` in Skia 2.6.2 takes only `(count, callback)` — no deps arg.

**Field modes (corrected after user feedback).** The web `DotState "WAVES"` is a *static* spring grid — it does NOT drift/wave at rest; it only moves on interaction. (An earlier mobile build had an invented sine drift — removed.) Mobile field modes, driven by `fieldState`:
- `WAVES` — static dot grid + the one touch-displacement (radius = `fieldRepulsionRadius`).
- `ASTEROID_RAIN` — streaks travel along `rainDirection` at `rainSpeed`, wrapping the screen, with trailing lines of `rainLineLength`. Rendered as **stroked Skia `<Path>`s** (two passes: dim full tail + brighter head-portion, approximating the head→tail fade). Thickness = `rainStroke` (= `fieldDotSize`), so it's **admin-controlled and length-independent** (unlike the earlier uniform-scaled sprite, which coupled width to length — replaced). Rain uses a large gap → few segments → cheap. Both modes proven in-browser; admin flips WAVES↔RAIN live via realtime.

**Realtime PROVEN live (2026-07-15):** the user edited the sphere config in the web admin panel and the mobile preview re-rendered with no reload; the `rev` counter climbed to 21 across their saves. (Direct DB writes from here are blocked by auto-mode as shared-resource mutations — that's expected; drive changes through the web panel.)

### Phase 2 skeleton — DONE (web-validated)
Expo Router (file-based) + NativeWind v4 + the native 4-tab bar are in and verified in-browser.
- Entry: `package.json` main → `expo-router/entry`; `app.json` gained `scheme: visuallabs` + `userInterfaceStyle: dark`. `app/_layout.tsx` (providers + `import '../global.css'`), `app/(tabs)/_layout.tsx` (Tabs: Home·Feed·Projects·Profile, Ionicons), screens `app/(tabs)/{index,feed,projects,profile}.tsx`. Home hosts the sphere via the web Skia gate.
- NativeWind v4: `babel.config.js` (`babel-preset-expo` w/ `jsxImportSource: nativewind` + `nativewind/babel`, worklets plugin LAST), `metro.config.js` (`withNativeWind`, input `./global.css`), [tailwind.config.js](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/tailwind.config.js) (content globs, `nativewind/preset`, **`darkMode: 'class'`** — required or NativeWind-web throws "dark mode is type 'media'"), `global.css`, `nativewind-env.d.ts`, `global.d.ts` (`declare module '*.css'`). `@expo/vector-icons` installed for tab icons.
- [SectionProvider.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/SectionProvider.tsx): sets `--section-accent{,-soft,-deep}` via `vars()` per screen; Tailwind `section` color reads `var(--section-accent)`; components use `bg-section`/`text-section`. Hues: core/projects emerald, feed fuchsia, profile indigo. Verified swapping live (Feed=fuchsia, Profile=indigo). NOTE: config changes (babel/metro/tailwind) need a Metro RESTART, not just reload.
- Minor: rain path uses `Skia.Path.moveTo/lineTo` → deprecation warnings; migrate to `Skia.PathBuilder` later. The `config: Supabase …` badge on Home is still a spike indicator.

### ✅ iOS 27 / physical-device blank screen FIXED (2026-07-24)
Root cause was **UIScene lifecycle**, not Metro/signing. Expo SDK 57 stable still attaches RN to an AppDelegate-owned `UIWindow(frame:)`; on iOS 27 that leaves a blank window (device reported as **HiddenStack (27.0)** — "iOS 26 beta" in casual speech). Fix mirrors Expo `main`:
- Added `ios/visuallabsmobile/SceneDelegate.swift` — `UIWindow(windowScene:)` + `startReactNative`
- AppDelegate only builds the RN factory (no window)
- `UIApplicationSceneManifest` in Info.plist + `app.json`
- Config plugin `plugins/withSceneDelegate.js` so `prebuild` keeps the fix
Verified on **iPhone 17 Pro simulator (iOS 27)**: sphere + ASTEROID_RAIN + live Supabase config render after bundle. Reinstall on the physical phone with `npx expo run:ios --device` (phone was offline during this session).

### ✅ NATIVE RUN ACHIEVED on iOS Simulator (2026-07-16)
The app runs natively (native Skia, not web CanvasKit) on the iPhone 17 Pro simulator — sphere + rain field + live Supabase config all rendering. Hard-won path + the fixes that matter:
1. `sudo xcodebuild -runFirstLaunch` (user, one-time) — unblocks `simctl`.
2. **CocoaPods + Ruby 4.0 encoding bug** → always build with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` (pod install/prebuild/run:ios). Without it: "Unicode Normalization not appropriate for ASCII-8BIT".
3. **Never open the project in Xcode for a routine build** — Xcode's "Update to Recommended Settings" rewrites the app target's `IPHONEOS_DEPLOYMENT_TARGET` to `$(RECOMMENDED_…)` = 15.0, below Expo's 16.4 min → "module 'Expo' has a minimum deployment target of iOS 16.4" + cryptic prebuilt-module "Unexpected failure". Fixed by pinning via **`expo-build-properties` plugin** (`ios.deploymentTarget: "16.4"` in [app.json](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/app.json)) so `expo prebuild --clean` regenerates it correctly and it can't regress.
4. **CanvasKit must NOT enter the native bundle.** `require('@shopify/react-native-skia/lib/module/web')` drags in `canvaskit-wasm` whose `canvaskit.js` uses Node `fs`/`path` → red-screen "Unable to resolve module fs". Fixed with **platform files**: [HomeGraphics.native.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/HomeGraphics.native.tsx) (renders `SpikeScreen` directly) vs [HomeGraphics.web.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/HomeGraphics.web.tsx) (WithSkiaWeb + CanvasKit). Route imports `../../src/HomeGraphics`.
5. Recovery when `ios/` gets inconsistent: `expo prebuild --clean -p ios` (with the LANG env). Disk needs ~8-10GB free for a build; the iOS platform/runtime can get wiped by a disk-full event (`xcodebuild -downloadPlatform iOS` re-installs it, ~8.5GB).

Bundle id: `com.anonymous.visual-labs-mobile`. Rebuild/run: `cd visual-labs-mobile && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios` (simulator). Reload after JS edits: `xcrun simctl terminate booted <bundleid> && xcrun simctl launch booted <bundleid>` (Metro must be up).

### Next actions (post auth)
- **Feed backend** — new tables (`posts`/`post_likes`/`comments`/`follows` + moderation — §5.5) then Feed UI + compose/capture.
- **Native v1** — push tokens, biometrics gate, offline query cache (after auth).
- (optional cleanup) migrate rain `Skia.Path.moveTo/lineTo` → `Skia.PathBuilder`; drop the `config: …` spike badge.

**Accounts:** still none for store (Apple/Google/Expo) — only needed for App Store / on-device push, not for local device/simulator.

---

## 1. Key finding: what actually exists to show

The web app presents nine "sections," but the backend tells a narrower story. From `supabase/migrations/*` and the client `.from()` calls:

| Section | Backed by a table? | Mobile v1 verdict |
| :--- | :--- | :--- |
| **Projects** | ✅ `projects` + `project_versions` (published flag, fork lineage, `canvas_data` JSONB) | **Core content.** Browse/read published projects, view version history, fork metadata. |
| **Profile** | ✅ `profiles` (role, status, MFA, email) | **Core.** Identity, account, sign-out, MFA status. |
| **AI sphere chat** | ⚙️ Gemini via `api/chat-sphere` route (no table; a route) | **Strong v1 candidate** — a chat/assistant tab is very mobile-native. |
| **Admin config** | ✅ `presets`, `stages`, `component_presets`, `states` (visualizer presets, admin-write) | Not user-facing content; skip for v1. |
| Stories / Society / Community (social) | ❌ No tables today → **being built for v1** | New feed schema + screens (shape in §9.1). This is the v1 social layer. |
| Hyperbase, Spotify, Credits, Labs | ❌ No tables — conceptual pages | Out of v1. |

**Implication:** the only content that exists today is Projects + Profiles. **Decision made:** v1 also **builds the social layer** — new feed tables so there's something social to browse and somewhere for Capture to post. So v1 content = **Projects + Profile + Social feed + Capture** (AI deferred).

---

## 2. Target architecture

```
┌─────────────────────────────────────────────┐
│  Mobile app (Expo / React Native, native)    │
│  Expo Router · NativeWind · Reanimated        │
│  supabase-js (AsyncStorage + SecureStore)     │
│  TanStack Query (+ offline persistence)       │
└───────────────┬───────────────────────────────┘
                │ same project, same RLS
┌───────────────▼───────────────────────────────┐
│  Supabase (SHARED with web — no fork)          │
│  Auth + MFA · Postgres + RLS · Storage · Edge   │
│  + NEW: push_tokens table, media bucket,        │
│    Edge function for push fan-out               │
│  (Gemini Edge fn deferred with AI → v1.1)       │
└───────────────┬───────────────────────────────┘
                │
        ┌───────▼────────┐
        │ Expo Push (EAS) │
        └────────────────┘
```

**Guiding principle:** the mobile app is a **new native client on the existing backend**, not a new backend. Web and mobile share one Supabase project, one schema, one RLS policy set. The API key currently used by the browser client (`utils/supabase/client`) is the publishable/anon key with RLS — that's the correct model for mobile too.

> **AI is deferred out of v1** (see §0), so the Gemini dependency is off the critical path. When it returns (v1.1+): the web app calls Gemini from a server API route with a key in the server env; a mobile app has no server route, so **never ship the Gemini key in the app binary** — wrap the sphere-chat logic in a **Supabase Edge Function** the app calls with the user's JWT.

---

## 3. Stack (each concern → chosen tool, 2026-current)

| Concern | Choice | Why |
| :--- | :--- | :--- |
| Framework | **Expo SDK 56** (RN 0.85, React 19.2, New Architecture — now mandatory) | Managed native modules, EAS build/submit, OTA updates. |
| Navigation | **Expo Router** (file-based) | Mirrors the Next.js App Router mental model the team already uses. |
| Styling | **NativeWind v4** (Tailwind for RN; watch v5 preview) | Lets us port the Design.md tokens as a Tailwind theme with minimal translation. |
| Motion | **react-native-reanimated** | Transitions + drives Skia uniforms/transforms on the UI thread (worklets). |
| **Graphics (primary)** | **@shopify/react-native-skia** (SkSL runtime shaders + `Atlas`) | Reimplements the liquid-metal sphere (SkSL) and particle fields (`Atlas` + Reanimated worklets = 60fps, no JS-thread work). New-Architecture-native, well maintained. |
| **Graphics (conditional)** | **expo-gl + three.js / react-three-fiber-native** | Only if the `InfiniteMenu` needs true 3D beyond what a Skia 2D-projection can match. Fragile 2026 tooling — adopt reluctantly, device-test only. |
| Gestures | **react-native-gesture-handler** | Drag/inertia for the infinite menu + sphere interaction. |
| Data / server state | **@supabase/supabase-js** + **TanStack Query** | Query = caching, retries, and the offline persistence layer. |
| Auth session storage | **AsyncStorage** for the session + **expo-secure-store** for an encryption key (aes-js) | Supabase RN best practice: `persistSession`, `autoRefreshToken`; encrypt at rest. |
| Offline cache | **TanStack Query persister** backed by **react-native-mmkv** (or AsyncStorage) | Persist last-fetched reads; hydrate on cold start. |
| Push | **expo-notifications** + **Expo Push Service** (EAS-managed APNs/FCM v1 creds) | No manual APNs/FCM plumbing; token → backend → fan-out. |
| Biometrics | **expo-local-authentication** | Face ID / Touch ID / fingerprint gate over the persisted session. |
| Camera / media | **expo-camera** + **expo-image-picker** | Capture or pick, upload to Supabase Storage. |
| Build & release | **EAS Build + EAS Submit** | Cloud builds, managed signing, direct store submission, OTA via `expo-updates`. |

---

## 4. App structure (Expo Router)

```
app/
  _layout.tsx              → root: session gate + biometric gate + Query provider
  (auth)/
    sign-in.tsx            → email/password + MFA challenge (reuse Supabase flow)
    mfa.tsx
  (tabs)/
    _layout.tsx            → bottom tab bar (native, themed) — everyday nav
    index.tsx              → HOME: Skia sphere + particle field + InfiniteMenu (signature shell)
    feed/
      index.tsx            → SOCIAL FEED: posts list, "Everyone / Following" toggle, category filter
      [id].tsx             → post detail: post + likes + comments
    projects/
      index.tsx            → published projects list (infinite, cached)
      [id].tsx             → project detail: versions, fork lineage, read-only canvas preview
    profile/
      index.tsx            → my identity, my posts, MFA status, sign out, settings
      [id].tsx             → another user: their posts + Follow/Unfollow
  compose.tsx              → new post: caption + optional photo (camera/pick) + optional project link
  modal/
    notification.tsx       → deep-link target for pushes
```

Tabs: **Home · Feed · Projects · Profile** (4). **Compose** is a `+` action on the Feed (opens the camera/pick flow), so "Capture" is now *"create a post,"* wiring the camera feature into the feed.

- **Hybrid nav:** the **Home** tab hosts the interactive sphere + particle field + InfiniteMenu (the brand moment); the **bottom tab bar** is the reliable everyday navigation. The InfiniteMenu can route into the same destinations as the tabs — it is an *additional*, expressive entry point, not the sole one.
- **Read-only canvas preview**: render `canvas_data` as a static image/thumbnail (server-generated or a minimal RN renderer), **not** an editable tldraw surface. Editing = "open on web" deep link.

---

## 5. Native capabilities — implementation notes + backend deltas

### 5.1 Push notifications
- Client: request permission → `getExpoPushTokenAsync({ projectId })` → POST token to backend.
- **Backend delta:** new `push_tokens` table (`user_id`, `token`, `platform`, `created_at`, unique on token) with RLS (`auth.uid() = user_id`). An Edge Function fans out to Expo Push.
- **v1 events (decided):** **new follower · comment on your post · like on your post · your project was forked.** *Likes are the high-volume one* — batch/digest them (e.g. rollup per post per window) rather than one push per like.
- EAS manages APNs key (iOS) and FCM v1 (Android) credentials.

### 5.2 Biometric login
- On first sign-in, persist the Supabase session (encrypted, §3). On subsequent cold starts, gate access with `expo-local-authentication` before rehydrating the session into memory.
- Pairs with the existing MFA: biometrics unlock the *device*; MFA remains the *account* factor.

### 5.3 Offline access
- TanStack Query persister hydrates last-fetched Projects/Profile on launch; queries refetch when connectivity returns (`expo-network` / NetInfo).
- **Known gotcha (flagged in research):** if the app opens offline and the refresh token retry fails, supabase-js can drop the session. Mitigation: treat a cached session as valid for read-only offline browsing; only force re-auth when a write is attempted online.

### 5.4 Camera / capture
- `expo-camera` (capture) / `expo-image-picker` (pick) → upload to a Supabase **Storage** bucket (`media`).
- **Now resolved (§5.5):** a captured photo attaches to a **feed post** — Capture *is* the compose flow.
- **Backend delta:** `media` storage bucket + RLS (authenticated write to own path; public read).

---

## 5.5 Social feed — data model (new tables)

Decided shape: **one unified feed** with a category tag; posts carry **text + optional photo + optional project link**; interactions are **likes, comments, follows**. All additive to the existing schema; all RLS-guarded on the shared Supabase project.

| Table | Columns (essentials) | RLS |
| :--- | :--- | :--- |
| `posts` | `id`, `author_id → profiles`, `category` (nullable check: story/society/community), `body` text, `image_path` text (Storage, nullable), `project_id → projects` (nullable), `created_at`, `updated_at` | **read:** any authenticated (public feed). **insert:** `auth.uid() = author_id`. **update/delete:** author only. |
| `post_likes` | `post_id → posts`, `user_id → profiles`, `created_at`; **PK (post_id, user_id)** | read: authenticated. insert/delete: `auth.uid() = user_id`. |
| `comments` | `id`, `post_id → posts`, `author_id → profiles`, `body` text, `created_at` | read: authenticated. insert: `auth.uid() = author_id`. delete: comment author *or* post author. |
| `follows` | `follower_id → profiles`, `followee_id → profiles`, `created_at`; **PK (follower_id, followee_id)**, check `follower_id <> followee_id` | read: authenticated. insert/delete: `auth.uid() = follower_id`. |

- **Two feed queries:** *Everyone* = `posts` newest-first; *Following* = posts where `author_id in (select followee_id from follows where follower_id = auth.uid())`. Toggle on the Feed screen.
- **Counts:** like/comment counts via aggregate or a lightweight view for v1; denormalized counters only if it becomes a perf issue.
- **Push ties in (§5.1):** new follower, like, and comment are notification events.
- **Moderation (decided — "minimum + admin review queue"):**
  - `reports` table (`id`, `reporter_id`, `target_type` post/comment/user, `target_id`, `reason`, `status` open/actioned/dismissed, `created_at`) — insert by any authenticated user; read/update by admins (`is_admin()`).
  - `blocks` table (`blocker_id`, `blocked_id`, PK pair) — blocked users' content is filtered from the blocker's feed/comments; insert/delete where `auth.uid() = blocker_id`.
  - **Admin review queue** reuses the existing `is_admin()` infra: a screen (mobile or web) listing open reports with take-down (soft-hide via a `hidden` flag on posts/comments) / dismiss.
  - **Account + content deletion** (Apple-required): in-app "delete my account" cascades the user's posts/comments/likes/follows; "delete my post/comment" on own content.

---

## 6. Design system port (Design.md → mobile)

The token architecture ports cleanly; the WebGL does not. Detailed design specifications are available in the [Mobile Design System](Wikis/no-origins/visual-labs-mobile/design_system.md) document.

---

## 7. Repository strategy

**Context:** the web app ([visual-labs](file:///Users/hiddenstack/Creatives/no-origins/visual-labs)) is **its own git repo** (`…/visual-labs.git`), embedded in the `no-origins/` workspace as a gitlink. `no-origins/` itself has no remote — it's a local umbrella holding the design docs + the embedded app repo(s).

**Recommendation: a new standalone directory `visual-labs-mobile`**, initialized as a sibling of [visual-labs](file:///Users/hiddenstack/Creatives/no-origins/visual-labs) in the `no-origins/` workspace — mirroring exactly how the web app is structured (own configs, own build, own release). It shares the **Supabase backend**, not code or build.

- DB row types are generated with `supabase gen types` and committed into the mobile repo (or a tiny shared package if duplication ever hurts — deferred).
- Monorepos are deferred: there's no shared code today beyond DB types; a pnpm/workspace monorepo is a later refactor if real sharing (client factory, tokens) emerges.

---

## 8. Build, release & accounts

| Item | Detail |
| :--- | :--- |
| Apple Developer Program | **$99/yr** — required for TestFlight + App Store. |
| Google Play Developer | **$25 one-time.** |
| Dev builds | Local dev build via `npx expo run:ios` on the **iOS Simulator** (Xcode installed) for the spike + early dev — no account needed. EAS Build dev client needed later for push + on-device (Expo Go won't cover native modules). |
| Distribution | EAS Submit → TestFlight / Play internal testing → production. |
| OTA | `expo-updates` for JS-only fixes without a store round-trip. |
| Store assets | Icons, splash, screenshots, privacy policy, App Privacy / Data Safety questionnaires (camera, notifications, account data all require disclosures). |

---

## 9. Decisions log (all v1 scope decisions resolved)

Scope is fully settled for v1. Nothing here blocks starting the build.
- **Shape:** companion scope · native Expo build · iOS + Android, both stores · AI deferred to v1.1.
- **Native:** push · biometric · offline · camera.
- **Graphics:** WebGL shell in scope · Skia-first rendering · sphere fidelity = "same general vibe" (no expo-gl escalation for the sphere) · hybrid nav (sphere on Home + tab bar).
- **Social feed:** one unified feed + category tag · posts = text / photo / project-link · likes + comments + follows · feed accent = fuchsia (provisional).
- **Push events:** new follower · comment · like (digested) · project forked.
- **Project detail:** read-only thumbnail + version history + fork lineage; canvas view/edit = "open on web" deep link. No native canvas viewer in v1.
- **App identity:** store name **"Visual Labs"**; **"No Origins"** as the studio/brand identity in-app (splash, about). Bundle IDs `com.anonymous.visual-labs-mobile` (iOS/Android). App icon + splash derive from the core sphere motif.
- **Moderation:** minimum + admin review queue — `reports` + `blocks` tables, soft-hide take-down, account + content deletion, admin queue on `is_admin()`.

---

## 10. Risks & watch-items

- **⚠️ Graphics track is the schedule risk — concentrated in the sphere + menu.** The particle field is now deliberately simple (ambient flow + one touch-radius behavior), so the unpredictable work is the **sphere shader** (GLSL→SkSL re-port, matching the web look may be iterative) and the **InfiniteMenu** (gesture + possible 3D).
- **expo-gl/three escalation is a cliff, not a step** — documented 2026 version-mismatch breakage on real devices and no simulator support. If the InfiniteMenu forces it, budget separately and keep it isolated to that one component.
- **New Architecture is mandatory (SDK 55+)** — verify every third-party native lib is New-Arch compatible before adopting.
- **Offline + Supabase session expiry** — the sharp edge; needs deliberate handling.
- **NativeWind animation gaps** — complex motion should use Reanimated directly, not NativeWind's experimental animation classes.
- **Store review — heavier now that there's user-generated content.** Public posts + comments mean Apple/Google expect a **report + block** flow and content moderation, plus an in-app **account/content deletion** path.
- **Store review** — camera + notifications all draw scrutiny; include a privacy manifest.

---

## 11. Phased roadmap

| Phase | Deliverable | Exit criteria |
| :--- | :--- | :--- |
| **0. Design doc** | [Mobile Design System](Wikis/no-origins/visual-labs-mobile/design_system.md) — RN token map + component contracts | Tokens + core components specced. |
| **1. Graphics spike** | Throwaway Skia prototype of the sphere shader + a particle field on a device | We know the real cost/fidelity of Skia before committing; go/no-go on expo-gl escalation for the menu. |
| **2. Skeleton** | Expo app, Expo Router tabs, NativeWind theme, Supabase client, sign-in + MFA | Auth works on device (EAS dev build). |
| **3. Core content** | Projects list + detail, Profile, offline cache | Browse published projects offline; identity + sign-out. |
| **4. Social layer** | Feed tables (`posts`/`post_likes`/`comments`/`follows`) + RLS, feed + post detail, compose (photo/project link), like/comment/follow | Post, browse Everyone/Following, like, comment, follow — end to end. |
| **5. The shell** | Home sphere (Skia SkSL) + particle field (`Atlas`) + InfiniteMenu (gesture-driven) | Home feels like Visual Labs; menu routes into the app. |
| **6. Native features** | Push (+ `push_tokens` + Edge fan-out on follow/like/comment/fork), biometric gate, camera→compose | All four v1 native features working on both platforms. |
| **7. Launch-harden** | `reports`/`blocks` + soft-hide, admin review queue (`is_admin()`), account + content deletion, privacy manifests | Passes store review; admin can action reports. |
| **8. Release** | EAS Build/Submit, store listings, TestFlight/internal → prod | Live in both stores. |
