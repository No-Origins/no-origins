# Changesets

Versions `@no-origins/ui` and writes its `CHANGELOG.md`. After a change to the package, run `pnpm changeset` to
describe it, then `pnpm version-packages` to apply the bump. Nothing is published: every package is private and the
apps consume the design system from source. The apps and the docs are ignored (`config.json`).
