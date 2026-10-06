-- =============================================================================
-- Access, step 1 — Access.md A10, A11 (his, 2026-10-06; approved by merging #22)
--
-- Who may do what, for people and agents alike: the permissions the apps
-- declare (the catalogue), the roles he makes from them, who holds which, the
-- invitations that carry roles, the delegations an agent acts under, and the
-- append-only record of every change — beside the old, and READ BY NOTHING YET.
-- Every policy still asks `noo_is()`, every gate still asks only for a session,
-- and the allowlist still refuses any other address; A11's steps 2 to 7 move
-- them over.
--
-- What is enforced here already, because it is the lock and not the screen:
--   · one Owner, his, holding every permission without rows, never given or
--     taken through the API (A4);
--   · the built-in roles are never deleted, there is always exactly one default,
--     and a role still held is not deleted (A4, A7);
--   · nobody grants more than they hold: giving or taking a role, ticking or
--     unticking a permission, naming a role in an invitation (A4);
--   · every change to the access tables writes an audit row, and the audit log
--     is append-only for every role, the owner's included (A8).
--
-- A request is told from the database acting on its own by `auth.uid()`: a
-- signed-in request has one; a migration, the sign-up trigger and the service
-- role have none, and are trusted as the database itself is.
--
-- Adds types, tables and functions, seeds the catalogue and the two built-in
-- roles, makes the owner's account the Owner and every other account a Member,
-- and replaces `noo_handle_new_user()` so a new account also gets its roles.
-- Drops nothing.
-- =============================================================================

-- ── who acts (A2, A5) ────────────────────────────────────────────────────────
create type public.noo_principal_kind as enum ('person', 'agent');

alter table public.profiles
  add column kind public.noo_principal_kind not null default 'person';
comment on column public.profiles.kind is
  'Access.md A2, A5: a person who signed up, or an agent the admin made.';

-- ── the catalogue (A3) ───────────────────────────────────────────────────────
create table public.permissions (
  name       text primary key check (name ~ '^[a-z]+(\.[a-z]+)+$'),
  app        text not null check (app ~ '^[a-z]+$'),
  sentence   text not null check (btrim(sentence) <> ''),
  created_at timestamptz not null default now(),
  check (split_part(name, '.', 1) = app)
);
comment on table public.permissions is
  'Access.md A3: what the code can check. Written only by migrations, through noo_permission_upsert and '
  'noo_permission_drop, which packages/auth/scripts/check-catalogue.mjs reads to compare with '
  'packages/auth/src/permissions.ts.';

-- Migrations only: the catalogue changes with the code that checks it.
create or replace function public.noo_permission_upsert(p_name text, p_app text, p_sentence text)
returns void language sql set search_path = '' as $$
  insert into public.permissions (name, app, sentence) values (p_name, p_app, p_sentence)
  on conflict (name) do update set app = excluded.app, sentence = excluded.sentence;
$$;
create or replace function public.noo_permission_drop(p_name text)
returns void language sql set search_path = '' as $$
  delete from public.permissions where name = p_name;
$$;
revoke execute on function public.noo_permission_upsert(text, text, text) from public, anon, authenticated;
revoke execute on function public.noo_permission_drop(text) from public, anon, authenticated;

-- ── roles (A4) ───────────────────────────────────────────────────────────────
create type public.noo_built_in_role as enum ('owner', 'member');

create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> ''),
  sentence   text not null default '',
  built_in   public.noo_built_in_role unique,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (not (built_in = 'owner' and is_default))
);
create unique index roles_name_key on public.roles (lower(btrim(name)));
create unique index roles_one_default on public.roles (is_default) where is_default;
comment on table public.roles is
  'Access.md A4: a named set of permissions he makes in the admin. Two are built in: the Owner (every '
  'permission, without rows) and the Member (the default every sign-up gets).';

create table public.role_permissions (
  role_id    uuid not null references public.roles (id) on delete cascade,
  permission text not null references public.permissions (name) on delete cascade on update cascade,
  primary key (role_id, permission)
);

