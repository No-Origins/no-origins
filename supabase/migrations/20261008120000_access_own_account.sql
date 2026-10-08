-- =============================================================================
-- Access — deleting one's own account (Access.md A2, Admin.md §8.4 step 5)
--
-- A self right, no one's to grant (his, 2026-10-06: a member may delete their
-- own account), on the auth app's account page. His, 2026-10-08: a confirming
-- step, and a code first when the account has an authenticator — as the
-- admin's gravest changes ask (A12) — so a session left open on someone else's
-- screen is not enough to end the account.
--
--   - Never the Owner's: there is one, and nothing takes it (A4).
--   - Never an agent's: an agent is retired from the admin (A5).
--   - With a verified authenticator, a code (or a passkey sign-in) from the last
--     five minutes, or `NOAAL` — the code the pages answer by asking for one.
--
-- The user goes, and with it the profile and the roles it held. What stays is
-- the record (A8): the audit log keeps the account's id and name, and every
-- `created_by` that named it is cleared.
--
-- And a role goes with its account. The guard on `role_assignments` asked
-- whether whoever deleted a row may grant its role, which is right for taking a
-- role from someone, and wrong for the rows an account deletion cascades to: a
-- person holding a role they could not grant could not delete their own account.
-- So a row whose account is already gone passes — the deletion of the account
-- was the act, and it was asked for whatever it needed — except the Owner's.
-- =============================================================================

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
    -- The account itself is gone (a deletion cascading here): its roles go with it, but never the Owner's.
    if not (
      tg_op = 'DELETE'
      and old.role_id is distinct from owner_role
      and not exists (select 1 from public.profiles p where p.id = old.principal_id)
    ) then
      raise exception 'role_assignments: nobody takes more than they hold, and the Owner is never taken (Access.md A4)'
        using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.noo_delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'delete account: nobody is signed in' using errcode = '42501';
  end if;
  if public.noo_is_owner() then
    raise exception 'delete account: the Owner''s account is never deleted (Access.md A4)' using errcode = '42501';
  end if;
  if (select p.kind from public.profiles p where p.id = me) = 'agent' then
    raise exception 'delete account: an agent is retired from the admin (Access.md A5)' using errcode = '42501';
  end if;
  if exists (select 1 from auth.mfa_factors f where f.user_id = me and f.status = 'verified') then
    perform public.noo_require_fresh_second_factor('delete account');
  end if;
  perform public.noo_audit('account.deleted', 'auth', me::text, '{}'::jsonb);
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.noo_delete_own_account() from public, anon;
grant execute on function public.noo_delete_own_account() to authenticated;

comment on function public.noo_delete_own_account() is
  'Access.md A2: a person deletes their own account — never the Owner''s or an agent''s; with an authenticator, '
  'after a code from the last five minutes (A12). The audit log keeps the record.';
