-- =============================================================================
-- Seed — Admin.md §0.5: the first quest.
--
-- Reference data only. **No email address is seeded here**, deliberately: the
-- allowlist is the one table whose contents are personal, and a repository is
-- the wrong place to keep them. supabase/README.md has the one line to run.
--
-- Everything below is idempotent, because a seed that cannot be re-run is a
-- seed you stop running.
-- =============================================================================

-- ── the first quest ──────────────────────────────────────────────────────────
-- `status = 'draft'`: the live portfolio still renders from source, and nothing
-- here is what a visitor sees until a quest is deployed (which is deferred).
-- `layout` stays null — the quest opens on an empty grid, composed in the admin.
insert into public.quests (slug, name, description, subdomain, hue, status) values
  ('portfolio', 'Portfolio',
   'Bhargav''s portfolio — composed on the grid from the design system.',
   'bhargav.no-origins.com', 'peach', 'draft')
on conflict (slug) do update
  set name = excluded.name, description = excluded.description,
      subdomain = excluded.subdomain, hue = excluded.hue;
