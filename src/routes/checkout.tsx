import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MapPin, Phone, ArrowLeft, ShieldCheck, Truck, Banknote, Zap, Leaf, Clock, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, cartTotal } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getDeliveryEta, etaToneClasses, type EtaTone } from "@/lib/delivery-eta";

type ShippingId = "standard" | "express" | "scheduled";

interface ShippingOption {
  id: ShippingId;
  name: string;
  blurb: string;
  icon: typeof Truck;
  fee: (subtotalPaise: number) => number;
  eta: (subtotalPaise: number) => { label: string; tone: EtaTone; detail: string };
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard",
    blurb: "Free over ₹499 · 1–2 days",
    icon: Truck,
    fee: (s) => (s >= 49900 || s === 0 ? 0 : 4900),
    eta: (s) => getDeliveryEta({ stock: 1, cartTotalPaise: s }),
  },
  {
    id: "express",
    name: "Express",
    blurb: "Today / tomorrow morning · ₹99 (free over ₹999)",
    icon: Zap,
    fee: (s) => (s >= 99900 || s === 0 ? 0 : 9900),
    eta: () => {
      const now = new Date();
      if (now.getHours() < 14) return { label: "Today by 9 PM", tone: "express", detail: "Hand-delivered express." };
      const t = new Date(now); t.setDate(t.getDate() + 1);
      return {
        label: `Tomorrow · ${t.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} by 11 AM`,
        tone: "express",
        detail: "Priority morning slot.",
      };
    },
  },
  {
    id: "scheduled",
    name: "Eco · scheduled",
    blurb: "Free · pick any day this week",
    icon: Leaf,
    fee: () => 0,
    eta: () => {
      const t = new Date(); t.setDate(t.getDate() + 3);
      return {
        label: `In 3 days · ${t.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`,
        tone: "standard",
        detail: "Combined with other deliveries to your area — lower carbon, free shipping.",
      };
    },
  },
];

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { items, clear } = useCart();
  const subtotal = cartTotal(items);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingId, setShippingId] = useState<ShippingId>("standard");
  const [submitting, setSubmitting] = useState(false);

  const shipping = SHIPPING_OPTIONS.find((o) => o.id === shippingId)!;
  const deliveryFee = useMemo(() => shipping.fee(subtotal), [shipping, subtotal]);
  const total = subtotal + deliveryFee;
  const eta = useMemo(() => shipping.eta(subtotal), [shipping, subtotal]);

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
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-14 mx-auto max-w-6xl w-full">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to basket
        </Link>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Step 2 of 2</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Tell us where to deliver — we'll handle the rest.</p>
        </div>

        {/* Live ETA banner — recalculates with cart total + shipping option */}
        <div className={`mb-6 rounded-3xl border p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 ${etaToneClasses(eta.tone)}`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 shrink-0">
            <Clock className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Estimated arrival · {shipping.name}</p>
            <p className="font-display text-xl md:text-2xl font-bold leading-tight mt-0.5">{eta.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{eta.detail}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Shipping fee</p>
            <p className="font-display text-xl font-bold">{deliveryFee === 0 ? "Free" : formatINR(deliveryFee)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-background p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-bold mb-5">Delivery details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery address</label>
                  <div className="mt-1.5 relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      placeholder="Flat / House no, Street, Area, City, Pincode"
                      className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors resize-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone <span className="text-muted-foreground/70 normal-case font-normal">(optional)</span></label>
                  <div className="mt-1.5 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background p-6 md:p-8 shadow-sm">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-display text-xl font-bold">Shipping option</h2>
                <span className="text-xs text-muted-foreground">Updates ETA & fee live</span>
              </div>
              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const fee = opt.fee(subtotal);
                  const active = opt.id === shippingId;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShippingId(opt.id)}
                      className={`w-full text-left rounded-2xl border-2 p-4 flex items-start gap-3 transition-colors ${
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{opt.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.blurb}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{fee === 0 ? <span className="text-primary">Free</span> : formatINR(fee)}</p>
                        {active && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                            <Check className="h-3 w-3" /> Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-xl font-bold mb-5">Payment</h2>
              <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4 flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Banknote className="h-5 w-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold">Cash on delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pay the rider when your basket arrives. UPI & cards coming soon.</p>
                </div>
                <span className="text-xs font-semibold text-primary">Selected</span>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold mb-4">Order summary</h2>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                {items.map((i) => {
                  const img = resolveImage(i.imageUrl);
                  return (
                    <li key={i.productId} className="flex gap-3 items-center">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {img && <img src={img} alt={i.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{i.name}</p>
                        <p className="text-xs text-muted-foreground">× {i.qty} {i.unit}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatINR(i.pricePaise * i.qty)}</p>
                    </li>
                  );
                })}
              </ul>
              <dl className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{deliveryFee === 0 ? <span className="text-primary font-medium">Free</span> : formatINR(deliveryFee)}</dd></div>
              </dl>
              <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-primary">{formatINR(total)}</span>
              </div>
              <Button onClick={placeOrder} disabled={submitting} className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                {submitting ? "Placing order…" : "Place order"}
              </Button>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure</div>
                <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Same-day</div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
