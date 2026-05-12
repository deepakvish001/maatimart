import { supabase } from "@/integrations/supabase/client";

export type VisitSource =
  | "homepage"
  | "marketplace"
  | "product-page"
  | "search"
  | "other";

/**
 * Log a click on a "Visit farm" CTA. Fire-and-forget — never throws or blocks
 * navigation. Records the signed-in user when available, otherwise anonymous.
 */
export async function trackFarmVisit(farmId: string, source: VisitSource = "other") {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("farm_visits").insert({
      farm_id: farmId,
      user_id: data.user?.id ?? null,
      source,
    });
  } catch (err) {
    // Telemetry must never break the user experience.
    console.warn("[farm-visit] tracking failed", err);
  }
}
