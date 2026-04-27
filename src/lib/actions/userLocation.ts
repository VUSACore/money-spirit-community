import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "ms_location_recorded_v1";

/**
 * Records the current viewer's APPROXIMATE location based on IP geolocation.
 * Coordinates are rounded to ~1° (~111km) to avoid pinpointing.
 * Safe to call repeatedly; only hits the network once per session.
 */
export async function recordViewerLocation(userId: string, pathwayType?: string | null) {
  if (!userId) return;
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(LS_KEY)) return;

  try {
    // Free, no-key, IP-based geolocation
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return;
    const ip = await res.json();
    const lat = Number(ip.latitude);
    const lng = Number(ip.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Round to nearest 1 degree (~111km) — approximate, never exact
    const approx_lat = Math.round(lat);
    const approx_lng = Math.round(lng);

    await supabase.from("user_locations").upsert(
      {
        user_id: userId,
        approx_lat,
        approx_lng,
        country: ip.country_name ?? null,
        region: ip.region ?? null,
        city: ip.city ?? null,
        pathway_type: (pathwayType as never) ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    sessionStorage.setItem(LS_KEY, "1");
  } catch {
    /* silent — geolocation is best-effort */
  }
}

export type HeatPoint = {
  approx_lat: number;
  approx_lng: number;
  country: string | null;
  pathway_type: string | null;
};

export async function fetchHeatPoints(): Promise<HeatPoint[]> {
  const { data, error } = await supabase
    .from("user_locations")
    .select("approx_lat, approx_lng, country, pathway_type");
  if (error) return [];
  return (data ?? []) as HeatPoint[];
}
