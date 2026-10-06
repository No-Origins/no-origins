# No Origins — Access

*Opened 2026-10-06, **proposed, every decision his and recorded; for approval**. Who may do what across No Origins, people and agents alike: the permissions the
apps declare, the roles he makes from them in the admin, who holds them, where each is checked, and the record of every
change. It replaces the three fixed roles of Admin.md §8.3 and the allowlist of §8.4, and it is what the login host of
Admin.md §8.4 (`auth.no-origins.com`) opens sign-up behind. Nothing here is built until he approves it.*

## A1. What it is for

His, 2026-10-06, once sign-up was open to everyone:

> "though we are allowing everyone to sign up, I also want to have roles and permissions for agents that I will
> create in the next project … have complete control over what applications they can access, what features they can
> access, what permissions do they have"

> "I should be able to create roles in the admin dashboard and assign permissions"

So:

- **Anyone may sign up**, and a stranger's account can do only what the default role grants (A4).
- **Agents are principals like people** (A5): the same roles, the same checks, the same record.
- **Control at every grain**: which apps, which features, which actions (A3).
- **Roles are made in the admin, not in code** (A4, A7). Code declares what can be checked; he decides who may.

## A2. Four pieces

```
Principal ──holds──▶ Role ──grants──▶ Permission ◀──checked by── the code
person or agent      he makes it      the code declares it
```

- **A principal is anyone who acts**: a person who signed up, or an agent. Both are accounts in Supabase Auth with a
  row in `profiles`, whose `kind` is `person` or `agent`.
- **A permission is one thing the code checks**, named `<app>.<thing>.<action>` — `home.open`,
  `motion.version.publish`, `admin.roles.manage`. The apps declare them (A3); a permission no code checks would protect
  nothing, so none is ever invented in the dashboard.
- **A role is a named set of permissions he makes in the admin.** Data, not code: added, renamed, changed and deleted
  without a deploy.
- **An assignment gives a principal a role.** A principal may hold several; what it may do is the union of their
  permissions (its *effective permissions*). The owner holds every permission (A4).

**Self rights are no one's to grant.** Every signed-in person may change their own password and passkeys and delete
their own account (his, 2026-10-06: yes), whatever their roles; these are not permissions.

## A3. The catalogue

His, 2026-10-06: **finer from the start**. The catalogue is code — one file in `packages/auth` naming each permission,
its app and a sentence of what it allows — and a migration seeds the same names into the database, where roles refer to
them; CI fails if the two disagree. The first catalogue, from what the apps do today:

