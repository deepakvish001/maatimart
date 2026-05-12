import { Truck, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { etaToneClasses, type DeliveryEta } from "@/lib/delivery-eta";

const FREE_THRESHOLD_RUPEES = 499;
const CUTOFF_LABEL = "2 PM";

export function EtaChip({ eta, className = "" }: { eta: DeliveryEta; className?: string }) {
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
        className="w-64 text-xs"
        onClick={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Truck className="h-3.5 w-3.5 text-primary" /> {eta.label}
          </div>
          <p className="text-muted-foreground">{eta.detail}</p>
          <div className="border-t border-border/60 pt-2 space-y-1 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Same-day cutoff:</span> order before {CUTOFF_LABEL} for delivery today.
            </p>
            <p>
              <span className="font-medium text-foreground">Free express:</span> unlocked when your cart reaches ₹{FREE_THRESHOLD_RUPEES}.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
