import { Map as MapLibreMap, Marker, Popup, setWorkerUrl, type LngLatBoundsLike, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";
import { fr } from "@/lib/fr";
import { nextHeadings, SHUTTLE_COLOURS, shuttleSvg, shuttleTone, shuttleTransform } from "@/lib/shuttle-icon";
import type { LiveShuttles, LiveTrip, ShuttleStop } from "@/lib/types";

/** IGN Géoplateforme "Plan IGN v2" (no key), like the meeting point map. */
const IGN_PLAN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
/** Colours of the "Opérations" mockup (C-B). */
const YELLOW = "#A3E635";
const BLACK = "#0F2A14";
const CARD = "#FFFFFF";
const LINE = "#E4E6E2";
const FG = "#1A1D1A";
const MUTED = "#6B7280";
const OK = "#16A34A";
const WARN = "#D97706";
/** A position older than this is "stale": amber dot instead of green. */
const FRESH_SECONDS = 90;

setWorkerUrl(maplibreWorkerUrl);

const STYLE: StyleSpecification = {
  version: 8,
  sources: { ign: { type: "raster", tiles: [IGN_PLAN_TILES], tileSize: 256, maxzoom: 19 } },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#E6E8E4" } },
    // Slightly desaturated so the lime pins stand out on the plan.
    { id: "ign-plan", type: "raster", source: "ign", paint: { "raster-saturation": -0.45 } },
  ],
};

function el(html: string, style: string): HTMLElement {
  const node = document.createElement("div");
  node.setAttribute("style", style);
  node.innerHTML = html;
  return node;
}

/** Text typed by people (stop names, vehicle labels, first names) goes into the markup escaped. */
function esc(value: string | null | undefined): string {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** The parking "P" and the stops: a small dark square with the label. */
function squarePin(label: string): HTMLElement {
  return el(
    `<b>${esc(label)}</b>`,
    `display:grid;place-items:center;min-width:34px;height:34px;padding:0 8px;border-radius:8px;background:${CARD};border:1px solid ${LINE};color:${FG};font:700 12px "JetBrains Mono",monospace;box-shadow:0 8px 20px rgba(0,0,0,.18)`,
  );
}

/**
 * A running shuttle (I-C, 06/10/2026): the minibus pictogram turned the way it drives, in a lime pill
 * with its number, and a green (fresh) or amber (stale) dot.
 */
function busPin(index: number, fresh: boolean, trip: LiveTrip, heading: number | null): HTMLElement {
  const n = String(index + 1).padStart(2, "0");
  const colour = SHUTTLE_COLOURS[shuttleTone(trip.direction, true)];
  return el(
    `<span style="position:relative;display:flex;align-items:center;gap:4px;height:34px;padding:0 9px 0 6px;border-radius:999px;background:${YELLOW};border:2px solid ${colour};color:${colour};box-shadow:0 8px 20px rgba(0,0,0,.25)">` +
      `<span style="display:flex;transform:${shuttleTransform(heading) || "none"}">${shuttleSvg(20)}</span>` +
      `<b style="font:700 13px 'JetBrains Mono',monospace;color:${BLACK}">${n}</b></span>` +
      `<i style="position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;border:2px solid #FFFFFF;background:${fresh ? OK : WARN}"></i>`,
    "position:relative;display:grid;place-items:center",
  );
}

function popupHtml(trip: LiveTrip, index: number): string {
  const m = fr.dashboard.map;
  const where = trip.toStop && trip.stop ? m.toStop(trip.stop.name, trip.toStop.etaMinutes) : trip.toParking ? m.toParking(trip.toParking.etaMinutes) : m.noPosition;
  const vehicle = [trip.vehicle.model, trip.vehicle.colour].filter(Boolean).join(" ") || m.shuttle(index + 1);
  const badge = `<span style="display:inline-block;margin-bottom:8px;padding:4px 9px;border-radius:999px;background:#E8F7EC;color:${OK};font:600 11px 'JetBrains Mono',monospace">${m.passengers(trip.passengers)} · ${esc(where)}</span>`;
  return (
    `<div style="min-width:190px;color:${FG};font-family:'JetBrains Mono',monospace">${badge}` +
    `<div style="font:500 16px 'JetBrains Mono',monospace">${esc(vehicle)}</div>` +
    `<div style="font-size:12px;color:${MUTED};padding-bottom:8px;border-bottom:1px dashed ${LINE};margin-bottom:8px">${esc(trip.vehicle.plate)} ${m.direction[trip.direction]}</div>` +
    `<div style="font-size:15px">${esc(trip.driverName)}</div>` +
    `<div style="font-size:12px;color:${MUTED}">${m.since(new Date(trip.startedAt))}</div></div>`
  );
}

function stopLabel(stop: ShuttleStop): string {
  if (stop.kind === "airport") return "T";
  if (stop.kind === "station") return "TGV";
  return stop.name.slice(0, 3).toUpperCase();
}

/**
 * The running shuttles on the plan (P-A, "Flotte" look): the parking and stops as dark squares, one
 * yellow teardrop per trip with a popup card. Loaded lazily (MapLibre is heavy, no place in the tests).
 */
export default function LiveShuttlesMap({ live }: { live: LiveShuttles }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  // I-C: each shuttle's heading from its previous position (the API gives none).
  const headingsRef = useRef(new Map<string, { position: { lat: number; lng: number }; heading: number | null }>());
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
    headingsRef.current = nextHeadings(headingsRef.current, live.trips);
    const markers: Marker[] = [];
    const points: [number, number][] = [];
    if (live.parking.lat !== null && live.parking.lng !== null) {
      markers.push(new Marker({ element: squarePin("P") }).setLngLat([live.parking.lng, live.parking.lat]).addTo(map));
      points.push([live.parking.lng, live.parking.lat]);
    }
    for (const stop of live.stops) {
      markers.push(
        new Marker({ element: squarePin(stopLabel(stop)) })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(new Popup({ closeButton: false, offset: 20, className: "plazo-popup" }).setText(stop.name))
          .addTo(map),
      );
      points.push([stop.lng, stop.lat]);
    }
    live.trips.forEach((trip, index) => {
      if (!trip.position) return;
      const fresh = (trip.positionAgeSeconds ?? 0) <= FRESH_SECONDS;
      markers.push(
        new Marker({ element: busPin(index, fresh, trip, headingsRef.current.get(trip.id)?.heading ?? null), anchor: "bottom" })
          .setLngLat([trip.position.lng, trip.position.lat])
          .setPopup(new Popup({ closeButton: false, offset: 44, className: "plazo-popup" }).setHTML(popupHtml(trip, index)))
          .addTo(map),
      );
      points.push([trip.position.lng, trip.position.lat]);
    });
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
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
      }
    }
  }, [live]);

  // MapLibre's own stylesheet forces `position: relative` on its container, so the container
  // takes the full height explicitly rather than through `inset-0`.
  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} data-testid="live-shuttles-map" className="h-full w-full bg-[#E6E8E4]" />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-muted-foreground">© IGN – Plan IGN</span>
    </div>
  );
}
