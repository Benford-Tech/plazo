import {
  Map as MapLibreMap,
  Marker,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";
import { fr } from "@/lib/fr";
import { ghosts, stopEta, tripLinesGeoJson } from "@/lib/live-map";
import {
  nextHeadings,
  SHUTTLE_COLOURS,
  SHUTTLE_PATH,
  shuttleTone,
  shuttleTransform,
} from "@/lib/shuttle-icon";
import type { LiveShuttles, LiveTrip, ShuttleStop } from "@/lib/types";

/** IGN Géoplateforme "Plan IGN v2" (no key), like the meeting point map. */
const IGN_PLAN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
/** Colours of the "Opérations" mockup (C-B). */
const LIME = "#A3E635";
const LIME_INK = "#0F2A14";
const DEEP = "#1E5E2E";
const CARD = "#FFFFFF";
const LINE = "#E4E6E2";
const FG = "#1A1D1A";
const MUTED = "#6B7280";
const OK = "#16A34A";
const WARN = "#D97706";
const MONO = "'JetBrains Mono',monospace";
/** A position older than this is "stale": amber dot instead of green. */
const FRESH_SECONDS = 90;
const LINES_SOURCE = "plazo-trips";

setWorkerUrl(maplibreWorkerUrl);

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    ign: {
      type: "raster",
      tiles: [IGN_PLAN_TILES],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#E6E8E4" },
    },
    // Slightly desaturated so the lime pins stand out on the plan.
    {
      id: "ign-plan",
      type: "raster",
      source: "ign",
      paint: { "raster-saturation": -0.45 },
    },
  ],
};

const PLANE =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";
const TRAIN =
  "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z";
const PIN =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z";

function el(html: string, style: string): HTMLElement {
  const node = document.createElement("div");
  node.setAttribute("style", style);
  node.innerHTML = html;
  return node;
}

/** Text typed by people (stop names, vehicle labels, first names) goes into the markup escaped. */
function esc(value: string | null | undefined): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
}

function icon(
  path: string,
  size: number,
  colour: string,
  transform = "",
): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${colour}" aria-hidden="true" style="display:block;transform:${transform || "none"}"><path d="${path}"/></svg>`;
}

const SHADOW = "box-shadow:0 8px 20px rgba(0,0,0,.28)";
const PLATE = `position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;padding:4px 10px;border-radius:999px;font:600 12px ${MONO};box-shadow:0 4px 12px rgba(0,0,0,.2)`;

/**
 * Direction B « Halo et trajets » (23/10/2026): the parking is the map's first landmark — a dark green
 * disc with a lime halo that breathes, its name in a lime plate underneath.
 */
function parkingPin(name: string): HTMLElement {
  return el(
    `<span class="plazo-live-halo" aria-hidden="true" style="position:absolute;left:50%;top:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;background:${LIME}"></span>` +
      `<span style="position:relative;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:${DEEP};border:3px solid ${LIME};box-sizing:border-box;color:#FFFFFF;font:700 22px ${MONO};${SHADOW}">P</span>` +
      `<span style="${PLATE};top:30px;background:${LIME};color:${LIME_INK};font-weight:700">${esc(name)}</span>`,
    "position:relative;display:grid;place-items:center;width:52px;height:52px",
  );
}

/** A stop: a white circle with its icon in the colour of the shuttle heading there, and its name (with the ETA when one comes). */
function stopPin(
  stop: ShuttleStop,
  eta: number | null,
  colour: string,
): HTMLElement {
  const path =
    stop.kind === "airport" ? PLANE : stop.kind === "station" ? TRAIN : PIN;
  const plate =
    eta === null
      ? `background:${CARD};border:1px solid ${LINE};color:${FG}`
      : `background:${colour};color:#FFFFFF`;
  const label =
    eta === null
      ? esc(stop.name)
      : esc(fr.dashboard.map.toStop(stop.name, eta));
  return el(
    `<span style="display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:${CARD};border:2px solid ${colour};box-sizing:border-box;box-shadow:0 4px 12px rgba(0,0,0,.16)">${icon(path, 18, colour)}</span>` +
      `<span style="${PLATE};top:22px;${plate}">${label}</span>`,
    "position:relative;display:grid;place-items:center;width:36px;height:36px",
  );
}

/**
 * A running shuttle with a position: a 48 px white circle bordered with its direction's colour, the
 * minibus turned the way it drives, a heading chevron on the rim, and a plate « Karim · 3 pers. » with
 * the green (fresh) or amber (stale) dot.
 */
