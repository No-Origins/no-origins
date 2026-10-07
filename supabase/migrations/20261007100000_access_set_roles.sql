-- =============================================================================
-- Access — a person's roles saved in one go (Access.md A7, his, 2026-10-07)
--
-- The People page's roles dialog gave or took each role as it was ticked. As
-- with a role's permissions (`…_access_save_role.sql`), he would rather tick
-- and then save: this takes the whole set of roles a person should hold and, in
-- one transaction, takes the ones they hold and should not, then gives the ones
-- they should and do not — each through step 4's `noo_take_role` and
-- `noo_give_role`, so every check and guard of those runs as before: nobody
-- gives or takes more than they hold, the Owner is never touched, a role taken
-- ends the person's sessions, and the record keeps a line for each. A refusal
-- anywhere leaves the person as they were. A role already held, or already not,
-- is never touched.
--
-- Adds one function. Drops nothing.
-- =============================================================================

create or replace function public.noo_set_roles(p_principal uuid, p_roles uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  wanted uuid[] := coalesce(p_roles, '{}');
  r uuid;
begin
  perform public.noo_named(p_principal);
  if not public.noo_can('admin.people.assign') then
    raise exception 'set roles: admin.people.assign is needed (Access.md A7)' using errcode = '42501';
  end if;
  for r in
    select a.role_id from public.role_assignments a
    where a.principal_id = p_principal and not (a.role_id = any (wanted))
  loop
    perform public.noo_take_role(p_principal, r);
  end loop;
  for r in
    select distinct w from unnest(wanted) as w
    where not exists (select 1 from public.role_assignments a where a.principal_id = p_principal and a.role_id = w)
  loop
    perform public.noo_give_role(p_principal, r);
  end loop;
end;
$$;

revoke execute on function public.noo_set_roles(uuid, uuid[]) from public, anon;
grant execute on function public.noo_set_roles(uuid, uuid[]) to authenticated;
