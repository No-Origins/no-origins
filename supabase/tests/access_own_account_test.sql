-- Access, deleting one's own account (Access.md A2; Admin.md §8.4 step 5). `npx supabase test db`. One transaction,
-- rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into public.allowlist (email, role) values
  ('own-member@example.test', 'viewer'), ('own-keeper@example.test', 'viewer'),
  ('own-coded@example.test', 'viewer'), ('own-agent@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-e800-000000000081', 'own-member@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e800-000000000082', 'own-keeper@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e800-000000000083', 'own-coded@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e800-000000000084', 'own-agent@example.test', 'authenticated', 'authenticated');
update public.profiles set kind = 'agent' where id = '00000000-0000-4000-e800-000000000084';
-- A role its holder could not grant: only the Owner gives `admin.people.assign` (A4).
insert into public.roles (id, name) values ('00000000-0000-4000-e800-0000000000b1', 'Keeper');
insert into public.role_permissions (role_id, permission) values ('00000000-0000-4000-e800-0000000000b1', 'admin.people.assign');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-e800-000000000082', '00000000-0000-4000-e800-0000000000b1');
-- An authenticator, verified.
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at) values
  ('00000000-0000-4000-e800-0000000000f1', '00000000-0000-4000-e800-000000000083', 'Phone', 'totp', 'verified', now(), now());

-- Signed in as `p_id`; a code entered `p_ago` seconds ago, or none.
create function pg_temp.as_person(p_id uuid, p_ago int default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', p_id, 'role', 'authenticated', 'aal', case when p_ago is null then 'aal1' else 'aal2' end,
    'amr', case when p_ago is null
      then json_build_array(json_build_object('method', 'password', 'timestamp', extract(epoch from now())::bigint - 60))
      else json_build_array(json_build_object('method', 'password', 'timestamp', extract(epoch from now())::bigint - 3600),
                            json_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint - p_ago)) end
  )::text, true);
end;
$$;

-- ── nobody, the Owner, an agent ──────────────────────────────────────────────
set local role anon;
select throws_ok($$select public.noo_delete_own_account()$$, '42501', null, 'nobody signed in deletes nothing');
reset role;

select pg_temp.as_person((select id from public.profiles where role = 'owner'), 5);
set local role authenticated;
select throws_ok($$select public.noo_delete_own_account()$$, '42501', null, 'the Owner''s account is never deleted');
reset role;
select ok(exists (select 1 from auth.users where id = (select id from public.profiles where role = 'owner')), 'and is still here');

select pg_temp.as_person('00000000-0000-4000-e800-000000000084');
set local role authenticated;
select throws_ok($$select public.noo_delete_own_account()$$, '42501', null, 'an agent is retired from the admin, not here');
reset role;

-- ── a member ─────────────────────────────────────────────────────────────────
select pg_temp.as_person('00000000-0000-4000-e800-000000000081');
set local role authenticated;
select lives_ok($$select public.noo_delete_own_account()$$, 'a member deletes their own account');
reset role;
select ok(not exists (select 1 from auth.users where id = '00000000-0000-4000-e800-000000000081'), 'the account is gone');
select ok(not exists (select 1 from public.profiles where id = '00000000-0000-4000-e800-000000000081'), 'and its profile');
select ok(not exists (select 1 from public.role_assignments where principal_id = '00000000-0000-4000-e800-000000000081'), 'and its roles');
select ok(exists (select 1 from public.audit_events where action = 'account.deleted' and actor_id = '00000000-0000-4000-e800-000000000081'),
  'the record stays: who, and that they deleted it');

-- ── a role its holder could not grant goes with the account ──────────────────
select pg_temp.as_person('00000000-0000-4000-e800-000000000082');
set local role authenticated;
select lives_ok($$select public.noo_delete_own_account()$$, 'holding a role they could not grant, they still delete their own account');
reset role;
select ok(not exists (select 1 from public.role_assignments where principal_id = '00000000-0000-4000-e800-000000000082'), 'its roles went with it');

-- ── with an authenticator: a code from the last five minutes ─────────────────
select pg_temp.as_person('00000000-0000-4000-e800-000000000083');
set local role authenticated;
select throws_ok($$select public.noo_delete_own_account()$$, 'NOAAL', null, 'with an authenticator and no code, it asks for one');
reset role;
select pg_temp.as_person('00000000-0000-4000-e800-000000000083', 600);
set local role authenticated;
select throws_ok($$select public.noo_delete_own_account()$$, 'NOAAL', null, 'a code ten minutes old is not enough');
reset role;
select pg_temp.as_person('00000000-0000-4000-e800-000000000083', 5);
set local role authenticated;
select lives_ok($$select public.noo_delete_own_account()$$, 'with a code just entered, it goes');
reset role;
select ok(not exists (select 1 from auth.mfa_factors where user_id = '00000000-0000-4000-e800-000000000083'), 'and its authenticator with it');

select * from finish();
rollback;
