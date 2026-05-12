
REVOKE EXECUTE ON FUNCTION public.user_has_delivered_product(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status() FROM PUBLIC, anon, authenticated;
