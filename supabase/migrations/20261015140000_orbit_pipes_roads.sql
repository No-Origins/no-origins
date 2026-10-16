-- =============================================================================
-- Orbit's pipes and roads — World.md W84 (his, 2026-10-15)
--
-- "Pipes will have start and an end … And for the pipe, I should be able to
-- decide the shape of it." "Roads can basically also work like pipe." "For
-- pipes and roads, we can have something like skeleton, where I can select the
-- joints to define the shape by moving the joints." — Bhargav.
--
-- A PIPE and a ROAD are elements, as a mountain or a tree is: each a variant
-- of its look, kind 'pipe' or 'road', made, saved and published from its page
-- as every element's variant is (World.md W72, W73). Where one runs and its
-- skeleton's joints are the world's data (kind 'world'), not the variant's.
--
-- Adds two kinds and widens the app of a kind, the insert rule and the public
-- reads to them, as `…_orbit_environment.sql` did for the environment, and
-- rewords the two sentences; drops nothing.
-- =============================================================================

-- ── the kinds ────────────────────────────────────────────────────────────────
-- A new label is not used as the enum anywhere in this transaction (Postgres
-- refuses that): every rule below compares the kind as text.
alter type public.noo_studio_kind add value if not exists 'pipe';
alter type public.noo_studio_kind add value if not exists 'road';

comment on table public.studio_items is
  'Motion.md M20, M24, Orbit.md C6, World.md W73, W75, W84. A character, a motion, an uploaded drawing, '
  'an action, an element''s variant (a mountain, a tree, a portal, a pipe, a road, a human), the world '
  'or the environment, with one draft and its published versions.';

-- ── which app it is ──────────────────────────────────────────────────────────
create or replace function public.noo_studio_app(p_kind public.noo_studio_kind)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'pipe', 'road', 'human', 'world', 'environment') then 'orbit'
    else 'motion'
  end;
$$;

-- ── making one ───────────────────────────────────────────────────────────────
-- Made with its first draft by whoever may save a draft (`orbit.draft.save`),
-- as every element's variant is.
drop policy studio_items_insert on public.studio_items;
create policy studio_items_insert on public.studio_items
  for insert to authenticated with check (
    case
      when kind::text = 'character' then public.noo_can('orbit.agent.create')
      when kind::text = 'drawing'   then public.noo_can('orbit.style.upload')
      when kind::text in ('mountain', 'tree', 'portal', 'pipe', 'road', 'human', 'world', 'environment') then public.noo_can('orbit.draft.save')
      else public.noo_can('motion.draft.save')
    end
  );

-- ── everyone reads what is published ─────────────────────────────────────────
drop policy studio_items_public_read on public.studio_items;
create policy studio_items_public_read on public.studio_items
  for select to anon, authenticated
  using (kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'pipe', 'road', 'human', 'world', 'environment'));

comment on policy studio_items_public_read on public.studio_items is
  'Orbit.md C24, World.md W73, W75, W84: the agents, the elements'' variants, the world and the environment '
  'are everyone''s to see. Writing them is by the policies beside this one.';

drop policy studio_versions_public_read on public.studio_versions;
create policy studio_versions_public_read on public.studio_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.studio_items i
      where i.id = item_id and i.kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'pipe', 'road', 'human', 'world', 'environment')
    )
  );

comment on policy studio_versions_public_read on public.studio_versions is
  'Orbit.md C24, World.md W73, W75, W84: what was published of an agent, an element''s variant, the world or '
  'the environment is public. The draft is not.';

-- ── the sentences (Access.md A3) ─────────────────────────────────────────────
select public.noo_permission_upsert('orbit.draft.save', 'orbit', 'Saving an element''s variant, the world or the environment as a draft.');
select public.noo_permission_upsert('orbit.version.publish', 'orbit', 'Publishing an element''s variant, the world or the environment.');

notify pgrst, 'reload schema';
