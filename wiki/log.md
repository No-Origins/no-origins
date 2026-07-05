# Wiki Activity Log

This is an append-only log detailing all major updates, feature implementations, and lint passes conducted by developers and AI agents in the **No Origins** workspace.

Format for entries: `## [YYYY-MM-DD] <operation> | <description>`
Operations: `ingest` (adding docs), `write` (code features), `lint` (audits), `refactor` (code restructuring).

---

## [2026-07-06] write | Fix responsiveness of custom connection handles on shape move and resize
- **Session Focus**: Address coordinate lag where midpoint connection circles stayed static during shape dragging and resizing by subscribing to shape store changes dynamically.
- **Code Changes**:
  - Modified [ConnectionHandles.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/ConnectionHandles.tsx) to fetch the shape inside a reactive `useValue` hook, allowing properties like bounds and page-level transform matrices to update in real-time.
- **Modified Documentation**:
  - Appended entry to Obsidian project session log.
- **Diagnostics**: Checked static builds (`npm run build`) and lint compiles successfully with zero errors.

## [2026-07-05] refactor | Create Pull Request #5 and update submodule reference pointer
- **Session Focus**: Commit the connection handles and selection outline styling implementation in `visual-labs`, push the local `feat/cards-layout-and-meditating-core` branch to GitHub, create Pull Request #5, and update the parent repository submodule pointer and documentation.
- **Code Changes**:
  - Committed connection handles and selection styling updates to `visual-labs` submodule.
  - Pushed `feat/cards-layout-and-meditating-core` to `origin`.
  - Created Pull Request #5 on GitHub.
  - Updated `visual-labs` submodule reference pointer in the parent repository.
- **Modified Documentation**:
  - Updated [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) with details on expandable pill layout and custom connection handles.
  - Staged and committed changes in the parent repository.
- **Diagnostics**: Checked TypeScript compiles cleanly and static production builds compile successfully.

## [2026-07-05] write | Implement connection handles and unify selection styling in Tldraw canvas
- **Session Focus**: Add interactive connection circles at the midpoint of each side of a selected shape to enable click-and-drag native arrow connections in Tldraw. Unify selection box aesthetics by styling handles, programmatically overriding Tldraw's canvas theme, and masking selection lines beneath handle circles.
- **Code Changes**:
  - Created [ConnectionHandles.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/ConnectionHandles.tsx) containing `ConnectionHandlesOverlay` and `ConnectionHandle` using Tldraw page transform matrix scaling/rotations and pointer listeners. Added `CustomSelectionForegroundOverlayUtil` extending `SelectionForegroundOverlayUtil` to perform a `destination-out` composite operation on the canvas, erases/clears selection borders under connection handle circles.
  - Modified [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) to import and register the handles under `OnTheCanvas` components override, register `CustomSelectionForegroundOverlayUtil` in `overlayUtils`, and add a safe `onMount` theme override (`editor.updateTheme`) that clones the active default theme first (retaining the `fonts` properties) and merges the emerald green (`#10b981`) selection overrides to prevent runtime `TypeError` crashes.
  - Appended glassmorphic styles for `.connection-handle-circle` in [TldrawCustom.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCustom.css).
- **Modified Documentation**:
  - Documented connection handles, theme integrations, selection masking overlay, and runtime bugfixes in Obsidian project index and session log.
- **Diagnostics**: Tested static production builds and TypeScript type-checking using `npm run lint`. Passed successfully with zero compiler/TypeScript errors.

