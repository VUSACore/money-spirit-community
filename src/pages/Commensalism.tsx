import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchHeatPoints, type HeatPoint } from "@/lib/actions/userLocation";
import SEOHead from "@/components/SEOHead";
import { MapContainer, TileLayer } from "react-leaflet";
import HeatLayer from "@/components/maps/HeatLayer";
import "leaflet/dist/leaflet.css";

const GLOBAL_CENTER: [number, number] = [20, 10];
const GLOBAL_ZOOM = 2;
const AUS_CENTER: [number, number] = [-25.5, 134];
const AUS_ZOOM = 4;

// Dark CartoDB tiles — match the navy/gold theme better than default OSM
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const PATHWAYS: { key: string; label: string; color: string; meaning: string }[] = [
  { key: "giver",    label: "The Giver",    color: "#D4856A", meaning: "Generous, family-first money flow" },
  { key: "keeper",   label: "The Keeper",   color: "#6B9EC4", meaning: "Saver, security-led, careful" },
  { key: "rebel",    label: "The Rebel",    color: "#A87CC4", meaning: "Independent, unconventional path" },
  { key: "seeker",   label: "The Seeker",   color: "#4DB89A", meaning: "Curious, learning, exploring" },
  { key: "achiever", label: "The Achiever", color: "#C4973A", meaning: "Driven, growth & ambition" },
  { key: "unknown",  label: "Not yet set",  color: "#EEC96E", meaning: "Member hasn't chosen a pathway" },
];

function MapView({
  points,
  center,
  zoom,
  minZoom,
  maxBounds,
}: {
  points: HeatPoint[];
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxBounds?: [[number, number], [number, number]];
}) {
  // Group points by pathway so each pathway gets its own colored heat layer
  const grouped = PATHWAYS.map((pw) => ({
    ...pw,
    points: points
      .filter((p) => (p.pathway_type ?? "unknown") === pw.key)
      .map((p) => ({ lat: p.approx_lat, lng: p.approx_lng })),
  }));

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: 520,
        border: "1px solid rgba(196,151,58,0.18)",
        boxShadow: "inset 0 1px 0 rgba(238,201,110,0.08), 0 8px 32px rgba(0,0,0,0.40)",
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxBounds={maxBounds}
        maxBoundsViscosity={1}
        scrollWheelZoom
        worldCopyJump
        style={{ height: "100%", width: "100%", background: "#04101F" }}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {grouped.map((g) =>
          g.points.length > 0 ? (
            <HeatLayer key={g.key} points={g.points} color={g.color} radius={32} blur={22} />
          ) : null,
        )}
      </MapContainer>

      <div
        className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-lg text-[11px]"
        style={{
          background: "rgba(11,21,37,0.90)",
          border: "1px solid rgba(196,151,58,0.20)",
          color: "#D4C49A",
          fontFamily: "var(--font-body)",
        }}
      >
        {points.length} member{points.length === 1 ? "" : "s"} · approximate to ~110&nbsp;km
      </div>
    </div>
  );
}

export default function Commensalism() {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatPoints().then((p) => {
      setPoints(p);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <SEOHead
        title="Commensalism — Member Heatmap"
        description="See where the Money Spirit community gathers across the world and Australia. Approximate, never exact."
      />
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        <header className="mb-6">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#EEC96E",
              marginBottom: 8,
            }}
          >
            Commensalism
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#BBA96E", fontSize: 14, maxWidth: 640 }}>
            Where our community gathers. Locations are approximate (rounded to ~110&nbsp;km) — your exact
            position is never shown.
          </p>
        </header>

        <Tabs defaultValue="global" className="w-full">
          <TabsList
            className="mb-4"
            style={{
              background: "rgba(6,12,24,0.65)",
              border: "1px solid rgba(196,151,58,0.18)",
            }}
          >
            <TabsTrigger value="global">🌍 Global</TabsTrigger>
            <TabsTrigger value="australia">🇦🇺 Australia</TabsTrigger>
          </TabsList>

          {loading ? (
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{ height: 520, background: "rgba(6,12,24,0.5)", color: "#BBA96E", fontFamily: "var(--font-body)" }}
            >
              Loading map…
            </div>
          ) : (
            <>
              <TabsContent value="global" forceMount className="data-[state=inactive]:hidden">
                <MapView points={points} center={GLOBAL_CENTER} zoom={GLOBAL_ZOOM} minZoom={2} />
              </TabsContent>
              <TabsContent value="australia" forceMount className="data-[state=inactive]:hidden">
                <MapView
                  points={points.filter(
                    (p) =>
                      p.approx_lat >= -45 &&
                      p.approx_lat <= -9 &&
                      p.approx_lng >= 110 &&
                      p.approx_lng <= 156,
                  )}
                  center={AUS_CENTER}
                  zoom={AUS_ZOOM}
                  minZoom={3}
                  maxBounds={[
                    [-50, 100],
                    [-5, 165],
                  ]}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Pathway legend */}
        <div
          className="mt-6 p-4 md:p-5 rounded-xl"
          style={{
            background: "rgba(6,12,24,0.55)",
            border: "1px solid rgba(196,151,58,0.12)",
            fontFamily: "var(--font-body)",
          }}
        >
          <div
            className="mb-3 flex items-center gap-2"
            style={{ color: "#EEC96E", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}
          >
            <span>Pathway colours</span>
            <span style={{ color: "#A08B62", fontWeight: 400, fontSize: 11 }}>
              · each glow on the map represents one of these archetypes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
            {PATHWAYS.map((p) => (
              <div key={p.key} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: p.color,
                    boxShadow: `0 0 12px ${p.color}, inset 0 0 4px rgba(255,255,255,0.25)`,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#F2EAD8", fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                  <div style={{ color: "#A08B62", fontSize: 11.5, lineHeight: 1.35 }}>{p.meaning}</div>
                </div>
              </div>
            ))}
          </div>

          <p
            className="mt-3 pt-3"
            style={{
              borderTop: "1px solid rgba(196,151,58,0.10)",
              color: "#A08B62",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            Brighter, denser glows = more members of that pathway in the area. Locations are rounded to
            roughly 110&nbsp;km — never exact.
          </p>
        </div>
      </div>
    </>
  );
}
