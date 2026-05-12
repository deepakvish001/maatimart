import { useEffect, useState } from "react";
import { Truck, Info, MapPin, Sparkles, Timer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { etaToneClasses, type DeliveryEta } from "@/lib/delivery-eta";
import { PincodePicker } from "@/components/pincode-picker";

const CUTOFF_HOUR = 14; // 2 PM local
const CUTOFF_LABEL = "2 PM";

function nextCutoff(now: Date): Date {
  const c = new Date(now);
  c.setHours(CUTOFF_HOUR, 0, 0, 0);
  if (now.getTime() >= c.getTime()) c.setDate(c.getDate() + 1);
  return c;
}

function useCutoffCountdown(active: boolean) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);
  if (!now) return null;
  const target = nextCutoff(now);
  const diffMs = target.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const isToday = target.toDateString() === now.toDateString();
  return {
    label: `${pad(h)}:${pad(m)}:${pad(s)}`,
    isToday,
    targetDate: target,
  };
}

export function EtaChip({ eta, className = "" }: { eta: DeliveryEta; className?: string }) {
  const [open, setOpen] = useState(false);
  const thresholdRupees = Math.round(eta.freeThresholdPaise / 100);
  const remainingRupees = Math.ceil(eta.remainingToFreePaise / 100);
  const progressPct = Math.min(100, Math.round((eta.cartTotalPaise / eta.freeThresholdPaise) * 100));
  const countdown = useCutoffCountdown(open);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          aria-label={`Delivery estimate: ${eta.label}. Tap for details.`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary/40 ${etaToneClasses(eta.tone)} ${className}`}
        >
          <Truck className="h-3 w-3" /> {eta.label}
          <Info className="h-2.5 w-2.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-72 text-xs"
        onClick={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Truck className="h-3.5 w-3.5 text-primary" /> {eta.label}
          </div>
          <p className="text-muted-foreground">{eta.detail}</p>

          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {eta.pincode ? (
                <span><span className="font-medium text-foreground">{eta.pincode}</span> · {eta.zone === "local" ? "Local zone" : eta.zone === "regional" ? "Regional" : eta.zone === "out-of-zone" ? "Out of zone" : ""}</span>
              ) : (
                <span>No pincode set</span>
              )}
            </div>
            <PincodePicker compact />
          </div>

          {/* Free express progress */}
          <div className="rounded-md border border-border/60 bg-card px-2.5 py-2">
            {eta.expressEligible ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Sparkles className="h-3 w-3" /> Free express unlocked!
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-foreground font-semibold">
                  <span>Add ₹{remainingRupees} more</span>
                  <span className="text-muted-foreground font-normal">for free express</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>₹{Math.round(eta.cartTotalPaise / 100)} in cart</span>
                  <span>₹{thresholdRupees} threshold</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border/60 pt-2 space-y-1 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Same-day cutoff:</span> order before {CUTOFF_LABEL} for delivery today.
            </p>
            <p>
              <span className="font-medium text-foreground">Pincode:</span> set yours for an exact date — out-of-zone pincodes can't be delivered.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