## [2026-07-05] write | Redesign TipTap card shape as expandable glassmorphic pill
- **Session Focus**: Redesign the TipTap card shape rendered on the whiteboard canvas from a static box to a horizontal glassmorphic pill. Add support for a document description field, and implement smooth hover-expansion to display it alongside other document metadata.
- **Code Changes**:
  - **TipTap Card Shape**:
    - Added `description` property to `TipTapCardShape` and updated type declarations and default properties in [TipTapCardUtil.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapCardUtil.tsx).
    - Set shape default bounds to `w: 280, h: 48` (pill shape).
    - Redesigned the card HTML rendering inside [TipTapCardUtil.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapCardUtil.tsx) to render a single-line horizontal pill (Notes icon, truncated title header, and circular write pencil button).
  - **Hover Expansion Styles**:
    - Added transition, transform, and hover keyframes inside [TldrawCustom.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCustom.css) to morph pill shape to card shape on hover (`border-radius: 18px` and height expansion via `max-height: 320px`) and fade-in the description summary, tags, and metadata elements when `description` is present.
  - **Split-Panel Editor**:
    - Added description state, input textarea field, initial data synchronization, and onSave payload integration inside [TipTapSplitEditor.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapSplitEditor.tsx).
  - **Canvas Routing & Event Plumbing**:
    - Integrated description property updates in `activeEditorShape` hook state, `open-tiptap-editor` event listener, `handleAddTipTapCard` creation helper, and `handleSaveDocument` autosave updater in [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx).
- **Modified Documentation**:
  - Updated [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) with design specs for the new expandable pill card and editor panels.
- **Diagnostics**: Checked TypeScript compiles cleanly using `tsc --noEmit`. Committed changes inside `visual-labs` submodule and updated the parent repository reference pointer.

## [2026-07-03] refactor | Create Pull Request and update submodule reference pointer
- **Session Focus**: Review all visual design system changes, database RLS/MFA updates, and spatial canvas features in `visual-labs`, commit/push changes, create a Pull Request on GitHub, and update the parent repository pointer.
- **Code Changes**:
  - Committed unified route-accent design system, community bento grid (GSAP tilt/magnetism), user profile page, auth-aware header navigation, URL/YouTube canvas cards, and link-preview scraper API.
  - Enforced MFA (aal2) guards on admin RLS policies and suspension gates for inactive users (`0003_enforce_mfa_and_suspension.sql`).
  - Created Pull Request #4 on GitHub (`visual-labs`).
  - Updated `visual-labs` submodule reference pointer in parent repository (`no-origins`).
- **Modified Documentation**:
  - Updated [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md) and several wiki files in the parent repo to synchronize documentation.
- **Diagnostics**: Checked Next.js production build (`npm run build`) and lint (`npm run lint`). Passed with 0 errors.

## [2026-06-29] write | Integrate media shapes, floating canvas HUD elements, community bento grid, and database-level MFA gates
- **Session Focus**: Expand the Projects feature whiteboard with custom URL/YouTube media shapes and a Restyled BackToContent locator, build out `/community` and `/profile` subpages using GSAP/UserAvatar, and implement database-level security checks for MFA and user suspension.
- **Code Changes**:
  - **Whiteboard Shapes & Tools**:
    - Created custom Tldraw shape utils: [UrlCardUtil.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/UrlCardUtil.tsx) and [YouTubeCardUtil.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/YouTubeCardUtil.tsx) for link previews (scraping open graph data via `/api/link-preview` API route) and YouTube frames.
    - Added the floating glassmorphic locator [BackToContentButton.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/BackToContentButton.tsx) which displays when shapes are off-screen and zooms/frames the viewport on click.
    - Updated command palette shortcuts to support URL/YouTube embeds.
  - **Subpages & Dynamic Components**:
    - Built out the `/community` page featuring a dynamic 8-characteristic `<MagicBento />` grid styled in [MagicBento.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/MagicBento.css), utilizing GSAP for 3D card tilt and magnetic icon effects.
    - Developed the authenticated `/profile` page with [UserAvatar.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/UserAvatar.tsx) (fetching MD5-hashed Gravatar avatars with initials fallbacks).
  - **Security Gating**:
    - Added backend migration [0003_enforce_mfa_and_suspension.sql](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/supabase/migrations/0003_enforce_mfa_and_suspension.sql) to check JWT multi-factor levels (`aal2`) inside `is_admin()` and block writes from suspended accounts via the `is_active()` helper.
    - Integrated status suspension checks into [middleware.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/utils/supabase/middleware.ts), redirecting suspended users to `/login`.
