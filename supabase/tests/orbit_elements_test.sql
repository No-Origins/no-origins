-- Orbit's elements and world (World.md W73): the kinds, who makes, saves and publishes them, and what a visitor sees.
-- `npx supabase test db`. One transaction, rolled back. Writes only to the items made here.

begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select is(public.noo_studio_app('mountain'::public.noo_studio_kind), 'orbit', 'a mountain is Orbit''s');
select is(public.noo_studio_app('world'::public.noo_studio_kind), 'orbit', 'and so is the world');
select is(public.noo_studio_app('action'::public.noo_studio_kind), 'motion', 'an action is still the motion studio''s');

-- ── people and things made as the database ───────────────────────────────────
insert into public.allowlist (email, role) values
  ('orbit-drafter@example.test', 'viewer'), ('orbit-publisher@example.test', 'viewer'), ('orbit-member@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-b000-000000000021', 'orbit-drafter@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000022', 'orbit-publisher@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000023', 'orbit-member@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-b000-0000000000d1', 'Orbit element drafter'), ('00000000-0000-4000-b000-0000000000d2', 'Orbit element publisher');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-b000-0000000000d1', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000d2', 'orbit.draft.save'),
  ('00000000-0000-4000-b000-0000000000d2', 'orbit.version.publish');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-b000-000000000021', '00000000-0000-4000-b000-0000000000d1'),
  ('00000000-0000-4000-b000-000000000022', '00000000-0000-4000-b000-0000000000d2');

-- The shape: an element names no character and no slot.
select throws_ok($$insert into public.studio_items (kind, name, slot) values ('mountain', 'With a slot', 'brows')$$, '23514', null,
  'a mountain with a slot is refused');

-- ── a drafter: makes a variant with its draft, and the world; publishes nothing ──
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000021', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000e1', 'mountain', 'Test mountain')$$,
  'a drafter makes a mountain variant, with the id the app gave it');
select lives_ok($$insert into public.studio_drafts (item_id, data) values ('00000000-0000-4000-b000-0000000000e1', '{"height":120}')$$,
  'and its first draft');
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000e2', 'world', 'Test world')$$,
  'and the world');
select lives_ok($$insert into public.studio_drafts (item_id, data) values ('00000000-0000-4000-b000-0000000000e2', '{"units":[],"assets":[]}')$$,
  'with its draft');
select lives_ok($$update public.studio_drafts set data = '{"height":150}' where item_id = '00000000-0000-4000-b000-0000000000e1' and rev = 0$$,
  'saves the draft on its rev');
select throws_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000e1', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000e1'), null, 'minor')$$,
  '42501', null, 'but publishes none');

-- ── a publisher: publishes the drafter's variant, which becomes the one shown ──
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000022', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000e1', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000e1'), null, 'minor')$$,
  'a publisher publishes the variant');
select is((select v.number || '.' || v.minor from public.studio_items i join public.studio_versions v on v.id = i.current_version_id where i.id = '00000000-0000-4000-b000-0000000000e1'),
  '1.0', 'and it is version 1.0, the one the world shows');
select lives_ok($$update public.studio_items set name = 'Test mountain, renamed' where id = '00000000-0000-4000-b000-0000000000e1'$$,
  'and renames it');

-- ── a member with neither: nothing made ──────────────────────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-b000-000000000023', 'role', 'authenticated', 'aal', 'aal1', 'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$insert into public.studio_items (kind, name) values ('tree', 'Not mine')$$, '42501', null,
  'an account that may not save makes no variant');

-- ── a visitor: the variants and the world as published, never a draft ────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role anon;
select ok(exists (select 1 from public.studio_items where id = '00000000-0000-4000-b000-0000000000e1' and current_version_id is not null),
  'a visitor sees the published mountain and which version it shows');
select ok(exists (select 1 from public.studio_versions where item_id = '00000000-0000-4000-b000-0000000000e1' and data = '{"height":150}'),
  'and the version''s settings');
select throws_ok($$select 1 from public.studio_drafts$$, '42501', null, 'and no draft: a visitor may not even look');

reset role;
select * from finish();
rollback;
