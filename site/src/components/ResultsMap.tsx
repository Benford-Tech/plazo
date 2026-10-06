"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { fr } from "@/lib/fr";
import { shuttleMarkerHtml, type ShuttleTone } from "@/lib/shuttle-icon";
import type { LatLng } from "@/lib/types";

/** IGN Géoplateforme "Plan IGN v2" raster tiles (WMTS, Web Mercator): open licence, no key. */
export const PLAN_IGN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png";

export interface MapParking {
  slug: string;
  title: string;
  /** "45 €", "Complet"… */
  label: string;
  bookable: boolean;
  location: LatLng;
}

/** A shuttle on the road (K-A): where it is, where it goes and whose it is — nothing else. */
export interface MapShuttle {
  id: string;
  /** "Navette de Parking Soleil · vers le terminal" */
  title: string;
  position: LatLng;
  /** "position il y a 12 s", when known. */
  age: string | null;
  /** I-C: the direction gives the colour, the heading turns the bus. */
  tone: ShuttleTone;
  heading: number | null;
}

function shuttleElement(shuttle: MapShuttle): HTMLElement {
  const el = document.createElement("div");
  el.className = "relative flex size-[38px] items-center justify-center";
  el.setAttribute("role", "img");
  el.dataset.shuttle = shuttle.id;
  el.dataset.look = `${shuttle.tone}:${shuttle.heading ?? ""}`;
  el.innerHTML = shuttleMarkerHtml(shuttle.tone, shuttle.heading);
  return el;
}

/** One marker per shuttle: added, moved, redrawn when it turns, or dropped — the map is never rebuilt for them. */
function syncShuttles(map: maplibregl.Map, current: Map<string, maplibregl.Marker>, list: MapShuttle[]) {
  const seen = new Set<string>();
  for (const s of list) {
    seen.add(s.id);
    const label = s.age ? `${s.title} · ${s.age}` : s.title;
    const existing = current.get(s.id);
    if (existing) {
      existing.setLngLat([s.position.lng, s.position.lat]);
      const el = existing.getElement();
      const look = `${s.tone}:${s.heading ?? ""}`;
      if (el.dataset.look !== look) {
        el.dataset.look = look;
        el.innerHTML = shuttleMarkerHtml(s.tone, s.heading);
      }
      el.setAttribute("aria-label", label);
      el.title = label;
      continue;
    }
    const el = shuttleElement(s);
    el.setAttribute("aria-label", label);
    el.title = label;
    current.set(s.id, new maplibregl.Marker({ element: el }).setLngLat([s.position.lng, s.position.lat]).addTo(map));
  }
  current.forEach((marker, id) => {
    if (seen.has(id)) return;
    marker.remove();
    current.delete(id);
  });
}

const PILL = "rounded-[14px] border px-2.5 py-[5px] text-sm font-bold whitespace-nowrap shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)] transition-transform";
const BOOKABLE = "border-accent bg-accent text-white data-[active=true]:border-dark data-[active=true]:bg-dark";
const UNAVAILABLE = "border-line bg-white text-soft data-[active=true]:border-dark data-[active=true]:text-ink";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Highlights one parking on the map and in the list (data-map-active on its card), or none. */
function highlight(markers: Map<string, HTMLElement>, slug: string | null) {
  markers.forEach((el, s) => {
    const on = s === slug;
    el.dataset.active = String(on);
    el.style.transform = on ? "scale(1.12)" : "";
    if (el.parentElement) el.parentElement.style.zIndex = on ? "2" : "";
  });
  document.querySelectorAll<HTMLElement>("[data-result-slug]").forEach(card => {
    card.toggleAttribute("data-map-active", card.dataset.resultSlug === slug);
  });
}

/**
 * Map of the results (MapLibre GL on the IGN plan): the terminals and each parking as a price pill.
 * Hovering or focusing a card highlights its pill and the other way round; a click on a pill brings
 * its card into view and focuses it. Loaded only when the traveller shows the map.
 */
