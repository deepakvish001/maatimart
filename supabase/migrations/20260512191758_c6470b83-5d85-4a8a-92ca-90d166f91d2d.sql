
CREATE TABLE public.farm_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id uuid,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_farm_visits_farm_id ON public.farm_visits(farm_id);
CREATE INDEX idx_farm_visits_created_at ON public.farm_visits(created_at DESC);

ALTER TABLE public.farm_visits ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can log a visit
CREATE POLICY "anyone can log farm visits"
ON public.farm_visits
FOR INSERT
TO public
WITH CHECK (true);

-- Farm owners can read visits to their own farm
CREATE POLICY "farm owners read visits"
ON public.farm_visits
FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_visits.farm_id AND f.owner_id = auth.uid()));
