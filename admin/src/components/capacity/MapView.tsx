import { Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type LayerSpecification, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre loads its worker next to its own module, a file the bundler does not emit: Vite
// bundles the worker (with the chunk it shares with the main module) and gives its URL.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TerraDraw, TerraDrawLineStringMode, TerraDrawPointMode, TerraDrawPolygonMode, TerraDrawSelectMode, type GeoJSONStoreFeatures } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { DEFAULT_CENTER, IGN_ATTRIBUTION, IGN_ORTHO_MAX_ZOOM, IGN_ORTHO_TILES } from "@/lib/capacity/ign";
import type { GeoLineString, GeoPoint, GeoPolygon, LonLat } from "@/lib/capacity/types";
import { cn } from "@/lib/utils";

export type FeatureCollection = { type: "FeatureCollection"; features: { type: "Feature"; geometry: unknown; properties?: Record<string, unknown> }[] };

export interface MapLayer {
  id: string;
  type: "fill" | "line" | "circle";
  data: FeatureCollection;
  paint: Record<string, unknown>;
}

export interface MapLabel {
  id: string;
  lngLat: LonLat;
  text: string;
  variant: "zone" | "length" | "vertex";
}

export type DrawKind = "polygon" | "linestring" | "point";

export interface MapViewHandle {
  flyTo(center: LonLat, zoom?: number): void;
  fitTo(bounds: [LonLat, LonLat]): void;
  project(p: LonLat): { x: number; y: number } | null;
  getBounds(): [number, number, number, number] | null;
}

interface Props {
  layers: MapLayer[];
  labels?: MapLabel[];
  showPhoto?: boolean;
  /** Fitted once, when the map is created. */
  initialBounds?: [LonLat, LonLat] | null;
  /** Polygon whose vertices can be dragged (Terra Draw select mode), with midpoints when `midpoints`. */
  editPolygon?: GeoPolygon | null;
  midpoints?: boolean;
  onEditPolygon?: (polygon: GeoPolygon) => void;
  /** Active drawing tool, or null. */
  drawMode?: DrawKind | null;
  onDrawn?: (geometry: GeoPolygon | GeoLineString | GeoPoint) => void;
  onMapClick?: (lngLat: LonLat, point: { x: number; y: number }) => void;
  onViewChange?: (bbox: [number, number, number, number], zoom: number) => void;
  cursor?: string;
  className?: string;
  children?: React.ReactNode;
}

const YELLOW = "#A3E635";

setWorkerUrl(maplibreWorkerUrl);

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    ign: { type: "raster", tiles: [IGN_ORTHO_TILES], tileSize: 256, maxzoom: IGN_ORTHO_MAX_ZOOM },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#1d1f1a" } },
    { id: "ign-ortho", type: "raster", source: "ign" },
  ],
};

const round = (n: number) => Math.round(n * 1e8) / 1e8;
const roundPolygon = (p: GeoPolygon): GeoPolygon => ({ type: "Polygon", coordinates: p.coordinates.map(r => r.map(([x, y]) => [round(x), round(y)] as LonLat)) });

/**
 * Map of the capacity estimator: IGN BD ORTHO aerial photo (MapLibre GL, raster tiles), read-only
 * GeoJSON overlays, HTML labels and Terra Draw for drawing and editing shapes.
 */
