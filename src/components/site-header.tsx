import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, Heart, Search, MapPin, Menu, X, Leaf } from "lucide-react";
import { useState } from "react";
import { useCart, cartCount } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";

const NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/marketplace" as const, label: "Shop" },
];

export function SiteHeader() {
  const items = useCart((s) => s.items);
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const count = cartCount(items);
  const isFarmer = roles.includes("farmer");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/marketplace", search: search ? { q: search } as never : undefined });
    setMobileOpen(false);
  };

  const isActive = (to: string) => pathname === to;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top promo bar */}
      <div className="bg-accent text-accent-foreground text-xs">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6">
          <div className="hidden sm:flex items-center gap-2 opacity-90">
            <MapPin className="h-3.5 w-3.5" /> Delivering across Maharashtra & Kerala
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Leaf className="h-3.5 w-3.5" /> Free delivery on orders over ₹499
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">
              Maati<span className="text-primary">Mart</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-2xl mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vegetables, fruits, spices…"
                className="w-full rounded-full bg-muted/60 border border-border pl-10 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90">
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            {user && (
              <Link to="/wishlist" className="relative inline-flex items-center justify-center rounded-full p-2.5 hover:bg-primary/5 hover:text-primary transition-colors" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            )}
            <NotificationsBell />
            <Link to="/cart" className="relative inline-flex items-center justify-center rounded-full p-2.5 hover:bg-primary/5 hover:text-primary transition-colors" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                  {count}
                </span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-1 ml-1">
              {user ? (
                <Button variant="ghost" size="sm" className="rounded-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <UserIcon className="mr-1.5 h-4 w-4" /> Sign out
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/signup">Join free</Link>
                  </Button>
                </>
              )}
            </div>
            <button
              className="md:hidden inline-flex items-center justify-center rounded-full p-2.5 hover:bg-primary/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Secondary nav */}
        <nav className="hidden md:block border-t border-border/60 bg-background">
          <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-6 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors ${isActive(n.to) ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-primary hover:bg-primary/5"}`}
              >
                {n.label}
              </Link>
            ))}
            {user && (
              <Link to="/orders" className={`px-3 py-1.5 rounded-full font-medium transition-colors ${isActive("/orders") ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-primary hover:bg-primary/5"}`}>
                My Orders
              </Link>
            )}
            {isFarmer && (
              <Link to="/farmer" className="px-3 py-1.5 rounded-full font-medium text-foreground/70 hover:text-primary hover:bg-primary/5">
                Farmer Hub
              </Link>
            )}
            <span className="ml-auto text-xs text-muted-foreground">Fresh stock daily · Same-day delivery</span>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background shadow-lg">
          <div className="px-6 py-4 space-y-3">
            <form onSubmit={onSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search produce…"
                className="w-full rounded-full bg-muted/60 border border-border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </form>
            <div className="flex flex-col">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium border-b border-border/60">{n.label}</Link>
              ))}
              {user && <Link to="/orders" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium border-b border-border/60">My Orders</Link>}
              {isFarmer && <Link to="/farmer" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium border-b border-border/60">Farmer Hub</Link>}
            </div>
            <div className="flex gap-2 pt-1">
              {user ? (
                <Button className="flex-1 rounded-full" onClick={async () => { await signOut(); setMobileOpen(false); navigate({ to: "/" }); }}>Sign out</Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1 rounded-full"><Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link></Button>
                  <Button asChild className="flex-1 rounded-full bg-primary text-primary-foreground"><Link to="/signup" onClick={() => setMobileOpen(false)}>Join free</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
