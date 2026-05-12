import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, Heart } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";

export function SiteHeader() {
  const items = useCart((s) => s.items);
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const count = cartCount(items);
  const isFarmer = roles.includes("farmer");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-2xl font-bold italic text-accent tracking-tight">
            Maati
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium uppercase tracking-widest">
            <Link to="/marketplace" className="hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
              Marketplace
            </Link>
            {user && (
              <Link to="/orders" className="hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
                My Orders
              </Link>
            )}
            {isFarmer && (
              <Link to="/farmer" className="hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
                Farmer Hub
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <Link to="/wishlist" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          )}
          <NotificationsBell />
          <Link to="/cart" className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <UserIcon className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/signup">Join</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
