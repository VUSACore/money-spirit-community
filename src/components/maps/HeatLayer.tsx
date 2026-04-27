import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type Point = { lat: number; lng: number; intensity?: number };

export default function HeatLayer({
  points,
  color,
  radius = 35,
  blur = 25,
  max = 5,
}: {
  points: Point[];
  /** Single solid color used as the gradient peak. If omitted, uses the multi-color density gradient. */
  color?: string;
  radius?: number;
  blur?: number;
  max?: number;
}) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!points.length) return;
    const data = points.map((p) => [p.lat, p.lng, p.intensity ?? 1] as [number, number, number]);
    const gradient = color
      ? { 0.2: color, 0.5: color, 1.0: color }
      : {
          0.2: "#4DB89A",
          0.4: "#6B9EC4",
          0.6: "#EEC96E",
          0.8: "#D4856A",
          1.0: "#A87CC4",
        };
    // @ts-expect-error - L.heatLayer comes from leaflet.heat plugin
    const layer = L.heatLayer(data, {
      radius,
      blur,
      max,
      minOpacity: 0.5,
      gradient,
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, color, radius, blur, max]);

  return null;
}
