import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MapView,
  type MapLabel,
  type MapLayer,
} from "@/components/capacity/MapView";
import {
  Aside,
  AsideActions,
  PanelLabel,
  ToolButton,
} from "@/components/capacity/ui";
import { adminApi } from "@/lib/api";
import {
  exclusionMulti,
  frameFor,
  multiToPolygons,
  type Estimate,
} from "@/lib/capacity/estimate";
import { boundsOf, fc, feature, positionsOf } from "@/lib/capacity/mapData";
import type { LonLat } from "@/lib/capacity/projection";
import {
  LAYOUT_KEYS,
  settingsOf,
  STAY_CLASSES,
  type GeoPoint,
  type LayoutKey,
  type StayClass,
} from "@/lib/capacity/types";
import { describeError, fr } from "@/lib/fr";
import { pointInRing, spotsFromLayout } from "@/lib/plan/numbering";
import {
  LANDMARK_KINDS,
  SPOT_KINDS,
  type Landmark,
  type LandmarkKind,
  type ParkingPlanView,
  type PlanPatch,
  type Spot,
  type SpotKind,
} from "@/lib/plan/types";
import { cn } from "@/lib/utils";

const YELLOW = "#A3E635";
const GREY = "#6b6b66";
const KIND_COLORS: Record<SpotKind, string> = {
  standard: YELLOW,
  large: "#5fd3ff",
  covered: "#b48cff",
  pmr: "#6ec071",
  reserved: "#ff8a3d",
};
// Z-A: the stay zones, from the aisle (light) to the back of the file (deep).
const STAY_COLORS: Record<StayClass, string> = {
  short: "#fff3b0",
  medium: YELLOW,
  long: "#b58900",
};
const LANDMARK_COLORS: Record<LandmarkKind, string> = {
  entrance: "#6ec071",
  exit: "#ff8a3d",
  handover: YELLOW,
  shuttle_stop: "#5fd3ff",
  key_box: "#f3f3f0",
};

type Tool = "toggle" | "kind";
const newId = () => Math.random().toString(36).slice(2, 10);

interface Props {
  parkingId: string;
  view: ParkingPlanView;
  estimate: {
    result: Estimate | null;
    computing: boolean;
    error: string | null;
  };
  update: (patch: PlanPatch) => void;
  onView: (view: ParkingPlanView) => void;
  go: (step: string) => void;
}

