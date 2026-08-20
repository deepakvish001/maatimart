import { useEffect, useId, useState } from "react";
import { Truck, Info, MapPin, Sparkles, Timer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { etaToneClasses, type DeliveryEta } from "@/lib/delivery-eta";
import { PincodePicker } from "@/components/pincode-picker";
import { useIsMobile } from "@/hooks/use-mobile";

function nextCutoff(now: Date, cutoffHour: number): Date {
  const c = new Date(now);
  c.setHours(cutoffHour, 0, 0, 0);
  if (now.getTime() >= c.getTime()) c.setDate(c.getDate() + 1);
  return c;
}

function useCutoffCountdown(active: boolean, cutoffHour: number) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);
  if (!now) return null;
  const target = nextCutoff(now, cutoffHour);
  const diffMs = target.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const isToday = target.toDateString() === now.toDateString();
  return {
    label: `${pad(h)}:${pad(m)}:${pad(s)}`,
    spoken: `${h > 0 ? `${h} hour${h === 1 ? "" : "s"} ` : ""}${m} minute${m === 1 ? "" : "s"}`,
    isToday,
    targetDate: target,
  };
}

function EtaBody({
  eta,
  open,
  titleId,
  descId,
  mobile,
}: {
  eta: DeliveryEta;
  open: boolean;
  titleId: string;
  descId: string;
  mobile: boolean;
}) {
  const thresholdRupees = Math.round(eta.freeThresholdPaise / 100);
  const remainingRupees = Math.ceil(eta.remainingToFreePaise / 100);
  const cartRupees = Math.round(eta.cartTotalPaise / 100);
  const progressPct = Math.min(
    100,
    Math.round((eta.cartTotalPaise / eta.freeThresholdPaise) * 100),
  );
  const countdown = useCutoffCountdown(open, eta.cutoffHour);
  const cutoffLabel = eta.cutoffLabel;

  const text = mobile ? "text-sm" : "text-xs";
  const small = mobile ? "text-xs" : "text-[10px]";

  return (
    <div className={`space-y-3 ${text}`}>
      {!mobile && (
        <h3 id={titleId} className="flex items-center gap-1.5 font-semibold text-foreground">
          <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {eta.label}
        </h3>
      )}
      <p id={mobile ? undefined : descId} className="text-muted-foreground">
        {eta.detail}
      </p>

      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {eta.pincode ? (
            <span>
              <span className="font-medium text-foreground">{eta.pincode}</span> ·{" "}
              {eta.zone === "local"
                ? "Local zone"
                : eta.zone === "regional"
                  ? "Regional"
                  : eta.zone === "out-of-zone"
                    ? "Out of zone"
                    : ""}
            </span>
          ) : (
            <span>No pincode set</span>
          )}
        </div>
        <PincodePicker compact />
      </div>

      {/* Free express progress */}
      <div className="rounded-md border border-border/60 bg-card px-3 py-2.5">
        {eta.expressEligible ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Free express unlocked!
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-foreground font-semibold">
              <span>Add ₹{remainingRupees} more</span>
              <span className="text-muted-foreground font-normal">for free express</span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Free express progress: ₹${cartRupees} of ₹${thresholdRupees}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className={`mt-1 flex justify-between ${small} text-muted-foreground`}>
              <span>₹{cartRupees} in cart</span>
              <span>₹{thresholdRupees} threshold</span>
            </div>
          </>
        )}
      </div>

      {countdown && (
        <div
          className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2.5"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${countdown.spoken} until ${countdown.isToday ? "today's" : "tomorrow's"} ${cutoffLabel} cutoff`}
        >
          <Timer className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">
            {countdown.isToday ? (
              <>
                Order in{" "}
                <span className="font-semibold text-foreground" aria-hidden="true">
                  {countdown.label}
                </span>{" "}
                for same-day delivery
              </>
            ) : (
              <>
                Same-day cutoff in{" "}
                <span className="font-semibold text-foreground" aria-hidden="true">
                  {countdown.label}
                </span>{" "}
                (tomorrow {cutoffLabel})
              </>
            )}
          </span>
        </div>
      )}

      <div className="border-t border-border/60 pt-2 space-y-1.5 text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Same-day cutoff:</span> order before{" "}
          <span className="font-semibold text-foreground">{cutoffLabel}</span> for delivery today in{" "}
          <span className="font-medium text-foreground">{eta.cityLabel}</span>.
        </p>
        <p>
          <span className="font-medium text-foreground">Pincode:</span> set yours for an exact date
          — out-of-zone pincodes can't be delivered.
        </p>
        {!mobile && <p className={`${small} opacity-70`}>Press Esc to close.</p>}
      </div>
    </div>
  );
}

export function EtaChip({ eta, className = "" }: { eta: DeliveryEta; className?: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();
  const isMobile = useIsMobile();

  const trigger = (
    <button
      type="button"
      aria-label={`Delivery estimate: ${eta.label}. Press Enter for details.`}
      aria-haspopup="dialog"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 ${etaToneClasses(eta.tone)} ${className}`}
    >
      <Truck className="h-3 w-3" aria-hidden="true" /> {eta.label}
      <Info className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
    </button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="inset-0 h-screen w-screen max-w-none overflow-y-auto rounded-none border-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" aria-hidden="true" /> {eta.label}
            </SheetTitle>
            <SheetDescription className="sr-only">Delivery estimate details</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <EtaBody eta={eta} open={open} titleId={titleId} descId={descId} mobile />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-72 text-xs"
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <EtaBody eta={eta} open={open} titleId={titleId} descId={descId} mobile={false} />
      </PopoverContent>
    </Popover>
  );
}
