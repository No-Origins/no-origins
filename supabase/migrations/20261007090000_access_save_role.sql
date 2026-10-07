-- =============================================================================
-- Access — a role saved in one go (Access.md A7, his, 2026-10-07)
--
-- The role page saved each tick as it was made: a request, a check and a row
-- for every permission, each a round trip. His ask: a compact role he ticks and
-- then saves, "so that we can push all the changes together". This is that
-- save: the role's name, its sentence and the whole set of its permissions, in
-- one transaction, so a refusal anywhere — a permission the asker may not
-- grant, a name another role has — leaves the role as it was.
--
-- `security invoker`, unlike step 4's functions: nothing here needs to be past
-- a rule, so the rules and guards of step 1 run as the asker, row by row, as
-- they did for each tick. Only what changed is written, so the audit log keeps
-- a line for each permission ticked or unticked and one for a new name or
-- sentence, and a save that changed nothing writes nothing.
--
-- Adds one function. Drops nothing.
-- =============================================================================

create or replace function public.noo_save_role(p_role uuid, p_name text, p_sentence text, p_permissions text[])
returns void language plpgsql set search_path = '' as $$
declare
  was public.roles;
  wanted text[] := coalesce(p_permissions, '{}');
  name_to text := btrim(coalesce(p_name, ''));
  sentence_to text := btrim(coalesce(p_sentence, ''));
begin
  if not public.noo_can('admin.roles.manage') then
    raise exception 'save role: admin.roles.manage is needed (Access.md A7)' using errcode = '42501';
  end if;
  select * into was from public.roles where id = p_role;
  if not found then
    raise exception 'save role: no such role' using errcode = '22023';
  end if;
  if was.built_in = 'owner' then
    raise exception 'save role: the Owner holds every permission without rows and is not changed here (Access.md A4)'
      using errcode = '42501';
  end if;
  if name_to = '' then
    raise exception 'save role: a role needs a name' using errcode = '23514';
  end if;

  if (was.name, was.sentence) is distinct from (name_to, sentence_to) then
    update public.roles set name = name_to, sentence = sentence_to where id = p_role;
  end if;
  delete from public.role_permissions where role_id = p_role and not (permission = any (wanted));
  -- Only the ones it lacks: a row already held is never written again, so its guard does not run for it — a helper
  -- may save a role holding a permission they could not grant, as long as they leave that one as it is.
  insert into public.role_permissions (role_id, permission)
    select distinct p_role, w from unnest(wanted) as w
    where not exists (select 1 from public.role_permissions rp where rp.role_id = p_role and rp.permission = w);
end;
$$;

revoke execute on function public.noo_save_role(uuid, text, text, text[]) from public, anon;
grant execute on function public.noo_save_role(uuid, text, text, text[]) to authenticated;
