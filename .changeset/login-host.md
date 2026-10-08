---
"@no-origins/auth": minor
---

The login host's screens (Admin.md §8.4, step 5), for `apps/auth` on auth.no-origins.com. `cards` — `SignInCard`,
`SignUpCard`, `ForgotCard`, `ResetCard`: a password, an email link or code (one mail, either way, for an address with an
account or without), a passkey, making an account, a forgotten password and the new one, none of them saying who has an
account. `challenge` — Cloudflare Turnstile on every form that asks Supabase to send a mail or check a password, inert
until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. `apps` — every app's host, local port and the permission that opens it.
`next` is a full address now (`safeReturn`, replacing the path-only `safeNext`): this site, or an app of No Origins over
`https:` by its exact host, or `http://localhost` on an app's port when the page is local — anything else is the home.
The callback takes the sign-up and recovery links, and a failed link keeps `next`. The gate sends a signed-in person on
from a sign-in page (`entries`) to `next`, never off the code step, the no-access card or a link's last step, and keeps
the query of the address it was asked for. `claims` and `safe-next` are exported.
