# No Origins Workspace Wiki

Welcome to the **No Origins** Agent Wiki. This is a persistent, compounding knowledge base designed for human developers and AI agents working on the No Origins project. It acts as our shared "second brain", compiling information once so that subsequent agent sessions do not need to rediscover architectural context from scratch.

---

## 🗺️ Wiki Directory

### 🌐 Global / Ecosystem Configurations
- **[Product Map (Ideation)](Wikis/no-origins/global/product_map.md)**: Living map of the whole No Origins product — north star, pillars, surface status, maturity, open questions, and Figma workspace OS. Visual twin: [Master Ideation FigJam](https://www.figma.com/board/f6K9ZBe4zh1Jz1bzqOsKMN).
- **[Ecosystem Architecture](Wikis/no-origins/global/architecture.md)**: High-level overview of the parent repo, submodule integrations, and global layout.
- **[Git Submodule Workflows](Wikis/no-origins/global/git_submodules.md)**: Procedures for submodule pointer management to prevent broken/detached reference states.
- **[Wiki Maintenance Playbook](Wikis/no-origins/global/wiki_rules.md)**: Standards and triggers for creating, modifying, logging, and linting the wiki.
- **[Collaborative Guidelines & Pipelines](Wikis/no-origins/global/collaborative_guidelines.md)**: Roles, git submodule workflows, wiki compliance, and safety checkpoints.
- **[Vercel REST API Guide](Wikis/no-origins/global/vercel_api.md)**: Reference specifications for querying Vercel deployment status, build failures, and function runtime logs.
- **[Projects Feature RFC](Wikis/no-origins/global/projects_feature_rfc.md)**: Request for Comments and design specifications for the whiteboarding/TipTap projects canvas.

### 🎨 Frontend: `visual-labs` Submodule
- **[Design System (Design.md)](file:///Users/hiddenstack/Creatives/no-origins/Design.md)**: Authoritative spec — token architecture (4 tiers + per-route `--section-accent` slot), the `section` Tailwind color, glass/glow utilities, type scale, component contracts, and the three theming axes (section / workspace preset / sphere material). All `visual-labs` styling must resolve from these tokens.
- **[State Synchronization](Wikis/no-origins/visual-labs/state_sync.md)**: Deep dive into the reactive single source of truth (`VisualizerContext`) governing HUD, WebGL, and sound values.
- **[Sphere States & Transitions](Wikis/no-origins/visual-labs/sphere_states.md)**: Proposal and specifications for liquid metal sphere states, target properties, and animated transitions.
- **[WebGL & Canvas Rendering](Wikis/no-origins/visual-labs/rendering.md)**: Technical specifications of `DotField` particle dynamics and `LiquidMetalSphere` shader calculations.
- **[Procedural Audio Synthesis](Wikis/no-origins/visual-labs/audio.md)**: Documentation on Web Audio API oscillators, sound envelopes, and real-time volume calculations in `audio.ts`.
- **[Sentient Sphere AI Chatbot](Wikis/no-origins/visual-labs/ai_chat.md)**: Details on the client-server AI communication pipeline and dynamic settings morphing.
- **[Navigation & Subpage UI](Wikis/no-origins/visual-labs/navigation_ui.md)**: Specifications for the WebGL InfiniteMenu rotation, route synchronization, BorderGlow, and page entry transitions.
- **[Canvas Autosave (Projects)](Wikis/no-origins/visual-labs/canvas_autosave.md)**: How the tldraw project canvas persists to Supabase — scoped listener, document-only snapshot, debounce + max-wait, and dirty check.
- **[Nested Sub-Projects](Wikis/no-origins/visual-labs/sub_projects.md)**: Hierarchy trees, collapsible sidebar, recursive soft-deletes trigger, and Tldraw custom SubProjectCard shape.
- **[Custom Table Cards](Wikis/no-origins/visual-labs/table_cards.md)**: Tabular data layout components, portal-based decoupled editor, and CSS section accent styling rules.

### 🗄️ Backend: `realm` Submodule
- **[Presets Database Schema](Wikis/no-origins/realm/presets_schema.md)**: Presets syncing rules, table layouts, and settings configurations inside Supabase.
- **[Mezmo Aura Setup](Wikis/no-origins/realm/aura_setup.md)**: Backend agentic harness configuration, build procedures, and API specifications.
- **[Aura Agent Society Base](Wikis/no-origins/realm/society/index.md)**: Index and architectural hub of the multi-level organizational societal agentic system.

---

## 📜 Session logs & Active Sprints
- **[Active Session Tracker](Wikis/no-origins/active_sprint.md)**: Current sprint objectives, checklists, staging logs, and session contexts.
- **[Chronological Wiki Activity Log](Wikis/no-origins/log.md)**: Chronological history of agent sessions, changes, features added, and audits.