- **Modified Documentation**:
  - Updated [Ecosystem Architecture](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md) to document DB-level MFA claims and user status gating.
  - Updated [Navigation & Subpage UI](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/navigation_ui.md) with details on `/community` (MagicBento), `/profile` (UserAvatar), and the new GSAP dependency.
  - Updated [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) with URL previews, YouTube embeds, and BackToContent button specifications.
  - Documented projects canvas persistence in [Canvas Autosave](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/canvas_autosave.md).
- **Diagnostics**: All pages successfully compiled and typechecked.

## [2026-06-29] refactor | Establish unified Visual Labs design system (token-driven, multi-accent)
- **Session Focus**: Author the authoritative [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md) design-system spec and roll it out across all of `visual-labs`, replacing two fragmented parallel token systems and pervasive hardcoded `emerald/sky/...` hex with one runtime accent slot.
- **Architecture**: Four token tiers (primitives → `--section-accent` slot → shadcn semantic → utilities). The accent is swapped per-route via `data-section` on `(cards)/layout.tsx` and exposed as a Tailwind color `section` (`text-section`, `bg-section/10`, `border-section/30`). Three independent theming axes are now documented: section accent (route), workspace preset (`VisualizerContext`), sphere material.
- **Code Changes**:
  - Rewrote [index.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/index.css): tier-0 primitives, `[data-section]` swap table for all 7 sections, shadcn vars wired dark + accent, `.glass`/`.glow-accent`/`.surface-list-item` utilities, named type scale, `--color-section` exposure. Default font set to mono.
  - [BorderGlow.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BorderGlow.tsx) inherits the accent slot (colors via `var()`, glow via computed `--section-accent-hsl`); pages drop all color props.
  - Tokenized all 7 card pages, the Projects dashboard (sky→slot), HUD toggles, SphereChatInput, BackgroundVisualizer chrome, resizable, login/MFA/base, and the TipTap + Tldraw CSS.
  - Fixed Stories heading (pink→fuchsia via slot).
- **Verification**: Routes 200, `data-section` resolves in SSR, compiled CSS contains all section blocks + `section` utilities + `color-mix`; `tsc` clean (pre-existing `.next/types/validator.ts` error excepted).
- **Intentional exceptions**: sphere-material colors, InfiniteMenu hue data, editor "unsaved" amber status, admin JS preset config. Deferred: migrating `text-[Npx]` literals to `.type-*`.

## [2026-06-28] refactor | Implement responsive resizable split-screen layout for Tldraw and TipTap
- **Session Focus**: Add responsive resizable layout for Tldraw canvas and TipTap editor on desktop screens, and full-screen drawer overlay on mobile screens.
- **Code Changes**:
  - Installed `react-resizable-panels` dependency.
  - Created [resizable.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/ui/resizable.tsx) containing custom styled Shadcn resizable panel group wrappers configured for the dark neon theme (`bg-white/5` with emerald glowing focus and hover highlights).
  - Modified [TipTapSplitEditor.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapSplitEditor.tsx) to support `isInline` prop, rendering as flexible relative block when inline and w-full full-width drawer when in mobile screen layout.
  - Modified [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) to detect screen width (`isLargeScreen` state at `>= 1024px`). On desktop screens, it mounts a horizontal `<ResizablePanelGroup>` placing `Tldraw` and `TipTapSplitEditor` in separate resizable panels. This keeps `Tldraw` canvas mounted during editor toggling, avoiding canvas reloads, scroll resets, or flickering.
- **Modified Documentation**:
  - Updated [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) to log these responsive resizable workspace layout specs.
- **Diagnostics**: Tested static production builds and TypeScript type-checking using `npm run lint` and `npm run build`. Compiles successfully.

