-- =============================================================================
-- Orbit's environment, published by version — World.md W75 (his, 2026-10-15)
--
-- "we have introduced publishing different variants in elements. But in
-- environment, we don't have such an option to publish. So basically, we don't
-- need names in environment. We need versions to keep publishing." — Bhargav.
--
-- THE ENVIRONMENT is one item, as the world is: kind 'environment', its data
-- what the builder's Environment pages tune (the atmosphere, the ceiling
-- clouds, the visitor's camera and the map), kept as every studio thing is:
-- one draft saved as he goes, and published versions, `major`.`minor`, frozen,
-- the current one what the world shows (Orbit.md C19, C24). It has no variants
-- and no card names it; its item is called "Environment".
--
-- Adds one kind and widens the app of a kind, the insert rule and the public
-- reads to it, as `…_orbit_elements.sql` did for the elements, and rewords the
-- two sentences; drops nothing.
-- =============================================================================

-- ── the kind ─────────────────────────────────────────────────────────────────
-- A new label is not used as the enum anywhere in this transaction (Postgres
-- refuses that): every rule below compares the kind as text.
alter type public.noo_studio_kind add value if not exists 'environment';

comment on table public.studio_items is
  'Motion.md M20, M24, Orbit.md C6, World.md W73, W75. A character, a motion, an uploaded drawing, '
  'an action, an element''s variant (a mountain, a tree, a portal, a human), the world or the '
  'environment, with one draft and its published versions.';
comment on column public.studio_drafts.data is
  'A character: CharacterLook ({ body, face }), held whole. A motion: its timeline and rows. '
  'An action (Motion.md M24): { action, values }, every control''s value held whole, keyed by setting id. '
  'An element''s variant (World.md W73): its jig''s settings, whole, keyed by control. The world: its data, '
  'units and assets (World.md W25). The environment (World.md W75): { atmosphere, clouds, camera, map }, '
  'each its jig''s settings, whole.';

-- ── which app it is ──────────────────────────────────────────────────────────
create or replace function public.noo_studio_app(p_kind public.noo_studio_kind)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world', 'environment') then 'orbit'
    else 'motion'
  end;
$$;

-- ── making it ────────────────────────────────────────────────────────────────
-- Made with its first draft by whoever may save a draft (`orbit.draft.save`),
-- as the world is.
drop policy studio_items_insert on public.studio_items;
create policy studio_items_insert on public.studio_items
  for insert to authenticated with check (
    case
      when kind::text = 'character' then public.noo_can('orbit.agent.create')
      when kind::text = 'drawing'   then public.noo_can('orbit.style.upload')
      when kind::text in ('mountain', 'tree', 'portal', 'human', 'world', 'environment') then public.noo_can('orbit.draft.save')
      else public.noo_can('motion.draft.save')
    end
  );

-- ── everyone reads what is published ─────────────────────────────────────────
drop policy studio_items_public_read on public.studio_items;
create policy studio_items_public_read on public.studio_items
  for select to anon, authenticated
  using (kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world', 'environment'));

comment on policy studio_items_public_read on public.studio_items is
  'Orbit.md C24, World.md W73, W75: the agents, the elements'' variants, the world and the environment are '
  'everyone''s to see. Writing them is by the policies beside this one.';

drop policy studio_versions_public_read on public.studio_versions;
create policy studio_versions_public_read on public.studio_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.studio_items i
      where i.id = item_id and i.kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world', 'environment')
    )
  );

comment on policy studio_versions_public_read on public.studio_versions is
  'Orbit.md C24, World.md W73, W75: what was published of an agent, an element''s variant, the world or the '
  'environment is public. The draft is not.';

-- ── the sentences (Access.md A3) ─────────────────────────────────────────────
select public.noo_permission_upsert('orbit.draft.save', 'orbit', 'Saving an element''s variant, the world or the environment as a draft.');
select public.noo_permission_upsert('orbit.version.publish', 'orbit', 'Publishing an element''s variant, the world or the environment.');

notify pgrst, 'reload schema';
