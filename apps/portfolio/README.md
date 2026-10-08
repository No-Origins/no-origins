# Portfolio

Hiddenstack's portfolio, at [hiddenstack.no-origins.com](https://hiddenstack.no-origins.com): six pages on the grid, one
agent's section each, turned by the agents. A Next.js 16 app in the No Origins pnpm workspace, built from the design
system `@no-origins/ui`.

```bash
pnpm install                      # from the repo root
pnpm --filter portfolio dev       # http://localhost:3000
```

`CLAUDE.md` beside this file says how it is built; Portfolio.md (`@no-origins/docs`) is what it is meant to be. The
content is in `src/content/`.
