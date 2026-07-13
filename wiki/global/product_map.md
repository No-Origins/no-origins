# No Origins — Product Map (Ideation)

> **Status:** Living ideation map (not a frozen PRD).  
> **Figma source of truth (visual):** [No Origins — Master Ideation](https://www.figma.com/board/f6K9ZBe4zh1Jz1bzqOsKMN)  
> **Team:** No Origins (`team::1280174415155818092`)  
> **Last organized:** 2026-07-13

This page organizes the whole No Origins product so humans and agents share one map: what it is, what surfaces exist, what is built vs open, and where design work lives next.

---

## 1. North Star

**One-liner**

> No Origins is a sentient sandbox where visuals, sound, agents, and projects share one living core.

| Lens | Current working answer |
| :--- | :--- |
| **What** | Dark, glass-first procedural visual-audio sandbox with a liquid-metal sphere core, plus a spatial projects canvas for builders. |
| **Why** | Explore reactive media, multi-agent systems, and collaborative making in one living environment — not a static marketing site. |
| **Who** | Curious explorers, creative builders, and operators of agent societies. |

Still open: whether the primary product shape is *experience sandbox*, *creator platform*, or *agent OS* (see §6).

---

## 2. Product Pillars

| # | Pillar | Meaning | Primary code / docs |
| :--- | :--- | :--- | :--- |
| 1 | **Core** | Sphere + particle field + procedural audio; reactive SSOT | `visual-labs` visualizer, [state_sync](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md) |
| 2 | **Nav** | WebGL InfiniteMenu + route-synced section accents | [navigation_ui](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/navigation_ui.md), [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md) |
| 3 | **Projects** | Spatial tldraw canvas + TipTap docs + publish/fork | [projects_feature_rfc](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) |
| 4 | **Society** | Multi-level agent ecology (Sphere → Council → Specialists) | [society index](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/index.md), `realm` |
| 5 | **Identity** | Auth, roles, MFA, profile / community | Supabase migrations, middleware, `/profile` `/admin` |
| 6 | **Hyperbase** | Presets, stages, themes, config substrate | [presets_schema](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/presets_schema.md) |

---

## 3. Surface Map

Legend: 🟢 built/shipping · 🟡 partial/stub · 🔵 live but product-open · 🟣 ideation only

| Surface | Route | Accent | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Core / Home | `/` | emerald (core) | 🟢 | Sphere, DotField, chat, InfiniteMenu — living entry |
| Labs | `/labs` | emerald | 🟡 | Research facility copy; thin content vs claim |
| Projects | `/projects`, `/projects/[id]` | emerald | 🟢 | Dashboard + canvas (TipTap pills, media shapes, autosave) |
| Society | `/society` | sky | 🟡 | Page shell; realm society docs rich, product UX open |
| Hyperbase | `/hyperbase` | amber | 🟡 | Directory copy only — needs real preset/admin browser |
| Stories | `/stories` | fuchsia | 🟡 | Placeholder; long-form prose voice reserved in DS |
| Spotify | `/spotify` | spotify-green | 🟡 | Placeholder; integration undefined |
| Credits | `/credits` | violet | 🟡 | Static credits card |
| Profile | `/profile` | indigo | 🟢 | Auth profile, role, status, avatar |
| Community | `/community` | purple | 🟢 | 8-trait MagicBento character grid |
| Admin | `/admin` | — | 🟢 | MFA-gated admin console |
| Sentient Chat | API + sphere | — | 🔵 | Gemini morphs sphere settings; product depth open |

Design tokens and per-section accents: [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md).

---

## 4. System Map

```
no-origins (root)
├── visual-labs/     Next.js 16 · WebGL · Web Audio · tldraw · Supabase · Gemini
├── realm/           Rust Aura · orchestration · MCP · A2A · HITL · configs
├── wiki/            Agent + human knowledge base (this tree)
├── Design.md        Authoritative Visual Labs design system
└── GEMINI.md        Workspace agent rules
```

| Layer | Role |
| :--- | :--- |
| **SSOT loop** | HUD → `VisualizerContext` → WebGL + AudioEngine ↔ RMS reactivity |
| **Data** | Supabase: profiles, presets, stages, projects, versions; RLS + MFA |
| **Agents** | L0 Sphere interface → L1 governance/orchestrator → L2 specialists |
| **Wiki** | `index` · `active_sprint` · `log` · per-module pages |

High-level architecture detail: [architecture.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md).

---

## 5. Maturity Snapshot (2026-07-13)

### Shipped foundation
- Core visualizer + procedural audio
- InfiniteMenu + section-accent design system
- Auth, suspension, MFA admin gates
- Projects canvas v1 (shapes, autosave, publish/fork model)
- Community bento + profile

### In progress / partial
- Projects polish (tables, connection handles, selection chrome)
- Many card routes still shell/stub content
- Society as product (not only wiki charter)
- Hyperbase real UI
- Wiki lag behind latest features (see `active_sprint.md`)

### Ideation backlog
- Stories product definition
- Spotify purpose (or cut)
- Public brand narrative / pitch
- Live visualization of agent society
- Multiplayer canvas?

### Not started
- Figma design-system library file
- High-fidelity product screen set
- Marketing / pitch deck
- End-to-end Society UX
- Monetization model (if any)

---

## 6. Open Product Questions

Track answers on the FigJam board; update this list when decisions land.

1. **Product shape** — Sandbox experience vs creator platform vs agent OS?
2. **Audience** — Solo explorers first, or collaborative teams from day one?
3. **Society surface** — Live agent status UI, or conceptual manifesto?
4. **Stories** — Essays, user lore, changelog theater, or drop?
5. **Spotify** — Ambient soundtrack, generative mix, or remove?
6. **Hyperbase** — Admin-only config browser vs user preset marketplace?
7. **Multiplayer** — Realtime collab on projects canvas for v1?
8. **Brand** — Is “No Origins” the product, the studio, or the world?

Decisions that harden architecture should also land in [society/decisions.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/decisions.md) or an ADR under `wiki/global/` when appropriate.

---

## 7. Agent Society (condensed)

| Level | Role | Notes |
| :--- | :--- | :--- |
| L0 Interface | Sentient Sphere | Chat + visual morphing; human gateway |
| L1 Governance | Orchestrator / council | Decompose, delegate, HITL |
| L2 Specialists | DB, telemetry, optimization | Tool-scoped agents |

Full charter: [society/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/realm/society/index.md).

---

## 8. Figma Workspace OS (No Origins team)

| Artifact | Type | Purpose | Status |
| :--- | :--- | :--- | :--- |
| [Master Ideation](https://www.figma.com/board/f6K9ZBe4zh1Jz1bzqOsKMN) | FigJam | Vision, surfaces, questions | ✅ Created |
| [No Origins — Draft](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc) | Design | Existing explorations (brand, product screens, social/art) | ✅ Organized 2026-07-13 |
| Design System | Design | Tokens + components from Design.md | Next (may split from Draft) |
| Product Screens | Design | Canonical hi-fi flows (promote winners from Draft p.02) | Next |
| Projects UX | Design | Canvas IA, publish/fork, empty states | Next |
| Brand & Pitch | Design / Slides | Logo, narrative, optional pitch (promote from Draft p.01/03) | Next |

### Draft file structure (Starter plan · 3 pages max)

| Page | Contents |
| :--- | :--- |
| **01 · Brand & Symbol** | Wordmark trials, sphere/crest marks, fields, reference shots |
| **02 · Product Screens** | MacBook 16" app explorations + narrative titles |
| **03 · Social & Art** | IG content system, traits, brand character, gen-art refs |

**Rule:** Ideation and open questions live on the Master Ideation board. Implementation truth stays in the repo wiki + code. When a decision closes a §6 question, update both this page and the board.

---

## 9. How to use this map

1. **Starting a session** — Read this page + [active_sprint.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md) + FigJam board.
2. **Changing product direction** — Update FigJam first, then this page, then code/wiki module pages.
3. **Shipping a surface** — Move its status in §3, log in [log.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/log.md).
4. **Design work** — Prefer new files under the No Origins Figma team using the Workspace OS table above.
