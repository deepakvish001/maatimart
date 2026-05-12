// City-aware same-day delivery cutoffs. Pincode prefix → cutoff hour (24h local).
// Couriers in metros with denser hubs accept later cutoffs; tier-2 cities get earlier ones.

export interface DeliveryZone {
  city: string;
  cutoffHour: number; // 0–23, local time
}

const PREFIX_ZONES: Record<string, DeliveryZone> = {
  // Mumbai metro
  "400": { city: "Mumbai", cutoffHour: 15 },
  "401": { city: "Mumbai (Thane)", cutoffHour: 15 },
  // Pune
  "411": { city: "Pune", cutoffHour: 14 },
  "412": { city: "Pune", cutoffHour: 14 },
  // Delhi NCR
  "110": { city: "Delhi", cutoffHour: 12 },
  "201": { city: "Noida / Ghaziabad", cutoffHour: 12 },
  "122": { city: "Gurugram", cutoffHour: 12 },
  // Bangalore
  "560": { city: "Bengaluru", cutoffHour: 13 },
  "562": { city: "Bengaluru (rural)", cutoffHour: 11 },
  // Chennai
  "600": { city: "Chennai", cutoffHour: 13 },
  // Hyderabad
  "500": { city: "Hyderabad", cutoffHour: 13 },
  // Kolkata
  "700": { city: "Kolkata", cutoffHour: 12 },
  // Ahmedabad
  "380": { city: "Ahmedabad", cutoffHour: 14 },
  // Kochi
  "682": { city: "Kochi", cutoffHour: 13 },
  // Jaipur
  "302": { city: "Jaipur", cutoffHour: 12 },
};

export const DEFAULT_ZONE: DeliveryZone = { city: "your area", cutoffHour: 14 };

export function getDeliveryZone(pincode: string | null | undefined): DeliveryZone {
  if (!pincode || !/^\d{6}$/.test(pincode)) return DEFAULT_ZONE;
  return PREFIX_ZONES[pincode.slice(0, 3)] ?? DEFAULT_ZONE;
}

export function formatCutoffLabel(hour: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h12} ${suffix}`;
}
