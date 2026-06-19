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
- **`liquid`**: `{ theme, roughness, amplitude, speed, size, sphereOffsetX, sphereOffsetY, transparency, thickness, bulge, pop }`
- **`core`**: `{ coreSize, coreIntensity, coreSpring, coreFriction, coreBlur, coreColor, coreFreeWill, coreFreeWillSpeed }`
- **`field`**: `{ fieldDotSize, fieldGap, fieldRepulsionRadius, fieldRepulsionStrength, fieldSpringTension, fieldState, rainDirection, rainSpeed, rainLineLength, orbGravityStrength, orbSwirlStrength }`
- **`audio`**: `{ audioEnabled, audioVolume, droneVolume, rippleVolume, baseFreq, visualReactivityEnabled, visualReactivityStrength }`

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

---

## 🏛️ Additional Tables Definition

### 3. Environment Stage Configurations (`stages`)
Binds deployment stage names to their active theme and visual-audio state.

#### Schema (SQL Definition)
```sql
create table public.stages (
  name       text primary key, -- 'DEVELOPMENT' | 'STAGING' | 'RELEASE'
  state_id   text references public.states (id) on delete set null,
  theme_id   text, -- ID of the assigned DesignTheme
  updated_at timestamptz not null default now()
);
```

---

### 4. User Profiles & Roles (`profiles`)
Extends Supabase Auth users to associate them with a specific access role and status.

#### Schema (SQL Definition)
```sql
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user'   check (role   in ('user', 'admin')),
  status     text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);
```

*An automated Postgres trigger (`on_auth_user_created` calls `handle_new_user()`) inserts a new profile row on user signup with the default role `'user'`.*

---

## 🔒 Database Security & Row Level Security (RLS)

To secure administrative operations, all database mutation actions are guarded by PostgreSQL RLS.

### 🛡️ Admin Verification Function
We define a security helper function to check admin rights. It is declared as `security definer` to bypass the profile table's own RLS constraints:

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;
```

### 📋 Policies Grid

| Table | SELECT Policy | INSERT/UPDATE/DELETE Policy |
| :--- | :--- | :--- |
| `profiles` | `auth.uid() = id or public.is_admin()` | `public.is_admin()` |
| `component_presets` | Public read (`true`) | `public.is_admin()` |
| `states` | Public read (`true`) | `public.is_admin()` |
| `stages` | Public read (`true`) | `public.is_admin()` |

*Standard users and anonymous visitors can retrieve all visual environments and presets, but only verified admins are allowed to mutate shared tables.*
