# WebGL & Canvas Rendering Engine

This document details the visual rendering systems in **No Origins**, specifically focusing on the background dot field physics canvas and the WebGL raymarching shader that creates the liquid metal sphere.

---

## 🗺️ Rendering Pipeline

The visual background is composed of overlapping canvas and DOM elements layered dynamically:

1. **Backdrop Canvas (`DotField`)**: An HTML5 2D Canvas containing a responsive particle grid with local gravity and elastic spring physics.
2. **Foreground Canvas Container**: A parent wrapper `div` positioned relative to the screen. It applies a translation offset style (`transform: translate(sphereOffsetX%, sphereOffsetY%)`) mapping parameters to offset coordinates.
3. **Foreground Canvas (`LiquidMetalSphere`)**: A high-performance WebGL canvas rendering a procedurally displaced 3D-like liquid sphere using custom fragment shaders (Raymarching) inside the container.
4. **Glowing Core (`InnerCore`)**: An HTML/CSS overlay element layered on top of the WebGL canvas within the container, calculating spring physics, cursor-tracking, and visual reactivity.

```
[Layer 1: DotField] ➔ [Layer 2: Radial Center Vignette] ➔ [Layer 3: Target Circles] ➔ [Layer 4: LiquidMetalSphere WebGL] ➔ [Layer 5: InnerCore Glowing Div]
```

---

## 🎨 Particle Matrix: `DotField`

[DotField.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/DotField.tsx) draws a matrix of particles governed by interactive physical forces.

### Physics and Forces
For each particle in the grid, the engine applies:
- **Restoring Spring Force**: Elastic attraction pulling the particle back to its origin coordinates (`ox`, `oy`).
- **Interactive Repulsion**: Pushes particles away from the mouse cursor if within the repulsion radius.
- **Orb Gravity and Swirl**: Particles are attracted to the central core coordinate (read from `corePositionRef.current`) or swirled in orbits using gravitational vectors.

```typescript
// Restoring force
let ax = (dot.ox - dot.x) * springTension;
let ay = (dot.oy - dot.y) * springTension;

// Repulsion / Gravitational interactions
if (dist < repulsionRadius) {
  const force = (repulsionRadius - dist) / repulsionRadius * repulsionStrength;
  ax -= (dx / dist) * force;
  ay -= (dy / dist) * force;
}
```

### Visual Modes
The grid state (`fieldState`) changes between distinct behaviors:
- **`WAVES`**: Standard elastic mesh floating under sine wave vertical offsets.
- **`ASTEROID_RAIN`**: Falling lines mimicking meteors passing diagonally across the grid.
- **`CHAOS`**: Increased random brownian movement breaking the grid alignment.

---

## 🔮 Procedural Liquid Orb: `LiquidMetalSphere`

[LiquidMetalSphere.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/LiquidMetalSphere.tsx) implements an advanced procedural rendering system.

### The Raymarching Technique
Rather than loading large 3D polygon meshes, the sphere is calculated inside the **Fragment Shader** on a 2D quad canvas. For every pixel, the shader shoots a ray from the camera viewpoint into a Distance Field (SDF) containing:
- A mathematical sphere: $d = \text{length}(p) - \text{radius}$.
- **Displacement Noise**: A 4-octave Fractional Brownian Motion (fBm) value noise function that deforms the sphere surface in real-time based on `u_time` and parameters.

```glsl
// Core sphere distance evaluation
float map(vec3 p) {
    float sphereDist = length(p) - u_size;
    float noiseDisplacement = fbm(p * u_thickness + vec3(0.0, 0.0, u_time * u_speed)) * u_amplitude;
    return sphereDist - noiseDisplacement;
}
```

### Material & Theme Shading
The shader uses calculated normals to perform environment mapping and metallic shading:
1. **Obsidian (Theme 3)**: High fresnel reflection edge glowing with inner core color, dark opaque body.
2. **Holographic (Theme 2)**: Iridescent color shifts based on the dot product of the surface normal and the view direction.
3. **Liquid Gold (Theme 1)**: Rich golden diffuse reflection with glossy highlights.
4. **Chrome (Theme 0)**: Mirror-like environment reflections.
5. **Emerald Cobalt (Theme 4)**: Deep blue-green shades with neon green specular reflections.

---

## ⚡ Performance & Resize Optimizations

- **Canvas DPI Scaling**: Canvas elements are scaled to match the browser's physical device pixel ratio (`window.devicePixelRatio`) to prevent pixelation on Retina screens.
- **Uniform Caching**: WebGL uniforms (such as `u_mouse`, `u_time`, and slider variables) are cached and only updated on draw loops, minimizing CPU-to-GPU data transfer overhead.
- **WebGL Context Safeguards**: In standard Next.js updates, when hot-reloading or changing routes, resources like compile shaders and buffers are explicitly garbage collected in the React cleanup hook to prevent GPU memory leaks.
