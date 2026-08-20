import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePincode, isValidPincode } from "@/lib/pincode-store";

export function PincodePicker({ compact = false }: { compact?: boolean }) {
  const { pincode, setPincode, ready } = usePincode();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(pincode ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.replace(/\D/g, "").slice(0, 6);
    if (!isValidPincode(cleaned)) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    setError(null);
    setPincode(cleaned);
    setOpen(false);
  };

  const label = pincode ? `Deliver to ${pincode}` : "Set pincode";

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDraft(pincode ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={
            compact
              ? "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
          }
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-xs">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="font-semibold text-foreground">Delivery pincode</label>
            <p className="mt-0.5 text-muted-foreground">
              We use this to estimate your delivery date and check if a farm ships to you.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="e.g. 400001"
              className="flex-1 h-9 rounded-md border border-border bg-background px-2 text-sm font-medium tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
          {error && <p className="text-destructive">{error}</p>}
          {pincode && (
            <button
              type="button"
              onClick={() => {
                setPincode(null);
                setDraft("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-destructive font-medium"
            >
              Clear pincode
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
