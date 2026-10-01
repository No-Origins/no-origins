-- =============================================================================
-- The agents' actions — Motion.md M24 (his, 2026-10-01)
--
-- "we will remove everything uh, currently the agents have in motions and uh,
-- probably I might say something like uh, okay now I need more bounce action so
-- now you add bounce action you add uh, the controls that are needed uh, for
-- bounce … once I like it I should be able to publish it." — Bhargav.
--
-- An ACTION is a thing an agent does, by its name — Bounce is the first. What it
-- can be (its controls, how it moves) is declared in code
-- (@no-origins/ui/lib/agent-actions); what he picks for it is data, here, kept
-- as every studio thing is: one item, one draft saved as he goes, and published
-- versions, `major`.`minor` (Orbit.md C19), frozen.
--
--   studio_items   kind 'action', named as the action is in code ("Bounce").
--                  An action is every agent's (Motion.md M23), so it names no
--                  character and no slot.
--   studio_drafts  { "action": "<its id in code>", "values": { … } }: every
--                  control's value, held whole, keyed by setting id.
--
-- And the motions go (his answer, M24: "delete the saved motions"): every
-- motion never published, with its draft. A motion with a published version
-- stays — `studio_versions_frozen` keeps it, and that is M20's rule, not one this
-- migration lifts. On the local stack on 2026-10-01 there was one motion, a
-- draft with no versions; the hosted project is checked when this is pushed.
--
-- Adds a kind and replaces the shape check; drops nothing else.
-- =============================================================================

-- ── the kind ─────────────────────────────────────────────────────────────────
-- The new label is not used anywhere in this transaction (Postgres refuses that):
-- the shape check below compares the kind as text.
alter type public.noo_studio_kind add value if not exists 'action';

-- ── its shape ────────────────────────────────────────────────────────────────
alter table public.studio_items drop constraint studio_items_shape;
alter table public.studio_items add constraint studio_items_shape check (
  case kind::text
    when 'character' then character_id is null and slot is null
    when 'motion'    then character_id is not null and slot is null
    when 'drawing'   then slot is not null and btrim(slot) <> ''
    when 'action'    then character_id is null and slot is null
  end
);

comment on table public.studio_items is
  'Motion.md M20, M24, Orbit.md C6. A character, a motion, an uploaded drawing or '
  'an action, with one draft and its published versions.';
comment on column public.studio_drafts.data is
  'A character: CharacterLook ({ body, face }), held whole. A motion: its timeline and rows. '
  'An action (Motion.md M24): { action, values }, every control''s value held whole, keyed by setting id.';

-- ── the motions, never published ─────────────────────────────────────────────
-- Their drafts go with them (`on delete cascade`).
delete from public.studio_items i
 where i.kind = 'motion'
   and not exists (select 1 from public.studio_versions v where v.item_id = i.id);

notify pgrst, 'reload schema';