export const MapView = forwardRef<MapViewHandle, Props>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const readyRef = useRef(false);
  const editIdRef = useRef<string | null>(null);
  const lastEmittedRef = useRef<string>("");
  const markersRef = useRef<Marker[]>([]);
  const appliedLayersRef = useRef<Map<string, string>>(new Map());
  const propsRef = useRef(props);
  propsRef.current = props;

  useImperativeHandle(ref, () => ({
    flyTo: (center, zoom = 18) => mapRef.current?.flyTo({ center, zoom, duration: 800 }),
    fitTo: bounds => mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: 19, duration: 0 }),
    project: p => (mapRef.current ? mapRef.current.project(p) : null),
    getBounds: () => {
      const b = mapRef.current?.getBounds();
      return b ? [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] : null;
    },
  }));

  // Create the map and Terra Draw once.
  useEffect(() => {
    if (!containerRef.current) return;
    const applied = appliedLayersRef.current;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE,
      center: DEFAULT_CENTER,
      zoom: 15,
      maxZoom: 21,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      // Screenshots of the map (end-to-end checks) need the drawing buffer.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    // Development aid for end-to-end checks.
    if (import.meta.env.DEV) (window as unknown as { __capacityMap?: MapLibreMap }).__capacityMap = map;
    if (propsRef.current.initialBounds) map.fitBounds(propsRef.current.initialBounds, { padding: 60, maxZoom: 19, duration: 0 });

    const emitView = () => {
      const b = map.getBounds();
      propsRef.current.onViewChange?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], map.getZoom());
    };

    // "style.load", not "load": "load" waits for every tile, and one tile the IGN fails to serve
    // would leave the map without its overlays and drawing tools.
    map.once("style.load", () => {
      const adapter = new TerraDrawMapLibreGLAdapter({ map, coordinatePrecision: 9 });
      const point = { pointColor: YELLOW, pointOutlineColor: "#0F2A14", pointWidth: 6, pointOutlineWidth: 2 } as const;
      const draw = new TerraDraw({
        adapter,
        modes: [
          new TerraDrawSelectMode({
            allowManualDeselection: false,
            flags: {
              polygon: { feature: { draggable: false, coordinates: { midpoints: true, draggable: true, deletable: false } } },
            },
            styles: {
              selectedPolygonColor: YELLOW,
              selectedPolygonFillOpacity: 0.08,
              selectedPolygonOutlineColor: YELLOW,
              selectedPolygonOutlineWidth: 3,
              selectionPointColor: YELLOW,
              selectionPointOutlineColor: "#0F2A14",
              selectionPointWidth: 6,
              selectionPointOutlineWidth: 2,
              midPointColor: "#F3F3F0",
              midPointOutlineColor: "#0F2A14",
              midPointWidth: 4,
            },
          }),
          new TerraDrawPolygonMode({
            styles: { fillColor: YELLOW, fillOpacity: 0.15, outlineColor: YELLOW, outlineWidth: 3, closingPointColor: YELLOW, closingPointOutlineColor: "#0F2A14" },
          }),
          new TerraDrawLineStringMode({ styles: { lineStringColor: "#5fd3ff", lineStringWidth: 4, closingPointColor: "#5fd3ff" } }),
          new TerraDrawPointMode({ styles: point }),
        ],
      });
      draw.start();
      draw.setMode("static");
      drawRef.current = draw;

      draw.on("finish", (id, context) => {
        const feature = draw.getSnapshotFeature(id);
        if (!feature) return;
        if (context.action === "draw") {
          draw.removeFeatures([id]);
          propsRef.current.onDrawn?.(feature.geometry as GeoPolygon | GeoLineString | GeoPoint);
          return;
        }
        if (id === editIdRef.current && feature.geometry.type === "Polygon") {
          const polygon = { type: "Polygon", coordinates: feature.geometry.coordinates } as GeoPolygon;
          lastEmittedRef.current = JSON.stringify(roundPolygon(polygon));
          propsRef.current.onEditPolygon?.(polygon);
        }
      });

      readyRef.current = true;
      syncLayers();
      syncDraw();
      emitView();
    });

    map.on("moveend", emitView);
    map.on("click", e => {
      const draw = drawRef.current;
      if (draw && draw.getMode() !== "static" && draw.getMode() !== "select") return;
      propsRef.current.onMapClick?.([e.lngLat.lng, e.lngLat.lat], { x: e.point.x, y: e.point.y });
    });

    return () => {
      readyRef.current = false;
      try {
        drawRef.current?.stop();
      } catch {
        // The map may already be gone.
      }
      drawRef.current = null;
      map.remove();
      mapRef.current = null;
      applied.clear();
    };
  }, []);

  /** Adds, updates and removes the overlay layers, below Terra Draw's own layers. */
  function syncLayers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const wanted = propsRef.current.layers;
    const applied = appliedLayersRef.current;
    const firstDrawLayer = map.getStyle().layers.find(l => l.id.startsWith("td-"))?.id;
    for (const [id] of applied) {
      if (!wanted.some(l => l.id === id)) {
        if (map.getLayer(`ov-${id}`)) map.removeLayer(`ov-${id}`);
        if (map.getSource(`ov-${id}`)) map.removeSource(`ov-${id}`);
        applied.delete(id);
      }
    }
    for (const layer of wanted) {
      const sourceId = `ov-${layer.id}`;
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (source) source.setData(layer.data as never);
      else map.addSource(sourceId, { type: "geojson", data: layer.data as never });
      const paintKey = `${layer.type}:${JSON.stringify(layer.paint)}`;
      if (applied.get(layer.id) !== paintKey) {
        if (map.getLayer(sourceId)) map.removeLayer(sourceId);
        map.addLayer({ id: sourceId, type: layer.type, source: sourceId, paint: layer.paint } as LayerSpecification, firstDrawLayer);
        applied.set(layer.id, paintKey);
      }
    }
    // Keep the overlays in the order given.
    for (const layer of wanted) if (map.getLayer(`ov-${layer.id}`)) map.moveLayer(`ov-${layer.id}`, firstDrawLayer);
  }

  /** Puts Terra Draw in the right mode with the editable polygon. */
  function syncDraw() {
    const draw = drawRef.current;
    if (!draw || !readyRef.current) return;
    const { drawMode, editPolygon, midpoints } = propsRef.current;
    if (drawMode) {
      if (editIdRef.current) {
        draw.clear();
        editIdRef.current = null;
        lastEmittedRef.current = "";
      }
      if (draw.getMode() !== drawMode) draw.setMode(drawMode);
      return;
    }
    if (!editPolygon) {
      if (editIdRef.current || draw.getSnapshot().length) draw.clear();
      editIdRef.current = null;
      lastEmittedRef.current = "";
      if (draw.getMode() !== "static") draw.setMode("static");
      return;
    }
    const polygon = roundPolygon(editPolygon);
    const key = JSON.stringify(polygon);
    draw.updateModeOptions<typeof TerraDrawSelectMode>("select", {
      flags: { polygon: { feature: { draggable: false, coordinates: { midpoints: !!midpoints, draggable: true, deletable: false } } } },
    });
    if (draw.getMode() !== "select") draw.setMode("select");
    if (key === lastEmittedRef.current && editIdRef.current && draw.hasFeature(editIdRef.current)) return;
    draw.clear();
    const id = draw.getFeatureId() as string;
    const feature = { id, type: "Feature", geometry: polygon, properties: { mode: "polygon" } } as GeoJSONStoreFeatures;
    const [result] = draw.addFeatures([feature]);
    if (result && !result.valid) {
      editIdRef.current = null;
      return;
    }
    editIdRef.current = id;
    lastEmittedRef.current = key;
    draw.selectFeature(id);
  }

  useEffect(syncLayers, [props.layers]);
  useEffect(syncDraw, [props.drawMode, props.editPolygon, props.midpoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => map.getLayer("ign-ortho") && map.setLayoutProperty("ign-ortho", "visibility", props.showPhoto === false ? "none" : "visible");
    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
  }, [props.showPhoto]);

  // HTML labels (no glyph server needed).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = (props.labels ?? []).map(label => {
      const el = document.createElement("div");
      el.className = `cap-label cap-label-${label.variant}`;
      el.textContent = label.text;
      return new Marker({ element: el, offset: label.variant === "vertex" ? [0, -16] : [0, 0] }).setLngLat(label.lngLat).addTo(map);
    });
  }, [props.labels]);

  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = props.cursor ?? "";
  }, [props.cursor]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#E6E8E4]", props.className)}>
      {/* Inline: maplibre-gl.css gives the container "position: relative". */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} data-testid="capacity-map" />
      {props.children}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-white/80 px-2.5 py-1 text-[13px] text-muted-foreground">{IGN_ATTRIBUTION}</div>
    </div>
  );
});
