import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Truck, ShieldCheck, Sprout, Minus, Plus, ShoppingBag, ArrowRight, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveImage } from "@/lib/seed-images";
import { formatINR } from "@/lib/format";
import { useCart, cartTotal } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { ProductReviews } from "@/components/product-reviews";
import { getDeliveryEta, etaToneClasses } from "@/lib/delivery-eta";

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
        .select("id,name,description,unit,price_paise,image_url,is_organic,stock,farm_id,rating_avg,rating_count,category,farms(id,name,region,story,image_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const farmImg = p?.farms?.image_url ? resolveImage(p.farms.image_url) : null;
  const productImg = p ? resolveImage(p.image_url) : null;
  const inStock = (p?.stock ?? 0) > 0;

  const benefits = [
    { icon: Sprout, title: "Farm-fresh", desc: "Harvested to order" },
    { icon: Truck, title: "Same-day", desc: "Direct from the field" },
    { icon: ShieldCheck, title: "Fair-pay", desc: "Farmer keeps 80%" },
    { icon: Leaf, title: p?.is_organic ? "Certified organic" : "Pesticide-light", desc: "Grown with care" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-8 md:py-12 mx-auto max-w-7xl w-full">
        {isLoading || !p ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">
              <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
              <span>/</span>
              <span className="text-foreground/70">{p.category}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image panel */}
              <div className="relative">
                <div className="rounded-3xl overflow-hidden bg-card shadow-sm border border-border/50">
                  {productImg ? (
                    <img src={productImg} alt={p.name} width={800} height={800} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-muted" />
                  )}
                </div>
                {p.is_organic && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-md">
                    <Leaf size={12} /> Organic
                  </span>
                )}
                <span className={`absolute top-4 right-4 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md ${inStock ? "bg-emerald-500 text-white" : "bg-destructive text-destructive-foreground"}`}>
                  {inStock ? `${p.stock} ${p.unit} in stock` : "Sold out"}
                </span>
              </div>

              {/* Details panel */}
              <div className="flex flex-col">
                <div className="rounded-3xl bg-card border border-border/50 p-6 md:p-8 shadow-sm">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">{p.category}</p>
                  <h1 className="font-display text-3xl md:text-4xl leading-tight mb-3">{p.name}</h1>

                  <Link to="/farm/$id" params={{ id: p.farms!.id }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
                    <MapPin size={14} /> {p.farms?.name} · {p.farms?.region}
                  </Link>

                  {p.rating_count > 0 && (
                    <div className="mb-5"><StarRating value={p.rating_avg} count={p.rating_count} size={16} /></div>
                  )}

                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="font-display text-4xl text-foreground font-semibold">{formatINR(p.price_paise)}</span>
                    <span className="text-sm text-muted-foreground">/ {p.unit}</span>
                  </div>

                  {p.description && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-6">{p.description}</p>
                  )}

                  {/* Benefits */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {benefits.map((b) => (
                      <div key={b.title} className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3">
                        <span className="rounded-xl bg-primary/10 text-primary p-2"><b.icon size={16} /></span>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{b.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quantity + CTA */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="inline-flex items-center justify-between rounded-xl bg-muted/60 p-1">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-background transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 font-mono font-semibold tabular-nums min-w-10 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-background transition"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <Button
                      size="lg"
                      disabled={!inStock}
                      className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold shadow-sm"
                      onClick={() => {
                        add({
                          productId: p.id, farmId: p.farm_id, name: p.name, unit: p.unit,
                          pricePaise: p.price_paise, imageUrl: p.image_url,
                        }, qty);
                        toast.success(`Added ${qty} × ${p.name} to cart`);
                      }}
                    >
                      <ShoppingBag size={18} />
                      Add to cart · {formatINR(p.price_paise * qty)}
                    </Button>
                  </div>
                </div>

                {/* Farm card */}
                {p.farms && (
                  <div className="mt-6 rounded-3xl bg-card border border-border/50 p-6 shadow-sm">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">From the farm</p>
                    <div className="flex gap-4">
                      {farmImg && (
                        <img src={farmImg} alt={p.farms.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display text-lg mb-1">{p.farms.name}</h2>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">{p.farms.story}</p>
                        <Link
                          to="/farm/$id"
                          params={{ id: p.farms.id }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2 transition-all"
                        >
                          Visit {p.farms.name} <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ProductReviews productId={p.id} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
