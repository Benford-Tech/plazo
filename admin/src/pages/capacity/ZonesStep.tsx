import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapView, type DrawKind, type MapLabel, type MapLayer } from "@/components/capacity/MapView";
import { Aside, AsideActions, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { m2 } from "@/lib/capacity/format";
import { BRUSH_WIDTHS_M, eraseZones, paintZones, strokeArea, type BrushWidth } from "@/lib/capacity/brush";
import { areaM2, autoZones, exclusionMulti, frameFor, multiToPolygons, outlineMulti, polygonToMulti } from "@/lib/capacity/estimate";
import { areaOf, intersection } from "@/lib/capacity/geometry";
import { boundsOf, edgeLabels, fc, feature, polygonCentroid, positionsOf } from "@/lib/capacity/mapData";
import { EXCLUSION_DEFAULTS, settingsOf, type Exclusion, type ExclusionKind, type GeoPolygon, type LonLat, type Zone, type ZoneSuggestion } from "@/lib/capacity/types";
import { describeError, fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import type { StepProps } from "./CapacityStudyPage";

const YELLOW = "#A3E635";
/** V-A: Claude's proposal, before it is applied. */
const PROPOSAL = "#5fd3ff";
const EXCLUSION_COLORS: Record<ExclusionKind, string> = {
  building: "#d9d5cc",
  reception: "#8a7420",
  shuttle_lane: "#5fd3ff",
  tree: "#4f9b3a",
  post: "#ff8a3d",
  other: "#c0392b",
};
const KINDS: ExclusionKind[] = ["building", "reception", "shuttle_lane", "tree", "post", "other"];

type Selection = { type: "zone" | "exclusion"; id: string } | null;
type Adding = { type: "zone" } | { type: "exclusion"; kind: ExclusionKind } | { type: "brush"; mode: "paint" | "erase" } | null;

const newId = () => Math.random().toString(36).slice(2, 10);
const zoneLetter = (zones: Zone[]) => {
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!zones.some(z => z.name === fr.capacity.zoneName(letter))) return letter;
  }
  return String(zones.length + 1);
};

