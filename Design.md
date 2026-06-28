# No Origins Design System & Architectural Philosophy

This document outlines the core visual identity, UI/UX guidelines, design tokens, and components that define the **No Origins** procedural visual-audio sandbox and interactive system workspace.

---

## 🌌 1. Core Visual Aesthetics

No Origins features a rich, responsive, dark-mode terminal layout blended with neon accent glows and procedural ambient graphics. 

-   **Frosted Glassmorphism**: High-performance backdrop blur overlays are leveraged to float card panels over a dynamic particle field.
-   **Neon Sweeping Outlines**: Mouse-sensitive borders and interactive glow coordinates anchor focus on actionable cards.
-   **Console Typography**: High-contrast monospace font scales project a technical telemetry feed feel.
-   **Reactive Spatials**: Multi-layered background rendering (WebGL particle fields and liquid metal shaders) dynamically scale and warp in response to user actions and ambient Web Audio events.

---

## 🎨 2. Color System & Theme Palettes

The interface uses HSL-based Tailwind color configurations. Subpages and features are associated with distinct glowing color ranges:

| Subpage / Area | Theme Color | Tailwind Accent Class | HSL Base Tokens | Glow Range |
| :--- | :--- | :--- | :--- | :--- |
| **Home / Core** | White / Grey | `text-neutral-100` | N/A | N/A |
| **Workspaces / Projects** | Emerald Green | `text-emerald-400` | `140 80 50` | `#10b981`, `#34d399`, `#059669` |
| **Labs** | Emerald Green | `text-emerald-400` | `140 80 50` | `#10b981`, `#34d399`, `#059669` |
| **Society** | Sky Blue | `text-sky-400` | `200 80 50` | `#0ea5e9`, `#38bdf8`, `#0284c7` |
| **Hyperbase** | Amber Gold | `text-amber-500` | `40 80 50` | `#f59e0b`, `#fbbf24`, `#d97706` |
| **Stories** | Fuchsia Pink | `text-pink-400` | `320 80 50` | `#ec4899`, `#f472b6`, `#db2777` |
| **Spotify** | Spotify Green | `text-emerald-400` | `140 80 50` | `#1db954`, `#1ed760`, `#1aa34a` |
| **Credits** | Violet Purple | `text-violet-400` | `260 80 50` | `#8b5cf6`, `#a78bfa`, `#7c3aed` |

---

## 🏛️ 3. Layout Grid & Structure

The user interface uses a **Split Viewport Layout** to divide focus between sensory procedural graphics and data controls:

```
+------------------------------------+------------------------------------+
|                                    |                                    |
|          WebGL SPHERE              |          SUBPAGE CONTAINER         |
|         (Ambient Canvas)           |         (Independent Scroll)       |
|                                    |                                    |
|   +----------------------------+   |   +----------------------------+   |
|   |                            |   |   |   Glassmorphic Card        |   |
|   |     Liquid Metal Orb       |   |   |    w-full max-w-[450px]    |   |
|   |                            |   |   |                            |   |
|   +----------------------------+   |   |    BorderGlow              |   |
|                                    |   |    backdrop-filter blur     |   |
|                                    |   +----------------------------+   |
|                                    |                                    |
+------------------------------------+------------------------------------+
```

1.  **Left Column (Desktop) / Bottom Row (Mobile)**:
    -   Displays the non-interactive ambient canvas `LiquidMetalSphere`.
    -   Houses the ambient controls `<SphereNavBar>` (Square, Triangle, Circle buttons).
    -   Hosts the Sentient Sphere chatbot input field when enabled.
2.  **Right Column (Desktop) / Top Row (Mobile)**:
    -   An independent scrollable area (`overflow-auto`) hosting interactive routes.
    -   Forces subpages to align center-justified (`items-start justify-center`) inside the shared `(cards)` route group.

---

## 🧩 4. Key UI Components

