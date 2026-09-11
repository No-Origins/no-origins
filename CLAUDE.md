# no-origins

pnpm workspace. Apps live in `apps/*` — `portfolio` (bhargav.no-origins.com, :3000), `design` (design.no-origins.com, the showcase, :3001) and `admin` (admin.no-origins.com, the control surface, :3002), all Next.js 16; the shared design system is `packages/ui` (`@no-origins/ui`, consumed from source). Each app has its own CLAUDE.md / AGENTS.md; read them before editing app code.

`supabase/` is the admin's database — schema, RLS, the allowlist gate and both buckets. `supabase/README.md` says how to run it and what has been verified. The portfolio and the showcase have no database anywhere near them and that is deliberate: the live site renders static output, never a query.

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots both dev servers (portfolio :3000, design :3001) or reuses running ones, visits every route in `ROUTES` and `DESIGN_ROUTES` in `e2e/review.spec.ts` on desktop (1440x900) and mobile (Pixel 7) in both themes, fails on uncaught page errors and on `probe12` (exactly one loud cell per widget), echoes `console.error` output, and writes full-page screenshots to `e2e/screenshots/<project>/<route>.png`.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow the sweep with `pnpm review --project=desktop` or `pnpm review -g "/about"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in `.mcp.json`. It drives headless Chromium; start `pnpm dev` first and point it at http://localhost:3000. Its screenshots land in `e2e/.mcp/`.

Add new routes to `ROUTES` (portfolio) or `DESIGN_ROUTES` (showcase) when you add pages. Screenshots, traces, and reports are gitignored.

**The admin is not in the sweep.** Every one of its routes is behind auth and needs a running Supabase, which `pnpm review` does not boot. Review it by signing in and looking — see `apps/admin/CLAUDE.md`.