create table public.role_assignments (
  principal_id uuid not null references public.profiles (id) on delete cascade,
  role_id      uuid not null references public.roles (id) on delete restrict,
  granted_by   uuid references public.profiles (id) on delete set null,
  granted_at   timestamptz not null default now(),
  primary key (principal_id, role_id)
);
create index role_assignments_role on public.role_assignments (role_id);
comment on table public.role_assignments is
  'Access.md A2: who holds which role. A role still held cannot be deleted (on delete restrict).';

-- ── invitations (A7) and delegations (A5) ────────────────────────────────────
create table public.invitations (
  email      text primary key check (email = lower(btrim(email)) and email <> ''),
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at    timestamptz
);
create table public.invitation_roles (
  email   text not null references public.invitations (email) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (email, role_id)
);
comment on table public.invitations is
  'Access.md A7: an address and the roles signing up with it gives, instead of the default.';

create table public.delegations (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references public.profiles (id) on delete cascade,
  on_behalf_of uuid not null references public.profiles (id) on delete cascade,
  purpose      text not null check (btrim(purpose) <> ''),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  ended_at     timestamptz,
  check (expires_at > created_at),
  check (agent_id <> on_behalf_of)
);
comment on table public.delegations is
  'Access.md A5: a person lets an agent act for them, for a purpose, until an expiry. Under one, the agent '
  'may do only what both may do (noo_can, from step 6).';

-- ── the audit log (A8) ───────────────────────────────────────────────────────
create table public.audit_events (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid,
  actor_name   text,
  actor_kind   public.noo_principal_kind,
  on_behalf_of uuid,
  action       text not null check (btrim(action) <> ''),
  app          text,
  item         text,
  detail       jsonb not null default '{}'::jsonb
);
create index audit_events_at on public.audit_events (at desc);
create index audit_events_actor on public.audit_events (actor_id, at desc);
comment on table public.audit_events is
  'Access.md A8: append-only, for every role. No foreign key on the actor, so a removed account''s rows keep '
  'its id and name. (audit_log was the 1.0 admin''s, dropped on 2026-09-23.)';

-- ── the one question (A6) ────────────────────────────────────────────────────
-- `security definer` so the role tables are read whatever their own rules say,
-- and `search_path = ''` with every name qualified, as noo_current_role() does.
create or replace function public.noo_is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.role_assignments a
    join public.roles r on r.id = a.role_id
    where a.principal_id = (select auth.uid()) and r.built_in = 'owner'
  );
$$;

-- `p_item` is A9's room for single items: asked from today, ignored until then.
-- Delegations join here in step 6: under one, the person must hold it as well.
create or replace function public.noo_can(p_permission text, p_item text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    public.noo_is_owner()
    or exists (
      select 1 from public.role_assignments a
      join public.role_permissions rp on rp.role_id = a.role_id
      where a.principal_id = (select auth.uid()) and rp.permission = p_permission
    )
  );
$$;

