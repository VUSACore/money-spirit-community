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
  const heatPoints = points.map((p) => ({ lat: p.approx_lat, lng: p.approx_lng }));

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
        <HeatLayer points={heatPoints} />
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

        {/* Legend */}
        <div
          className="mt-6 p-4 rounded-xl flex flex-wrap gap-3 items-center"
          style={{
            background: "rgba(6,12,24,0.55)",
            border: "1px solid rgba(196,151,58,0.12)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#D4C49A",
          }}
        >
          <span style={{ color: "#BBA96E", fontWeight: 500 }}>Density:</span>
          <span className="inline-flex items-center gap-2">
            <span
              style={{
                width: 120,
                height: 10,
                borderRadius: 6,
                background: "linear-gradient(90deg, #4DB89A, #6B9EC4, #EEC96E, #D4856A, #A87CC4)",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#A08B62" }}>low → high</span>
          </span>
        </div>
      </div>
    </>
  );
}
