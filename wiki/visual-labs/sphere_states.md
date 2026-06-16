# LiquidMetalSphere Admin-Created States & Transitions Design

This document details the architectural design and parameter mapping for implementing **Admin-Created States** and **Smooth Transitions** for the `LiquidMetalSphere` in the **No Origins** visual-labs workspace.

---

## 🔮 Core Concept: Admin-Created States

Instead of hardcoding default states (such as `DORMANT` or `TURBULENT`), this system enables admins to capture their current visualizer parameters as a custom **State**. 

Once created, these states can be used as target points for smooth transitions, or selected in a mixer/crossfader to blend parameters dynamically.

---

## ⚙️ Component Presets & States Configuration Schema

Rather than keeping flat lists of visualizer parameters, each component (`liquid`, `core`, `field`, `audio`) manages its own presets. A composed **State** is a combination of these individual component preset references mapped via a dynamic dictionary:

```typescript
export interface ComponentPreset {
  id: string;
  name: string;
  type: "liquid" | "core" | "field" | "audio";
  settings: Record<string, any>;
}

export interface SphereStateConfig {
  id: string;
  name: string;
  presets: Record<string, string>; // Maps component type -> presetId
}
```

### 🎛️ Parameters Groupings
* **`liquid`**: `theme`, `roughness`, `amplitude`, `speed`, `size`, `transparency`, `thickness`, `bulge`, `pop`
* **`core`**: `coreSize`, `coreIntensity`, `coreSpring`, `coreFriction`, `coreBlur`, `coreColor`, `coreFreeWill`, `coreFreeWillSpeed`
* **`field`**: `fieldDotSize`, `fieldGap`, `fieldRepulsionRadius`, `fieldRepulsionStrength`, `fieldSpringTension`, `fieldState`, `rainDirection`, `rainSpeed`, `rainLineLength`, `orbGravityStrength`, `orbSwirlStrength`
* **`audio`**: `droneVolume`, `rippleVolume`, `baseFreq`

---

## ⚡ Animation & Interpolation Architecture

To achieve high-performance (60 FPS) transitions without causing CPU bottlenecks, we use a **Target vs. Active Ref** system in [LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx):

```mermaid
graph TD
    Admin[Admin Panel] -->|Trigger Transition| Context[VisualizerContext]
    Context -->|Set Target State Config| WebGL[LiquidMetalSphere WebGL Render Loop]
    WebGL -->|Frame Interpolation| CurrentVals[Current Active Uniform Refs]
    CurrentVals -->|Draw Frame| Canvas[Screen Render]
```

1. **Target vs. Current Values**: 
   - [VisualizerContext.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx) manages the **Target Configuration** (representing the desired target state properties).
   - The WebGL rendering loop in [LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx) maintains **Current Active Values** via refs.
2. **Smooth Interpolation**:
   - In each render frame, the active variables slide towards the target values:
     $$\text{current} = \text{current} + (\text{target} - \text{current}) \times \text{interpolationRate}$$
   - This prevents React from having to re-render the HUD sliders 60 times a second during transition while keeping the visual change butter-smooth on screen.
3. **Fallback & Component Exclusions**:
   - If a component key is missing from `presets` (e.g. `presets.field` is undefined because the admin unchecked "Field Preset" during state composition), the target value resolves to the current active value in the context.
   - During animation, the interpolater runs on that component's properties with identical start and end values, leaving that component completely unaffected. This allows subset state transitions (e.g. morphing only the audio while keeping the liquid sphere identical).

---

## 🎨 Proposed Controls in the Interactive HUD ("States" Tab)

We have a dedicated **"States"** tab in [InteractiveHUD.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/InteractiveHUD.tsx) containing:

### 1. State Creator & Manager
* **Save Current State**: A text field and selectors to capture the current active HUD settings.
* **Component Selectors**: Dropdowns and checkboxes in the Admin Panel to select and include/exclude specific component presets.
* **State List**: A list of saved states showing included components and action triggers:
  - **Morph to State**: Trigger a smooth, animated transition to that configuration.
  - **Rename / Delete**: Standard management tools.

### 2. Transition Tweaker
* **Transition Duration**: Slider to adjust how long the morph takes (from `0.1s` up to `10.0s`).
* **Easing Curve**: Choose between `Linear`, `Smooth (Exp Decay)`, and `Spring / Elastic` (overshoots the target slightly and wobbles into place to mimic fluid elasticity).

### 3. A-B State Mixer (Morpher)
* **Selectors**: Dropdowns to select two saved configurations: **State A** and **State B**.
* **Blend Slider**: A horizontal crossfader slider (`0%` to `100%`). Dragging the slider dynamically calculates a weighted interpolation of every parameter between State A and State B in real-time, instantly shifting the sphere.
