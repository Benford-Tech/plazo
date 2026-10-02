"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { fr } from "@/lib/fr";
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

const PILL = "rounded-[14px] border px-2.5 py-[5px] text-sm font-bold whitespace-nowrap shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)] transition-transform";
const BOOKABLE = "border-accent bg-accent text-white data-[active=true]:border-prune data-[active=true]:bg-prune";
const UNAVAILABLE = "border-line bg-white text-soft data-[active=true]:border-prune data-[active=true]:text-ink";

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
export default function ResultsMap({ airport, parkings }: { airport: { name: string; location: LatLng | null }; parkings: MapParking[] }) {
  const container = useRef<HTMLDivElement>(null);
  // Rendered in the browser only (dynamic import without SSR): WebGL can be checked right away.
  const [failed, setFailed] = useState(() => !hasWebGL());
  const key = JSON.stringify(parkings) + JSON.stringify(airport.location);

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
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const markers = new Map<string, HTMLElement>();
    const added: maplibregl.Marker[] = [];

    if (airport.location) {
      const terminals = document.createElement("div");
      terminals.className = "rounded-2xl bg-prune px-3 py-[7px] text-sm font-bold whitespace-nowrap text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)]";
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
      pill.dataset.active = "false";
      pill.addEventListener("mouseenter", () => highlight(markers, p.slug));
      pill.addEventListener("focus", () => highlight(markers, p.slug));
      pill.addEventListener("mouseleave", () => highlight(markers, null));
      pill.addEventListener("blur", () => highlight(markers, null));
      pill.addEventListener("click", event => {
        event.stopPropagation();
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
      map.fitBounds(bounds, { padding: { top: 70, bottom: 50, left: 60, right: 60 }, maxZoom: 15, duration: 0 });
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
      if (from && from !== to) highlight(markers, to?.dataset.resultSlug ?? null);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusout", onOut);

    return () => {
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

  if (failed) {
    return <div className="flex h-full items-center justify-center bg-tint p-6 text-center text-soft">{fr.map.failed}</div>;
  }
  return <div ref={container} role="region" aria-label={fr.map.title} className="h-full w-full" />;
}