## [2026-06-28] refactor | Enhance Tldraw UI, Toolbar and integrate Command Palette
- **Session Focus**: Integrate TipTap Card creation directly into the default toolbar, replace the default top-left menu with a Shadcn Command component, and integrate the trigger button into the toolbar with rounded sides matching the Visual Labs theme.
- **Code Changes**:
  - Installed Shadcn `command` and `dialog` components (`cmdk` and `@radix-ui/react-dialog` dependencies, and custom UI wrappers [command.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/ui/command.tsx), [dialog.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/ui/dialog.tsx)).
  - Refactored [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) to override Tldraw's native `Toolbar` rendering `<DefaultToolbarContent />` to ensure standard shape tools are dynamically positioned inside the overflow chevron/arrow menu rather than missing, and embedded the Terminal command palette trigger button on the far left.
  - Hidden default `MainMenu` (hamburger menu), `PageMenu` (page dropdown), `QuickActions` (delete, duplicate, etc.), and `ActionsMenu` (three-dots context dropdown) to completely clear the top-left canvas header.
  - Fixed a runtime `TypeError` in `CommandDialog` inside [command.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/ui/command.tsx) by wrapping `children` in the `<Command>` component to provide the necessary `cmdk` context.
  - Integrated `<CommandDialog>` in [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) containing shortcuts for whiteboard tools, canvas actions, page management (create, delete, rename, switch page), and selection actions (duplicate, delete, group selection) styled to update dynamically based on editor state.
  - Styled Command menu components and dialogs inside [TldrawCustom.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCustom.css) with glassmorphism backdrops, monospace console typography, and emerald hover/active glowing outlines.
  - Updated [TldrawCustom.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCustom.css) to correct hyphenated selectors to use standard `.tlui-*` selectors and target `.tlui-main-toolbar__tools`. Configured the toolbar container to be fully rounded (`border-radius: 9999px`) and set a consistent circular shape (`border-radius: 50%`) and dimensions (`36px x 36px`) for all buttons and active state background pseudo-elements (`::after` and `::before`) in the toolbar (including the Command trigger). Positioned `.tlui-style-panel__wrapper` to the bottom right (`bottom: 24px`, `right: 16px`) to resolve overlapping with the top-right Cloud Sync indicator and align its bottom level exactly with the bottom toolbar (`margin-bottom: 24px`) baseline. Configured all style panel buttons and their active/hover state pseudo-element backgrounds to render as perfect circles (`border-radius: 50%`). Added a CSS specificity override for elements with `[data-toolbar-visible='false']` to ensure they hide correctly when collapsed by the layout manager.
- **Modified Pages**:
  - Updated [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md) to log these spatial canvas UI enhancements.
- **Diagnostics**: Run `npm run lint` and `npm run build` checking static page generation and server builds. Passed successfully with zero compilation or TypeScript errors.

## [2026-06-25] write | Implement Projects feature (tldraw canvas, TipTap custom shapes, and database sync)
- **Session Focus**: Program and deploy the Projects feature codebase linking tldraw infinite board with TipTap custom nodes and Supabase.
- **Code Changes**:
  - Installed `tldraw` and `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` dependencies.
  - Created database migration SQL file [0002_projects_feature.sql](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/supabase/migrations/0002_projects_feature.sql) defining the RLS tables for `projects` and `project_versions`.
  - Implemented the `tiptap-card` shape utility [TipTapCardUtil.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapCardUtil.tsx) drawing glassmorphic cards on the canvas.
  - Built the sliding panel editor [TipTapSplitEditor.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TipTapSplitEditor.tsx) hosting the rich-text workspace and real-time word counter.
  - Built [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) and [ClientTldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/ClientTldrawCanvas.tsx) with debounced autosaving and dynamic import.
  - Built the dashboard page [projects/page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/projects/page.tsx) with Workspace management, SemVer publish modal, and Discovery forking operations.
  - Built the canvas route [projects/[id]/page.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/(base)/projects/[id]/page.tsx) with server validations.
  - Added PROJECTS menu item in [BackgroundVisualizer.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BackgroundVisualizer.tsx) and protected the routes in [middleware.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/utils/supabase/middleware.ts).
- **Diagnostics**: Run `npm run lint` and `npm run build` checking static page generation and server builds. Passed successfully.

