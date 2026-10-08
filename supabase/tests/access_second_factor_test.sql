-- Access, the admin's second factor (Access.md A12, step 3): an admin.* permission counts only at aal2 or after a
-- passkey sign-in. `npx supabase test db`. One transaction, rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.allowlist (email, role) values ('access-2fa-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-e200-000000000061', 'access-2fa-member@example.test', 'authenticated', 'authenticated');

create function pg_temp.as_owner(p_claims jsonb) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    (jsonb_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated') || p_claims)::text, true);
end;
$$;

-- ── one factor: the Owner holds no admin.* permission ────────────────────────
select pg_temp.as_owner('{"aal":"aal1","amr":[{"method":"magiclink","timestamp":1}]}');
set local role authenticated;
select ok(not public.noo_second_factor(), 'a magic link alone is one factor');
select ok(not public.noo_can('admin.open'), 'the Owner on one factor does not hold admin.open');
select ok(not public.noo_can('admin.roles.manage'), 'nor any admin.* permission');
select ok(public.noo_can('motion.open') and public.noo_can('home.open'), 'every other permission is unchanged');
select throws_ok($$select public.noo_people()$$, '42501', null, 'the admin''s functions refuse on one factor');
select is((select count(*)::int from public.roles), 1, 'and its rules show only the roles one holds');
reset role;

-- ── two factors ──────────────────────────────────────────────────────────────
select pg_temp.as_owner('{"aal":"aal2","amr":[{"method":"magiclink","timestamp":1},{"method":"totp","timestamp":2}]}');
set local role authenticated;
select ok(public.noo_second_factor() and public.noo_can('admin.open'), 'after a code the Owner holds admin.open');
select ok((select count(*) from public.noo_people()) >= 2, 'and the admin''s functions answer');
select ok((select count(*)::int from public.roles) >= 2, 'and its rules show every role');
reset role;

-- ── a passkey sign-in is both factors (his, 2026-10-08) ──────────────────────
select pg_temp.as_owner('{"aal":"aal1","amr":[{"method":"passkey","timestamp":1}]}');
set local role authenticated;
select ok(public.noo_second_factor() and public.noo_can('admin.open'), 'a passkey sign-in holds admin.open');
reset role;
select pg_temp.as_owner('{"aal":"aal1","amr":["passkey"]}');
set local role authenticated;
select ok(public.noo_can('admin.open'), 'in the plain list of method names too');
reset role;

-- ── a member, on one factor, as before ───────────────────────────────────────
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e200-000000000061","role":"authenticated","aal":"aal1"}', true); end $$;
set local role authenticated;
select ok(public.noo_can('motion.open'), 'a member opens the motion studio on one factor');
select ok(not public.noo_can('admin.open'), 'and holds no admin.* permission, as before');
reset role;

select * from finish();
rollback;
