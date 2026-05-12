CREATE TABLE public.farm_wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, farm_id)
);

ALTER TABLE public.farm_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own farm wishlist"
  ON public.farm_wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users add own farm wishlist"
  ON public.farm_wishlists FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_wishlists.farm_id)
  );

CREATE POLICY "users delete own farm wishlist"
  ON public.farm_wishlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_farm_wishlists_user ON public.farm_wishlists(user_id);
CREATE INDEX idx_farm_wishlists_farm ON public.farm_wishlists(farm_id);