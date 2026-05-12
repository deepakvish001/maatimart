import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Truck, ShieldCheck, Sprout, Apple, Carrot, Flame, ArrowRight, Tag, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/seed-images";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maati Mart — Fresh farm produce, delivered to your door" },
      { name: "description", content: "Shop fresh vegetables, fruits and spices direct from Indian farms. Free delivery, transparent pricing, fair payouts to growers." },
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  { key: "vegetables", label: "Vegetables", icon: Carrot, tint: "bg-primary/10 text-primary" },
  { key: "fruits", label: "Fruits", icon: Apple, tint: "bg-accent/10 text-accent" },
  { key: "spices", label: "Spices", icon: Flame, tint: "bg-primary/10 text-primary" },
  { key: "organic", label: "Organic", icon: Sprout, tint: "bg-accent/10 text-accent" },
];

function Home() {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true)
        .limit(8);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });
  const { data: deals } = useQuery({
    queryKey: ["todays-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true)
        .order("price_paise", { ascending: true })
        .limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });
  const { data: arrivals } = useQuery({
    queryKey: ["fresh-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });
  const { data: farms } = useQuery({
    queryKey: ["featured-farms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farms")
        .select("id,name,region,story,image_url,products(rating_avg,rating_count)")
        .limit(3);
      if (error) throw error;
      return (data ?? []).map((f) => {
        const rated = (f.products ?? []).filter((p: { rating_count: number }) => p.rating_count > 0);
        const avg = rated.length
          ? rated.reduce((s: number, p: { rating_avg: number }) => s + (p.rating_avg ?? 0), 0) / rated.length
          : 0;
        return { ...f, productCount: f.products?.length ?? 0, avgRating: avg };
      });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
                <Leaf className="h-3.5 w-3.5" /> 100% farm-fresh, every day
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.02] mb-6">
                Fresh produce, <span className="text-primary italic">delivered fast.</span>
              </h1>
              <p className="max-w-[52ch] text-lg text-muted-foreground leading-relaxed mb-8">
                Hand-picked vegetables, fruits, and spices sourced direct from Indian farms — at honest prices, with same-day delivery in your city.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7">
                  <Link to="/marketplace">Shop now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7 border-primary/30 hover:bg-primary/5">
                  <Link to="/signup">Sell as a farmer</Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-6 max-w-md">
                {[
                  { icon: Truck, label: "Free delivery", sub: "Orders over ₹499" },
                  { icon: ShieldCheck, label: "Quality assured", sub: "Or money back" },
                  { icon: Leaf, label: "Farm direct", sub: "No middlemen" },
                ].map((f, i) => (
                  <div key={i} className="text-center">
                    <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground">{f.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6 relative">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden />
                <img
                  src={heroImage}
                  alt="Fresh vegetables and fruits from Indian farms"
                  width={1600}
                  height={1200}
                  className="relative w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl shadow-primary/10 ring-1 ring-border"
                />
                <div className="absolute -bottom-6 -left-6 hidden md:flex items-center gap-3 rounded-2xl bg-background border border-border px-4 py-3 shadow-xl">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Today's harvest</div>
                    <div className="text-sm font-semibold">120+ fresh items</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 hidden md:flex flex-col items-end rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-xl">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">Up to</div>
                  <div className="font-display text-2xl">30% off</div>
                  <div className="text-[10px] opacity-80">First order</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-6 py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Shop by category</h2>
              <p className="text-sm text-muted-foreground mt-1">Everything you need for the week</p>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
              <Link to="/marketplace">All categories <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to="/marketplace"
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${c.tint}`}>
                  <c.icon className="h-7 w-7" />
                </div>
                <div className="font-semibold text-lg">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Browse <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" aria-hidden />
              </Link>
            ))}
          </div>
        </section>

        {/* Promo strip */}
        <section className="px-6">
          <div className="mx-auto max-w-7xl grid md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-10">
              <div className="text-xs uppercase tracking-widest opacity-80 mb-2">Weekend special</div>
              <h3 className="font-display text-3xl md:text-4xl mb-3">Seasonal fruits — flat 20% off</h3>
              <p className="opacity-90 mb-6 max-w-[40ch]">Mangoes, pomegranates and more, straight from the orchard.</p>
              <Button asChild variant="secondary" className="rounded-full bg-background text-primary hover:bg-background/90">
                <Link to="/marketplace">Shop fruits</Link>
              </Button>
              <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-primary-foreground/10" aria-hidden />
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-accent text-accent-foreground p-8 md:p-10">
              <div className="text-xs uppercase tracking-widest opacity-80 mb-2">New arrivals</div>
              <h3 className="font-display text-3xl md:text-4xl mb-3">Heritage spices, single-origin</h3>
              <p className="opacity-90 mb-6 max-w-[40ch]">Turmeric, cardamom and pepper from small Kerala growers.</p>
              <Button asChild variant="secondary" className="rounded-full bg-background text-accent hover:bg-background/90">
                <Link to="/marketplace">Explore spices</Link>
              </Button>
              <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-accent-foreground/10" aria-hidden />
            </div>
          </div>
        </section>

        {/* Today's Deals */}
        <section className="px-6 py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                <Tag className="h-3.5 w-3.5" /> Today's deals
              </div>
              <h2 className="font-display text-3xl md:text-4xl">Best prices on the harvest</h2>
              <p className="text-sm text-muted-foreground mt-1">Limited stock · ends midnight</p>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
              <Link to="/marketplace">All deals <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {(deals ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>

        {/* Fresh Arrivals */}
        <section className="px-6 py-16 bg-card/40 border-y border-border">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
                  <Sparkles className="h-3.5 w-3.5" /> Just in
                </div>
                <h2 className="font-display text-3xl md:text-4xl">Fresh arrivals</h2>
                <p className="text-sm text-muted-foreground mt-1">Newly listed by our growers</p>
              </div>
              <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
                <Link to="/marketplace">See all <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden bg-background">
              {(arrivals ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section className="px-6 py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Featured this week</h2>
              <p className="text-sm text-muted-foreground mt-1">Hand-picked by the Maati team</p>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
              <Link to="/marketplace">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {(products ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>

        {/* Top Farms */}
        <section className="px-6 py-16 bg-card/50 border-y border-border">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                  <Sprout className="h-3.5 w-3.5" /> Top farms
                </div>
                <h2 className="font-display text-3xl md:text-4xl">Growers our customers love</h2>
                <p className="text-sm text-muted-foreground mt-1">Traceable produce, real families behind every basket</p>
              </div>
              <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
                <Link to="/marketplace">Shop their goods <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {(farms ?? []).map((f) => {
                const img = resolveImage(f.image_url);
                return (
                  <Link to="/farm/$id" params={{ id: f.id }} key={f.id} className="group flex flex-col rounded-2xl overflow-hidden bg-background border border-border hover:border-primary/40 transition-all hover:shadow-lg">
                    <div className="relative">
                      {img && <img src={img} alt={f.name} loading="lazy" width={1200} height={900} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      {f.avgRating > 0 && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-xs font-bold shadow-sm">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {f.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span className="absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                        {f.productCount} items
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl mb-1">{f.name}</h3>
                      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">{f.region}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{f.story}</p>
                      <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                        Visit farm <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden />
            <h2 className="relative font-display text-4xl md:text-5xl mb-4">Ready for fresher groceries?</h2>
            <p className="relative opacity-90 max-w-[50ch] mx-auto mb-8 text-lg">
              Join thousands of households getting farm-direct produce every week.
            </p>
            <div className="relative flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-background text-primary hover:bg-background/90 px-8">
                <Link to="/marketplace">Start shopping</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 px-8">
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