-- Every permission a principal holds: what the token hook writes (step 3) and
-- the admin shows. Not for requests: it would tell anyone what anyone holds.
create or replace function public.noo_permissions_of(p_principal uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select case
    when exists (
      select 1 from public.role_assignments a join public.roles r on r.id = a.role_id
      where a.principal_id = p_principal and r.built_in = 'owner'
    ) then (select coalesce(array_agg(p.name order by p.name), '{}') from public.permissions p)
    else (
      select coalesce(array_agg(distinct rp.permission order by rp.permission), '{}')
      from public.role_assignments a join public.role_permissions rp on rp.role_id = a.role_id
      where a.principal_id = p_principal
    )
  end;
$$;

revoke execute on function public.noo_is_owner() from public;
revoke execute on function public.noo_can(text, text) from public;
revoke execute on function public.noo_permissions_of(uuid) from public, anon, authenticated;
grant execute on function public.noo_is_owner() to anon, authenticated;
grant execute on function public.noo_can(text, text) to anon, authenticated;

-- ── nobody grants more than they hold (A4) ───────────────────────────────────
-- The two permissions that hand out power are the owner's alone to give.
create or replace function public.noo_may_grant_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is null
    or public.noo_is_owner()
    or (p_permission not in ('admin.roles.manage', 'admin.people.assign') and public.noo_can(p_permission));
$$;

create or replace function public.noo_may_grant_role(p_role uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is null
    or (
      (select r.built_in from public.roles r where r.id = p_role) is distinct from 'owner'
      and (
        public.noo_is_owner()
        or not exists (
          select 1 from public.role_permissions rp
          where rp.role_id = p_role and not public.noo_may_grant_permission(rp.permission)
        )
      )
    );
$$;
revoke execute on function public.noo_may_grant_permission(text) from public, anon, authenticated;
revoke execute on function public.noo_may_grant_role(uuid) from public, anon, authenticated;

create or replace function public.noo_roles_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.built_in is not null then
      raise exception 'roles: % is built in and is never deleted (Access.md A4)', old.name using errcode = '42501';
    end if;
    if old.is_default then
      raise exception 'roles: % is the default; make another role the default first (Access.md A4)', old.name
        using errcode = '42501';
    end if;
    return old;
  end if;
  if old.built_in is distinct from new.built_in then
    raise exception 'roles: whether a role is built in never changes (Access.md A4)' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger roles_guard before update or delete on public.roles
  for each row execute function public.noo_roles_guard();

-- Exactly one default, checked when the transaction ends, so moving it is two
-- updates in one transaction (the old one off first, then the new one on).
create or replace function public.noo_roles_one_default()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.roles where is_default) <> 1 then
    raise exception 'roles: there is always exactly one default role (Access.md A4)' using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger roles_one_default_check after insert or update or delete on public.roles
  deferrable initially deferred for each row execute function public.noo_roles_one_default();

create or replace function public.noo_role_permissions_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'role_permissions: untick and tick instead of changing a row' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and (select r.built_in from public.roles r where r.id = new.role_id) = 'owner' then
    raise exception 'role_permissions: the Owner holds every permission without rows (Access.md A4)'
      using errcode = '42501';
  end if;
  if not public.noo_may_grant_permission(coalesce(new.permission, old.permission)) then
    raise exception 'role_permissions: nobody grants more than they hold (Access.md A4)' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger role_permissions_guard before insert or update or delete on public.role_permissions
  for each row execute function public.noo_role_permissions_guard();

create or replace function public.noo_role_assignments_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner_role uuid := (select r.id from public.roles r where r.built_in = 'owner');
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if not public.noo_may_grant_role(new.role_id) then
      raise exception 'role_assignments: nobody grants more than they hold, and the Owner is never given (Access.md A4)'
        using errcode = '42501';
    end if;
    if new.role_id = owner_role and exists (
      select 1 from public.role_assignments a where a.role_id = owner_role and a.principal_id <> new.principal_id
    ) then
      raise exception 'role_assignments: there is one Owner (Access.md A4)' using errcode = '23505';
    end if;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and not public.noo_may_grant_role(old.role_id) then
    raise exception 'role_assignments: nobody takes more than they hold, and the Owner is never taken (Access.md A4)'
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger role_assignments_guard before insert or update or delete on public.role_assignments
  for each row execute function public.noo_role_assignments_guard();

create or replace function public.noo_invitation_roles_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select r.built_in from public.roles r where r.id = new.role_id) = 'owner' then
    raise exception 'invitation_roles: the Owner is never given by invitation (Access.md A4)' using errcode = '42501';
  end if;
  if not public.noo_may_grant_role(new.role_id) then
    raise exception 'invitation_roles: nobody invites with more than they hold (Access.md A4)' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger invitation_roles_guard before insert or update on public.invitation_roles
  for each row execute function public.noo_invitation_roles_guard();

