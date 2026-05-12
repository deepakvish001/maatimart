import { createFileRoute, Link, notFound, useNavigate, ErrorComponent, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Leaf, Truck, Sprout, Award, MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { StarRating } from "@/components/star-rating";
import { resolveImage } from "@/lib/seed-images";
import { SaveFarmButton } from "@/components/save-farm-button";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

export const Route = createFileRoute("/farm/$id")({
  validateSearch: (s: Record<string, unknown>): { sort: SortKey } => {
    const sort = (s.sort as SortKey) || "featured";
    return { sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "featured" };
  },
  component: FarmPage,
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 md:px-6 py-12 mx-auto max-w-3xl w-full text-center">
          <h1 className="font-display text-2xl mb-2">Couldn't load this farm</h1>
          <ErrorComponent error={error} />
          <button onClick={() => router.invalidate()} className="mt-4 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-bold">Try again</button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-12 mx-auto max-w-3xl w-full text-center">
        <h1 className="font-display text-3xl mb-2">Farm not found</h1>
        <p className="text-muted-foreground mb-6">This farm may have been removed.</p>
        <Link to="/marketplace" className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-bold">Browse marketplace</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function FarmPage() {
  const { id } = Route.useParams();
  const { sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data, isLoading } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => {
      const { data: farm, error } = await supabase
        .from("farms")
        .select("id,name,region,story,image_url,delivery_pincodes,created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!farm) throw notFound();
      const { data: products } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,created_at")
        .eq("farm_id", id)
        .eq("is_active", true);
      const productIds = (products ?? []).map((p) => p.id);
      let reviews: { rating: number }[] = [];
      if (productIds.length) {
        const { data: r } = await supabase
          .from("product_reviews")
          .select("rating")
          .in("product_id", productIds);
        reviews = r ?? [];
      }
      return { farm, products: products ?? [], reviews };
    },
  });

  const sortedProducts = useMemo(() => {
    const list = [...(data?.products ?? [])];
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price_paise - b.price_paise); break;
      case "price-desc": list.sort((a, b) => b.price_paise - a.price_paise); break;
      case "rating": list.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0)); break;
      case "newest": list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)); break;
    }
    return list;
  }, [data?.products, sort]);

  const stats = useMemo(() => {
    const products = data?.products ?? [];
    const reviews = data?.reviews ?? [];
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    const organicCount = products.filter((p) => p.is_organic).length;
    return { total, avg, dist, organicCount, productCount: products.length };
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-10">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-12 w-2/3 bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-muted/60 rounded animate-pulse" />
              <div className="h-24 w-full bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="aspect-square w-full bg-muted/60 rounded-2xl animate-pulse" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { farm } = data;
  const img = resolveImage(farm.image_url);
  const yearsActive = Math.max(1, new Date().getFullYear() - new Date(farm.created_at).getFullYear());

  const badges = [
    stats.organicCount > 0 && { icon: Leaf, label: `${stats.organicCount} Organic Products` },
    stats.avg >= 4.5 && stats.total >= 5 && { icon: Award, label: "Top Rated Farm" },
    farm.delivery_pincodes?.length > 0 && { icon: Truck, label: `Delivers to ${farm.delivery_pincodes.length} areas` },
    { icon: Sprout, label: `${yearsActive}+ year${yearsActive > 1 ? "s" : ""} on Maati Mart` },
    { icon: Package, label: `${stats.productCount} Active Products` },
  ].filter(Boolean) as { icon: typeof Leaf; label: string }[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Link to="/marketplace" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">← Marketplace</Link>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-2">{farm.name}</h1>
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-semibold mb-4">
                <MapPin className="h-3.5 w-3.5" /> {farm.region}
              </p>
              {stats.total > 0 && (
                <div className="mb-5"><StarRating value={stats.avg} count={stats.total} size={18} /></div>
              )}
              <p className="text-muted-foreground leading-relaxed">{farm.story}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold">
                    <b.icon className="h-3.5 w-3.5" /> {b.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              {img && <img src={img} alt={farm.name} className="aspect-square w-full object-cover rounded-2xl shadow-lg" />}
              <SaveFarmButton farmId={farm.id} className="absolute top-4 right-4 h-11 w-11" />
            </div>
          </div>
        </section>

        {/* RATING BREAKDOWN */}
        {stats.total > 0 && (
          <section className="border-b border-border">
            <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="font-display text-5xl font-bold">{stats.avg.toFixed(1)}</div>
                <div className="mt-2"><StarRating value={stats.avg} size={20} /></div>
                <p className="text-sm text-muted-foreground mt-2">{stats.total} review{stats.total === 1 ? "" : "s"} across this farm</p>
              </div>
              <div className="md:col-span-2 space-y-2">
                {stats.dist.map(({ star, count }) => {
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-8 font-medium">{star}★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-muted-foreground tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTS + SORT */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Fresh from the farm</h2>
              <p className="text-sm text-muted-foreground mt-1">{stats.productCount} active product{stats.productCount === 1 ? "" : "s"}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by</span>
              <select
                value={sort}
                onChange={(e) => navigate({ search: { sort: e.target.value as SortKey } })}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          {sortedProducts.length === 0 ? (
            <p className="text-muted-foreground">No active listings right now.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
              {sortedProducts.map((p) => (
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
