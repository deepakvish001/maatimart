import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Mail, Lock, ArrowRight, Sprout, Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { heroImage } from "@/lib/seed-images";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown> & SearchSchemaInput) => ({
    redirect: (s.redirect as string) || "/",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: search.redirect || "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-10">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-accent/90" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/15 backdrop-blur">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold">MaatiMart</span>
          </Link>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h2 className="font-display text-4xl xl:text-5xl leading-tight font-bold">
            Fresh from the soil. Straight to your kitchen.
          </h2>
          <p className="text-primary-foreground/85 text-base leading-relaxed">
            Sign in to track orders, save your favourite farms, and unlock member-only deals from
            India's small growers.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Sprout, label: "Farm-direct" },
              { icon: Truck, label: "Same-day" },
              { icon: ShieldCheck, label: "Fair-pay" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl bg-background/10 backdrop-blur border border-background/15 p-3 text-center"
              >
                <f.icon className="mx-auto h-5 w-5 mb-1.5" />
                <div className="text-xs font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} MaatiMart · Pune, India
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold">
              Maati<span className="text-primary">Mart</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <div className="my-auto mx-auto w-full max-w-md py-12">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to continue your fresh produce journey.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot?
                </button>
              </div>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm"
            >
              {loading ? (
                "Signing in…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Join MaatiMart free
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-auto text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </main>
    </div>
  );
}
