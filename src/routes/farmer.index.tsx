import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/farmer/")({ component: Overview });

function Overview() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["farmer-overview", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: farms } = await supabase.from("farms").select("id").eq("owner_id", user!.id);
      const farmIds = (farms ?? []).map((f) => f.id);
      const { data: products } = await supabase
        .from("products")
        .select("id,stock")
        .in("farm_id", farmIds.length ? farmIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data: items } = await supabase
        .from("order_items")
        .select("qty,unit_price_paise,order_id")
        .in("farm_id", farmIds.length ? farmIds : ["00000000-0000-0000-0000-000000000000"]);
      const revenue = (items ?? []).reduce((s, i) => s + i.unit_price_paise * Number(i.qty), 0);
      const orders = new Set((items ?? []).map((i) => i.order_id)).size;
      const lowStock = (products ?? []).filter((p) => Number(p.stock) <= 5).length;
      return { revenue, orders, products: products?.length ?? 0, lowStock };
    },
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Harvest Hub</h1>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
        Your farm at a glance
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total revenue", value: formatINR(data?.revenue ?? 0) },
          { label: "Orders", value: data?.orders ?? 0 },
          { label: "Active listings", value: data?.products ?? 0 },
          { label: "Low stock", value: data?.lowStock ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {s.label}
            </p>
            <p className="font-mono text-2xl font-bold text-accent">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
