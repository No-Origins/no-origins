# No Origins — Admin

The control surface of No Origins, `admin.no-origins.com`, and the database and the one login behind every app: what
the admin holds, how it is laid out, the rule that keeps public pages static, the Supabase project, and the login at
`auth.no-origins.com` (§8.4). Who may do what is **Access.md**.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

---

## 0. What the admin is

`apps/admin`, Next.js 16, `pnpm --filter admin dev` on :3002, the Vercel project `admin`. It is where he decides who
may do what — people, roles, invitations and the record of every change (Access.md A7) — and where a signed-in person
keeps their own account (Settings, until the login's account page takes it, §8.4).

- **Behind the one login** (§8.4), asking for `admin.open` and a second factor (Access.md A6, A12). Only the Owner holds
  it until he gives it in a role. The admin keeps no login of its own.
- **It changes data, never source.** Every change goes through the database's rules and functions (§8.3); a token is
  never written here (R3).
- **Built only from the design system** (§10).
- **Not in the review sweep**: every route needs a session and a running Supabase, which `pnpm review` does not boot.
  It is reviewed by signing in and looking (`apps/admin/CLAUDE.md`).

## 0.5 The admin is the grid

The admin renders on the same base layout as every app; there is no menu and no shell of its own.

- **Home (`/`)** is a grid of feature cards on `GridPages`, from a layout written in code
  (`components/home-grid.tsx`): People, Roles, Invitations and Audit on the first row, each shown only to whoever holds
  its page's permission (Access.md A7); then Design System (the showcase, marked *soon*), Products (*soon*) and
  Settings.
- **Every other route is `AdminPages`** (`components/admin-pages.tsx`): a way back in the first cell, the page's name
  and its line beside it, then the page's boxes, each with a span per breakpoint, packed on the field by
  `lib/arrange.ts`. **A record is a box** (`RecordBox`): a person, a role, a permission, an invitation, an event, a
  passkey. Nothing scrolls: a list longer than the room goes on to the next page. A refused change shows under the
  page's name.
- **Settings (`/settings`)** is the account: who you are and your roles, the way out, your password, your passkeys and
  your authenticator apps — the self rights of Access.md A2, so no permission is asked for any of it.

## 0.6 The page is static; a component may be live

The rule for every public page, the portfolio's and the showcase's above all:

- **Structure** — which boxes, where, what size, on which page — is written in code or copied in at build, served from
  the edge, never queried at visit. The portfolio and the showcase hold no database key for anything they render: the
  portfolio's agents are a copy of each one's current version in Orbit (`apps/portfolio/src/content/agents.ts`), copied
  again when he publishes.
- **Live content** — what a box shows when that content has a life of its own — is fetched by the component that
  needs it, once it is on screen. The page does not know or care. A component that needs it declares it, and:
  1. fetches with the **anon key**, the one designed to be public — what the public can read is decided by row-level
     security, not by hiding the key;
  2. reads through **a policy on the one table it needs** (§8.3), or a table made for public data, never a blanket
     read;
  3. has **a fallback state** — skeleton, dash, last-known value — designed with it: a live box that shows nothing
     when the fetch fails is a broken box.

  Writes from a public page (a form, a guestbook) go the same way, through an insert policy or a small route handler,
  decided per component.

So the site never goes down with Supabase: the page loads, and a live box shows its fallback. Today the one public
read is Orbit's published looks (Orbit.md C24).

## 0.7 The admin today

Sign-in through the shared gate (§8.4), a home of feature cards (§0.5), and six pages: People, Roles and a role,
Invitations, Audit (Access.md A7) and Settings. Design System and Products are cards marked *soon*. §4 lists the
routes and what each asks for.

## 4. Information architecture

| Route | What | Asks for |
|---|---|---|
| `/` | The home: the feature cards (§0.5) | `admin.open`, at the gate |
| `/people` | Everyone and every agent, their roles; give and take roles, end sessions, remove | `admin.people.view`; `admin.people.assign`, `admin.people.remove` to change |
| `/roles`, `/roles/<id>` | Every role and a role's permissions, ticked and saved together | to read, `admin.roles.manage`, `admin.people.view` or `admin.invitations.manage`; to change, `admin.roles.manage` |
| `/invitations` | An address, its roles and how long it lasts; revoke | `admin.invitations.manage` |
| `/audit` | The record of every change to access, fifty at a time | `admin.audit.view` |
| `/settings` | Your account (§0.5) | nothing beyond opening the admin |
| `/sign-in`, `/auth/callback`, `/auth/sign-out` | The package's sign-in, until the gate sends people to the login (§8.4) | public |

Every `admin.*` permission counts only after a second factor (Access.md A12). A page asked for without its permission
shows a no-access page on the grid, naming the permission.

---

## 6.4 A draft and its versions

The rule for everything the studios save — Orbit's looks and drawings, the motion studio's actions:

- **A draft saves as he goes**, in the database, one per item, so a studio opens where he left off on any device. It is
  written on the `rev` it was loaded at; the database bumps `rev` only when the draft changes, so the write that
  forgets is never the one that clobbers a newer draft. A write on an older `rev` is refused, not merged, and the
  studio offers to load what was saved.
- **Publishing makes a version**, `major.minor` with no name (Orbit.md C19): at a press the latest version's next
  minor, a new major his to make. **A version is immutable**: never changed and never deleted. Going back to one makes
  it the current version (`current_version_id`) without renumbering, and the next is counted from the latest.

## 7. What a version records

- **The whole of what it is**, every value resolved, never "the default": a default changed in code later must never
  change what a published version looks like.
- **The `@no-origins/ui` version it was made with** (`ui_version`, from `NEXT_PUBLIC_UI_VERSION`, which each studio's
  `next.config.ts` reads from the package), because a style drawn in code can change under it.
- **Who published it and when.**

---

## 8. Supabase

One project — Postgres, Auth and Storage — hosted in `ap-south-1` (Mumbai), beside the apps' functions. `supabase/` is
its schema, rules, tests and local config (`supabase/README.md` says how to run it); every hosted push is his. The
apps' clients use the anon key and the person's session; the service role is never imported into an app.

### 8.1 Tables

- **Identity**: `profiles` (one an account: its email, its `kind`, and its old `role` until Access.md A11 step 7) and
  `allowlist`, whose `before_user_created` trigger refuses an address it does not hold unless an unexpired invitation
  names it, until sign-up opens (§8.4).
- **Access**: Access.md A10.
- **The studios**: `studio_items` (kind `character`, `drawing` or `action`), `studio_drafts` (one an item, with its
  `rev`, §6.4) and `studio_versions` (frozen, `major.minor`, §7).

### 8.2 Storage buckets

| Bucket | Access | Holds |
|---|---|---|
| `assets` | private; the Owner alone | The files of Orbit's uploaded drawings, as uploaded (Orbit.md C8) |
| `publish` | public read; the Owner alone writes | Nothing yet |

### 8.3 RLS

**Deny by default on every table.** Every rule asks for a permission — `noo_can()`, Access.md A6 — never a role, so
a client on the anon key sees exactly what the signed-in person's permissions allow. **RLS is the security boundary,
not the gate**: a hole in a gate shows an empty page, not someone else's data. The anon key with no session reads only
what a per-table policy opens for a live component (§0.6): Orbit's published looks.

### 8.4 The one login: auth.no-origins.com

**One sign-in for every app**, "the same auth because it should be same across no origins" (his). Step 5 of
Access.md A11: part A is built and deployed — the login is `apps/auth`; part B, every gate sending people there, is
next. Until then each gated app still signs people in on its own `/sign-in`.

- **The auth is a package**, `packages/auth` (`@no-origins/auth`), consumed from source like `@no-origins/ui`: the
  two clients (`server`, `client`), the gate (`proxy`, `authGate`), the callback and the sign-out (`routes`), the
  passkey check (`webauthn`), the login's cards (`cards`: `SignInCard`, `SignUpCard`, `ForgotCard`, `ResetCard`), the
  login card and the sign-in screen (`login-card`, `sign-in`), the second factor's screens (`second-factor`, Access.md
  A12), the challenge (`challenge`), the list of apps (`apps`) and the return address (`safe-next`).
