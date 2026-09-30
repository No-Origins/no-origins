---
"@no-origins/auth": minor
---

Add `@no-origins/auth` (Admin.md §8.4, amended 2026-09-30): the one sign-in for every no-origins app — the Supabase
server and browser clients, `authGate` for each app's `proxy.ts` (it refuses without keys in production, and opens on
a development server only for an app that asks), `authCallback` and `signOut` for the `/auth` routes, `useWebAuthn`,
the `LoginCard` named by its app and the `SignInScreen`. The session cookie is written for `.no-origins.com`, so one
sign-in covers the admin and the motion studio. Moved out of the admin, which now imports it.

On a development server with no keys, the login card says there is nothing to sign in to and links into the app,
instead of showing a form that can't send. A magic link that can't reach the server says so and can be sent again,
instead of staying on "Sending…".
