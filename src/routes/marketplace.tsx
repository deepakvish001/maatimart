import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";

const CATEGORIES = ["all", "vegetables", "fruits", "spices"] as const;

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [
    { title: "Marketplace — Maati" },
    { name: "description", content: "Browse fresh, farm-direct produce from across India." },
  ] }),
  component: Marketplace,
});

function Marketplace() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [organicOnly, setOrganic] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, organicOnly, search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,farms(name,region)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      if (organicOnly) q = q.eq("is_organic", true);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 md:px-6 py-10 md:py-12 mx-auto max-w-7xl w-full">
        <div className="mb-10">
          <h1 className="font-display text-5xl mb-2">The Marketplace</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Every listing comes from a verified Indian farm
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce…"
            className="flex-1 bg-card border border-border px-4 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-tighter border ${category === c ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:bg-card"}`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setOrganic((v) => !v)}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-tighter border ${organicOnly ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-card"}`}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {data!.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