- **One session.** The session cookie is written for `.no-origins.com` (`sessionCookieOptions`), so signing in on one
  app signs in on all, and signing out of one signs out of all. Locally every app is on `localhost`, where a cookie is
  every port's. The portfolio, the showcase, engineering and status read nothing from it and hold no database key.
- **The login is an app**: `apps/auth` on `auth.no-origins.com`, :3008, deployed from `main` on the Vercel project
  `auth`. Every page is on the grid:
  - `/sign-in`, `/sign-up`, `/forgot`, `/reset` — a card each. `/sign-in` is also where a gate sends an account that
    cannot open its app (`?denied=1`, the no-access card), one that owes the admin a code (`?second=1`), and where a
    link from a mail takes its last step (`?token_hash=`, posted back to the callback).
  - `/` — **the apps one may open** (Access.md A7): every public app and each gated one whose `<app>.open` the token
    carries, the admin only with `admin.open`, a card each, and the account's. It offers a passkey until the account
    has one.
  - `/account` — who you are and the sign-out, the password, passkeys, authenticator apps, and **deleting the
    account**: a confirming dialog, then a fresh code where the account has an authenticator (Access.md A2, A12).
  - `/auth/callback` (both flows: the GET that carries a token hash and the POST that spends it) and `/auth/sign-out`.
- **The doors** (his, 2026-10-08): **an email and a password**, or **an email link or a six-digit code** (one mail
  with both: the link for this device, the code for another; it signs in, or makes the account), and **a passkey** to
  sign in. No Google, Apple or GitHub. A password is at least eight characters; a sign-up with one sends one mail to
  confirm the address. A forgotten password is a mail with a link to `/reset`; an account with an authenticator gives
  its code before the new password is taken. A passkey cannot make an account — Supabase registers one only for an
  account that exists — so it is offered straight after a first sign-in; it needs `[auth.passkey]` on the server
  (`rp_id` `no-origins.com`) and `experimental: { passkey: true }` on the browser client.
