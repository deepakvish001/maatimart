// Lightweight delivery ETA estimator used by product cards and the
// product detail page. Pure function so it stays SSR-safe; the caller
// passes in the current cart total, what they're about to add, and
// optionally the user's delivery pincode + the farm's serviceable
// pincode list.

import { getDeliveryZone, formatCutoffLabel } from "./delivery-zones";

export type EtaTone = "express" | "standard" | "slow";
export type EtaZone = "local" | "regional" | "out-of-zone" | "unknown";

export interface DeliveryEta {
  label: string;
  tone: EtaTone;
  detail: string;
  zone: EtaZone;
  serviceable: boolean;
  pincode: string | null;
  /** Live snapshot of cart total + this addition, used to render progress bars. */
  cartTotalPaise: number;
  freeThresholdPaise: number;
  remainingToFreePaise: number;
  expressEligible: boolean;
  /** City-aware same-day cutoff derived from pincode. */
  cutoffHour: number;
  cutoffLabel: string;
  cityLabel: string;
}

const FREE_THRESHOLD_PAISE = 49900; // ₹499 — matches cart-store / cart page
const RESTOCK_DAYS = "3–5 days";

function fmt(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function classifyZone(userPin: string | null | undefined, farmPins: string[] | null | undefined): EtaZone {
  if (!userPin) return "unknown";
  if (!farmPins || farmPins.length === 0) return "unknown";
  if (farmPins.includes(userPin)) return "local";
  const prefix = userPin.slice(0, 3);
  if (farmPins.some((p) => p.startsWith(prefix))) return "regional";
  return "out-of-zone";
}

export function getDeliveryEta(opts: {
  stock?: number | null;
  cartTotalPaise?: number;
  addingPaise?: number;
  freeThresholdPaise?: number;
  now?: Date;
  userPincode?: string | null;
  farmPincodes?: string[] | null;
}): DeliveryEta {
  const stock = opts.stock ?? 1;
  const userPincode = opts.userPincode ?? null;
  const zone = classifyZone(userPincode, opts.farmPincodes);
  const free = opts.freeThresholdPaise ?? FREE_THRESHOLD_PAISE;
  const total = (opts.cartTotalPaise ?? 0) + (opts.addingPaise ?? 0);
  const remaining = Math.max(0, free - total);
  const expressEligible = total >= free;
  const now = opts.now ?? new Date();

  const base = {
    zone,
    pincode: userPincode,
    cartTotalPaise: total,
    freeThresholdPaise: free,
    remainingToFreePaise: remaining,
    expressEligible,
  };

  if (stock <= 0) {
    return {
      ...base,
      label: `Restocking · ${RESTOCK_DAYS}`,
      tone: "slow",
      detail: "We'll harvest a fresh batch and ship as soon as it's ready.",
      serviceable: zone !== "out-of-zone",
    };
  }

  // Out-of-zone: farm doesn't ship to this pincode.
  if (zone === "out-of-zone") {
    return {
      ...base,
      label: `Not deliverable to ${userPincode}`,
      tone: "slow",
      detail: "This farm doesn't ship to your pincode yet. Try another product or update your delivery pincode.",
      serviceable: false,
    };
  }

  // Regional zone (same district prefix but not exact match) — never same-day,
  // add a buffer day.
  if (zone === "regional") {
    const target = new Date(now);
    const offset = expressEligible ? 1 : (now.getHours() < SAME_DAY_CUTOFF_HOUR ? 2 : 3);
    target.setDate(target.getDate() + offset);
    return {
      ...base,
      label: `By ${fmt(target)}`,
      tone: expressEligible ? "standard" : "slow",
      detail: expressEligible
        ? `Regional delivery to ${userPincode} · free express applied.`
        : `Regional delivery to ${userPincode}. Add more for free express.`,
      serviceable: true,
    };
  }

  // Local zone or unknown (no pincode set) — original logic.
  if (expressEligible && now.getHours() < SAME_DAY_CUTOFF_HOUR) {
    return {
      ...base,
      label: "Today by 9 PM",
      tone: "express",
      detail: zone === "local"
        ? `Free express to ${userPincode} — order before 2 PM.`
        : "Free express delivery — order before 2 PM. Set your pincode for an exact ETA.",
      serviceable: true,
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (expressEligible) {
    return {
      ...base,
      label: `Tomorrow · ${fmt(tomorrow)}`,
      tone: "express",
      detail: zone === "local"
        ? `Free express delivery to ${userPincode}.`
        : "Free express delivery on your cart. Set your pincode for an exact ETA.",
      serviceable: true,
    };
  }

  // Standard: next-day if before cutoff, else day-after.
  const target = new Date(now);
  const offset = now.getHours() < SAME_DAY_CUTOFF_HOUR ? 1 : 2;
  target.setDate(target.getDate() + offset);
  const baseDetail = remaining > 0
    ? `Add ₹${(remaining / 100).toFixed(0)} more for free express delivery.`
    : "Standard delivery";
  return {
    ...base,
    label: `By ${fmt(target)}`,
    tone: "standard",
    detail: zone === "local"
      ? `${baseDetail} · ships to ${userPincode}.`
      : `${baseDetail}${zone === "unknown" ? " Set your pincode for an exact ETA." : ""}`,
    serviceable: true,
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
