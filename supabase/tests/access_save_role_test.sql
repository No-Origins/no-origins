-- Access, a role saved in one go (Access.md A7): `noo_save_role`. `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into public.allowlist (email, role) values ('access-save-manager@example.test', 'viewer'), ('access-save-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-e000-000000000041', 'access-save-manager@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-000000000042', 'access-save-member@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-e000-0000000000f1', 'Friend'), ('00000000-0000-4000-e000-0000000000f2', 'Role keeper');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-e000-0000000000f1', 'home.open'),
  ('00000000-0000-4000-e000-0000000000f1', 'admin.people.assign'),
  ('00000000-0000-4000-e000-0000000000f2', 'admin.roles.manage'),
  ('00000000-0000-4000-e000-0000000000f2', 'motion.open'),
  ('00000000-0000-4000-e000-0000000000f2', 'home.open');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-e000-000000000041', '00000000-0000-4000-e000-0000000000f2');

create temporary table counted (n int) on commit drop;
create function pg_temp.friend_holds() returns text[] language sql as $$
  select coalesce(array_agg(permission order by permission), '{}') from public.role_permissions
  where role_id = '00000000-0000-4000-e000-0000000000f1';
$$;

-- ── the owner: one save, every change ────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2')::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', '  Friends ', 'Family who may see the house',
  array['home.open', 'motion.open', 'admin.people.assign'])$$, 'the owner saves a name, a sentence and a permission at once');
reset role;
select is((select name || ' / ' || sentence from public.roles where id = '00000000-0000-4000-e000-0000000000f1'),
  'Friends / Family who may see the house', 'the name and the sentence, trimmed');
select is(pg_temp.friend_holds(), array['admin.people.assign', 'home.open', 'motion.open'], 'and the permission ticked in');

insert into counted select count(*) from public.audit_events;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2')::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', 'Friends', 'Family who may see the house',
  array['motion.open', 'home.open', 'admin.people.assign', 'home.open'])$$, 'saving it again, in another order, twice named');
reset role;
select is((select count(*)::int from public.audit_events), (select n from counted), 'a save that changes nothing writes nothing');

do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2')::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', 'Friends', 'Family who may see the house',
  array['admin.people.assign', 'home.open'])$$, 'the owner unticks one');
reset role;
select is(pg_temp.friend_holds(), array['admin.people.assign', 'home.open'], 'and only that one goes');
select is((select count(*)::int from public.audit_events where action = 'role.permission.unticked'
  and detail -> 'before' ->> 'role_id' = '00000000-0000-4000-e000-0000000000f1'), 1, 'on the record, as a tick was');

-- ── a helper: all or nothing ─────────────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-000000000041","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', 'Friends', 'Family who may see the house',
  array['admin.people.assign', 'home.open', 'motion.open'])$$,
  'a helper saves a role holding a permission it could not grant, leaving that one as it is');
select throws_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', 'Renamed', 'Family who may see the house',
  array['home.open', 'motion.open'])$$, '42501', null, 'but never unticks it');
reset role;
select is((select name from public.roles where id = '00000000-0000-4000-e000-0000000000f1') || ' ' || array_to_string(pg_temp.friend_holds(), ','),
  'Friends admin.people.assign,home.open,motion.open', 'and a refused save leaves the role as it was, name and all');

-- ── never ────────────────────────────────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-000000000041","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_save_role((select id from public.roles where built_in = 'owner'), 'Owner', '', array['home.open'])$$,
  '42501', null, 'the Owner is not saved here');
select throws_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', '   ', '', array['home.open'])$$,
  '23514', null, 'a role needs a name');
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-000000000042","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_save_role('00000000-0000-4000-e000-0000000000f1', 'Friends', '', array[]::text[])$$,
  '42501', null, 'a member saves no role');

select * from finish();
rollback;
