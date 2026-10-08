-- Access, step 2 (Access.md A6, A11): every rule asks for a permission. `npx supabase test db`. One transaction, rolled
-- back. Writes only to the items made here; his own drafts and versions are read, never written.

begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select is((select count(*)::int from pg_policies where coalesce(qual, '') ~ 'noo_is\(' or coalesce(with_check, '') ~ 'noo_is\('),
  0, 'no rule asks for an old role');

-- ── people and things made as the database ───────────────────────────────────
insert into public.allowlist (email, role) values
  ('access2-member@example.test', 'viewer'), ('access2-editor@example.test', 'viewer'), ('access2-drafter@example.test', 'viewer');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-b000-000000000011', 'access2-member@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000012', 'access2-editor@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-000000000013', 'access2-drafter@example.test', 'authenticated', 'authenticated');
insert into public.roles (id, name) values
  ('00000000-0000-4000-b000-0000000000b1', 'Motion editor'), ('00000000-0000-4000-b000-0000000000b2', 'Orbit drafter');
insert into public.role_permissions (role_id, permission) values
  ('00000000-0000-4000-b000-0000000000b1', 'motion.draft.save'),
  ('00000000-0000-4000-b000-0000000000b1', 'motion.version.publish'),
  ('00000000-0000-4000-b000-0000000000b2', 'orbit.draft.save');
insert into public.role_assignments (principal_id, role_id) values
  ('00000000-0000-4000-b000-000000000012', '00000000-0000-4000-b000-0000000000b1'),
  ('00000000-0000-4000-b000-000000000013', '00000000-0000-4000-b000-0000000000b2');
insert into public.studio_items (id, kind, name) values
  ('00000000-0000-4000-b000-0000000000c1', 'action', 'Access test action'),
  ('00000000-0000-4000-b000-0000000000c2', 'character', 'Access test character');
insert into public.studio_drafts (item_id, data) values
  ('00000000-0000-4000-b000-0000000000c1', '{"action":"bounce","values":{}}'),
  ('00000000-0000-4000-b000-0000000000c2', '{}');

create temporary table counts on commit drop as select
  (select count(*)::int from public.studio_drafts) as drafts,
  (select count(*)::int from public.studio_items where kind in ('action', 'motion')) as actions,
  (select count(*)::int from public.studio_items where kind = 'character') as characters,
  (select count(*)::int from public.profiles) as profiles,
  (select count(*)::int from public.allowlist) as allowlisted;
grant select on counts to authenticated, anon;

-- ── the owner: nothing he could do before is lost ────────────────────────────
do $$ begin perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner'), 'role', 'authenticated', 'aal', 'aal2')::text, true); end $$;
set local role authenticated;
select is((select count(*)::int from public.studio_drafts), (select drafts from counts), 'the owner reads every draft');
select is((select count(*)::int from public.profiles), (select profiles from counts), 'the owner reads every profile');
select is((select count(*)::int from public.allowlist), (select allowlisted from counts), 'the owner reads the allowlist');
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000c1', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000c1'), null, 'major')$$,
  'the owner publishes an action');

-- ── a member: the published actions, no drafts, no saving ────────────────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000011","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select is((select count(*)::int from public.studio_items where kind in ('action', 'motion')), (select actions from counts),
  'a member sees every action');
select ok(exists (select 1 from public.studio_versions where item_id = '00000000-0000-4000-b000-0000000000c1'),
  'and their published versions');
select is_empty($$select 1 from public.studio_drafts$$, 'but no draft');
select is_empty($$update public.studio_drafts set data = '{}' where item_id = '00000000-0000-4000-b000-0000000000c1' returning 1$$,
  'and saves none');
select throws_ok($$insert into public.studio_items (kind, name) values ('action', 'not mine')$$, '42501', null,
  'and makes no action');
select is((select count(*)::int from public.studio_items where kind = 'character'), (select characters from counts),
  'a member sees every agent''s look, as everyone does');
select is((select count(*)::int from public.profiles), 1, 'a member reads only its own profile');
select is_empty($$select 1 from public.allowlist$$, 'and nothing of the allowlist');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('assets', 'access-test')$$, '42501', null,
  'and writes nothing to the 1.0 buckets');

-- ── a motion editor: the motion studio's drafts and versions, not Orbit's ────
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000012","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select lives_ok($$insert into public.studio_items (id, kind, name) values ('00000000-0000-4000-b000-0000000000c3', 'action', 'Access test action two');
  insert into public.studio_drafts (item_id, data) values ('00000000-0000-4000-b000-0000000000c3', '{}')$$,
  'a motion editor makes an action with its first draft');
select isnt_empty($$update public.studio_drafts set data = '{"action":"bounce","values":{"x":1}}'
  where item_id = '00000000-0000-4000-b000-0000000000c1' returning 1$$, 'and saves an action''s draft');
select lives_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000c1', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000c1'), null, 'minor')$$,
  'and publishes it, the item showing the new version');
select is_empty($$update public.studio_drafts set data = '{}' where item_id = '00000000-0000-4000-b000-0000000000c2' returning 1$$,
  'but never saves an agent''s look');

-- ── an Orbit drafter: saves a look, publishes none, makes no agent ──────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000013","role":"authenticated","aal":"aal2"}', true); end $$;
set local role authenticated;
select isnt_empty($$update public.studio_drafts set data = '{"paint":"teal"}' where item_id = '00000000-0000-4000-b000-0000000000c2' returning 1$$,
  'an Orbit drafter saves a look''s draft');
select throws_ok($$select public.studio_publish('00000000-0000-4000-b000-0000000000c2', 'test',
  (select rev from public.studio_drafts where item_id = '00000000-0000-4000-b000-0000000000c2'), null, 'major')$$,
  '42501', null, 'but publishes none');
select throws_ok($$select public.studio_new_character('Not mine', '{}')$$, '42501', null, 'and makes no agent');

-- ── a visitor: the agents as published, nothing of the motion studio ─────────
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role anon;
select ok((select count(*) from public.studio_items where kind = 'character') > 0, 'a visitor sees the agents');
select is_empty($$select 1 from public.studio_items where kind in ('action', 'motion')$$, 'and no action');

reset role;
select * from finish();
rollback;
