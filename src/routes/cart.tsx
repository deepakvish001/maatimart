import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBasket,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, cartTotal } from "@/lib/cart-store";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQty, remove } = useCart();
  const total = cartTotal(items);
  const deliveryFree = total >= 49900;
  const deliveryFee = deliveryFree ? 0 : 4900;
  const grand = total + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-14 mx-auto max-w-6xl w-full">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Step 1 of 2
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Your basket
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review your harvest before heading to checkout.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-background p-12 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
              <ShoppingBasket className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Nothing in the basket yet</h2>
            <p className="text-muted-foreground mb-6">
              Discover seasonal produce straight from the farm.
            </p>
            <Button
              asChild
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
            >
              <Link to="/marketplace">
                Browse the harvest <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
            <div className="rounded-3xl border border-border bg-background shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </h2>
                <Link to="/marketplace" className="text-sm text-primary hover:underline">
                  + Add more
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {items.map((i) => {
                  const img = resolveImage(i.imageUrl);
                  return (
                    <li key={i.productId} className="flex gap-4 p-5">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        {img && (
                          <img src={img} alt={i.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="font-semibold truncate">{i.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatINR(i.pricePaise)} / {i.unit}
                        </p>
                        <div className="mt-auto flex items-center gap-3 pt-3">
                          <div className="inline-flex items-center rounded-full border border-border bg-muted/40">
                            <button
                              onClick={() => setQty(i.productId, i.qty - 1)}
                              aria-label="Decrease"
                              className="h-8 w-8 grid place-items-center rounded-full hover:bg-background transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                            <button
                              onClick={() => setQty(i.productId, i.qty + 1)}
                              aria-label="Increase"
                              className="h-8 w-8 grid place-items-center rounded-full hover:bg-background transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(i.productId)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatINR(i.pricePaise * i.qty)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
                <h2 className="font-display text-2xl font-bold mb-4">Order summary</h2>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium">{formatINR(total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-medium">
                      {deliveryFree ? (
                        <span className="text-primary">Free</span>
                      ) : (
                        formatINR(deliveryFee)
                      )}
                    </dd>
                  </div>
                  {!deliveryFree && (
                    <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
                      Add {formatINR(49900 - total)} more for free delivery.
                    </p>
                  )}
                </dl>
                <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatINR(grand)}
                  </span>
                </div>
                <Button
                  asChild
                  className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  <Link to="/checkout">
                    Proceed to checkout <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5 shadow-sm space-y-3">
                {[
                  { icon: Truck, label: "Same-day delivery in Pune & Kochi" },
                  { icon: ShieldCheck, label: "Secure checkout · Fair payouts" },
                  { icon: Tag, label: "Member coupons applied at next step" },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <b.icon className="h-4 w-4" />
                    </span>
                    {b.label}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