/** Step 3 of the plan: choose a layout, generate the spots, adjust them by hand, place the landmarks. */
export default function SpotsStep({
  parkingId,
  view,
  estimate,
  update,
  onView,
  go,
}: Props) {
  const t = fr.parkingPlan;
  const { plan, spots } = view;
  const settings = settingsOf(plan);
  const [layout, setLayout] = useState<LayoutKey>(plan.layout ?? "valet24");
  const [tool, setTool] = useState<Tool>("toggle");
  const [kind, setKind] = useState<SpotKind>("standard");
  const [placing, setPlacing] = useState<LandmarkKind | null>(null);
  const [busy, setBusy] = useState(false);
  const { result, computing } = estimate;
  const counts = result?.totals;
  const frame = useMemo(() => frameFor(plan), [plan]);

  const generate = async () => {
    if (!result || !frame) return;
    if (spots.length && !window.confirm(t.regenerateConfirm)) return;
    const slotLength = (
      layout === "selfPark" ? settings.selfParkSlot : settings.valetSlot
    ).length;
    const list = spotsFromLayout(result, plan.zones, layout, frame, slotLength);
    setBusy(true);
    try {
      const { data } = await adminApi.replaceSpots(parkingId, layout, list);
      onView(data);
      toast.success(t.generated(data.spots.length));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const patchSpot = async (
    spot: Spot,
    patch: { active?: boolean; kind?: SpotKind },
  ) => {
    const before = view.spots;
    const next = view.spots.map((s) =>
      s.id === spot.id ? { ...s, ...patch } : s,
    );
    onView({
      ...view,
      spots: next,
      activeSpots: next.filter((s) => s.active).length,
    });
    try {
      await adminApi.updateSpot(parkingId, spot.id, patch);
    } catch (e) {
      onView({
        ...view,
        spots: before,
        activeSpots: before.filter((s) => s.active).length,
      });
      toast.error(describeError(e));
    }
  };

  const applyCapacity = async () => {
    setBusy(true);
    try {
      const { data } = await adminApi.applyPlanCapacity(parkingId);
      onView(data);
      toast.success(t.capacityApplied(data.totalCapacity));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const onMapClick = (lngLat: LonLat) => {
    if (placing) return;
    const hit = spots.find((s) => pointInRing(lngLat, s.geometry));
    if (!hit) return;
    if (tool === "toggle") void patchSpot(hit, { active: !hit.active });
    else if (hit.kind !== kind) void patchSpot(hit, { kind });
  };

  const onDrawn = (geometry: { type: string }) => {
    if (!placing || geometry.type !== "Point") return;
    const landmark: Landmark = {
      id: newId(),
      kind: placing,
      geometry: geometry as GeoPoint,
    };
    // One entrance, one handover…: a new point of a kind replaces the previous one.
    update({
      landmarks: [
        ...plan.landmarks.filter((l) => l.kind !== placing),
        landmark,
      ],
    });
    // The same click also reaches onMapClick: leave the tool armed until that handler has run.
    setTimeout(() => setPlacing(null), 0);
  };

  const layers = useMemo<MapLayer[]>(() => {
    const list: MapLayer[] = [];
    if (frame && plan.exclusions.length) {
      list.push({
        id: "exclusions",
        type: "fill",
        data: fc(
          plan.exclusions.flatMap((e) =>
            multiToPolygons(frame, exclusionMulti(frame, e)).map((p) =>
              feature(p),
            ),
          ),
        ),
        paint: { "fill-color": "#0F2A14", "fill-opacity": 0.35 },
      });
    }
    // A standard spot shows its stay zone; the other kinds keep their own colour.
    const spotFeatures = spots.map((s) =>
      feature(
        { type: "Polygon", coordinates: [s.geometry] },
        {
          active: s.active,
          color:
            s.kind === "standard" && s.stayClass
              ? STAY_COLORS[s.stayClass]
              : KIND_COLORS[s.kind],
        },
      ),
    );
    list.push({
      id: "spots-fill",
      type: "fill",
      data: fc(spotFeatures),
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["case", ["get", "active"], 0.45, 0.08],
      },
    });
    list.push({
      id: "spots-line",
      type: "line",
      data: fc(spotFeatures),
      paint: {
        "line-color": ["case", ["get", "active"], ["get", "color"], GREY],
        "line-width": 1.2,
      },
    });
    if (!spots.length && result) {
      list.push({
        id: "preview",
        type: "line",
        data: fc(
          result.zones.flatMap((z) =>
            z.layouts[layout].slots.map((ring) =>
              feature({ type: "Polygon", coordinates: [ring] }),
            ),
          ),
        ),
        paint: {
          "line-color": YELLOW,
          "line-width": 1,
          "line-dasharray": [2, 2],
        },
      });
    }
    list.push({
      id: "zones",
      type: "line",
      data: fc(plan.zones.map((z) => feature(z.geometry))),
      paint: {
        "line-color": YELLOW,
        "line-width": 1.5,
        "line-dasharray": [3, 2],
      },
    });
    if (plan.outline)
      list.push({
        id: "outline",
        type: "line",
        data: fc([feature(plan.outline)]),
        paint: { "line-color": YELLOW, "line-width": 3 },
      });
    list.push({
      id: "landmarks",
      type: "circle",
      data: fc(
        plan.landmarks.map((l) =>
          feature(l.geometry, { color: LANDMARK_COLORS[l.kind] }),
        ),
      ),
      paint: {
        "circle-radius": 7,
        "circle-color": ["get", "color"],
        "circle-stroke-color": "#0F2A14",
        "circle-stroke-width": 2,
      },
    });
    return list;
  }, [
    frame,
    plan.exclusions,
    plan.zones,
    plan.outline,
    plan.landmarks,
    spots,
    result,
    layout,
  ]);

  const labels = useMemo<MapLabel[]>(
    () =>
      plan.landmarks.map((l) => ({
        id: `lm-${l.id}`,
        lngLat: l.geometry.coordinates,
        text: t.landmarkKinds[l.kind],
        variant: "vertex" as const,
      })),
    [plan.landmarks, t.landmarkKinds],
  );
  const initialBounds = useMemo(
    () =>
      boundsOf(
        positionsOf(
          plan.outline?.coordinates ?? plan.zones[0]?.geometry.coordinates,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const stayCounts = useMemo(() => {
    const counts: Record<StayClass, number> = { short: 0, medium: 0, long: 0 };
    for (const s of spots)
      if (s.active && s.stayClass) counts[s.stayClass] += 1;
    return counts;
  }, [spots]);
  const hasStayZones =
    stayCounts.short + stayCounts.medium + stayCounts.long > 0;

  const generatedOn = plan.generatedAt
    ? new Date(plan.generatedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      })
    : null;
  const inSync =
    view.activeSpots > 0 && view.activeSpots === view.totalCapacity;

  return (
    <>
      <MapView
        layers={layers}
        labels={labels}
        initialBounds={initialBounds}
        drawMode={placing ? "point" : null}
        onDrawn={onDrawn}
        onMapClick={onMapClick}
        cursor={placing ? "crosshair" : "pointer"}
        className="min-h-[55vh] min-w-0 flex-1 lg:min-h-0"
      />
      <Aside wide>
        <PanelLabel>{t.layout}</PanelLabel>
        <div role="radiogroup" aria-label={t.layout} className="flex flex-col">
          {LAYOUT_KEYS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2.5 border-b border-border py-1 text-[15px]",
                layout === key && "text-primary",
              )}
            >
              <input
                type="radio"
                name="layout"
                checked={layout === key}
                onChange={() => setLayout(key)}
                className="h-[18px] w-[18px] accent-[#A3E635]"
              />
              <span className="flex-1">{t.layouts[key]}</span>
              <span className="font-mono font-bold">
                {computing || !counts ? "…" : t.places(counts[key])}
              </span>
            </label>
          ))}
        </div>
        {plan.zones.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.noZones}</p>
        )}
        <ToolButton
          variant="primary"
          disabled={busy || computing || !result || plan.zones.length === 0}
          onClick={() => void generate()}
        >
          {spots.length ? t.regenerate : t.generate}
        </ToolButton>
        {generatedOn && plan.layout && (
          <p className="text-[13px] text-muted-foreground">
            {t.generatedOn(generatedOn, t.layouts[plan.layout])}
          </p>
        )}

        <PanelLabel className="mt-2">{t.counts}</PanelLabel>
        <dl className="text-sm">
          <Row label={t.countGenerated} value={spots.length} />
          <Row label={t.countActive} value={view.activeSpots} highlight />
          <Row label={t.countDeclared} value={view.totalCapacity} />
        </dl>
        {spots.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noSpots}</p>
        ) : inSync ? (
          <p className="text-sm text-muted-foreground">{t.capacityInSync}</p>
        ) : (
          <ToolButton
            disabled={busy || view.activeSpots === 0}
            onClick={() => void applyCapacity()}
          >
            {t.applyCapacity(view.activeSpots)}
          </ToolButton>
        )}

        {hasStayZones && (
          <>
            <PanelLabel className="mt-2">{t.stayZones}</PanelLabel>
            <ul className="flex flex-col text-sm" data-testid="stay-zones">
              {STAY_CLASSES.map((c) => (
                <li
                  key={c}
                  className="flex min-h-8 items-center gap-2 border-b border-border"
                >
                  <span
                    className="h-3 w-3"
                    style={{ background: STAY_COLORS[c] }}
                  />
                  <span className="flex-1">{t.stayClasses[c]}</span>
                  <span className="font-mono font-bold">
                    {t.places(stayCounts[c])}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-[1.45] text-muted-foreground">
              {t.stayClassesHelp(
                settings.stayShortMaxNights,
                settings.stayMediumMaxNights,
              )}
            </p>
          </>
        )}

        {spots.length > 0 && (
          <>
            <PanelLabel className="mt-2">{t.adjust}</PanelLabel>
            <p className="text-[13px] leading-[1.45] text-muted-foreground">
              {t.adjustHelp}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <ToolButton
                variant="map"
                active={tool === "toggle"}
                onClick={() => setTool("toggle")}
              >
                {t.tools.toggle}
              </ToolButton>
              <ToolButton
                variant="map"
                active={tool === "kind"}
                onClick={() => setTool("kind")}
              >
                {t.tools.kind}
              </ToolButton>
            </div>
            {tool === "kind" && (
              <div
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label={t.tools.kind}
              >
                {SPOT_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex min-h-9 items-center gap-1.5 border px-2 text-sm",
                      kind === k
                        ? "border-primary text-primary"
                        : "border-border",
                    )}
                  >
                    <span
                      className="h-3 w-3"
                      style={{ background: KIND_COLORS[k] }}
                    />
                    {t.spotKinds[k]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <PanelLabel className="mt-2">{t.landmarks}</PanelLabel>
        <p className="text-[13px] leading-[1.45] text-muted-foreground">
          {t.landmarksHelp}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LANDMARK_KINDS.map((k) => (
            <ToolButton
              key={k}
              variant="map"
              active={placing === k}
              onClick={() => setPlacing(placing === k ? null : k)}
            >
              <span
                className="mr-1.5 inline-block h-3 w-3 rounded-full"
                style={{ background: LANDMARK_COLORS[k] }}
              />
              {t.landmarkKinds[k]}
            </ToolButton>
          ))}
        </div>
        {placing && (
          <p className="text-sm text-primary">
            {t.placeLandmark(t.landmarkKinds[placing])}
          </p>
        )}
        {plan.landmarks.length > 0 && (
          <ul className="text-sm">
            {plan.landmarks.map((l) => (
              <li
                key={l.id}
                className="flex min-h-9 items-center gap-2 border-b border-border"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: LANDMARK_COLORS[l.kind] }}
                />
                <span className="flex-1">{t.landmarkKinds[l.kind]}</span>
                <button
                  type="button"
                  aria-label={`${t.remove} ${t.landmarkKinds[l.kind]}`}
                  onClick={() =>
                    update({
                      landmarks: plan.landmarks.filter((x) => x.id !== l.id),
                    })
                  }
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <AsideActions>
          <ToolButton onClick={() => go("zones")}>{t.back}</ToolButton>
        </AsideActions>
      </Aside>
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono font-bold", highlight && "text-primary")}>
        {value}
      </dd>
    </div>
  );
}
