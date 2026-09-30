-- =============================================================================
-- The studios' drafts and versions — Motion.md M20 "Versions and publishing",
-- Character-Studio.md C6 (agreed 2026-09-30)
--
-- "a published motion should freeze. And any new change will lead to new
-- publish. Each publish should be treated as a version." — Bhargav.
--
-- Three kinds of thing are designed in the studios and kept here, in one shape:
--
--   character  what the agent looks like: its body, the face parts it wears and
--              their settings — the character studio (apps/character)
--   motion     a named timeline of rows, made on a character's parts — the
--              motion studio (apps/motion)
--   drawing    a style he uploads for one face slot
--
-- What a thing CAN be is declared in code, beside what draws it
-- (@no-origins/ui/lib/properties, agent-face, agent-body). What he CHOSE is
-- data, here, in three tables:
--
--   studio_items     the thing: its kind, its name, and the version pages show
--   studio_drafts    one per item, saved as he goes; `rev` refuses a stale write
--   studio_versions  published: numbered, named, never changed, never deleted
--
-- **Values are held whole, never as "the default".** A character's data is
-- every value of its look (resolveCharacter, agent-body.ts), the settings its
-- motions move included, since they are the rest under every motion's rows. A
-- version that said "the declaration's default" would change silently the day
-- a default in code did (Admin.md §7's snapshot argument). A key missing on
-- read is a setting declared since, and takes its default then.
--
-- A published motion pins the motions it holds by VERSION id inside its `data`;
-- a draft holds them by ITEM id and stays linked. Versions are never deleted, so
-- a pin never dangles and no join table is needed.
--
-- RLS is the owner's only, as M20 says ("roles later", Admin.md §8.3): he is the
-- one person the sign-in lets in, and the one who publishes.
-- =============================================================================

create type public.noo_studio_kind as enum ('character', 'motion', 'drawing');

-- ── items ────────────────────────────────────────────────────────────────────
create table public.studio_items (
  id                 uuid primary key default gen_random_uuid(),
  kind               public.noo_studio_kind not null,
  name               text not null check (btrim(name) <> ''),
  -- A motion is made for a character, which may change: the page decides which
  -- character plays it, and a row for a part it does not wear does nothing.
  -- A drawing may be made for one.
  character_id       uuid references public.studio_items (id) on delete restrict,
  -- A drawing is a style of one face slot: a FaceSlotId (agent-face.ts).
  slot               text,
  -- The version pages show. Publishing moves it to the new version; going back
  -- to an older one moves it there, and nothing is renumbered.
  current_version_id uuid,
  created_by         uuid default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint studio_items_shape check (
    case kind
      when 'character' then character_id is null and slot is null
      when 'motion'    then character_id is not null and slot is null
      when 'drawing'   then slot is not null and btrim(slot) <> ''
    end
  )
);
comment on table public.studio_items is
  'Motion.md M20, Character-Studio.md C6. A character, a motion or an uploaded drawing, '
  'with one draft and its published versions.';

-- A name is unique within its kind, its character and its slot, whatever its
-- case: a drawing "Arch" for brows and one for hair are two.
create unique index studio_items_name
  on public.studio_items (kind, character_id, slot, lower(btrim(name))) nulls not distinct;

-- ── drafts ───────────────────────────────────────────────────────────────────
create table public.studio_drafts (
  item_id    uuid primary key references public.studio_items (id) on delete cascade,
  -- A character: CharacterLook ({ body, face }), held whole — saved through
  -- resolveCharacter, so every value is written. A key missing on read is a
  -- setting declared since. A motion: its timeline and rows.
  data       jsonb not null default '{}'::jsonb,
  rev        integer not null default 0,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
comment on column public.studio_drafts.rev is
  'The database''s, never the client''s: bumped when `data` changes. A studio writes '
  '`update … set data = $d where item_id = $i and rev = $n returning rev`; no row back '
  'means another device wrote first, and the write is refused, not merged (Admin.md §6.4).';

-- ── versions ─────────────────────────────────────────────────────────────────
create table public.studio_versions (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.studio_items (id) on delete restrict,
  -- Per item, max + 1, set by the trigger below. Only an item's first version
  -- may name its own number: the agent's numbering carries on from 12.
  number       integer not null check (number > 0),
  -- The name he types (Admin.md R1): never empty, never repeated in one item.
  label        text not null check (btrim(label) <> ''),
  data         jsonb not null,
  -- The @no-origins/ui version it was made with (Admin.md §7): a style drawn in
  -- code can change under a version.
  ui_version   text not null check (btrim(ui_version) <> ''),
  -- A drawing's file as he uploaded it, a path in the private `assets` bucket;
  -- its cleaned shapes are `data`. Null for characters and motions.
  source       text,
  published_by uuid,
  published_at timestamptz not null default now(),
  unique (item_id, number)
);
comment on table public.studio_versions is
  'Published, and frozen: no update, no delete (trigger + no policy). Going back to '
  'one moves studio_items.current_version_id.';

create unique index studio_versions_label on public.studio_versions (item_id, lower(btrim(label)));

alter table public.studio_items
  add constraint studio_items_current_version
  foreign key (current_version_id) references public.studio_versions (id) on delete restrict;

-- ── the rules the database keeps ─────────────────────────────────────────────
-- An item: a motion's character is a character; the version it shows is its
-- own; its kind never changes.
create or replace function public.noo_studio_item_check()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.character_id is not null and not exists (
    select 1 from public.studio_items c where c.id = new.character_id and c.kind = 'character'
  ) then
    raise exception 'studio_items: character_id must name a character' using errcode = '23514';
  end if;
  if new.current_version_id is not null and not exists (
    select 1 from public.studio_versions v where v.id = new.current_version_id and v.item_id = new.id
  ) then
    raise exception 'studio_items: current_version_id must be one of this item''s versions' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.kind is distinct from old.kind then
    raise exception 'studio_items: an item''s kind never changes' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger studio_items_check before insert or update on public.studio_items
  for each row execute function public.noo_studio_item_check();

-- A draft: `rev` moves only when its data does, and only the database moves it.
create or replace function public.noo_studio_draft_rev()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.rev := case when new.data is distinct from old.data then old.rev + 1 else old.rev end;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), old.updated_by);
  return new;
