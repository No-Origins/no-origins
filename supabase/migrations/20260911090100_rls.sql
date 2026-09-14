-- =============================================================================
-- Row level security — Admin.md §8.3
--
-- **Deny by default on every table.** RLS is enabled everywhere below and a
-- table with no policy for an operation refuses it; nothing here grants broadly
-- and narrows afterwards.
--
-- **No anon policy, anywhere, deliberately.** §8.3: the public site never queries
-- Supabase with the anon key — published documents reach it through the pipeline
-- (§9). A public read policy would be a second door into the same data with
-- different rules, and two doors is how one of them gets left open.
--
-- One row exists today. The role shape is here anyway so the second person is a
-- seed row rather than a migration.
-- =============================================================================

-- The current user's role, read once per statement.
--
-- `security definer` is not decoration: without it, reading `profiles` from
-- inside a `profiles` policy is infinite recursion, and Postgres says so at
-- query time rather than at migration time. `set search_path = ''` is the other
-- half — a definer function that resolves names through the caller's search_path
-- is a privilege-escalation hole, so every name below is schema-qualified.
create or replace function public.noo_current_role()
returns public.noo_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

revoke execute on function public.noo_current_role() from public;
grant execute on function public.noo_current_role() to authenticated;

create or replace function public.noo_is(variadic roles public.noo_role[])
returns boolean
language sql
stable
as $$
  select public.noo_current_role() = any (roles);
$$;

grant execute on function public.noo_is(public.noo_role[]) to authenticated;

comment on function public.noo_is(public.noo_role[]) is
  'The single policy shape of §8.3. `noo_is(''owner'',''editor'')` reads as the '
  'sentence the rule was written as.';

-- ── enable, everywhere, first ────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.allowlist         enable row level security;
alter table public.projects          enable row level security;
alter table public.documents         enable row level security;
alter table public.document_versions enable row level security;
alter table public.systems           enable row level security;
alter table public.products          enable row level security;
alter table public.product_installs  enable row level security;
alter table public.assets            enable row level security;
alter table public.audit_log         enable row level security;

-- ── identity ─────────────────────────────────────────────────────────────────
create policy profiles_read_self_or_owner on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.noo_is('owner'));

create policy profiles_write_owner on public.profiles
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

-- The membership list is the gate itself, so only the owner touches it.
create policy allowlist_owner on public.allowlist
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

-- ── layer 1 ──────────────────────────────────────────────────────────────────
create policy projects_read on public.projects
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy projects_write on public.projects
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

create policy documents_read on public.documents
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

-- An editor may change the draft and move the pointer; only the owner may add or
-- remove a document. §8.3: "editor (documents and drafts, may publish)".
create policy documents_update on public.documents
  for update to authenticated
  using (public.noo_is('owner', 'editor')) with check (public.noo_is('owner', 'editor'));

create policy documents_insert on public.documents
  for insert to authenticated with check (public.noo_is('owner'));

create policy documents_delete on public.documents
  for delete to authenticated using (public.noo_is('owner'));

create policy document_versions_read on public.document_versions
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy document_versions_insert on public.document_versions
  for insert to authenticated with check (public.noo_is('owner', 'editor'));

-- No update policy and no delete policy above — that is the append-only rule, and
-- for the `authenticated` role it is already complete.
--
-- This trigger exists because RLS is not the whole story: the admin's route
-- handlers hold the service role key (§8), and the service role bypasses RLS. A
-- trigger does not care which role you are. Published history is the one thing
-- in this schema that must not be quietly rewritten, so it is defended twice.
create or replace function public.noo_versions_are_append_only()
returns trigger language plpgsql as $$
begin
  raise exception
    'document_versions is append-only: publish a new version instead of % on %',
    lower(tg_op), old.id
    using errcode = 'restrict_violation';
end;
$$;

create trigger document_versions_no_update
  before update on public.document_versions
  for each row execute function public.noo_versions_are_append_only();

create trigger document_versions_no_delete
  before delete on public.document_versions
  for each row execute function public.noo_versions_are_append_only();

-- ── layer 2 ──────────────────────────────────────────────────────────────────
create policy systems_read on public.systems
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy systems_write on public.systems
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

-- ── layer 3 ──────────────────────────────────────────────────────────────────
create policy products_read on public.products
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy products_write on public.products
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

create policy product_installs_read on public.product_installs
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy product_installs_write on public.product_installs
  for all to authenticated
  using (public.noo_is('owner')) with check (public.noo_is('owner'));

-- ── shared ───────────────────────────────────────────────────────────────────
create policy assets_read on public.assets
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy assets_write on public.assets
  for insert to authenticated with check (public.noo_is('owner', 'editor'));

create policy assets_update on public.assets
  for update to authenticated
  using (public.noo_is('owner', 'editor')) with check (public.noo_is('owner', 'editor'));

create policy assets_delete on public.assets
  for delete to authenticated using (public.noo_is('owner'));

-- Anyone signed in may write the log; only the owner reads it back. Nobody
-- edits it — again, no update or delete policy is the rule.
create policy audit_log_insert on public.audit_log
  for insert to authenticated with check (public.noo_is('owner', 'editor', 'viewer'));

create policy audit_log_read on public.audit_log
  for select to authenticated using (public.noo_is('owner'));
