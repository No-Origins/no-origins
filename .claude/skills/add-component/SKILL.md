---
name: add-component
description: Add, re-pull or propose a component for the no-origins design system (`@no-origins/ui`, shadcn radix-sera) and bring it to the house rules — one radius, fields as pills, motion by token, the portal container — then give it a showcase specimen, fix the component counts, write the changeset and look at it. Use this whenever someone wants a new UI primitive in packages/ui, is about to run `shadcn add` for anything, wants to update, re-sync or overwrite an installed shadcn component from upstream, asks for a component from another registry (magicui, originui, a URL, a GitHub source), or asks for a UI element in any app that the design system does not have yet — even when they only say "I need a rating widget on the portfolio" or "can we get a date range picker".
---

# Add a component to `@no-origins/ui`

The design system is shadcn/ui copies that were edited on purpose. The CLI writes shadcn's radix-sera defaults and
knows nothing of those edits, so every add or re-pull is two jobs: get the file in through the CLI, then put back
what the house has decided. This skill is the procedure for the second job and for what follows it — the showcase,
the counts, the changeset, the look.

`packages/ui/CLAUDE.md` is where the rules live; read it if you have not this session. This skill does not replace
it, it is the order to do things in and the places people forget.

## 0. The tree is shared

Codex and other Claude sessions edit this working tree at the same time. Before editing any file, run
`git status --short <file>`: if it already has uncommitted changes you did not make, edit only your own lines and say
so in the report. Never `git checkout`, `git restore` or `git stash` a file you did not change. Do not commit unless
asked.

## 1. Which case is it?

Find out before anything is written:

```bash
cd packages/ui
ls src/components/<name>.tsx                  # installed already?
npx shadcn@latest search @shadcn -q <name>    # in the registry?
npx shadcn@latest add <name> --dry-run        # what it would write, and what it would overwrite
npx shadcn@latest add <name> --view           # the files themselves ("No files" = this style has none)
```

| Case | What to do |
|---|---|
| **A.** In `@shadcn`, not installed | Add it — §2, then §3 onwards |
| **B.** Installed; upstream has changes they want | Re-pull — §2b, then §3 onwards |
| **C.** In another registry (`@magicui`, `@originui`, a URL, a GitHub source) | Stop and propose — §1a. Only `@shadcn` goes straight in |
| **D.** In no registry, or `--view` says "No files" for radix-sera | Stop and propose — §1a. Never write one by hand |
| **E.** A block (`login-01`, `dashboard-01`, `sidebar-07`, …) | A block is a composition, not a component, and does not go in `packages/ui`. Say so, and propose composing it in the app from system components, as an island of that app |

Almost every `@shadcn` ui item is installed already, so A is rare and B, C and D are the usual cases. Before
proposing anything new, ask whether the thing can be **composed** from what exists — a stat tile is a `Card` and two
`Text`s, a tag input is the `Combobox`'s chips, a date range picker is `Popover` + `Calendar` in range mode. When it
can, that is usually the better answer; offer it first.

### 1a. Stop and propose

The repo-root `CLAUDE.md`'s first design-system rule: when the system lacks a component, add it with the CLI or stop
and ask — he asks for the exception, or you propose it and he approves it before it is written. A proposal is one
short message, and it ends your turn:

- what was asked for, and where it would be used
- where it could come from: the registry item, with what `--view` shows it would install (npm dependencies, files,
  installed components it would overwrite); or a composition of existing components; or "nowhere — it would be
  written, which is the exception CLAUDE.md asks you to get approved"
- the house edits it would need — save the `--view` output to a scratch file and run §3's checker on it
- any design decision it forces that is not made yet — a motion that fits no family, a new token, a new variant —
  named as open, not decided with a guess
- your recommendation, and why

Then wait. Do not write the component "to show what it would look like", do not install it on a branch "to try", and
do not put a stand-in in the app. An unapproved component in the tree is the thing the rule exists to prevent.

