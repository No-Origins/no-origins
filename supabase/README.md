# Supabase — the admin's database

One project, `no-origins`: Postgres, Auth and Storage, for every app that signs in or reads the agents. The schema,
its rules, its tests and the local stack's config live here, run with the Supabase CLI. It is a workspace package
(`@no-origins/supabase`, a `package.json` and nothing else) only so that a change here rebuilds no app on Vercel.

## What is here

| Path | What it is |
|---|---|
| `config.toml` | The local stack: Auth for every app that signs in (each one's callback among the redirect URLs and its origin among the passkey origins, :3002 to :3008), confirmations on, eight-character passwords, a six-digit email code, TOTP on, the access token hook and `jwt_expiry = 600`, the three mail templates. Seeding is off. `[remotes.production]` at its end pins what the hosted project holds where it differs from the local stack, so a `config push` changes only what was meant. |
| `migrations/` | The schema, applied in order (below). |
| `tests/` | pgTAP, run by `npx supabase test db`: nine files, 149 tests, each file one transaction rolled back. |
| `templates/` | The mails: `magic-link.html`, `confirmation.html`, `recovery.html`. Each link carries a token hash the callback verifies, so it works on any device, and the code beside it for the page that asked. |

## The schema

- **Identity**: `profiles` (one a user; `kind` person · agent) and `allowlist`. The allowlist gate is a `before insert`
  trigger on `auth.users` (`noo_enforce_allowlist()`): an address that is neither listed nor holds an unexpired
  invitation never gets an account. Sign-up opens when that refusal is taken away (Admin.md §8.4, step 5's last).
- **Access** (Access.md): `permissions` (the catalogue, sixteen, written only through `noo_permission_upsert` / `_drop`;
  `packages/auth/scripts/check-catalogue.mjs` compares it with `packages/auth/src/permissions.ts`), `roles` (Owner and
  Member built in), `role_permissions`, `role_assignments`, `invitations` and `invitation_roles`, `delegations`, and
  `audit_events` (append-only, a row for every change to who may do what). `noo_can(permission, item)` is what every
  rule asks; guards keep one Owner, the built-in roles, exactly one default role, and nobody granting more than they
  hold. `noo_access_token_hook(event)` writes `perms` and `kind` into every token (and never refuses a sign-in). An
  `admin.*` permission counts only after a second factor (`aal2`, or a passkey sign-in), and the gravest changes need
  one from the last five minutes, refused with `NOAAL` (A12).
- **The studios**: `studio_items` (kind `character` and `drawing` are Orbit's, `action` the motion studio's),
  `studio_drafts` (one an item, `rev` bumped by the database when `data` changes) and `studio_versions` (`major.minor`,
  frozen: no update or delete for any role, truncate revoked), published through `studio_publish()`, which refuses a
  stale `rev`; a new character by `studio_new_character(name, data)`. Anyone may read the characters, the drawings and
  their versions — never a draft, nor who made or published them (Orbit.md C24); everything else asks its app's
  permission.
- **Storage**: `assets` (private, the Owner's alone: Orbit's uploaded drawings) and `publish` (public read).

## The migrations

| File | What it does |
|---|---|
| `…_schema.sql`, `…_rls.sql`, `…_allowlist_gate.sql`, `…_storage.sql` | The first schema: identity, deny-by-default RLS, the allowlist gate and the two buckets. |
| `…_quests.sql`, `…_drop_quests.sql` | Drop the first schema's other tables, then `quests`: a replay passes through them and leaves identity and the buckets. |
| `…_studio_versions.sql` | The studios' items, drafts and versions, `studio_publish()`. |
| `…_studio_minor_versions.sql` | Versions as `major.minor`; `studio_new_character()`. |
| `…_studio_actions.sql` | The kind `action` (an item that names no character and no slot). |
| `…_studio_public_read.sql` | Anyone reads the characters, drawings and their versions, on the columns Orbit reads (Orbit.md C24). |
| `…_access.sql` | Access, step 1: the access tables, `noo_can()`, the guards, the audit record, the sixteen permissions. |
| `…_access_policies.sql` | Step 2: every rule asks `noo_can(<permission>)`. |
| `…_access_token.sql` | Step 3: the access token hook. |
| `…_access_admin.sql` | Step 4: what the admin's pages call — `noo_people()`, `noo_give_role`, `noo_take_role`, `noo_end_sessions`, `noo_remove_account`, `noo_set_default_role`; an invited address may make an account. |
| `…_access_save_role.sql`, `…_access_set_roles.sql` | A role's permissions, and a person's roles, saved in one transaction (`noo_save_role`, `noo_set_roles`). |
| `…_access_second_factor.sql`, `…_access_step_up.sql` | The admin's second factor, and the fresh code the gravest changes ask for (A12). |
| `…_access_own_account.sql` | `noo_delete_own_account()`: never the Owner's or an agent's; with a verified authenticator, only after a fresh code. |

## Running it locally

```bash
npx supabase start      # needs Docker (OrbStack works); Studio at http://127.0.0.1:54323, mail at http://127.0.0.1:54324
npx supabase db reset   # re-applies every migration from scratch (seeding is off: re-add your allowlist row after)
npx supabase test db    # the access rules: 149 tests in nine files
npx supabase stop
```

`db reset` is the one to use while migrations are in flux: a migration that only works *as an increment* fails here
rather than on the hosted project. A change to `config.toml` reaches a running stack on its next `stop` / `start`.
**Run one statement per `npx supabase db query`**: a string of several runs none of them.

## The one thing that is not in this repo

**Your email address.** A repository is the wrong place to keep who is allowed in. After the migrations run, add
yourself, locally in Studio's SQL editor and on the hosted project in its SQL editor:

```sql
insert into public.allowlist (email, role) values ('you@example.com', 'owner');
```

Until that row exists **nobody can sign in at all** — including you. Your first sign-in makes your account, and the
allowlist's `owner` makes it the Owner while there is none.

## The hosted project

- **It holds every migration here** (checked 2026-10-08 with `npx supabase migration list --linked`). Pushing is his:
  `npx supabase db push` applies what is pending, in order.
- **Auth settings are pushed, not typed**: `npx supabase config push` after `npx supabase login`. It compares the whole
  `[auth]` section, which is why `[remotes.production]` pins the hosted values that differ (`site_url`, the email
  settings, TOTP, the pooler and storage analytics). **A hook change goes `db push` first, then `config push`**: the
  hook enabled before its function exists would refuse every sign-in.
- **The passkey origins are not among what `config push` manages**: on the hosted project they are set in the
  dashboard, under the relying party ID `no-origins.com`, one origin per app that signs in (`https://admin.`,
  `motion.`, `orbit.`, `home.` and `auth.no-origins.com`). A passkey registered under another relying party ID does not
  carry over.
- **Email goes through Resend**, from agents@no-origins.com; Supabase's own limits and Resend's plan cap how many go
  out (Admin.md §8.4).

## Writing to his data

He tunes in the studios while other work goes on: tests and scripts read his drafts and never write them. A script that
must write a version cleans up after itself — versions are frozen, so a test version is deleted with the frozen trigger
disabled for that delete alone, locally only — and says so.
