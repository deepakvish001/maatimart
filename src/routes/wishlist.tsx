import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", search: { redirect: "/wishlist" } as any }); }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: wl } = await supabase.from("wishlists").select("product_id").eq("user_id", user!.id);
      const ids = (wl ?? []).map((r) => r.product_id);
      if (!ids.length) return [];
      const { data: products } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,farms(name,region)")
        .in("id", ids);
      return (products ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-12 mx-auto max-w-7xl w-full">
        <h1 className="font-display text-5xl mb-8">Saved for later</h1>
        {(data?.length ?? 0) === 0 ? (
          <div className="bg-card p-10 text-center text-muted-foreground">
            Nothing saved yet. <Link to="/marketplace" className="text-primary hover:underline">Browse the harvest →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {data!.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
