@AGENTS.md

# apps/admin — the control surface

`admin.no-origins.com`. Everything it does is specified in the repo-root **Admin.md**; read that before
changing behaviour here. The design system is `@no-origins/ui` and every visual decision belongs there, not
here — Admin.md §10: "an admin-only component is a fork of the design system wearing a different folder name."

## Running it

It needs Supabase and it needs a row in the allowlist, or nobody can sign in — including you.

```bash
npx supabase start                       # from the repo root; Docker (OrbStack) must be running
pnpm --filter admin dev                  # :3002 (portfolio :3000, showcase :3001)
```

Then, once, in Studio at http://127.0.0.1:54323:

```sql
insert into public.allowlist (email, role) values ('you@example.com', 'owner');
```

Local email goes to **Mailpit at http://127.0.0.1:54324** — magic links land there, not in a real inbox.
`.env.local` holds the local URL and anon key; `.env.example` says where the hosted ones come from.

## Reviewing it

`pnpm review` at the repo root does **not** cover these routes: every one of them is behind auth and needs a
running Supabase, which the sweep does not boot. Review the admin by signing in and looking, the same way the
rest of the platform is reviewed — a passing typecheck has never caught a visual problem here or anywhere else.

Two things to know when you do:

- The circular **N** at the bottom-left is Next's dev-tools button. Dev only; it is not a layout bug.
- **There is no menu.** The IA is Admin.md §0.5, not §4: the home (`/`) is a grid of feature cards rendered with
  `GridPages` — since 2026-10-06 People, Roles, Invitations and Audit on its first row (Access.md A7), each shown only
  to whoever holds its page's permission, then Design System, Products and Settings — and account controls live at
  `/settings`. The access pages (`/people`, `/roles`, `/roles/<id>`, `/invitations`, `/audit`) read through
  `src/lib/access.ts` and change through `src/app/access/actions.ts`; each asks its permission, and the database's
  rules and guards are the lock. They are version 1, on the grid since 2026-10-07 (below). **Quests are gone**
  (Admin.md §0.7, 2026-09-23): `/quests`, the compose dashboard and the `quests` table, which
  `supabase/migrations/…_drop_quests.sql` drops. The old page-mode `Menu`/rail went with the 1.0 system; each route
  renders itself, and the grid *is* the shell.

## Every page is on the grid

**No route renders a page that scrolls, a centred column, or any frame of its own — the grid is the base layout of
every app, this one included** (his, 2026-10-07, when the access pages and Settings were found off it: "I really made
it very clear from the beginning that the grid is the base layout for the whole application"). A "version 1" or a
screen "his to design" is still on the grid; what is his to design is what sits on it.

- **The home** is `GridPages` with a layout written in code (`components/home-grid.tsx`).
- **Every other route** is `AdminPages` (`components/admin-pages.tsx`): a way back in the first cell (a circle), the
  page's name and its line beside it, then the page's boxes — each an `AdminItem` with a span per breakpoint and a
  render function — packed on the field the page is on by `lib/arrange.ts`, the showcase's packer for lists. The way
  back, the name and a list's column names are `repeat`: on every page a long list spills onto. A route's server
  page checks its permissions and loads its data, then hands plain data to a client view (`components/people.tsx`,
  `roles.tsx`, `invitations.tsx`, `audit.tsx`, `settings.tsx`) that builds the items. `NoAccessPage` and
  `app/not-found.tsx` are on it too; the sign-in screen is `@no-origins/auth`'s, on its own grid.
- **A record is a box.** A person, a role, a permission, an invitation, an event, a passkey: one `RecordBox` each, a
  pill one cell tall from eight columns up (its parts in columns by a container-query template its `ColumnNames`
  shares), stacked and taller on six. Spans come from `band(rows, narrow, phone)` and `wideOnly()`. Nothing in a box
  scrolls; a box that clips is a span that is too small.
- **A refused change shows under the page's name** (`useChange` in `components/outcome.tsx`), which grows a row.
- `node e2e/.mcp/admin-grid-look.mjs <outdir>` (gitignored) signs in through Mailpit and shoots every route at five
  sizes, turning each through its pages, and prints any route off the grid, any page that scrolls and any box whose
  content is cut. `admin-grid-interact.mjs` drives a refusal, a role's permissions and an invitation made and revoked.

## What is true here and easy to get wrong

- **The gate asks for `admin.open`** (Access.md A6), not just a session: an account without it lands on the sign-in
  page's no-access card. Only the Owner holds it until he gives it in a role.

- **The server client uses the anon key, never the service role.** Every table is deny-by-default with no anon
  policy, so RLS decides what a page can see rather than the app remembering to filter. A service-role client
  bypasses RLS entirely; it belongs to the publish pipeline and must never be imported into a page.
- **Middleware is not the security boundary** — RLS is. Middleware decides which screen you land on. A hole
  there shows an empty admin, not someone else's data.
- **`getUser()`, never `getSession()`, to learn who is signed in.** `getSession` reads the cookie and believes it. The
  one reader of the session past the gate is `shown()` (`@no-origins/auth/server`, through `mayAll` in
  `src/lib/access.ts`): it decodes the token the gate's `getUser()` verified on the same request, for which page and
  button to show and nothing else (Access.md A6). An action asks `can()`; the database's rules decide.
- **Ticks save together** (Access.md A7, 2026-10-07, his): a role's page and the People page's roles dialog hold a
  draft until Save, which sends the whole set in one transaction — `noo_save_role` (name, sentence, permissions) and
  `noo_set_roles` (a person's roles). The role page asks before it is left with changes not saved. Do not bring back a
  write per tick.
- **Authenticator apps are the package's** (Access.md A12, step 1, 2026-10-08): Settings shows them through
  `@no-origins/auth/second-factor` (`useSecondFactor`, `AddAuthenticatorDialog`, `CodeDialog`), so they move to the auth
  app unchanged. Nothing asks for the code yet; step 3 makes `admin.*` need `aal2` or a passkey sign-in.
- **The sign-in page says the same thing whatever happens.** The allowlist is the membership rule, so a page
  that distinguished "not on the list" from "link sent" would be a membership oracle for anyone with the URL.
