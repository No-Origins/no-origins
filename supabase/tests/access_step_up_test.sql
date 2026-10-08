-- Access, the admin's second factor, step 4 (Access.md A12): the gravest changes need a code from the last five
-- minutes, and the admin is people's. `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into public.allowlist (email, role) values
  ('access-up-person@example.test', 'viewer'), ('access-up-other@example.test', 'viewer'),
  ('access-up-agent@example.test', 'viewer'), ('access-up-gone@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-e300-000000000071', 'access-up-person@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e300-000000000072', 'access-up-other@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e300-000000000073', 'access-up-agent@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e300-000000000074', 'access-up-gone@example.test', 'authenticated', 'authenticated');
update public.profiles set kind = 'agent' where id = '00000000-0000-4000-e300-000000000073';
insert into public.roles (id, name) values
  ('00000000-0000-4000-e300-0000000000a1', 'Auditor'), ('00000000-0000-4000-e300-0000000000a2', 'Friend'),
  ('00000000-0000-4000-e300-0000000000a3', 'Builder');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-e300-0000000000a1', 'admin.audit.view'),
  ('00000000-0000-4000-e300-0000000000a2', 'home.open'),
  ('00000000-0000-4000-e300-0000000000a3', 'motion.open');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-e300-000000000073', '00000000-0000-4000-e300-0000000000a3');
insert into public.invitations (email) values ('access-up-invited@example.test');

-- The Owner, two factors, the code entered `p_ago` seconds ago by `p_method`.
create function pg_temp.owner(p_ago int, p_method text default 'totp') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2',
    'amr', json_build_array(json_build_object('method', 'magiclink', 'timestamp', extract(epoch from now())::bigint - 3600),
                            json_build_object('method', p_method, 'timestamp', extract(epoch from now())::bigint - p_ago))
  )::text, true);
end;
$$;

-- ── a code ten minutes old: the gravest changes are refused, the rest go on ──
select pg_temp.owner(600);
set local role authenticated;
select ok(public.noo_can('admin.roles.manage') and not public.noo_second_factor_within(), 'two factors, but the code is ten minutes old');
select throws_ok($$select public.noo_save_role('00000000-0000-4000-e300-0000000000a2', 'Friend', '', array['home.open', 'admin.people.view'])$$,
  'NOAAL', null, 'ticking an admin permission into a role asks for a fresh code');
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e300-0000000000a2', 'Friend', '', array['home.open', 'motion.open'])$$,
  'ticking any other goes on');
select throws_ok($$select public.noo_give_role('00000000-0000-4000-e300-000000000071', '00000000-0000-4000-e300-0000000000a1')$$,
  'NOAAL', null, 'giving a role that holds an admin permission asks');
select lives_ok($$select public.noo_give_role('00000000-0000-4000-e300-000000000071', '00000000-0000-4000-e300-0000000000a2')$$,
  'giving any other goes on');
select throws_ok($$insert into public.invitation_roles (email, role_id) values ('access-up-invited@example.test', '00000000-0000-4000-e300-0000000000a1')$$,
  'NOAAL', null, 'and so does inviting with one');
select throws_ok($$select public.noo_remove_account('00000000-0000-4000-e300-000000000074')$$,
  'NOAAL', null, 'removing an account asks');
reset role;

-- ── a code just entered, or a passkey just used ──────────────────────────────
select pg_temp.owner(5);
set local role authenticated;
select lives_ok($$select public.noo_give_role('00000000-0000-4000-e300-000000000071', '00000000-0000-4000-e300-0000000000a1')$$,
  'with a fresh code the Owner gives the Auditor role');
select lives_ok($$select public.noo_save_role('00000000-0000-4000-e300-0000000000a2', 'Friend', '', array['home.open', 'motion.open', 'admin.people.view'])$$,
  'and ticks an admin permission');
reset role;
select pg_temp.owner(30, 'passkey');
set local role authenticated;
select lives_ok($$select public.noo_remove_account('00000000-0000-4000-e300-000000000074')$$, 'a passkey sign-in just made removes an account');
reset role;
select is((select count(*)::int from auth.users where id = '00000000-0000-4000-e300-000000000074'), 0, 'and it is gone');

-- ── the admin is people's ────────────────────────────────────────────────────
select pg_temp.owner(5);
set local role authenticated;
select throws_ok($$select public.noo_give_role('00000000-0000-4000-e300-000000000073', '00000000-0000-4000-e300-0000000000a1')$$,
  '42501', null, 'no agent is given a role that holds an admin permission, fresh code or not');
select throws_ok($$select public.noo_save_role('00000000-0000-4000-e300-0000000000a3', 'Builder', '', array['motion.open', 'admin.audit.view'])$$,
  '42501', null, 'nor is one ticked into a role an agent holds');
reset role;
select pg_temp.owner(5);
set local role authenticated;
select throws_ok($$update public.profiles set kind = 'agent' where id = '00000000-0000-4000-e300-000000000071'$$,
  '42501', null, 'and an account holding one never becomes an agent');
reset role;

-- ── the database itself is not asked ─────────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
select lives_ok($$insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-e300-000000000072', '00000000-0000-4000-e300-0000000000a1')$$,
  'a request with no session — a migration, the CLI — gives an admin role without a code');
select is((select count(*)::int from public.role_assignments where role_id = '00000000-0000-4000-e300-0000000000a1'), 2,
  'and the Auditor is held twice now');

select * from finish();
rollback;
