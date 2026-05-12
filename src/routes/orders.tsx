import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Package, ArrowRight, MapPin, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/format";
import { OrderTimeline } from "@/components/order-timeline";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-primary/10 text-primary",
  confirmed: "bg-primary/10 text-primary",
  packed: "bg-amber-500/10 text-amber-700",
  shipped: "bg-blue-500/10 text-blue-700",
  delivered: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

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
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-14 mx-auto max-w-5xl w-full">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">My account</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Your orders</h1>
            <p className="mt-2 text-muted-foreground">Track every basket from farm to doorstep.</p>
          </div>
          {(data?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-border bg-background px-5 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Total orders</p>
              <p className="font-display text-2xl font-bold text-primary">{data!.length}</p>
            </div>
          )}
        </div>

        {(data?.length ?? 0) === 0 ? (
          <div className="rounded-3xl border border-border bg-background p-12 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your harvest history will appear here once you place an order.</p>
            <Link to="/marketplace" className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-6 h-11 font-semibold hover:bg-primary/90 transition-colors">
              Browse the harvest <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {data!.map((o) => {
              const statusStyle = STATUS_STYLES[o.status] ?? "bg-muted text-foreground";
              return (
                <article key={o.id} className="rounded-3xl border border-border bg-background shadow-sm overflow-hidden">
                  <header className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></span>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm font-medium">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyle}`}>
                        {o.status}
                      </span>
                      <p className="font-display text-xl font-bold text-primary">{formatINR(o.total_paise)}</p>
                    </div>
                  </header>
                  <div className="p-6 grid md:grid-cols-[1fr_220px] gap-6">
                    <div>
                      <ul className="divide-y divide-border text-sm">
                        {o.order_items.map((i, idx) => (
                          <li key={idx} className="py-2.5 flex justify-between gap-4">
                            <span className="truncate"><span className="font-medium">{i.product_name}</span> <span className="text-muted-foreground">× {i.qty} {i.unit}</span></span>
                            <span className="font-mono text-muted-foreground shrink-0">{formatINR(i.unit_price_paise * Number(i.qty))}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {o.address}
                      </p>
                    </div>
                    <div className="md:border-l md:border-border md:pl-6">
                      <OrderTimeline orderId={o.id} currentStatus={o.status} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
