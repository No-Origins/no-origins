-- =============================================================================
-- no-origins · step 3 of Admin.md §13 — the schema of Admin.md §8.1
--
-- The whole persistence design is one sentence, and everything below is either
-- that sentence or reference data around it:
--
--   `documents` holds exactly one mutable draft and a pointer;
--   `document_versions` is append-only.
--
-- Two deliberate departures from §8.1 as written, both recorded there too:
--
--   1. No `themes` table. §8.1 listed one; **R3 forbids it.** R3 makes the
--      package the single source of truth for tokens and the admin a display
--      surface that writes nothing, so a table holding `tokens jsonb` would be
--      a second source of truth for the exact thing R3 says has only one. The
--      per-version `theme_snapshot` below is not the same thing: it records
--      which tokens a version *was published against*, which is history, not
--      configuration.
--
--   2. `version int` + `label text not null`, not `version text` + `version_ord
--      int`. §8.1 was written before R1 settled the format. R1 is "an integer
--      with a required label" — the integer already sorts, so a separate
--      ordinal is a second copy of the same fact.
--
-- `citext` is not used. §8.1 named it for `allowlist.email`; a lowercase-only
-- `text` column with a check constraint is the same guarantee without depending
-- on where the extension was installed or what is on the role's search_path.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── closed sets get an enum; open ones stay text ──────────────────────────────
-- `systems.kind` and `products.*` are deliberately text: a new system is a seed
-- row, and a set that grows should not need a migration to grow.
create type public.noo_role           as enum ('owner', 'editor', 'viewer');
create type public.noo_project_status as enum ('draft', 'live', 'archived');
create type public.noo_doc_kind       as enum ('canvas', 'page');   -- Scene-Schema.md §1
create type public.noo_install_scope  as enum ('global', 'project');

-- `updated_at` is maintained by the database, never by the caller: a timestamp a
-- client can forget to set is a timestamp that is wrong at the worst moment.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── identity ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null check (email = lower(email)),
  name       text,
  role       public.noo_role not null default 'viewer',
  created_at timestamptz not null default now()
);
comment on table public.profiles is
  'One row per signed-in person. `role` is what every RLS policy reads (§8.3).';

create unique index profiles_email_key on public.profiles (email);

-- The gate, not a convenience list. Auth is magic-link only and this table is
-- the entire membership rule (§8.4), so a row here is an invitation.
create table public.allowlist (
  email      text primary key check (email = lower(email)),
  role       public.noo_role not null default 'editor',
  invited_at timestamptz not null default now(),
  invited_by uuid references public.profiles (id) on delete set null
);
comment on table public.allowlist is
  'Magic-link membership. A `before insert` trigger on auth.users rejects any '
  'address not listed here, so an exposed sign-in URL is not an exposed app.';

-- ── layer 1 · projects ───────────────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  domain      text,
  description text,
  hue         text,                                   -- a Design-System.md §2 hue name
  status      public.noo_project_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.projects is
  'Layer 1 (§1). A project is a thing with pages; `portfolio` is the first.';

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind             public.noo_doc_kind not null default 'canvas',
  title            text not null,
  -- the ONE mutable thing in the design. `rev` is a monotonic counter the editor
  -- sends back with each autosave so a stale tab cannot overwrite a newer draft.
  draft            jsonb,
  rev              integer not null default 0,
  draft_updated_at timestamptz,
  draft_updated_by uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, slug)
);
comment on column public.documents.draft is
  'The working document (Scene-Schema.md §1). Null until the first save.';
comment on column public.documents.rev is
  'Bumped on every draft write. The editor sends the rev it loaded; a mismatch '
  'is a conflict, not a silent overwrite.';

create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

