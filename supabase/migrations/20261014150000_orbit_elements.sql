-- =============================================================================
-- Orbit's elements and world — World.md W73 (his, 2026-10-14)
--
-- "I think we should start using database … when I open mountain, or any one of
-- these elements, I should just see the mountain and a dropdown of variants
-- that I have created and saved … and then once we save them, I can go into the
-- world, and there we can place these elements and their variations wherever
-- we want." — Bhargav.
--
-- A VARIANT is one element's settings, named and saved: a mountain, a tree, a
-- portal or a human (the visitor's figure). THE WORLD is one item, its data the
-- hierarchy of units with what is built and placed in them (World.md W25, W73).
-- Each is kept as every studio thing is: one item, one draft saved as he goes,
-- and published versions, `major`.`minor`, frozen; the current version what the
-- world shows (Orbit.md C19, C24).
--
--   studio_items     kind 'mountain' · 'tree' · 'portal' · 'human' · 'world',
--                    named as its card names it ("Mountain 1", "World"); none
--                    names a character or a slot. Orbit's, as a character is:
--                    its rules ask `orbit.draft.save` to make and save one and
--                    `orbit.version.publish` to publish it.
--   studio_drafts    the element's settings, whole, keyed by control (the jig's
--                    data, `apps/orbit/src/world/*.ts`); the world's its data.
--
-- The page is static and the world is live (Admin.md §0.6): everyone reads what
-- is published of these kinds with the anon key, as the agents are read; nobody
-- reads a draft but an account that may save. The ids are the app's from the
-- start: a variant in code (`published.json`) and its item share a uuid.
--
-- Adds five kinds, widens the shape check, the app of a kind, the insert rule
-- and the public reads to them, and rewords two sentences; drops nothing.
-- =============================================================================

-- ── the kinds ────────────────────────────────────────────────────────────────
-- A new label is not used as the enum anywhere in this transaction (Postgres
-- refuses that): every rule below compares the kind as text.
alter type public.noo_studio_kind add value if not exists 'mountain';
alter type public.noo_studio_kind add value if not exists 'tree';
alter type public.noo_studio_kind add value if not exists 'portal';
alter type public.noo_studio_kind add value if not exists 'human';
alter type public.noo_studio_kind add value if not exists 'world';

-- ── their shape ──────────────────────────────────────────────────────────────
alter table public.studio_items drop constraint studio_items_shape;
alter table public.studio_items add constraint studio_items_shape check (
  case kind::text
    when 'character' then character_id is null and slot is null
    when 'motion'    then character_id is not null and slot is null
    when 'drawing'   then slot is not null and btrim(slot) <> ''
    -- an action, and Orbit's elements and world
    else character_id is null and slot is null
  end
);

comment on table public.studio_items is
  'Motion.md M20, M24, Orbit.md C6, World.md W73. A character, a motion, an uploaded drawing, '
  'an action, an element''s variant (a mountain, a tree, a portal, a human) or the world, with one '
  'draft and its published versions.';
comment on column public.studio_drafts.data is
  'A character: CharacterLook ({ body, face }), held whole. A motion: its timeline and rows. '
  'An action (Motion.md M24): { action, values }, every control''s value held whole, keyed by setting id. '
  'An element''s variant (World.md W73): its jig''s settings, whole, keyed by control. The world: its data, '
  'units and assets (World.md W25).';

-- ── which app a kind is ──────────────────────────────────────────────────────
create or replace function public.noo_studio_app(p_kind public.noo_studio_kind)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world') then 'orbit'
    else 'motion'
  end;
$$;

-- ── making one ───────────────────────────────────────────────────────────────
-- A variant or the world is made with its first draft by whoever may save a draft
-- (`orbit.draft.save`), as an action is by `motion.draft.save`; a character and a
-- drawing keep their own.
drop policy studio_items_insert on public.studio_items;
create policy studio_items_insert on public.studio_items
  for insert to authenticated with check (
    case
      when kind::text = 'character' then public.noo_can('orbit.agent.create')
      when kind::text = 'drawing'   then public.noo_can('orbit.style.upload')
      when kind::text in ('mountain', 'tree', 'portal', 'human', 'world') then public.noo_can('orbit.draft.save')
      else public.noo_can('motion.draft.save')
    end
  );

-- ── everyone reads what is published ─────────────────────────────────────────
drop policy studio_items_public_read on public.studio_items;
create policy studio_items_public_read on public.studio_items
  for select to anon, authenticated
  using (kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world'));

comment on policy studio_items_public_read on public.studio_items is
  'Orbit.md C24, World.md W73: the agents, the elements'' variants and the world are everyone''s to see. '
  'Writing them is by the policies beside this one.';

drop policy studio_versions_public_read on public.studio_versions;
create policy studio_versions_public_read on public.studio_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.studio_items i
      where i.id = item_id and i.kind::text in ('character', 'drawing', 'mountain', 'tree', 'portal', 'human', 'world')
    )
  );

comment on policy studio_versions_public_read on public.studio_versions is
  'Orbit.md C24, World.md W73: what was published of an agent, an element''s variant or the world is public. The draft is not.';

-- ── the sentences (Access.md A3) ─────────────────────────────────────────────
select public.noo_permission_upsert('orbit.draft.save', 'orbit', 'Saving an element''s variant, or the world, as a draft.');
select public.noo_permission_upsert('orbit.version.publish', 'orbit', 'Publishing an element''s variant, or the world.');

notify pgrst, 'reload schema';
