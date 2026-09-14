-- =============================================================================
-- Auth — Admin.md §8.4
--
-- Magic link only. No password, no OAuth provider, no signup route. Membership
-- is the `allowlist` table and nothing else, so **an exposed sign-in URL is not
-- an exposed app**: anyone may ask for a link, and an address that is not listed
-- never gets an account to attach one to.
--
-- Enforced with a `before insert` trigger on `auth.users` rather than with the
-- `before_user_created` auth hook. The hook is the tidier surface and gives a
-- nicer error, but its event payload shape is not something to guess at in a
-- security gate — a hook that silently fails open is worse than a blunt
-- exception. A trigger's behaviour is not in question: the insert aborts.
-- Swap it for the hook later if you want the friendlier message; keep the
-- trigger underneath either way.
-- =============================================================================

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

  if not exists (select 1 from public.allowlist a where a.email = addr) then
    raise exception 'no-origins: % is not on the allowlist', addr
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- The profile every RLS policy reads, created at the same moment the account is,
-- carrying the role the invitation named. A profile created later by the app is
-- a window in which a signed-in user has no role — and `noo_is()` returns null
-- for them, which reads as "denied" but for the wrong reason.
create or replace function public.noo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  addr        text := lower(btrim(new.email));
  invited_as  public.noo_role;
begin
  select a.role into invited_as from public.allowlist a where a.email = addr;

  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    addr,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    coalesce(invited_as, 'viewer')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger noo_allowlist_gate
  before insert on auth.users
  for each row execute function public.noo_enforce_allowlist();

create trigger noo_on_auth_user_created
  after insert on auth.users
  for each row execute function public.noo_handle_new_user();

-- The auth service inserts the row, so it is the role that has to be allowed to
-- fire these. Guarded because the role does not exist outside Supabase, and a
-- migration that only runs on one machine is not a migration.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.noo_enforce_allowlist() to supabase_auth_admin;
    grant execute on function public.noo_handle_new_user()   to supabase_auth_admin;
  end if;
end;
$$;