### 4.1. `<BorderGlow>` Component
The primary wrapper for all card layouts. It captures pointer movement coordinates client-side to update CSS variables on the card wrapper:
-   `--edge-proximity`: Edge distance factor ($0.0$ to $1.0$).
-   `--cursor-angle`: Angle in degrees matching mouse coordinates relative to the card's center.

#### CSS Variables Implementation:
```css
.border-glow-card {
  border: 1px solid rgb(255 255 255 / 15%);
  background: var(--card-bg, #120F17);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```
Conic gradients use these coordinates to draw interactive sweeping light paths and localized drop shadows:
-   **Entrance Animation**: Performs an initial $355^\circ$ angle sweep on mounting (`animated={true}`) to trace the border outline.
-   **Card Backdrop**: Uses a transparent black `rgba(0, 0, 0, 0.65)` together with a CSS backdrop filter blur of `16px` to establish the frosted-glass aesthetic.
-   **Interior Cleanliness**: The inner mesh-gradient background fill (`::after` overlay) and all `inset` box-shadows inside the card boundaries are omitted. In addition, the outer glow layer `.edge-light` is styled with `z-index: -2` (behind the sharp card border `::before` at `z-index: -1` and the card background). To prevent the border color gradients (`::before`) from bleeding inside the card, a CSS `mask-composite: exclude` (and `-webkit-mask-composite: destination-out`) is applied to `::before` to clip out the inner `padding-box` area. This guarantees that the center of the card is pure, translucent dark glass, preventing color cast leaks and shadow reflections inside the card.

### 4.2. WebGL `<InfiniteMenu>`
Site-wide navigation is handled by a WebGL circular wheel layout that rotates items on a 3D plane:
-   **Atlas Texture**: System icons are drawn on a secondary 2D canvas and uploaded to a WebGL texture atlas.
-   **Snapping Logic**: Uses quaternion math to rotate to the nearest menu target. Once rotation settles, a glassmorphic confirmation panel displays details and an **ENTER** button matching the active item's HSL accent.
-   **Interaction Boundary**: Direct drag gestures are intercepted by the Infinite Menu canvas, leaving the sphere behind it as an ambient decorative background. Clicks are forwarded to generate canvas ripple effects.

### 4.3. Workspace Item Containers
Lists of records (such as projects and community forks) are styled as translucent boxes matching the glassmorphic card:
-   **Grid Layout**: Stacks vertically in a single-column container inside the `450px` card container.
-   **Styling Rules**:
    -   Background: `bg-neutral-950/40`
    -   Border: `border-white/5`
    -   Hover: Shifting to `border-emerald-500/30` or `border-sky-500/40` and applying a subtle colored box shadow (`hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]`) to signify interactability.

### 4.4. Spatial Whiteboard Canvas (Tldraw)
The full-viewport canvas workspace for editing project diagrams:
-   **Ambient Background**: The native Tldraw grid is set transparent (`--tl-color-background: transparent`), allowing the reactive `BackdropField` particle grid to render directly underneath the workspace.
-   **Glassmorphic UI**: Custom CSS overrides are applied to Tldraw UI panels (`.tl-ui-panel`, `.tl-toolbar`, `.tl-ui-menu`, popovers) to apply `rgba(10, 10, 10, 0.6)` and `backdrop-filter: blur(16px)`.
-   **Monospace Typography**: The UI interface and custom whiteboard shapes enforce console monospace styling (`font-mono`).
-   **Pill Actions & Emerald accents**: Tools and selectors use the Emerald Green primary token (`#10b981`), and floating HUD buttons are styled as pill-shapes (`rounded-full`).

---

## 🛠️ 5. Development Guidelines & Best Practices

1.  **Do not nest `BorderGlow`**: Since `<BorderGlow>` hooks into pointer movement events, nesting them inside each other can swallow pointer actions and degrade FPS. List items should use light CSS border shifts and shadows instead.
2.  **Clamp Particle Ranges**: Keep WebGL coordinates clamped to avoid rendering crashes.
3.  **Clean WebGL Cleanups**: Always cancel dynamic animation frame loops (`cancelAnimationFrame`) and clear WebGL program buffers on unmount to prevent memory leaks during navigation.
