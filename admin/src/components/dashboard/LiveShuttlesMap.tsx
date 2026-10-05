import { Map as MapLibreMap, Marker, Popup, setWorkerUrl, type LngLatBoundsLike, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";
import { fr } from "@/lib/fr";
import type { LiveShuttles, LiveTrip } from "@/lib/types";

/** IGN Géoplateforme "Plan IGN v2" (no key), like the meeting point map. */
const IGN_PLAN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
const YELLOW = "#F5C400";
const BLACK = "#0B0B0C";
const GREY = "#A8A8A2";

setWorkerUrl(maplibreWorkerUrl);

const STYLE: StyleSpecification = {
  version: 8,
  sources: { ign: { type: "raster", tiles: [IGN_PLAN_TILES], tileSize: 256, maxzoom: 19 } },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#1d1f1a" } },
    { id: "ign-plan", type: "raster", source: "ign", paint: { "raster-saturation": -0.6, "raster-brightness-max": 0.75 } },
  ],
};

function pinElement(text: string, kind: "parking" | "stop" | "bus"): HTMLElement {
  const el = document.createElement("div");
  el.className = "font-mono text-[12px] font-bold";
  const box =
    kind === "bus"
      ? `background:${YELLOW};color:${BLACK};border:2px solid ${BLACK};padding:2px 6px`
      : kind === "parking"
        ? `background:${BLACK};color:${YELLOW};border:2px solid ${YELLOW};padding:2px 7px`
        : `background:${BLACK};color:${GREY};border:1px solid ${GREY};padding:1px 6px`;
  el.setAttribute("style", `${box};white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.6)`);
  el.textContent = text;
  return el;
}

function tripLabel(t: LiveTrip): string {
  const m = fr.dashboard.map;
  const where = t.toStop && t.stop ? m.toStop(t.stop.name, t.toStop.etaMinutes) : t.toParking ? m.toParking(t.toParking.etaMinutes) : m.noPosition;
  return `${t.driverName} · ${m.direction[t.direction]} · ${m.passengers(t.passengers)} · ${where}`;
}

/**
 * The running shuttles on the plan (P-A): the parking "P", the stops, and a yellow bus pin per trip
 * with its driver, direction and distance. Loaded lazily (MapLibre is heavy, no place in the tests).
 */
export default function LiveShuttlesMap({ live }: { live: LiveShuttles }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE,
      center: [live.parking.lng ?? 5.08, live.parking.lat ?? 45.72],
      zoom: 12,
      maxZoom: 18,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Created once; the pins follow `live` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    const markers: Marker[] = [];
    const points: [number, number][] = [];
    if (live.parking.lat !== null && live.parking.lng !== null) {
      markers.push(new Marker({ element: pinElement("P", "parking") }).setLngLat([live.parking.lng, live.parking.lat]).addTo(map));
      points.push([live.parking.lng, live.parking.lat]);
    }
    for (const stop of live.stops) {
      markers.push(
        new Marker({ element: pinElement(stop.name, "stop") })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(new Popup({ closeButton: false, offset: 12 }).setText(stop.name))
          .addTo(map),
      );
      points.push([stop.lng, stop.lat]);
    }
    for (const trip of live.trips) {
      if (!trip.position) continue;
      markers.push(
        new Marker({ element: pinElement(trip.vehicle.model ?? trip.driverName, "bus") })
          .setLngLat([trip.position.lng, trip.position.lat])
          .setPopup(new Popup({ closeButton: false, offset: 12 }).setText(tripLabel(trip)))
          .addTo(map),
      );
      points.push([trip.position.lng, trip.position.lat]);
    }
    markersRef.current = markers;
    // Frame everything once (then the user keeps control of the view).
    if (!fittedRef.current && points.length > 0) {
      fittedRef.current = true;
      if (points.length === 1) map.jumpTo({ center: points[0], zoom: 13 });
      else {
        const lngs = points.map(p => p[0]);
        const lats = points.map(p => p[1]);
        const bounds: LngLatBoundsLike = [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ];
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }
    }
  }, [live]);

  return (
    <div className="relative h-full min-h-[320px]">
      <div ref={containerRef} data-testid="live-shuttles-map" className="absolute inset-0 bg-[#1d1f1a]" />
      <span className="pointer-events-none absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">© IGN – Plan IGN</span>
    </div>
  );
}
