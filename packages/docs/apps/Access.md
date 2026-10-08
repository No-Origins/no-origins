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
  app. Taking a role in the admin also ends the person's sessions, so the gates close too. **The admin's pages read it
  so since 2026-10-07** (`shown()` in `@no-origins/auth/server`): which page, card and button, from the token the gate
  verified on the same request, with no request of their own — they asked `noo_can()` three or four times a page
  before, each a round trip; an action still asks `can()`, and the page's data still comes through the rules.
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
  it. A stolen password or a forwarded magic link then never reaches the admin. How it works and the order it is built
  in: A12.
- **The gravest actions ask again** (his, 2026-10-06: agreed). Making a role with admin powers, removing an account and rotating an
  agent's credential need the second factor within the last five minutes, so a session left open is not enough (A12).
- **The studio tables serve two apps.** A row's `kind` says whose it is: `character` and `drawing` are Orbit's
  (`orbit.*`), `action` the motion studio's (`motion.*`).

## A7. Management

His, 2026-10-06: **in the admin, with invitations**. The admin's pages, each behind the permission named:

- **People** (`admin.people.view`): every person and agent, their kind, roles, joined and last signed in. Give and
  take roles (`admin.people.assign`), end sessions and remove (`admin.people.remove`), make and retire agents and rotate
  their credentials (`admin.agents.manage`).
