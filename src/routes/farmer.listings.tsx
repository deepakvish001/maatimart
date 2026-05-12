import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/farmer/listings")({ component: ListingsPage });

function ListingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: farm } = useQuery({
    queryKey: ["my-farm", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("farms").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["farmer-products", farm?.id],
    enabled: !!farm,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("farm_id", farm!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!farm) {
    return (
      <div className="bg-card p-8">
        <h1 className="font-display text-3xl mb-3">Set up your farm first</h1>
        <p className="text-muted-foreground mb-6">Add your farm details before listing produce.</p>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <a href="/farmer/profile">Set up farm</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="font-display text-4xl mb-2">Listings</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{farm.name}</p>
        </div>
        <Button onClick={() => setAdding(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">+ New listing</Button>
      </div>

      {adding && <NewListingForm farmId={farm.id} onClose={() => { setAdding(false); qc.invalidateQueries({ queryKey: ["farmer-products"] }); }} />}

      <div className="bg-card divide-y divide-border">
        {(products?.length ?? 0) === 0 ? (
          <p className="p-6 text-muted-foreground">No listings yet.</p>
        ) : products!.map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{formatINR(p.price_paise)} / {p.unit} · {Number(p.stock)} in stock</p>
            </div>
            <button
              onClick={async () => {
                await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
                qc.invalidateQueries({ queryKey: ["farmer-products"] });
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${p.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
              {p.is_active ? "Active" : "Hidden"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewListingForm({ farmId, onClose }: { farmId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("10");
  const [organic, setOrganic] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      farm_id: farmId, name, category, unit, description,
      price_paise: Math.round(parseFloat(price) * 100),
      stock: parseFloat(stock), is_organic: organic, is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Listing added");
    onClose();
  };

  return (
    <form onSubmit={save} className="bg-card p-6 mb-6 space-y-3">
      <h2 className="font-display text-xl">New listing</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Produce name" value={name} onChange={(e) => setName(e.target.value)} className="bg-background border border-border px-3 py-2 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-background border border-border px-3 py-2 text-sm">
          <option value="vegetables">Vegetables</option><option value="fruits">Fruits</option><option value="spices">Spices</option><option value="grains">Grains</option>
        </select>
        <input required type="number" step="0.01" placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-background border border-border px-3 py-2 text-sm" />
        <input required placeholder="Unit (kg, dozen, bunch)" value={unit} onChange={(e) => setUnit(e.target.value)} className="bg-background border border-border px-3 py-2 text-sm" />
        <input required type="number" step="0.1" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="bg-background border border-border px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} /> Organic</label>
      </div>
      <textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-background border border-border px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
