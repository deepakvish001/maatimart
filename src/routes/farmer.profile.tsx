import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/farmer/profile")({ component: FarmProfile });

function FarmProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [story, setStory] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: farm } = useQuery({
    queryKey: ["my-farm", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("farms").select("*").eq("owner_id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (farm) {
      setName(farm.name);
      setRegion(farm.region);
      setStory(farm.story ?? "");
    }
  }, [farm]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = { owner_id: user.id, name, region, story };
    const { error } = farm
      ? await supabase.from("farms").update(payload).eq("id", farm.id)
      : await supabase.from("farms").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["my-farm"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Farm Profile</h1>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
        Tell consumers about your land
      </p>
      <form onSubmit={save} className="bg-card p-6 space-y-4 max-w-xl">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Farm name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Region (e.g. Sangli, Maharashtra)
          </label>
          <input
            required
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Story
          </label>
          <textarea
            rows={4}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