export default function ResultsMap({
  airport,
  parkings,
  controls = true,
  controlsPosition = "top-right",
  padding = { top: 70, bottom: 50, left: 60, right: 60 },
  shuttles,
  selected = null,
  onSelect,
}: {
  airport: { name: string; location: LatLng | null };
  parkings: MapParking[];
  /** The zoom buttons (off on the home's hero map, whose corners hold the pills). */
  controls?: boolean;
  controlsPosition?: "top-right" | "bottom-right";
  /** Room kept around the pins when framing them (the home's orange card sits at the bottom). */
  padding?: { top: number; bottom: number; left: number; right: number };
  /** K-A: the shuttles on the road, moved in place on every poll (the map is not rebuilt). */
  shuttles?: MapShuttle[];
  /** K-A: the parking whose pill stays highlighted (the home's orange card). */
  selected?: string | null;
  /** K-A: a click on a pill selects it (instead of scrolling to its card in the list). */
  onSelect?: (slug: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  // Rendered in the browser only (dynamic import without SSR): WebGL can be checked right away.
  const [failed, setFailed] = useState(() => !hasWebGL());
  const key = JSON.stringify(parkings) + JSON.stringify(airport.location);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pillsRef = useRef<Map<string, HTMLElement>>(new Map());
  const selectedRef = useRef<string | null>(selected);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const shuttleMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const shuttlesRef = useRef<MapShuttle[]>(shuttles ?? []);

  useEffect(() => {
    const el = container.current;
    if (!el || failed) return;
    const points = [...(airport.location ? [airport.location] : []), ...parkings.map(p => p.location)];
    const center = points[0] ?? { lat: 45.7256, lng: 5.0811 };
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: {
          version: 8,
          sources: {
            plan: { type: "raster", tiles: [PLAN_IGN_TILES], tileSize: 256, maxzoom: 19, attribution: fr.map.attribution },
          },
          layers: [{ id: "plan", type: "raster", source: "plan" }],
        },
        center: [center.lng, center.lat],
        zoom: 12,
        maxZoom: 18,
        attributionControl: { compact: false },
        // On phones the map sits above the list: one finger scrolls the page, two move the map.
        cooperativeGestures: coarse,
        dragRotate: false,
        pitchWithRotate: false,
        locale: fr.map.controls,
      });
    } catch {
      void Promise.resolve().then(() => setFailed(true));
      return;
    }
    // A tile that fails to load stays blank: nothing to report to the traveller (or the console).
    map.on("error", () => {});
    map.touchZoomRotate.disableRotation();
    if (controls) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), controlsPosition);
    mapRef.current = map;

    const markers = new Map<string, HTMLElement>();
    pillsRef.current = markers;
    const added: maplibregl.Marker[] = [];
    // Leaving a pill or a card falls back to the selected parking, not to nothing.
    const rest = () => highlight(markers, selectedRef.current);

    if (airport.location) {
      const terminals = document.createElement("div");
      terminals.className = "rounded-2xl bg-dark px-3 py-[7px] text-sm font-bold whitespace-nowrap text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)]";
      terminals.textContent = `✈ ${fr.map.terminals}`;
      terminals.title = airport.name;
      added.push(new maplibregl.Marker({ element: terminals }).setLngLat([airport.location.lng, airport.location.lat]).addTo(map));
    }

    for (const p of parkings) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `${PILL} ${p.bookable ? BOOKABLE : UNAVAILABLE} cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent`;
      pill.textContent = p.label;
      pill.setAttribute("aria-label", fr.map.marker(p.title, p.label));
      pill.dataset.active = String(p.slug === selectedRef.current);
      pill.addEventListener("mouseenter", () => highlight(markers, p.slug));
      pill.addEventListener("focus", () => highlight(markers, p.slug));
      pill.addEventListener("mouseleave", rest);
      pill.addEventListener("blur", rest);
      pill.addEventListener("click", event => {
        event.stopPropagation();
        if (onSelectRef.current) {
          onSelectRef.current(p.slug);
          return;
        }
        const card = document.getElementById(`resultat-${p.slug}`);
        if (!card) return;
        card.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        card.focus({ preventScroll: true });
        highlight(markers, p.slug);
      });
      markers.set(p.slug, pill);
      // MapLibre positions the marker's element with a transform: the pill scales inside a wrapper.
      const wrapper = document.createElement("div");
      wrapper.appendChild(pill);
      added.push(new maplibregl.Marker({ element: wrapper }).setLngLat([p.location.lng, p.location.lat]).addTo(map));
    }

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach(pt => bounds.extend([pt.lng, pt.lat]));
      map.fitBounds(bounds, { padding, maxZoom: 15, duration: 0 });
    } else if (points.length === 1) {
      map.setZoom(13);
    }

    // Cards of the list -> pills of the map.
    const cardOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>("[data-result-slug]") : null);
    const onOver = (event: Event) => {
      const card = cardOf(event.target);
      if (card) highlight(markers, card.dataset.resultSlug ?? null);
    };
    const onOut = (event: Event) => {
      const from = cardOf(event.target);
      const to = cardOf((event as MouseEvent | FocusEvent).relatedTarget);
      if (from && from !== to) highlight(markers, to?.dataset.resultSlug ?? selectedRef.current);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusout", onOut);
    if (selectedRef.current) highlight(markers, selectedRef.current);
    const shuttleStore = shuttleMarkers.current;
    syncShuttles(map, shuttleStore, shuttlesRef.current);

    return () => {
      shuttleStore.forEach(m => m.remove());
      shuttleStore.clear();
      mapRef.current = null;
      pillsRef.current = new Map();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusout", onOut);
      highlight(markers, null);
      added.forEach(m => m.remove());
      map.remove();
    };
    // `key` stands for the airport and the parkings (new objects on every render of the page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // The selected pill (the home's orange card) stays dark; hovering another one is temporary.
  useEffect(() => {
    selectedRef.current = selected;
    if (pillsRef.current.size) highlight(pillsRef.current, selected);
  }, [selected]);

  // K-A: the shuttles move in place; one marker per trip, added, moved or dropped on every poll.
  const shuttlesKey = JSON.stringify(shuttles ?? []);
  useEffect(() => {
    shuttlesRef.current = JSON.parse(shuttlesKey);
    if (mapRef.current) syncShuttles(mapRef.current, shuttleMarkers.current, shuttlesRef.current);
  }, [shuttlesKey]);

  if (failed) {
    return <div className="flex h-full items-center justify-center bg-tint p-6 text-center text-soft">{fr.map.failed}</div>;
  }
  return <div ref={container} role="region" aria-label={fr.map.title} className="h-full w-full" />;
}
