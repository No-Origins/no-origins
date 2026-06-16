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

