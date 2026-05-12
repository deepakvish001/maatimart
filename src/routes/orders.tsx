import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", search: { redirect: "/orders" } }); }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_paise,status,address,created_at,order_items(product_name,qty,unit,unit_price_paise)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 mx-auto max-w-5xl w-full">
        <h1 className="font-display text-5xl mb-8">Your Orders</h1>
        {(data?.length ?? 0) === 0 ? (
          <div className="bg-card p-10 text-center text-muted-foreground">
            No orders yet. <Link to="/marketplace" className="text-primary hover:underline">Browse the harvest →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data!.map((o) => (
              <div key={o.id} className="bg-card p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0,8)} · {new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1 text-accent">{o.status}</p>
                  </div>
                  <p className="font-mono font-bold text-accent">{formatINR(o.total_paise)}</p>
                </div>
                <ul className="text-sm divide-y divide-border">
                  {o.order_items.map((i, idx) => (
                    <li key={idx} className="py-2 flex justify-between">
                      <span>{i.product_name} × {i.qty} {i.unit}</span>
                      <span className="font-mono text-muted-foreground">{formatINR(i.unit_price_paise * Number(i.qty))}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">Delivering to: {o.address}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
