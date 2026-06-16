# Realm Presets and States Database Schema

This document defines the schema and syncing logic managed by the **realm** backend module, which provides data synchronization for the custom component-level presets and composed States.

---

## 📊 Database Tables Definition

The frontend interacts with the database via public Supabase tables: `component_presets` and `states`.

### 1. Component-Specific Presets (`component_presets`)
Stores specific configurations for individual components (`liquid`, `core`, `field`, `audio`).

#### Schema (SQL Definition)
```sql
create table public.component_presets (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  type text not null, -- 'liquid' | 'core' | 'field' | 'audio'
  settings jsonb not null
);
```

#### Settings JSONB Payload Fields
The `settings` JSONB payload matches the specific parameters of each component type:
- **`liquid`**: `{ theme, roughness, amplitude, speed, size, transparency, thickness, bulge, pop }`
- **`core`**: `{ coreSize, coreIntensity, coreSpring, coreFriction, coreBlur, coreColor, coreFreeWill, coreFreeWillSpeed }`
- **`field`**: `{ fieldDotSize, fieldGap, fieldRepulsionRadius, fieldRepulsionStrength, fieldSpringTension, fieldState, rainDirection, rainSpeed, rainLineLength, orbGravityStrength, orbSwirlStrength }`
- **`audio`**: `{ droneVolume, rippleVolume, baseFreq }`

---

### 2. Composed States (`states`)
Stores composed states mapping component keys to target preset IDs.

#### Schema (SQL Definition)
```sql
create table public.states (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  presets jsonb not null -- Record<string, string> mapping component type to presetId
);
```

#### Example Payload
```json
{
  "id": "state-1718534000",
  "name": "Golden Storm",
  "presets": {
    "liquid": "preset-liquid-992",
    "core": "preset-core-110",
    "field": "preset-field-452"
  }
}
```
*(Notice that "audio" preset is omitted from the state, which is supported by design. Missing component keys remain at their current parameters during transitions).*

---

## ⚡ Real-Time Syncing & Offline Fallback Protocol

- **Supabase JS Client**: The frontend maps database queries using `supabase.from("component_presets")` and `supabase.from("states")` inside `VisualizerContext.tsx`.
- **Offline Caching**: If network connection fails or database tables are uninitialized, the provider gracefully catches the error and reads/writes using local storage caches (`no_origins_component_presets` and `no_origins_custom_states`).
