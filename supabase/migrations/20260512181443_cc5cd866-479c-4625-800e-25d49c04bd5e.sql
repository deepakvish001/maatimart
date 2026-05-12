
-- Allow seed/system-owned rows by relaxing the strict FK to auth.users
alter table public.farms drop constraint if exists farms_owner_id_fkey;

-- Seed three demo farms with a deterministic system owner
do $$
declare
  seed_owner constant uuid := '00000000-0000-0000-0000-00000000aaaa';
  f1 uuid; f2 uuid; f3 uuid;
begin
  insert into public.farms (id, owner_id, name, region, story, image_url) values
    (gen_random_uuid(), seed_owner, 'Desai Organic Farm', 'Sangli, Maharashtra',
     'Three generations of certified-organic vegetable growers along the Krishna river.', '/seed/farm-1.jpg')
    returning id into f1;
  insert into public.farms (id, owner_id, name, region, story, image_url) values
    (gen_random_uuid(), seed_owner, 'Sawant Orchards', 'Ratnagiri, Maharashtra',
     'Coastal Konkan orchards harvesting hand-picked Alphonso mangoes every April–June.', '/seed/farm-2.jpg')
    returning id into f2;
  insert into public.farms (id, owner_id, name, region, story, image_url) values
    (gen_random_uuid(), seed_owner, 'Nila Valley Collective', 'Wayanad, Kerala',
     'A women-led co-op growing bio-dynamic turmeric, ginger, and forest spices.', '/seed/farm-3.jpg')
    returning id into f3;

  insert into public.products (farm_id, name, description, category, price_paise, unit, stock, image_url, is_organic) values
    (f1, 'Heirloom Vine Tomatoes', 'Sun-ripened heirloom tomatoes, harvested at dawn.', 'vegetables', 8500, 'kg', 40, '/seed/p-tomatoes.jpg', true),
    (f1, 'Baby Spinach', 'Tender baby spinach, washed and bunch-tied.', 'vegetables', 4000, 'bunch', 30, '/seed/p-spinach.jpg', true),
    (f1, 'Kateri Brinjal', 'Deep purple Maharashtrian brinjal varietal.', 'vegetables', 4500, 'kg', 25, '/seed/p-brinjal.jpg', true),
    (f1, 'Fresh Green Chilies', 'Sharp, fragrant green chilies for everyday cooking.', 'vegetables', 6000, 'kg', 18, '/seed/p-chilies.jpg', false),
    (f1, 'Red Onions', 'Small, sweet Maharashtra red onions.', 'vegetables', 3500, 'kg', 80, '/seed/p-onions.jpg', false),
    (f2, 'Ratnagiri Alphonso Mangoes', 'Hand-picked, naturally ripened. Limited season.', 'fruits', 120000, 'dozen', 10, '/seed/p-mangoes.jpg', true),
    (f3, 'Wild Forest Turmeric', 'Bio-dynamic turmeric roots from the Western Ghats.', 'spices', 24000, '500g', 22, '/seed/p-turmeric.jpg', true),
    (f3, 'Single-Origin Black Pepper', 'Vine-ripened pepper, sun-dried on coir mats.', 'spices', 32000, '250g', 15, null, true);
end $$;
