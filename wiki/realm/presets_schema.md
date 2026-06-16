# Realm presets Table Schema

This document defines the schema and syncing logic managed by the **realm** backend module, which provides data synchronization for the user's HUD presets.

---

## 📊 Presets Table Definition

The frontend interacts with the database via a public Supabase table named `presets`.

### Schema (SQL Definition stub)

```sql
create table public.presets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  settings jsonb not null
);
```

### Settings JSONB Payload Fields
The `settings` JSONB payload matches the `AppStatePreset` TypeScript interface inside `VisualizerContext.tsx`:

| Parameter | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `theme` | number | `3` | WebGL orb shader color theme index (0-4) |
| `roughness` | number | `0.26` | Gloss/matte displacement surface roughness |
| `amplitude` | number | `0.35` | Noise displacement amplitude |
| `speed` | number | `1.0` | Displacement animation speed |
| `size` | number | `0.5` | Mathematical core radius of WebGL orb |
| `thickness` | number | `3.0` | Fluid noise density / thickness |
| `fieldDotSize`| number | `1.4` | Canvas grid particle radii |
| `fieldGap` | number | `30` | Distance between layout particles |
| `fieldState` | string | `"WAVES"` | Background canvas render mode (`WAVES`, `ASTEROID_RAIN`, `CHAOS`) |

---

## ⚡ Real-Time Syncing Protocol

- **Supabase JS Client**: The frontend maps database queries using `supabase.from("presets").select("*")` inside `VisualizerContext.tsx`.
- **Loading a Preset**: Selecting a preset overwrites the React hooks in the Context, causing the WebGL loops and `audioEngine` parameters to instantly update in real-time.
