-- Access, a person's roles saved in one go (Access.md A7): `noo_set_roles`. `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.allowlist (email, role) values ('access-set-person@example.test', 'viewer'), ('access-set-assigner@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-e100-000000000051', 'access-set-person@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e100-000000000052', 'access-set-assigner@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-e100-0000000000a1', 'Friend'), ('00000000-0000-4000-e100-0000000000a2', 'Editor'),
  ('00000000-0000-4000-e100-0000000000a3', 'Boss'), ('00000000-0000-4000-e100-0000000000a4', 'Assigner');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-e100-0000000000a1', 'home.open'),
  ('00000000-0000-4000-e100-0000000000a2', 'motion.draft.save'),
  ('00000000-0000-4000-e100-0000000000a3', 'admin.roles.manage'),
  ('00000000-0000-4000-e100-0000000000a4', 'admin.people.assign'),
  ('00000000-0000-4000-e100-0000000000a4', 'admin.people.view'),
  ('00000000-0000-4000-e100-0000000000a4', 'home.open');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-e100-000000000052', '00000000-0000-4000-e100-0000000000a4');
insert into auth.sessions (id, user_id) values ('00000000-0000-4000-e100-0000000000e1', '00000000-0000-4000-e100-000000000051');

create temporary table counted (n int) on commit drop;
create function pg_temp.holds() returns text language sql as $$
  select coalesce(string_agg(r.name, ', ' order by r.name), '') from public.role_assignments a
  join public.roles r on r.id = a.role_id where a.principal_id = '00000000-0000-4000-e100-000000000051';
$$;
create function pg_temp.sessions() returns int language sql as $$
  select count(*)::int from auth.sessions where user_id = '00000000-0000-4000-e100-000000000051';
$$;

-- ── the owner: gives and takes in one save ───────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_set_roles('00000000-0000-4000-e100-000000000051', array[
  (select id from public.roles where built_in = 'member'), '00000000-0000-4000-e100-0000000000a1', '00000000-0000-4000-e100-0000000000a2']::uuid[])$$,
  'the owner gives two roles in one save');
reset role;
select is(pg_temp.holds(), 'Editor, Friend, Member', 'beside the one held');
select is(pg_temp.sessions(), 1, 'giving ends no session');

do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_set_roles('00000000-0000-4000-e100-000000000051', array['00000000-0000-4000-e100-0000000000a1']::uuid[])$$,
  'and takes two in another');
reset role;
select is(pg_temp.holds(), 'Friend', 'leaving the one named');
select is(pg_temp.sessions(), 0, 'and taking ends the person''s sessions');

insert into counted select count(*) from public.audit_events;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_set_roles('00000000-0000-4000-e100-000000000051',
  array['00000000-0000-4000-e100-0000000000a1', '00000000-0000-4000-e100-0000000000a1']::uuid[])$$, 'saving the same set, twice named');
reset role;
select is((select count(*)::int from public.audit_events), (select n from counted), 'writes nothing');

-- ── an assigner: all or nothing ──────────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
insert into auth.sessions (id, user_id) values ('00000000-0000-4000-e100-0000000000e2', '00000000-0000-4000-e100-000000000051');
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-e100-000000000052', 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_set_roles('00000000-0000-4000-e100-000000000051', array['00000000-0000-4000-e100-0000000000a3']::uuid[])$$,
  '42501', null, 'an assigner never gives a role with a permission only the owner gives');
reset role;
select is(pg_temp.holds() || ' / ' || pg_temp.sessions(), 'Friend / 1',
  'and the refused save took nothing, ended nothing: Friend is still held and the session still open');

-- ── never ────────────────────────────────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-e100-000000000051', 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_set_roles('00000000-0000-4000-e100-000000000052', array[]::uuid[])$$,
  '42501', null, 'someone without admin.people.assign sets nobody''s roles');
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-e100-000000000052', 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_set_roles(null, array[]::uuid[])$$, '22023', null, 'and a save that names nobody is refused out loud');

select * from finish();
rollback;
