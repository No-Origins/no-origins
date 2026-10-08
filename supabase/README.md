# Supabase — the admin's database

One project, `no-origins`: Postgres + Auth + Storage.

> **One sign-in for every app — 2026-09-30 (Admin.md §8.4, amended).** The motion studio signs in through this
> project too, with the admin's allowlist and the same session (`packages/auth`, the cookie written for
> `.no-origins.com`). `config.toml` lists its callback on :3004 among the redirect URLs and its origin among the
> passkey origins; a running local stack takes them on its next `supabase stop` / `start`. **The redirect URLs are
> pushed, not typed** (2026-09-30, both studios): `npx supabase config push` after `npx supabase login`. It compares
> the whole `[auth]` section, so `config.toml` ends with a `[remotes.production]` override pinning what the hosted
> project holds where it differs from the local stack — `site_url`, confirmations on, an 8-digit code, TOTP on —
> read from the push's own diff on 2026-09-30; without it the push would have put the local values on production.
> **The link is not spent by being opened** (2026-10-01): the callback's GET only carries the token hash to `/sign-in`, and the
> card posts it back — a mail client's preview or a scanner between Resend and the inbox fetches the link and spends
> nothing; the person's tap does. Answer *No* to its storage question (`storage.analytics.enabled` differs and is not ours to change). **The passkey
> origins are not among what config push manages**, so `https://motion.no-origins.com` and
> `https://orbit.no-origins.com` (Orbit's, `character.` until 2026-10-01) under the relying party ID `no-origins.com` are still a dashboard step, and his,
> until checked. A passkey registered under another relying party ID does not carry over.
>
> The same night `db push` applied `…_drop_quests.sql` and `…_studio_versions.sql` to the hosted project — the first
> had waited since 2026-09-23 — so hosted and local carry the same seven migrations.

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
| `migrations/…_studio_versions.sql` | **The studios' drafts and versions (Motion.md M20, Orbit.md C6, 2026-09-30):** `studio_items` (a character, a motion or an uploaded drawing), `studio_drafts` (one per item, `rev` bumped by the database when `data` changes), `studio_versions` (numbered max + 1 per item, named, frozen: no update or delete for any role, truncate revoked), `studio_publish()` (the draft as he saw it, refused on a stale `rev`), owner-only RLS, and the agent's version 12 stored whole as its first. Adds only; drops nothing. |
| `migrations/…_studio_minor_versions.sql` | **Major and minor versions, and a new character by its name (Orbit.md C19, 2026-10-01):** `studio_versions.minor` (from 0; `number` is the major; unique per item with it; every stored version is its number and .0, filled by the column's default, no frozen row written), the name optional, the trigger refusing anything but the next minor or the next major's .0, `studio_publish(p_item, p_ui_version, p_rev, p_label default null, p_step default 'major')` (the motion studio's call unchanged), and `studio_new_character(p_name, p_data)`. Drops only the one-number unique constraint and the old four-argument `studio_publish`. **Pushed to the hosted project on 2026-10-01** (`db push`), before the code that calls it was deployed; the code before it still works against it. |
| `migrations/…_studio_actions.sql` | **The agents' actions (Motion.md M24, 2026-10-01):** the kind `action` (an item naming no character and no slot; its draft `{ action, values }`) and the shape check that allows it, and every motion never published deleted with its draft. Adds a kind; drops nothing else. **Pushed to the hosted project on 2026-10-01**, before the code that calls it was deployed. |
| `migrations/…_access.sql` | **Access, step 1 (Access.md A10, A11; his, 2026-10-06):** who may do what, for people and agents — `permissions` (the catalogue, written only through `noo_permission_upsert`/`_drop`, which `packages/auth/scripts/check-catalogue.mjs` compares with `packages/auth/src/permissions.ts`), `roles` (Owner and Member built in), `role_permissions`, `role_assignments`, `invitations` + `invitation_roles`, `delegations`, `audit_events` (append-only); `profiles.kind` (person · agent); `noo_can(permission, item)`, `noo_is_owner()`, `noo_permissions_of()`; guards for one Owner, the built-in roles, exactly one default, and nobody granting more than they hold; an audit row for every change to the access tables. Seeds the sixteen permissions, makes the owner's account the Owner and every other a Member, and replaces `noo_handle_new_user()` so a new account gets its invited roles or the default. **Read by nothing yet**: every policy still asks `noo_is()`. Adds only. **Not yet pushed to the hosted project** — his `npx supabase db push`. |
| `migrations/…_access_policies.sql` | **Access, step 2 (Access.md A6, A11; 2026-10-06):** every policy that asked `noo_is(<role>)` asks `noo_can(<permission>)`. The studio tables by the item's kind (`noo_studio_app`, `noo_studio_item_app`, `noo_studio_item_kind`): character and drawing are Orbit's, action and motion the motion studio's — read with `<app>.draft.save` or, for an action, `motion.open`; items made with `orbit.agent.create` / `orbit.style.upload` / `motion.draft.save`; items changed (publish, restore) with `<app>.version.publish`; drafts with `<app>.draft.save`; versions with `<app>.version.publish`; deletes the owner's alone; Orbit's public read unchanged. `profiles` read by oneself or `admin.people.view`, changed with `admin.people.assign`, removed with `admin.people.remove`; the allowlist with `admin.invitations.manage`; the `assets` and `publish` buckets the owner's alone. Rewrites policies only. **Not yet pushed to the hosted project**, with step 1 — his `npx supabase db push`. |
| `migrations/…_access_token.sql` | **Access, step 3 (Access.md A6, A11; 2026-10-06):** `noo_access_token_hook(event)`, Supabase's custom access token hook, writing `perms` (every permission the principal holds) and `kind` into every token Auth issues; it never refuses a sign-in. Executable by `supabase_auth_admin` alone. Enabled in `config.toml` (`[auth.hook.custom_access_token]`), which also sets `jwt_expiry = 600`. **Hosted order: `db push`, then `config push`** — the hook enabled before its function exists would refuse every sign-in. |
| `migrations/…_access_admin.sql` | **Access, step 4 (Access.md A7, A11; 2026-10-06):** what the admin's pages call — `noo_people()` (reads `auth.users` for the last sign-in), `noo_give_role`, `noo_take_role` (which ends the person's sessions), `noo_end_sessions`, `noo_remove_account`, `noo_set_default_role`, each asking its permission, refusing a change that names nobody (`noo_named`), and never acting on the Owner, oneself or someone who holds more (`noo_may_act_on`); who made a role, gave one or sent an invitation stamped from the request; `noo_enforce_allowlist()` now also admits an address with an unexpired invitation; the Owner's sentence. Adds; drops nothing. |
| `migrations/…_access_own_account.sql` | **Deleting one's own account (Access.md A2; Admin.md §8.4 step 5, 2026-10-08):** `noo_delete_own_account()` — never the Owner's, never an agent's, and for an account with a verified authenticator only after a code (or passkey sign-in) from the last five minutes, refused with `NOAAL`; an `account.deleted` audit row, then the user, its profile and its roles go. The guard on `role_assignments` now lets a row go with its account (the profile already deleted) whatever role it is, the Owner's excepted — before, a person holding a role they could not grant could not delete their own account. Adds a function and replaces the guard. **Hosted: his `npx supabase db push`.** |
| `migrations/…_studio_public_read.sql` | **The agents are everyone's to see; publishing is his (Orbit.md C24, 2026-10-03):** two read policies for `anon` and `authenticated` alike — `studio_items` of kind `character` and `drawing`, and `studio_versions` of those items — and `anon`'s privileges on the three studio tables revoked, then `select` granted back on the columns Orbit reads (never `created_by`, `published_by`, nor the drafts). The first anon policy in the schema, under Admin.md §0.6's rule for a live component. Adds two policies and narrows anon; drops nothing. **Pushed to the hosted project on 2026-10-03** (`db push`, his permission in the session), about an hour after Orbit's deploy — a visitor on production saw no agents in between, the fallback by design. |

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

**The login host and deleting one's own account (2026-10-08), against the local stack** (`…_access_own_account.sql`,
and `config.toml`'s confirmations on, eight-character passwords, the confirmation and recovery templates and the
login's :3008 among the redirect URLs and passkey origins, loaded by `npx supabase stop` and `start`). `npx supabase test
db`: 149 tests across nine files, `tests/access_own_account_test.sql`'s fifteen among them — nobody, the Owner and an
agent refused, a member deleting their account and its roles going with it, the record staying, a role its holder could
not grant no longer in the way, and an account with an authenticator asked for a fresh code. Then through the auth app
(`e2e/.mcp/auth-flows.mjs`, gitignored, two throwaway invited addresses made and deleted through the pages): a password
sign-up confirmed by its mail's link, the member's apps, `next` kept for an app's local address and dropped for any
other host, deleting the account; an account made by the mailed code; a forgotten password reset by its link and the new
one signing in. Twenty-two checks, no uncaught error. The audit log keeps the throwaway accounts' rows.

**Access, step 4 (2026-10-06), against the local stack** (`…_access_admin.sql`). `npx supabase test db`: 79 tests across
four files pass, `tests/access_admin_test.sql`'s seventeen among them — the people list for whom it is meant, a role
given (stamped as the owner's) and taken (the person's sessions ended), one's own sessions never ended from here, a role
stamped as made by the owner whatever the page sent, the default moved, a member seeing no list, a remover acting on
nobody who holds a permission it lacks nor on the Owner, a change naming nobody refused out loud, an invited address
making an account and a stranger still not. Then the admin's pages, signed in as him (`e2e/.mcp/admin-access.mjs`,
gitignored): every page renders, a role made, a permission ticked, the role deleted, an address invited and revoked, no
console error; the audit log keeps those test changes.

**Access, step 3 (2026-10-06), against the local stack** (`…_access_token.sql`, the hook and `jwt_expiry = 600` in
`config.toml`, loaded by `npx supabase stop` and `start`). `npx supabase test db`: 62 tests across the three files pass,
the hook's eight among them. Then through the apps (`e2e/.mcp/access-step3.mjs`, `access-revoke.mjs`, gitignored): his
fresh token holds all sixteen permissions, kind `person`, and lives 600 s, and he opens the admin; a throwaway member's
token holds `motion.open`, the admin sends it to the no-access card, the motion studio opens, the card's sign-out
works; and with the member's sessions ended in the database, the same unexpired token was sent to the sign-in on its
next request, a second later. The member was then removed; its sign-up and removal stay on the audit log, which
nothing deletes from. **Run one statement per `npx supabase db query`**: a string of several ran none of them here.

**Access, step 2 (2026-10-06), against the local stack** (`…_access_policies.sql`). Applied with `npx supabase migration
up --local`; `pg_policies` holds no rule asking `noo_is()`. `npx supabase test db` runs `tests/access_policies_test.sql`
beside step 1's, 54 tests in all, passing: the owner reads every draft, profile and the allowlist and publishes; a
member sees every action and its versions but no draft, saves none, makes no action, sees every agent's look, reads only
its own profile and nothing of the allowlist, and writes nothing to the 1.0 buckets; a motion editor makes an action with
its first draft, saves and publishes it (the item showing the new version) and never saves a look; an Orbit drafter saves
a look's draft but publishes none and makes no agent; a visitor sees the agents and no action. Then `pnpm review -g
"orbit|motion"`, signed in as him: 24 passed, no console errors, Orbit showing his draft and its next version.

**Access, step 1 (2026-10-06), against the local stack** (`…_access.sql`, Access.md A11). Applied with `npx supabase
migration up --local`, then `npx supabase test db`, which runs `tests/access_test.sql` with pgTAP in one transaction
that is rolled back: 31 tests pass — the seed (sixteen permissions, two built-in roles, Member holding only
`motion.open`, the owner's account the Owner, the seed on the record); a sign-up given the default, an invited one its
invitation's roles with the invitation used up; one Owner; a built-in role never deleted, a held role not deleted,
always one default; the record append-only even for the database; as the owner, everything, but the Owner never given
or taken by a request; as a member, only its roles' permissions, no role changed, no record read, only its own roles
seen, a delegation made for itself and never for someone else; as an invited helper, an invitation with a role it
holds all of and never one with a permission it lacks; as a visitor, nothing and no access table read. Afterwards the
local data held no test account.

**Orbit's public read (2026-10-03), against the local stack** (`…_studio_public_read.sql`, Orbit.md C24). Applied
with `npx supabase migration up --local`, then through PostgREST on the anon key: the six characters list by name
and kind; `select=*` on the items is refused (`created_by` is not granted); the actions do not list; 35 versions
count — the characters' and drawings', none of the actions'; `published_by`, the drafts, an insert into the
versions, an update of an item and `studio_publish` are each refused with `42501`. Then Orbit itself on :3005
(`e2e/.mcp/orbit-public.mjs`): a fresh browser opens `/` without a redirect and reads the bar as a visitor, and the
drafts' `rev`s and the versions' count are the same after it as before; signed in as the owner the studio is as it
was.

**The agents' actions (2026-10-01), against the local stack** (`…_studio_actions.sql`, Motion.md M24). Run first
inside a transaction and rolled back, then applied with `npx supabase migration up --local`. It adds the kind
`action` (an item that names no character and no slot; the shape check compares the kind as text, since a label added
in a transaction cannot be used in it) and deletes every motion never published, with its draft — one, locally, a
draft with no versions. Checked: an action inserts, and one naming a character is refused by `studio_items_shape`. The
motion studio then made Bounce's item and draft, saved on its `rev`, published 1.0 and 2.0 through `studio_publish`
(minor, then major) and went back to 1.0. **The two test versions were removed afterwards with the frozen trigger
disabled for that delete alone**, as the character studio's was, and `current_version_id` put back to null: Bounce has
a draft and no versions. **Pushed to the hosted project on 2026-10-01** (`db push`), before the code that calls it was
deployed: it deleted the hosted project's one motion, a draft with no versions, as it had the local one's.

**The studios' data, local → hosted (2026-10-01, at the deploy).** The same night the hosted project was made what the
local one is, for every character and action: one transaction through `npx supabase db query --linked -f`, items
matched by kind and name (each database made its own ids), a local version the hosted project lacked inserted with
its id, label and date, the current version and the draft put to local's. The version triggers were disabled for it
alone and re-enabled before its end, and the transaction checked itself before committing (every version's data, every
draft, every current version, every trigger back on); it was run once first ending in a raised exception, so rolled
back. **Two hosted versions were replaced**: Bali 15.1 and Mira 1.4, published on production that morning, whose
numbers local had given to other versions since. They are in `.private/hosted-public-before-prod-sync-2026-10-01-2140.sql`
(gitignored), the hosted public schema's data as it stood before. Checked afterwards by a fingerprint of both
databases: 47 versions, 9 drafts, 9 current versions, identical.

**The studios' drafts and versions (2026-09-30), against the local stack.** Run first inside a transaction and rolled
back, then applied with `supabase migration up --local` (the allowlist row kept). Checked:

- the seed is character "Agent" with version 12, "his settings", current, held whole (32 body values, 6 face slots),
  and its draft equal to it at `rev` 0;
- the owner, through RLS: a draft write on the right `rev` moves it 0 → 1, a stale one moves 0 rows, the same data
  keeps the `rev`; `studio_publish` makes 13 (its name trimmed) and makes it current; a stale `rev`, a repeated name in
  any case and an empty one are refused; going back to 12 moves the pointer and renumbers nothing;
- frozen: the owner's update or delete of a version touches 0 rows, and the trigger refuses them for a superuser;
  truncate is refused; only an item's first version may name its number; an item with versions cannot be deleted;
- shapes: a motion needs a character and that character must be one; a drawing needs a slot; one name can be used in
  two slots but not twice in one; an item cannot show another item's version or change its kind;
- a stranger (signed in, not on the allowlist) and `anon` see 0 rows and cannot insert.

**Not pushed to the hosted project**, like the two migrations before it: that is his step (`supabase db push`).
Before that push, regenerate its seed from the package (`resolveCharacter({ body: {}, face: {} })`,
`@no-origins/ui/lib/agent-body`) if a default has moved: three face defaults did the same night (brow height and
colour, symbol colour), and the seed and the local version 12 were brought up to them. `config.toml` lists
Orbit's callback (:3005) and passkey origin beside the motion studio's; a running stack takes them on its
next `supabase stop` / `start`. On the hosted project both are his dashboard steps, with
`https://orbit.no-origins.com` (`https://character.no-origins.com` until the rename, Orbit.md C21).

Its seed now holds four versions of the agent: 12, "his settings"; 13, "Version 13, tuned" (his settings block of
the same night, "This becomes the rest state of the motion": 12 with Come back 1000 ms); 14, "Version 13, tuned,
tuned" (his next block: 13 with Come back 500 ms and Spread 0.05); and 15, "his version 14, as it looks" (Spread 0.11
once the whole slider was made live on slime), current, the draft starting from it — `resolveCharacter({ body: {},
face: {} })` as the package stood. The agent's item is named **Bali** since he named it (2026-09-30). **And five more characters** (Agents.md A2, Orbit.md C13): Kino, Zaza,
Oru, Mira and Lola — the Maker, Scout, Keeper, Editor and Muse — each an item with a draft and a version 1, "Version 1", its whole look, numbered 1 by hand
(an item's first version may name its number). Replayed from scratch inside a rolled-back transaction each time, and
every row added to the local database by hand, since the migration was already applied there.

Orbit, then the character studio, saved against it (`e2e/.mcp/orbit-save.mjs`): a draft written on each change, a
publish (13), a repeated name refused, a going back to 12, and a draft saved elsewhere first refused with "Load it".
The test version was removed afterwards with the frozen trigger disabled — locally, and only for that row.

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
