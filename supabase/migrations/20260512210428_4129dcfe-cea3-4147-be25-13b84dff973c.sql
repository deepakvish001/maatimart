REVOKE EXECUTE ON FUNCTION public.user_owns_order_farm(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_order_farm(uuid, uuid) TO authenticated;