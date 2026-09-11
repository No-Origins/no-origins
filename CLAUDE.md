# no-origins

pnpm workspace. Apps live in `apps/*` (currently `portfolio`, Next.js 16); the shared design system is `packages/ui` (`@no-origins/ui`, consumed from source). Each app has its own CLAUDE.md / AGENTS.md; read them before editing app code.

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots the portfolio dev server on :3000 (or reuses a running one), visits every route in `ROUTES` in `e2e/review.spec.ts` on desktop (1440x900) and mobile (Pixel 7), fails on uncaught page errors, echoes `console.error` output, and writes full-page screenshots to `e2e/screenshots/<desktop|mobile>/<route>.png`.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow the sweep with `pnpm review --project=desktop` or `pnpm review -g "/about"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in `.mcp.json`. It drives headless Chromium; start `pnpm dev` first and point it at http://localhost:3000. Its screenshots land in `e2e/.mcp/`.

Add new routes to `ROUTES` when you add pages. Screenshots, traces, and reports are gitignored.