| Permission | Allows |
|---|---|
| `admin.open` | Opening the admin. |
| `admin.people.view` | Seeing every person and agent, their roles and when they last signed in. |
| `admin.people.assign` | Giving and taking roles — never Owner, and never a role with a permission the giver lacks (A4). |
| `admin.people.remove` | Ending someone's sessions; removing an account. |
| `admin.agents.manage` | Making an agent's account, rotating its credential, retiring it. |
| `admin.roles.manage` | Making, renaming and deleting roles, and changing their permissions. |
| `admin.invitations.manage` | Inviting an address with roles; revoking an invitation. |
| `admin.audit.view` | Reading the audit log (A8). |
| `motion.open` | Opening the motion studio and trying every control, nothing saved (his: as Orbit's visitors do). |
| `motion.draft.save` | Saving an action's draft. |
| `motion.version.publish` | Publishing an action's version. |
| `orbit.draft.save` | Saving a look's draft. Orbit is open, so it has no `open`. |
| `orbit.version.publish` | Publishing a look's version. |
| `orbit.agent.create` | Making a new agent's look. |
| `orbit.style.upload` | Uploading a drawing for a look. |
| `home.open` | Opening Home: the house and its tour. |

The portfolio, the showcase, engineering and status declare none: they are everyone's. A feature that needs a new
check adds its permission to the catalogue in the same change; until a role is given it, only the owner has it.

## A4. Roles

- **Owner** — built in, and **one person, him** (his, 2026-10-06). Holds every permission, those added later included,
  without rows. Cannot be given, taken or deleted in the admin, so he can never be locked out.
- **Member** — built in as **the default**: what every sign-up gets. Its permissions are his to change; it starts with
  `motion.open` (his, 2026-10-06), beside the public apps and Orbit's play. **Home is not in it**: sign-up is open to
  everyone, so `home.open` in Member would show the house to every account (Home.md H4). He first asked for it there,
  then, shown that, chose a role of his own for it: *"I'll create family or any relevant role later."* Until he makes
  one, Home is the owner's alone. The default can be moved to another role; there is always exactly one.
- **Every other role is his to make** in the admin: a name, a sentence, the permissions ticked. There is no fixed
  editor (his: not decided); if one is wanted, it is made like any other. A role is the same whoever holds it, so a role
  can be made for agents ("Builder"), for people ("Friend") or for both.
- **Nobody grants more than they hold.** Giving a role, or ticking a permission into one, needs every permission it
  carries; only the owner can give a role that holds `admin.roles.manage` or `admin.people.assign`. A helper given part
  of the admin can never climb past it.

## A5. Agents

His, 2026-10-06: an agent acts **both** as itself and on behalf of a person.

- **An agent is an account of kind `agent`.** It has no inbox and never uses the login page. The admin makes it
  (`admin.agents.manage`) and shows its credential once; the agents harness (`services/agents`) keeps it and **signs in
  with it as a person does** (his, 2026-10-06), so an agent has the same tokens and sessions (A6) and nothing new to
  secure; rotating the credential ends its sessions.
- **As itself**, it may do what its roles grant, like anyone.
- **On behalf of a person**, it acts under a **delegation**: the person, signed in, lets that agent act for them, for a
  stated purpose, until an expiry, and can end it at any time. While it acts under one, the agent may do only what
  **both** it and the person may do — the overlap, never more than either. A delegation can only narrow; nothing an
  agent presents can widen what it may do. Each request names the delegation it acts under; the database checks it.
- **The record names both** (A8): the agent as the one who acted, the person as the one it acted for.

The swarm's standing rule (it does not write the publish bucket) becomes a role without that permission; the parts of
the rule about the repository (`packages/ui`, the portfolio) are git's and CI's, not this.

## A6. Where it is checked

Three places, as today (Admin.md §8.3), each closer to the data:

| Where | Asks | Reads | Fresh |
|---|---|---|---|
| **The gate**, each app's `proxy.ts` | May this principal open this app? (`<app>.open`) | The sign-in token's list of permissions, written by the database when the token is issued (Supabase's custom access token hook) | Within the token's life, an hour today (his, 2026-10-06: the gates read the token) |
| **The server**, a page, an action, a route | May it do this? | `can(permission)`, one question to the database | Live |
| **The database**, a rule on every table | May it read or write this row? | `noo_can(permission)` | Live |

- **One question everywhere**: `can(permission, item?)`. The item is ignored until A9; asking it now means nothing is
  rewritten then.
- **The token shows, the database decides.** Buttons appear from the token's list; the refusal is the server's and the
  database's, which are live — a permission taken away stops a save at once, even while an older token still opens the
  app. Taking a role in the admin also ends the person's sessions, so the gates close too.
- **Two tokens, as Supabase issues them** (his, 2026-10-06: *"we can have both refresh token and access token if you
  have better auth ideas then we can explore them too"*). The **access token** is short and carries the permissions the
  gates read; the **refresh token** is long, lives in the session cookie, and quietly gets a new access token — the
  proxy already refreshes on every request. Refresh tokens already rotate, each used once, and one used twice ends the
  whole session (reuse detection, `supabase/config.toml`).
- **The access token lives ten minutes**, not the hour of today (`jwt_expiry`). A changed role reaches every gate within
  ten minutes with nothing else done; the cost is a refresh every ten minutes of use, which nobody sees.
- **Taking a role away ends that person's sessions at once.** Their refresh tokens are revoked, and the gate, which
  already asks the auth server on every request (`getUser()`, Admin.md §8.4), closes on their next click. To prove in
  step 3 that a revoked session fails at the gate before its access token runs out; if it does not, ten minutes is the
  bound.
- **The admin needs a second factor** (his, 2026-10-06: agreed). An `admin.*` permission counts only in a session that has passed a
  second factor — Supabase's assurance level `aal2`, which the database rules can read from the token. The authenticator
  app (TOTP) is already switched on for the hosted project; a passkey as the second factor follows when Supabase offers
  it. A stolen password or a forwarded magic link then never reaches the admin.
- **The gravest actions ask again** (his, 2026-10-06: agreed). Making a role with admin powers, removing an account and rotating an
  agent's credential need the second factor within the last five minutes, so a session left open is not enough.
- **The studio tables serve two apps.** A row's `kind` says whose it is: `character` and `drawing` are Orbit's
  (`orbit.*`), `action` the motion studio's (`motion.*`).

## A7. Management

His, 2026-10-06: **in the admin, with invitations**. The admin's pages, each behind the permission named:

- **People** (`admin.people.view`): every person and agent, their kind, roles, joined and last signed in. Give and
  take roles (`admin.people.assign`), end sessions and remove (`admin.people.remove`), make and retire agents and rotate
  their credentials (`admin.agents.manage`).
- **Roles** (`admin.roles.manage`): every role, who holds it and its permissions, ticked by app with each one's
  sentence; make, rename, delete (a role still held asks where its holders go); move the default.
- **Invitations** (`admin.invitations.manage`): an address, its roles and an expiry. Signing up with that address gives
  those roles instead of the default. Today's allowlist rows become invitations.
- **Audit** (`admin.audit.view`): A8, by who, what and when.

**The auth app** (Admin.md §8.4) shows a signed-in person the apps they may open: the public ones and every app whose
`<app>.open` they hold. The admin appears only for those who hold `admin.open` — today, him alone (his: members never
see it). Its account page is the self rights of A2: password, passkeys, delete my account.

## A8. The audit log

His, 2026-10-06: **yes, from the start**.

- **Every change to access, by triggers**, so nothing can change who may do what without a row: a role made, changed
  or deleted; a permission ticked or unticked; a role given or taken; an invitation sent, used or revoked; a delegation
  made or ended; an agent made, rotated or retired; an account removed.
- **Every write an agent makes, and every write made on someone's behalf**, by the server action that makes it.
- **A row**: when; who acted, and their kind; for whom, if anyone; what (a permission or an event); the app; the item;
  the detail, before and after. A removed account's rows keep its name.
- **It is append-only**: no update or delete for anyone, the owner included, as the studio's versions are frozen. Read
  with `admin.audit.view`. Kept whole for now.

## A9. Single items, later

His, 2026-10-06: leave room, do not build. A permission today covers everything of its kind; one day it may cover one
item ("may publish this one agent's look"). The room is `can(permission, item)`, which takes an item already, and an
assignment that can later carry what it is limited to. Nothing else here assumes a permission is global.

## A10. The tables

A sketch, for the first migration to make exact:

- **`profiles`** gains `kind` (`person` · `agent`); its `role` goes in A11.
- **`permissions`**: name, app, sentence — seeded from the catalogue (A3).
- **`roles`**: id, name, sentence, `built_in` (`owner` · `member` · none), `is_default`.
- **`role_permissions`**: a role and a permission.
- **`role_assignments`**: a principal, a role, who gave it and when.
- **`invitations`**: an address, its roles, who invited, expiry, when used.
- **`delegations`**: an agent, the person it acts for, the purpose, expiry, when ended.
- **`audit_events`**: A8's row. (`audit_log` was the 1.0 admin's, dropped on 2026-09-23.)
- **Functions**: `noo_can(permission, item)`, the token hook that writes a principal's permissions into its token, and
  the trigger that gives a new account its invited roles or the default.

Every one behind RLS: the access tables are read and written only with the `admin.*` permission each names, and a
principal reads its own roles and delegations.

## A11. From today to this, in order

**Today**: three fixed roles (owner, editor, viewer) on `profiles`; the allowlist, whose trigger refuses any other
address; `noo_is()` in about twenty policies — the studio tables, `profiles`, the allowlist, and the 1.0 admin's two
buckets (`assets`, `publish`); Orbit's server asking for the owner; and gates that ask only for a session.

1. **The tables, `noo_can`, the catalogue and the two built-in roles**, beside the old. His account becomes the Owner.
   Nothing reads them yet. **Built 2026-10-06** (`…_access.sql`): the eight tables of A10 (with `invitation_roles`
   beside `invitations`), `noo_can()`, `noo_is_owner()` and `noo_permissions_of()`, the sixteen permissions, Owner and
   Member, his account the Owner, and every new account given its invited roles or the default. Already enforced in the
   database, as the lock and not the screen: one Owner, never given or taken by a request; built-in roles never
   deleted, always exactly one default, a held role not deleted; nobody granting, taking or inviting with more than
   they hold; the record append-only, every change to the access tables on it. The catalogue in code is
   `packages/auth/src/permissions.ts`, checked against the migrations by the package's typecheck, so by CI. Thirty-one
   database tests (`supabase/tests/access_test.sql`, `npx supabase test db`) pass on the local stack; the hosted push
   is his.
2. **The policies move from `noo_is` to `noo_can`**, table by table: the studio tables by kind (A6), `profiles` and the
   allowlist to the `admin.*` permissions, the two 1.0 buckets to the owner alone until they have a use. **Built
   2026-10-06** (`…_access_policies.sql`): no rule asks for an old role any more. A studio item is read by whoever may
   save its app's drafts, and an action also with `motion.open`; made with `orbit.agent.create` (a character),
   `orbit.style.upload` (a drawing) or `motion.draft.save` (an action); changed, which is publishing or restoring, with
   `<app>.version.publish` (and an upload for a drawing); deleted by the owner alone. Drafts need `<app>.draft.save`,
   versions `<app>.version.publish`; a character's and drawing's published looks stay everyone's (Orbit.md C24). 23
   database tests (`supabase/tests/access_policies_test.sql`) pass beside step 1's: the owner keeps everything, a member
   reads the published actions and no draft, a motion editor saves and publishes actions and never a look, an Orbit
   drafter saves a look and publishes none, a visitor sees the agents and no action. The sweep, signed in as him, loads
   Orbit's and the motion studio's drafts as before.
3. **The token hook, and every gate asks for `<app>.open`**; Orbit's and Home's server checks become `can()`. **Built
   2026-10-06** (`…_access_token.sql`, `supabase/config.toml`): `noo_access_token_hook` writes `perms` and `kind` into
   every token and never refuses a sign-in (a failure gives a token with no permissions, every gate shut); the access
   token lives ten minutes. `authGate` takes `permission` — the admin `admin.open`, the motion studio `motion.open`,
   Home `home.open`; Orbit stays open — reads it from the token `getUser()` has just had verified, and asks
   `noo_can()` live for a token from before the hook. A signed-in account without it is sent to the sign-in page, which
   says it cannot open the app and offers a sign-out. Orbit's writes each ask their own permission instead of the
   owner's role; Home asks `home.open`; `can()` in `@no-origins/auth/server` asks the database. **Proven on the local
   stack**: a fresh token of his holds all sixteen and lives 600 s; a member's holds `motion.open`, is refused by the
   admin with the no-access card and opens the motion studio; and **ending a person's sessions closes every gate on
   their next request**, with their token still unexpired — so taking a role closes the gates at once (A6). Eight
   database tests of the hook pass beside the sixty-two before. **On the hosted project the order is `db push`, then
   `config push`**: a hook enabled before its function exists refuses every sign-in. **Due before step 5**: the motion
   studio reads every action from its draft, so an account with only `motion.open` sees an empty studio; it must read
   the published versions and save nothing, as Orbit does for a visitor (C24).
4. **The admin's pages**: people, roles, invitations, audit. The allowlist's rows become invitations.
5. **Only then does sign-up open** (the login host, Admin.md §8.4): the allowlist's refusal goes and the default role
   is given. Never before step 3, or a stranger's account would pass the old gates, which ask only for a session.
6. **Agents**: their accounts, their credentials in the harness, delegations.
7. **The old goes**: `noo_role`, `profiles.role`, `noo_is`, the allowlist — once nothing reads them.

Each step is a migration and a pull request; each hosted push is his.

## Open

- **Settled, his, 2026-10-06**: an agent signs in as a person does (A5); both tokens, the access token ten minutes,
  sessions ended when a role is taken, a second factor for the admin and asked again before the gravest actions (A6);
  Member starts with the motion studio, and Home waits for a role he makes (A4).
- **To prove while building**: that a revoked session closes the gate before its access token runs out (A11 step 3);
  how an agent's request names its delegation to the database (step 6).
