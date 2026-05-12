import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/" }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: search.redirect || "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-16 mx-auto max-w-md w-full">
        <h1 className="font-display text-4xl mb-2">Welcome back</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">Sign in to continue</p>
        <form onSubmit={submit} className="bg-card p-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
          </p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
