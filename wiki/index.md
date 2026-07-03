# No Origins Workspace Wiki

Welcome to the **No Origins** Agent Wiki. This is a persistent, compounding knowledge base designed for human developers and AI agents working on the No Origins project. It acts as our shared "second brain", compiling information once so that subsequent agent sessions do not need to rediscover architectural context from scratch.

---

## 🗺️ Wiki Directory

### 🌐 Global / Ecosystem Configurations
- **[Ecosystem Architecture](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md)**: High-level overview of the parent repo, submodule integrations, and global layout.
- **[Git Submodule Workflows](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/git_submodules.md)**: Procedures for submodule pointer management to prevent broken/detached reference states.
- **[Wiki Maintenance Playbook](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/wiki_rules.md)**: Standards and triggers for creating, modifying, logging, and linting the wiki.
- **[Collaborative Guidelines & Pipelines](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/collaborative_guidelines.md)**: Roles, git submodule workflows, wiki compliance, and safety checkpoints.
- **[Vercel REST API Guide](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/vercel_api.md)**: Reference specifications for querying Vercel deployment status, build failures, and function runtime logs.
- **[Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md)**: Request for Comments and design specifications for the whiteboarding/TipTap projects canvas.

### 🎨 Frontend: `visual-labs` Submodule
- **[Design System (Design.md)](file:///Users/hiddenstack/Creatives/no-origins/Design.md)**: Authoritative spec — token architecture (4 tiers + per-route `--section-accent` slot), the `section` Tailwind color, glass/glow utilities, type scale, component contracts, and the three theming axes (section / workspace preset / sphere material). All `visual-labs` styling must resolve from these tokens.
- **[State Synchronization](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md)**: Deep dive into the reactive single source of truth (`VisualizerContext`) governing HUD, WebGL, and sound values.
- **[Sphere States & Transitions](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md)**: Proposal and specifications for liquid metal sphere states, target properties, and animated transitions.
- **[WebGL & Canvas Rendering](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/rendering.md)**: Technical specifications of `DotField` particle dynamics and `LiquidMetalSphere` shader calculations.
- **[Procedural Audio Synthesis](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/audio.md)**: Documentation on Web Audio API oscillators, sound envelopes, and real-time volume calculations in `audio.ts`.
- **[Sentient Sphere AI Chatbot](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/ai_chat.md)**: Details on the client-server AI communication pipeline and dynamic settings morphing.
- **[Navigation & Subpage UI](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/navigation_ui.md)**: Specifications for the WebGL InfiniteMenu rotation, route synchronization, BorderGlow, and page entry transitions.
- **[Canvas Autosave (Projects)](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/canvas_autosave.md)**: How the tldraw project canvas persists to Supabase — scoped listener, document-only snapshot, debounce + max-wait, and dirty check.

### 🗄️ Backend: `realm` Submodule
- **[Presets Database Schema](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/presets_schema.md)**: Presets syncing rules, table layouts, and settings configurations inside Supabase.
- **[Mezmo Aura Setup](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/aura_setup.md)**: Backend agentic harness configuration, build procedures, and API specifications.
- **[Aura Agent Society Base](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/index.md)**: Index and architectural hub of the multi-level organizational societal agentic system.

---

## 📜 Session logs & Active Sprints
- **[Active Session Tracker](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md)**: Current sprint objectives, checklists, staging logs, and session contexts.
- **[Chronological Wiki Activity Log](file:///Users/hiddenstack/Creatives/no-origins/wiki/log.md)**: Chronological history of agent sessions, changes, features added, and audits.
