import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Leaf, Truck, Sprout, ArrowRight, Tag, Sparkles, Star,
  Headphones, RotateCcw, Package, Quote, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Countdown } from "@/components/countdown";
import { heroImage, resolveImage } from "@/lib/seed-images";
import { resolveDealEnd } from "@/lib/deal-schedule";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import {
  ProductGridSkeleton,
  DealCardSkeleton,
  FarmCardSkeleton,
  TabListSkeleton,
  SectionError,
} from "@/components/home-skeletons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maati Mart — Fresh farm produce, delivered to your door" },
      { name: "description", content: "Shop fresh vegetables, fruits and spices direct from Indian farms. Free delivery, transparent pricing, fair payouts to growers." },
    ],
  }),
  component: Home,
});

type Cat = "all" | "vegetables" | "fruits" | "spices";
const CATEGORY_TILES: { label: string; count: number; tint: string; category: Cat; organic?: boolean }[] = [
  { label: "Vegetables", count: 24, tint: "bg-[oklch(0.95_0.06_150)]", category: "vegetables" },
  { label: "Fruits", count: 18, tint: "bg-[oklch(0.95_0.06_30)]", category: "fruits" },
  { label: "Spices", count: 32, tint: "bg-[oklch(0.95_0.08_80)]", category: "spices" },
  { label: "Leafy Greens", count: 12, tint: "bg-[oklch(0.94_0.07_140)]", category: "vegetables" },
  { label: "Organic", count: 41, tint: "bg-[oklch(0.94_0.06_120)]", category: "all", organic: true },
  { label: "Grains", count: 19, tint: "bg-[oklch(0.95_0.05_85)]", category: "all" },
  { label: "Pickles", count: 9, tint: "bg-[oklch(0.95_0.07_50)]", category: "all" },
  { label: "Honey & Ghee", count: 14, tint: "bg-[oklch(0.95_0.06_85)]", category: "all" },
  { label: "Pulses", count: 22, tint: "bg-[oklch(0.94_0.06_60)]", category: "all" },
  { label: "Snacks", count: 11, tint: "bg-[oklch(0.94_0.06_25)]", category: "all" },
];

const POPULAR_TABS: { label: string; category: Cat; organic?: boolean }[] = [
  { label: "All", category: "all" },
  { label: "Vegetables", category: "vegetables" },
  { label: "Fruits", category: "fruits" },
  { label: "Spices", category: "spices" },
  { label: "Organic", category: "all", organic: true },
];


