-- =============================================================================
-- Access, step 4 — what the admin's pages call (Access.md A7, A11)
--
-- The People, Roles, Invitations and Audit pages read and write the access
-- tables through their rules (step 1) where a rule is enough, and through these
-- functions where it is not: a list that reads `auth.users`, a change that must
-- end sessions with it, a move of the default in one transaction. Each checks
-- the asking principal's permission itself (a `security definer` function is
-- past every rule), and the guards of step 1 still run inside it, with the
-- asking principal's identity: nobody grants, takes, ends or removes more than
-- they hold, and the Owner is never touched.
--
-- Also: who made a role, gave a role or sent an invitation is stamped from the
-- request, never taken from what the page sent; and an address with an
-- unexpired invitation may make an account while the allowlist still guards
-- sign-up (step 5 opens it).
--
-- Adds functions and triggers; replaces `noo_enforce_allowlist()`. Drops nothing.
-- =============================================================================

-- ── who did it, from the request ─────────────────────────────────────────────
create or replace function public.noo_stamp_created_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null then new.created_by := (select auth.uid()); end if;
  return new;
end;
$$;
create or replace function public.noo_stamp_granted_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null then new.granted_by := (select auth.uid()); end if;
  return new;
end;
$$;
create or replace function public.noo_stamp_invited_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null then new.invited_by := (select auth.uid()); end if;
  return new;
end;
$$;
create trigger roles_stamp before insert on public.roles
  for each row execute function public.noo_stamp_created_by();
create trigger role_assignments_stamp before insert on public.role_assignments
  for each row execute function public.noo_stamp_granted_by();
create trigger invitations_stamp before insert on public.invitations
  for each row execute function public.noo_stamp_invited_by();

-- ── a change names who and what, or is refused ─────────────────────────────
-- A page that cannot see a principal (its rules hide the row) would pass no id;
-- that is refused out loud, never done quietly to nobody.
create or replace function public.noo_named(p_principal uuid, p_role uuid default null, p_role_needed boolean default false)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if p_principal is null or not exists (select 1 from public.profiles where id = p_principal) then
    raise exception 'access: no such principal' using errcode = '22023';
  end if;
  if p_role_needed and (p_role is null or not exists (select 1 from public.roles where id = p_role)) then
    raise exception 'access: no such role' using errcode = '22023';
  end if;
end;
$$;
revoke execute on function public.noo_named(uuid, uuid, boolean) from public, anon, authenticated;

-- ── may the asker act on this principal? ─────────────────────────────────────
-- Not the Owner, not oneself, and only someone whose every role the asker could
-- give (A4): ending a person's sessions or removing them is taking all they hold.
create or replace function public.noo_may_act_on(p_principal uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_principal is distinct from (select auth.uid())
    and not exists (
      select 1 from public.role_assignments a join public.roles r on r.id = a.role_id
      where a.principal_id = p_principal and r.built_in = 'owner'
    )
    and not exists (
      select 1 from public.role_assignments a
      where a.principal_id = p_principal and not public.noo_may_grant_role(a.role_id)
    );
$$;
revoke execute on function public.noo_may_act_on(uuid) from public, anon, authenticated;

-- ── People (A7) ──────────────────────────────────────────────────────────────
create or replace function public.noo_people()
returns table (
  id uuid, email text, name text, kind public.noo_principal_kind,
  joined_at timestamptz, last_sign_in_at timestamptz, roles jsonb
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.noo_can('admin.people.view') then
    raise exception 'people: admin.people.view is needed (Access.md A7)' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.name, p.kind, p.created_at, u.last_sign_in_at,
      coalesce((
        select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'builtIn', r.built_in) order by r.name)
        from public.role_assignments a join public.roles r on r.id = a.role_id
        where a.principal_id = p.id
      ), '[]'::jsonb)
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

