import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r) => r.product_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async (productId: string) => {
    if (!user) return false;
    if (ids.has(productId)) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      setIds((s) => { const n = new Set(s); n.delete(productId); return n; });
      return false;
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      setIds((s) => new Set(s).add(productId));
      return true;
    }
  }, [user, ids]);

  return { ids, toggle, has: (id: string) => ids.has(id), refresh, ready: !!user };
}
