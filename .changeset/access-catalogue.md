---
"@no-origins/auth": minor
---

The permission catalogue (Access.md A3): `@no-origins/auth/permissions` exports `PERMISSIONS` — every permission the
code can check, its app and a sentence — with the `Permission` and `GatedApp` types. The package's typecheck now also
runs `scripts/check-catalogue.mjs`, which replays the migrations' `noo_permission_upsert`/`noo_permission_drop` calls and
fails when the catalogue in code and the one in the database disagree. Nothing reads it yet (Access.md A11, step 1).
