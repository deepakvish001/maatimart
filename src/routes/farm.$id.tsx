import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { resolveImage } from "@/lib/seed-images";

export const Route = createFileRoute("/farm/$id")({ component: FarmPage });

function FarmPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => {
      const { data: farm, error } = await supabase
        .from("farms")
        .select("id,name,region,story,image_url,delivery_pincodes")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!farm) throw notFound();
      const { data: products } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count")
        .eq("farm_id", id)
        .eq("is_active", true);
      return { farm, products: products ?? [] };
    },
  });

  if (isLoading || !data) {
    return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1 px-4 md:px-6 py-10 md:py-12 mx-auto max-w-7xl w-full text-muted-foreground">Loading farm…</main><SiteFooter /></div>;
  }

  const { farm, products } = data;
  const img = resolveImage(farm.image_url);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link to="/marketplace" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">← Marketplace</Link>
              <h1 className="font-display text-6xl mt-3 mb-3">{farm.name}</h1>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-6">{farm.region}</p>
              <p className="text-muted-foreground leading-relaxed">{farm.story}</p>
              {farm.delivery_pincodes && farm.delivery_pincodes.length > 0 && (
                <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Delivers to: {farm.delivery_pincodes.join(", ")}
                </p>
              )}
            </div>
            {img && <img src={img} alt={farm.name} className="aspect-square w-full object-cover" />}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12">
          <h2 className="font-display text-3xl mb-6">Fresh from the farm</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No active listings right now.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
              {products.map((p) => (
                <ProductCard key={p.id} p={{ ...p, farm: { name: farm.name, region: farm.region } }} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