function Home() {
  const [email, setEmail] = useState("");

  const { data: products } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,price_paise,image_url,is_organic,rating_avg,rating_count,created_at,farms(name,region)")
        .eq("is_active", true)
        .limit(24);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, farm: p.farms }));
    },
  });

  const { data: farms } = useQuery({
    queryKey: ["home-farms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farms")
        .select("id,name,region,story,image_url,products(rating_avg,rating_count,is_active)")
        .limit(3);
      if (error) throw error;
      return (data ?? []).map((f) => {
        const active = (f.products ?? []).filter((p: { is_active: boolean }) => p.is_active);
        const rated = active.filter((p: { rating_count: number }) => p.rating_count > 0);
        const totalReviews = rated.reduce((s: number, p: { rating_count: number }) => s + p.rating_count, 0);
        const avg = rated.length
          ? rated.reduce((s: number, p: { rating_avg: number; rating_count: number }) => s + (p.rating_avg ?? 0) * p.rating_count, 0) / Math.max(totalReviews, 1)
          : 0;
        return { ...f, productCount: active.length, avgRating: avg, totalReviews };
      });
    },
  });

  const popular = (products ?? []).slice(0, 5);
  const dailyBest = (products ?? []).slice(5, 9);
  const deals = (products ?? []).slice(9, 13);

  // Tabbed lists
  const tabSections = useMemo(() => {
    const all = products ?? [];
    return [
      { key: "selling", label: "Top Selling", items: [...all].sort((a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0)).slice(0, 4) },
      { key: "trending", label: "Trending", items: [...all].sort(() => Math.random() - 0.5).slice(0, 4) },
      { key: "recent", label: "Recently Added", items: [...all].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 4) },
      { key: "rated", label: "Top Rated", items: [...all].sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0)).slice(0, 4) },
    ];
  }, [products]);

  // Per-deal countdown targets: prefer product.deal_ends_at if present,
  // otherwise fall back to the configured daily schedule (next local midnight).
  const dealTargets = useMemo(
    () => deals.map((p) => resolveDealEnd((p as any).deal_ends_at ?? null)),
    [deals]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="px-4 md:px-6 pt-6">
          <div className="mx-auto max-w-7xl rounded-3xl bg-[oklch(0.93_0.06_150)] overflow-hidden relative">
            <div className="grid md:grid-cols-2 items-center">
              <div className="px-8 md:px-14 py-12 md:py-20 relative z-10">
                <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] text-accent mb-3">
                  Fresh Vegetables
                </h1>
                <h2 className="font-display text-3xl md:text-5xl italic text-primary mb-5">Big discount</h2>
                <p className="text-muted-foreground mb-7 max-w-md">
                  Save up to 50% off on your first order from India's farmer-direct marketplace.
                </p>
                <form
                  onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
                  className="flex max-w-md bg-background rounded-full shadow-md p-1.5"
                >
                  <div className="flex items-center pl-4 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 bg-transparent px-3 text-sm focus:outline-none"
                  />
                  <button className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold hover:bg-primary/90">
                    Subscribe
                  </button>
                </form>
              </div>
              <div className="relative h-64 md:h-full min-h-[320px]">
                <img src={heroImage} alt="Fresh produce" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.93_0.06_150)] via-transparent to-transparent md:block hidden" />
              </div>
            </div>
          </div>
        </section>

        {/* TOP CATEGORIES */}
        <section className="px-4 md:px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Top Categories</h2>
            <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {CATEGORY_TILES.map((c) => (
              <Link
                key={c.label}
                to="/marketplace"
                search={{ category: c.category, organic: !!c.organic, q: "" }}
                className={`group flex flex-col items-center justify-center rounded-2xl border border-border ${c.tint} p-3 aspect-square hover:border-primary/40 hover:-translate-y-0.5 transition-all text-center`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-background/70 mb-2">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-semibold leading-tight">{c.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.count} items</div>
              </Link>
            ))}
          </div>
        </section>

        {/* THREE PROMO BANNERS */}
        <section className="px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { tint: "bg-[oklch(0.94_0.06_150)]", title: "Everyday fresh & clean produce", cta: "Shop now" },
              { tint: "bg-[oklch(0.95_0.05_30)]", title: "Make breakfast healthy and easy", cta: "Shop now" },
              { tint: "bg-[oklch(0.94_0.06_240)]", title: "The best organic harvest online", cta: "Shop now" },
            ].map((b, i) => (
              <Link to="/marketplace" key={i} className={`group relative overflow-hidden rounded-2xl ${b.tint} p-7 min-h-[160px] flex flex-col justify-between`}>
                <h3 className="font-display text-xl font-bold leading-tight max-w-[18ch]">{b.title}</h3>
                <span className="inline-flex items-center self-start rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold w-max">
                  {b.cta} <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-background/40" />
              </Link>
            ))}
          </div>
        </section>

        {/* POPULAR PRODUCTS */}
        <section className="px-4 md:px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Popular Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Most loved by our customers</p>
            </div>
            <div className="hidden md:flex gap-1.5 text-xs">
              {POPULAR_TABS.map((t, i) => (
                <Link
                  key={t.label}
                  to="/marketplace"
                  search={{ category: t.category, organic: !!t.organic, q: "" }}
                  className={`px-3 py-1.5 rounded-full font-semibold ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {popular.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>

        {/* DAILY BEST SELLS */}
        <section className="px-4 md:px-6 mx-auto max-w-7xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Daily Best Sells</h2>
          <div className="grid lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-[oklch(0.42_0.14_150)] text-primary-foreground p-8 lg:row-span-1 flex flex-col justify-between min-h-[320px]">
              <div>
                <h3 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3">Bring nature into your home</h3>
                <p className="opacity-90 text-sm max-w-[24ch]">Hand-picked from farms across India, every single day.</p>
              </div>
              <Button asChild className="self-start rounded-full bg-background text-primary hover:bg-background/90">
                <Link to="/marketplace">Shop now <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-primary-foreground/10" />
              <Leaf className="absolute right-6 top-6 h-10 w-10 opacity-30" />
            </div>
            <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
              {dailyBest.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>

        {/* DEALS OF THE DAY (countdown) */}
        <section className="px-4 md:px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                <Tag className="h-3.5 w-3.5" /> Limited time
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Deals of the Day</h2>
            </div>
            <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline hidden md:inline">All deals →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {deals.map((p, i) => {
              const img = resolveImage(p.image_url);
              return (
                <Link to="/product/$id" params={{ id: p.id }} key={p.id} className="group relative overflow-hidden rounded-2xl border border-border bg-background hover:border-primary/40 hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <Countdown target={dealTargets[i]} className="absolute bottom-3 left-1/2 -translate-x-1/2" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold leading-tight line-clamp-1">{p.name}</h3>
                    {p.farm && <p className="text-xs text-muted-foreground mt-1 truncate">{p.farm.name} · {p.farm.region}</p>}
                    <div className="mt-2"><StarRating value={p.rating_avg ?? 0} count={p.rating_count ?? 0} /></div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-xl font-bold text-primary">{formatINR(p.price_paise)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">+ Add</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* TABBED LISTS */}
        <section className="px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tabSections.map((sec) => (
              <div key={sec.key}>
                <h3 className="font-display text-lg font-bold border-b-2 border-primary pb-2 mb-4 inline-block pr-4">{sec.label}</h3>
                <ul className="space-y-4">
                  {sec.items.map((p) => {
                    const img = resolveImage(p.image_url);
                    return (
                      <li key={p.id}>
                        <Link to="/product/$id" params={{ id: p.id }} className="flex gap-3 group">
                          <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border">
                            {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">{p.name}</div>
                            <div className="mt-1"><StarRating value={p.rating_avg ?? 0} count={p.rating_count ?? 0} /></div>
                            <div className="mt-1 text-sm font-bold text-primary">{formatINR(p.price_paise)}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="px-4 md:px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">What our customers say</h2>
          <p className="text-sm text-muted-foreground mb-8">Real households, real harvests.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Priya M.", city: "Mumbai", text: "The vegetables arrive incredibly fresh and the prices are honest. Knowing it goes straight to the farmer makes it even better." },
              { name: "Rohan S.", city: "Pune", text: "Switched our whole weekly grocery to Maati. The mangoes from Ratnagiri are the best I've had in years." },
              { name: "Anita K.", city: "Bengaluru", text: "Love the traceability — I can see exactly which farm every item came from. Delivery is always on time." },
              { name: "Kabir D.", city: "Kochi", text: "Spices here taste different. Single-origin and clearly hand-picked. The team really cares." },
            ].map((r) => (
              <div key={r.name} className="rounded-2xl border border-border bg-background p-6 hover:border-primary/40 transition-colors">
                <Quote className="h-6 w-6 text-primary mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">{r.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">{r.name[0]}</div>
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOP FARMS */}
        <section className="px-4 md:px-6 py-12 md:py-16 bg-card/50 border-y border-border">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                  <Sprout className="h-3.5 w-3.5" /> Meet the growers
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">Top Farms</h2>
              </div>
              <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {(farms ?? []).map((f) => {
                const img = resolveImage(f.image_url);
                return (
                  <article key={f.id} className="group flex flex-col rounded-2xl overflow-hidden bg-background border border-border hover:border-primary/40 transition-all hover:shadow-lg">
                    <div className="relative">
                      {img && <img src={img} alt={f.name} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <span className="absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                        {f.productCount} items
                      </span>
                      {f.avgRating > 0 && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-xs font-bold shadow-sm">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {f.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-xl font-bold mb-1">{f.name}</h3>
                      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">{f.region}</p>
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <StarRating value={f.avgRating} count={f.totalReviews} />
                        {f.totalReviews === 0 && <span className="text-muted-foreground">No reviews yet</span>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{f.story}</p>
                      <Link
                        to="/farm/$id"
                        params={{ id: f.id }}
                        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold hover:bg-primary/90 transition-colors w-max"
                      >
                        Visit farm <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* NEWSLETTER BANNER */}
        <section className="px-4 md:px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.93_0.06_150)] grid md:grid-cols-2 items-center">
            <div className="px-8 md:px-14 py-10 md:py-16 z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3">
                Stay home & get your daily needs from our farms
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">Subscribe to weekly harvest drops and member-only deals.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md bg-background rounded-full shadow-md p-1.5">
                <input placeholder="Your email address" className="flex-1 bg-transparent px-4 text-sm focus:outline-none" />
                <button className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold hover:bg-primary/90">Subscribe</button>
              </form>
            </div>
            <div className="relative h-56 md:h-full min-h-[260px]">
              <img src={heroImage} alt="Fresh delivery" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </section>

        {/* SERVICE STRIP */}
        <section className="px-4 md:px-6 pb-16 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: Truck, title: "Best Prices", sub: "Direct from farms" },
              { icon: Package, title: "Free Delivery", sub: "Orders over ₹499" },
              { icon: Sparkles, title: "Daily Mega Deals", sub: "When you sign up" },
              { icon: RotateCcw, title: "Easy Returns", sub: "Within 24 hours" },
              { icon: Headphones, title: "24/7 Support", sub: "We're here for you" },
            ].map((s) => (
              <div key={s.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
