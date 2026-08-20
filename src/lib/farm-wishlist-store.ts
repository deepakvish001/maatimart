import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useFarmWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    const { data } = await supabase.from("farm_wishlists").select("farm_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r) => r.farm_id)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (farmId: string) => {
      if (!user) return false;
      if (ids.has(farmId)) {
        await supabase.from("farm_wishlists").delete().eq("user_id", user.id).eq("farm_id", farmId);
        setIds((s) => {
          const n = new Set(s);
          n.delete(farmId);
          return n;
        });
        return false;
      } else {
        await supabase.from("farm_wishlists").insert({ user_id: user.id, farm_id: farmId });
        setIds((s) => new Set(s).add(farmId));
        return true;
      }
    },
    [user, ids],
  );

  return { ids, toggle, has: (id: string) => ids.has(id), refresh, ready: !!user };
}
