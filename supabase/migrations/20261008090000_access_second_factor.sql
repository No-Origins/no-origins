-- =============================================================================
-- Access — the admin's second factor, step 3: the requirement (Access.md A12)
--
-- An `admin.*` permission counts only in a session that has passed a second
-- factor: `aal2` in the token, after an authenticator app's code — or a session
-- signed in with a passkey, which is the device and its unlock at once and which
-- the token tells apart (`amr` method `passkey`; his, 2026-10-08). Every other
-- permission is unchanged: the motion studio, Home and Orbit open on one factor.
--
-- `noo_can()` asks it, so every rule and function that asks `noo_can()` for an
-- `admin.*` permission refuses on one factor, the Owner's included, whatever a
-- page does. The token hook still writes every permission into `perms`; the gate
-- and `shown()` read `aal` and `amr` beside it (`@no-origins/auth`).
--
-- Pushed to the hosted project only after he has enrolled (A12, step 2).
-- Replaces `noo_can()`; adds `noo_second_factor()`. Drops nothing.
-- =============================================================================

-- Whether this request's session passed a second factor: `aal2`, or a passkey
-- sign-in. `amr` is a list of `{ method, timestamp }`; the plain RFC 8176 list of
-- method names is accepted too.
create or replace function public.noo_second_factor()
returns boolean language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
    or coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb) @> '[{"method": "passkey"}]'::jsonb
    or coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb) @> '["passkey"]'::jsonb;
$$;
revoke execute on function public.noo_second_factor() from public;
grant execute on function public.noo_second_factor() to anon, authenticated;

create or replace function public.noo_can(p_permission text, p_item text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and (p_permission not like 'admin.%' or public.noo_second_factor())
    and (
      public.noo_is_owner()
      or exists (
        select 1 from public.role_assignments a
        join public.role_permissions rp on rp.role_id = a.role_id
        where a.principal_id = (select auth.uid()) and rp.permission = p_permission
      )
    );
$$;
