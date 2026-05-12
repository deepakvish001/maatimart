import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

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
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    navigate({ to: role === "farmer" ? "/farmer" : "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-16 mx-auto max-w-md w-full">
        <h1 className="font-display text-4xl mb-2">Join Maati</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">Buy direct or sell direct</p>
        <form onSubmit={submit} className="bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["consumer","farmer"] as const).map((r) => (
              <button type="button" key={r} onClick={() => setRole(r)}
                className={`py-3 text-xs font-medium uppercase tracking-widest border ${role === r ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border hover:bg-muted"}`}>
                {r === "consumer" ? "I'm a Buyer" : "I'm a Farmer"}
              </button>
            ))}
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