function busPin(
  trip: LiveTrip,
  fresh: boolean,
  heading: number | null,
): HTMLElement {
  const colour = SHUTTLE_COLOURS[shuttleTone(trip.direction, true)];
  const first = trip.driverName.split(" ")[0];
  const chevron =
    heading === null
      ? ""
      : `<span aria-hidden="true" style="position:absolute;left:50%;top:50%;width:0;height:0;margin:-31px 0 0 -7px;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:11px solid ${colour};transform-origin:7px 31px;transform:rotate(${heading}deg)"></span>`;
  return el(
    `<span style="position:relative;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:${CARD};border:3px solid ${colour};box-sizing:border-box;${SHADOW}">${icon(SHUTTLE_PATH, 26, colour, shuttleTransform(heading))}</span>` +
      chevron +
      `<span style="${PLATE};top:28px;background:${colour};color:#FFFFFF;display:flex;align-items:center;gap:6px">${esc(first)} · ${esc(fr.dashboard.map.persons(trip.passengers))}<i style="width:8px;height:8px;border-radius:50%;background:${fresh ? LIME : WARN};border:1px solid rgba(255,255,255,.7)"></i></span>`,
    "position:relative;display:grid;place-items:center;width:48px;height:48px",
  );
}

/** A running shuttle without a position yet: a dashed grey ghost at the parking, « partie 14:02 · sans position ». */
function ghostPin(trip: LiveTrip): HTMLElement {
  const first = trip.driverName.split(" ")[0];
  const m = fr.dashboard.map;
  return el(
    `<span style="display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:${CARD};border:3px dashed ${MUTED};box-sizing:border-box;box-shadow:0 6px 14px rgba(0,0,0,.18)">${icon(SHUTTLE_PATH, 22, MUTED)}</span>` +
      `<span style="${PLATE};top:24px;background:${CARD};border:1px dashed ${MUTED};color:${MUTED};box-shadow:none">${esc(first)} · ${esc(m.since(new Date(trip.startedAt)))} · ${esc(m.noPositionShort)}</span>`,
    "position:relative;display:grid;place-items:center;width:40px;height:40px",
  );
}

function popupHtml(trip: LiveTrip, index: number): string {
  const m = fr.dashboard.map;
  const where =
    trip.toStop && trip.stop
      ? m.toStop(trip.stop.name, trip.toStop.etaMinutes)
      : trip.toParking
        ? m.toParking(trip.toParking.etaMinutes)
        : m.noPosition;
  const vehicle =
    [trip.vehicle.model, trip.vehicle.colour].filter(Boolean).join(" ") ||
    m.shuttle(index + 1);
  const badge = `<span style="display:inline-block;margin-bottom:8px;padding:4px 9px;border-radius:999px;background:#E8F7EC;color:${OK};font:600 11px ${MONO}">${m.passengers(trip.passengers)} · ${esc(where)}</span>`;
  return (
    `<div style="min-width:190px;color:${FG};font-family:${MONO}">${badge}` +
    `<div style="font:500 16px ${MONO}">${esc(vehicle)}</div>` +
    `<div style="font-size:12px;color:${MUTED};padding-bottom:8px;border-bottom:1px dashed ${LINE};margin-bottom:8px">${esc(trip.vehicle.plate)} ${m.direction[trip.direction]}</div>` +
    `<div style="font-size:15px">${esc(trip.driverName)}</div>` +
    `<div style="font-size:12px;color:${MUTED}">${m.since(new Date(trip.startedAt))}</div></div>`
  );
}

/** The route lines (travelled solid, remaining dotted) on the map's own style, once it is loaded. */
function drawLines(map: MapLibreMap, live: LiveShuttles) {
  const data = tripLinesGeoJson(live);
  const source = map.getSource(LINES_SOURCE) as GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(LINES_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: `${LINES_SOURCE}-left`,
    type: "line",
    source: LINES_SOURCE,
    filter: ["==", ["get", "part"], "left"],
    layout: { "line-cap": "round" },
    paint: {
      "line-color": ["get", "colour"],
      "line-width": 3,
      "line-opacity": 0.6,
      "line-dasharray": [0.1, 2],
    },
  });
  map.addLayer({
    id: `${LINES_SOURCE}-done`,
    type: "line",
    source: LINES_SOURCE,
    filter: ["==", ["get", "part"], "done"],
    layout: { "line-cap": "round" },
    paint: { "line-color": ["get", "colour"], "line-width": 4 },
  });
}

