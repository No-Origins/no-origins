---
"@no-origins/auth": minor
---

`authGate` takes `open` (Orbit.md C24, his, 2026-10-03: "make the controls in Orbit public, and only when I log in as
an admin should I be able to publish"): every path is everyone's, the gate only refreshes the session, and nobody is
sent to the sign-in — the page asks who is signed in and RLS decides what they may write. Without keys an open app
opens everywhere, production included, since there is nothing to sign in to and nothing a sign-in guards. Orbit runs
with it; the admin and the motion studio are gated as before.
