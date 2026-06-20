# Wiki Activity Log

This is an append-only log detailing all major updates, feature implementations, and lint passes conducted by developers and AI agents in the **No Origins** workspace.

Format for entries: `## [YYYY-MM-DD] <operation> | <description>`
Operations: `ingest` (adding docs), `write` (code features), `lint` (audits), `refactor` (code restructuring).

---

## [2026-06-16] ingest | Initialize Agent Wiki Collaboration Framework
- **Session Focus**: Established the wiki framework inspired by Andrej Karpathy's LLM Wiki concept.
- **Created Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Central index of the wiki.
  - [wiki/log.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/log.md): This activity log.
  - [wiki/global/architecture.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md): Ecosystem architecture overview.
  - [wiki/global/git_submodules.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/git_submodules.md): Submodule workflows.
  - [wiki/visual-labs/state_sync.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md): State synchronization model.
  - [wiki/visual-labs/rendering.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/rendering.md): WebGL and canvas rendering engine.
  - [wiki/visual-labs/audio.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/audio.md): Procedural audio synthesis.
  - [wiki/realm/presets_schema.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/presets_schema.md): Backend database preset table stub.
- **Rules Integrated**: Extended the root [GEMINI.md](file:///Users/hiddenstack/Creatives/no-origins/GEMINI.md) to formally instruct future agent sessions to use and maintain this wiki.

## [2026-06-16] refactor | Restructure Wiki layout by Repository Boundaries (Option B)
- **Session Focus**: Reorganized the central wiki to match the workspace's Git submodules (`visual-labs`, `realm`, and global configurations).
- **Changes**:
  - Moved files from root `wiki/` into logical directories: `global/`, `visual-labs/`, and `realm/`.
  - Updated all cross-references and absolute links in index, log, and sub-pages.
  - Configured root [GEMINI.md](file:///Users/hiddenstack/Creatives/no-origins/GEMINI.md) to enforce the "Wiki First" reading rule for all subsequent AI agent sessions.

## [2026-06-16] write | Implement custom sphere states and smooth transitions
- **Session Focus**: Designed and implemented admin-created custom states, automated transitions, easing physics, and A-B crossfading morph controls.
- **Created Pages**:
  - [wiki/visual-labs/sphere_states.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md): Design specifications for custom sphere states, target variables, transition math, and HUD controls.
- **Modified Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered sphere states documentation in the index directory.
- **Code Changes**:
  - Implemented `SphereStateConfig` interface, state handlers, color lerper, requestAnimationFrame transition loop, and A-B blend effect in [VisualizerContext.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx).
  - Built states UI controls, duration sliders, easing selectors, dropdown menus, and mixer slider in [InteractiveHUD.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InteractiveHUD.tsx).
  - Bound state handlers to the HUD instances in [App.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/App.tsx) and [page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/base/page.tsx).

## [2026-06-16] write | Refactor to Composed States and Component Presets
- **Session Focus**: Refactored visualizer configurations to divide presets on a per-component level (Liquid, Core, Field, Audio) and defined States as a composed combination of component presets.
- **Created Pages**: None
- **Modified Pages**:
  - [wiki/visual-labs/sphere_states.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md): Updated state config schema to the new composed model.
- **Code Changes**:
  - Defined `ComponentPreset` and `SphereStateConfig` schemas.
  - Implemented component-specific preset CRUD (local storage-backed) and transition morph calculations resolving preset references inside [VisualizerContext.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx).
  - Built component-specific preset managers and composed state builder inside [InteractiveHUD.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InteractiveHUD.tsx) and the admin dashboard [page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/admin/page.tsx).
  - Tied component presets and composed states to [App.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/App.tsx) and Visitor sandbox [page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/base/page.tsx).

## [2026-06-16] write | Scale typography for improved accessibility in Visual Labs
- **Session Focus**: Address micro font size accessibility issue by implementing a centralized utility classes scale override in index.css.
- **Created Pages**: None
- **Modified Pages**: None
- **Code Changes**:
  - Added utility class mapping overrides inside [index.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/index.css) to map arbitrary font classes (e.g. `text-[7px]` through `text-[18px]`) to readable font sizes (+3px scale for micro labels, +2px for inputs/headings).

## [2026-06-16] refactor | Separate glowing core and LiquidMetalSphere into distinct components
- **Session Focus**: Decoupled core physics/rendering from WebGL LiquidMetalSphere, introducing modular component architecture.
- **Created Pages**: None
- **Modified Pages**:
  - [wiki/visual-labs/rendering.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/rendering.md): Updated rendering pipeline with the `InnerCore` overlay.
  - [wiki/visual-labs/state_sync.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md): Documented shared velocity variables passed through `corePositionRef`.
- **Code Changes**:
  - Defined velocity structure in `CorePosition` interface and updated context variables inside [VisualizerContext.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx).
  - Created [InnerCore.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InnerCore.tsx) to handle glowing core rendering, spring/friction physics, wandering target calculations, and mouse move/click interactions.
  - Refactored [LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx) to act as a pure WebGL canvas shader renderer, reading velocity values directly from the shared ref for motion trails.
  - Mounted and aligned both components inside [BackgroundVisualizer.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BackgroundVisualizer.tsx).
  - Split the combined "Sphere + Core" tab in the Admin Panel [admin/page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/admin/page.tsx) into separate "Sphere" and "Core" tabs with their respective control sliders and component preset managers.

## [2026-06-16] write | Sync presets and states to Supabase with dynamic JSONB and checkboxes
- **Session Focus**: Sync component-level presets and composed States to Supabase, redesign States as a top-level section in the Admin Panel sidebar, and support checkbox-based component inclusion/exclusion.
- **Created Pages**: None
- **Modified Pages**:
  - [wiki/realm/presets_schema.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/presets_schema.md): Documented new tables `component_presets` and `states` with JSONB payloads.
  - [wiki/visual-labs/sphere_states.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md): Updated state schema documentation to reflect the new dynamic `presets` dictionary.
- **Code Changes**:
  - Refactored `VisualizerContext.tsx` context states, fetching logic, and mutators (`saveState`, `deleteState`, `updateState`, `morphToState`, A-B mixer) to use the new dynamic `presets: Record<string, string>` map and sync asynchronously to Supabase.
  - Updated `InteractiveHUD.tsx` prop typings and creators to map to the new dynamic `presets` dictionary.
  - Re-anchored the "States" sidebar navigation tab in `admin/page.tsx` as a top-level sidebar section using the `Database` icon.
  - Redesigned the States creator block in `admin/page.tsx` to include checkboxes next to component inputs, enabling selective composition and dynamic subset transitions.
  - Tweak component selectors list layout in `admin/page.tsx` to render in a single column rather than a 2-column grid.

## [2026-06-18] ingest | Synchronize wiki with latest authentication, role gating, and visual-audio parameters updates
- **Session Focus**: Audited and fully updated the documentation wiki pages to represent the latest codebase additions in the `visual-labs` and `realm` repositories.
- **Created Pages**: None
- **Modified Pages**:
  - [wiki/global/architecture.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md): Documented role-based authentication taxonomy, SSR middleware gating on `/admin`, MFA/2FA enforcement, and build-time env stage initialization.
  - [wiki/visual-labs/state_sync.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md): Documented new custom CSS variables (`--border-glow`, `--border-width`, `--border-style-type`), admin session checks, local-only sandbox writes fallback, and boot loader lifecycle.
  - [wiki/visual-labs/sphere_states.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md): Updated preset parameter groupings with offsets (`sphereOffsetX/Y`), master audio/reactivity values, and documented the A-B mixer autoplay/pause control slider button.
  - [wiki/visual-labs/rendering.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/rendering.md): Updated the frontend canvas layer description to include the container offset translation.
  - [wiki/visual-labs/audio.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/audio.md): Documented new master volume/reactivity parameters inside the audio preset structure, and master audio toggle persistence (`no_origins_audio_enabled`) in localStorage to prevent unwanted startup noise.
  - [wiki/realm/presets_schema.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/presets_schema.md): Registered new `profiles` table schema, `stages` environment mapping schema, and detailed Row Level Security (RLS) policies guarding mutations with the `is_admin()` postgres function.
- **Code Changes**: None (Documentation session)

## [2026-06-19] write | Create global `run` skill for universal project launching
- **Session Focus**: Created a global instruction-only Antigravity skill that discovers and launches dev servers for any project in any workspace.
- **Created Files**:
  - [~/.gemini/config/skills/run/SKILL.md](file:///Users/hiddenstack/.gemini/config/skills/run/SKILL.md): Global `run` skill with runtime detection table (Node, Python, Rust, Go, Ruby, Docker, Make), concurrent background-task launching, and pre-flight dependency checks.
- **Code Changes**: None (Skill authoring session — instruction-only skill, no scripts)

## [2026-06-19] ingest | Document Sentient Sphere AI chatbot integration and audit wiki links
- **Session Focus**: Documented the AI chatbot client-server communication pipeline, `/api/chat-sphere` route structure, and the `SphereChatInput` component layout behaviors. Checked all repository wiki links for format alignment.
- **Created Pages**:
  - [wiki/visual-labs/ai_chat.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/ai_chat.md): Specifications for the Sentient Sphere chatbot system prompt constraints, JSON return format, and frontend layout configurations.
- **Modified Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered the AI Chatbot page in the wiki directory.
- **Code Changes**: None (Documentation update session)

## [2026-06-19] write | Initialize realm backend with Mezmo Aura framework
- **Session Focus**: Populated the empty `realm` submodule directory with the Mezmo Aura agentic framework codebase, added the Sentient Sphere configuration, verified the build and test suite, and documented the setup.
- **Created Pages**:
  - [wiki/realm/aura_setup.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/aura_setup.md): Setup documentation for Mezmo Aura in the `realm` backend.
- **Modified Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered the new Aura Setup page in the central directory.
- **Code Changes**:
  - Copied Mezmo Aura codebase into the `realm` submodule folder.
  - Created [sentient_sphere.toml](file:///Users/hiddenstack/Creatives/no-origins/realm/configs/sentient_sphere.toml) config file defining the Sentient Sphere agent parameters and system instructions.
  - Updated [config_test.rs](file:///Users/hiddenstack/Creatives/no-origins/realm/crates/aura-config/src/config_test.rs) to include `GEMINI_API_KEY` in the mocked variables to ensure workspace tests pass.

## [2026-06-19] write | Integrate Next.js API route with Realm Aura backend and fallback
- **Session Focus**: Connect the Next.js `chat-sphere` API route to the newly running local Realm Aura backend server, ensuring dynamic sphere parameter updates are preserved.
- **Modified Pages**:
  - [wiki/visual-labs/ai_chat.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/ai_chat.md): Updated architectural diagram and pipeline description to document Realm integration and the fallback mechanism.
- **Code Changes**:
  - Modified [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts) to send chat completions to the local Realm server (`http://127.0.0.1:8080/v1/chat/completions`) with a 5-second timeout, formatting the payload with OpenAI-compatible messages and embedding `currentSettings` instructions directly into the user message.
  - Retained direct Gemini SDK/REST API invocations as a fallback path in case the Realm server is down or times out.
  - Created [realm/.env](file:///Users/hiddenstack/Creatives/no-origins/realm/.env) file to configure the backend server's `GEMINI_API_KEY` using the key from visual-labs.
  - Improved `parseCleanJson` robustness in [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts) to extract JSON from anywhere in the text payload, protecting against LLM formatting fluctuations or conversational wraps.
  - Wrapped the Realm JSON response parsing in a local try-catch block inside [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts) to ensure that if the Aura server returns an unparseable response (such as an upstream API provider error string), the system will successfully trigger the direct Gemini fallback instead of returning a 500 error.

## [2026-06-19] write | Shift chatbot pipeline to state-based transitions
- **Session Focus**: Transitioned the Sentient Sphere chatbot from modifying individual parameters to selecting from available visualizer states.
- **Modified Pages**:
  - [wiki/visual-labs/ai_chat.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/ai_chat.md): Documented the new state transition flow architecture and JSON schemas.
- **Code Changes**:
  - Updated [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts) to accept `availableStates` in the payload and format instructions for the agent to select a state ID.
  - Refactored [SphereChatInput.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/SphereChatInput.tsx) to send available states from the context and trigger `context.morphToState(stateId)` on response.
  - Overwrote [sentient_sphere.toml](file:///Users/hiddenstack/Creatives/no-origins/realm/configs/sentient_sphere.toml) to adjust system instructions and enforce return schemas for `stateId` selection.
  - Restarted the Aura web server on port 8080 and the Next.js dev server on port 3000 to apply and test the changes.

## [2026-06-19] refactor | Transition Sentient Sphere to local Gemma model via Ollama
- **Session Focus**: Configured and transitioned the backend agentic chatbot to run local `gemma4:e2b` via Ollama, mitigating Gemini API quota exhaustion errors.
- **Modified Pages**:
  - [wiki/realm/aura_setup.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/aura_setup.md): Documented the local Ollama/Gemma configuration and dependencies.
  - [wiki/visual-labs/ai_chat.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/ai_chat.md): Updated request timeout to 30 seconds in diagrams and text descriptions.
- **Code Changes**:
  - Configured `realm/configs/sentient_sphere.toml` to utilize `provider = "ollama"` and `model = "gemma4:e2b"`.
  - Increased request timeout in Next.js `chat-sphere` API handler [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts) to 30 seconds to support local model warm-up/cold-start loading.
  - Terminated old server and restarted the Aura web server process to load the Ollama agent configuration.
  - Verified end-to-end communication and correct structured state selection.

## [2026-06-19] lint | Fix missing field presets in state morph transitions
- **Session Focus**: Debugged and resolved an issue where field parameters did not morph correctly during state transitions.
- **Modified Pages**: None
- **Code Changes**:
  - Fixed [VisualizerContext.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx) where `fieldDotSize`, `fieldGap`, `fieldRepulsionRadius`, `fieldRepulsionStrength`, `fieldSpringTension`, `rainDirection`, `rainSpeed`, and `rainLineLength` were defined in the target state object but omitted from `startValues` and `applyEase` interpolation updates during `morphToState`.

## [2026-06-20] ingest | Create Realm Agent Society Information Base
- **Session Focus**: Researched, brainstormed, and established a persistent knowledge base for the Realm Agent Society inside the backend module.
- **Created Pages**:
  - [wiki/realm/society/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/index.md): Central overview directory mapping out the three-tier societal hierarchy.
  - [wiki/realm/society/constitution.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/constitution.md): Core directives, safety thresholds, model selection, and security boundaries.
  - [wiki/realm/society/taxonomy.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/taxonomy.md): Level definitions, roles (database, telemetry, optimization), and worker configs.
  - [wiki/realm/society/protocols.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/protocols.md): A2A specifications, sanitization limits, and Human-in-the-Loop checkpoints.
  - [wiki/realm/society/decisions.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/decisions.md): Registry of architectural decision records (Aura, local Gemma, society setup).
  - [wiki/realm/society/future.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/future.md): Speculative sandbox covering society HUD map, voting settings consensus, self-optimizing prompts, and dialogue generation.
- **Modified Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered the Agent Society Base index in the central wiki map.
- **Code Changes**: None (Documentation and architectural design session)

## [2026-06-20] ingest | Document administrative and guardian roles in Realm Agent Society
- **Session Focus**: Brainstormed and documented societal roles of safety, security, health, judiciary, and bureaucracy to manage and regulate the multi-level agent framework.
- **Modified Pages**:
  - [wiki/realm/society/taxonomy.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/taxonomy.md): Expanded taxonomy documentation to define the responsibilities, technical implementations, and tools for Safety, Security, Health, Judiciary, and Bureaucracy roles.
- **Code Changes**: None (Documentation session)

## [2026-06-20] write | Establish Workspace Agent Rules and Collaborative Guidelines
- **Session Focus**: Formulated, approved, and integrated collaborative guidelines and pipelines for human-agent co-creation, and configured local agent workspace rules.
- **Created Pages**:
  - [wiki/global/collaborative_guidelines.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/collaborative_guidelines.md): Comprehensive collaborative co-creation guidelines.
- **Modified Pages**:
  - [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered new guidelines page.
- **Code/Config Changes**:
  - Created [.agents/AGENTS.md](file:///Users/hiddenstack/Creatives/no-origins/.agents/AGENTS.md) to serve as the platform-ingested project-scoped rules for all future sessions.

## [2026-06-20] write | Initialize shadcn UI and integrate InfiniteMenu component
- **Session Focus**: Integrate shadcn component infrastructure into Next.js app with Tailwind v4, and add React Bits InfiniteMenu component.
- **Code Changes**:
  - Initialized shadcn using `npx shadcn@latest init` (using default settings with Radix primitives).
  - Configured `@import "shadcn/tailwind.css"` and components config mapping to the v4 structure.
  - Installed `gl-matrix` npm package.
  - Created [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) and [InfiniteMenu.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.css) based on the React Bits implementation.
