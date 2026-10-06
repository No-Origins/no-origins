---
"@no-origins/auth": minor
---

An app's gate asks for a permission (Access.md A6, A11 step 3). `authGate` takes `permission` — an app's `<app>.open` —
and reads it from the `perms` claim the database writes into every token (`noo_access_token_hook`), from the token
`getUser()` has just had verified, asking `noo_can()` live for a token without the claim. A signed-in account without it
is sent to `/sign-in?denied=1`, where the login card says it cannot open the app and offers a sign-out (`DeniedCard`).
`can(permission, item?)` in `@no-origins/auth/server` asks the database the same question for server code.
