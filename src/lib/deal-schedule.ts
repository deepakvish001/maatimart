// Deal schedule configuration.
// Each deal cycle ends at the next local midnight, then rolls forward.
// Optional per-product override: pass `dealEndsAt` (ISO string) from DB if available.

const DAY_MS = 24 * 60 * 60 * 1000;

/** End of the current local day (next midnight). */
export function endOfTodayLocal(now: Date = new Date()): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * Resolve the countdown target for a deal.
 * - If the product has an explicit `deal_ends_at` (future), use it.
 * - Otherwise fall back to the configured daily schedule (next local midnight).
 * - If the resolved time is in the past, roll forward by whole days.
 */
export function resolveDealEnd(dealEndsAt?: string | null, now: Date = new Date()): number {
  if (dealEndsAt) {
    const t = Date.parse(dealEndsAt);
    if (!Number.isNaN(t) && t > now.getTime()) return t;
  }
  let target = endOfTodayLocal(now);
  while (target <= now.getTime()) target += DAY_MS;
  return target;
}
