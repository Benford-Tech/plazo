import { useEffect, useMemo, useRef, useState } from "react";
import { MapView, type MapLabel, type MapLayer, type MapViewHandle } from "@/components/capacity/MapView";
import { Aside, AsideActions, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { dec2, dec3, m2 } from "@/lib/capacity/format";
import { adminApi, type BuildingFeature, type GeocodeResult, type ParkingFeature } from "@/lib/api";
import { areaM2, subtractFromOutline, unionPolygons, withIgnBuildings } from "@/lib/capacity/estimate";
import { IGN_PHOTO_DATE } from "@/lib/capacity/ign";
import { parseLatLon } from "@/lib/capacity/latlon";
import { boundsOf, edgeLabels, fc, feature, polygonsOf, positionsOf } from "@/lib/capacity/mapData";
import { distanceM, SCALE_MAX, SCALE_MIN, scaleFromMeasure } from "@/lib/capacity/projection";
import { estimateFrame } from "@/lib/capacity/studyFrame";
import { settingsOf, type GeoPolygon, type LonLat, type ParcelRef } from "@/lib/capacity/types";
import { describeError, fr } from "@/lib/fr";
import type { StepProps } from "./CapacityStudyPage";

type Tool = "pan" | "addVertex" | "removeVertex" | "cut" | "draw" | "dimension";

const ORANGE = "#ff8a3d";
const CYAN = "#5fd3ff";
const YELLOW = "#A3E635";
const BUILDING = "#d9d5cc";
/** BD TOPO parkings are only fetched from this zoom (a few hundred metres across). */
const PARKINGS_MIN_ZOOM = 15;
const MAX_BBOX_SPAN = 0.05;

const parcelLabel = (p: ParcelRef) => `${p.section.replace(/^0+/, "")} ${p.numero.replace(/^0+/, "")}`;

/** Nearest outline vertex to a click, within `maxPx` pixels. */
function nearestVertex(map: MapViewHandle | null, ring: LonLat[], point: { x: number; y: number }, maxPx = 14): number | null {
  if (!map) return null;
  let best: number | null = null;
  let bestD = maxPx;
  ring.slice(0, -1).forEach((v, i) => {
    const p = map.project(v);
    if (!p) return;
    const d = Math.hypot(p.x - point.x, p.y - point.y);
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export default function TerrainStep({ study, update, go, geoScope = "operator" }: StepProps) {
  const mapRef = useRef<MapViewHandle>(null);
  const settings = settingsOf(study);
  const [tool, setTool] = useState<Tool>("pan");
  const [showPhoto, setShowPhoto] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [showParkings, setShowParkings] = useState(true);
  const [parkings, setParkings] = useState<ParkingFeature[]>([]);
  const [parkingsHint, setParkingsHint] = useState<string | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [buildings, setBuildings] = useState<BuildingFeature[]>([]);
  const [buildingsState, setBuildingsState] = useState<"idle" | "loading" | "error">("idle");
  const studyRef = useRef(study);
  studyRef.current = study;
  const buildingsRequest = useRef(0);
  const mounted = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picks, setPicks] = useState<LonLat[]>([]);
  const [measured, setMeasured] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const view = useRef<{ bbox: [number, number, number, number]; zoom: number } | null>(null);
  const parkingsRequest = useRef(0);

  const outline = study.outline;
  const ring = useMemo(() => outline?.coordinates[0] ?? [], [outline]);
  const parcels = study.parcels;

  const initialBounds = useMemo(
    () => boundsOf([...positionsOf(outline?.coordinates), ...parcels.flatMap(p => positionsOf(p.geometry?.coordinates))]),
    // The map is fitted once, on the study as it was opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---- Outline from the parcels -------------------------------------------------------------

  function outlineFrom(list: ParcelRef[], clip: boolean): GeoPolygon | null {
    const polygons = list.flatMap(p => (p.geometry ? polygonsOf(p.geometry) : []));
    if (!polygons.length) return null;
    const frame = estimateFrame(polygons[0]);
    const clipPolygons = clip ? parkings.flatMap(p => polygonsOf(p.geometry)) : undefined;
    const merged = unionPolygons(polygons, frame, clipPolygons?.length ? clipPolygons : undefined);
    return merged[0] ?? (clip ? unionPolygons(polygons, frame)[0] ?? null : null);
  }

  function setParcels(list: ParcelRef[], clip = !!settings.clipToParking) {
    update({
      parcels: list,
      outline: outlineFrom(list, clip),
      settings: { ...study.settings, clipToParking: clip, outlineSource: "parcels" },
    });
  }

  async function toggleParcelAt(lngLat: LonLat) {
    setBusy(true);
    setMessage(fr.capacity.parcelLoading);
    try {
      const { parcels: found } = await adminApi.parcelsAt(lngLat[0], lngLat[1], geoScope);
      if (!found.length) {
        setMessage(fr.capacity.parcelNone);
        return;
      }
      const hit = found[0];
      const already = parcels.some(p => p.id === hit.id);
      setParcels(already ? parcels.filter(p => p.id !== hit.id) : [...parcels, hit]);
      setMessage(null);
    } catch (e) {
      setMessage(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  // ---- BD TOPO buildings of the land (B-A, 07/10/2026) -------------------------------------

  /** Every building overlapping the outline becomes a "building" exclusion; the hand-made ones stay. */
  async function syncBuildings() {
    const current = studyRef.current;
    const ring = current.outline?.coordinates[0];
    const bounds = ring ? boundsOf(ring) : null;
    if (!bounds) return;
    const [[w, s], [e, n]] = bounds;
    if (e - w > MAX_BBOX_SPAN || n - s > MAX_BBOX_SPAN) return;
    const id = ++buildingsRequest.current;
    setBuildingsState("loading");
    try {
      const { buildings: found } = await adminApi.buildingsIn([w, s, e, n], geoScope);
      if (id !== buildingsRequest.current) return;
      setBuildings(found);
      setBuildingsState("idle");
      const latest = studyRef.current;
      const next = withIgnBuildings(latest, found, fr.capacity.exclusionKinds.building);
      const key = (list: typeof next) => list.map(x => `${x.id}:${x.source ?? ""}`).join("|");
      update({
        ...(key(next) !== key(latest.exclusions) ? { exclusions: next } : {}),
        settings: { ...latest.settings, ignBuildingsSynced: true },
      });
    } catch {
      if (id === buildingsRequest.current) setBuildingsState("error");
    }
  }

  // On opening, only a land never synced gets its buildings (a building removed by hand stays
  // removed); every later change of the outline syncs them again.
  const outlineKey = JSON.stringify(outline);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (!outline || settings.ignBuildings === false) return;
    if (first && settings.ignBuildingsSynced) return;
    void syncBuildings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineKey]);

  function setIgnBuildings(on: boolean) {
    if (on) {
      update({ settings: { ...study.settings, ignBuildings: true } });
      void syncBuildings();
    } else {
      update({
        exclusions: study.exclusions.filter(e => e.source !== "ign"),
        settings: { ...study.settings, ignBuildings: false },
      });
    }
  }
  const ignCount = study.exclusions.filter(e => e.source === "ign").length;

  // ---- BD TOPO parkings of the view ---------------------------------------------------------

  async function loadParkings() {
    const v = view.current;
    if (!v || !showParkings) return;
    const [w, s, e, n] = v.bbox;
    if (v.zoom < PARKINGS_MIN_ZOOM || e - w > MAX_BBOX_SPAN || n - s > MAX_BBOX_SPAN) {
      setParkingsHint(fr.capacity.parkingsZoom);
      return;
    }
    setParkingsHint(null);
    const id = ++parkingsRequest.current;
    try {
      const { parkings: found } = await adminApi.parkingsIn(v.bbox, geoScope);
      if (id === parkingsRequest.current) setParkings(found);
    } catch (err) {
      if (id === parkingsRequest.current) setParkingsHint(describeError(err));
    }
  }

  useEffect(() => {
    if (showParkings) void loadParkings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showParkings]);

  const parcelsUnion = useMemo(() => {
    const polygons = parcels.flatMap(p => (p.geometry ? polygonsOf(p.geometry) : []));
    return polygons.length ? unionPolygons(polygons, estimateFrame(polygons[0])) : [];
  }, [parcels]);
  const parkingOverlaps = useMemo(() => {
    if (!parcelsUnion.length || !parkings.length) return false;
    const frame = estimateFrame(parcelsUnion[0]);
    return unionPolygons(parcelsUnion, frame, parkings.flatMap(p => polygonsOf(p.geometry))).length > 0;
  }, [parcelsUnion, parkings]);

  // ---- Address search -----------------------------------------------------------------------

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || results?.some(r => r.label === q)) return;
    const point = parseLatLon(q);
    if (point) {
      setResults([point]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults((await adminApi.geocode(q, geoScope)).results);
      } catch (e) {
        setResults([]);
        setMessage(describeError(e));
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ---- Map interactions ---------------------------------------------------------------------

  function onMapClick(lngLat: LonLat, point: { x: number; y: number }) {
    if (tool === "pan") {
      if (!busy) void toggleParcelAt(lngLat);
      return;
    }
    if (tool === "removeVertex" && outline) {
      const i = nearestVertex(mapRef.current, ring, point);
      if (i === null || ring.length <= 4) return;
      const kept = ring.slice(0, -1).filter((_, j) => j !== i);
      update({
        outline: { type: "Polygon", coordinates: [[...kept, kept[0]]] },
        settings: { ...study.settings, outlineSource: settings.outlineSource === "drawn" ? "drawn" : "edited" },
      });
      return;
    }
    if (tool === "dimension" && outline && picks.length < 2) {
      const i = nearestVertex(mapRef.current, ring, point);
      if (i === null) return;
      const v = ring[i];
      if (picks.length === 1 && picks[0][0] === v[0] && picks[0][1] === v[1]) return;
      setPicks([...picks, v]);
    }
  }

  function onDrawn(geometry: { type: string; coordinates: unknown }) {
    if (geometry.type !== "Polygon") return;
    const drawn = geometry as GeoPolygon;
    if (tool === "draw") {
      update({ outline: { type: "Polygon", coordinates: [drawn.coordinates[0]] }, settings: { ...study.settings, outlineSource: "drawn" } });
    } else if (tool === "cut" && outline) {
      const rest = subtractFromOutline(outline, drawn, estimateFrame(outline));
      if (rest) update({ outline: rest, settings: { ...study.settings, outlineSource: settings.outlineSource === "drawn" ? "drawn" : "edited" } });
    }
    setTool("pan");
  }

  function applyDimension() {
    const value = Number(measured.replace(",", "."));
    if (picks.length !== 2 || !(value > 0)) return;
    const factor = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scaleFromMeasure(picks[0], picks[1], value)));
    update({ scaleFactor: factor, settings: { ...study.settings, calibration: { a: picks[0], b: picks[1], measured: value } } });
    setPicks([]);
    setMeasured("");
    setTool("pan");
  }

  // ---- Map data -----------------------------------------------------------------------------

  const layers = useMemo<MapLayer[]>(() => {
    const list: MapLayer[] = [];
    if (showParkings) {
      list.push({
        id: "parkings",
        type: "line",
        data: fc(parkings.map(p => feature(p.geometry))),
        paint: { "line-color": CYAN, "line-width": 2, "line-dasharray": [3, 2] },
      });
    }
    if (showBuildings && buildings.length) {
      list.push({
        id: "buildings",
        type: "fill",
        data: fc(buildings.flatMap(b => polygonsOf(b.geometry).map(p => feature(p)))),
        paint: { "fill-color": BUILDING, "fill-opacity": 0.45 },
      });
    }
    if (showParcels) {
      list.push({
        id: "parcels",
        type: "line",
        data: fc(parcels.filter(p => p.geometry).map(p => feature(p.geometry))),
        paint: { "line-color": ORANGE, "line-width": 2, "line-dasharray": [2, 2] },
      });
    }
    if (outline) {
      list.push({ id: "outline-fill", type: "fill", data: fc([feature(outline)]), paint: { "fill-color": YELLOW, "fill-opacity": 0.08 } });
      list.push({ id: "outline", type: "line", data: fc([feature(outline)]), paint: { "line-color": YELLOW, "line-width": 3 } });
      if (tool === "removeVertex" || tool === "dimension") {
        list.push({
          id: "vertices",
          type: "circle",
          data: fc(ring.slice(0, -1).map(v => feature({ type: "Point", coordinates: v }, { picked: picks.some(p => p[0] === v[0] && p[1] === v[1]) }))),
          paint: {
            "circle-radius": 6,
            "circle-color": ["case", ["get", "picked"], "#F3F3F0", YELLOW],
            "circle-stroke-color": "#0F2A14",
            "circle-stroke-width": 2,
          },
        });
      }
    }
    if (picks.length === 2) {
      list.push({
        id: "dimension",
        type: "line",
        data: fc([feature({ type: "LineString", coordinates: picks })]),
        paint: { "line-color": "#F3F3F0", "line-width": 2, "line-dasharray": [2, 1] },
      });
    }
    return list;
  }, [showParkings, showParcels, showBuildings, buildings, parkings, parcels, outline, ring, tool, picks]);

  // While drawing or cutting, the pointer snaps to the parcels, the parkings and the buildings.
  const snapTo = useMemo<LonLat[][]>(
    () => [
      ...parcels.flatMap(p => (p.geometry ? polygonsOf(p.geometry).flatMap(g => g.coordinates) : [])),
      ...parkings.flatMap(p => polygonsOf(p.geometry).flatMap(g => g.coordinates)),
      ...buildings.flatMap(b => polygonsOf(b.geometry).flatMap(g => g.coordinates)),
    ],
    [parcels, parkings, buildings],
  );

  const labels = useMemo<MapLabel[]>(() => edgeLabels(outline, study.scaleFactor), [outline, study.scaleFactor]);

  const editing = tool === "addVertex" && !!outline;
  const drawMode = tool === "cut" || tool === "draw" ? "polygon" : null;
  const area = areaM2(outline, study.scaleFactor);
  const source = settings.outlineSource ?? "parcels";
  const parcelIds = parcels.map(parcelLabel).join(" + ");
  const commune = parcels[0]?.commune;

  const toolButton = (key: Tool, label: string, disabled = false) => (
    <ToolButton variant="map" active={tool === key} disabled={disabled} onClick={() => setTool(tool === key ? "pan" : key)} aria-pressed={tool === key}>
      {label}
    </ToolButton>
  );

  return (
    <>
      <div className="relative min-h-[55vh] min-w-0 flex-1 lg:min-h-0">
        <MapView
          ref={mapRef}
          layers={layers}
          labels={labels}
          showPhoto={showPhoto}
          initialBounds={initialBounds}
          editPolygon={editing ? outline : null}
          midpoints
          onEditPolygon={polygon =>
            update({ outline: polygon, settings: { ...study.settings, outlineSource: source === "drawn" ? "drawn" : "edited" } })
          }
          drawMode={drawMode}
          onDrawn={onDrawn}
          snapTo={snapTo}
          onMapClick={onMapClick}
          onViewChange={(bbox, zoom) => {
            view.current = { bbox, zoom };
            void loadParkings();
          }}
          cursor={tool === "pan" ? (busy ? "progress" : "pointer") : tool === "removeVertex" || tool === "dimension" ? "crosshair" : undefined}
        >
          <div className="absolute left-4 top-4 flex gap-1">
            {toolButton("pan", fr.capacity.tools.pan)}
            {toolButton("addVertex", fr.capacity.tools.addVertex, !outline)}
            {toolButton("removeVertex", fr.capacity.tools.removeVertex, !outline)}
            {toolButton("cut", fr.capacity.tools.cut, !outline)}
          </div>
          <div className="absolute left-4 top-[72px] max-w-md bg-background/80 px-3 py-1.5 text-sm text-muted-foreground">
            {fr.capacity.toolHelp[tool]}
          </div>
        </MapView>
      </div>

      <Aside className="overflow-y-auto">
        <div className="relative">
          <PanelLabel>{fr.capacity.address}</PanelLabel>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={fr.capacity.addressPlaceholder}
            aria-label={fr.capacity.address}
            className="h-11 w-full border border-border bg-card px-2.5 text-base text-foreground placeholder:text-muted-foreground"
          />
          {(searching || (results && query.trim().length >= 3 && !results.some(r => r.label === query))) && (
            <ul className="absolute inset-x-0 top-full z-10 max-h-64 overflow-auto border border-border bg-card shadow-lg" role="listbox">
              {searching && <li className="px-3 py-2 text-sm text-muted-foreground">{fr.capacity.searching}</li>}
              {!searching && results?.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{fr.capacity.noResult}</li>}
              {!searching &&
                results?.map(r => (
                  <li key={`${r.label}-${r.lon}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        setQuery(r.label);
                        setResults([r]);
                        mapRef.current?.flyTo([r.lon, r.lat], r.type === "municipality" ? 15 : 18);
                      }}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="border border-lime-deep p-3">
          <div className="font-bold uppercase text-lime-deep">{outline ? fr.capacity.outline : fr.capacity.noOutline}</div>
          {outline ? (
            <>
              <div className="mt-1 font-mono text-[28px] font-bold leading-tight" data-testid="outline-area">
                {m2.format(area)} m²
              </div>
              <div className="text-sm text-muted-foreground">
                {source === "drawn" || !parcels.length ? (
                  fr.capacity.drawnByHand
                ) : (
                  <>
                    <span title={parcels.map(p => p.id).join(", ")}>{fr.capacity.parcelsLabel(parcelIds)}</span>
                    {commune ? ` (${commune})` : ""}
                    {settings.clipToParking ? `, ${fr.capacity.clippedWithParking}` : ""}
                    {source === "edited" ? ` · ${fr.capacity.editedByHand}` : ""}
                  </>
                )}
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.ignBuildings !== false}
                  onChange={e => setIgnBuildings(e.target.checked)}
                  className="h-4 w-4 accent-[#A3E635]"
                />
                {fr.capacity.ignBuildings}
              </label>
              {settings.ignBuildings !== false && (
                <p className="mt-1 text-[13px] text-muted-foreground" data-testid="ign-buildings">
                  {buildingsState === "loading"
                    ? fr.capacity.ignBuildingsLoading
                    : buildingsState === "error"
                      ? fr.capacity.ignBuildingsError
                      : fr.capacity.ignBuildingsCount(ignCount)}
                </p>
              )}
              {parcels.length > 0 && source !== "drawn" && (parkingOverlaps || settings.clipToParking) && (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!settings.clipToParking}
                    onChange={e => setParcels(parcels, e.target.checked)}
                    className="h-4 w-4 accent-[#A3E635]"
                  />
                  {fr.capacity.clipToParking}
                </label>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {fr.capacity.noOutlineHelp}{" "}
              <button type="button" className="text-lime-deep underline" onClick={() => setTool("draw")}>
                {fr.capacity.drawByHand}
              </button>
            </p>
          )}
          {message && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </div>

        <div>
          <PanelLabel>{fr.capacity.sources}</PanelLabel>
          <SourceToggle checked={showPhoto} onChange={setShowPhoto} title={fr.capacity.sourcePhoto} help={fr.capacity.sourcePhotoHelp(IGN_PHOTO_DATE)} />
          <SourceToggle
            checked={showParcels}
            onChange={setShowParcels}
            title={fr.capacity.sourceParcels}
            help={fr.capacity.sourceParcelsHelp}
            swatch={ORANGE}
          />
          <SourceToggle
            checked={showParkings}
            onChange={setShowParkings}
            title={fr.capacity.sourceParkings}
            help={parkingsHint ? `${fr.capacity.sourceParkingsHelp} · ${parkingsHint}` : fr.capacity.sourceParkingsHelp}
            swatch={CYAN}
          />
          <SourceToggle
            checked={showBuildings}
            onChange={setShowBuildings}
            title={fr.capacity.sourceBuildings}
            help={fr.capacity.sourceBuildingsHelp}
            swatch={BUILDING}
          />
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">{fr.capacity.scale} : </span>
          {settings.calibration && study.scaleFactor !== 1 ? (
            <>
              <span className="font-mono">{fr.capacity.scaleValue(dec3.format(study.scaleFactor), dec2.format(settings.calibration.measured))}</span>{" "}
              <button type="button" className="text-lime-deep underline" onClick={() => update({ scaleFactor: 1, settings: { ...study.settings, calibration: null } })}>
                {fr.capacity.removeScale}
              </button>
            </>
          ) : (
            <span className="font-mono">{fr.capacity.scaleNone}</span>
          )}
        </div>

        {tool === "dimension" ? (
          <div className="border border-border p-3 text-sm">
            <div className="font-bold uppercase">{fr.capacity.dimension}</div>
            {picks.length < 2 ? (
              <p className="mt-1 text-muted-foreground">{fr.capacity.dimensionPick(picks.length)}</p>
            ) : (
              <form
                className="mt-2 space-y-2"
                onSubmit={e => {
                  e.preventDefault();
                  applyDimension();
                }}
              >
                <p className="font-mono text-muted-foreground">{fr.capacity.dimensionOnMap(dec2.format(distanceM(picks[0], picks[1])))}</p>
                <label className="block">
                  <span className="text-muted-foreground">{fr.capacity.dimensionMeasured}</span>
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={measured}
                    onChange={e => setMeasured(e.target.value)}
                    className="mt-1 h-10 w-full border border-border bg-card px-2 font-mono"
                  />
                </label>
                <div className="flex gap-2">
                  <ToolButton type="submit" variant="primary" className="min-h-10">
                    {fr.capacity.apply}
                  </ToolButton>
                  <ToolButton
                    className="min-h-10"
                    onClick={() => {
                      setPicks([]);
                      setTool("pan");
                    }}
                  >
                    {fr.capacity.cancel}
                  </ToolButton>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="m-0 text-[13px] leading-[1.45] text-muted-foreground">{fr.capacity.help}</p>
        )}

        <AsideActions>
          <ToolButton
            disabled={!outline}
            active={tool === "dimension"}
            onClick={() => {
              setPicks([]);
              setTool(tool === "dimension" ? "pan" : "dimension");
            }}
          >
            {fr.capacity.addDimension}
          </ToolButton>
          <ToolButton variant="primary" disabled={!outline} onClick={() => go("zones")}>
            {fr.capacity.validateOutline}
          </ToolButton>
        </AsideActions>
      </Aside>
    </>
  );
}

function SourceToggle(props: { checked: boolean; onChange: (v: boolean) => void; title: string; help: string; swatch?: string }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 border-b border-border py-1 text-[15px]">
      <input type="checkbox" checked={props.checked} onChange={e => props.onChange(e.target.checked)} className="h-[18px] w-[18px] shrink-0 accent-[#A3E635]" />
      {props.swatch && <span className="h-3.5 w-3.5 shrink-0 border-2 border-dashed" style={{ borderColor: props.swatch }} />}
      <span>
        <b>{props.title}</b>
        <br />
        <span className="text-[13px] text-muted-foreground">{props.help}</span>
      </span>
    </label>
  );
}
