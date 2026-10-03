-- =============================================================================
-- The agents are everyone's to see; publishing is his — Orbit.md C24 (his,
-- 2026-10-03)
--
-- "Make the controls in Orbit public, and only when I log in as an admin
-- should I be able to publish, so that users can experiment and play around."
-- — Bhargav.
--
-- Orbit opens without a sign-in. A visitor sees each agent as its current
-- published version and plays with every control on the page; nothing they do
-- is saved. The owner (his "admin": the one role that writes here) signs in,
-- and the draft, the saves and the publishes are as they were.
--
-- So: two read policies, for `anon` and `authenticated` alike — the items of
-- kind `character` and `drawing` (the agents and the styles uploaded for them),
-- and the versions of those items. Nothing on drafts: the draft is his work in
-- progress, and a visitor starts from what was published. Nothing on actions:
-- they are the motion studio's. No insert, update or delete for `anon`, by
-- policy (none) and by privilege: its table privileges on the three tables are
-- revoked, then `select` granted back on the columns Orbit reads — never
-- `created_by` or `published_by`, his user id, and never the draft at all.
--
-- `…_rls.sql` (§8.3) said "no anon policy, anywhere, deliberately", for the
-- public site's documents, which reach it through the pipeline. Admin.md §0.6
-- (2026-09-18) amended that: a component that is live declares it, reads with
-- the anon key through a per-table RLS policy, and has a fallback state. These
-- are those policies for Orbit, whose fallback is the look the package declares.
--
-- Adds two policies and narrows anon's privileges; drops and rewrites nothing.
-- =============================================================================

-- ── anon's privileges: read the two tables' public columns, nothing else ─────
revoke all on public.studio_items, public.studio_drafts, public.studio_versions from anon;

grant select (id, kind, name, character_id, slot, current_version_id, created_at, updated_at)
  on public.studio_items to anon;
grant select (id, item_id, number, minor, label, data, ui_version, source, published_at)
  on public.studio_versions to anon;

-- ── the agents and their styles, and every version of them, for everyone ─────
create policy studio_items_public_read on public.studio_items
  for select to anon, authenticated
  using (kind in ('character', 'drawing'));

comment on policy studio_items_public_read on public.studio_items is
  'Orbit.md C24: the agents (and the styles drawn for them) are everyone''s to see. '
  'Writing them is the owner''s, by the policies beside this one.';

create policy studio_versions_public_read on public.studio_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.studio_items i
      where i.id = item_id and i.kind in ('character', 'drawing')
    )
  );

comment on policy studio_versions_public_read on public.studio_versions is
  'Orbit.md C24: what was published of an agent is public. The draft is not.';

notify pgrst, 'reload schema';
