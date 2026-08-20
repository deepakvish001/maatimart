import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Leaf,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShoppingBasket,
  Tractor,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { heroImage } from "@/lib/seed-images";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"consumer" | "farmer">("consumer");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — welcome to MaatiMart!");
    navigate({ to: role === "farmer" ? "/farmer" : "/" });
  };

  const perks =
    role === "farmer"
      ? ["List produce in minutes", "Get paid directly, no middlemen", "Reach buyers across India"]
      : ["Free delivery over ₹499", "Save favourite farms", "Member-only weekly deals"];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left form panel */}
      <main className="order-2 lg:order-1 flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between lg:justify-start">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold">
              Maati<span className="text-primary">Mart</span>
            </span>
          </Link>
          <p className="lg:hidden text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="my-auto mx-auto w-full max-w-md py-10">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight">Join MaatiMart</h1>
            <p className="mt-2 text-muted-foreground">
              Buy direct or sell direct — pick your path below.
            </p>
          </div>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/50 border border-border mb-6">
            {(
              [
                { v: "consumer", label: "I'm a Buyer", icon: ShoppingBasket },
                { v: "farmer", label: "I'm a Farmer", icon: Tractor },
              ] as const
            ).map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  role === r.v
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <r.icon className="h-4 w-4" />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <div className="mt-1.5 relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
                />
              </div>
            </div>
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl bg-muted/40 border border-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm"
            >
              {loading ? (
                "Creating account…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Create account <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already with us?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-auto text-center text-xs text-muted-foreground">
          By creating an account you agree to our Terms & Privacy Policy.
        </p>
      </main>

      {/* Right brand panel */}
      <aside className="order-1 lg:order-2 relative hidden lg:flex flex-col justify-between overflow-hidden bg-accent text-accent-foreground p-10">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-bl from-accent/95 via-accent/85 to-primary/90" />
        <div className="relative" />
        <div className="relative space-y-6 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/15 backdrop-blur border border-background/20 px-3 py-1 text-xs font-medium">
            <Leaf className="h-3.5 w-3.5" /> {role === "farmer" ? "For growers" : "For shoppers"}
          </span>
          <h2 className="font-display text-4xl xl:text-5xl leading-tight font-bold">
            {role === "farmer"
              ? "Sell your harvest. Keep more of every rupee."
              : "Real food. Real farmers. Real fair."}
          </h2>
          <ul className="space-y-3 pt-2">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-accent-foreground/90">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-background/20">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-accent-foreground/70">
          Trusted by 1,200+ small farms across Maharashtra & Kerala
        </div>
      </aside>
    </div>
  );
}
