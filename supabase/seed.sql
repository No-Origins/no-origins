-- =============================================================================
-- Seed — Admin.md §13 step 3: "Seeded with one project row: `portfolio`."
--
-- Reference data only. **No email address is seeded here**, deliberately: the
-- allowlist is the one table whose contents are personal, and a repository is
-- the wrong place to keep them. supabase/README.md has the one line to run.
--
-- Everything below is idempotent, because a seed that cannot be re-run is a
-- seed you stop running.
-- =============================================================================

-- ── layer 2 · the systems the admin's rail is made of (§4) ───────────────────
-- `config` stays empty for `design`. Under R3 the package is the source of truth
-- for tokens and the admin only displays them, so a row here holding token
-- values would be the second source of truth R3 exists to prevent.
insert into public.systems (slug, name, kind, description) values
  ('design',     'Design System', 'design',
   'Tokens, primitives, components and blocks. Read-only under R3: the package is truth, this section shows it live in both themes and writes nothing.'),
  ('document',   'Document',      'document',
   'The scene schema, the component registry, and the inline directive set (R4). What each component accepts, in one place.'),
  ('publishing', 'Publishing',    'publishing',
   'The pipeline of §9: version row, pointer, revalidate webhook, and the read-back that makes R2 safe.'),
  ('storage',    'Storage',       'storage',
   'The two buckets of §8.2 and what is in them.')
on conflict (slug) do update
  set name = excluded.name, kind = excluded.kind, description = excluded.description;

-- ── layer 1 · the first project ──────────────────────────────────────────────
-- `status = 'draft'` is R5 in the data: the live portfolio still renders from
-- `scene.tsx`, and nothing here is what a visitor sees until step 10.
insert into public.projects (slug, name, domain, description, hue, status) values
  ('portfolio', 'Portfolio', 'bhargav.no-origins.com',
   'The canvas portfolio. The canvas IS the portfolio — sections sit on a box grid around Me.',
   'peach', 'draft')
on conflict (slug) do update
  set name = excluded.name, domain = excluded.domain,
      description = excluded.description, hue = excluded.hue;
