@AGENTS.md

# apps/admin — the control surface

`admin.no-origins.com`, :3002. Who may do what (Access.md) and the signed-in person's account. **Admin.md** and
**Access.md** are its documents; read them before changing behaviour here. The design system is `@no-origins/ui` and
every visual decision belongs there, not here: an admin-only component is a fork of the design system wearing a
different folder name (Admin.md).

## Running it

It needs Supabase and a row in the allowlist, or nobody can sign in — including you.

```bash
npx supabase start                       # from the repo root; Docker (OrbStack) must be running
pnpm --filter admin dev                  # :3002
```

Then, once, in Studio at http://127.0.0.1:54323 (supabase/README.md):

```sql
insert into public.allowlist (email, role) values ('you@example.com', 'owner');
```

Local mail goes to **Mailpit at http://127.0.0.1:54324** — magic links and codes land there, not in a real inbox.
`.env.local` holds the local URL and anon key; `.env.example` says where the hosted ones come from.

## The shape

**Every route is on the grid.** No route renders a page that scrolls, a centred column or a frame of its own; a
"version 1" or a screen "his to design" is still on the grid — what is his to design is what sits on it.

- **The home** (`/`, Admin.md §0.5) is `GridPages` with a layout written in code (`components/home-grid.tsx`): a card
  a feature — People, Roles, Invitations and Audit on the first row (Access.md A7), each shown only to whoever holds
  its page's permission, then Design System (a link to the showcase), Products (marked *soon*) and Settings. There
  is no menu: each route renders itself and the grid is the shell.
- **Every other route** is `AdminPages` (`components/admin-pages.tsx`): a way back in the first cell (a circle), the
  page's name and its line beside it, then the page's boxes — each an `AdminItem` with a span per breakpoint and a
  render function — packed on the field the page is on by `lib/arrange.ts`, a copy of the showcase's packer for lists
  (Open: the packer, Grid.md — when it is decided, the copies become one). The way back, the name and a list's column
  names are `repeat`: on every page a long list spills onto. A route's server page checks its permissions and loads
  its data, then hands plain data to a client view (`components/people.tsx`, `roles.tsx`, `invitations.tsx`,
  `audit.tsx`, `settings.tsx`) that builds the items.
- **The access pages** — `/people`, `/roles`, `/roles/<id>`, `/invitations`, `/audit` — read through `src/lib/access.ts`
  and change through `src/app/access/actions.ts`; each asks its permission, and the database's rules and guards are the
  lock. A page whose permission the person lacks is `NoAccessPage`. `/settings` is the account: password, passkeys and
  authenticator apps. `app/not-found.tsx` is an `AdminPages` too.
- **A record is a box.** A person, a role, a permission, an invitation, an event, a passkey: one `RecordBox` each, a
  pill one cell tall from eight columns up (its parts in columns by a container-query template its `ColumnNames`
  shares), stacked and taller on six. Spans come from `band(rows, narrow, phone)` and `wideOnly()`. Nothing in a box
  scrolls; a box that clips is a span that is too small.
- **A refused change shows under the page's name** (`useChange` in `components/outcome.tsx`), which grows a row.
- **The sign-in** (`/sign-in`) is `@no-origins/auth`'s `SignInScreen`: the login card centred over a decorative `Grid`
  field (`aria-hidden`) — a card over the grid, not boxes on it. Open: the sign-in on the grid — his decision.

## What is true here and easy to get wrong

- **The gate asks for `admin.open`** (Access.md A6), not just a session: an account without it is sent to the sign-in
  page's no-access card (`?denied=1`). The Owner holds it; anyone else only through a role he gives.
- **The admin needs a second factor** (Access.md A12): every `admin.*` permission — `admin.open` included, so the whole
  admin — counts only after an authenticator app's code (`aal2`) or a passkey sign-in, in the gate, `shown()` and
  `noo_can()` alike. A one-factor session is sent to `/sign-in?second=1`: the code, or adding an authenticator when it
  has none. The screens are `@no-origins/auth/second-factor`'s (`SecondFactorCard`, `AddAuthenticatorDialog`,
  `CodeDialog`). Locally too: an account with no authenticator adds one at its first admin visit.
- **The gravest changes ask again** (A12): ticking an admin permission into a role, giving or inviting with a role that
  holds one, and removing an account need a code from the last five minutes. The database refuses with `NOAAL`; a
  change answered `secondFactor` (`Done` in `app/access/actions.ts`) opens the page's one code dialog (`useStepUp()`)
  and runs again. `useChange` does it for every change; a change written outside it must ask `useStepUp()` itself, as
  the role page's Save and the People dialog do.
- **Ticks save together** (Access.md A7): a role's page and the People page's roles dialog hold a draft until Save,
  which sends the whole set in one transaction — `noo_save_role` (name, sentence, permissions) and `noo_set_roles` (a
  person's roles). The role page asks before it is left with changes not saved. Never a write per tick.
- **The server client uses the anon key, never the service role.** Every table is deny-by-default under RLS, so RLS
  decides what a page can see rather than the app remembering to filter. A service-role client bypasses RLS entirely
  and must never be imported into a page.
- **The gate (`src/proxy.ts`) is not the security boundary** — RLS is. The gate decides which screen you land on; a
  hole there shows an empty admin, not someone else's data.
- **`getUser()`, never `getSession()`, to learn who is signed in.** `getSession` reads the cookie and believes it. The
  one reader of the session past the gate is `shown()` (`@no-origins/auth/server`, through `mayAll` in
  `src/lib/access.ts`): it decodes the token the gate's `getUser()` verified on the same request, for which page and
  button to show and nothing else (Access.md A6). An action asks `can()`; the database's rules decide.
- **The sign-in page says the same thing whatever happens.** A page that told "not on the list" from "link sent"
  would be a membership oracle for anyone with the URL.
- **The login app is `apps/auth`** (Admin.md §8.4): the admin keeps its own `/sign-in` and `/settings` until its gate
  sends people to `auth.no-origins.com`.

## Reviewing it

`pnpm review` does **not** cover these routes: every one is behind auth and needs a running Supabase, which the sweep
does not boot. Review the admin by signing in and looking.

- The circular **N** at the bottom-left is Next's dev-tools button. Dev only; it is not a layout bug.
- Gitignored helpers in `e2e/.mcp/`: `admin-grid-look.mjs <outdir>` signs in by magic link through Mailpit and shoots
  every route at four sizes, turning each through its pages, and prints any page that scrolls and any box whose content
  is cut; `admin-grid-interact.mjs <outdir>` drives a refusal, a role's permissions and an invitation made and revoked.
  **As written, both stop at the second-factor step** (`/sign-in?second=1`, adding an authenticator or its code): they
  sign in by magic link alone and enter no code, and the admin asks for one. `second-factor-gate-check.mjs` shows how to
  compute an authenticator's codes from its key, on throwaway accounts; `step-up-check.mjs` drives the gravest changes
  and waits the five minutes out.