- **Roles** (`admin.roles.manage`): every role, who holds it and its permissions, ticked by app with each one's
  sentence; make, rename, delete (a role still held asks where its holders go); move the default. **A role is ticked
  and then saved** (his, 2026-10-07: *"we don't have to call the API every time some permission is enabled or
  disabled … select and then click on save so that we can push all the changes together"*): a box a
  permission, nothing written until Save, and then its name, sentence and permissions in one transaction. Leaving the
  page with changes not saved asks first. **A person's roles are ticked and then saved the same way**, in the People
  page's dialog, in one transaction.
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
4. **The admin's pages**: people, roles, invitations, audit. The allowlist's rows become invitations. **Built
   2026-10-06, version 1** (`…_access_admin.sql`, `apps/admin`): People (`/people`: everyone and every agent, their
   roles, joined and last signed in; give or take a role, which ends the person's sessions; end sessions; remove),
   Roles (`/roles`, `/roles/<id>`: make, rename, delete, tick permissions by app with each one's sentence, move the
   default), Invitations (`/invitations`: an address, its roles, 7, 14 or 30 days; revoke) and Audit (`/audit`: fifty
   to a page, by kind), each card on the admin's home shown only to whoever holds its page's permission. The database
   gives the pages `noo_people()`, `noo_give_role`, `noo_take_role`, `noo_end_sessions`, `noo_remove_account` and
   `noo_set_default_role`, each asking its permission and refusing a change that names nobody, never acting on the
   Owner, on oneself or on someone who holds more; who made, gave or invited is stamped from the request. **The
   allowlist's rows did not become invitations**: there is one, his, and his account exists. Instead an unexpired
   invitation now admits an address the allowlist does not hold, so until step 5 the Invitations page is the way in.
   Seventeen database tests pass beside the sixty-two before; through the pages, signed in as him, a role was made, a
   permission ticked, the role deleted, an address invited and revoked, each on the audit log, no console error.
   The pages were built in the Settings page's frame, a column that scrolled, off the grid; **on 2026-10-07 they were
   put on the grid** (his: "I really made it very clear from the beginning that the grid is the base layout for the
   whole application"), with Settings, a record a box. Version 1; the screens are his to design. **2026-10-07, his: a
   role is ticked and then saved** (A7; `…_access_save_role.sql`): `noo_save_role` takes the role's name, sentence and
   whole set of permissions and writes only what changed, as the asker (`security invoker`), so the rules and guards
   run row by row as they did for each tick and the record keeps a line a tick; a refusal anywhere leaves the role as
   it was. Fourteen database tests (`access_save_role_test.sql`). The page holds the draft: a changed permission's box
   is tinted (`muted`), and the name's row — Name, For, the count of changes, Discard and Save — repeats on every page
   the role spills onto, so Save is always in reach; the way back followed with changes not saved asks "Leave without
   saving?", a reload or a closed tab the browser's own question. **The People dialog saves together too**
   (`…_access_set_roles.sql`): `noo_set_roles` takes the whole set of roles a person should hold and takes, then gives,
   each through `noo_take_role` and `noo_give_role`, so their checks and guards run and a role taken ends the sessions;
   a refusal leaves the person as they were and shows in the dialog. Twelve database tests
   (`access_set_roles_test.sql`). The same day the pages stopped asking `noo_can()` for what they show (A6) and a
   role's page loads that role alone: the admin home makes one call to the database where it made five, People five
   where nine, Roles and a role four where seven.
   **Due before step 5, beside the motion studio's read path (step 3)**: the admin's second factor and asking again
   before the gravest actions (A6, his, agreed), not built yet; proposed in A12, 2026-10-08.
5. **Only then does sign-up open** (the login host, Admin.md §8.4): the allowlist's refusal goes and the default role
   is given. Never before step 3, or a stranger's account would pass the old gates, which ask only for a session.
6. **Agents**: their accounts, their credentials in the harness, delegations.
7. **The old goes**: `noo_role`, `profiles.role`, `noo_is`, the allowlist — once nothing reads them.

Each step is a migration and a pull request; each hosted push is his.

## A12. The admin's second factor

*Proposed 2026-10-08; **his answers the same day, every one as proposed** ("Let's go with your suggestion", then
"Yes" to each). What it rests on is his (A6, 2026-10-06: agreed); this is how it works and the order it is built in.*

An `admin.*` permission counts only in a session that has passed a second factor: Supabase's assurance level `aal2`,
carried in the token as `aal`. Every other permission is unchanged — the motion studio, Home and Orbit open on one
factor, as today.

- **Once a sign-in, not once a page.** A sign-in — magic link, password or passkey — gives `aal1`. Opening the admin
  then asks for the six-digit code from an authenticator app, and the session is `aal2` from then on, through every
  ten-minute refresh and in every app (the session is one, Admin.md §8.4), until it ends. A new sign-in — another
  device, a sign-out, a role taken — asks again.
- **Enrolling.** On the first visit with no factor, the admin shows the authenticator's QR code and asks for a code to
  prove it took; the session is `aal2` there and then. After that, adding or removing a factor needs `aal2` (Supabase's
  rule, proven on the local stack on 2026-10-08: `insufficient_aal` both ways), so a stolen magic link cannot add its own authenticator once he has one. **Until
  he has enrolled, it could** — so he enrolls the day the screens ship, before the requirement is switched on (the
  order, below).
- **Asking again.** The gravest actions need the code entered within the last five minutes, read from the token's
  record of when it was (`amr`), so a session left open is not enough: (1) ticking an `admin.*` permission into a
  role, (2) giving someone a role that holds one, (3) removing an account, (4) rotating an agent's credential (step
  6). A6 named three; (2) is the power of (1) given another way, so it is added (his, 2026-10-08). The database
  refuses with a sentence the page knows; the page asks for the code and saves again, the draft kept.
- **Where it is checked**, as every permission is (A6). The gate reads `aal` beside `perms` from the token `getUser()`
  has verified: an `admin.*` permission without `aal2` is not held, and a session at `aal1` is sent to the code step,
  not to the no-access card. `shown()` applies the same rule, so no admin button shows on one factor. `noo_can()`
  checks `aal` for `admin.*`, so every rule and function the admin calls refuses on one factor whatever a page does.
  The asking again is a database helper (`noo_second_factor_within(interval)`) that the functions behind the four
  actions call.
- **Agents.** An agent signs in as a person does (A5) but has no phone to read a code from, and a code the harness
  computed from a stored secret would only be a second password. **The admin is people's** (his, 2026-10-08) — a role holding
  an `admin.*` permission is never given to an agent, a guard in the database like the Owner's. Agents act through the
  other apps' permissions and delegations (step 6).
- **The screens are the package's.** The code step and enrolling are `@no-origins/auth` screens on the sign-in page's
  grid, so they move to `auth.no-origins.com` with the sign-in (Admin.md §8.4) unchanged. The admin's Settings lists
  the factors beside the passkeys, to add a second or remove one.

**If the phone is lost.** He is the only Owner, so a lost authenticator locks him out of the admin — never out of the
database. Three ways back, not exclusive:

- **A second authenticator** enrolled beside the phone: a password manager that keeps codes (iCloud Passwords,
  1Password). Supabase allows ten factors.
- **Recovery codes**, Supabase's own and experimental: ten single-use codes shown once, each a way to `aal2`, kept in
  the password manager. They need the hosted Auth server to offer them — checked while building; if it does not, this
  way is not there yet.
- **The break-glass, always there.** As the project's owner, from the Supabase CLI: delete his factors
  (`delete from auth.mfa_factors where user_id = …`, through `npx supabase db query --linked`), sign in, enroll again.
  The CLI's own login is the root all of this rests on; it is written here so it is found when it is needed.

**His, 2026-10-08: the second authenticator and the break-glass, and recovery codes too if the server has them.**

**A passkey.** A passkey sign-in is already two things — the device and its unlock (Face ID, Touch ID) — and a phishing
page cannot replay it, which it can a six-digit code. Whether it counts as the second factor by itself, so a passkey
sign-in opens the admin with no code, depends on what Supabase writes in the token for it (`amr`), checked while
building. **His, 2026-10-08: yes** — if the token tells it apart from the other ways in; else the code after it, as after a magic
link. **It does** (checked 2026-10-08, a virtual authenticator on the local stack): a passkey sign-in is `aal1` to
Supabase with `amr` `[{ method: "passkey" }]`, where a password is `password` and a code `totp`. So step 3's rule is
**`aal2`, or a session signed in with a passkey**, and for the gravest actions a code or a passkey within five
minutes. Supabase now also offers a passkey as a second factor proper (`[auth.mfa.web_authn]`), A6's "when Supabase
offers it" — a later option, not needed for this.

**The order, each step leaving him able to sign in:**

1. Locally, TOTP switched on in `supabase/config.toml` (the hosted project has it already); the package's enrolling and
   code screens; the factors in Settings. Nothing required yet. A pull request. **Built 2026-10-08**:
   `@no-origins/auth/second-factor` — `useSecondFactor()` (the authenticators, whether this session gave a code, and
   whether changing them needs one), `AddAuthenticatorDialog` (a code from one already added when the session has not
   given one, then a name, the QR code and its key, and a code to prove it took; closed half way, the half-added one is
   removed) and `CodeDialog` (a code before something that needs it) — and the admin's Settings: an "Authenticator
   apps" record with Add, a record an authenticator with Remove (a code first when the session has not given one).
   **Recovery codes are not in it**: the local Auth server (v2.196) does not know them, so they could not be built and
   proven here; the hosted one runs v2.197, and whether it offers them is checked when he enrolls — they are added
   then, if so.
2. **He enrolls on production** — the phone and the second authenticator — and keeps the recovery codes, if any.
3. The requirement: `noo_can()`, the gate and `shown()` ask for `aal2` on `admin.*`; the code step after sign-in. A
   migration and a pull request; the hosted push his, **after step 2, never before**. **Built 2026-10-08**
   (`…_access_second_factor.sql`): `noo_second_factor()` — `aal2`, or `amr` holding `passkey` — and `noo_can()` asking
   it for every `admin.*` permission, the Owner's included; the gate reading `aal` and `amr` beside `perms`
   (`claims.ts`: `secondFactorPassed`, `needsSecondFactor`) and sending a one-factor session that holds the app's
   `admin.*` permission to `/sign-in?second=1&next=…`, never to the no-access card; `shown()` the same; the sign-in
   page's `SecondFactorCard` — the code, or adding an authenticator when there is none — and on to `next`. The
   database's tests run their sessions at `aal2` now, and thirteen new ones prove one factor holds no `admin.*`
   permission, two factors and a passkey do, and a member's motion studio is as before (118 in all). Through the gate
   on the local admin: an admin with no authenticator is sent to add one and lands where it was going; with one, a
   wrong code is refused and the right one lands there; a passkey sign-in goes straight in, and changing the
   authenticators from it still asks for a code; a member opens the motion studio and gets the no-access card at the
   admin.
4. Asking again on the four actions, and the agents' guard. A migration and a pull request. **Built 2026-10-08**
   (`…_access_step_up.sql`): `noo_second_factor_within(interval)` reads when a code was entered — or a passkey used —
   from the token's `amr`, and the guards of the tables the gravest changes write ask it, so no page, function or
   direct request goes round them: ticking an `admin.*` permission into a role (`role_permissions`), giving a role that
   holds one (`role_assignments`) or inviting with it (`invitation_roles`), removing someone else's account (a guard
   on deleting a profile, which `noo_remove_account` reaches). Five minutes; a request with no session behind it is
   not asked. The refusal's code is `NOAAL`: the admin's pages ask for the code — one dialog for the page,
   `useStepUp()` in `admin-pages.tsx`, used by `useChange`, the role page's Save and the People dialog — and run the
   same change again. A second code in a two-factor session moves the code's time in `amr` on (proven locally). The
   agents' guard: a role holding an `admin.*` permission is never given to an agent, no such permission is ticked into
   a role an agent holds, and an account holding one never becomes an agent. Rotating an agent's credential asks
   through `noo_require_fresh_second_factor` when agents are built (A11 step 6). Sixteen database tests (134 in all;
   the others now enter their code just before they act).

Database tests for each: one factor reads and changes nothing in the admin's tables and two factors do; a code older
than five minutes is asked again; an agent is never given an `admin.*` role. The admin's local helper scripts enroll a
factor for the test account and compute its codes.

**His answers, 2026-10-08.** (1) The ways back: the second authenticator and the break-glass, and recovery codes if
the server offers them. (2) Giving a role with an `admin.*` permission asks again. (3) A passkey sign-in counts as both
factors, if the token tells it apart. (4) The admin is people's: no agent holds an `admin.*` permission.

## Open

- **Settled, his, 2026-10-06**: an agent signs in as a person does (A5); both tokens, the access token ten minutes,
  sessions ended when a role is taken, a second factor for the admin and asked again before the gravest actions (A6);
  Member starts with the motion studio, and Home waits for a role he makes (A4).
- **To prove while building**: that a revoked session closes the gate before its access token runs out (A11 step 3);
  how an agent's request names its delegation to the database (step 6).
- **Settled, his, 2026-10-08 (A12)**: the ways back if the phone is lost (a second authenticator, the break-glass,
  recovery codes if offered); giving a role with an `admin.*` permission asks again; a passkey sign-in counts as both
  factors; the admin is people's. Checked 2026-10-08: Supabase asks for `aal2` to add or remove a factor once one
  exists, and a passkey sign-in writes `passkey` in `amr`. Still to check: whether the hosted server offers recovery
  codes (when he enrolls, step 2).
