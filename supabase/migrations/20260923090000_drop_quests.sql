-- =============================================================================
-- Quests removed — Admin.md §0.7 (2026-09-23)
--
-- "remove showcase /composes, admin's too and also quests feature." — Bhargav.
--
-- The quests feature, its compose dashboard and the showcase's composer went
-- together; nothing reads or writes `quests` any more. Identity stays exactly as
-- §0.5 left it: `profiles`, `allowlist`, the allowlist gate, their RLS, and the
-- role functions they use (`noo_role`, `noo_current_role()`, `noo_is()`).
-- `touch_updated_at()` goes too: `quests` was the last table whose trigger called
-- it (`profiles` has no `updated_at`), so after this nothing does.
--
-- **This drops data.** Every row in `quests` goes with the table. Apply it to the
-- hosted project deliberately (supabase/README.md), not as a side effect.
-- =============================================================================

-- CASCADE takes the table's four policies, both triggers and its indexes.
drop table    if exists public.quests cascade;
drop function if exists public.noo_touch_quest_layout() cascade;
drop type     if exists public.noo_quest_status;
drop function if exists public.touch_updated_at();
