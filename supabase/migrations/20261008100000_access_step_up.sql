-- =============================================================================
-- Access — the admin's second factor, step 4: asking again, and the admin is
-- people's (Access.md A12)
--
-- The gravest changes need a code — or a passkey sign-in — from the last five
-- minutes, so a session left open is not enough (his, 2026-10-06 and -08):
--
--   1. ticking an `admin.*` permission into a role;
--   2. giving someone a role that holds one, by assignment or by invitation;
--   3. removing someone else's account;
--   4. rotating an agent's credential — when agents are built (A11 step 6),
--      through `noo_require_fresh_second_factor`.
--
-- Each is asked in the guard on the table it writes, so no page, function or
-- direct request goes round it; a request with no session behind it — a
-- migration, the sign-up trigger, the CLI — has no token and is not asked. A
-- refusal carries its own code, `NOAAL`, which the admin's pages answer by
-- asking for the code and trying again.
--
-- And the admin is people's (his, 2026-10-08): an agent has no phone to read a
-- code from, so no role holding an `admin.*` permission is ever given to an
-- agent, no such permission is ticked into a role an agent holds, and an account
-- holding one never becomes an agent.
--
-- Replaces the three role guards; adds two helpers and two profile guards.
-- =============================================================================

-- Whether this request's session entered a code, or signed in with a passkey,
-- within `p_window`: the token's `amr` keeps when each method was used (seconds
-- since 1970). The plain RFC 8176 list of names carries no time, so it never counts.
create or replace function public.noo_second_factor_within(p_window interval default interval '5 minutes')
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof((select auth.jwt()) -> 'amr') = 'array' then (select auth.jwt()) -> 'amr' else '[]'::jsonb end
    ) as m
    where jsonb_typeof(m) = 'object'
      and m ->> 'method' in ('totp', 'mfa/totp', 'passkey', 'mfa/webauthn', 'mfa/recovery_code')
      and (m ->> 'timestamp') ~ '^[0-9]+$'
      and (m ->> 'timestamp')::bigint >= extract(epoch from now() - p_window)
  );
$$;
revoke execute on function public.noo_second_factor_within(interval) from public;
grant execute on function public.noo_second_factor_within(interval) to anon, authenticated;

-- Refuse, with the code the pages know, unless the request entered a code in the
-- last five minutes. Not asked of a request with no session.
create or replace function public.noo_require_fresh_second_factor(p_what text)
returns void language plpgsql stable set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not public.noo_second_factor_within() then
    raise exception '%: this needs a code from your authenticator from the last five minutes (Access.md A12)', p_what
      using errcode = 'NOAAL';
  end if;
end;
$$;
revoke execute on function public.noo_require_fresh_second_factor(text) from public, anon, authenticated;

-- Whether a role holds an `admin.*` permission.
create or replace function public.noo_role_is_admin(p_role uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.role_permissions rp where rp.role_id = p_role and rp.permission like 'admin.%');
$$;
revoke execute on function public.noo_role_is_admin(uuid) from public, anon, authenticated;

create or replace function public.noo_role_permissions_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'role_permissions: untick and tick instead of changing a row' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and (select r.built_in from public.roles r where r.id = new.role_id) = 'owner' then
    raise exception 'role_permissions: the Owner holds every permission without rows (Access.md A4)'
      using errcode = '42501';
  end if;
  if not public.noo_may_grant_permission(coalesce(new.permission, old.permission)) then
    raise exception 'role_permissions: nobody grants more than they hold (Access.md A4)' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and new.permission like 'admin.%' then
    if exists (
      select 1 from public.role_assignments a join public.profiles p on p.id = a.principal_id
      where a.role_id = new.role_id and p.kind = 'agent'
    ) then
      raise exception 'role_permissions: an agent holds this role, and the admin is people''s (Access.md A12)'
        using errcode = '42501';
    end if;
    perform public.noo_require_fresh_second_factor('role_permissions');
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.noo_role_assignments_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner_role uuid := (select r.id from public.roles r where r.built_in = 'owner');
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if not public.noo_may_grant_role(new.role_id) then
      raise exception 'role_assignments: nobody grants more than they hold, and the Owner is never given (Access.md A4)'
        using errcode = '42501';
    end if;
    if new.role_id = owner_role and exists (
      select 1 from public.role_assignments a where a.role_id = owner_role and a.principal_id <> new.principal_id
    ) then
      raise exception 'role_assignments: there is one Owner (Access.md A4)' using errcode = '23505';
    end if;
    if public.noo_role_is_admin(new.role_id) then
      if (select p.kind from public.profiles p where p.id = new.principal_id) = 'agent' then
        raise exception 'role_assignments: the admin is people''s: no agent holds an admin permission (Access.md A12)'
          using errcode = '42501';
      end if;
      perform public.noo_require_fresh_second_factor('role_assignments');
    end if;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and not public.noo_may_grant_role(old.role_id) then
    raise exception 'role_assignments: nobody takes more than they hold, and the Owner is never taken (Access.md A4)'
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.noo_invitation_roles_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select r.built_in from public.roles r where r.id = new.role_id) = 'owner' then
    raise exception 'invitation_roles: the Owner is never given by invitation (Access.md A4)' using errcode = '42501';
  end if;
  if not public.noo_may_grant_role(new.role_id) then
    raise exception 'invitation_roles: nobody invites with more than they hold (Access.md A4)' using errcode = '42501';
  end if;
  if public.noo_role_is_admin(new.role_id) then
    perform public.noo_require_fresh_second_factor('invitation_roles');
  end if;
  return new;
end;
$$;

-- Removing someone else's account — through `noo_remove_account`, whose delete
-- of the user reaches here, or a direct delete — asks again. One's own is not
-- the gravest action, and a member may have no authenticator to ask.
create or replace function public.noo_profiles_removal_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.id is distinct from (select auth.uid()) then
    perform public.noo_require_fresh_second_factor('remove');
  end if;
  return old;
end;
$$;
create trigger profiles_removal_guard before delete on public.profiles
  for each row execute function public.noo_profiles_removal_guard();

-- An account that holds an `admin.*` permission, or is the Owner, never becomes an agent.
create or replace function public.noo_profiles_kind_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'agent' and old.kind is distinct from 'agent' and exists (
    select 1 from public.role_assignments a join public.roles r on r.id = a.role_id
    where a.principal_id = new.id and (r.built_in = 'owner' or public.noo_role_is_admin(r.id))
  ) then
    raise exception 'profiles: this account holds an admin permission, and the admin is people''s (Access.md A12)'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_kind_guard before update of kind on public.profiles
  for each row execute function public.noo_profiles_kind_guard();
