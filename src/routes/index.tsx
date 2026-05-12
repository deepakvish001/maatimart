import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/seed-images";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Maati — Farm-direct produce from India's small growers" }] }),
  component: Home,
});

function Home() {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,farms(name,region)")
        .eq("is_active", true)
        .limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });
  const { data: farms } = useQuery({
    queryKey: ["featured-farms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farms").select("id,name,region,story,image_url").limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-16 lg:py-24 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <div className="mb-6 inline-block bg-accent text-accent-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                Featured · Sahyadri Collective
              </div>
              <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95] mb-8">
                Straight from the <span className="text-primary italic">soil</span>, without the middleman.
              </h1>
              <p className="max-w-[48ch] text-lg text-muted-foreground leading-relaxed mb-8">
                Connecting India's small-scale farmers directly to your kitchen. Transparent pricing, heritage seeds, and rural empowerment — one harvest at a time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/marketplace">Browse the Harvest</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/signup">Sell as a Farmer</Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <img src={heroImage} alt="Indian organic farm at golden hour" width={1600} height={1200}
                className="w-full aspect-[4/5] object-cover" />
            </div>
          </div>
        </section>

        {/* Marketplace peek */}
        <section className="px-6 py-20 border-t border-border bg-card/40">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="font-display text-4xl mb-2">Fresh Harvest</h2>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Available today across Maharashtra & Kerala
                </p>
              </div>
              <Button asChild variant="ghost" className="self-start md:self-end">
                <Link to="/marketplace">View all →</Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
              {(products ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>

        {/* Farms */}
        <section className="px-6 py-20 mx-auto max-w-7xl">
          <h2 className="font-display text-4xl mb-2">Meet the Farms</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-12">
            Real growers behind every basket
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {(farms ?? []).map((f) => {
              const img = resolveImage(f.image_url);
              return (
                <article key={f.id} className="flex flex-col">
                  {img && <img src={img} alt={f.name} loading="lazy" width={1200} height={900} className="aspect-[4/3] w-full object-cover mb-4" />}
                  <h3 className="font-display text-2xl mb-1">{f.name}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{f.region}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.story}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* For farmers */}
        <section className="px-6 py-24 bg-accent text-accent-foreground">
          <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-5xl mb-6 tracking-tight">Empowering the <span className="italic">Kisaan</span>.</h2>
              <p className="text-lg text-accent-foreground/80 mb-10 leading-relaxed">
                Farmers manage listings, monitor harvest cycles, and track earnings through a simple interface that works on low-bandwidth rural networks.
              </p>
              <ul className="space-y-4 mb-10">
                {["Transparent payouts within 24 hours","Direct consumer feedback loop","Zero commission for first 90 days"].map((t,i) => (
                  <li key={i} className="flex items-center gap-4 border-b border-accent-foreground/10 pb-4">
                    <span className="font-mono text-primary">0{i+1}</span>
                    <span className="font-medium">{t}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/signup">Open your Farm Stand</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
