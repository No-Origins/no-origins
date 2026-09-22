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
- **There is no menu.** The IA is Admin.md §0.5, not §4: the home (`/`) is a grid of feature cards, `/quests`
  is the quests dashboard (cards on the grid), `/quests/[slug]` is the compose dashboard (the real `GridEditor`),
  and account controls live at `/settings`. The old page-mode `Menu`/rail went with the 1.0 system; each route
  renders itself, and the grid *is* the shell.

## What is true here and easy to get wrong

- **The server client uses the anon key, never the service role.** Every table is deny-by-default with no anon
  policy, so RLS decides what a page can see rather than the app remembering to filter. A service-role client
  bypasses RLS entirely; it belongs to the publish pipeline and must never be imported into a page.
- **Middleware is not the security boundary** — RLS is. Middleware decides which screen you land on. A hole
  there shows an empty admin, not someone else's data.
- **`getUser()`, never `getSession()`.** `getSession` reads the cookie and believes it.
- **The sign-in page says the same thing whatever happens.** The allowlist is the membership rule, so a page
  that distinguished "not on the list" from "link sent" would be a membership oracle for anyone with the URL.
