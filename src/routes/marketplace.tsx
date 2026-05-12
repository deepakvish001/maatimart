import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Leaf, Sparkles, X, Sprout, Apple, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";

const CATEGORIES = ["all", "vegetables", "fruits", "spices"] as const;
type Category = (typeof CATEGORIES)[number];

const SORTS = ["newest", "price-asc", "price-desc", "rating"] as const;
type Sort = (typeof SORTS)[number];

const SORT_LABEL: Record<Sort, string> = {
  newest: "Newest harvest",
  "price-asc": "Price · low to high",
  "price-desc": "Price · high to low",
  rating: "Top rated",
};

const CAT_ICON: Record<Category, typeof Sprout> = {
  all: Sparkles,
  vegetables: Sprout,
  fruits: Apple,
  spices: Flame,
};

interface MarketplaceSearch {
  category: Category;
  organic: boolean;
  q: string;
  sort: Sort;
}

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [
    { title: "Marketplace — Maati Mart" },
    { name: "description", content: "Browse fresh, farm-direct produce from across India." },
  ] }),
  validateSearch: (raw: Record<string, unknown>): MarketplaceSearch => {
    const c = String(raw.category ?? "all").toLowerCase();
    const s = String(raw.sort ?? "newest").toLowerCase();
    return {
      category: (CATEGORIES as readonly string[]).includes(c) ? (c as Category) : "all",
      organic: raw.organic === true || raw.organic === "true",
      q: typeof raw.q === "string" ? raw.q : "",
      sort: (SORTS as readonly string[]).includes(s) ? (s as Sort) : "newest",
    };
  },
  component: Marketplace,
});

function Marketplace() {
  const { category, organic, q, sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setSearch = (patch: Partial<MarketplaceSearch>) =>
    navigate({ search: (prev: MarketplaceSearch) => ({ ...prev, ...patch }) });

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, organic, q, sort],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,stock,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true);
      if (category !== "all") query = query.eq("category", category);
      if (organic) query = query.eq("is_organic", true);
      if (q) query = query.ilike("name", `%${q}%`);
      switch (sort) {
        case "price-asc": query = query.order("price_paise", { ascending: true }); break;
        case "price-desc": query = query.order("price_paise", { ascending: false }); break;
        case "rating": query = query.order("rating_avg", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  const count = data?.length ?? 0;
  const hasFilters = category !== "all" || organic || q !== "" || sort !== "newest";

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero band */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/60">
          <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.15),transparent_45%),radial-gradient(circle_at_80%_60%,hsl(var(--accent)/0.12),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl w-full px-4 md:px-6 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-mono uppercase tracking-widest">
              <Leaf size={12} /> Farm-direct marketplace
            </span>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
              Today's harvest, from <span className="text-primary">verified Indian farms</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Hand-picked produce, packed at the farm and on its way the same day. Filter by category, certification, or price.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl w-full px-4 md:px-6 py-8">
          {/* Sticky filter bar */}
          <div className="sticky top-16 z-30 -mx-4 md:mx-0 mb-6 px-4 md:px-0">
            <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur shadow-sm p-3 md:p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setSearch({ q: e.target.value })}
                    placeholder="Search tomatoes, mangoes, turmeric…"
                    className="w-full h-11 rounded-xl bg-muted/40 border border-transparent pl-10 pr-10 text-sm focus:outline-none focus:bg-background focus:border-primary/40"
                  />
                  {q && (
                    <button
                      onClick={() => setSearch({ q: "" })}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 h-11">
                  <SlidersHorizontal size={16} className="text-muted-foreground shrink-0" />
                  <select
                    value={sort}
                    onChange={(e) => setSearch({ sort: e.target.value as Sort })}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer min-w-40"
                  >
                    {SORTS.map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
                  </select>
                </div>

                {/* Organic toggle */}
                <button
                  onClick={() => setSearch({ organic: !organic })}
                  className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border transition-colors ${
                    organic
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-foreground/80 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Leaf size={14} /> Organic only
                </button>
              </div>

              {/* Category chips */}
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
                {CATEGORIES.map((c) => {
                  const Icon = CAT_ICON[c];
                  const active = category === c;
                  return (
                    <Link
                      key={c}
                      from={Route.fullPath}
                      search={(prev: MarketplaceSearch) => ({ ...prev, category: c })}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-foreground/70 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Icon size={12} /> {c === "all" ? "All produce" : c}
                    </Link>
                  );
                })}
                {hasFilters && (
                  <button
                    onClick={() => navigate({ search: { category: "all", organic: false, q: "", sort: "newest" } })}
                    className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {category === "all" ? "All categories" : category}{organic && " · organic"}
              </p>
              <h2 className="font-display text-2xl">
                {isLoading ? "Loading harvest…" : `${count} ${count === 1 ? "find" : "finds"} for you`}
              </h2>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-3xl bg-card border border-border/50 p-4 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-muted/60 mb-4" />
                  <div className="h-3 bg-muted/60 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted/40 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : count === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Sprout size={24} />
              </div>
              <h3 className="font-display text-xl mb-1">No produce matches your filters</h3>
              <p className="text-sm text-muted-foreground mb-5">Try removing a filter or searching for something else.</p>
              <button
                onClick={() => navigate({ search: { category: "all", organic: false, q: "", sort: "newest" } })}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {data!.map((p) => (
                <div key={p.id} className="rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
