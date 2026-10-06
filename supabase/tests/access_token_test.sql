-- Access, step 3 (Access.md A6, A11): the token hook writes `perms` and `kind` and never refuses a sign-in.
-- `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into public.allowlist (email, role) values ('access3-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-c000-000000000021', 'access3-member@example.test', 'authenticated', 'authenticated');

select is(
  jsonb_array_length(public.noo_access_token_hook(jsonb_build_object(
    'user_id', (select id from public.profiles where role = 'owner'), 'claims', '{"role":"authenticated"}'::jsonb)) -> 'claims' -> 'perms'),
  (select count(*)::int from public.permissions), 'the owner''s token holds every permission');
select is(
  public.noo_access_token_hook('{"user_id":"00000000-0000-4000-c000-000000000021","claims":{"role":"authenticated"}}') -> 'claims' -> 'perms',
  '["motion.open"]'::jsonb, 'a member''s token holds what Member grants');
select is(
  public.noo_access_token_hook('{"user_id":"00000000-0000-4000-c000-000000000021","claims":{"role":"authenticated"}}') -> 'claims' ->> 'kind',
  'person', 'and says it is a person');
select is(
  public.noo_access_token_hook('{"user_id":"00000000-0000-4000-c000-000000000021","claims":{"role":"authenticated","aal":"aal1"}}') -> 'claims' ->> 'aal',
  'aal1', 'the claims Auth wrote are kept');
select is(
  public.noo_access_token_hook('{"user_id":"00000000-0000-4000-c000-0000000000ff","claims":{}}') -> 'claims' -> 'perms',
  '[]'::jsonb, 'an account with no roles holds nothing');
select is(
  public.noo_access_token_hook('{"user_id":"not a uuid","claims":{}}') -> 'claims' -> 'perms',
  '[]'::jsonb, 'broken input never refuses a sign-in, and opens nothing');
select ok(has_function_privilege('supabase_auth_admin', 'public.noo_access_token_hook(jsonb)', 'execute'), 'Auth may call it');
select ok(not has_function_privilege('authenticated', 'public.noo_access_token_hook(jsonb)', 'execute'), 'nobody signed in may');

select * from finish();
rollback;
