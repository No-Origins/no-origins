# No Origins Ecosystem Architecture

This document describes the high-level layout, tech stack, and module organization of the **No Origins** ecosystem.

---

## 🏛️ Repository Layout

The workspace is structured as a multi-component mono-repository leveraging Git submodules to isolate front-end and back-end logic.

```mermaid
graph TD
    Root["no-origins (Root Git Repo)"]
    Frontend["visual-labs/ (Next.js 16 UI Frontend Submodule)"]
    Backend["realm/ (Backend Server Submodule)"]
    
    Root --> Frontend
    Root --> Backend
```

- **[no-origins (Root)](file:///Users/hiddenstack/Creatives/no-origins)**: Contains the umbrella configuration, [GEMINI.md](file:///Users/hiddenstack/Creatives/no-origins/GEMINI.md) developer/agent rules, and global workflows.
- **[visual-labs/](file:///Users/hiddenstack/Creatives/no-origins/visual-labs)**: Next.js 16 (React 19, Tailwind CSS v4) client-side application hosting the interactive sandbox, procedural audio engine, and WebGL particle visualization.
- **[realm/](file:///Users/hiddenstack/Creatives/no-origins/realm)**: Backend services (Supabase schema, configurations, syncing presets and user state variables).

---

## 💻 Tech Stack & Dependencies

### Frontend (`visual-labs`)
- **Core Framework**: **Next.js 16.2** (App Router structure using Turbopack in development, React 19.2, TypeScript).
- **Styling**: **Tailwind CSS v4** coupled with dynamically-injected CSS Custom Properties (CSS variables) to support reactive designer themes.
- **Visual Rendering**: WebGL-based custom rendering utilizing `<canvas>` elements for the floating metal orb and background particle fields.
- **Audio Engine**: Custom built class inside `audio.ts` utilizing the browser's native **Web Audio API** (Oscillators, Gain nodes, BiquadFilters, Analysers, ConvolverNode reverb, and white noise synthesizers).
- **Transitions & Micro-Interactions**: Framer Motion 12 (`motion` package) for HUD panel animations.
- **State Management**: **React Context** (`VisualizerContext`) serving as the unified single source of truth (SSOT) managing all visual, audio, UI, preset, and theme state.
- **Backend Integrations**: Supabase JavaScript client (`@supabase/supabase-js`, `@supabase/ssr`) for storing client presets and syncing global settings.
- **AI Integrations**: Google GenAI SDK (`@google/genai`) enabling communication with the Sentient Sphere chatbot.

### Backend (`realm`)
- Serves as the database management layer storing preset schemas, design themes, and user configurations.
- Interfaced via Supabase SSR client integrations inside the Next.js frontend.

---

## ⚙️ Communication & Data Flow

```mermaid
sequenceDiagram
    participant User as Human Developer / Viewer
    participant UI as Interactive HUD & SphereChat
    participant Context as VisualizerContext (SSOT)
    participant Render as WebGL (DotField & MetalSphere)
    participant Sound as AudioEngine (Web Audio API)
    participant DB as Supabase DB (Presets/Themes)
    
    User->>UI: Modify slider or select Preset
    UI->>Context: Call state setter
    Context->>DB: Read/Write presets & configurations
    Context->>Render: Apply visual values (speed, roughness, etc.)
    Context->>Sound: Invoke audioEngine.updateDrone(speed, thickness)
    Render->>Sound: On ripple events trigger playRipple(x, y, intensity)
    Sound->>Context: Return real-time FFT / RMS volume values
    Context->>Render: Modulate visual scale/pulsing based on audio RMS
```

- **State Sync**: React context acts as a unidirectional loop where parameters are adjusted in the HUD, applied directly to WebGL state references, and fed to the `audioEngine` via the context's effect loops.
- **Sound Reactivity**: The visualizer can read back real-time audio analysis data (RMS and frequency bands from `audioEngine.getAudioVolumeData()`) to modulate parameters like sphere scaling, providing true visual-audio synchronicity.

---

## 🔒 Security, Authentication & Role Gating

The ecosystem features a strict Role-Based Access Control (RBAC) model implemented at both the server-side middleware layer and the database layer (via Row Level Security).

### 👥 Role Taxonomy
* **Anonymous / standard user**: Has read-only access to database presets and states. Any new presets or states created by regular/anonymous users are saved to the browser's `localStorage` (local-only sandbox mode), keeping the central database clean.
* **Admin**: Users promoted to the `admin` role in `public.profiles`. Granted full write permissions (Insert, Update, Delete) to the database tables (`component_presets`, `states`, `stages`).

### 🛡️ Admin Console Gating & 2FA Flow
Admin console routes (`/admin`) are protected by Next.js SSR middleware (`utils/supabase/middleware.ts`):
1. **Authentication Check**: Anonymous users attempting to reach `/admin` are redirected to `/login`.
2. **Role Gate**: If authenticated, middleware queries `public.profiles` for the user's role. Non-admins are blocked from the console and redirected to the home page (`/`).
3. **MFA Enforcement**: Admins must enroll and complete TOTP Multi-Factor Authentication (MFA/2FA) to unlock console access:
   - If no factors are enrolled, the user is redirected to `/login/setup-mfa` to scan a QR code and register a TOTP app.
   - If a factor is enrolled but not verified, the user is redirected to `/login/mfa` to enter the verification code.
   - Once elevated to Authentication Assurance Level 2 (`aal2`), the user is redirected to `/admin` using a hard navigation (`window.location.assign`) to ensure session cookies are re-read.

---

## 🌐 Environment Stages

The application behavior and initial appearance adapt to the environment in which it is running, resolved at build time:

* **Trigger**: Managed via the `NEXT_PUBLIC_APP_STAGE` environment variable (value is `DEVELOPMENT`, `STAGING`, or `RELEASE`).
* **Environment Mapping**: Mapped via the `stages` database table which binds stage names to specific States and Themes.
* **Boot Flow**: On load, the system detects the active stage, pulls the corresponding state/theme from the database, and instantly applies it, ensuring users see the designed environment for that specific deployment stage.