When the request already carries the yes — *"I'm fine with it coming from magicui, add their marquee"* — that is the
approval for that one item: go on to §2. It does not stretch to the other registry items the one you add pulls in;
those get named, and wait.

## 2. Add it (case A)

```bash
cd packages/ui && npx shadcn@latest add <name> --dry-run    # read every line: anything marked (overwrite)?
cd packages/ui && npx shadcn@latest add <name>
```

An item often depends on components that are installed already (a menu on `button`, a picker on `popover`). The CLI
asks before overwriting those: **answer no**. Never pass `--overwrite`, or `--yes` to an add whose dry run lists an
installed file — it would silently throw away the house edits in that file. If an overwrite truly cannot be avoided,
treat each overwritten file as case B.

Then look at everything it touched — `git status --short && git diff --stat`:

- `src/components/<name>.tsx` — expected.
- `package.json` and a new dependency — fine. Run `pnpm install` from the repo root afterwards so `pnpm-lock.yaml`
  matches: CI and Vercel install with `--frozen-lockfile` and fail on a stale lock.
- `src/styles/globals.css` — **the one stylesheet, and it holds decided values**: the lime and violet accents,
  `--radius`, every `--motion-*` token. If the CLI rewrote an existing token or block, revert that hunk. A token that
  is new and that the component needs may stay, but name it in the report.
- Anything else (a hook, a lib file) — a `.ts` of pure logic belongs in `src/lib/`, a hook in `src/hooks/`; a `.ts`
  in `src/components/` is unreachable from the apps (rule 5).

## 2b. Re-pull an installed component (case B)

```bash
cd packages/ui && npx shadcn@latest add <name> --diff
```

Every `-` line is either something upstream changed or a house edit that the overwrite would lose. Before
overwriting, list the house edits from the diff — the `// Diverged from sera …` comment, the `usePortalContainer()`
container and its `// Motion.md M8` comment, `rounded-lg` where sera has `rounded-none`, the `motion-*` token
classes where sera has `duration-100` / `zoom-in-95` / `slide-in-from-top-2`, and a field's pill classes where sera
has the underline. Then:

```bash
cd packages/ui && npx shadcn@latest add <name> --overwrite   # that one component only
```

re-apply every house edit, and check with `git diff src/components/<name>.tsx`: what is left should be upstream's
change and nothing else. Where upstream changed a line a house edit also touches, keep the house edit and say so.
Watch the dry run for dependent files the overwrite drags in too; restore any you did not mean to take
(`git checkout -- <that file>` is safe here only because you just changed it yourself — check `git status` first).

## 3. The house edits

Every file the CLI writes arrives square, with underline fields, literal motion, and portals to the body. Run the
checker on each file it wrote or overwrote:

```bash
.claude/skills/add-component/scripts/house-check.sh packages/ui/src/components/<name>.tsx
```

It prints every line that may break a house rule, tagged with the rule. Each hit is a judgment, not an auto-fix:
read **`references/house-edits.md`** for each rule's before → after, its exceptions and a real example from this
repo. In short:

1. **Radius** — every box `rounded-lg`, one radius only; lines stay straight (Grid.md D39).
2. **Fields are outlined pills**, never sera's underline (Grid.md D39).
3. **Motion by token**, in its family — never `duration-*`, `zoom-in-95`, `slide-in-from-*-2` (Motion.md M3, M4).
4. **Portals** go through `usePortalContainer()` (Motion.md M8).
5. **No glass, no gradients** — no blur, frost or translucent surface, no sweep.
6. **Colour** — `text-primary` is not text on the light theme; tints are mixed tokens.
7. **Blending is isolated** — a `mix-blend-*` needs `isolate` on the component's root.
8. **Every divergence gets a comment** saying why (rule 6) — except the radius, which is in nearly every file.

Do not treat installed components as proof that something is allowed. A few still carry leftovers the checker flags
— literal durations in `navigation-menu`, `sidebar`, `item`, `message-scroller` and `input-otp`, and the underline on
`ButtonGroupText`. They are debt, not precedent: mention them if you meet them, do not fix them unasked.

