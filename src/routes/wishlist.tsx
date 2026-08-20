import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Star, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { VisitFarmLink } from "@/components/visit-farm-link";
import { SaveFarmButton } from "@/components/save-farm-button";
import { resolveImage } from "@/lib/seed-images";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/wishlist" } as any });
  }, [loading, user, navigate]);

  const { data: products } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: wl } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user!.id);
      const ids = (wl ?? []).map((r) => r.product_id);
      if (!ids.length) return [];
      const { data: products } = await supabase
        .from("products")
        .select(
          "id,name,unit,price_paise,image_url,is_organic,farms(name,region,delivery_pincodes)",
        )
        .in("id", ids);
      return (products ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  const { data: savedFarms } = useQuery({
    queryKey: ["farm-wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: wl } = await supabase
        .from("farm_wishlists")
        .select("farm_id,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      const ids = (wl ?? []).map((r) => r.farm_id);
      if (!ids.length) return [];
      const { data: farms } = await supabase
        .from("farms")
        .select("id,name,region,story,image_url")
        .in("id", ids);
      const order = new Map(ids.map((id, i) => [id, i]));
      return (farms ?? []).slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-14 mx-auto max-w-7xl w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Your collection
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Saved for later
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bookmarked produce and growers, ready when you are.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-4">Saved products</h2>
          {(products?.length ?? 0) === 0 ? (
            <div className="bg-card p-10 text-center text-muted-foreground border border-border rounded-2xl">
              Nothing saved yet.{" "}
              <Link to="/marketplace" className="text-primary hover:underline">
                Browse the harvest →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
              {products!.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                <Sprout className="h-3.5 w-3.5" /> Your favourite growers
              </div>
              <h2 className="font-display text-2xl font-bold">Saved farms</h2>
            </div>
          </div>
          {(savedFarms?.length ?? 0) === 0 ? (
            <div className="bg-card p-10 text-center text-muted-foreground border border-border rounded-2xl">
              No saved farms yet.{" "}
              <Link to="/marketplace" className="text-primary hover:underline">
                Discover growers →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedFarms!.map((f) => {
                const img = resolveImage(f.image_url);
                return (
                  <article
                    key={f.id}
                    className="group flex flex-col rounded-2xl overflow-hidden bg-background border border-border hover:border-primary/40 transition-all hover:shadow-lg"
                  >
                    <div className="relative">
                      {img && (
                        <img
                          src={img}
                          alt={f.name}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <SaveFarmButton farmId={f.id} className="absolute top-3 right-3" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-xl font-bold mb-1">{f.name}</h3>
                      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                        {f.region}
                      </p>
                      {f.story && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                          {f.story}
                        </p>
                      )}
                      <VisitFarmLink
                        farmId={f.id}
                        source="wishlist"
                        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold hover:bg-primary/90 transition-colors w-max"
                      >
                        Visit farm <ArrowRight className="h-3.5 w-3.5" />
                      </VisitFarmLink>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