## [2026-06-25] ingest | Draft RFC for tldraw & TipTap Projects feature
- **Session Focus**: Grill developer to define the scope, user experience, database schema, and layouts for the Projects feature, compiling the results into an RFC.
- **Created Pages**:
  - [Projects Feature RFC](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/projects_feature_rfc.md): Detailed RFC specifying the tldraw custom TipTap shape, database schema, RLS policies, and dashboard flow.
- **Modified Pages**:
  - [index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md): Registered Projects RFC in the Global directory and cleaned up duplications.

## [2026-06-24] write | Register Obsidian Local REST API MCP server in global configs
- **Session Focus**: Enable Obsidian as a wiki and documentation space by integrating the Local REST API plugin's native MCP server.
- **Modified Configurations**:
  - Registered `obsidian` MCP server in [mcp_config.json](file:///Users/hiddenstack/.gemini/config/mcp_config.json) using `mcp-remote` pointing to the local SSE endpoint `http://127.0.0.1:27123/mcp` with the user's authorization bearer token.

## [2026-06-23] ingest | Update wiki documentation for split layouts, stillness, and WebGL lifecycle
- **Session Focus**: Align workspace documentation with recent feature changes and refactors in the visual-labs frontend.
- **Wiki Modifications**:
  - Updated [navigation_ui.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/navigation_ui.md) with details on the split viewport layout, BackdropField, shared cards layout group, floating SphereNavBar controls, and WebGL lifecycle cleanup.
  - Updated [state_sync.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/state_sync.md) to document the global `sphereStill` state variable and deceleration behavior.
  - Updated [sphere_states.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/visual-labs/sphere_states.md) to document the `stillBlend` animation logic (ease-out cubic, 2400ms duration) and trimmed case-insensitive "MEDITATING CORE" preset match/swap.
  - Updated [architecture.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/architecture.md) to log Tailwind CSS v4 styling structure and the global `--radius-button` pill token.

## [2026-06-23] write | Fix InfiniteMenu concurrent WebGL loops and event listener leaks
- **Session Focus**: Address coordinate mapping discrepancies where duplicate menu icons opened incorrect routes, caused by multiple animation loops and pointer listeners running in parallel.
- **Code Changes**:
  - Implemented `destroy()` method on `ArcballControl` class in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to remove pointer event listeners from the canvas.
  - Implemented `destroy()` method on `InfiniteGridMenu` class in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to cancel the running `requestAnimationFrame` loop (`this.rafId`) and delete WebGL texture, program, VAO, and instance/vertex buffers.
  - Updated React component cleanup inside [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to call `sketch.destroy()` on recreation/unmount.
  - Extracted the `scale` prop from the main mount `useEffect` dependency array, introducing a lightweight, dedicated `useEffect` to directly mutate `scaleFactor` and `camera.position[2]` in place without destroying and recreating the WebGL context.

## [2026-06-22] write | Correct Infinite Menu texture row mapping and Y-axis flip
- **Session Focus**: Correct duplicate menu item icons matching and routing alignment.
- **Code Changes**:
  - Restored `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to flip the texture vertically on upload.
  - Removed the redundant cell flip inside the fragment shader by changing `st.y = 1.0 - vUvs.y` to `st.y = vUvs.y` to render icons right-side up.
  - Modified the fragment shader row offset calculation to `int cellY = uAtlasSize - 1 - (itemIndex / cellsPerRow)` to correctly map the flipped vertical rows in the texture atlas (avoiding black/empty discs for Labs, Hyperbase, and Stories).

## [2026-06-22] write | Fix Infinite Menu log flooding, oscillation, and index mapping mismatches
- **Session Focus**: Address terminal log flooding, infinite loop oscillations, and incorrect subpage item selection on menu release.
- **Code Changes**:
  - Normalized target vector `targetPos` in `snapToItem` in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to ensure `quat.rotationTo` computes mathematically accurate rotations.
  - Reset `snapDirection` in `ArcballControl` and `snapToItem` targets to `[0, 0, -1]` to align with the negative-coordinate back-to-front negation rendering pipeline.
  - Added `lastActiveItemIndex` check in `#onControlUpdate` in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to throttle `onActiveItemChange` calls to execute only when the item index actually changes, eliminating infinite rendering log loops.
  - Set `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` in `initTexture` inside [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to correct Y-axis texture row uploads, aligning duplicate item icons with their expected page selectors.
  - Updated `displayItem` text panel logic in [BackgroundVisualizer.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BackgroundVisualizer.tsx) to show `activeItem` when moving or dragging on subpages, dynamically updating descriptions as the user drags.

## [2026-06-22] write | Fix Infinite Menu navigation unresponsiveness and pointer events
- **Session Focus**: Fix Infinite Menu navigation click blocker. Allow button clicks to fire immediately, even during snap settling, and configure pointer events.
- **Code Changes**:
  - Removed `isMoving` block from `handleActionClick` in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) to allow instant page entering.
  - Set `pointer-events: auto` on `.menu-info-panel` in [InfiniteMenu.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.css) to ensure buttons receive clicks on all browsers.
  - Configured `pointer-events: none` on title and description elements in `InfiniteMenu.css` to allow drags on text fields to pass through to the canvas underneath.

## [2026-06-22] refactor | Shift dragging/rotation interaction focus from Sphere to Infinite Menu
- **Session Focus**: Shift primary dragging/rotation interaction from the Liquid Metal Sphere to the Infinite Menu, making the sphere a non-interactive ambient object.
- **Code Changes**:
  - Removed all mouse/touch drag listeners, grab cursor styling, and dragRef states from [LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx), setting its canvas to `pointer-events-none`.
  - Added a slow, continuous ambient rotation on the sphere via `u_time` uniform in `LiquidMetalSphere.tsx`.
  - Removed direct pointer/touch listeners from [InnerCore.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InnerCore.tsx), relying exclusively on `trigger-ripple` window events to trigger core push forces.
  - Bound Infinite Menu visibility directly to the Next.js `pathname` route (always visible on `/`, hidden on subpages) in [BackgroundVisualizer.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BackgroundVisualizer.tsx).
  - Implemented click-to-ripple forwarding inside [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx), forwarding quick clicks on the menu canvas as `trigger-ripple` window events.

## [2026-06-22] write | Resolve sphere, field, and infinite menu interaction conflicts
- **Session Focus**: Resolve click conflicts between background dot field, liquid metal sphere, and inner core. Implement confirmation-based navigation with a glassmorphic ENTER button.
- **Code Changes**:
  - Restricted dragging sphere/pushing core to clicking the sphere's canvas element in [LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx) and [InnerCore.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InnerCore.tsx).
  - Updated sphere container wrapper pointer events in [BackgroundVisualizer.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/BackgroundVisualizer.tsx) to allow click-throughs to background dot field canvas.
  - Added click guards and duplicate audio prevention in [DotField.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/DotField.tsx).
  - Disabled automatic routing on snap rest and introduced a sleek, responsive glassmorphic confirmation panel overlay with a glowing ENTER button in [InfiniteMenu.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.tsx) and [InfiniteMenu.css](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InfiniteMenu.css).

## [2026-06-22] lint | Audit and align repository wikis
- **Session Focus**: Audit, clean, and synchronize all wiki documentation across `visual-labs`, `realm`, and global scopes.
- **Diagnostics**: Executed `audit_wiki.py` link-checking script to ensure 100% path resolution and format compliance.

## [2026-06-21] ingest | Review and synchronize wikis with latest codebase features
- **Session Focus**: Audit and synchronize wiki documentation with all recent codebase changes in No Origins repositories.

## [2026-06-20] write | Gate AI Agent chatbot behind Vercel feature flag
- **Session Focus**: Hide the AI chatbot entry points and configurations, and protect its API route when `NEXT_PUBLIC_ENABLE_AI_AGENT` is not set to `\"true\"`.
