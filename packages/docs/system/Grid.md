# No Origins — The Grid

**This file is a pointer.** The grid document is versioned; cite `Grid.md` as before and read the version this points at.

| | Document | Status |
|---|---|---|
| **Current** | **Grid-v2.md** | Opened 2026-09-21. The cell is decided, the counts derive (D12–D15) and are always even (D26). The field is fully decided; authoring is deferred (§7). The code is on it. |
| Previous | **Grid-v1.md** | 2026-09-18 → 2026-09-21. The field per breakpoint, D1–D11, and the table that was never filled. Summary in front of its full text. |

**How a citation resolves.** Rule numbers run in one sequence across versions — D1–D11 are v1, D12 onward are v2 — so
`Grid.md D7` is v1's D7 wherever it is written, and v2 §2 says what became of it. Section numbers (`§3`, `§4`) belong to
whichever version is current unless the citation predates that version; everything in source comments today was
written against v1.

**The code.** `packages/ui/src/components/grid*.tsx` is on **v2** since 2026-09-21. Where the code and v2 disagree,
fix the one that is behind and say so in v2.

When the direction changes again: summarise the current version in front of its own text, name it `Grid-vN.md`, open
`Grid-v(N+1).md`, and repoint this file. Nothing else in the repo needs to move.
