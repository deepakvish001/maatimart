import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { LayoutDashboard, Package, ShoppingCart, Store } from "lucide-react";

export const Route = createFileRoute("/farmer")({ component: FarmerLayout });

const NAV = [
  { to: "/farmer", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/farmer/listings", label: "Listings", icon: Package },
  { to: "/farmer/orders", label: "Orders", icon: ShoppingCart },
  { to: "/farmer/profile", label: "Farm Profile", icon: Store },
] as const;

function FarmerLayout() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login", search: { redirect: "/farmer" } });
    else if (!roles.includes("farmer")) navigate({ to: "/" });
  }, [loading, user, roles, navigate]);

  if (!user || !roles.includes("farmer")) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-7xl w-full grid lg:grid-cols-[220px_1fr] gap-8 px-6 py-8">
        <aside className="bg-sidebar text-sidebar-foreground p-4 h-fit lg:sticky lg:top-20">
          <p className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60 mb-4 px-2">Farmer Hub</p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap ${active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/50"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
