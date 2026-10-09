import { Map as MapLibreMap, Marker, setWorkerUrl, type ExpressionSpecification, type GeoJSONSource, type LayerSpecification, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre loads its worker next to its own module, a file the bundler does not emit: Vite
// bundles the worker (with the chunk it shares with the main module) and gives its URL.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TerraDraw, TerraDrawLineStringMode, TerraDrawPointMode, TerraDrawPolygonMode, TerraDrawSelectMode, type GeoJSONStoreFeatures } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { DEFAULT_CENTER, IGN_ATTRIBUTION, IGN_ORTHO_MAX_ZOOM, IGN_ORTHO_TILES } from "@/lib/capacity/ign";
import { snapToRings } from "@/lib/capacity/snap";
import type { GeoLineString, GeoPoint, GeoPolygon, LonLat } from "@/lib/capacity/types";
import { cn } from "@/lib/utils";

export type FeatureCollection = { type: "FeatureCollection"; features: { type: "Feature"; geometry: unknown; properties?: Record<string, unknown> }[] };

export interface MapLayer {
  id: string;
  type: "fill" | "line" | "circle" | "symbol";
  data: FeatureCollection;
  paint: Record<string, unknown>;
  /** Layout properties (symbol layers: the icon, its size and rotation). */
  layout?: Record<string, unknown>;
}

export interface MapLabel {
  id: string;
  lngLat: LonLat;
  /** Lines separated by "\n" (the "spot" variant shows them stacked). */
  text: string;
  variant: "zone" | "length" | "vertex" | "spot" | "address";
  /** Hidden below this zoom (the "spot" labels only read once the map is close enough). */
  minZoom?: number;
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
  /** SVG icons by name, for symbol layers (`icon-image`); drawn at 2× for sharpness. */
  icons?: Record<string, string>;
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
  /** Rings the pointer snaps to while drawing (T-A): a vertex within 12 px, else an edge within 8 px. */
  snapTo?: LonLat[][];
  /** P-A: the brush. While set, dragging paints a stroke of `widthM` metres instead of panning. */
  paint?: { widthM: number; mode: "paint" | "erase" } | null;
  /** The points of a finished stroke, in map order. */
  onPaintStroke?: (points: LonLat[]) => void;
  onMapClick?: (lngLat: LonLat, point: { x: number; y: number }) => void;
  onViewChange?: (bbox: [number, number, number, number], zoom: number) => void;
  cursor?: string;
  className?: string;
  children?: React.ReactNode;
}

const YELLOW = "#A3E635";
/** A map pin, citron with a dark green outline, its tip at the bottom centre. */
const ADDRESS_PIN =
  '<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25z" fill="#A3E635" stroke="#0F2A14" stroke-width="2.5" stroke-linejoin="round"/><circle cx="15" cy="14" r="5" fill="#0F2A14"/></svg>';
const ERASER = "#DC2626";
/** Metres per pixel at zoom 0 on the equator (Web Mercator, 512 px tiles). */
const METRES_PER_PIXEL_Z0 = 78271.517;

/** A MapLibre expression giving `metres` on the ground in pixels at every zoom, at latitude `lat`. */
function metresToPixels(metres: number, lat: number): ExpressionSpecification {
  const px0 = metres / (METRES_PER_PIXEL_Z0 * Math.cos((lat * Math.PI) / 180));
  return ["interpolate", ["exponential", 2], ["zoom"], 0, px0, 24, px0 * 2 ** 24];
}

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
  const markersRef = useRef<{ marker: Marker; minZoom: number }[]>([]);
  const appliedLayersRef = useRef<Map<string, string>>(new Map());
  const iconsRef = useRef<Set<string>>(new Set());
  const propsRef = useRef(props);
  propsRef.current = props;
  const strokeRef = useRef<LonLat[] | null>(null);

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
            snapping: { toCustom: (event, context) => snapToRings(propsRef.current.snapTo, event, context) },
            styles: {
              fillColor: YELLOW,
              fillOpacity: 0.15,
              outlineColor: YELLOW,
              outlineWidth: 3,
              closingPointColor: YELLOW,
              closingPointOutlineColor: "#0F2A14",
              snappingPointColor: "#F3F3F0",
              snappingPointOutlineColor: "#0F2A14",
              snappingPointWidth: 6,
              snappingPointOutlineWidth: 2,
            },
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

      map.addSource("paint", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "paint-stroke",
        type: "line",
        source: "paint",
        filter: ["==", ["get", "kind"], "stroke"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": YELLOW, "line-opacity": 0.55, "line-width": 1 },
      });
      map.addLayer({
        id: "paint-cursor",
        type: "circle",
        source: "paint",
        filter: ["==", ["get", "kind"], "cursor"],
        paint: { "circle-radius": 1, "circle-color": YELLOW, "circle-opacity": 0.25, "circle-stroke-color": YELLOW, "circle-stroke-width": 2 },
      });
      readyRef.current = true;
      syncIcons();
      syncLayers();
      syncDraw();
      syncPaint();
      emitView();
    });

    map.on("moveend", emitView);
    map.on("zoom", () => {
      const zoom = map.getZoom();
      for (const { marker, minZoom } of markersRef.current) marker.getElement().style.display = zoom >= minZoom ? "" : "none";
    });
    map.on("click", e => {
      const draw = drawRef.current;
      if (draw && draw.getMode() !== "static" && draw.getMode() !== "select") return;
      if (propsRef.current.paint) return;
      propsRef.current.onMapClick?.([e.lngLat.lng, e.lngLat.lat], { x: e.point.x, y: e.point.y });
    });

    // P-A: the brush. Pressing starts a stroke (the map does not pan), moving extends it, releasing
    // hands it over; the cursor ring follows the pointer at the brush's real width.
    const setStrokeData = (points: LonLat[] | null, cursor: LonLat | null) => {
      const source = map.getSource("paint") as GeoJSONSource | undefined;
      if (!source) return;
      source.setData({
        type: "FeatureCollection",
        features: [
          ...(points && points.length ? [{ type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: points.length > 1 ? points : [points[0], points[0]] }, properties: { kind: "stroke" } }] : []),
          ...(cursor ? [{ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: cursor }, properties: { kind: "cursor" } }] : []),
        ],
      });
    };
    const start = (e: { lngLat: { lng: number; lat: number }; preventDefault(): void }) => {
      if (!propsRef.current.paint) return;
      e.preventDefault();
      strokeRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      setStrokeData(strokeRef.current, strokeRef.current[0]);
    };
    const move = (e: { lngLat: { lng: number; lat: number } }) => {
      if (!propsRef.current.paint) return;
      const p: LonLat = [e.lngLat.lng, e.lngLat.lat];
      if (strokeRef.current) strokeRef.current.push(p);
      setStrokeData(strokeRef.current, p);
    };
    const end = () => {
      const points = strokeRef.current;
      strokeRef.current = null;
      if (!points) return;
      setStrokeData(null, points[points.length - 1]);
      propsRef.current.onPaintStroke?.(points);
    };
    map.on("mousedown", start);
    map.on("mousemove", move);
    map.on("mouseup", end);
    map.on("mouseout", end);
    map.on("touchstart", e => {
      if (e.points.length === 1) start(e);
    });
    map.on("touchmove", e => {
      if (e.points.length === 1) move(e);
    });
    map.on("touchend", end);
    map.on("touchcancel", end);

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
    // The sync helpers read the latest props through refs: the map is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Shows the brush at its real width and colour, or hides it. */
  function syncPaint() {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getLayer("paint-stroke")) return;
    const paint = propsRef.current.paint;
    const visible = paint ? "visible" : "none";
    map.setLayoutProperty("paint-stroke", "visibility", visible);
    map.setLayoutProperty("paint-cursor", "visibility", visible);
    if (!paint) {
      strokeRef.current = null;
      (map.getSource("paint") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const lat = map.getCenter().lat;
    const colour = paint.mode === "erase" ? ERASER : YELLOW;
    map.setPaintProperty("paint-stroke", "line-width", metresToPixels(paint.widthM, lat));
    map.setPaintProperty("paint-stroke", "line-color", colour);
    map.setPaintProperty("paint-cursor", "circle-radius", metresToPixels(paint.widthM / 2, lat));
    map.setPaintProperty("paint-cursor", "circle-color", colour);
    map.setPaintProperty("paint-cursor", "circle-stroke-color", colour);
  }

  /** Registers the SVG icons the symbol layers name; a symbol layer waits for its icon. */
  function syncIcons() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const [id, svg] of Object.entries(propsRef.current.icons ?? {})) {
      if (iconsRef.current.has(id)) continue;
      iconsRef.current.add(id);
      const img = new Image();
      img.onload = () => {
        if (!mapRef.current || mapRef.current !== map) return;
        if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
        syncLayers();
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  }

  /** Adds, updates and removes the overlay layers, below Terra Draw's own layers. */
  function syncLayers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const iconOf = (layer: MapLayer) => (layer.type === "symbol" ? (layer.layout?.["icon-image"] as string | undefined) : undefined);
    // A symbol layer whose icon is not registered yet is left out until the image loads.
    const wanted = propsRef.current.layers.filter(layer => {
      const icon = iconOf(layer);
      return !icon || typeof icon !== "string" || map.hasImage(icon);
    });
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
      const paintKey = `${layer.type}:${JSON.stringify(layer.paint)}:${JSON.stringify(layer.layout ?? null)}`;
      if (applied.get(layer.id) !== paintKey) {
        if (map.getLayer(sourceId)) map.removeLayer(sourceId);
        map.addLayer({ id: sourceId, type: layer.type, source: sourceId, paint: layer.paint, ...(layer.layout ? { layout: layer.layout } : {}) } as LayerSpecification, firstDrawLayer);
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
  useEffect(syncPaint, [props.paint?.widthM, props.paint?.mode]);

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
    markersRef.current.forEach(m => m.marker.remove());
    const zoom = map.getZoom();
    markersRef.current = (props.labels ?? []).map(label => {
      const el = document.createElement("div");
      el.className = `cap-label cap-label-${label.variant}`;
      if (label.variant === "spot") {
        for (const line of label.text.split("\n")) {
          const span = document.createElement("span");
          span.textContent = line;
          el.appendChild(span);
        }
      } else if (label.variant === "address") {
        const name = document.createElement("span");
        name.textContent = label.text;
        el.appendChild(name);
        el.insertAdjacentHTML("beforeend", ADDRESS_PIN);
      } else el.textContent = label.text;
      const minZoom = label.minZoom ?? 0;
      if (zoom < minZoom) el.style.display = "none";
      // The address pin stands on its point; the other labels are centred on theirs.
      const anchor = label.variant === "address" ? "bottom" : "center";
      return { marker: new Marker({ element: el, anchor, offset: label.variant === "vertex" ? [0, -16] : [0, 0] }).setLngLat(label.lngLat).addTo(map), minZoom };
    });
  }, [props.labels]);

  useEffect(() => {
    syncIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.icons]);

  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = props.paint ? "crosshair" : (props.cursor ?? "");
  }, [props.cursor, props.paint]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#E6E8E4]", props.className)}>
      {/* Inline: maplibre-gl.css gives the container "position: relative". */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} data-testid="capacity-map" />
      {props.children}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-white/80 px-2.5 py-1 text-[13px] text-muted-foreground">{IGN_ATTRIBUTION}</div>
    </div>
  );
});
