# No Origins — Access

Who may do what across No Origins, people and agents alike: the permissions the apps declare, the roles he makes from
them in the admin, who holds them, where each is checked, the second factor the admin asks for, and the record of
every change. **Approved 2026-10-06; built through step 5 part A of A11 (the login host); part B (every gate sends
people to `auth.no-origins.com`) is next.** The login itself is Admin.md §8.4.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## A1. What it is for

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
  permissions (its *effective permissions*). The Owner holds every permission (A4).

**Self rights are no one's to grant.** Every signed-in person may change their own password, passkeys and
authenticator apps and delete their own account, whatever their roles; these are not permissions. Deleting one's own
account (`noo_delete_own_account()`) is never the Owner's or an agent's, asks for a fresh code when the account has an
authenticator (A12), and takes the account's roles with it.

## A3. The catalogue

The catalogue is code — `packages/auth/src/permissions.ts`, naming each permission, its app and a sentence of what it
allows — and a migration seeds the same names into the database, where roles refer to them; the package's typecheck,
so CI, fails if the two disagree.

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
| `motion.open` | Opening the motion studio and trying every control, nothing saved. |
| `motion.draft.save` | Saving an action's draft. |
| `motion.version.publish` | Publishing an action's version. |
| `orbit.draft.save` | Saving a look's draft. Orbit is open, so it has no `open`. |
| `orbit.version.publish` | Publishing a look's version. |
| `orbit.agent.create` | Making a new agent's look. |
| `orbit.style.upload` | Uploading a drawing for a look. |
| `home.open` | Opening Home: the house and its tour. |

The portfolio, the showcase, engineering, status and the login declare none: they are everyone's. A feature that needs
a new check adds its permission to the catalogue in the same change; until a role is given it, only the Owner has it.

## A4. Roles

- **Owner** — built in, and **one person, him**. Holds every permission, those added later included, without rows.
  Cannot be given, taken or deleted by any request, so he can never be locked out.
