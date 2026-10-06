-- =============================================================================
-- Access, step 2 — every rule asks for a permission (Access.md A6, A11)
--
-- Every policy that asked `noo_is(<role>)` now asks `noo_can(<permission>)`, the
-- one question of step 1. The owner holds every permission, so nothing he can
-- do changes; what changes is that a role he makes in the admin now means
-- something to the database. Table by table:
--
--   studio tables  by the item's kind (A6): `character` and `drawing` are
--                  Orbit's, `action` and the old `motion` the motion studio's.
--                    read      an action or motion: `motion.open` (a member
--                              tries every control with the published actions);
--                              a character or drawing stays everyone's (C24)
--                    item      made: `orbit.agent.create` (a character),
--                              `orbit.style.upload` (a drawing), `motion.draft.save`
--                              (an action, made with its first draft);
--                              changed (the version it shows, on publish or
--                              restore): `<app>.version.publish`, and for a
--                              drawing `orbit.style.upload` too, whose upload
--                              publishes it; deleted: the owner alone
--                    draft     read, made, saved: `<app>.draft.save`, and for a
--                              character `orbit.agent.create` too, which makes
--                              its first draft; deleted: the owner alone
--                    version   made: `<app>.version.publish`, and for a drawing
--                              `orbit.style.upload`; never changed (frozen)
--   profiles       read: oneself, or `admin.people.view`; changed:
--                  `admin.people.assign`; removed: `admin.people.remove`
--   allowlist      `admin.invitations.manage` (it becomes the invitations, step 4)
--   assets, publish  the 1.0 admin's buckets: the owner alone, until they have
--                  a use
--
-- `noo_is()` itself stays until step 7, read by nothing after this.
-- Rewrites policies; adds two helper functions; drops no table and no data.
-- =============================================================================

-- ── which app a studio item is ───────────────────────────────────────────────
create or replace function public.noo_studio_app(p_kind public.noo_studio_kind)
returns text language sql immutable set search_path = '' as $$
  select case p_kind when 'character' then 'orbit' when 'drawing' then 'orbit' else 'motion' end;
$$;

-- `security definer`: a draft's or a version's rule reads its item whatever the
-- item's own rules would show the one asking.
create or replace function public.noo_studio_item_app(p_item uuid)
returns text language sql stable security definer set search_path = '' as $$
  select public.noo_studio_app(i.kind) from public.studio_items i where i.id = p_item;
$$;
create or replace function public.noo_studio_item_kind(p_item uuid)
returns public.noo_studio_kind language sql stable security definer set search_path = '' as $$
  select i.kind from public.studio_items i where i.id = p_item;
$$;
revoke execute on function public.noo_studio_item_app(uuid) from public, anon;
revoke execute on function public.noo_studio_item_kind(uuid) from public, anon;
grant execute on function public.noo_studio_item_app(uuid) to authenticated;
grant execute on function public.noo_studio_item_kind(uuid) to authenticated;

-- ── studio_items ─────────────────────────────────────────────────────────────
drop policy studio_items_read on public.studio_items;
drop policy studio_items_insert on public.studio_items;
drop policy studio_items_update on public.studio_items;
drop policy studio_items_delete on public.studio_items;

create policy studio_items_read on public.studio_items
  for select to authenticated using (
    public.noo_can(public.noo_studio_app(kind) || '.draft.save')
    or (public.noo_studio_app(kind) = 'motion' and public.noo_can('motion.open'))
  );
create policy studio_items_insert on public.studio_items
  for insert to authenticated with check (
    case kind
      when 'character' then public.noo_can('orbit.agent.create')
      when 'drawing'   then public.noo_can('orbit.style.upload')
      else public.noo_can('motion.draft.save')
    end
  );
create policy studio_items_update on public.studio_items
  for update to authenticated
  using (
    public.noo_can(public.noo_studio_app(kind) || '.version.publish')
    or (kind = 'drawing' and public.noo_can('orbit.style.upload'))
  )
  with check (
    public.noo_can(public.noo_studio_app(kind) || '.version.publish')
    or (kind = 'drawing' and public.noo_can('orbit.style.upload'))
  );
