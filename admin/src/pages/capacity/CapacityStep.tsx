import { useMemo, useState } from "react";
import { MapView, type MapLayer } from "@/components/capacity/MapView";
import {
  Aside,
  AsideActions,
  PanelLabel,
  ToolButton,
} from "@/components/capacity/ui";
import { dec1, dec2, m2, patternText } from "@/lib/capacity/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ceilingOf,
  exclusionMulti,
  frameFor,
  multiToPolygons,
  type Estimate,
} from "@/lib/capacity/estimate";
import { downloadJson, studyToGeoJSON } from "@/lib/capacity/export";
import { IGN_PHOTO_DATE } from "@/lib/capacity/ign";
import { boundsOf, fc, feature, positionsOf } from "@/lib/capacity/mapData";
import {
  LAYOUT_KEYS,
  settingsOf,
  type CapacitySettings,
  type LayoutKey,
} from "@/lib/capacity/types";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import type { StepProps } from "./CapacityStudyPage";

const YELLOW = "#F5C400";

export interface EstimateState {
  result: Estimate | null;
  computing: boolean;
  error: string | null;
}

export default function CapacityStep({
  study,
  update,
  go,
  estimate,
}: StepProps & { estimate: EstimateState }) {
  const [chosen, setChosen] = useState<LayoutKey>("valet24");
  const settings = settingsOf(study);
  const { result, computing } = estimate;

  const totals: Record<LayoutKey, number> = {
    selfPark: 0,
    valet24: 0,
    valet5: 0,
    valetEdge: 0,
    ...(result?.totals ?? study.results.totals),
  };
  const usableArea = result?.usableArea ?? study.results.usableArea ?? 0;
  const mainZone = result?.zones.length
    ? [...result.zones].sort((a, b) => b.usableArea - a.usableArea)[0]
    : null;
  const perCar = (count: number) =>
    count > 0 ? dec1.format(usableArea / count) : "—";
  const gain = (count: number) =>
    totals.selfPark > 0 ? Math.round((count / totals.selfPark - 1) * 100) : 0;

  const frame = useMemo(() => frameFor(study), [study]);
  const layers = useMemo<MapLayer[]>(() => {
    const list: MapLayer[] = [];
    if (frame && study.exclusions.length) {
      list.push({
        id: "exclusions",
        type: "fill",
        data: fc(
          study.exclusions.flatMap((e) =>
            multiToPolygons(frame, exclusionMulti(frame, e)).map((p) =>
              feature(p),
            ),
          ),
        ),
        paint: { "fill-color": "#0B0B0C", "fill-opacity": 0.35 },
      });
    }
    list.push({
      id: "slots",
      type: "line",
      data: fc(
        (result?.zones ?? []).flatMap((z) =>
          z.layouts[chosen].slots.map((ring) =>
            feature({ type: "Polygon", coordinates: [ring] }),
          ),
        ),
      ),
      paint: { "line-color": YELLOW, "line-width": 1.2 },
    });
    list.push({
      id: "zones",
      type: "line",
      data: fc(study.zones.map((z) => feature(z.geometry))),
      paint: {
        "line-color": YELLOW,
        "line-width": 1.5,
        "line-dasharray": [3, 2],
      },
    });
    if (study.outline)
      list.push({
        id: "outline",
        type: "line",
        data: fc([feature(study.outline)]),
        paint: { "line-color": YELLOW, "line-width": 3 },
      });
    return list;
  }, [frame, study.exclusions, study.zones, study.outline, result, chosen]);

  const initialBounds = useMemo(
    () =>
      boundsOf(
        positionsOf(
          study.outline?.coordinates ?? study.zones[0]?.geometry.coordinates,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const chosenSlot =
    chosen === "selfPark" ? settings.selfParkSlot : settings.valetSlot;
  const angle = mainZone?.layouts[chosen].angle;
  const header =
    study.zones.length === 1
      ? fr.capacity.compared(study.zones[0].name, m2.format(usableArea))
      : fr.capacity.compared(
          fr.capacity.zonesCount(study.zones.length),
          m2.format(usableArea),
        );

  const details: Record<LayoutKey, string> = {
    selfPark: fr.capacity.selfParkDetail(
      `${dec2.format(settings.selfParkSlot.width)} × ${dec2.format(settings.selfParkSlot.length)}`,
      m2.format(settings.aisleWidth),
      settings.endStalls,
    ),
    valet24: fr.capacity.valet24Detail(
      patternText(mainZone?.layouts.valet24.pattern ?? []) || "—",
      Math.max(1, Math.round(settings.maxDepth) - 1),
    ),
    valet5: fr.capacity.valet5Detail(
      patternText(mainZone?.layouts.valet5.pattern ?? []) || "—",
    ),
    valetEdge: fr.capacity.valetEdgeDetail(
      mainZone?.layouts.valetEdge.pattern[0] ??
        Math.round(settings.edgeMaxFiles),
    ),
  };

  const setSettings = (patch: Partial<CapacitySettings>) =>
    update({ settings: { ...study.settings, ...patch } });
  const counted = study.carMarkers.length;

  return (
    <>
      <div className="relative min-w-0 flex-1">
        <MapView layers={layers} initialBounds={initialBounds}>
          <div
            className="absolute left-4 top-4 flex gap-[18px] border border-border bg-background/85 px-3 py-2.5"
            data-testid="layout-overlay"
          >
            <Overlay
              label={fr.capacity.overlaySlot}
              value={`${dec2.format(chosenSlot.width)} × ${dec2.format(chosenSlot.length)} m`}
            />
            <Overlay
              label={fr.capacity.overlayAisle}
              value={`${dec2.format(settings.aisleWidth)} m`}
            />
            <Overlay
              label={fr.capacity.overlayOrientation}
              value={
                settings.orientation == null
                  ? `${fr.capacity.auto} · ${angle != null ? `${m2.format(angle)}°` : "—"}`
                  : `${m2.format(settings.orientation)}°`
              }
            />
            <Overlay
              label={fr.capacity.overlayDepth}
              value={
                chosen === "selfPark"
                  ? "1"
                  : chosen === "valet24"
                    ? String(Math.round(settings.maxDepth))
                    : "5"
              }
            />
          </div>
          {computing && (
            <div className="absolute right-4 top-4 bg-background/85 px-3 py-2 text-sm text-primary">
              {fr.capacity.computing}
            </div>
          )}
        </MapView>
      </div>

      <Aside wide className="gap-2.5 overflow-y-auto px-[18px] py-4">
        <PanelLabel>{header}</PanelLabel>
        {LAYOUT_KEYS.map((key) => {
          const count = totals[key];
          const active = key === chosen;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setChosen(key)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-1 p-3 text-left",
                active
                  ? "border-2 border-primary bg-card"
                  : "border border-border hover:bg-card/60",
              )}
              data-testid={`layout-${key}`}
            >
              <span className="flex items-baseline justify-between">
                <b className="text-base uppercase">
                  {fr.capacity.layouts[key]}
                </b>
                <span className="font-mono text-sm font-bold text-primary">
                  {key === "selfPark"
                    ? "—"
                    : `${gain(count) >= 0 ? "+" : ""}${gain(count)} %`}
                </span>
              </span>
              <span className="flex items-baseline gap-2.5">
                <span
                  className={cn(
                    "font-mono text-[34px] font-bold leading-tight",
                    active ? "text-primary" : "text-foreground",
                  )}
                  data-testid={`count-${key}`}
                >
                  {computing && !result ? "…" : count}
                </span>
                <span className="text-muted-foreground">
                  {fr.capacity.cars} · {fr.capacity.perCar(perCar(count))}
                </span>
              </span>
              <span className="text-[13px] leading-[1.4] text-muted-foreground">
                {details[key]}
              </span>
            </button>
          );
        })}

        {result && totals.valet24 === 0 && (
          <p className="text-sm text-destructive">{fr.capacity.noResult3}</p>
        )}

        <div className="border-l-2 border-primary pl-2.5 text-sm leading-[1.45] text-muted-foreground">
          {fr.capacity.rangeLabel}
          <b className="text-foreground">
            {fr.capacity.range(totals.selfPark, totals.valet24)}
          </b>
          . {fr.capacity.ceiling(ceilingOf(usableArea, settings))}
          <br />
          {fr.capacity.photoCheck}
          {counted > 0 ? (
            <>
              <button
                type="button"
                className="font-bold text-foreground underline-offset-2 hover:underline"
                onClick={() => go("photo")}
              >
                {fr.capacity.photoCounted(counted)}
              </button>
              {fr.capacity.photoOn(IGN_PHOTO_DATE)}
            </>
          ) : (
            <button
              type="button"
              className="text-primary underline"
              onClick={() => go("photo")}
            >
              {fr.capacity.photoTodo}
            </button>
          )}
        </div>

        <details className="border border-border p-3 text-sm">
          <summary className="cursor-pointer font-bold uppercase">
            {fr.capacity.settings}
          </summary>
          <div className="mt-3 grid gap-2.5">
            <PairInput
              label={fr.capacity.selfParkSlot}
              value={settings.selfParkSlot}
              onChange={(v) => setSettings({ selfParkSlot: v })}
            />
            <PairInput
              label={fr.capacity.valetSlot}
              value={settings.valetSlot}
              onChange={(v) => setSettings({ valetSlot: v })}
            />
            <NumberInput
              label={fr.capacity.aisleWidth}
              value={settings.aisleWidth}
              min={3}
              max={12}
              step={0.5}
              onChange={(v) => v != null && setSettings({ aisleWidth: v })}
            />
            <NumberInput
              label={fr.capacity.maxDepth}
              value={settings.maxDepth}
              min={2}
              max={8}
              step={1}
              onChange={(v) =>
                v != null && setSettings({ maxDepth: Math.round(v) })
              }
            />
            <NumberInput
              label={fr.capacity.setback}
              value={settings.setback}
              min={0}
              max={10}
              step={0.25}
              onChange={(v) => v != null && setSettings({ setback: v })}
            />
            <NumberInput
              label={fr.capacity.orientation}
              value={settings.orientation}
              min={0}
              max={179}
              step={1}
              optional
              onChange={(v) => setSettings({ orientation: v })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.endStalls}
                onChange={(e) => setSettings({ endStalls: e.target.checked })}
                className="h-4 w-4 accent-[#F5C400]"
              />
              {fr.capacity.endStalls}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.crossAisles}
                onChange={(e) => setSettings({ crossAisles: e.target.checked })}
                className="h-4 w-4 accent-[#F5C400]"
              />
              {fr.capacity.crossAisles}
            </label>
          </div>
        </details>

        <AsideActions>
          <ToolButton
            onClick={() =>
              downloadJson(
                `${study.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "etude"}.geojson`,
                studyToGeoJSON(study, result),
              )
            }
          >
            {fr.capacity.export}
          </ToolButton>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* A disabled button gets no pointer events: the wrapper carries the tooltip. */}
              <span tabIndex={0}>
                <ToolButton
                  variant="primary"
                  disabled
                  className="pointer-events-none"
                >
                  {fr.capacity.createPlan}
                </ToolButton>
              </span>
            </TooltipTrigger>
            <TooltipContent>{fr.capacity.soon}</TooltipContent>
          </Tooltip>
        </AsideActions>
      </Aside>
    </>
  );
}

