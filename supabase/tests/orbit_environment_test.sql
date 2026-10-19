-- Orbit's environment (World.md W75): one item, unnamed on its cards, saved as a draft and published version after
-- version; who makes, saves and publishes it, and what a visitor sees.
-- `npx supabase test db`. One transaction, rolled back. Writes only to the item made here.

begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select is(public.noo_studio_app('environment'::public.noo_studio_kind), 'orbit', 'the environment is Orbit''s');

-- ── people made as the database ──────────────────────────────────────────────
insert into public.allowlist (email, role) values
  ('env-drafter@example.test', 'viewer'), ('env-publisher@example.test', 'viewer'), ('env-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-b000-000000000031', 'env-drafter@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000032', 'env-publisher@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000033', 'env-member@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-b000-0000000000f1', 'Orbit environment drafter'), ('00000000-0000-4000-b000-0000000000f2', 'Orbit environment publisher');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-b000-0000000000f1', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000f2', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000f2', 'orbit.version.publish');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-b000-000000000031', '00000000-0000-4000-b000-0000000000f1'),
  ('00000000-0000-4000-b000-000000000032', '00000000-0000-4000-b000-0000000000f2');

-- The shape: the environment names no character and no slot.
select throws_ok($$insert into public.studio_items (kind, name, slot) values ('environment', 'With a slot', 'brows')$$, '23514', null,
  'an environment with a slot is refused');

-- ── a drafter: makes the environment with its draft and saves it; publishes nothing ──
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000031', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000f3', 'environment', 'Test environment')$$,
  'a drafter makes the environment, with the id the app gave it');
select lives_ok($$insert into public.studio_drafts (item_id, data) values ('00000000-0000-4000-b000-0000000000f3', '{"atmosphere":{"fogFrom":180}}')$$,
  'and its first draft');
select lives_ok($$update public.studio_drafts set data = '{"atmosphere":{"fogFrom":200}}' where item_id = '00000000-0000-4000-b000-0000000000f3' and rev = 0$$,
  'saves the draft on its rev');
select throws_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000f3', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000f3'), null, 'minor')$$,
  '42501', null, 'but publishes none');

-- ── a publisher: publishes it, then the next draft as the next version ───────
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000032', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000f3', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000f3'), null, 'minor')$$,
  'a publisher publishes the environment');
select is((select v.number || '.' || v.minor from public.studio_items i join public.studio_versions v on v.id = i.current_version_id where i.id = '00000000-0000-4000-b000-0000000000f3'),
  '1.0', 'as version 1.0');
select lives_ok($$update public.studio_drafts set data = '{"atmosphere":{"fogFrom":240}}' where item_id = '00000000-0000-4000-b000-0000000000f3'$$,
  'saves it again');
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000f3', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000f3'), null, 'minor')$$,
  'and publishes again');
select is((select v.number || '.' || v.minor from public.studio_items i join public.studio_versions v on v.id = i.current_version_id where i.id = '00000000-0000-4000-b000-0000000000f3'),
  '1.1', 'as the next version, 1.1, the one the world shows');

-- ── a member with neither: nothing made ──────────────────────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000033', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$insert into public.studio_items (kind, name) values ('environment', 'Not mine')$$, '42501', null,
  'an account that may not save makes no environment');

-- ── a visitor: the environment as published, never the draft ─────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role anon;
select ok(exists (select 1 from public.studio_versions v join public.studio_items i on i.current_version_id = v.id
  where i.id = '00000000-0000-4000-b000-0000000000f3' and v.data = '{"atmosphere":{"fogFrom":240}}'),
  'a visitor reads the version the world shows');
select throws_ok($$select 1 from public.studio_drafts$$, '42501', null, 'and no draft: a visitor may not even look');

reset role;
select * from finish();
rollback;