create policy studio_items_delete on public.studio_items
  for delete to authenticated using (public.noo_is_owner());

-- ── studio_drafts ────────────────────────────────────────────────────────────
drop policy studio_drafts_read on public.studio_drafts;
drop policy studio_drafts_insert on public.studio_drafts;
drop policy studio_drafts_update on public.studio_drafts;
drop policy studio_drafts_delete on public.studio_drafts;

create policy studio_drafts_read on public.studio_drafts
  for select to authenticated using (
    public.noo_can(public.noo_studio_item_app(item_id) || '.draft.save')
    or (public.noo_studio_item_kind(item_id) = 'character' and public.noo_can('orbit.agent.create'))
  );
create policy studio_drafts_insert on public.studio_drafts
  for insert to authenticated with check (
    public.noo_can(public.noo_studio_item_app(item_id) || '.draft.save')
    or (public.noo_studio_item_kind(item_id) = 'character' and public.noo_can('orbit.agent.create'))
  );
create policy studio_drafts_update on public.studio_drafts
  for update to authenticated
  using (public.noo_can(public.noo_studio_item_app(item_id) || '.draft.save'))
  with check (public.noo_can(public.noo_studio_item_app(item_id) || '.draft.save'));
create policy studio_drafts_delete on public.studio_drafts
  for delete to authenticated using (public.noo_is_owner());

-- ── studio_versions ──────────────────────────────────────────────────────────
drop policy studio_versions_read on public.studio_versions;
drop policy studio_versions_insert on public.studio_versions;

create policy studio_versions_read on public.studio_versions
  for select to authenticated using (
    public.noo_can(public.noo_studio_item_app(item_id) || '.draft.save')
    or (public.noo_studio_item_app(item_id) = 'motion' and public.noo_can('motion.open'))
  );
create policy studio_versions_insert on public.studio_versions
  for insert to authenticated with check (
    public.noo_can(public.noo_studio_item_app(item_id) || '.version.publish')
    or (public.noo_studio_item_kind(item_id) = 'drawing' and public.noo_can('orbit.style.upload'))
  );

-- ── profiles ─────────────────────────────────────────────────────────────────
drop policy profiles_read_self_or_owner on public.profiles;
drop policy profiles_write_owner on public.profiles;

create policy profiles_read on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.noo_can('admin.people.view'));
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.noo_can('admin.people.assign')) with check (public.noo_can('admin.people.assign'));
create policy profiles_delete on public.profiles
  for delete to authenticated using (public.noo_can('admin.people.remove'));

-- ── allowlist ────────────────────────────────────────────────────────────────
drop policy allowlist_owner on public.allowlist;
create policy allowlist_manage on public.allowlist
  for all to authenticated
  using (public.noo_can('admin.invitations.manage')) with check (public.noo_can('admin.invitations.manage'));

-- ── the 1.0 admin's buckets ──────────────────────────────────────────────────
drop policy assets_objects_read on storage.objects;
drop policy assets_objects_insert on storage.objects;
drop policy assets_objects_update on storage.objects;
drop policy assets_objects_delete on storage.objects;
drop policy publish_objects_write on storage.objects;
drop policy publish_objects_update on storage.objects;
drop policy publish_objects_delete on storage.objects;

create policy assets_objects_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'assets' and public.noo_is_owner())
  with check (bucket_id = 'assets' and public.noo_is_owner());
create policy publish_objects_owner_write on storage.objects
  for insert to authenticated with check (bucket_id = 'publish' and public.noo_is_owner());
create policy publish_objects_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'publish' and public.noo_is_owner()) with check (bucket_id = 'publish' and public.noo_is_owner());
create policy publish_objects_owner_delete on storage.objects
  for delete to authenticated using (bucket_id = 'publish' and public.noo_is_owner());

notify pgrst, 'reload schema';
