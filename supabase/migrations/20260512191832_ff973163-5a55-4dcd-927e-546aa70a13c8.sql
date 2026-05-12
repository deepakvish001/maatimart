
DROP POLICY IF EXISTS "anyone can log farm visits" ON public.farm_visits;

CREATE POLICY "log farm visits with valid farm and user"
ON public.farm_visits
FOR INSERT
TO public
WITH CHECK (
  EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_visits.farm_id)
  AND (farm_visits.user_id IS NULL OR farm_visits.user_id = auth.uid())
);
