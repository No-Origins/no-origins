-- =============================================================================
-- Storage — Admin.md §8.2
--
-- Two buckets, and the difference between them is the point:
--
--   `assets`   private. Uploads: the résumé PDF, source photographs, anything a
--              panel links. Read through signed URLs.
--   `publish`  public read. The published doc JSON per version at a stable path,
--              plus derived static output.
--
-- `publish` being publicly readable is NOT the anon read policy §8.3 forbids.
-- That rule is about the *tables*: the live site must not query the database.
-- This bucket is the other side of that rule — it is the pipeline's output, and
-- output is meant to be fetched without credentials. Nothing is written here
-- that is not already on a public page.
--
-- Photographs live in `assets` as of the 2026-09-11 reversal (Design-System.md
-- §13). Their `alt`, width and height are columns on `public.assets`, not
-- metadata on the object: a document has to reserve the box before the picture
-- arrives, and alt text that lives at the point of use is alt text that gets
-- written once and copy-pasted after that.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('assets',  'assets',  false, 52428800, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/markdown'
  ]),
  ('publish', 'publish', true,  10485760, array[
    'application/json', 'image/png', 'image/jpeg', 'image/svg+xml', 'text/plain'
  ])
on conflict (id) do nothing;

-- ── assets · private, staff only ─────────────────────────────────────────────
create policy assets_objects_read on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and public.noo_is('owner', 'editor', 'viewer'));

create policy assets_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assets' and public.noo_is('owner', 'editor'));

create policy assets_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'assets' and public.noo_is('owner', 'editor'))
  with check (bucket_id = 'assets' and public.noo_is('owner', 'editor'));

-- Deleting a source file can break a published version that still points at it,
-- so it is the owner's to do.
create policy assets_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'assets' and public.noo_is('owner'));

-- ── publish · public read, staff write ───────────────────────────────────────
-- The bucket is public, so reads go through the public URL and need no policy.
-- Writing is the publish pipeline's, which runs as an editor or the service role.
create policy publish_objects_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'publish' and public.noo_is('owner', 'editor'));

create policy publish_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'publish' and public.noo_is('owner', 'editor'))
  with check (bucket_id = 'publish' and public.noo_is('owner', 'editor'));

create policy publish_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'publish' and public.noo_is('owner'));