- **No answer says who has an account.** A sign-up, a link or a code asked for, a forgotten password: each is answered
  the same whatever the address, and a sign-in says "invalid credentials" for a wrong password and for no account
  alike. Only a limit reached, a failed challenge or a password too weak is said.
- **The return address.** `next` is a full address, read only through `safeReturn`: this site, or an app of No
  Origins by its exact host (`apps.ts`) over `https:` with no port, user or password, or `http://localhost` on an app's
  port when the page is local. Anything else is the login's home. The callback and the cards, which navigate after a
  password or a passkey, both read it.
- **The gate** (`authGate`, called from each app's `proxy.ts` — Next 16's name for middleware): `getUser()`, never
  `getSession()`, so it believes the auth server and not the cookie; it refreshes the session on every request, which a
  Server Component cannot; and it asks for the app's permission (Access.md A6) and, for an `admin.*` one, a second
  factor (A12). **An open app** (`open`, Orbit) makes every path everyone's: the gate only refreshes the session and
  sends nobody to sign in. **Without keys** the gate refuses in production, a 503 naming the missing values — a deploy
  that lost its keys is a closed door. On a development server an app may open without them (`openWithoutKeys`: the
  motion studio, Home and the login), so CI's review sees it; the admin does not, since every route reads the database.
  An open app opens anywhere without keys: there is nothing to sign in to.
- **Membership.** A new account gets the default role, Member, or its invitation's roles (Access.md A4, A7). Until
  sign-up opens, the allowlist's trigger refuses every address that is neither on it nor invited.
- **The challenge**: Cloudflare Turnstile on every form that asks Supabase to send a mail or check a password
  (`challenge.tsx`), shown only when Cloudflare wants a person to act. Inert while `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is
  unset. **His to make**: a Turnstile site for `auth.no-origins.com` and `localhost`; its site key in the login's
  environment, then its secret and the switch in Supabase — in that order, so no sign-in is refused for a token nobody
  sent.
- **Mail goes through Resend** (`smtp.resend.com`, from agents@no-origins.com as "No Origins"), on its free plan for
  the launch (his): Supabase sends at most 30 an hour, Resend 100 a day and 3,000 a month, pausing at the cap. A
  sign-up is one mail and so is every link sign-in; a password, a passkey or a code sends none. Move up a plan when a
  week's sign-ups near the cap.
- **What is kept**, in one line on the sign-up card (his wording): *"We keep your email address and when you sign in,
  so you can sign in again. Delete your account any time from your account page."*

**Part B, in order, each step leaving sign-in working:**

1. **The gates point at the login**, one app at a time, Home first: a request with no session goes to
   `https://auth.no-origins.com/sign-in?next=<the address it asked for>`. Each app's `/sign-in` stays a redirect to the
   login for a while, for bookmarks and for links already in an inbox. Orbit, open, sends nobody; its "Sign in" goes
   there too. A sign-out anywhere is the login's. In the end every gated app keeps only its `proxy.ts` and its
   server's own check (Home's `signedIn()`); its `/sign-in` page and `/auth` routes go.
2. **The account leaves the admin**: Settings' password, passkeys and authenticators live on the login's account page.
3. **Supabase knows one address**, once his passkey is checked on his own devices on the login: `site_url` becomes
   `https://auth.no-origins.com`; the redirect list holds the login's callback alone, so a new gated app needs no
   `config push`; passkeys stay bound to `no-origins.com` and the origins allowed to use them shrink to the login's;
   the magic-link template follows `site_url`.
4. **The gated apps' browsers hold no Supabase values.** Their gates read `SUPABASE_URL` and `SUPABASE_ANON_KEY` on the
   server (`supabaseEnv()` reading those first and the public names after, for the move); only the login ships them to
   a browser. Tidiness, not a fix: the anon key is public by design (§8.3).

Then the challenge is switched on, and last the allowlist's refusal goes and sign-up opens to everyone (Access.md A11
step 5).

---

## 10. The design system grows; the admin does not fork it

Every visible element in the admin, as in every app, is composed from `@no-origins/ui`. An app may compose system
components into an island of its own — the admin's `AdminPages`, `RecordBox`, `ColumnNames` — but never invents a
primitive: **an admin-only component is a fork of the design system wearing a different folder name.** A component the
admin needs and the system lacks is added to the system with the shadcn CLI, or proposed to him before it is written
(the repo-root CLAUDE.md, "Build UI only from the design system").

---

## 12. Rules

### R3 · The package is the source of truth for tokens

A token changes by a code edit in `packages/ui` (globals.css), a changeset and a deploy. No app and no table holds a
token's value: the studios hand back the lines to commit (Motion.md M7), and the admin shows the system only through
the showcase, which writes nothing.