-- `rev` is the database's, for the same reason `updated_at` is. The editor's
-- conflict check is `update ... where rev = <the rev I loaded>`; if the writer
-- also had to remember to increment it, the one write that forgot would be the
-- one that silently clobbers a newer draft. Bumped only when the draft actually
-- changes, so moving the pointer at publish does not invalidate an open tab.
create or replace function public.noo_touch_draft()
returns trigger language plpgsql as $$
begin
  if new.draft is distinct from old.draft then
    new.rev := old.rev + 1;
    new.draft_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger documents_touch_draft before update on public.documents
  for each row execute function public.noo_touch_draft();

create table public.document_versions (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents (id) on delete cascade,
  -- R1: an integer that sorts, and a label that has to say something.
  version         integer not null check (version > 0),
  label           text not null check (length(btrim(label)) > 0),
  doc             jsonb not null,
  schema_version  integer not null,                   -- Scene-Schema.md §5
  ui_version      text not null,                      -- the @no-origins/ui version that rendered it
  registry_hash   text not null,                      -- the FNV-1a fingerprint (Scene-Schema.md §2)
  theme_snapshot  jsonb,                              -- the tokens this version was published against
  notes           text,
  published_by    uuid references public.profiles (id) on delete set null,
  published_at    timestamptz not null default now(),
  unique (document_id, version)
);
comment on table public.document_versions is
  'Append-only. There is no update policy and no delete policy, and a trigger '
  'refuses both even to the service role — see 20260911090100_rls.sql.';

-- R1's cost, enforced where it cannot be forgotten: an empty label is already
-- refused by the check above; a REUSED one is refused here. "update" seven times
-- is exactly the failure R1 was chosen to avoid.
create unique index document_versions_label_key
  on public.document_versions (document_id, lower(btrim(label)));

create index document_versions_document_idx
  on public.document_versions (document_id, version desc);

-- The pointer. Added after both tables exist because the reference is circular.
alter table public.documents
  add column current_version_id uuid
    references public.document_versions (id) on delete set null;
comment on column public.documents.current_version_id is
  'What is live. Moved by publish (§9), never by the editor.';

-- ── layer 2 · systems ────────────────────────────────────────────────────────
create table public.systems (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  kind        text not null,
  description text,
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.systems is
  'Layer 2 (§1). The mechanisms projects are built with: design, document, '
  'publishing, storage. Seeded reference data — the admin reads these, and '
  'under R3 the design system row carries no tokens.';

create trigger systems_touch before update on public.systems
  for each row execute function public.touch_updated_at();

-- ── layer 3 · products ───────────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  system_slug text not null references public.systems (slug) on update cascade,
  version     text not null,
  manifest    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.products is
  'Layer 3 (§1). A product plugs into exactly one system — the dependency rule '
  'is Projects -> Systems <- Products, so this FK is the rule in the schema.';

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_installs (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  scope      public.noo_install_scope not null,
  project_id uuid references public.projects (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  -- a global install has no project; a project install must name one
  constraint product_installs_scope_check check (
    (scope = 'global'  and project_id is null) or
    (scope = 'project' and project_id is not null)
  )
);

create unique index product_installs_unique
  on public.product_installs (product_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ── shared ───────────────────────────────────────────────────────────────────
-- §8.2: the assets bucket holds photographs now (the 2026-09-11 reversal), which
-- is why `alt` is a column here and not a prop typed at the point of use, and
-- why width and height are stored — a document has to reserve the box before the
-- picture arrives or the layout moves under the reader.
create table public.assets (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  bucket     text not null,
  path       text not null,
  mime       text not null,
  bytes      bigint not null check (bytes >= 0),
  width      integer,
  height     integer,
  alt        text,
  checksum   text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create index assets_project_idx on public.assets (project_id, created_at desc);

create table public.audit_log (
  id        bigserial primary key,
  actor     uuid references public.profiles (id) on delete set null,
  action    text not null,
  entity    text not null,
  entity_id text,
  diff      jsonb,
  at        timestamptz not null default now()
);

create index audit_log_at_idx on public.audit_log (at desc);
