import { forwardRef, useEffect, useMemo, useState } from "react";
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
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  /** Inline SVG path data drawn in lng/lat space, projected at render time. */
  outline: string;
  /** Optional state/territory boundaries for richer context. */
  detail?: string;
};

/** Simplified continent outlines, expressed as polylines in lng,lat pairs.
 *  Each "M lng lat L lng lat ..." segment is one closed shape. */
const WORLD_OUTLINE = [
  // Africa
  "M -17 21 L -16 14 L -13 8 L 8 4 L 9 -1 L 12 -5 L 14 -12 L 18 -34 L 25 -34 L 32 -28 L 40 -16 L 51 -2 L 51 12 L 43 12 L 43 16 L 38 18 L 33 28 L 22 32 L 10 35 L -1 35 L -10 30 L -17 21 Z",
  // Europe
  "M -10 36 L -5 36 L 0 38 L 10 38 L 14 36 L 24 36 L 28 36 L 35 36 L 40 40 L 50 42 L 60 47 L 60 60 L 30 70 L 5 60 L -5 58 L -10 50 L -10 36 Z",
  // Asia
  "M 60 47 L 90 50 L 110 45 L 130 45 L 140 50 L 150 60 L 170 65 L 180 70 L 180 75 L 60 75 L 60 47 Z",
  "M 70 35 L 90 30 L 105 22 L 110 12 L 122 5 L 140 35 L 130 42 L 110 40 L 95 35 L 70 35 Z",
  // India
  "M 68 23 L 75 8 L 80 8 L 89 22 L 88 28 L 78 30 L 68 23 Z",
  // SE Asia / Indonesia
  "M 95 5 L 110 -2 L 120 -5 L 130 -7 L 140 -8 L 140 -3 L 130 0 L 110 3 L 100 5 L 95 5 Z",
  // Australia
  "M 113 -22 L 115 -33 L 130 -32 L 140 -38 L 150 -38 L 154 -28 L 145 -16 L 135 -12 L 125 -14 L 115 -20 L 113 -22 Z",
  // North America
  "M -160 65 L -140 70 L -100 72 L -80 65 L -75 50 L -85 30 L -100 25 L -110 28 L -120 35 L -125 50 L -135 55 L -160 65 Z",
  "M -85 30 L -80 25 L -78 18 L -82 10 L -78 8 L -75 12 L -70 12 L -65 10 L -60 -5 L -50 -5 L -45 -22 L -55 -32 L -65 -40 L -72 -50 L -75 -55 L -70 -55 L -65 -50 L -55 -38 L -45 -25 L -38 -10 L -38 0 L -42 8 L -55 12 L -70 12 L -78 18 L -80 25 L -85 30 Z",
  // South America body
  "M -78 8 L -80 -10 L -75 -25 L -70 -45 L -68 -55 L -55 -38 L -42 -8 L -45 -3 L -55 5 L -65 10 L -78 8 Z",
  // Greenland
  "M -50 60 L -45 75 L -25 80 L -15 75 L -20 65 L -35 60 L -50 60 Z",
  // UK / Ireland
  "M -10 50 L -8 58 L -2 58 L 1 53 L -2 50 L -10 50 Z",
  // Madagascar
  "M 43 -12 L 50 -16 L 50 -25 L 45 -25 L 43 -12 Z",
  // Japan
  "M 130 31 L 142 36 L 145 42 L 141 45 L 135 38 L 130 31 Z",
  // New Zealand
  "M 170 -34 L 174 -38 L 173 -42 L 167 -47 L 165 -45 L 170 -34 Z",
].join(" ");

const AUSTRALIA_OUTLINE =
  "M 113 -22 L 113 -26 L 115 -33 L 118 -35 L 122 -34 L 130 -32 L 135 -34 L 140 -38 L 146 -39 L 150 -38 L 153 -32 L 154 -28 L 152 -24 L 145 -16 L 140 -12 L 135 -12 L 130 -12 L 125 -14 L 120 -18 L 115 -20 L 113 -22 Z " +
  // Tasmania
  "M 144 -41 L 148 -41 L 148 -44 L 144 -44 L 144 -41 Z";

const GLOBAL: MapView = {
  minLat: -60,
  maxLat: 80,
  minLng: -180,
  maxLng: 180,
  outline: WORLD_OUTLINE,
};

const AUSTRALIA: MapView = {
  minLat: -45,
  maxLat: -9,
  minLng: 110,
  maxLng: 156,
  outline: AUSTRALIA_OUTLINE,
};

const SVG_W = 1000;
const SVG_H = 500;

function project(lat: number, lng: number, view: MapView) {
  const x = ((lng - view.minLng) / (view.maxLng - view.minLng)) * SVG_W;
  const y = SVG_H - ((lat - view.minLat) / (view.maxLat - view.minLat)) * SVG_H;
  return { x, y };
}

/** Convert an SVG path written in lng/lat space into screen-space for the current view. */
function projectPath(d: string, view: MapView): string {
  return d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (_, lngStr, latStr) => {
    const { x, y } = project(parseFloat(latStr), parseFloat(lngStr), view);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
}

type HeatMapProps = { points: HeatPoint[]; view: MapView; label: string };

const HeatMap = forwardRef<HTMLDivElement, HeatMapProps>(({ points, view, label }, ref) => {
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
  const outlinePath = useMemo(() => projectPath(view.outline, view), [view]);

  return (
    <div
      ref={ref}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 60%, #0E2D5F 0%, #071A33 70%, #04101F 100%)",
        border: "1px solid rgba(196,151,58,0.18)",
        boxShadow: "inset 0 1px 0 rgba(238,201,110,0.08), 0 8px 32px rgba(0,0,0,0.40)",
      }}
    >
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto block" role="img" aria-label={`${label} heatmap`}>
        <defs>
          <radialGradient id="ms-glow">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.30" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <pattern id="ms-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(196,151,58,0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id="ms-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a6b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0c2348" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <rect width={SVG_W} height={SVG_H} fill="url(#ms-grid)" />

        {/* Continent / country fills */}
        <path
          d={outlinePath}
          fill="url(#ms-land)"
          stroke="rgba(196,151,58,0.45)"
          strokeWidth={view === GLOBAL ? 1 : 1.5}
          strokeLinejoin="round"
          fillRule="evenodd"
        />

        {/* Heat bubbles */}
        {buckets.map((b, i) => {
          const { x, y } = project(b.lat, b.lng, view);
          const intensity = b.count / maxCount;
          const radius = 22 + intensity * 38;
          const dominant = Object.entries(b.pathway).sort((a, c) => c[1] - a[1])[0]?.[0] ?? "default";
          const color = PATHWAY_COLOR[dominant] ?? PATHWAY_COLOR.default;
          return (
            <g key={i} style={{ color }}>
              <circle cx={x} cy={y} r={radius} fill="url(#ms-glow)" />
              <circle cx={x} cy={y} r={5 + intensity * 4} fill={color} stroke="#0B1525" strokeWidth="1" />
              {b.count > 1 && (
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#0B1525"
                  style={{ pointerEvents: "none" }}
                >
                  {b.count}
                </text>
              )}
            </g>
          );
        })}

        {buckets.length === 0 && (
          <text
            x={SVG_W / 2}
            y={SVG_H / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#BBA96E"
            style={{ fontFamily: "var(--font-body)" }}
          >
            No members in this region yet
          </text>
        )}
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
        {points.length === 1 ? "" : "s"} total
      </div>
    </div>
  );
});
HeatMap.displayName = "HeatMap";

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
