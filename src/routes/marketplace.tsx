import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";

const CATEGORIES = ["all", "vegetables", "fruits", "spices"] as const;
type Category = (typeof CATEGORIES)[number];

interface MarketplaceSearch {
  category: Category;
  organic: boolean;
  q: string;
}

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [
    { title: "Marketplace — Maati Mart" },
    { name: "description", content: "Browse fresh, farm-direct produce from across India." },
  ] }),
  validateSearch: (raw: Record<string, unknown>): MarketplaceSearch => {
    const c = String(raw.category ?? "all").toLowerCase();
    return {
      category: (CATEGORIES as readonly string[]).includes(c) ? (c as Category) : "all",
      organic: raw.organic === true || raw.organic === "true",
      q: typeof raw.q === "string" ? raw.q : "",
    };
  },
  component: Marketplace,
});

function Marketplace() {
  const { category, organic, q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setSearch = (patch: Partial<MarketplaceSearch>) =>
    navigate({ search: (prev: MarketplaceSearch) => ({ ...prev, ...patch }) });

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, organic, q],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (category !== "all") query = query.eq("category", category);
      if (organic) query = query.eq("is_organic", true);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-12 mx-auto max-w-7xl w-full">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">The Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {category === "all" ? "All produce from verified Indian farms" : `Showing ${category}${organic ? " · organic only" : ""}`}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <input
            value={q}
            onChange={(e) => setSearch({ q: e.target.value })}
            placeholder="Search produce…"
            className="flex-1 rounded-full bg-card border border-border px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                from={Route.fullPath}
                search={(prev: MarketplaceSearch) => ({ ...prev, category: c })}
                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-primary/5 hover:text-primary"}`}
              >
                {c}
              </Link>
            ))}
            <button
              onClick={() => setSearch({ organic: !organic })}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${organic ? "bg-accent text-accent-foreground" : "bg-card border border-border hover:bg-primary/5 hover:text-primary"}`}
            >
              Organic
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading harvest…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground">No produce matches your filters.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {data!.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
