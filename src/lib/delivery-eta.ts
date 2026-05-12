// Lightweight delivery ETA estimator used by product cards and the
// product detail page. Pure function so it stays SSR-safe; the caller
// passes in the current cart total and (optionally) what they're about
// to add.

export type EtaTone = "express" | "standard" | "slow";
export interface DeliveryEta {
  label: string;
  tone: EtaTone;
  detail: string;
}

const FREE_THRESHOLD_PAISE = 49900; // ₹499 — matches cart-store / cart page
const SAME_DAY_CUTOFF_HOUR = 14;     // before 2 PM local
const RESTOCK_DAYS = "3–5 days";

function fmt(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function getDeliveryEta(opts: {
  stock?: number | null;
  cartTotalPaise?: number;
  addingPaise?: number;
  freeThresholdPaise?: number;
  now?: Date;
}): DeliveryEta {
  const stock = opts.stock ?? 1;
  if (stock <= 0) {
    return {
      label: `Restocking · ${RESTOCK_DAYS}`,
      tone: "slow",
      detail: "We'll harvest a fresh batch and ship as soon as it's ready.",
    };
  }

  const free = opts.freeThresholdPaise ?? FREE_THRESHOLD_PAISE;
  const total = (opts.cartTotalPaise ?? 0) + (opts.addingPaise ?? 0);
  const now = opts.now ?? new Date();
  const expressEligible = total >= free;

  if (expressEligible && now.getHours() < SAME_DAY_CUTOFF_HOUR) {
    return {
      label: "Today by 9 PM",
      tone: "express",
      detail: "Free express delivery — order before 2 PM.",
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (expressEligible) {
    return {
      label: `Tomorrow · ${fmt(tomorrow)}`,
      tone: "express",
      detail: "Free express delivery on your cart.",
    };
  }

  // Standard: next-day if before cutoff, else day-after.
  const target = new Date(now);
  const offset = now.getHours() < SAME_DAY_CUTOFF_HOUR ? 1 : 2;
  target.setDate(target.getDate() + offset);
  const remaining = Math.max(0, free - total);
  return {
    label: `By ${fmt(target)}`,
    tone: "standard",
    detail: remaining > 0
      ? `Add ₹${(remaining / 100).toFixed(0)} more for free express delivery.`
      : "Standard delivery",
  };
}

export function etaToneClasses(tone: EtaTone): string {
  switch (tone) {
    case "express":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case "slow":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}
