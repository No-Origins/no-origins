# Supabase — Admin.md §13 step 3

One project, `no-origins`: Postgres + Auth + Storage. No edge functions in v1 —
the admin's Next route handlers do the work with the service role key held
server-side only.

## What is here

| File | What it is |
|---|---|
| `config.toml` | Local stack config. Auth is set for the admin on **:3002** (portfolio is :3000, the design showcase :3001). |
| `migrations/…_schema.sql` | The tables of §8.1 |
| `migrations/…_rls.sql` | Deny-by-default RLS, the `noo_is()` policy shape, and the append-only guard |
| `migrations/…_allowlist_gate.sql` | Magic-link membership (§8.4) |
| `migrations/…_storage.sql` | The two buckets of §8.2 and their policies |
| `seed.sql` | The four systems and the `portfolio` project. **No email addresses** — see below. |

## Running it locally

```bash
npx supabase start      # needs Docker (OrbStack works)
npx supabase db reset   # re-applies every migration, then seeds
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

Run against a local stack, not read and hoped for:

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

Step 4: `apps/admin` — page-mode rail, the three layer sections, auth, empty
screens, deployed to `admin.no-origins.com` before there is anything in it.
