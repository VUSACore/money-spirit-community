import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type Point = { lat: number; lng: number; intensity?: number };

export default function HeatLayer({ points, radius = 35, blur = 25, max = 5 }: { points: Point[]; radius?: number; blur?: number; max?: number }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!points.length) return;
    const data = points.map((p) => [p.lat, p.lng, p.intensity ?? 1] as [number, number, number]);
    // @ts-expect-error - L.heatLayer comes from leaflet.heat plugin
    const layer = L.heatLayer(data, {
      radius,
      blur,
      max,
      minOpacity: 0.45,
      gradient: {
        0.2: "#4DB89A",
        0.4: "#6B9EC4",
        0.6: "#EEC96E",
        0.8: "#D4856A",
        1.0: "#A87CC4",
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, radius, blur, max]);

  return null;
}
