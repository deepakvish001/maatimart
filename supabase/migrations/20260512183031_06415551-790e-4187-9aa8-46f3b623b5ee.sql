
-- ============ Wishlists ============
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users add own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- ============ Notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============ Product reviews ============
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Helper: did the user actually receive this product?
CREATE OR REPLACE FUNCTION public.user_has_delivered_product(_user uuid, _product uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.consumer_id = _user
      AND oi.product_id = _product
      AND o.status = 'delivered'
  );
$$;

CREATE POLICY "anyone read reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "delivered customers can review" ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.user_has_delivered_product(auth.uid(), product_id));
CREATE POLICY "users update own reviews" ON public.product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own reviews" ON public.product_reviews FOR DELETE USING (auth.uid() = user_id);

-- ============ Order status events ============
CREATE TABLE public.order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_events_order ON public.order_status_events(order_id, created_at);
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consumer reads own order events" ON public.order_status_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.consumer_id = auth.uid()));
CREATE POLICY "farmer reads events for their farm" ON public.order_status_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.farms f ON f.id = oi.farm_id
    WHERE oi.order_id = order_status_events.order_id AND f.owner_id = auth.uid()
  ));

-- ============ Product / farm extras ============
ALTER TABLE public.products ADD COLUMN rating_avg numeric(3,2) NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN rating_count int NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN low_stock_threshold int NOT NULL DEFAULT 5;
ALTER TABLE public.farms ADD COLUMN delivery_pincodes text[] NOT NULL DEFAULT '{}';

-- ============ Triggers ============

-- Maintain product rating aggregates
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products
  SET rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.product_reviews WHERE product_id = pid), 0),
      rating_count = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = pid)
  WHERE id = pid;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_review_aggregate
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- Log status changes + notify customer
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_events(order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Order placed');
    -- Notify each farmer with items in this order
    INSERT INTO public.notifications(user_id, title, body, link)
    SELECT DISTINCT f.owner_id,
           'New order received',
           'You have a new order to fulfil.',
           '/farmer/orders'
    FROM public.order_items oi
    JOIN public.farms f ON f.id = oi.farm_id
    WHERE oi.order_id = NEW.id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_events(order_id, status, note)
    VALUES (NEW.id, NEW.status, NULL);
    INSERT INTO public.notifications(user_id, title, body, link)
    VALUES (NEW.consumer_id,
            'Order update',
            'Your order is now ' || NEW.status || '.',
            '/orders');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_orders_status_log
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;