create or replace function public.noo_delegations_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select p.kind from public.profiles p where p.id = new.agent_id) is distinct from 'agent' then
      raise exception 'delegations: only an agent acts for someone (Access.md A5)' using errcode = '23514';
    end if;
    if (select p.kind from public.profiles p where p.id = new.on_behalf_of) is distinct from 'person' then
      raise exception 'delegations: an agent acts for a person (Access.md A5)' using errcode = '23514';
    end if;
    return new;
  end if;
  if (new.agent_id, new.on_behalf_of, new.purpose, new.created_at, new.expires_at)
     is distinct from (old.agent_id, old.on_behalf_of, old.purpose, old.created_at, old.expires_at)
     or old.ended_at is not null then
    raise exception 'delegations: a delegation is only ever ended, once (Access.md A5)' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger delegations_guard before insert or update on public.delegations
  for each row execute function public.noo_delegations_guard();

-- ── the record (A8) ──────────────────────────────────────────────────────────
-- Who acted is read from the request, never passed in, so a row cannot name
-- someone else. `on_behalf_of` is filled from the delegation in effect, step 6.
create or replace function public.noo_audit(
  p_action text, p_app text default null, p_item text default null, p_detail jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_events (actor_id, actor_name, actor_kind, action, app, item, detail)
  select me.id, coalesce(p.name, p.email, case when me.id is null then 'the database' end), p.kind,
         p_action, p_app, p_item, coalesce(p_detail, '{}'::jsonb)
  from (select (select auth.uid()) as id) me
  left join public.profiles p on p.id = me.id;
$$;
revoke execute on function public.noo_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.noo_audit(text, text, text, jsonb) to authenticated;

create or replace function public.noo_audit_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  what text := case tg_table_name
    when 'roles'            then case tg_op when 'INSERT' then 'role.made' when 'UPDATE' then 'role.changed' else 'role.deleted' end
    when 'role_permissions' then case tg_op when 'INSERT' then 'role.permission.ticked' else 'role.permission.unticked' end
    when 'role_assignments' then case tg_op when 'INSERT' then 'role.given' when 'UPDATE' then 'role.changed.holder' else 'role.taken' end
    when 'invitations'      then case tg_op when 'INSERT' then 'invitation.sent' when 'UPDATE' then 'invitation.changed' else 'invitation.revoked' end
    when 'invitation_roles' then case tg_op when 'INSERT' then 'invitation.role.added' else 'invitation.role.removed' end
    when 'delegations'      then case tg_op when 'INSERT' then 'delegation.made' when 'UPDATE' then 'delegation.ended' else 'delegation.deleted' end
    when 'profiles'         then case tg_op when 'DELETE' then 'account.removed' else 'account.kind.changed' end
    else tg_table_name || '.' || lower(tg_op)
  end;
begin
  perform public.noo_audit(what, 'admin', null, jsonb_build_object(
    'before', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    'after',  case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  ));
  return null;
end;
$$;

create trigger roles_audit after insert or update or delete on public.roles
  for each row execute function public.noo_audit_change();
create trigger role_permissions_audit after insert or delete on public.role_permissions
  for each row execute function public.noo_audit_change();
create trigger role_assignments_audit after insert or update or delete on public.role_assignments
  for each row execute function public.noo_audit_change();
create trigger invitations_audit after insert or update or delete on public.invitations
  for each row execute function public.noo_audit_change();
create trigger invitation_roles_audit after insert or delete on public.invitation_roles
  for each row execute function public.noo_audit_change();
create trigger delegations_audit after insert or update or delete on public.delegations
  for each row execute function public.noo_audit_change();
create trigger profiles_removed_audit after delete on public.profiles
  for each row execute function public.noo_audit_change();
create trigger profiles_kind_audit after update of kind on public.profiles
  for each row when (old.kind is distinct from new.kind) execute function public.noo_audit_change();

create or replace function public.noo_audit_frozen()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_events: the record is append-only, for every role (Access.md A8)' using errcode = '42501';
end;
$$;
create trigger audit_events_frozen before update or delete on public.audit_events
  for each row execute function public.noo_audit_frozen();
create trigger audit_events_frozen_truncate before truncate on public.audit_events
  for each statement execute function public.noo_audit_frozen();

-- ── row level security (A10) ─────────────────────────────────────────────────
alter table public.permissions      enable row level security;
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.role_assignments enable row level security;
alter table public.invitations      enable row level security;
alter table public.invitation_roles enable row level security;
alter table public.delegations      enable row level security;
alter table public.audit_events     enable row level security;

revoke all on public.permissions, public.roles, public.role_permissions, public.role_assignments,
  public.invitations, public.invitation_roles, public.delegations, public.audit_events from anon;
revoke truncate on public.permissions, public.roles, public.role_permissions, public.role_assignments,
  public.invitations, public.invitation_roles, public.delegations, public.audit_events from authenticated;
grant select on public.permissions, public.audit_events to authenticated;
revoke insert, update, delete on public.permissions, public.audit_events from authenticated;
grant select, insert, update, delete on public.roles, public.role_permissions, public.role_assignments,
  public.invitations, public.invitation_roles to authenticated;
grant select, insert, update on public.delegations to authenticated;

-- The catalogue: every signed-in principal may read what can be checked.
create policy permissions_read on public.permissions
  for select to authenticated using (true);

-- Roles and what they grant: read by whoever manages people, roles or
-- invitations, and by a principal for the roles it holds.
create policy roles_read on public.roles
  for select to authenticated using (
    public.noo_can('admin.roles.manage') or public.noo_can('admin.people.view')
    or public.noo_can('admin.invitations.manage')
    or exists (select 1 from public.role_assignments a
               where a.role_id = roles.id and a.principal_id = (select auth.uid()))
  );
create policy roles_write on public.roles
  for all to authenticated
  using (public.noo_can('admin.roles.manage')) with check (public.noo_can('admin.roles.manage'));

create policy role_permissions_read on public.role_permissions
  for select to authenticated using (
    public.noo_can('admin.roles.manage') or public.noo_can('admin.people.view')
    or public.noo_can('admin.invitations.manage')
    or exists (select 1 from public.role_assignments a
               where a.role_id = role_permissions.role_id and a.principal_id = (select auth.uid()))
  );
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (public.noo_can('admin.roles.manage')) with check (public.noo_can('admin.roles.manage'));

create policy role_assignments_read on public.role_assignments
  for select to authenticated
  using (principal_id = (select auth.uid()) or public.noo_can('admin.people.view'));
create policy role_assignments_write on public.role_assignments
  for all to authenticated
  using (public.noo_can('admin.people.assign')) with check (public.noo_can('admin.people.assign'));

create policy invitations_manage on public.invitations
  for all to authenticated
  using (public.noo_can('admin.invitations.manage')) with check (public.noo_can('admin.invitations.manage'));
create policy invitation_roles_manage on public.invitation_roles
  for all to authenticated
  using (public.noo_can('admin.invitations.manage')) with check (public.noo_can('admin.invitations.manage'));

-- A delegation is the person's to make and either party's to end.
create policy delegations_read on public.delegations
  for select to authenticated using (
    agent_id = (select auth.uid()) or on_behalf_of = (select auth.uid()) or public.noo_can('admin.people.view')
  );
create policy delegations_make on public.delegations
  for insert to authenticated with check (on_behalf_of = (select auth.uid()));
create policy delegations_end on public.delegations
  for update to authenticated
  using (agent_id = (select auth.uid()) or on_behalf_of = (select auth.uid()))
  with check (agent_id = (select auth.uid()) or on_behalf_of = (select auth.uid()));

create policy audit_events_read on public.audit_events
  for select to authenticated using (public.noo_can('admin.audit.view'));

-- ── the catalogue's first entries (A3) ───────────────────────────────────────
select public.noo_permission_upsert('admin.open', 'admin', 'Opening the admin.');
select public.noo_permission_upsert('admin.people.view', 'admin', 'Seeing every person and agent, their roles and when they last signed in.');
select public.noo_permission_upsert('admin.people.assign', 'admin', 'Giving and taking roles, never the Owner, and never a role with a permission the giver lacks.');
select public.noo_permission_upsert('admin.people.remove', 'admin', 'Ending someone''s sessions; removing an account.');
select public.noo_permission_upsert('admin.agents.manage', 'admin', 'Making an agent''s account, rotating its credential, retiring it.');
select public.noo_permission_upsert('admin.roles.manage', 'admin', 'Making, renaming and deleting roles, and changing their permissions.');
select public.noo_permission_upsert('admin.invitations.manage', 'admin', 'Inviting an address with roles; revoking an invitation.');
select public.noo_permission_upsert('admin.audit.view', 'admin', 'Reading the audit log.');
select public.noo_permission_upsert('motion.open', 'motion', 'Opening the motion studio and trying every control, nothing saved.');
select public.noo_permission_upsert('motion.draft.save', 'motion', 'Saving an action''s draft.');
select public.noo_permission_upsert('motion.version.publish', 'motion', 'Publishing an action''s version.');
select public.noo_permission_upsert('orbit.draft.save', 'orbit', 'Saving a look''s draft.');
select public.noo_permission_upsert('orbit.version.publish', 'orbit', 'Publishing a look''s version.');
select public.noo_permission_upsert('orbit.agent.create', 'orbit', 'Making a new agent''s look.');
select public.noo_permission_upsert('orbit.style.upload', 'orbit', 'Uploading a drawing for a look.');
select public.noo_permission_upsert('home.open', 'home', 'Opening Home: the house and its tour.');

-- ── the two built-in roles (A4) ──────────────────────────────────────────────
insert into public.roles (name, sentence, built_in, is_default) values
  ('Owner', 'Every permission, those added later included. One person, him.', 'owner', false),
  ('Member', 'What everyone who signs up gets: the motion studio, beside the public apps and Orbit.', 'member', true);
insert into public.role_permissions (role_id, permission)
  select r.id, 'motion.open' from public.roles r where r.built_in = 'member';

-- ── today's accounts (A11 step 1) ────────────────────────────────────────────
-- The owner's account is the Owner; every other account is a Member.
insert into public.role_assignments (principal_id, role_id)
  select p.id, r.id from public.profiles p join public.roles r on r.built_in = 'owner'
  where p.role = 'owner';
insert into public.role_assignments (principal_id, role_id)
  select p.id, r.id from public.profiles p join public.roles r on r.is_default
  where p.role <> 'owner';

-- ── a new account gets its roles too ─────────────────────────────────────────
-- As before, the profile, with the role the allowlist names (today's readers).
-- Then, for the new tables: an unexpired invitation's roles, used up; else the
-- allowlist's owner is the Owner while there is none; else the default role.
create or replace function public.noo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  addr       text := lower(btrim(new.email));
  invited_as public.noo_role;
  given      integer := 0;
begin
  select a.role into invited_as from public.allowlist a where a.email = addr;

  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    addr,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    coalesce(invited_as, 'viewer')
  )
  on conflict (id) do nothing;

  insert into public.role_assignments (principal_id, role_id)
    select new.id, ir.role_id
    from public.invitations i join public.invitation_roles ir on ir.email = i.email
    where i.email = addr and i.used_at is null and i.expires_at > now()
    on conflict do nothing;
  get diagnostics given = row_count;

  if given > 0 then
    update public.invitations set used_at = now() where email = addr;
  elsif invited_as = 'owner' and not exists (
    select 1 from public.role_assignments a join public.roles r on r.id = a.role_id where r.built_in = 'owner'
  ) then
    insert into public.role_assignments (principal_id, role_id)
      select new.id, r.id from public.roles r where r.built_in = 'owner';
  else
    insert into public.role_assignments (principal_id, role_id)
      select new.id, r.id from public.roles r where r.is_default
      on conflict do nothing;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
