# Supabase — the admin's database

One project, `no-origins`: Postgres + Auth + Storage.

> **Quests removed — 2026-09-23 (Admin.md §0.7).** *"remove showcase /composes,
> admin's too and also quests feature."* `…_drop_quests.sql` drops `quests` (its
> four policies and both triggers go with it by `cascade`),
> `noo_touch_quest_layout()` and the `noo_quest_status` enum. Identity is
> untouched. `seed.sql`, which seeded only the `portfolio` quest, is deleted and
> seeding is off in `config.toml`. The schema is now identity and the two buckets,
> nothing else.
>
> **The hosted project is not migrated.** The drop was applied to the **local**
> stack and verified (below); it has **not** been pushed. Until someone runs
> `supabase db push` (or applies the file by hand) deliberately, the hosted
> database keeps what it has — `quests` and its rows included, if the 2026-09-17
> reset below was pushed since it was written. **A push drops data**: it applies
> every pending migration in order, so on a project that never took the reset it
> drops the three-layer tables and their seeded rows first, then `quests`. It is
> Bhargav's to run.

> **Reset to the Quests model — 2026-09-17 (Admin.md §0.5).** *(Record: its
> `quests` table was dropped on 2026-09-23, above.)* The three-layer
> schema (projects · documents · document_versions · systems · products ·
> product_installs · assets · audit_log) was built for the document editor that
> was deleted with React Flow. It is dropped in `…_quests.sql`, which keeps
> identity — `profiles`, `allowlist`, the allowlist gate and their RLS — and adds
> one table, `quests`. The rows below marked *(pre-reset)* describe tables that no
> longer exist; they are kept as the record of what was verified when they did.
>
> The reset migration was applied to the **local** stack with `supabase migration
> up` (which preserves the local allowlist row); the **hosted** project still
> carries the old tables until a deliberate `db push`, which is Bhargav's to make.

## What is here

| File | What it is |
|---|---|
| `config.toml` | Local stack config. Auth is set for the admin on **:3002** (portfolio is :3000, the design showcase :3001). Seeding is **off** since 2026-09-23 — there is no seed file. |
| `migrations/…_schema.sql` | The tables of §8.1 *(pre-reset; most dropped by `…_quests.sql`)* |
| `migrations/…_rls.sql` | Deny-by-default RLS, the `noo_is()` policy shape, the append-only guard *(pre-reset)* |
| `migrations/…_allowlist_gate.sql` | Magic-link membership (§8.4) — **kept** |
| `migrations/…_storage.sql` | The two buckets of §8.2 and their policies |
| `migrations/…_quests.sql` | **The reset (§0.5):** drops the document/editor/products era, keeps identity, adds `quests` (+ its `rev` trigger and RLS) *(its `quests` dropped by `…_drop_quests.sql`)* |
| `migrations/…_drop_quests.sql` | **Quests removed (§0.7):** drops `quests`, `noo_touch_quest_layout()` and `noo_quest_status`; identity untouched. **Drops data** on any database that has quest rows. |

## Running it locally

```bash
npx supabase start      # needs Docker (OrbStack works)
npx supabase db reset   # re-applies every migration (seeding is off; re-add your allowlist row after)
npx supabase stop
```

`db reset` is the one to use while migrations are in flux: it drops and rebuilds
from scratch, so a migration that only works *as an increment* fails here rather
than on the hosted project.

## The one thing that is not in this repo

**Your email address.** The allowlist is the entire membership rule, and a
repository is the wrong place to keep who is allowed in. After the first
migration runs, add yourself:

```sql
insert into public.allowlist (email, role)
values ('you@example.com', 'owner');
```

Locally: `npx supabase start`, then paste that into Studio's SQL editor with
your own address. On the hosted project: the SQL editor, same line. Until that
row exists **nobody can sign in at all** — including you. That is the design
(§8.4), not a snag: an address that is not listed never gets an account for a
magic link to attach to.

## What was verified, and how

