-- =============================================================================
-- Access, step 3 — the sign-in token carries the permissions (Access.md A6, A11)
--
-- Supabase's custom access token hook: whenever a token is issued — signing in,
-- and every refresh — Auth calls this with the claims it is about to sign, and
-- signs what it returns. It adds two claims: `perms`, every permission the
-- principal holds (`noo_permissions_of`, the owner's being all of them), and
-- `kind`, person or agent. The gates read `perms` (A6: the token shows, the
-- database decides); every rule in the database still asks `noo_can()` live.
--
-- It never blocks a sign-in: if reading the permissions fails, the token goes
-- out with none, and every gate stays shut — closed, not open. Enabled in
-- `supabase/config.toml` (`[auth.hook.custom_access_token]`), which also brings
-- the token's life to ten minutes (A6). ORDER ON THE HOSTED PROJECT: this
-- migration first (`db push`), then the configuration (`config push`); a hook
-- enabled before its function exists refuses every sign-in.
--
-- Adds one function and its grants. Drops nothing.
-- =============================================================================

create or replace function public.noo_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  who    uuid;
  perms  text[] := '{}';
  kind   text := 'person';
begin
  begin
    who := nullif(event ->> 'user_id', '')::uuid;
    perms := coalesce(public.noo_permissions_of(who), '{}');
    select coalesce(p.kind::text, 'person') into kind from public.profiles p where p.id = who;
  exception when others then
    perms := '{}';
  end;
  claims := jsonb_set(claims, '{perms}', to_jsonb(perms));
  claims := jsonb_set(claims, '{kind}', to_jsonb(coalesce(kind, 'person')));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

comment on function public.noo_access_token_hook(jsonb) is
  'Access.md A6: writes `perms` and `kind` into every access token Supabase Auth issues. Never refuses a sign-in.';

-- Auth calls it as `supabase_auth_admin`, and nothing else may.
revoke execute on function public.noo_access_token_hook(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema public to supabase_auth_admin;
    grant execute on function public.noo_access_token_hook(jsonb) to supabase_auth_admin;
  end if;
end;
$$;
