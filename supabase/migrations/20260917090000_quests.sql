-- =============================================================================
-- Reset to the Quests model — Admin.md §0.5 (2026-09-17)
--
-- "Remove all the previous and unwanted tables. Let's start fresh. Quest should
-- be a new feature." — Bhargav.
--
-- The three-layer schema (projects · documents · document_versions · systems ·
-- products · product_installs · assets · audit_log) was built for the document
-- editor that was deleted with React Flow (Atomic.md D11). It has outlived its
-- reason, so it goes. **Identity stays**: `profiles`, `allowlist`, the allowlist
-- gate and their RLS are the login, and the login is wanted. The functions the
-- gate and RLS share — `noo_role`, `noo_current_role()`, `noo_is()`,
-- `touch_updated_at()` — are kept and reused below.
-- =============================================================================

-- ── drop the document/editor/products era ────────────────────────────────────
-- Order and CASCADE together take each table's policies, triggers and indexes.
drop table if exists public.product_installs   cascade;
drop table if exists public.products           cascade;
drop table if exists public.systems            cascade;
drop table if exists public.document_versions  cascade;
drop table if exists public.documents          cascade;
drop table if exists public.projects           cascade;
drop table if exists public.assets             cascade;
drop table if exists public.audit_log          cascade;

-- Functions and enums that served only the dropped tables.
drop function if exists public.noo_versions_are_append_only() cascade;
drop function if exists public.noo_touch_draft()              cascade;
drop type     if exists public.noo_project_status;
drop type     if exists public.noo_doc_kind;
drop type     if exists public.noo_install_scope;

-- ── the one table this pass adds ──────────────────────────────────────────────
-- A quest is a surface we deploy as its own subdomain — the successor to the old
-- Layer-1 project. It is composed on the grid; `layout` is a `GridLayout`
-- (packages/ui/src/lib/grid-layout.ts): pages of coordinate-placed items, the
-- same pure model the grid renders and the editor mutates.
create type public.noo_quest_status as enum ('draft', 'live', 'archived');

create table public.quests (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  description text,
  subdomain   text,                                  -- reserved; deployment is deferred
  hue         text,                                  -- a Brand.md hue name
  status      public.noo_quest_status not null default 'draft',
  layout      jsonb,                                 -- the GridLayout; null until first save
  rev         integer not null default 0,            -- the editor's optimistic-concurrency check
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.quests is
  'Admin.md §0.5. One surface, deployed as a subdomain, composed on the grid. '
  'The portfolio is the first.';
comment on column public.quests.layout is
  'A GridLayout (grid-layout.ts): { authored: { <bp>: page[] } }. Null until saved.';
comment on column public.quests.rev is
  'Bumped by a trigger only when the layout actually changes. The dashboard sends '
  'the rev it loaded; a mismatch is a conflict, not a silent overwrite.';

create trigger quests_touch before update on public.quests
  for each row execute function public.touch_updated_at();

-- `rev` is the database's, for the same reason `updated_at` is: the one write
-- that forgets to bump it is the one that silently clobbers a newer layout.
-- Bumped only when the layout changes, so renaming a quest does not invalidate an
-- open dashboard.
create or replace function public.noo_touch_quest_layout()
returns trigger language plpgsql as $$
begin
  if new.layout is distinct from old.layout then
    new.rev := old.rev + 1;
  end if;
  return new;
end;
$$;

create trigger quests_touch_layout before update on public.quests
  for each row execute function public.noo_touch_quest_layout();

-- ── RLS — the surviving shape of §8.3 ─────────────────────────────────────────
-- Deny by default; the single policy shape reads roles off `profiles`. An editor
-- composes; only the owner removes a whole quest.
alter table public.quests enable row level security;

create policy quests_read on public.quests
  for select to authenticated using (public.noo_is('owner', 'editor', 'viewer'));

create policy quests_insert on public.quests
  for insert to authenticated with check (public.noo_is('owner', 'editor'));

create policy quests_update on public.quests
  for update to authenticated
  using (public.noo_is('owner', 'editor')) with check (public.noo_is('owner', 'editor'));

create policy quests_delete on public.quests
  for delete to authenticated using (public.noo_is('owner'));