create or replace function public.noo_give_role(p_principal uuid, p_role uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.noo_named(p_principal, p_role, true);
  if not public.noo_can('admin.people.assign') then
    raise exception 'give role: admin.people.assign is needed (Access.md A7)' using errcode = '42501';
  end if;
  insert into public.role_assignments (principal_id, role_id) values (p_principal, p_role)
    on conflict do nothing;
end;
$$;

-- Taking a role ends the person's sessions, so every gate closes on their next
-- request (A6; proven in step 3).
create or replace function public.noo_take_role(p_principal uuid, p_role uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.noo_named(p_principal, p_role, true);
  if not public.noo_can('admin.people.assign') then
    raise exception 'take role: admin.people.assign is needed (Access.md A7)' using errcode = '42501';
  end if;
  delete from public.role_assignments where principal_id = p_principal and role_id = p_role;
  if found then
    delete from auth.sessions where user_id = p_principal;
  end if;
end;
$$;

create or replace function public.noo_end_sessions(p_principal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.noo_named(p_principal);
  if not public.noo_can('admin.people.remove') or not public.noo_may_act_on(p_principal) then
    raise exception 'end sessions: admin.people.remove is needed, and never for the Owner, oneself or someone who holds more (Access.md A4, A7)'
      using errcode = '42501';
  end if;
  delete from auth.sessions where user_id = p_principal;
  perform public.noo_audit('account.sessions.ended', 'admin', p_principal::text, '{}'::jsonb);
end;
$$;

create or replace function public.noo_remove_account(p_principal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.noo_named(p_principal);
  if not public.noo_can('admin.people.remove') or not public.noo_may_act_on(p_principal) then
    raise exception 'remove: admin.people.remove is needed, and never for the Owner, oneself or someone who holds more (Access.md A4, A7)'
      using errcode = '42501';
  end if;
  delete from auth.users where id = p_principal;
end;
$$;

-- ── Roles (A4, A7) ───────────────────────────────────────────────────────────
-- The old default off first, then the new one on: the one-default index allows
-- no moment with two, and the check at the end of the transaction no moment
-- with none.
create or replace function public.noo_set_default_role(p_role uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.noo_can('admin.roles.manage') then
    raise exception 'default role: admin.roles.manage is needed (Access.md A7)' using errcode = '42501';
  end if;
  if (select r.built_in from public.roles r where r.id = p_role) = 'owner' then
    raise exception 'default role: the Owner is never the default (Access.md A4)' using errcode = '42501';
  end if;
  update public.roles set is_default = false where is_default and id <> p_role;
  update public.roles set is_default = true where id = p_role;
end;
$$;

revoke execute on function public.noo_people() from public, anon;
revoke execute on function public.noo_give_role(uuid, uuid) from public, anon;
revoke execute on function public.noo_take_role(uuid, uuid) from public, anon;
revoke execute on function public.noo_end_sessions(uuid) from public, anon;
revoke execute on function public.noo_remove_account(uuid) from public, anon;
revoke execute on function public.noo_set_default_role(uuid) from public, anon;
grant execute on function public.noo_people() to authenticated;
grant execute on function public.noo_give_role(uuid, uuid) to authenticated;
grant execute on function public.noo_take_role(uuid, uuid) to authenticated;
grant execute on function public.noo_end_sessions(uuid) to authenticated;
grant execute on function public.noo_remove_account(uuid) to authenticated;
grant execute on function public.noo_set_default_role(uuid) to authenticated;

-- ── an invitation admits an address (A7, A11 step 4) ─────────────────────────
-- Until sign-up opens (step 5) the allowlist still refuses every other address;
-- an unexpired, unused invitation now admits one too, so the admin's
-- Invitations page is how someone gets in.
create or replace function public.noo_enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  addr text := lower(btrim(new.email));
begin
  if addr is null or addr = '' then
    raise exception 'no-origins: sign-in requires an email address'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.allowlist a where a.email = addr)
     and not exists (select 1 from public.invitations i where i.email = addr and i.used_at is null and i.expires_at > now()) then
    raise exception 'no-origins: % is not on the allowlist and has no invitation', addr
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- ── the Owner's sentence, as the admin shows it ──────────────────────────────
update public.roles set sentence = 'Every permission, those added later included. One account holds it, and it is never given or taken.'
  where built_in = 'owner';

notify pgrst, 'reload schema';
