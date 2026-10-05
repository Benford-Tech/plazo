import { Map as MapLibreMap, Marker, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";

/** IGN Géoplateforme "Plan IGN v2" (no key): a plan is easier to read than the aerial photo to find a terminal door. */
const IGN_PLAN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
const YELLOW = "#A3E635";

setWorkerUrl(maplibreWorkerUrl);

const STYLE: StyleSpecification = {
  version: 8,
  sources: { ign: { type: "raster", tiles: [IGN_PLAN_TILES], tileSize: 256, maxzoom: 19 } },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#E6E8E4" } },
    { id: "ign-plan", type: "raster", source: "ign" },
  ],
};

type Props = {
  /** The point, or null: the map then shows `center`. */
  point: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  onPick: (point: { lat: number; lng: number }) => void;
  /** Moves the view there (an address search result). */
  flyTo?: { lat: number; lng: number; zoom?: number; key: number } | null;
};

/**
 * Pick the return meeting point on a map: a click places the marker, dragging it moves it. Loaded
 * lazily (MapLibre is heavy and has no place in the unit tests).
 */
export default function MeetingPointMap({ point, center, onPick, flyTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE,
      center: [point?.lng ?? center.lng, point?.lat ?? center.lat],
      zoom: point ? 16 : 14,
      maxZoom: 19,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.touchZoomRotate.disableRotation();
    map.on("click", e => onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    mapRef.current = map;
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; the point and the view are updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!point) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = new Marker({ color: YELLOW, draggable: true }).setLngLat([point.lng, point.lat]).addTo(map);
      marker.on("dragend", () => {
        const at = marker.getLngLat();
        onPickRef.current({ lat: at.lat, lng: at.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([point.lng, point.lat]);
    }
  }, [point]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom ?? 16, duration: 600 });
  }, [flyTo]);

  return (
    <div className="relative">
      <div ref={containerRef} data-testid="meeting-point-map" className="h-72 w-full border border-border bg-[#E6E8E4]" />
      <span className="pointer-events-none absolute bottom-1 right-1 bg-white/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">© IGN – Plan IGN</span>
    </div>
  );
}
