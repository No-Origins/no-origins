-- =============================================================================
-- Major and minor versions, and a new character by its name —
-- Character-Studio.md C19 (his, 2026-10-01)
--
-- "I don't want to give a name for each version … I should be able to create
-- new agent so that means I should be able to name it and then once I have the
-- name next time I can just keep publishing it with different versions. We
-- should have major versions and minor versions. And minor versions should
-- auto increment. Major versions is when I change it." — Bhargav.
--
-- A version is now `number`.`minor`: `number` is the major, as it was, and
-- `minor` counts the publishes within it from 0. Every version stored before is
-- its number and .0 — the agent's 12 to 15 are 12.0 to 15.0, the five's 1 is
-- 1.0 — so nothing is renumbered and no frozen row is written: the column's
-- default fills them, which fires no trigger.
--
-- A version's name is optional. The character studio publishes without one;
-- the motion studio still names each of its versions, and a name given is
-- still never empty and never repeated within its item.
--
-- `studio_publish` takes a step: 'minor', the latest version's major and its
-- minor plus one; or 'major', the next major at .0 — what every publish was
-- before, and still the default, so the motion studio's call is unchanged. An
-- item's first version is 1.0 either way. The next is always counted from the
-- latest version, not from the one pages show: going back to 14.0 from 15.2
-- makes the next minor 15.3, and nothing is renumbered.
--
-- `studio_new_character` makes a character and its draft in one go, from the
-- name he gives it and the look the studio starts it from. It has no version
-- until its first publish.
--
-- Adds only; drops nothing but the one-number unique constraint, which the
-- two-number one replaces, and the old four-argument `studio_publish`.
-- =============================================================================

-- ── the minor ────────────────────────────────────────────────────────────────
alter table public.studio_versions
  add column minor integer not null default 0 check (minor >= 0);

comment on column public.studio_versions.number is
  'The major (Character-Studio.md C19). With `minor`, the version: 15.0, 15.1, 16.0.';
comment on column public.studio_versions.minor is
  'The publishes within a major, from 0 (Character-Studio.md C19). Every version '
  'stored before 2026-10-01 is .0.';

alter table public.studio_versions drop constraint studio_versions_item_id_number_key;
alter table public.studio_versions
  add constraint studio_versions_item_id_number_minor_key unique (item_id, number, minor);

-- ── the name, optional ───────────────────────────────────────────────────────
-- `studio_versions_label_check` (never empty) and the unique index on the name
-- stay: a null passes the one and is never equal to another in the other.
alter table public.studio_versions alter column label drop not null;

-- ── the numbering ────────────────────────────────────────────────────────────
-- No number asked for (an uploaded drawing): the next major, .0, as before. An
-- item's first version may name its own (the agent's carried on from 12). Any
-- other is the latest's next minor or the next major's .0, and nothing else.
create or replace function public.noo_studio_version_number()
returns trigger language plpgsql set search_path = '' as $$
declare
  top_major integer;
  top_minor integer;
begin
  perform 1 from public.studio_items where id = new.item_id for update;
  select number, minor into top_major, top_minor
    from public.studio_versions where item_id = new.item_id
    order by number desc, minor desc limit 1;
  if new.number is null then
    new.number := coalesce(top_major, 0) + 1;
    new.minor := 0;
  elsif top_major is not null
    and not (new.number = top_major and new.minor = top_minor + 1)
    and not (new.number = top_major + 1 and new.minor = 0) then
    raise exception 'studio_versions: the next version is %.% or %.0', top_major, top_minor + 1, top_major + 1
      using errcode = '23514';
  end if;
  new.label := btrim(new.label);
  new.published_at := now();
  new.published_by := auth.uid();
  return new;
end;
$$;

-- ── publishing ───────────────────────────────────────────────────────────────
drop function public.studio_publish(uuid, text, text, integer);

create function public.studio_publish(
  p_item uuid,
  p_ui_version text,
  p_rev integer,
  p_label text default null,
  p_step text default 'major'
)
returns public.studio_versions
language plpgsql security invoker set search_path = '' as $$
declare
  d public.studio_drafts;
  v public.studio_versions;
  top_major integer;
  top_minor integer;
begin
  if p_step is null or p_step not in ('major', 'minor') then
    raise exception 'studio_publish: a step is major or minor, not %', p_step using errcode = '22023';
  end if;
  select * into d from public.studio_drafts where item_id = p_item for update;
  if not found then
    raise exception 'studio_publish: there is no draft to publish' using errcode = 'P0002';
  end if;
  if d.rev <> p_rev then
    raise exception 'studio_publish: the draft changed since it was loaded (rev % now, % sent)', d.rev, p_rev
      using errcode = '40001';
  end if;
  -- The draft's row is the lock, so the latest read here is the latest when the version goes in.
  select number, minor into top_major, top_minor
    from public.studio_versions where item_id = p_item
    order by number desc, minor desc limit 1;
  insert into public.studio_versions (item_id, number, minor, label, data, ui_version)
    values (
      p_item,
      case when top_major is null then 1 when p_step = 'minor' then top_major else top_major + 1 end,
      case when top_major is null or p_step = 'major' then 0 else top_minor + 1 end,
      p_label,
      d.data,
      p_ui_version
    )
    returning * into v;
  return v;
end;
$$;

revoke execute on function public.studio_publish(uuid, text, integer, text, text) from public, anon;
grant execute on function public.studio_publish(uuid, text, integer, text, text) to authenticated;

-- ── a new character ──────────────────────────────────────────────────────────
-- Its name is unique among the characters whatever its case (studio_items_name,
-- 23505) and never empty (23514). Runs as the caller, so RLS decides who may.
create function public.studio_new_character(p_name text, p_data jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  made uuid;
begin
  insert into public.studio_items (kind, name) values ('character', btrim(p_name)) returning id into made;
  insert into public.studio_drafts (item_id, data) values (made, p_data);
  return made;
end;
$$;

revoke execute on function public.studio_new_character(text, jsonb) from public, anon;
grant execute on function public.studio_new_character(text, jsonb) to authenticated;

notify pgrst, 'reload schema';
