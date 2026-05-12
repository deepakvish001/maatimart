-- Break the orders <-> order_items RLS recursion by routing the
-- "farmer can see/update orders for their farm" check through a
-- SECURITY DEFINER function that bypasses RLS on order_items/farms.

CREATE OR REPLACE FUNCTION public.user_owns_order_farm(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.farms f ON f.id = oi.farm_id
    WHERE oi.order_id = _order_id
      AND f.owner_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "farmer reads orders for their farm" ON public.orders;
DROP POLICY IF EXISTS "farmer updates orders for their farm" ON public.orders;

CREATE POLICY "farmer reads orders for their farm"
ON public.orders
FOR SELECT
USING (public.user_owns_order_farm(id, auth.uid()));

CREATE POLICY "farmer updates orders for their farm"
ON public.orders
FOR UPDATE
USING (public.user_owns_order_farm(id, auth.uid()));

-- Same recursion risk on order_status_events (farmer policy joins order_items
-- and farms while orders' policies query order_items). Route through the same
-- helper so subqueries don't re-enter RLS.
DROP POLICY IF EXISTS "farmer reads events for their farm" ON public.order_status_events;
CREATE POLICY "farmer reads events for their farm"
ON public.order_status_events
FOR SELECT
USING (public.user_owns_order_farm(order_id, auth.uid()));