/** The colour of the shuttle heading to a stop (its direction), dark green when none is. */
function stopColour(live: LiveShuttles, stop: ShuttleStop): string {
  const trip = live.trips.find(
    (t) =>
      t.position &&
      t.stop &&
      t.stop.id === stop.id &&
      t.stop.name === stop.name,
  );
  return trip ? SHUTTLE_COLOURS[shuttleTone(trip.direction, true)] : DEEP;
}

/**
 * The running shuttles on the plan (P-A, then direction B « Halo et trajets » of 23/10/2026): the
 * parking as the landmark, each trip's route in two pieces, one bus per positioned trip with a popup
 * card, and a grey ghost at the parking for a trip without a position. Loaded lazily (MapLibre is
 * heavy, no place in the tests).
 */
export default function LiveShuttlesMap({ live }: { live: LiveShuttles }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const liveRef = useRef(live);
  const loadedRef = useRef(false);
  // I-C: each shuttle's heading from its previous position (the API gives none).
  const headingsRef = useRef(
    new Map<
      string,
      { position: { lat: number; lng: number }; heading: number | null }
    >(),
  );
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
    map.once("load", () => {
      loadedRef.current = true;
      drawLines(map, liveRef.current);
    });
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // Created once; the pins follow `live` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    liveRef.current = live;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    headingsRef.current = nextHeadings(headingsRef.current, live.trips);
    const markers: Marker[] = [];
    const points: [number, number][] = [];
    const parkingAt: [number, number] | null =
      live.parking.lat !== null && live.parking.lng !== null
        ? [live.parking.lng, live.parking.lat]
        : null;
    for (const stop of live.stops) {
      markers.push(
        new Marker({
          element: stopPin(stop, stopEta(live, stop), stopColour(live, stop)),
        })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(
            new Popup({
              closeButton: false,
              offset: 24,
              className: "plazo-popup",
            }).setText(stop.instructions || stop.name),
          )
          .addTo(map),
      );
      points.push([stop.lng, stop.lat]);
    }
    if (parkingAt) {
      markers.push(
        new Marker({ element: parkingPin(live.parking.name) })
          .setLngLat(parkingAt)
          .addTo(map),
      );
      points.push(parkingAt);
      ghosts(live.trips).forEach((trip, index) => {
        markers.push(
          // Beside the parking, each one a step further right, above the parking's name plate.
          new Marker({
            element: ghostPin(trip),
            offset: [50 + index * 46, -30],
          })
            .setLngLat(parkingAt)
            .setPopup(
              new Popup({
                closeButton: false,
                offset: 24,
                className: "plazo-popup",
              }).setHTML(popupHtml(trip, live.trips.indexOf(trip))),
            )
            .addTo(map),
        );
      });
    }
    live.trips.forEach((trip, index) => {
      if (!trip.position) return;
      const fresh = (trip.positionAgeSeconds ?? 0) <= FRESH_SECONDS;
      markers.push(
        new Marker({
          element: busPin(
            trip,
            fresh,
            headingsRef.current.get(trip.id)?.heading ?? null,
          ),
        })
          .setLngLat([trip.position.lng, trip.position.lat])
          .setPopup(
            new Popup({
              closeButton: false,
              offset: 30,
              className: "plazo-popup",
            }).setHTML(popupHtml(trip, index)),
          )
          .addTo(map),
      );
      points.push([trip.position.lng, trip.position.lat]);
    });
    markersRef.current = markers;
    if (loadedRef.current) drawLines(map, live);
    // Frame everything once (then the user keeps control of the view).
    if (!fittedRef.current && points.length > 0) {
      fittedRef.current = true;
      if (points.length === 1) map.jumpTo({ center: points[0], zoom: 13 });
      else {
        const lngs = points.map((p) => p[0]);
        const lats = points.map((p) => p[1]);
        const bounds: LngLatBoundsLike = [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ];
        map.fitBounds(bounds, {
          padding: { top: 56, bottom: 72, left: 72, right: 96 },
          maxZoom: 14,
          duration: 0,
        });
      }
    }
  }, [live]);

  // MapLibre's own stylesheet forces `position: relative` on its container, so the container
  // takes the full height explicitly rather than through `inset-0`.
  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        data-testid="live-shuttles-map"
        className="h-full w-full bg-[#E6E8E4]"
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-muted-foreground">
        © IGN – Plan IGN
      </span>
    </div>
  );
}