function Overlay({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[1px] text-muted-foreground">
        {label}
      </span>
      <b className="font-mono">{value}</b>
    </span>
  );
}

function NumberInput(props: {
  label: string;
  /** Visually hidden label (inputs inside a pair). */
  hideLabel?: boolean;
  value: number | null;
  min: number;
  max: number;
  step: number;
  optional?: boolean;
  onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState(
    props.value == null ? "" : String(props.value),
  );
  return (
    <label className="flex items-center justify-between gap-3">
      <span className={props.hideLabel ? "sr-only" : "text-muted-foreground"}>
        {props.label}
      </span>
      <input
        type="number"
        min={props.min}
        max={props.max}
        step={props.step}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value === "" && props.optional)
            return props.onChange(null);
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= props.min && v <= props.max)
            props.onChange(v);
        }}
        className="h-9 w-24 border border-border bg-card px-2 font-mono"
      />
    </label>
  );
}

function PairInput(props: {
  label: string;
  value: { width: number; length: number };
  onChange: (v: { width: number; length: number }) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="flex items-center gap-1">
        <NumberInput
          hideLabel
          label={`${props.label} : largeur`}
          value={props.value.width}
          min={1.8}
          max={4}
          step={0.05}
          onChange={(v) =>
            v != null && props.onChange({ ...props.value, width: v })
          }
        />
        ×
        <NumberInput
          hideLabel
          label={`${props.label} : longueur`}
          value={props.value.length}
          min={3.5}
          max={7}
          step={0.1}
          onChange={(v) =>
            v != null && props.onChange({ ...props.value, length: v })
          }
        />
      </span>
    </div>
  );
}