export default function ZonesStep({ study, update, go, suggestZones }: StepProps) {
  const [selected, setSelected] = useState<Selection>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [choosing, setChoosing] = useState(false);
  const [brushWidth, setBrushWidth] = useState<BrushWidth>(6);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<ZoneSuggestion | null>(null);
  const { outline, zones, exclusions } = study;
  const settings = settingsOf(study);

  // T-A (07/10/2026): the zones follow the land and its exclusions (one per piece, each with its
  // own orientation) until the user draws or edits one by hand.
  const auto = settings.zonesAuto === true || (settings.zonesAuto == null && zones.length === 0);
  const exclusionsKey = JSON.stringify(exclusions.map(e => [e.id, e.clearance, e.geometry]));
  function applyAutoZones(current: Zone[]) {
    let i = 0;
    const pieces = autoZones(study, fr.capacity.zoneName, () => current[i++]?.id ?? newId());
    const key = (list: Zone[]) => JSON.stringify(list.map(z => [z.id, z.geometry.coordinates]));
    update({
      ...(key(pieces) !== key(current) ? { zones: pieces } : {}),
      ...(settings.zonesAuto !== true ? { settings: { ...study.settings, zonesAuto: true } } : {}),
    });
  }
  useEffect(() => {
    if (outline && auto) applyAutoZones(zones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exclusionsKey, outline]);
  const manual = { ...study.settings, zonesAuto: false };

  // V-A (07/10/2026): Claude reads the photo; its zones are shown in blue until applied.
  async function askClaude() {
    if (!suggestZones || suggesting) return;
    setSuggesting(true);
    setSuggestion(null);
    try {
      setSuggestion(await suggestZones());
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setSuggesting(false);
    }
  }
  function applySuggestion() {
    if (!suggestion) return;
    update({ zones: suggestion.zones, settings: manual });
    toast.success(fr.capacity.suggestion.applied(suggestion.zones.length));
    setSuggestion(null);
    setSelected(null);
  }

  const frame = useMemo(() => frameFor(study), [study]);
  const land = useMemo(() => (frame ? outlineMulti(frame, study) : null), [frame, study]);

  const zoneAreas = useMemo(() => {
    const map = new Map<string, number>();
    if (!frame) return map;
    for (const z of zones) {
      const multi = polygonToMulti(frame, z.geometry);
      map.set(z.id, areaOf(land ? intersection(multi, land) : multi));
    }
    return map;
  }, [frame, land, zones]);

  const exclusionShapes = useMemo(() => {
    const map = new Map<string, { area: number; polygons: GeoPolygon[] }>();
    if (!frame) return map;
    for (const e of exclusions) {
      const multi = exclusionMulti(frame, e);
      const clipped = land ? intersection(multi, land) : multi;
      map.set(e.id, { area: areaOf(clipped), polygons: multiToPolygons(frame, multi) });
    }
    return map;
  }, [frame, land, exclusions]);

  const drawMode: DrawKind | null = adding
    ? adding.type === "zone"
      ? "polygon"
      : adding.type === "brush"
        ? null
        : ({ Polygon: "polygon", LineString: "linestring", Point: "point" } as const)[EXCLUSION_DEFAULTS[adding.kind].geometry]
    : null;
  const brush = adding?.type === "brush" ? adding : null;

  // P-A: a stroke of the brush paints or erases; the zones are then drawn by hand.
  function onPaintStroke(points: LonLat[]) {
    if (!brush || !frame) return;
    const ctx = { frame, outline, name: fr.capacity.zoneName, newId };
    const area = strokeArea(points, brushWidth, ctx);
    const next = brush.mode === "paint" ? paintZones(zones, area, ctx) : eraseZones(zones, area, ctx);
    if (next !== zones) update({ zones: next, settings: { ...study.settings, zonesAuto: false } });
  }

  const selectedZone = selected?.type === "zone" ? zones.find(z => z.id === selected.id) : undefined;
  const selectedExclusion = selected?.type === "exclusion" ? exclusions.find(e => e.id === selected.id) : undefined;
  const editPolygon = selectedZone?.geometry ?? (selectedExclusion?.geometry.type === "Polygon" ? selectedExclusion.geometry : null);

  function onDrawn(geometry: Exclusion["geometry"]) {
    if (!adding) return;
    if (adding.type === "zone" && geometry.type === "Polygon") {
      const zone = { id: newId(), name: fr.capacity.zoneName(zoneLetter(zones)), geometry };
      update({ zones: [...zones, zone], settings: manual });
      setSelected({ type: "zone", id: zone.id });
    } else if (adding.type === "exclusion") {
      const kind = adding.kind;
      const exclusion: Exclusion = { id: newId(), name: fr.capacity.exclusionKinds[kind], kind, clearance: EXCLUSION_DEFAULTS[kind].clearance, geometry };
      update({ exclusions: [...exclusions, exclusion] });
      setSelected({ type: "exclusion", id: exclusion.id });
    }
    setAdding(null);
  }

  function onEditPolygon(polygon: GeoPolygon) {
    if (selectedZone) update({ zones: zones.map(z => (z.id === selectedZone.id ? { ...z, geometry: polygon } : z)), settings: manual });
    else if (selectedExclusion) update({ exclusions: exclusions.map(e => (e.id === selectedExclusion.id ? { ...e, geometry: polygon } : e)) });
  }

  function remove(sel: NonNullable<Selection>) {
    if (sel.type === "zone") update({ zones: zones.filter(z => z.id !== sel.id), settings: manual });
    else update({ exclusions: exclusions.filter(e => e.id !== sel.id) });
    if (selected?.id === sel.id) setSelected(null);
  }

  const layers = useMemo<MapLayer[]>(() => {
    const list: MapLayer[] = [];
    list.push({
      id: "zones-fill",
      type: "fill",
      data: fc(zones.map(z => feature(z.geometry, { selected: selected?.id === z.id }))),
      paint: { "fill-color": YELLOW, "fill-opacity": ["case", ["get", "selected"], 0.22, 0.12] },
    });
    list.push({
      id: "exclusions-fill",
      type: "fill",
      data: fc(exclusions.flatMap(e => (exclusionShapes.get(e.id)?.polygons ?? []).map(p => feature(p, { color: EXCLUSION_COLORS[e.kind] })))),
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.6 },
    });
    list.push({
      id: "exclusions-line",
      type: "line",
      data: fc(exclusions.flatMap(e => (exclusionShapes.get(e.id)?.polygons ?? []).map(p => feature(p, { selected: selected?.id === e.id })))),
      paint: { "line-color": ["case", ["get", "selected"], "#F3F3F0", YELLOW], "line-width": ["case", ["get", "selected"], 2.5, 1.5], "line-dasharray": [3, 2] },
    });
    list.push({
      id: "zones-line",
      type: "line",
      data: fc(zones.map(z => feature(z.geometry))),
      paint: { "line-color": YELLOW, "line-width": 2 },
    });
    if (outline) list.push({ id: "outline", type: "line", data: fc([feature(outline)]), paint: { "line-color": YELLOW, "line-width": 3.5 } });
    if (suggestion?.zones.length) {
      list.push({
        id: "proposal-fill",
        type: "fill",
        data: fc(suggestion.zones.map(z => feature(z.geometry))),
        paint: { "fill-color": PROPOSAL, "fill-opacity": 0.25 },
      });
      list.push({
        id: "proposal-line",
        type: "line",
        data: fc(suggestion.zones.map(z => feature(z.geometry))),
        paint: { "line-color": PROPOSAL, "line-width": 2.5, "line-dasharray": [2, 1.5] },
      });
    }
    return list;
  }, [zones, exclusions, exclusionShapes, outline, selected, suggestion]);

  const labels = useMemo<MapLabel[]>(
    () => [
      ...edgeLabels(outline, study.scaleFactor),
      ...zones.map(z => ({
        id: `zone-${z.id}`,
        lngLat: polygonCentroid(z.geometry),
        text: `${z.name} · ${m2.format(zoneAreas.get(z.id) ?? 0)} m²`,
        variant: "zone" as const,
      })),
    ],
    [outline, study.scaleFactor, zones, zoneAreas],
  );

  // While drawing, the pointer snaps to the land's outline and to the excluded parts.
  const snapTo = useMemo<LonLat[][]>(
    () => [...(outline ? outline.coordinates : []), ...[...exclusionShapes.values()].flatMap(v => v.polygons.flatMap(p => p.coordinates))],
    [outline, exclusionShapes],
  );

  const initialBounds = useMemo(
    () => boundsOf(positionsOf(outline?.coordinates ?? zones[0]?.geometry.coordinates)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const help = adding
    ? adding.type === "brush"
      ? adding.mode === "paint"
        ? fr.capacity.brushHelp
        : fr.capacity.eraserHelp
      : adding.type === "zone" || drawMode === "polygon"
      ? fr.capacity.drawZoneHelp
      : drawMode === "linestring"
        ? fr.capacity.drawLineHelp
        : fr.capacity.drawPointHelp
    : editPolygon
      ? fr.capacity.editHelp
      : null;

  return (
    <>
      <div className="relative min-h-[55vh] min-w-0 flex-1 lg:min-h-0">
        <MapView
          layers={layers}
          labels={labels}
          initialBounds={initialBounds}
          editPolygon={editPolygon}
          midpoints
          onEditPolygon={onEditPolygon}
          drawMode={drawMode}
          onDrawn={onDrawn}
          snapTo={snapTo}
          paint={brush ? { widthM: brushWidth, mode: brush.mode } : null}
          onPaintStroke={onPaintStroke}
        >
          {help && <div className="absolute left-4 top-4 max-w-md bg-background/80 px-3 py-1.5 text-sm text-muted-foreground">{help}</div>}
        </MapView>
      </div>

      <Aside className="gap-3 overflow-y-auto">
        <PanelLabel>{fr.capacity.zonesTitle(m2.format(areaM2(outline, study.scaleFactor)))}</PanelLabel>
        <div>
          {zones.map(z => (
            <ItemRow
              key={z.id}
              swatch={YELLOW}
              title={`${z.name} · ${fr.capacity.zoneSubtitle}`}
              subtitle={fr.capacity.zoneDetail}
              area={zoneAreas.get(z.id) ?? 0}
              selected={selected?.id === z.id}
              onSelect={() => setSelected(selected?.id === z.id ? null : { type: "zone", id: z.id })}
              onRemove={() => remove({ type: "zone", id: z.id })}
            />
          ))}
          {exclusions.map(e => (
            <ItemRow
              key={e.id}
              swatch={EXCLUSION_COLORS[e.kind]}
              title={e.kind === "shuttle_lane" ? `${e.name} (${m2.format(e.clearance * 2)} m)` : e.name}
              subtitle={fr.capacity.exclusionSubtitle[e.kind]}
              area={exclusionShapes.get(e.id)?.area ?? 0}
              selected={selected?.id === e.id}
              onSelect={() => setSelected(selected?.id === e.id ? null : { type: "exclusion", id: e.id })}
              onRemove={() => remove({ type: "exclusion", id: e.id })}
            >
              {selected?.id === e.id && e.geometry.type !== "Polygon" && (
                <label className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
                  {e.kind === "shuttle_lane" ? fr.capacity.laneWidth : fr.capacity.clearance}
                  <input
                    type="number"
                    min={e.kind === "shuttle_lane" ? 2 : 0.5}
                    max={e.kind === "shuttle_lane" ? 20 : 10}
                    step={0.5}
                    value={e.kind === "shuttle_lane" ? e.clearance * 2 : e.clearance}
                    onClick={ev => ev.stopPropagation()}
                    onChange={ev => {
                      const v = Number(ev.target.value);
                      if (!(v > 0)) return;
                      const clearance = Math.min(50, e.kind === "shuttle_lane" ? v / 2 : v);
                      update({ exclusions: exclusions.map(x => (x.id === e.id ? { ...x, clearance } : x)) });
                    }}
                    className="h-8 w-20 border border-border bg-card px-2 font-mono text-foreground"
                  />
                </label>
              )}
            </ItemRow>
          ))}
        </div>

        {suggestZones && outline && (
          <div className="border border-border p-2" data-testid="zone-suggestion">
            {suggestion ? (
              <>
                <div className="font-bold">{fr.capacity.suggestion.title(suggestion.zones.length)}</div>
                {suggestion.zones.length === 0 ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">{fr.capacity.suggestion.none}</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-[13px]">
                    {suggestion.surfaces.map(s => (
                      <li key={s.name} className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 border-2 border-dashed" style={{ borderColor: PROPOSAL }} />
                        <b>{s.name}</b>
                        <span className="text-muted-foreground">
                          {s.label} · {fr.capacity.suggestion.surfaces[s.surface as keyof typeof fr.capacity.suggestion.surfaces] ?? s.surface} ·{" "}
                          {fr.capacity.suggestion.confidence(Math.round(s.confidence * 100))}
                        </span>
                        <span className="ml-auto font-mono">{m2.format(s.area)} m²</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex gap-2">
                  {suggestion.zones.length > 0 && (
                    <ToolButton variant="primary" className="min-h-9" onClick={applySuggestion}>
                      {fr.capacity.suggestion.apply}
                    </ToolButton>
                  )}
                  <ToolButton className="min-h-9" onClick={() => setSuggestion(null)}>
                    {fr.capacity.suggestion.dismiss}
                  </ToolButton>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {fr.capacity.suggestion.cost(suggestion.model, suggestion.usage.inputTokens + suggestion.usage.outputTokens)}
                </p>
              </>
            ) : (
              <>
                <ToolButton className="w-full" disabled={suggesting} onClick={() => void askClaude()}>
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  {suggesting ? fr.capacity.suggesting : fr.capacity.suggest}
                </ToolButton>
                <p className="mt-1 text-[13px] text-muted-foreground">{fr.capacity.suggestHelp}</p>
              </>
            )}
          </div>
        )}
        <p className="text-[13px] text-muted-foreground" data-testid="zones-mode">
          {auto ? fr.capacity.autoZonesOn : fr.capacity.autoZonesOff}
        </p>
        {!auto && outline && (
          <ToolButton onClick={() => applyAutoZones(zones)}>{fr.capacity.autoZones}</ToolButton>
        )}
        <div className="flex flex-wrap items-center gap-1" data-testid="brush-tools">
          {(["paint", "erase"] as const).map(mode => (
            <ToolButton
              key={mode}
              active={brush?.mode === mode}
              aria-pressed={brush?.mode === mode}
              onClick={() => {
                setChoosing(false);
                setSelected(null);
                setAdding(brush?.mode === mode ? null : { type: "brush", mode });
              }}
            >
              {mode === "paint" ? fr.capacity.brush : fr.capacity.eraser}
            </ToolButton>
          ))}
          {brush && (
            <span className="ml-1 flex items-center gap-1 text-[13px] text-muted-foreground">
              {fr.capacity.brushWidth}
              {BRUSH_WIDTHS_M.map(w => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={brushWidth === w}
                  onClick={() => setBrushWidth(w)}
                  className={cn("min-h-8 border border-border px-2 font-mono", brushWidth === w && "bg-primary text-primary-foreground")}
                >
                  {w} m
                </button>
              ))}
            </span>
          )}
        </div>
        <ToolButton
          active={adding?.type === "zone"}
          onClick={() => {
            setChoosing(false);
            setSelected(null);
            setAdding(adding?.type === "zone" ? null : { type: "zone" });
          }}
        >
          {fr.capacity.addZone}
        </ToolButton>
        <ToolButton
          active={choosing || adding?.type === "exclusion"}
          onClick={() => {
            setSelected(null);
            if (adding?.type === "exclusion" || choosing) {
              setAdding(null);
              setChoosing(false);
            } else setChoosing(true);
          }}
        >
          {fr.capacity.addExclusion}
        </ToolButton>
        {choosing && (
          <div className="border border-border p-2">
            <div className="mb-1 text-sm text-muted-foreground">{fr.capacity.chooseExclusion}</div>
            <div className="grid grid-cols-2 gap-1">
              {KINDS.map(kind => (
                <button
                  key={kind}
                  type="button"
                  className="flex min-h-10 items-center gap-2 border border-border px-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setChoosing(false);
                    setAdding({ type: "exclusion", kind });
                  }}
                >
                  <span className="h-3 w-3 shrink-0" style={{ background: EXCLUSION_COLORS[kind] }} />
                  {fr.capacity.exclusionKinds[kind]}
                </button>
              ))}
            </div>
          </div>
        )}

        {zones.length === 0 && <p className="text-sm text-muted-foreground">{fr.capacity.noZone}</p>}

        <AsideActions>
          <ToolButton onClick={() => go("terrain")}>{fr.capacity.back}</ToolButton>
          <ToolButton variant="primary" disabled={zones.length === 0} onClick={() => go("capacite")}>
            {fr.capacity.estimate}
          </ToolButton>
        </AsideActions>
      </Aside>
    </>
  );
}

function ItemRow(props: {
  swatch: string;
  title: string;
  subtitle: string;
  area: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={props.selected}
      onClick={props.onSelect}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && props.onSelect()}
      className={cn(
        "grid min-h-12 cursor-pointer grid-cols-[18px_1fr_auto_28px] items-center gap-2.5 border-b border-border py-1.5",
        props.selected && "bg-card outline outline-1 outline-primary",
      )}
    >
      <span className="h-3.5 w-3.5" style={{ background: props.swatch }} />
      <span>
        <b>{props.title}</b>
        <br />
        <span className="text-[13px] text-muted-foreground">{props.subtitle}</span>
        {props.children}
      </span>
      <span className="font-mono text-base font-bold">{m2.format(props.area)} m²</span>
      <button
        type="button"
        aria-label={fr.capacity.remove}
        title={fr.capacity.remove}
        onClick={e => {
          e.stopPropagation();
          props.onRemove();
        }}
        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