end;
$$;

create trigger studio_drafts_rev before update on public.studio_drafts
  for each row execute function public.noo_studio_draft_rev();

-- A version: numbered max + 1 within its item, one publish at a time (the
-- item's row is the lock); an explicit number only for an item's first.
create or replace function public.noo_studio_version_number()
returns trigger language plpgsql set search_path = '' as $$
declare
  top integer;
begin
  perform 1 from public.studio_items where id = new.item_id for update;
  select max(number) into top from public.studio_versions where item_id = new.item_id;
  if new.number is null then
    new.number := coalesce(top, 0) + 1;
  elsif top is not null then
    raise exception 'studio_versions: only an item''s first version names its number (next is %)', top + 1
      using errcode = '23514';
  end if;
  new.label := btrim(new.label);
  new.published_at := now();
  new.published_by := auth.uid();
  return new;
end;
$$;

create trigger studio_versions_number before insert on public.studio_versions
  for each row execute function public.noo_studio_version_number();

-- Publishing makes it the version pages show.
create or replace function public.noo_studio_version_current()
returns trigger language plpgsql set search_path = '' as $$
begin
  update public.studio_items set current_version_id = new.id where id = new.item_id;
  return null;
end;
$$;

create trigger studio_versions_current after insert on public.studio_versions
  for each row execute function public.noo_studio_version_current();

-- Frozen: a version never changes and is never deleted (M20, his "each publish
-- should be treated as a version"). RLS gives no update or delete policy either;
-- this holds for any role, and TRUNCATE, which RLS does not see, is revoked.
create or replace function public.noo_studio_versions_frozen()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'studio_versions: a version never changes and is never deleted (Motion.md M20)'
    using errcode = '42501';
end;
$$;

create trigger studio_versions_frozen before update or delete on public.studio_versions
  for each row execute function public.noo_studio_versions_frozen();
create trigger studio_versions_frozen_truncate before truncate on public.studio_versions
  for each statement execute function public.noo_studio_versions_frozen();

revoke truncate on public.studio_items, public.studio_drafts, public.studio_versions from anon, authenticated;

-- ── publishing ───────────────────────────────────────────────────────────────
-- Publish the draft as he saw it: refused if it moved since (`p_rev`), so what
-- becomes a version is exactly what was on his screen. Runs as the caller, so
-- RLS decides who may. Drawings are uploaded straight in as versions.
create or replace function public.studio_publish(p_item uuid, p_label text, p_ui_version text, p_rev integer)
returns public.studio_versions
language plpgsql security invoker set search_path = '' as $$
declare
  d public.studio_drafts;
  v public.studio_versions;
begin
  select * into d from public.studio_drafts where item_id = p_item for update;
  if not found then
    raise exception 'studio_publish: there is no draft to publish' using errcode = 'P0002';
  end if;
  if d.rev <> p_rev then
    raise exception 'studio_publish: the draft changed since it was loaded (rev % now, % sent)', d.rev, p_rev
      using errcode = '40001';
  end if;
  insert into public.studio_versions (item_id, label, data, ui_version)
    values (p_item, p_label, d.data, p_ui_version)
    returning * into v;
  return v;
end;
$$;

revoke execute on function public.studio_publish(uuid, text, text, integer) from public, anon;
grant execute on function public.studio_publish(uuid, text, text, integer) to authenticated;

-- ── RLS: the owner only ──────────────────────────────────────────────────────
alter table public.studio_items    enable row level security;
alter table public.studio_drafts   enable row level security;
alter table public.studio_versions enable row level security;

create policy studio_items_read on public.studio_items
  for select to authenticated using (public.noo_is('owner'));
create policy studio_items_insert on public.studio_items
  for insert to authenticated with check (public.noo_is('owner'));
create policy studio_items_update on public.studio_items
  for update to authenticated using (public.noo_is('owner')) with check (public.noo_is('owner'));
-- An item with versions cannot go: they restrict it. A never-published one can.
create policy studio_items_delete on public.studio_items
  for delete to authenticated using (public.noo_is('owner'));

create policy studio_drafts_read on public.studio_drafts
  for select to authenticated using (public.noo_is('owner'));
create policy studio_drafts_insert on public.studio_drafts
  for insert to authenticated with check (public.noo_is('owner'));
create policy studio_drafts_update on public.studio_drafts
  for update to authenticated using (public.noo_is('owner')) with check (public.noo_is('owner'));
create policy studio_drafts_delete on public.studio_drafts
  for delete to authenticated using (public.noo_is('owner'));

create policy studio_versions_read on public.studio_versions
  for select to authenticated using (public.noo_is('owner'));
create policy studio_versions_insert on public.studio_versions
  for insert to authenticated with check (public.noo_is('owner'));

-- ── the agent's stored versions ──────────────────────────────────────────────
-- Version 12, his settings (Motion.md M17), whole: resolveCharacter({ body: {},
-- face: {} }) on the day it was stored — SPHERE_START's body, and the face's
-- defaults (solid eyes, plain upper lids, no lower lids, pupils or brows).
-- Version 13, "Version 13, tuned": his settings block of the same night, whole
-- ("This becomes the rest state of the motion"), resolved from his 65 tokens —
-- version 12 with Come back 1000ms where it was 1200ms.
-- Version 14, "Version 13, tuned, tuned": his next block, the same night —
-- version 13 with Come back 500ms and Spread 0.05, so it sits settled into its
-- cell.
-- Version 15, "his version 14, as it looks": the same agent once his "Yes" made
-- the whole of Spread live on slime (its rate 2.6 to 1.2): Spread 0.11, which
-- settles it as 0.05 did, and the shape and surface declared since at their
-- defaults (the sphere, plain). It is resolveCharacter({ body: {}, face: {} }) as
-- the package stands, the current one, the rest under every motion's rows, and
-- the draft starts from it; the next publish is 16. Once pushed, every one is
-- frozen with what it holds.
-- THE FIVE OTHERS (Agents.md A2, 2026-09-30, his: "use the studio to design these
-- because that's how we save the configurations, and your configurations will
-- become version one for each agent"): Maker, Scout, Keeper, Editor and Muse,
-- each a character of its own with a draft and a version 1, "Version 1", its
-- whole look (resolveCharacter). The sixth, the Guide, is Bali above. His names
-- for the five (2026-09-30): Kino the Maker, Zaza the Scout, Oru the Keeper, Mira
-- the Editor, Lola the Muse; the job is what each is, not its name (Agents.md).
do $$
declare
  agent uuid;
  other uuid;
  maker constant jsonb := '{"body":{"size":0.56,"paint":"lime","shade":0.6,"body":"ball","shape":"cube","rotate-x":0,"rotate-y":0,"rotate-z":0,"length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":1.1,"hang":480,"bounces":1,"first":0.3,"bounciness":0,"squash":0.1,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":500,"sway":0,"squeeze":0.4,"spread":0,"breath":3000,"breath-depth":0.06,"grain":0,"grain-size":0.03,"grain-colour":"light","depth":0},"face":{"eyes":{"values":{"eye-size":0.22,"eye-spacing":0.5,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"dot","values":{"pupil-size":0.5,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"plain","values":{"lower-raise":0.2,"lower-slant":0,"lower-curve":0.6}},"brows":{"style":"line","values":{"brow-height":0.12,"brow-angle":-6,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.07,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  scout constant jsonb := '{"body":{"size":0.5,"paint":"yellow","shade":0.55,"body":"jelly","shape":"cone","rotate-x":0,"rotate-y":0,"rotate-z":0,"length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":40,"squat":0.25,"height":1.4,"hang":420,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.8,"come-back":800,"sway":0.3,"squeeze":0.4,"spread":0.05,"breath":2400,"breath-depth":0.14,"grain":0,"grain-size":0.03,"grain-colour":"light","depth":0},"face":{"eyes":{"values":{"eye-size":0.3,"eye-spacing":0.45,"eye-height":0.36,"look-x":0,"look-y":0,"look":1,"look-lead":200}},"pupils":{"style":"shine","values":{"pupil-size":0.55,"shine-size":0.32,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"arch","values":{"brow-height":0.1,"brow-angle":-12,"brow-arch":0.6,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  keeper constant jsonb := '{"body":{"size":0.66,"paint":"blue","shade":0.7,"body":"ball","shape":"hexagonal-prism","rotate-x":0,"rotate-y":0,"rotate-z":0,"length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":160,"squat":0.25,"height":0.5,"hang":700,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.3,"come-back":1400,"sway":0,"squeeze":0.4,"spread":0,"breath":6000,"breath-depth":0.05,"grain":0,"grain-size":0.03,"grain-colour":"light","depth":0},"face":{"eyes":{"values":{"eye-size":0.2,"eye-spacing":0.42,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"dot","values":{"pupil-size":0.5,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"heavy","values":{"lid-open":0.85,"lid-slant":0,"lid-curve":0.2,"blink-every":6000,"blink":220,"squint":0.6}},"lower-lids":{"style":"plain","values":{"lower-raise":0.12,"lower-slant":0,"lower-curve":0}},"brows":{"style":"none","values":{"brow-height":0.12,"brow-angle":0,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  editor constant jsonb := '{"body":{"size":0.54,"paint":"grey","shade":0.5,"body":"ball","shape":"cylinder","rotate-x":0,"rotate-y":0,"rotate-z":0,"length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":90,"squat":0.25,"height":0.8,"hang":520,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":700,"sway":0,"squeeze":0.4,"spread":0,"breath":4500,"breath-depth":0.08,"grain":0,"grain-size":0.03,"grain-colour":"light","depth":0},"face":{"eyes":{"values":{"eye-size":0.24,"eye-spacing":0.44,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"dot","values":{"pupil-size":0.6,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":0.85,"lid-slant":0.25,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"line","values":{"brow-height":0.14,"brow-angle":8,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.05,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  muse constant jsonb := '{"body":{"size":0.5,"paint":"pink","shade":0.65,"body":"slime","shape":"hemisphere","rotate-x":0,"rotate-y":0,"rotate-z":0,"length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":1.2,"hang":600,"bounces":0,"first":0,"bounciness":0,"squash":0.2,"wobble":400,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":500,"sway":0.5,"squeeze":0.4,"spread":0.16,"breath":3400,"breath-depth":0.12,"grain":0,"grain-size":0.03,"grain-colour":"light","depth":0},"face":{"eyes":{"values":{"eye-size":0.26,"eye-spacing":0.45,"eye-height":0.22,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"shine","values":{"pupil-size":0.55,"shine-size":0.4,"shine-angle":-30}},"upper-lids":{"style":"plain","values":{"lid-open":0.9,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"plain","values":{"lower-raise":0.25,"lower-slant":0,"lower-curve":0.9}},"brows":{"style":"arch","values":{"brow-height":0.16,"brow-angle":0,"brow-arch":0.8,"brow-length":1,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  v15 constant jsonb := '{"body":{"size":0.6,"paint":"violet","shade":0.75,"body":"slime","shape":"sphere","length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":0.95,"hang":550,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":500,"sway":0,"squeeze":0.4,"spread":0.11,"breath":4000,"breath-depth":0.1,"texture":"none","texture-size":0.2,"texture-colour":"light"},"face":{"eyes":{"values":{"eye-size":0.24,"eye-spacing":0.45,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"none","values":{"pupil-size":0.55,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"none","values":{"brow-height":0.12,"brow-angle":0,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  v14 constant jsonb := '{"body":{"size":0.6,"paint":"violet","shade":0.75,"body":"slime","length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":0.95,"hang":550,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":500,"sway":0,"squeeze":0.4,"spread":0.05,"breath":4000,"breath-depth":0.1},"face":{"eyes":{"values":{"eye-size":0.24,"eye-spacing":0.45,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"none","values":{"pupil-size":0.55,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"none","values":{"brow-height":0.12,"brow-angle":0,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  v13 constant jsonb := '{"body":{"size":0.6,"paint":"violet","shade":0.75,"body":"slime","length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":0.95,"hang":550,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":1000,"sway":0,"squeeze":0.4,"spread":0,"breath":4000,"breath-depth":0.1},"face":{"eyes":{"values":{"eye-size":0.24,"eye-spacing":0.45,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"none","values":{"pupil-size":0.55,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"none","values":{"brow-height":0.12,"brow-angle":0,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
  v12 constant jsonb := '{"body":{"size":0.6,"paint":"violet","shade":0.75,"body":"slime","length":0.8,"taper":0,"stiffness":0,"swing":0,"stretch":0,"columns":1,"rows":6,"crouch":60,"squat":0.25,"height":0.95,"hang":550,"bounces":0,"first":0,"bounciness":0,"squash":0,"wobble":20,"wobble-speed":40,"give":0,"land-at":-30,"slippery":1,"slide-way":"with","energy":0.53,"come-back":1200,"sway":0,"squeeze":0.4,"spread":0,"breath":4000,"breath-depth":0.1},"face":{"eyes":{"values":{"eye-size":0.24,"eye-spacing":0.45,"eye-height":0.3,"look-x":0,"look-y":0,"look":0.8,"look-lead":1000}},"pupils":{"style":"none","values":{"pupil-size":0.55,"shine-size":0.3,"shine-angle":-45}},"upper-lids":{"style":"plain","values":{"lid-open":1,"lid-slant":0,"lid-curve":0.5,"blink-every":3600,"blink":170,"squint":0.6}},"lower-lids":{"style":"none","values":{"lower-raise":0,"lower-slant":0,"lower-curve":0}},"brows":{"style":"none","values":{"brow-height":0.12,"brow-angle":0,"brow-arch":0.3,"brow-length":1.2,"brow-thickness":0.06,"brow-colour":"deep"}},"symbols":{"style":"none","values":{"symbol-size":0.35,"symbol-at":45,"symbol-colour":"paint"}}}}';
begin
  -- Bali (his name for it, 2026-09-30: "the first agent can be named as guide. Bali"), the Guide: the Agent until then.
  insert into public.studio_items (kind, name) values ('character', 'Bali') returning id into agent;
  insert into public.studio_drafts (item_id, data) values (agent, v15);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (agent, 12, 'his settings', v12, '2.0.0');
  -- Numbered by the trigger (13, 14, then 15), and each made current by it.
  insert into public.studio_versions (item_id, label, data, ui_version)
    values (agent, 'Version 13, tuned', v13, '2.0.0');
  insert into public.studio_versions (item_id, label, data, ui_version)
    values (agent, 'Version 13, tuned, tuned', v14, '2.0.0');
  insert into public.studio_versions (item_id, label, data, ui_version)
    values (agent, 'his version 14, as it looks', v15, '2.0.0');
  -- The five, each numbered 1 by hand (an item's first version may name its number) and made current by the trigger.
  insert into public.studio_items (kind, name) values ('character', 'Kino') returning id into other; -- the Maker
  insert into public.studio_drafts (item_id, data) values (other, maker);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (other, 1, 'Version 1', maker, '2.0.0');
  insert into public.studio_items (kind, name) values ('character', 'Zaza') returning id into other; -- the Scout
  insert into public.studio_drafts (item_id, data) values (other, scout);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (other, 1, 'Version 1', scout, '2.0.0');
  insert into public.studio_items (kind, name) values ('character', 'Oru') returning id into other; -- the Keeper
  insert into public.studio_drafts (item_id, data) values (other, keeper);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (other, 1, 'Version 1', keeper, '2.0.0');
  insert into public.studio_items (kind, name) values ('character', 'Mira') returning id into other; -- the Editor
  insert into public.studio_drafts (item_id, data) values (other, editor);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (other, 1, 'Version 1', editor, '2.0.0');
  insert into public.studio_items (kind, name) values ('character', 'Lola') returning id into other; -- the Muse
  insert into public.studio_drafts (item_id, data) values (other, muse);
  insert into public.studio_versions (item_id, number, label, data, ui_version)
    values (other, 1, 'Version 1', muse, '2.0.0');
end;
$$;