- **Member** — built in as **the default**: what every new account gets. Its permissions are his to change; it holds
  `motion.open`, beside the public apps and Orbit's play. **Home is not in it**: sign-up is open to everyone, so
  `home.open` in Member would show the house to every account (Home.md H4). Home waits for a role he makes ("family or
  any relevant role"); until then it is the Owner's alone. The default can be moved to another role; there is always
  exactly one.
- **Every other role is his to make** in the admin: a name, a sentence, the permissions ticked. There is no fixed
  editor role; if one is wanted, it is made like any other. A role is the same whoever holds it, so a role can be made
  for agents, for people or for both.
- **Nobody grants more than they hold.** Giving a role, or ticking a permission into one, needs every permission it
  carries; only the Owner can give a role that holds `admin.roles.manage` or `admin.people.assign`. A helper given part
  of the admin can never climb past it.
- **A role still held is not deleted.** Its holders lose it first ("Someone still holds this role. Take it from them
  first."). Built-in roles are never deleted.

## A5. Agents

Decided, built in A11 step 6. An agent acts **both** as itself and on behalf of a person.

- **An agent is an account of kind `agent`.** It has no inbox and never uses the login page. The admin makes it
  (`admin.agents.manage`) and shows its credential once; the agents harness (`services/agents`) keeps it and **signs in
  with it as a person does**, so an agent has the same tokens and sessions (A6) and nothing new to secure; rotating
  the credential ends its sessions.
- **As itself**, it may do what its roles grant, like anyone — never an `admin.*` permission (A12).
- **On behalf of a person**, it acts under a **delegation**: the person, signed in, lets that agent act for them, for a
  stated purpose, until an expiry, and can end it at any time. While it acts under one, the agent may do only what
  **both** it and the person may do — the overlap, never more than either. A delegation can only narrow; nothing an
  agent presents can widen what it may do. Each request names the delegation it acts under; the database checks it.
- **The record names both** (A8): the agent as the one who acted, the person as the one it acted for.

The swarm's standing rule (it does not write the publish bucket) is a role without that permission; the parts of the
rule about the repository (`packages/ui`, the portfolio) are git's and CI's, not this.

## A6. Where it is checked

Three places, each closer to the data:

| Where | Asks | Reads | Fresh |
|---|---|---|---|
| **The gate**, each app's `proxy.ts` (`authGate`) | May this principal open this app? (`<app>.open`) | The access token's `perms`, written by the database when the token is issued (`noo_access_token_hook`, Supabase's custom access token hook) | Within the token's ten minutes, and at once when the person's sessions are ended |
| **The server**, a page, an action, a route | May it do this? | `can(permission)` in `@no-origins/auth/server`, one question to the database | Live |
| **The database**, a rule on every table | May it read or write this row? | `noo_can(permission)` | Live |

- **One question everywhere**: `can(permission, item?)`. The item is ignored until A9.
- **The token shows, the database decides.** Which page, card and button a screen shows comes from the token the gate
  verified on the same request (`shown()` in `@no-origins/auth/server`), with no request of its own; a refusal is the
  server's and the database's, which are live, so a permission taken away stops a save at once. An action asks
  `can()`; a page's data comes through the rules.
- **Two tokens, as Supabase issues them.** The **access token** lives ten minutes (`jwt_expiry = 600`) and carries the
  permissions the gates read; the **refresh token** lives in the session cookie, rotates on every use, and one used
  twice ends the whole session (reuse detection). The gate refreshes on every request.
- **Taking a role away ends that person's sessions at once**: their refresh tokens are revoked, and the gate, which
  asks the auth server on every request (`getUser()`), closes on their next request, with their access token still
  unexpired.
- **The admin needs a second factor, and the gravest actions ask again** (A12).
- **The studio tables serve two apps.** A row's `kind` says whose it is: `character` and `drawing` are Orbit's
  (`orbit.*`), `action` the motion studio's (`motion.*`). A studio item is read by whoever may save its app's drafts
  (and an action also with `motion.open`); made with `orbit.agent.create`, `orbit.style.upload` or
  `motion.draft.save`; published or restored with `<app>.version.publish`; deleted by the Owner alone. A character's and
  a drawing's published looks are everyone's (Orbit.md C24).

## A7. Management

In the admin, with invitations. The admin's pages, each behind the permission named, and each card on the admin's home
shown only to whoever holds its page's permission:

- **People** (`/people`, `admin.people.view`): every person and agent, their kind, roles, joined and last signed in.
  Give and take roles (`admin.people.assign`), which ends the person's sessions; end sessions and remove
  (`admin.people.remove`). Making and retiring agents and rotating their credentials (`admin.agents.manage`) come with
  A11 step 6.
- **Roles** (`/roles`, `/roles/<id>`, `admin.roles.manage`): every role, who holds it and its permissions, ticked by
  app with each one's sentence; make, rename, delete (A4), move the default. Whoever may see people or send invitations
  reads the roles too, and changes nothing.
- **Ticks save together.** A role's page holds a draft: a box a permission, a changed one tinted, nothing written
  until Save, and then its name, sentence and permissions in one transaction (`noo_save_role`). The row with Save
  repeats on every page the role spills onto. Leaving the page with changes not saved asks first. **A person's roles
  are ticked and then saved the same way**, in the People page's dialog (`noo_set_roles`). A refusal anywhere leaves
  the role or the person as they were.
- **Invitations** (`/invitations`, `admin.invitations.manage`): an address, its roles and how long it lasts — 7, 14 or
  30 days; revoke. Signing up with that address gives those roles instead of the default. Until sign-up opens (A11
  step 5), an unexpired invitation is how an address the allowlist does not hold makes an account.
- **Audit** (`/audit`, `admin.audit.view`): A8, fifty at a time, by the kind of change.

**The login** (Admin.md §8.4) shows a signed-in person the apps they may open: the public ones and every app whose
`<app>.open` they hold. The admin appears only for those who hold `admin.open` — today, him alone. Its account page is
the self rights of A2: password, passkeys, authenticator apps, delete my account.

## A8. The audit log

- **Every change to access, by triggers**, so nothing can change who may do what without a row: a role made, changed
  or deleted; a permission ticked or unticked; a role given or taken; an invitation sent, used or revoked; a delegation
  made or ended; an agent made, rotated or retired; an account removed.
- **Every write an agent makes, and every write made on someone's behalf**, by the server action that makes it.
- **A row**: when; who acted, and their kind; for whom, if anyone; what (a permission or an event); the app; the item;
  the detail, before and after. A removed account's rows keep its name.
- **It is append-only**: no update or delete for anyone, the Owner included, as the studio's versions are frozen. Read
  with `admin.audit.view`. Kept whole for now.

## A9. Single items, later

Room is left, nothing is built. A permission today covers everything of its kind; one day it may cover one item ("may
publish this one agent's look"). The room is `can(permission, item)`, which takes an item already, and an assignment
that can later carry what it is limited to. Nothing else here assumes a permission is global.

## A10. The tables

- **`profiles`** has `kind` (`person` · `agent`); its old `role` goes in A11 step 7.
- **`permissions`**: name, app, sentence — seeded from the catalogue (A3).
- **`roles`**: id, name, sentence, `built_in` (`owner` · `member` · none), `is_default`.
- **`role_permissions`**: a role and a permission.
- **`role_assignments`**: a principal, a role, who gave it and when.
- **`invitations`** and **`invitation_roles`**: an address, its roles, who invited, expiry, when used.
- **`delegations`**: an agent, the person it acts for, the purpose, expiry, when ended. Unused until A11 step 6.
- **`audit_events`**: A8's row.
- **Functions**: `noo_can(permission, item)`, `noo_is_owner()`, `noo_permissions_of()`; the token hook
  `noo_access_token_hook`, which writes `perms` and `kind` into every token and never refuses a sign-in (a failure
  gives a token with no permissions, every gate shut); the trigger that gives a new account its invited roles or the
  default; the admin's `noo_people()`, `noo_give_role`, `noo_take_role`, `noo_set_roles`, `noo_save_role`,
  `noo_end_sessions`, `noo_remove_account` and `noo_set_default_role`, each asking its permission and refusing a
  change that names nobody, acts on the Owner, on oneself or on someone who holds more; `noo_delete_own_account()`
  (A2); and A12's `noo_second_factor()` and `noo_second_factor_within(interval)`.

Every table is behind RLS: the access tables are read and written only with the `admin.*` permission each names, and
a principal reads its own roles and delegations. `npx supabase test db` runs their tests
(`supabase/tests/access*_test.sql`).

## A11. The order it is built in

Each step is a migration and a pull request; each hosted push is his. **On the hosted project a hook change is
`db push` first, then `config push`**: a hook enabled before its function exists refuses every sign-in.

1. **The tables, `noo_can`, the catalogue and the two built-in roles** (A10). Built.
2. **Every rule asks for a permission** (`noo_can`), none for an old role (A6). The 1.0 admin's two buckets, `assets`
   and `publish`, are the Owner's alone until they have a use (Admin.md §8.2). Built.
3. **The token hook, and every gate asks for `<app>.open`**: `authGate`'s `permission` — the admin `admin.open`, the
   motion studio `motion.open`, Home `home.open`; Orbit stays open. A signed-in account without it is sent to the
   sign-in page, which says it cannot open the app and offers a sign-out. Orbit's writes each ask their own permission;
   Home asks `home.open` where the house is read. **The motion studio for an account that may only open it**: it reads
   from the token what the account may do (`motion.draft.save`, `motion.version.publish`); one that may not save is
   *trying* — each action as it is published, each agent as Orbit publishes it, every control its to move, nothing
   saved, Publish and Versions not shown; one that may save but not publish keeps its draft and is told publishing
   needs `motion.version.publish`. Built.
4. **The admin's pages** (A7) and **the second factor** (A12). Built.
5. **The login host, then sign-up.** **Part A is built and deployed**: `apps/auth` on auth.no-origins.com, :3008 — signing in,
   making an account (a password, or an email link or code), a forgotten password, the apps one may open (A7) and the
   account page, with deleting one's own account (A2). **Part B is next**: every gate sends people to the login
   instead of its own `/sign-in` (Admin.md §8.4 has the order). Then the challenge is switched on, and last the
   allowlist's refusal goes and the default role is given to anyone who signs up. Until then only an invited address
   makes an account.
6. **Agents**: their accounts, their credentials in the harness, delegations (A5).
7. **The old goes**: `noo_role`, `profiles.role`, `noo_is`, the allowlist — once nothing reads them.

## A12. The admin's second factor

An `admin.*` permission counts only in a session that has passed a second factor: Supabase's assurance level `aal2`,
or a session signed in with a passkey (`amr` holding `passkey`) — `noo_second_factor()`. Every other permission
counts on one factor: the motion studio, Home and Orbit open as before.

- **Once a sign-in, not once a page.** A sign-in by an email link or code, or by a password, gives one factor.
  Opening the admin then asks for the six-digit code from an authenticator app (TOTP), and the session has two factors
  from then on, through every refresh and in every app (the session is one, Admin.md §8.4), until it ends. A new
  sign-in — another device, a sign-out, a role taken — asks again. A passkey sign-in counts as both factors and opens
  the admin with no code: a passkey is the device and its unlock, and a phishing page cannot replay it.
- **Enrolling.** A session with no authenticator, opening the admin, is sent to add one: the QR code and its key, and a
  code to prove it took. Once one exists, adding or removing a factor needs `aal2` (Supabase's rule), so a stolen
  email link cannot add its own authenticator.
- **Asking again.** The gravest changes need a code — or a passkey — from the last five minutes
  (`noo_second_factor_within(interval)`, read from the token's `amr`), so a session left open is not enough: (1)
  ticking an `admin.*` permission into a role, (2) giving or inviting with a role that holds one, (3) removing someone
  else's account, (4) rotating an agent's credential (step 6, `noo_require_fresh_second_factor`). The guards of the
  tables these write ask it, so no page, function or direct request goes round them. The database refuses with
  `NOAAL`; the admin's page asks for the code — one dialog a page, `useStepUp()` in `admin-pages.tsx`, used by
  `useChange`, the role page's Save and the People dialog — and runs the same change again, the draft kept.
- **Where it is checked**, as every permission is (A6). The gate reads `aal` and `amr` beside `perms` from the token
  `getUser()` has verified (`claims.ts`: `secondFactorPassed`, `needsSecondFactor`): a session that holds the app's
  `admin.*` permission on one factor is sent to `/sign-in?second=1&next=…` — the code, or adding an authenticator —
  never to the no-access card. `shown()` applies the same rule, so no admin button shows on one factor. `noo_can()`
  asks it for every `admin.*` permission, the Owner's included, so every rule and function the admin calls refuses on
  one factor whatever a page does.
- **The admin is people's.** An agent has no phone to read a code from, and a code the harness computed from a stored
  secret would only be a second password. So a role holding an `admin.*` permission is never given to an agent, no
  such permission is ticked into a role an agent holds, and an account holding one never becomes an agent — guards in
  the database, like the Owner's.
- **The screens are the package's**: `@no-origins/auth/second-factor` — `useSecondFactor()`, `AddAuthenticatorDialog`,
  `CodeDialog` and `SecondFactorCard` on the sign-in page's grid — so they move to the login unchanged. The admin's
  Settings and the login's account page list the authenticators beside the passkeys, to add one or remove one (a code
  first when the session has not given one).

**If the phone is lost.** He is the only Owner, so a lost authenticator locks him out of the admin — never out of the
database. The ways back:

- **A second authenticator** enrolled beside the phone: a password manager that keeps codes. Supabase allows ten
  factors.
- **The break-glass, always there.** As the project's owner, from the Supabase CLI: delete his factors
  (`delete from auth.mfa_factors where user_id = …`, through `npx supabase db query --linked`), sign in, enroll again.
  The CLI's own login is the root all of this rests on.
- **Recovery codes**, Supabase's own and experimental, if the hosted Auth server offers them: not built, since the
  local Auth server does not know them.

## Open

- **Recovery codes**: whether the hosted Auth server offers them; added then, if so (A12).
- **How an agent's request names its delegation** to the database: to prove in A11 step 6.
- **Home's role**: the role that opens Home is his to make (A4).
- **A passkey as a second factor proper** (`[auth.mfa.web_authn]`): Supabase offers it; not needed while a passkey
  sign-in counts as both factors.