**Quests removed (2026-09-23), against the local stack after `…_drop_quests.sql`:**

- only `allowlist` and `profiles` remain in `public`, and `noo_role` is the only
  enum left — `quests`, `noo_touch_quest_layout()` and `noo_quest_status` are gone;
- identity survived whole: `noo_is`, `noo_current_role`, the allowlist gate and
  the profile-making trigger on `auth.users`, and the three policies on
  `allowlist` and `profiles`;
- `touch_updated_at()` is dropped too: `quests` was the last trigger calling it
  (`profiles` has no `updated_at`), so the four functions left in `public` are
  `noo_current_role`, `noo_enforce_allowlist`, `noo_handle_new_user`, `noo_is`;
- `supabase db reset --local` replays every migration from scratch to that same
  state. Seeding is off, so a reset leaves the allowlist EMPTY — re-add the owner
  with the one line below before signing in (a magic link then recreates the user
  and its profile as `owner`, checked the same day);
- the admin, signed in: home (three cards) and settings render, the passkey door
  on sign-in is there, and `/quests` is a 404.

**Quests (2026-09-17), against the local stack after the reset migration** —
*historical: the table was dropped on 2026-09-23, above:*

- only `allowlist`, `profiles`, `quests` remain in `public`; the document/editor/products
  tables are gone, and the shared functions (`noo_is`, `noo_current_role`, the
  allowlist gate, `touch_updated_at`) survived;
- `quests` has all four policies (read/insert/update/delete) and the `rev` trigger;
- placing two molecules on the compose dashboard and pressing Save wrote the layout,
  the trigger bumped `rev` 0 → 1, and the save indicator read *Saved*;
- a save on a stale `rev` moves 0 rows and the dashboard shows the conflict rather
  than clobbering (the `where slug and rev` update).

**Pre-reset — verified when the three-layer schema existed, kept as the record:**

- an unlisted address is **rejected** at `auth.users` insert;
- a listed one is accepted and gets a `profiles` row **carrying the invited role**;
- `anon` sees **zero rows** in all ten tables;
- an owner sees everything and `noo_is('owner','editor')` is true;
- a viewer reads projects, **cannot** read the allowlist, **cannot** insert a
  version, and an update to a draft touches **0 rows**;
- an empty version label is refused by a check, a duplicate one by a unique index (R1);
- `update` and `delete` on `document_versions` **raise even as superuser** — RLS
  stops the `authenticated` role, the trigger stops the service role;
- `documents.rev` goes 0 → 1 on the first draft write, stays put on a title-only
  edit, and a stale `where rev = <old>` write updates 0 rows.

## Three departures from §8.1 as written

1. **No `themes` table.** §8.1 listed one; R3 forbids it. R3 makes the package
   the only source of truth for tokens, so a table holding `tokens jsonb` would
   be a second one for exactly the thing R3 exists to prevent. The per-version
   `theme_snapshot` is not the same thing — it is a record of what a version was
   published against, which is history rather than configuration.
2. **`version int` + `label text not null`**, not `version text` + `version_ord
   int`. §8.1 predates R1 settling the format; R1's integer already sorts.
3. **No `citext`.** A lowercase-only `text` column with a check is the same
   guarantee without depending on where the extension landed or what is on a
   role's `search_path`.

## Next

The admin's **Quests** feature was built on this schema (Admin.md §0.5) — the
grid-of-cards home, `/quests` (create · delete), and `/quests/[slug]` (compose on
the grid, save to `quests.layout`) — and **removed on 2026-09-23** (Admin.md
§0.7), with subdomains and deployment per quest (§0.6) withdrawn alongside. What
the admin reads now is identity: sign-in, the allowlist, `profiles` and Settings.

Still ahead, and deliberately Bhargav's: **pushing to the hosted project.** Both
`…_quests.sql` and `…_drop_quests.sql` may be pending there (see the note at the
top), and either one drops rows. Check what the hosted database holds before the
push, not after.