A motion that fits none of the families in Motion.md M4 is a design decision, not a token you invent. Leave shadcn's
value in place with a `// TODO(Motion.md M4): no family yet` comment, and name it in the report as open. A new
component joins a family rather than getting numbers of its own (M4).

## 4. The showcase

Every component gets a specimen at design.no-origins.com, or is named in the footnote of the ones that have none.

- **Atom or molecule.** An atom is indivisible (Button, Input, Badge, Switch): `apps/design/src/content/atoms.tsx`.
  A molecule composes atoms (Dialog, Select, Card): `molecules.tsx`. Put it in alphabetical order among its
  neighbours.
- **Copy a neighbour's shape.** An item is `{ id, span, render }`. Atoms span with `half(rows)`, `quarter(rows)` or
  `band(rows)`; molecules with `CARD(rows)`. The render is `<Specimen name="…" note="…">` — one sentence of note,
  saying what it is for — around the component in a realistic state, importing it by its own path
  (`@no-origins/ui/components/<name>`, never a barrel). Text in the specimen is a `Text`.
- **A box clips, it never scrolls.** A specimen that is cut off has too few rows: grow the span, do not shrink the
  content.
- **Cannot be shown** — needs live data or a route of its own? Add it to the `not-shown` footnote at the end of
  `molecules.tsx` and to the list in `apps/design/CLAUDE.md`.

## 5. The counts

How many components there are is written in several places. Run:

```bash
python3 .claude/skills/add-component/scripts/counts.py
```

It prints the real numbers (components in the package, specimens on each page, names in the footnote) and every line
in the docs and the showcase that states one, digits or words. Make each one true. A new house component — one not
from the CLI — goes in the script's `OURS` set, or it is counted as a shadcn component. If the component moves, add
it to its family's row in Motion.md M4's table, which is the one place that says what each family moves.

## 6. Check it

```bash
pnpm --filter @no-origins/ui typecheck
pnpm --filter design typecheck && pnpm --filter design lint
pnpm review review.spec.ts -g "design /molecules"   # or "design /atoms" — boots the showcase on :3001 if it is not running
```

Then open the specimen's screenshots with Read — `e2e/screenshots/{desktop,desktop-dark,mobile,mobile-dark}/design__molecules.png`
— and look at it in both themes and both sizes. The sweep only shoots **page 1** of each route, and a specimen in the
middle of the alphabet is usually on a later page:

- if `e2e/.mcp/showcase-clip.mjs` exists (it is gitignored, so not on a fresh clone or in a worktree), run
  `node e2e/.mcp/showcase-clip.mjs <scratch dir>`: it turns every page at five sizes, writes a PNG a page and lists
  every clipped box;
- otherwise drive the page with the `playwright` MCP (`pnpm --filter design dev` first, http://localhost:3001),
  turning with the ↓ key until the specimen is on the field, and screenshot it.

A surface (dialog, popover, menu) is only seen open: open it through the MCP and screenshot it in both themes. Say
in the report exactly what you looked at, and what you did not.

## 7. The changeset

One file, `.changeset/<name>.md`, in the voice of the others there — plain prose, one paragraph, rules cited by
bare filename:

```md
---
"@no-origins/ui": minor
---

`<Name>` joins the design system from shadcn (radix-sera): <what it is for>. It takes the house edits — <the
ones it took, e.g. rounded to the cell's circle (Grid.md D39), its field an outlined pill, the surface family's
tokens (Motion.md M4), portalled through `usePortalContainer` (M8)>.
```

`minor` for a new component; `patch` for a re-pull that changes nothing a consumer would see. Do not run
`pnpm version-packages`.

## 8. The report

End with a short report for Bhargav:

- what was added or re-pulled, and from where
- the house edits it took, one line each
- anything the checker flagged that you kept on purpose, and why
- decisions it raised and left open (a motion with no family, a new token, a dependency the CLI brought)
- what you looked at — which screenshots, which pages, which surfaces opened — and what is not verified
- files outside your change that had someone else's uncommitted edits

Nothing is committed unless that was asked for.
