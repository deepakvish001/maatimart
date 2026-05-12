
-- Add search_path to set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Lock down SECURITY DEFINER functions from public/anon execution
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Replace overly broad public listing on the bucket (still public-read-via-URL via signed URLs/CDN paths is fine,
-- we just stop anonymous LIST/SELECT scans)
drop policy if exists "public read produce images" on storage.objects;
create policy "auth read produce images" on storage.objects for select
  using (bucket_id = 'produce-images' and auth.uid() is not null);
