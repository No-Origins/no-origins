-- Access, step 4 (Access.md A7, A11): what the admin's pages call. `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- The owner's id, read as the database: a remover's rules would hide it.
create temporary table who on commit drop as select id as owner from public.profiles where role = 'owner';
grant select on who to authenticated;

insert into public.allowlist (email, role) values ('access4-member@example.test', 'viewer'), ('access4-remover@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-d000-000000000031', 'access4-member@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-d000-000000000032', 'access4-remover@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-d000-0000000000d1', 'Friend'), ('00000000-0000-4000-d000-0000000000d2', 'Remover');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-d000-0000000000d1', 'home.open'),
  ('00000000-0000-4000-d000-0000000000d2', 'admin.people.remove');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-d000-000000000032', '00000000-0000-4000-d000-0000000000d2');
insert into auth.sessions (id, user_id) values ('00000000-0000-4000-d000-0000000000e1', '00000000-0000-4000-d000-000000000031');

-- ── the owner ────────────────────────────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated')::text, true); end $$;
set local role authenticated;
select ok((select count(*) from public.noo_people()) >= 3, 'the owner sees every person');
select ok((select roles from public.noo_people() where id = '00000000-0000-4000-d000-000000000031') @> '[{"name":"Member"}]',
  'with their roles');
select lives_ok($$select public.noo_give_role('00000000-0000-4000-d000-000000000031', '00000000-0000-4000-d000-0000000000d1')$$,
  'the owner gives Friend');
reset role;
select is((select granted_by from public.role_assignments where principal_id = '00000000-0000-4000-d000-000000000031'
  and role_id = '00000000-0000-4000-d000-0000000000d1'), (select id from public.profiles where role = 'owner'),
  'stamped as given by the owner');
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated')::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.noo_take_role('00000000-0000-4000-d000-000000000031', '00000000-0000-4000-d000-0000000000d1')$$,
  'and takes it');
reset role;
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-4000-d000-000000000031'), 0,
  'taking a role ends the person''s sessions');
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated')::text, true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_end_sessions((select id from public.profiles where role = 'owner'))$$, '42501', null,
  'never one''s own sessions from here');
select lives_ok($$insert into public.roles (name, created_by) values ('Stamped', '00000000-0000-4000-d000-000000000031')$$,
  'the owner makes a role');
select is((select created_by from public.roles where name = 'Stamped'), (select id from public.profiles where role = 'owner'),
  'stamped as made by the owner, whatever the page sent');
select lives_ok($$select public.noo_set_default_role('00000000-0000-4000-d000-0000000000d1')$$, 'the owner moves the default');
select is((select name from public.roles where is_default), 'Friend', 'to Friend, and only Friend');

-- ── a remover: ends no session of someone holding what it does not ───────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-d000-000000000031', '00000000-0000-4000-d000-0000000000d1');
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000031","role":"authenticated"}', true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_people()$$, '42501', null, 'a member sees no list of people');
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000032","role":"authenticated"}', true); end $$;
set local role authenticated;
select throws_ok($$select public.noo_end_sessions('00000000-0000-4000-d000-000000000031')$$, '42501', null,
  'a remover acts on nobody who holds a permission it lacks');
select throws_ok($$select public.noo_remove_account((select owner from who))$$, '42501', null,
  'and never on the Owner');
select throws_ok($$select public.noo_end_sessions(null)$$, '22023', null, 'and a change that names nobody is refused out loud');

-- ── an invitation admits an address the allowlist does not hold ──────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
insert into public.invitations (email) values ('access4-invited@example.test');
select lives_ok($$insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-d000-000000000033', 'access4-invited@example.test', 'authenticated', 'authenticated')$$,
  'an invited address makes an account');
select throws_ok($$insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-d000-000000000034', 'access4-stranger@example.test', 'authenticated', 'authenticated')$$,
  '42501', null, 'an address with neither still does not');

select * from finish();
rollback;
