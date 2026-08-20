import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/farmer/orders")({ component: FarmerOrders });

const NEXT: Record<string, string> = { placed: "shipped", shipped: "delivered" };

function FarmerOrders() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["farmer-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: farms } = await supabase.from("farms").select("id").eq("owner_id", user!.id);
      const farmIds = (farms ?? []).map((f) => f.id);
      if (farmIds.length === 0) return [];
      const { data } = await supabase
        .from("orders")
        .select(
          "id,status,total_paise,address,created_at,order_items!inner(product_name,qty,unit,unit_price_paise,farm_id)",
        )
        .in("order_items.farm_id", farmIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Incoming Orders</h1>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
        Manage shipments
      </p>
      <div className="space-y-4">
        {(data?.length ?? 0) === 0 ? (
          <p className="bg-card p-6 text-muted-foreground">No orders yet.</p>
        ) : (
          data!.map((o) => (
            <div key={o.id} className="bg-card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest mt-1 text-accent">
                    {o.status}
                  </p>
                </div>
                <p className="font-mono font-bold text-accent">{formatINR(o.total_paise)}</p>
              </div>
              <ul className="text-sm divide-y divide-border mb-3">
                {o.order_items.map((i: any, idx: number) => (
                  <li key={idx} className="py-2 flex justify-between">
                    <span>
                      {i.product_name} × {i.qty} {i.unit}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {formatINR(i.unit_price_paise * Number(i.qty))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mb-3">Delivering to: {o.address}</p>
              {NEXT[o.status] && (
                <button
                  onClick={async () => {
                    await supabase.from("orders").update({ status: NEXT[o.status] }).eq("id", o.id);
                    qc.invalidateQueries({ queryKey: ["farmer-orders"] });
                  }}
                  className="px-4 py-2 bg-accent text-accent-foreground text-xs font-medium uppercase tracking-widest"
                >
                  Mark as {NEXT[o.status]}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
