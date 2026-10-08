@AGENTS.md

# apps/auth — the login

`auth.no-origins.com`, :3008. **The one door for every app** (Admin.md §8.4, step 5): signing in, making an account, a
forgotten password, the apps a person may open and their account. Read Admin.md §8.4 and Access.md (A2, A7, A11, A12)
before changing what it does.

```bash
npx supabase start                    # from the repo root; the local stack's keys are in .env.local (see .env.example)
pnpm --filter auth dev                # :3008
```

Local mail lands in **Mailpit at http://127.0.0.1:54324**: the sign-up confirmation, the link and code, the recovery.

## Where step 5 stands

Admin.md §8.4's order, each step leaving sign-in working:

1. **This app is built and deployed** (Vercel project `auth`), its callback and origin in Supabase beside the others'.
2. **Next: the gates send people here**, one app at a time, Home first, each app's own `/sign-in` becoming a redirect
   here. Until then every gated app (the admin, the motion studio, Home) and Orbit still have their own `/sign-in`.
3. Then the admin's Settings move here for good (`/account` is already their copy); then `site_url` becomes this host
   and the old callbacks and passkey origins come out of Supabase; then the gated apps read the server-only key names.
4. **Sign-up opens last**: the challenge is switched on in Supabase once every card sends it, then a migration takes the
   allowlist's refusal away. Until then only an invited (or allowlisted) address makes an account, and the forms still
   answer every address the same.

## The shape

- **The doors** — `/sign-in`, `/sign-up`, `/forgot`, `/reset` — are `@no-origins/auth/cards` (`SignInCard`,
  `SignUpCard`, `ForgotCard`, `ResetCard`), one card each, centred over a decorative `Grid` field (`aria-hidden`,
  `components/card-screen.tsx`): a card over the grid, not boxes on it. Open: the sign-in on the grid — his decision.
  The doors (his, 2026-10-08): **an email and a password, or an email link or code** (one mail with both; it signs in,
  or makes the account), and **a passkey** to sign in. No Google, Apple or GitHub. `/sign-in` is also where a gate
  sends an account that cannot open its app (`?denied=1`), one that owes the admin a code (`?second=1`), and where a
  link from a mail takes its last step (`?token_hash=`, posted back to the callback, Admin.md §8.4).
- **`/`, the apps** (`components/apps.tsx`): every public app and each gated one whose `<app>.open` the token carries,
  the admin only with `admin.open` (A7), a card each, and the account's. A passkey cannot make an account, so this page
  offers one until the account has one. The list of apps is `@no-origins/auth/apps`, which the return address reads
  too.
- **`/account`** (`components/account.tsx`): who you are and the sign-out, the password, passkeys, authenticator apps,
  and **deleting the account** (`noo_delete_own_account()`: a confirming dialog, then a code first when the account has
  an authenticator; never the Owner's).
- **The list pages are on the grid**: `AuthPages` (`components/auth-pages.tsx`), a copy of the admin's `AdminPages`,
  packed by `lib/arrange.ts`, a copy of the admin's packer (Open: the packer, Grid.md — copied, not shared, until it is
  decided). Nothing scrolls: a list longer than the room goes on to the next page. `app/not-found.tsx` is one too.

## What is true here and easy to get wrong

- **`next` is a full address**, read only through `safeReturn` (`@no-origins/auth/safe-next`): this site, or an app of
  No Origins by its exact host over `https:`, or `http://localhost` on an app's port when the page is local. Anything
  else is this site's home. Never navigate to a `next` that did not go through it.
- **No answer says who has an account.** A sign-up, a link or a code asked for, a forgotten password: each is answered
  the same whatever the address. Only a limit reached, a failed challenge or a password too weak is said.
- **The challenge is inert until he switches it on**: with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` unset there is no widget and
  no token. Order (his): the site key here, then the secret and the switch in Supabase.
- **The gate** (`src/proxy.ts`) opens the doors to anyone, sends a signed-in person on from them to `next` (never while
  the page has a step for them: the code, the no-access card, a link's last step), and opens without keys only on a
  development server.

## Reviewing it

In the sweep: `AUTH_ROUTES` in `e2e/review.spec.ts`. With no keys (CI) the doors say there is nothing to sign in to and
`/` shows the public apps; signed in by `e2e/global-setup.ts`, the doors send the browser on to the apps. Gitignored
helpers in `e2e/.mcp/`: `auth-flows.mjs` drives every door through Mailpit with two throwaway invited addresses, made
and deleted (allowlist rows for `auth-flow-a@` and `auth-flow-b@example.test` first); `auth-look.mjs` shoots every
screen at two sizes in both themes; `auth-owner.mjs` signs in as the owner by the code; `auth-nokeys.mjs` shoots a
server started with the two keys empty.
