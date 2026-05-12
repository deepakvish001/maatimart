import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, cartTotal } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { items, clear } = useCart();
  const total = cartTotal(items);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/checkout" } });
  }, [user, loading, navigate]);

  const placeOrder = async () => {
    if (!user) return;
    if (!address.trim()) return toast.error("Add a delivery address");
    if (items.length === 0) return toast.error("Your cart is empty");
    setSubmitting(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({ consumer_id: user.id, total_paise: total, address, phone, status: "placed" })
        .select("id").single();
      if (oErr) throw oErr;
      const { error: iErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id, product_id: i.productId, farm_id: i.farmId,
          product_name: i.name, unit: i.unit, qty: i.qty, unit_price_paise: i.pricePaise,
        })),
      );
      if (iErr) throw iErr;
      clear();
      toast.success("Order placed!");
      navigate({ to: "/orders" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to place order");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 mx-auto max-w-3xl w-full">
        <h1 className="font-display text-5xl mb-8">Checkout</h1>
        <div className="bg-card p-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Delivery address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="border-t border-border pt-4 flex justify-between">
            <span>Total</span>
            <span className="font-mono font-bold text-accent">{formatINR(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Cash on delivery — payment on receipt. Production version supports UPI & cards.</p>
          <Button onClick={placeOrder} disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? "Placing order…" : "Place order"}
          </Button>
          <Link to="/cart" className="block text-center text-xs text-muted-foreground hover:text-primary">Back to cart</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
