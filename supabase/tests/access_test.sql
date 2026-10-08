-- Access, step 1 (Access.md A10, A11): the catalogue, the built-in roles, the one Owner, nobody granting more than
-- they hold, the append-only record and the rules on every new table. `npx supabase test db`. One transaction, rolled
-- back: the accounts and roles made here never outlive the run, and his drafts are never touched.

begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- ── what the migration seeded ────────────────────────────────────────────────
select is((select count(*)::int from public.permissions), 16, 'the catalogue holds the sixteen permissions of A3');
select is((select count(*)::int from public.roles where built_in is not null), 2, 'two built-in roles');
select is((select built_in::text from public.roles where is_default), 'member', 'Member is the default');
select results_eq(
  $$select permission from public.role_permissions rp join public.roles r on r.id = rp.role_id where r.built_in = 'member'$$,
  $$values ('motion.open'::text)$$,
  'Member starts with the motion studio and nothing else');
select ok(exists (
  select 1 from public.role_assignments a join public.roles r on r.id = a.role_id join public.profiles p on p.id = a.principal_id
  where r.built_in = 'owner' and p.role = 'owner'), 'the owner''s account is the Owner');
select ok(exists (select 1 from public.audit_events where action = 'role.made' and actor_id is null),
  'the seed is on the record, by the database');

-- ── test accounts, made as the database: a member, an invited helper, an agent ─
insert into public.allowlist (email, role) values
  ('access-member@example.test', 'viewer'), ('access-helper@example.test', 'viewer'), ('access-agent@example.test', 'viewer');
insert into public.roles (id, name, sentence) values
  ('00000000-0000-4000-a000-0000000000a1', 'Helper', 'Invites people'),
  ('00000000-0000-4000-a000-0000000000a2', 'Friend', 'Opens Home');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-a000-0000000000a1', 'admin.invitations.manage'),
  ('00000000-0000-4000-a000-0000000000a1', 'motion.open'),
  ('00000000-0000-4000-a000-0000000000a2', 'home.open');
insert into public.invitations (email) values ('access-helper@example.test');
insert into public.invitation_roles (email, role_id) values ('access-helper@example.test', '00000000-0000-4000-a000-0000000000a1');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'access-member@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'access-helper@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000003', 'access-agent@example.test', 'authenticated', 'authenticated');
update public.profiles set kind = 'agent' where id = '00000000-0000-4000-a000-000000000003';

select results_eq(
  $$select r.name from public.role_assignments a join public.roles r on r.id = a.role_id where a.principal_id = '00000000-0000-4000-a000-000000000001'$$,
  $$values ('Member'::text)$$, 'a sign-up with no invitation gets the default');
select results_eq(
  $$select r.name from public.role_assignments a join public.roles r on r.id = a.role_id where a.principal_id = '00000000-0000-4000-a000-000000000002'$$,
  $$values ('Helper'::text)$$, 'an invited sign-up gets the invitation''s roles instead');
select isnt((select used_at from public.invitations where email = 'access-helper@example.test'), null, 'the invitation is used up');

-- ── as the database: the locks that hold for everyone ────────────────────────
select throws_ok($$insert into public.role_assignments (principal_id, role_id)
  select '00000000-0000-4000-a000-000000000001', id from public.roles where built_in = 'owner'$$,
  '23505', null, 'there is one Owner');
select throws_ok($$delete from public.roles where built_in = 'member'$$, '42501', null, 'a built-in role is never deleted');
select throws_ok($$delete from public.roles where id = '00000000-0000-4000-a000-0000000000a1'$$, '23503', null,
  'a role still held is not deleted');
set constraints roles_one_default_check immediate;
select throws_ok($$update public.roles set is_default = false where built_in = 'member'$$, '23514', null,
  'there is always exactly one default');
set constraints roles_one_default_check deferred;
select throws_ok($$update public.audit_events set action = 'x'$$, '42501', null, 'the record is append-only, even for the database');
select throws_ok($$insert into public.role_permissions (role_id, permission)
  select id, 'home.open' from public.roles where built_in = 'owner'$$, '42501', null, 'the Owner holds everything without rows');

-- ── as the owner ─────────────────────────────────────────────────────────────
-- Who the request is, set while still the database: as `authenticated`, row security would hide the owner's profile.
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select ok(public.noo_can('home.open') and public.noo_can('admin.roles.manage'), 'the owner may do anything');
select lives_ok($$insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000a2')$$, 'the owner gives a member Friend');
select throws_ok($$insert into public.role_assignments (principal_id, role_id)
  select '00000000-0000-4000-a000-000000000001', id from public.roles where built_in = 'owner'$$,
  '42501', null, 'the Owner is never given through a request, even by the owner');
select throws_ok($$delete from public.role_assignments a using public.roles r
  where r.id = a.role_id and r.built_in = 'owner'$$, '42501', null, 'the Owner is never taken through a request');
select ok(exists (select 1 from public.audit_events where action = 'role.given'
  and actor_id = (select id from public.profiles where role = 'owner')), 'a role given is on the record, by who gave it');

-- ── as the member (Member and, since just now, Friend) ───────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-000000000001', 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
select ok(public.noo_can('motion.open') and public.noo_can('home.open'), 'a member holds what their roles grant');
select ok(not public.noo_can('admin.open'), 'and nothing else');
select throws_ok($$insert into public.role_permissions (role_id, permission)
  select id, 'admin.open' from public.roles where built_in = 'member'$$, '42501', null, 'a member cannot change a role');
select is_empty($$select 1 from public.audit_events$$, 'a member cannot read the record');
select is((select count(*)::int from public.role_assignments), 2, 'a member sees only its own roles');
select lives_ok($$insert into public.delegations (agent_id, on_behalf_of, purpose, expires_at)
  values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000001', 'a test', now() + interval '1 hour')$$,
  'a person lets an agent act for them');
select throws_ok($$insert into public.delegations (agent_id, on_behalf_of, purpose, expires_at)
  values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000002', 'not mine', now() + interval '1 hour')$$,
  '42501', null, 'but never for someone else');

-- ── as the helper (Helper: invitations and the motion studio) ────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-000000000002', 'role', 'authenticated', 'aal', 'aal2', 'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
select lives_ok($$insert into public.invitations (email) values ('access-next@example.test');
  insert into public.invitation_roles (email, role_id) select 'access-next@example.test', id from public.roles where built_in = 'member'$$,
  'a helper invites with a role it holds all of');
select throws_ok($$insert into public.invitation_roles (email, role_id) values
  ('access-next@example.test', '00000000-0000-4000-a000-0000000000a2')$$, '42501', null,
  'but never with a permission it lacks');

-- ── as nobody ────────────────────────────────────────────────────────────────
reset role;
set local role anon;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
select ok(not public.noo_can('motion.open'), 'a visitor holds nothing');
select throws_ok($$select 1 from public.roles$$, '42501', null, 'and reads none of the access tables');

reset role;
select * from finish();
rollback;
