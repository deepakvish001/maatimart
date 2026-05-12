import { createFileRoute, Link } from "@tanstack/react-router";
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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 mx-auto max-w-5xl w-full">
        <h1 className="font-display text-5xl mb-8">Your Basket</h1>
        {items.length === 0 ? (
          <div className="bg-card p-10 text-center">
            <p className="text-muted-foreground mb-6">Your basket is empty.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/marketplace">Browse the harvest</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 divide-y divide-border bg-card">
              {items.map((i) => {
                const img = resolveImage(i.imageUrl);
                return (
                  <div key={i.productId} className="flex gap-4 p-4">
                    {img && <img src={img} alt={i.name} className="w-20 h-20 object-cover" />}
                    <div className="flex-1 flex flex-col">
                      <p className="font-medium">{i.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{formatINR(i.pricePaise)} / {i.unit}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center border border-border">
                          <button onClick={() => setQty(i.productId, i.qty - 1)} className="px-2 py-1 hover:bg-muted">−</button>
                          <span className="px-3 font-mono text-sm">{i.qty}</span>
                          <button onClick={() => setQty(i.productId, i.qty + 1)} className="px-2 py-1 hover:bg-muted">+</button>
                        </div>
                        <button onClick={() => remove(i.productId)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-accent">{formatINR(i.pricePaise * i.qty)}</div>
                  </div>
                );
              })}
            </div>
            <aside className="bg-card p-6 h-fit">
              <h2 className="font-display text-2xl mb-4">Summary</h2>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatINR(total)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-mono">Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 mb-6">
                <span className="font-medium">Total</span>
                <span className="font-mono font-bold text-accent">{formatINR(total)}</span>
              </div>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/checkout">Checkout</Link>
              </Button>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
