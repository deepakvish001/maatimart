import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,unit,price_paise,image_url,is_organic,stock,farm_id,farms(name,region,story,image_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 mx-auto max-w-7xl w-full">
        {isLoading || !p ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              {(() => {
                const img = resolveImage(p.image_url);
                return img ? (
                  <img src={img} alt={p.name} width={800} height={800} className="w-full aspect-square object-cover" />
                ) : <div className="w-full aspect-square bg-muted" />;
              })()}
            </div>
            <div className="flex flex-col">
              <Link to="/marketplace" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4 hover:text-primary">← Marketplace</Link>
              <div className="flex items-start gap-3 mb-2">
                <h1 className="font-display text-4xl">{p.name}</h1>
                {p.is_organic && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2 py-1">Organic</span>
                )}
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
                {p.farms?.name} · {p.farms?.region}
              </p>
              <p className="font-mono text-3xl text-accent font-semibold mb-2">
                {formatINR(p.price_paise)}<span className="text-sm font-normal text-muted-foreground"> / {p.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{p.description}</p>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border border-border">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-muted">−</button>
                  <span className="px-4 font-mono">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-muted">+</button>
                </div>
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    add({
                      productId: p.id, farmId: p.farm_id, name: p.name, unit: p.unit,
                      pricePaise: p.price_paise, imageUrl: p.image_url,
                    }, qty);
                    toast.success(`Added ${qty} × ${p.name} to cart`);
                  }}
                >
                  Add to Cart
                </Button>
              </div>

              {p.farms && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h2 className="font-display text-xl mb-2">About the farm</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.farms.story}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
