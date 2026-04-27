import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchHeatPoints, type HeatPoint } from "@/lib/actions/userLocation";
import SEOHead from "@/components/SEOHead";

const PATHWAY_COLOR: Record<string, string> = {
  giver: "#D4856A",
  keeper: "#6B9EC4",
  rebel: "#A87CC4",
  seeker: "#4DB89A",
  achiever: "#C4973A",
  default: "#EEC96E",
};

type MapView = {
  // bounding box in lat/lng
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const GLOBAL: MapView = { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 };
const AUSTRALIA: MapView = { minLat: -44, maxLat: -10, minLng: 112, maxLng: 154 };

/** Project lat/lng to x,y inside the SVG viewBox 0..1000 / 0..500 (equirectangular). */
function project(lat: number, lng: number, view: MapView) {
  const w = 1000;
  const h = 500;
  const x = ((lng - view.minLng) / (view.maxLng - view.minLng)) * w;
  const y = h - ((lat - view.minLat) / (view.maxLat - view.minLat)) * h;
  return { x, y };
}

function HeatMap({ points, view, label }: { points: HeatPoint[]; view: MapView; label: string }) {
  // Bucket points by their approx coordinate (already rounded to 1°)
  const buckets = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number; count: number; pathway: Record<string, number> }>();
    for (const p of points) {
      if (
        p.approx_lat < view.minLat ||
        p.approx_lat > view.maxLat ||
        p.approx_lng < view.minLng ||
        p.approx_lng > view.maxLng
      )
        continue;
      const key = `${p.approx_lat}|${p.approx_lng}`;
      const cur = m.get(key) ?? { lat: p.approx_lat, lng: p.approx_lng, count: 0, pathway: {} };
      cur.count += 1;
      const pw = p.pathway_type ?? "default";
      cur.pathway[pw] = (cur.pathway[pw] ?? 0) + 1;
      m.set(key, cur);
    }
    return [...m.values()];
  }, [points, view]);

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #071A33 0%, #0B1F3A 100%)",
        border: "1px solid rgba(196,151,58,0.18)",
        boxShadow: "inset 0 1px 0 rgba(238,201,110,0.08), 0 8px 32px rgba(0,0,0,0.40)",
      }}
    >
      <svg viewBox="0 0 1000 500" className="w-full h-auto block" role="img" aria-label={`${label} heatmap`}>
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(196,151,58,0.06)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="1000" height="500" fill="url(#grid)" />

        {/* simple horizon lines */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(196,151,58,0.10)" strokeDasharray="4 6" />
        <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(196,151,58,0.10)" strokeDasharray="4 6" />

        {buckets.map((b, i) => {
          const { x, y } = project(b.lat, b.lng, view);
          const intensity = b.count / maxCount;
          const radius = 18 + intensity * 38;
          // Dominant pathway color
          const dominant = Object.entries(b.pathway).sort((a, c) => c[1] - a[1])[0]?.[0] ?? "default";
          const color = PATHWAY_COLOR[dominant] ?? PATHWAY_COLOR.default;
          return (
            <g key={i} style={{ color }}>
              <circle cx={x} cy={y} r={radius} fill="url(#glow)" />
              <circle cx={x} cy={y} r={4 + intensity * 4} fill={color} opacity={0.9} />
              {b.count > 1 && (
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#0B1525"
                  style={{ pointerEvents: "none" }}
                >
                  {b.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-[11px]"
        style={{
          background: "rgba(11,21,37,0.85)",
          border: "1px solid rgba(196,151,58,0.20)",
          color: "#D4C49A",
          fontFamily: "var(--font-body)",
        }}
      >
        {buckets.length} approximate location{buckets.length === 1 ? "" : "s"} · {points.length} member
        {points.length === 1 ? "" : "s"}
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

  const legend = Object.entries(PATHWAY_COLOR).filter(([k]) => k !== "default");

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
              className="h-[400px] rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(6,12,24,0.5)", color: "#BBA96E", fontFamily: "var(--font-body)" }}
            >
              Loading heatmap…
            </div>
          ) : (
            <>
              <TabsContent value="global">
                <HeatMap points={points} view={GLOBAL} label="Global" />
              </TabsContent>
              <TabsContent value="australia">
                <HeatMap points={points} view={AUSTRALIA} label="Australia" />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Legend */}
        <div
          className="mt-6 p-4 rounded-xl flex flex-wrap gap-4 items-center"
          style={{
            background: "rgba(6,12,24,0.55)",
            border: "1px solid rgba(196,151,58,0.12)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#D4C49A",
          }}
        >
          <span style={{ color: "#BBA96E", fontWeight: 500 }}>Pathway colour:</span>
          {legend.map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-2 capitalize">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: v,
                  boxShadow: `0 0 8px ${v}`,
                  display: "inline-block",
                }}
              />
              {k}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
