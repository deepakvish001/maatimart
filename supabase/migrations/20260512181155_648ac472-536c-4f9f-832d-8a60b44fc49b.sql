
-- Roles enum and table
create type public.app_role as enum ('consumer','farmer','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Farms
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  region text not null,
  story text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.farms enable row level security;
create index on public.farms(owner_id);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'vegetables',
  price_paise integer not null check (price_paise >= 0),
  unit text not null default 'kg',
  stock numeric not null default 0,
  image_url text,
  is_organic boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create index on public.products(farm_id);
create index on public.products(category);
create index on public.products(is_active);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references auth.users(id) on delete cascade,
  total_paise integer not null,
  status text not null default 'placed',
  address text not null,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create index on public.orders(consumer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  farm_id uuid not null references public.farms(id),
  product_name text not null,
  unit text not null,
  qty numeric not null,
  unit_price_paise integer not null,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create index on public.order_items(order_id);
create index on public.order_items(farm_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_farms_updated before update on public.farms for each row execute function public.set_updated_at();
create trigger trg_products_updated before update on public.products for each row execute function public.set_updated_at();

-- Auto-create profile + default consumer role on signup; honour requested role meta
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.user_roles (user_id, role) values (new.id, 'consumer');

  requested_role := new.raw_user_meta_data->>'role';
  if requested_role = 'farmer' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'farmer')
    on conflict do nothing;
  end if;

  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "users read own roles" on public.user_roles for select using (auth.uid() = user_id);

-- farms (public read)
create policy "anyone read farms" on public.farms for select using (true);
create policy "farmers insert own farm" on public.farms for insert with check (auth.uid() = owner_id and public.has_role(auth.uid(),'farmer'));
create policy "farmers update own farm" on public.farms for update using (auth.uid() = owner_id);
create policy "farmers delete own farm" on public.farms for delete using (auth.uid() = owner_id);

-- products (public read of active; owner full)
create policy "anyone read active products" on public.products for select using (is_active or exists (select 1 from public.farms f where f.id = products.farm_id and f.owner_id = auth.uid()));
create policy "farmers insert own products" on public.products for insert with check (exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy "farmers update own products" on public.products for update using (exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy "farmers delete own products" on public.products for delete using (exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));

-- orders
create policy "consumer reads own orders" on public.orders for select using (auth.uid() = consumer_id);
create policy "consumer inserts own order" on public.orders for insert with check (auth.uid() = consumer_id);
create policy "farmer reads orders for their farm" on public.orders for select using (
  exists (select 1 from public.order_items oi join public.farms f on f.id = oi.farm_id
          where oi.order_id = orders.id and f.owner_id = auth.uid())
);
create policy "farmer updates orders for their farm" on public.orders for update using (
  exists (select 1 from public.order_items oi join public.farms f on f.id = oi.farm_id
          where oi.order_id = orders.id and f.owner_id = auth.uid())
);

-- order_items
create policy "consumer reads own items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.consumer_id = auth.uid())
);
create policy "consumer inserts own items" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.consumer_id = auth.uid())
);
create policy "farmer reads items for own farm" on public.order_items for select using (
  exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())
);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('produce-images','produce-images', true)
  on conflict (id) do nothing;

create policy "public read produce images" on storage.objects for select using (bucket_id = 'produce-images');
create policy "auth upload produce images" on storage.objects for insert
  with check (bucket_id = 'produce-images' and auth.uid() is not null);
create policy "owner update produce images" on storage.objects for update
  using (bucket_id = 'produce-images' and auth.uid() = owner);
create policy "owner delete produce images" on storage.objects for delete
  using (bucket_id = 'produce-images' and auth.uid() = owner);
