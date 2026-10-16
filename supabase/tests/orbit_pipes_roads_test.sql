-- Orbit's pipes and roads (World.md W84): each an element's variant, made, saved and published as a tree's is; who
-- makes and publishes one, and what a visitor sees.
-- `npx supabase test db`. One transaction, rolled back. Writes only to the items made here.

begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select is(public.noo_studio_app('pipe'::public.noo_studio_kind), 'orbit', 'a pipe is Orbit''s');
select is(public.noo_studio_app('road'::public.noo_studio_kind), 'orbit', 'a road is Orbit''s');

-- ── people made as the database ──────────────────────────────────────────────
insert into public.allowlist (email, role) values
  ('pipe-drafter@example.test', 'viewer'), ('pipe-publisher@example.test', 'viewer'), ('pipe-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-b000-000000000041', 'pipe-drafter@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000042', 'pipe-publisher@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000043', 'pipe-member@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-b000-0000000000e1', 'Orbit pipes drafter'), ('00000000-0000-4000-b000-0000000000e2', 'Orbit pipes publisher');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-b000-0000000000e1', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000e2', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000e2', 'orbit.version.publish');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-b000-000000000041', '00000000-0000-4000-b000-0000000000e1'),
  ('00000000-0000-4000-b000-000000000042', '00000000-0000-4000-b000-0000000000e2');

-- The shape: a pipe names no character and no slot.
select throws_ok($$insert into public.studio_items (kind, name, slot) values ('pipe', 'With a slot', 'brows')$$, '23514', null,
  'a pipe with a slot is refused');

-- ── a drafter: makes a pipe and a road with their drafts; publishes neither ──
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000041', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000e3', 'pipe', 'Test pipe')$$,
  'a drafter makes a pipe, with the id the app gave it');
select lives_ok($$insert into public.studio_drafts (item_id, data) values ('00000000-0000-4000-b000-0000000000e3', '{"radius":1.5}')$$,
  'and its first draft');
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000e4', 'road', 'Test road')$$,
  'and a road');
select throws_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000e3', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000e3'), null, 'minor')$$,
  '42501', null, 'but publishes neither');

-- ── a publisher: publishes the pipe ──────────────────────────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000042', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000e3', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000e3'), null, 'minor')$$,
  'a publisher publishes the pipe');
select is((select v.number || '.' || v.minor from public.studio_items i join public.studio_versions v on v.id = i.current_version_id where i.id = '00000000-0000-4000-b000-0000000000e3'),
  '1.0', 'as version 1.0');

-- ── a member with neither: nothing made ──────────────────────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000043', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$insert into public.studio_items (kind, name) values ('road', 'Not mine')$$, '42501', null,
  'an account that may not save makes no road');

-- ── a visitor: the pipe as published, never the draft ────────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role anon;
select ok(exists (select 1 from public.studio_versions v join public.studio_items i on i.current_version_id = v.id
  where i.id = '00000000-0000-4000-b000-0000000000e3' and v.data = '{"radius":1.5}'),
  'a visitor reads the version the world shows');
select throws_ok($$select 1 from public.studio_drafts$$, '42501', null, 'and no draft: a visitor may not even look');

reset role;
select * from finish();
rollback;
