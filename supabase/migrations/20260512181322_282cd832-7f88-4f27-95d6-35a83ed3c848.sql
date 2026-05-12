
drop policy if exists "farmers insert own farm" on public.farms;
create policy "farmers insert own farm" on public.farms
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'farmer')
  );
