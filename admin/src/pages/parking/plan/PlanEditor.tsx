import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LocateFixed,
  Minus,
  Navigation2,
  Rows3,
  Trash2,
  MapPin,
  Paintbrush,
  Route,
  RotateCcw,
  RotateCw,
  Settings2,
  Sparkles,
  Square,
  TreeDeciduous,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  capacityOf,
  nextFileCode,
  type FileInput,
  type ParkingFile,
} from "@/lib/plan/parkingFiles";
import { toast } from "sonner";
import { PlanHistory, planFields, touchesPlan, type Step } from "./history";
import { alignBearing } from "@/lib/plan/alignment";
import {
  MapView,
  type DrawKind,
  type MapViewHandle,
} from "@/components/capacity/MapView";
import { ToolButton } from "@/components/capacity/ui";
import { adminApi, ApiError, type GeocodeResult } from "@/lib/api";
import {
  BRUSH_WIDTHS_M,
  eraseZones,
  paintZones,
  strokeArea,
  type BrushWidth,
} from "@/lib/capacity/brush";
import {
  areaM2,
  autoZones,
  frameFor,
  outlineMulti,
  polygonToMulti,
  subtractFromOutline,
  unionPolygons,
  withIgnBuildings,
  type Estimate,
} from "@/lib/capacity/estimate";
import { m2 } from "@/lib/capacity/format";
import { pointInMulti } from "@/lib/capacity/geometry";
import { parseLatLon } from "@/lib/capacity/latlon";
import { boundsOf, polygonsOf, positionsOf } from "@/lib/capacity/mapData";
import { distanceM, type LonLat } from "@/lib/capacity/projection";
import { estimateFrame } from "@/lib/capacity/studyFrame";
import {
  EXCLUSION_DEFAULTS,
  LAYOUT_KEYS,
  settingsOf,
  STAY_CLASSES,
  type CapacityStudy,
  type Exclusion,
  type ExclusionKind,
  type GeoPoint,
  type GeoPolygon,
  type LayoutKey,
  type ParcelRef,
  type StayClass,
  type Zone,
  type ZoneSuggestion,
} from "@/lib/capacity/types";
import { describeError, fr } from "@/lib/fr";
import { rowAlong } from "@/lib/plan/manualRow";
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
import {
  AUTO_STEPS,
  autoSetup,
  NoParcelError,
  type AutoProgress,
  type AutoStep,
  type SuggestFn,
} from "./autoSetup";
import {
  EXCLUSION_COLORS,
  exclusionShapes,
  LANDMARK_COLORS,
  planLabels,
  planLayers,
  PROPOSAL,
  snapTargets,
  SPOT_KIND_COLORS,
  STAY_COLORS,
  zoneAreas,
  fileLabels,
  fileLayers,
} from "./planLayers";
import { PlanSettings } from "./PlanSettings";
import { useConfirm } from "@/components/ui/confirm-context";

import {
  ADVANCED_TOOLS,
  PRIMARY_TOOLS,
  type ResetScope,
  type Tool,
} from "./types";
type ContourMode = "parcel" | "draw" | "edit" | "cut";
type SaveState = "idle" | "saving" | "saved" | "error";

const OBSTACLE_KINDS: ExclusionKind[] = [
  "building",
  "tree",
  "post",
  "shuttle_lane",
  "reception",
  "other",
];
/** Half-size of the box the map opens on around the parking's position, in degrees (≈ 150 m). */
const HOME_HALF_SPAN = 0.0015;
const MAX_BBOX_SPAN = 0.02;
/** A click this close to a point obstacle or a landmark hits it (metres). */
const HIT_M = 4;
const newId = () => Math.random().toString(36).slice(2, 10);
const fileInput = (f: ParkingFile): FileInput => ({
  id: f.id,
  code: f.code,
  name: f.name,
  capacity: f.capacity,
  geometry: f.geometry,
  sortOrder: f.sortOrder,
  active: f.active,
});
function lineLengthTooShort(line: LonLat[], slotLength: number): boolean {
  let m = 0;
  for (let i = 1; i < line.length; i++) {
    const kx = 111_320 * Math.cos((line[i][1] * Math.PI) / 180);
    m += Math.hypot(
      (line[i][0] - line[i - 1][0]) * kx,
      (line[i][1] - line[i - 1][1]) * 110_540,
    );
  }
  return m < slotLength * 0.75;
}
/** The file whose line passes within a few metres of the click. */
function nearestFile(files: ParkingFile[], p: LonLat): ParkingFile | null {
  let best: ParkingFile | null = null;
  let bestD = 6;
  for (const f of files) {
    const g = f.geometry;
    if (!g || g.length < 2) continue;
    for (let i = 1; i < g.length; i++) {
      const d = segmentDistanceM(p, g[i - 1], g[i]);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
  }
  return best;
}
function segmentDistanceM(p: LonLat, a: LonLat, b: LonLat): number {
  const kx = 111_320 * Math.cos((p[1] * Math.PI) / 180);
  const ky = 110_540;
  const ax = (a[0] - p[0]) * kx,
    ay = (a[1] - p[1]) * ky;
  const bx = (b[0] - p[0]) * kx,
    by = (b[1] - p[1]) * ky;
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const u = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
  return Math.hypot(ax + u * dx, ay + u * dy);
}
/** The tool in hand after a reset: where the operator starts again. */
const RESET_TOOL: Record<ResetScope, Tool> = {
  all: "contour",
  files: "files",
  zones: "parking",
  spots: "spots",
};
const TOOL_ICONS: Record<Tool, React.ComponentType<{ className?: string }>> = {
  contour: Square,
  parking: Paintbrush,
  passage: Route,
  obstacle: TreeDeciduous,
  landmark: MapPin,
  files: Rows3,
  spots: Check,
};

const MAP_BUTTON =
  "inline-flex min-h-10 items-center gap-1.5 border border-border bg-card px-3 text-[13px] font-semibold shadow-lg hover:bg-accent";

/** The map's rotation and the palette's state stay in the browser (a view, not the plan). */
const BEARING_KEY = (parkingId: string) => `plazo:plan-bearing:${parkingId}`;
const PALETTE_KEY = "plazo:plan-palette";
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing: the setting lasts as long as the page.
  }
}

interface Props {
  parkingId: string;
  parking: {
    name: string;
    lat?: number | null;
    lng?: number | null;
    totalCapacity: number;
  };
  view: ParkingPlanView;
  study: CapacityStudy;
  estimate: {
    result: Estimate | null;
    computing: boolean;
    error: string | null;
  };
  update: (patch: PlanPatch) => void;
  flush: () => Promise<boolean>;
  onView: (view: ParkingPlanView) => void;
  suggest: SuggestFn;
  initialTool: Tool | null;
  /** R-C: run the first pass (parcel, buildings, zones, spots, files) on an empty plan. */
  autoRun: boolean;
  saveState: SaveState;
  /** Resolves to true once the plan is reset (false when the operator cancels or it fails). */
  onReset: (scope: ResetScope) => Promise<boolean>;
}

/**
 * R-A (07/10/2026): the plan editor. One map, one toolbar on the left, one floating card for the
 * tool in hand, the count on top. Since "the plan is made at once: one line per file and a
 * capacity" (07/10/2026), the toolbar shows Contour · Files · Repères; the estimator's zone
 * brushes, obstacles and spots sit behind "Avancé", and "Me proposer des files" runs the
 * automatic pass for those who want a start. The numbers the engine uses live in a drawer.
 */
export function PlanEditor({
  parkingId,
  parking,
  view,
  study,
  estimate,
  update: updatePlan,
  flush,
  onView,
  suggest,
  initialTool,
  autoRun,
  saveState,
  onReset,
}: Props) {
  const t = fr.planEditor;
  const tp = fr.parkingPlan;
  const { plan, spots } = view;
  const { outline, zones, exclusions, landmarks } = plan;
  const settings = settingsOf(study);
  const mapRef = useRef<MapViewHandle>(null);
  const studyRef = useRef(study);
  studyRef.current = study;
  const planRef = useRef(plan);
  planRef.current = plan;

  // Ctrl+Z (09/10/2026): every gesture keeps the drawing as it was; the automatic follow-ups (zones
  // that follow the outline, IGN buildings, the first pass) are not gestures of their own.
  const history = useRef(new PlanHistory());
  function update(patch: PlanPatch, options?: { auto?: boolean }) {
    if (!options?.auto && touchesPlan(patch))
      history.current.record({ plan: planFields(planRef.current) }, Date.now());
    updatePlan(patch);
  }

  const confirm = useConfirm();
  const [tool, setToolState] = useState<Tool>(
    initialTool ?? (!outline ? "contour" : "files"),
  );
  // The estimator's tools unfold on demand, or as soon as one of them is in hand.
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    ADVANCED_TOOLS.includes(tool),
  );
  const advancedShown = advancedOpen || ADVANCED_TOOLS.includes(tool);
  useEffect(() => {
    if (ADVANCED_TOOLS.includes(tool)) setAdvancedOpen(true);
  }, [tool]);
  const [contourMode, setContourMode] = useState<ContourMode>("parcel");
  const [brushWidth, setBrushWidth] = useState<BrushWidth>(6);
  const [obstacleKind, setObstacleKind] = useState<ExclusionKind | null>(null);
  const [selectedExclusion, setSelectedExclusion] = useState<string | null>(
    null,
  );
  const [landmarkKind, setLandmarkKind] = useState<LandmarkKind | null>(null);
  const [spotTool, setSpotTool] = useState<"toggle" | "kind" | "delete">(
    "toggle",
  );
  // P-B: a row of spots along a line drawn on the map.
  const [rowArmed, setRowArmed] = useState(false);
  // S-C (07/10/2026): the files of the parking, one line each.
  const [fileArmed, setFileArmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // R-A (09/10/2026): the map turns; its bearing is kept per parking in the browser.
  const [bearing, setBearing] = useState(
    () => Number(readStored(BEARING_KEY(parkingId))) || 0,
  );
  // P-B (09/10/2026): the palette folds into a bar, by hand or while a line or a stroke is drawn.
  // Unfolded by default, except on a phone where it would cover the whole map.
  const [paletteOpen, setPaletteOpen] = useState(() => {
    const stored = readStored(PALETTE_KEY);
    return stored ? stored === "open" : window.innerWidth >= 640;
  });
  const [painting, setPainting] = useState(false);
  const queryClient = useQueryClient();
  const filesQuery = useQuery({
    queryKey: ["files", parkingId],
    queryFn: () => adminApi.getFiles(parkingId),
  });
  const files: ParkingFile[] = useMemo(
    () => filesQuery.data?.files ?? [],
    [filesQuery.data],
  );
  const filesOccupied = useMemo(
    () =>
      new Set(
        (filesQuery.data?.files ?? [])
          .filter((f) => f.cars.length)
          .map((f) => f.id),
      ),
    [filesQuery.data],
  );
  const saveFiles = useMutation({
    mutationFn: (list: FileInput[]) => adminApi.replaceFiles(parkingId, list),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["files", parkingId] }),
    onError: (e) => toast.error(describeError(e)),
  });
  const [spotKind, setSpotKind] = useState<SpotKind>("standard");
  const [layout, setLayout] = useState<LayoutKey>(plan.layout ?? "valetEdge");
  const [suggestion, setSuggestion] = useState<ZoneSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [parcelBusy, setParcelBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState<Partial<
    Record<AutoStep, AutoProgress>
  > | null>(null);
  const autoStarted = useRef(false);
  const buildingsRequest = useRef(0);
  const mounted = useRef(false);

  function setTool(next: Tool) {
    setToolState(next);
    setRowArmed(false);
    setContourMode("parcel");
    setObstacleKind(null);
    setSelectedExclusion(null);
    setLandmarkKind(null);
    setSuggestion(null);
  }

  // ---- Geometry helpers -----------------------------------------------------------------------
  const frame = useMemo(() => frameFor(plan), [plan]);
  const land = useMemo(
    () => (frame ? outlineMulti(frame, plan) : null),
    [frame, plan],
  );
  const shapes = useMemo(
    () => exclusionShapes(frame, exclusions, land),
    [frame, exclusions, land],
  );
  const areas = useMemo(
    () => zoneAreas(frame, zones, land),
    [frame, zones, land],
  );
  const manual = { ...study.settings, zonesAuto: false };
  const zonesAuto =
    settings.zonesAuto === true ||
    (settings.zonesAuto == null && zones.length === 0);

  // T-A: without a hand-drawn zone, the zones follow the land minus its obstacles.
  function applyAutoZones(current: Zone[]) {
    let i = 0;
    const pieces = autoZones(
      studyRef.current,
      fr.capacity.zoneName,
      () => current[i++]?.id ?? newId(),
    );
    const key = (list: Zone[]) =>
      JSON.stringify(list.map((z) => [z.id, z.geometry.coordinates]));
    update(
      {
        ...(key(pieces) !== key(current) ? { zones: pieces } : {}),
        ...(settings.zonesAuto !== true
          ? { settings: { ...study.settings, zonesAuto: true } }
          : {}),
      },
      { auto: true },
    );
  }
  const exclusionsKey = JSON.stringify(
    exclusions.map((e) => [e.id, e.clearance, e.geometry]),
  );
  const outlineKey = JSON.stringify(outline);
  useEffect(() => {
    if (auto || !outline || !zonesAuto) return;
    applyAutoZones(zones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exclusionsKey, outlineKey]);

  // B-A: every building of the BD TOPO on the land becomes an obstacle (once, then on each outline change).
  async function syncBuildings() {
    const current = studyRef.current;
    const ring = current.outline?.coordinates[0];
    const bounds = ring ? boundsOf(ring) : null;
    if (!bounds) return;
    const [[w, s], [e, n]] = bounds;
    if (e - w > MAX_BBOX_SPAN || n - s > MAX_BBOX_SPAN) return;
    const id = ++buildingsRequest.current;
    try {
      const { buildings } = await adminApi.buildingsIn([w, s, e, n]);
      if (id !== buildingsRequest.current) return;
      const latest = studyRef.current;
      const next = withIgnBuildings(
        latest,
        buildings,
        fr.capacity.exclusionKinds.building,
      );
      const key = (list: Exclusion[]) =>
        list.map((x) => `${x.id}:${x.source ?? ""}`).join("|");
      update(
        {
          ...(key(next) !== key(latest.exclusions) ? { exclusions: next } : {}),
          settings: { ...latest.settings, ignBuildingsSynced: true },
        },
        { auto: true },
      );
    } catch {
      // The IGN did not answer: the operator adds the buildings by hand.
    }
  }
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (auto || autoRun || !outline || settings.ignBuildings === false) return;
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
        exclusions: exclusions.filter((e) => e.source !== "ign"),
        settings: { ...study.settings, ignBuildings: false },
      });
    }
  }

  // ---- Ctrl+Z / Ctrl+Maj+Z (Ctrl+Y) -----------------------------------------------------------
  /** The parts of a step as they are now, to come back to them. */
  const currentOf = (step: Step): Step => ({
    ...(step.plan ? { plan: planFields(planRef.current) } : {}),
    ...(step.files ? { files: files.map(fileInput) } : {}),
  });
  async function applyStep(step: Step): Promise<boolean> {
    if (step.plan) updatePlan(step.plan);
    if (step.files) {
      try {
        await saveFiles.mutateAsync(step.files);
      } catch {
        // The mutation said why (a file that holds cars stays).
        return false;
      }
    }
    setSelectedExclusion(null);
    setSelectedFile(null);
    setSuggestion(null);
    return true;
  }
  async function travel(direction: "undo" | "redo") {
    if (auto || saveFiles.isPending) return;
    const h = history.current;
    const step = direction === "undo" ? h.undo(currentOf) : h.redo(currentOf);
    if (!step) {
      toast.message(
        direction === "undo"
          ? t.history.nothingToUndo
          : t.history.nothingToRedo,
        { id: "plan-history" },
      );
      return;
    }
    if (!(await applyStep(step))) {
      h.revert(direction, step);
      return;
    }
    toast.message(direction === "undo" ? t.history.undone : t.history.redone, {
      id: "plan-history",
    });
  }
  const travelRef = useRef(travel);
  travelRef.current = travel;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const redo = (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey);
      if (key !== "z" && !redo) return;
      // A text field keeps its own undo; an open question waits for its answer.
      const target = e.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "") ||
        document.querySelector('[role="alertdialog"]')
      )
        return;
      e.preventDefault();
      void travelRef.current(redo ? "redo" : "undo");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- The parking's address: the plan is built around it (09/10/2026) -------------------------
  /** The address on the map (geocoded by the server), when it could be placed. */
  const address: LonLat | null =
    parking.lat != null && parking.lng != null
      ? [parking.lng, parking.lat]
      : null;
  /**
   * The view the plan opens on and "Recentrer sur le parking" comes back to: the outline drawn and
   * the address together, or some 200 m around the address before anything is drawn.
   */
  function homeBounds(): [LonLat, LonLat] | null {
    const current = studyRef.current;
    const drawn = [
      ...positionsOf(current.outline?.coordinates),
      ...current.parcels.flatMap((p) => positionsOf(p.geometry?.coordinates)),
    ];
    if (drawn.length) return boundsOf(address ? [...drawn, address] : drawn);
    if (!address) return null;
    return [
      [address[0] - HOME_HALF_SPAN, address[1] - HOME_HALF_SPAN],
      [address[0] + HOME_HALF_SPAN, address[1] + HOME_HALF_SPAN],
    ];
  }
  /** Back to the address once the outline is gone (whole plan reset, outline cleared). */
  function showAddress() {
    if (!address) return;
    mapRef.current?.fitTo([
      [address[0] - HOME_HALF_SPAN, address[1] - HOME_HALF_SPAN],
      [address[0] + HOME_HALF_SPAN, address[1] + HOME_HALF_SPAN],
    ]);
  }
  function recenter() {
    const bounds = homeBounds();
    if (bounds) mapRef.current?.fitTo(bounds);
  }
  function onBearingChange(next: number) {
    const rounded = Math.round(next * 10) / 10;
    setBearing(rounded);
    writeStored(BEARING_KEY(parkingId), String(rounded));
  }
  /** The parking laid straight on the screen, its long side horizontal, and fitted. */
  function alignOnParking() {
    const ring = studyRef.current.outline?.coordinates[0];
    const next = ring ? alignBearing(ring) : null;
    if (next == null) return;
    mapRef.current?.rotateTo(next, homeBounds());
  }
  function togglePalette() {
    setPaletteOpen((open) => {
      writeStored(PALETTE_KEY, open ? "closed" : "open");
      return !open;
    });
  }

  // ---- The automatic pass: R-C at the first opening, "Me proposer des files" on demand --------
  // Parcel (unless the plan has an outline), buildings, zones (unless painted by hand), spots in
  // the chosen layout (or the one given), then the files of those spots. Ends on the files tool
  // when files came out.
  async function runAutoPass(layoutOverride?: LayoutKey) {
    if (auto) return;
    const passLayout = layoutOverride ?? layout;
    const current = studyRef.current;
    const position = address;
    if (!current.outline && !position) {
      toast.message(t.auto.noPosition);
      return;
    }
    setAuto({});
    // The pass is marked on the plan first: it never replays by itself, even after a reset.
    const marked = {
      ...current,
      settings: { ...current.settings, autoSetupAt: new Date().toISOString() },
    };
    update({ settings: marked.settings }, { auto: true });
    try {
      const r = await autoSetup({
        parkingId,
        position,
        study: marked,
        layout: passLayout,
        newId,
        save: async (patch) => {
          update(patch, { auto: true });
          return flush();
        },
        suggest,
        onProgress: (p) => setAuto((a) => ({ ...(a ?? {}), [p.step]: p })),
        yieldToUi: () => new Promise((resolve) => setTimeout(resolve, 30)),
      });
      onView(r.view);
      if (r.files) {
        void queryClient.invalidateQueries({ queryKey: ["files", parkingId] });
        toast.success(t.files.proposed(r.files.length));
        setToolState("files");
      } else {
        toast.success(t.auto.done(r.view.spots.length));
        setToolState("spots");
      }
      const bounds = boundsOf(r.outline.coordinates[0]);
      if (bounds) mapRef.current?.fitTo(bounds);
    } catch (e) {
      toast.error(
        e instanceof NoParcelError
          ? t.auto.noParcel
          : `${t.auto.failed} ${describeError(e)}`,
        { duration: 10000 },
      );
    } finally {
      // The pass also laid spots and files: going back past it would undo only half of it.
      history.current.clear();
      setAuto(null);
    }
  }
  useEffect(() => {
    if (!autoRun || autoStarted.current) return;
    autoStarted.current = true;
    void runAutoPass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  // S-C: the files proposed from the plan. Valet spots already there give their files at once;
  // otherwise the automatic pass draws the comb first ("valetEdge", as the help text promises,
  // whatever layout the plan stored).
  async function proposeFiles() {
    if (busy || auto) return;
    if (
      files.length &&
      !(await confirm(t.files.proposeReplaces, { title: t.files.propose }))
    )
      return;
    if (!spots.some((sp) => sp.active && sp.depth != null)) {
      setLayout("valetEdge");
      await runAutoPass("valetEdge");
      return;
    }
    setBusy(true);
    const before = files.map(fileInput);
    try {
      const { data } = await adminApi.filesFromPlan(parkingId);
      history.current.record({ files: before }, Date.now());
      void queryClient.invalidateQueries({ queryKey: ["files", parkingId] });
      toast.success(t.files.proposed(data.length));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  // ---- Contour: parcels, address, drawing -----------------------------------------------------
  function outlineFrom(list: ParcelRef[]): GeoPolygon | null {
    const polygons = list.flatMap((p) =>
      p.geometry ? polygonsOf(p.geometry) : [],
    );
    if (!polygons.length) return null;
    return unionPolygons(polygons, estimateFrame(polygons[0]))[0] ?? null;
  }
  async function toggleParcelAt(lngLat: LonLat) {
    setParcelBusy(true);
    setMessage(fr.capacity.parcelLoading);
    try {
      const { parcels: found } = await adminApi.parcelsAt(lngLat[0], lngLat[1]);
      if (!found.length) {
        setMessage(fr.capacity.parcelNone);
        return;
      }
      const hit = found[0];
      const current = studyRef.current.parcels;
      const list = current.some((p) => p.id === hit.id)
        ? current.filter((p) => p.id !== hit.id)
        : [...current, hit];
      update({
        parcels: list,
        outline: outlineFrom(list),
        settings: { ...study.settings, outlineSource: "parcels" },
      });
      setMessage(null);
    } catch (e) {
      setMessage(describeError(e));
    } finally {
      setParcelBusy(false);
    }
  }
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || results?.some((r) => r.label === q)) return;
    const point = parseLatLon(q);
    if (point) {
      setResults([point]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults((await adminApi.geocode(q)).results);
      } catch (e) {
        setResults([]);
        setMessage(describeError(e));
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  function goTo(r: GeocodeResult) {
    setQuery(r.label);
    setResults(null);
    mapRef.current?.flyTo([r.lon, r.lat], 18);
  }
  async function clearOutline() {
    if (!(await confirm(t.contour.clearConfirm, { destructive: true }))) return;
    update({
      outline: null,
      parcels: [],
      zones: [],
      exclusions: [],
      landmarks: [],
      settings: {
        ...study.settings,
        outlineSource: undefined,
        ignBuildingsSynced: false,
        zonesAuto: true,
      },
    });
    showAddress();
    if (spots.length)
      void adminApi
        .replaceSpots(parkingId, plan.layout ?? layout, [])
        .then(({ data }) => onView(data));
  }

  // ---- Brushes --------------------------------------------------------------------------------
  function onPaintStroke(points: LonLat[]) {
    if (!frame || (tool !== "parking" && tool !== "passage")) return;
    const ctx = { frame, outline, name: fr.capacity.zoneName, newId };
    const area = strokeArea(points, brushWidth, ctx);
    const next =
      tool === "parking"
        ? paintZones(zones, area, ctx)
        : eraseZones(zones, area, ctx);
    if (next !== zones) update({ zones: next, settings: manual });
  }
  async function askClaude() {
    if (suggesting) return;
    setSuggesting(true);
    setSuggestion(null);
    try {
      await flush();
      setSuggestion(
        await suggest({ allowGrass: settings.suggestGrass !== false }),
      );
    } catch (e) {
      const reason =
        e instanceof ApiError && e.code === "ai_failed"
          ? (e.details as { reason?: string } | undefined)?.reason
          : undefined;
      toast.error(
        reason ? `${describeError(e)} (${reason})` : describeError(e),
        { duration: 12000 },
      );
    } finally {
      setSuggesting(false);
    }
  }
  function applySuggestion() {
    if (!suggestion || !frame) return;
    const ctx = { frame, outline, name: fr.capacity.zoneName, newId };
    const before = zonesAuto ? [] : zones;
    const next = suggestion.zones.reduce(
      (acc, z) => paintZones(acc, polygonToMulti(frame, z.geometry), ctx),
      before,
    );
    update({ zones: next, settings: manual });
    toast.success(
      fr.capacity.suggestion.applied(suggestion.zones.length, next.length),
    );
    setSuggestion(null);
  }

  // ---- Obstacles and landmarks ----------------------------------------------------------------
  const selected = selectedExclusion
    ? (exclusions.find((e) => e.id === selectedExclusion) ?? null)
    : null;
  function addExclusion(kind: ExclusionKind, geometry: Exclusion["geometry"]) {
    const exclusion: Exclusion = {
      id: newId(),
      name: fr.capacity.exclusionKinds[kind],
      kind,
      clearance: EXCLUSION_DEFAULTS[kind].clearance,
      geometry,
    };
    update({ exclusions: [...exclusions, exclusion] });
    setSelectedExclusion(exclusion.id);
  }
  function patchExclusion(id: string, patch: Partial<Exclusion>) {
    update({
      exclusions: exclusions.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }
  function removeExclusion(id: string) {
    update({ exclusions: exclusions.filter((e) => e.id !== id) });
    if (selectedExclusion === id) setSelectedExclusion(null);
  }
  function hitExclusion(lngLat: LonLat): Exclusion | null {
    if (!frame) return null;
    const p = frame.forward(lngLat);
    for (const e of [...exclusions].reverse()) {
      const shape = shapes.get(e.id);
      if (shape && pointInMulti(p, shape.multi)) return e;
      if (
        e.geometry.type === "Point" &&
        distanceM(e.geometry.coordinates, lngLat, study.scaleFactor) <= HIT_M
      )
        return e;
    }
    return null;
  }
  function placeLandmark(kind: LandmarkKind, geometry: GeoPoint) {
    const landmark: Landmark = { id: newId(), kind, geometry };
    update({
      landmarks: [...landmarks.filter((l) => l.kind !== kind), landmark],
    });
  }

  // ---- Spots ----------------------------------------------------------------------------------
  // Without a zone the engine does not run: its last result is not the plan's any more.
  const result = zones.length ? estimate.result : null;
  const computing = estimate.computing && zones.length > 0;
  const counts = result?.totals;
  async function generate() {
    if (!result || !frame) return;
    if (spots.length && !(await confirm(tp.regenerateConfirm))) return;
    const slotLength = (
      layout === "selfPark" ? settings.selfParkSlot : settings.valetSlot
    ).length;
    const list = spotsFromLayout(result, zones, layout, frame, slotLength);
    setBusy(true);
    try {
      await flush();
      const { data } = await adminApi.replaceSpots(parkingId, layout, list);
      onView(data);
      toast.success(tp.generated(data.spots.length));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  }
  async function patchSpot(
    spot: Spot,
    patch: { active?: boolean; kind?: SpotKind },
  ) {
    const before = view.spots;
    const next = before.map((s) => (s.id === spot.id ? { ...s, ...patch } : s));
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
  }
  async function applyCapacity() {
    setBusy(true);
    try {
      const { data } = await adminApi.applyPlanCapacity(parkingId);
      onView(data);
      toast.success(tp.capacityApplied(data.totalCapacity));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  // ---- Map interactions -----------------------------------------------------------------------
  const drawMode: DrawKind | null =
    tool === "contour"
      ? contourMode === "draw" || contourMode === "cut"
        ? "polygon"
        : null
      : tool === "obstacle" && obstacleKind
        ? (
            {
              Polygon: "polygon",
              LineString: "linestring",
              Point: "point",
            } as const
          )[EXCLUSION_DEFAULTS[obstacleKind].geometry]
        : tool === "landmark" && landmarkKind
          ? "point"
          : (tool === "spots" && rowArmed) || (tool === "files" && fileArmed)
            ? "linestring"
            : null;
  const editPolygon: GeoPolygon | null =
    tool === "contour" && contourMode === "edit"
      ? outline
      : tool === "obstacle" && selected?.geometry.type === "Polygon"
        ? selected.geometry
        : null;
  const paint =
    tool === "parking" || tool === "passage"
      ? {
          widthM: brushWidth,
          mode: tool === "parking" ? ("paint" as const) : ("erase" as const),
        }
      : null;
  // P-B: a line, a polygon or a point being placed, or a brush stroke under way.
  const drawing = drawMode != null || painting;
  const collapsed = drawing || !paletteOpen;

  function onMapClick(lngLat: LonLat) {
    if (auto) return;
    if (tool === "contour" && contourMode === "parcel") {
      if (!parcelBusy) void toggleParcelAt(lngLat);
    } else if (tool === "obstacle" && !obstacleKind) {
      setSelectedExclusion(hitExclusion(lngLat)?.id ?? null);
    } else if (tool === "files" && !fileArmed) {
      setSelectedFile(nearestFile(files, lngLat)?.id ?? null);
    } else if (tool === "spots" && !busy && !rowArmed) {
      const hit = spots.find((s) => pointInRing(lngLat, s.geometry));
      if (!hit) return;
      if (spotTool === "toggle") void patchSpot(hit, { active: !hit.active });
      else if (spotTool === "delete") void removeSpot(hit);
      else if (hit.kind !== spotKind) void patchSpot(hit, { kind: spotKind });
    }
  }
  function onDrawn(geometry: Exclusion["geometry"]) {
    if (tool === "contour" && geometry.type === "Polygon") {
      if (contourMode === "draw")
        update({
          outline: { type: "Polygon", coordinates: [geometry.coordinates[0]] },
          parcels: [],
          settings: { ...study.settings, outlineSource: "drawn" },
        });
      else if (contourMode === "cut" && outline) {
        const rest = subtractFromOutline(
          outline,
          geometry,
          estimateFrame(outline),
        );
        if (rest)
          update({
            outline: rest,
            settings: {
              ...study.settings,
              outlineSource:
                settings.outlineSource === "drawn" ? "drawn" : "edited",
            },
          });
      }
      setContourMode("parcel");
    } else if (tool === "obstacle" && obstacleKind) {
      addExclusion(obstacleKind, geometry);
      // A point obstacle (tree, post) is placed several times in a row; a shape once.
      if (geometry.type !== "Point") setObstacleKind(null);
    } else if (
      tool === "landmark" &&
      landmarkKind &&
      geometry.type === "Point"
    ) {
      placeLandmark(landmarkKind, geometry);
      setTimeout(() => setLandmarkKind(null), 0);
    } else if (tool === "spots" && rowArmed && geometry.type === "LineString") {
      void addRow(geometry.coordinates);
    } else if (
      tool === "files" &&
      fileArmed &&
      geometry.type === "LineString"
    ) {
      addFile(geometry.coordinates);
    }
  }
  // S-C (07/10/2026): a drawn line becomes a file; its capacity follows the length at one car each.
  function addFile(line: LonLat[]) {
    setFileArmed(false);
    const capacity = capacityOf(line, settings.valetSlot.length);
    if (lineLengthTooShort(line, settings.valetSlot.length)) {
      toast.error(t.files.tooShort);
      return;
    }
    const code = nextFileCode(files);
    const before = files.map(fileInput);
    saveFiles.mutate(
      [...before, { code, capacity, geometry: line, sortOrder: files.length }],
      {
        onSuccess: () => {
          history.current.record({ files: before }, Date.now());
          toast.success(t.files.added(code, capacity));
        },
      },
    );
  }
  function patchFile(id: string, patch: Partial<FileInput>) {
    const before = files.map(fileInput);
    saveFiles.mutate(
      files.map((f) =>
        f.id === id ? { ...fileInput(f), ...patch } : fileInput(f),
      ),
      {
        onSuccess: () => history.current.record({ files: before }, Date.now()),
      },
    );
  }
  async function removeFile(f: ParkingFile) {
    if (filesOccupied.has(f.id)) {
      toast.error(t.files.occupied);
      return;
    }
    if (!(await confirm(t.files.removeConfirm(f.code), { destructive: true })))
      return;
    const before = files.map(fileInput);
    saveFiles.mutate(files.filter((x) => x.id !== f.id).map(fileInput), {
      onSuccess: () => history.current.record({ files: before }, Date.now()),
    });
    if (selectedFile === f.id) setSelectedFile(null);
  }
  // P-B (07/10/2026): the spots of a drawn row are laid at once and kept through regenerations.
  async function addRow(line: LonLat[]) {
    if (!frame) return;
    const list = rowAlong(
      line,
      frame,
      settings.valetSlot.width,
      settings.valetSlot.length,
      zones,
      spots,
    );
    setRowArmed(false);
    if (!list.length) {
      toast.message(t.spots.rowTooShort);
      return;
    }
    setBusy(true);
    try {
      const { data } = await adminApi.addSpots(parkingId, list);
      onView(data);
      toast.success(t.spots.rowAdded(list.length));
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  }
  async function removeSpot(spot: Spot) {
    if (!spot.manual) {
      void patchSpot(spot, { active: false });
      return;
    }
    setBusy(true);
    try {
      const { data } = await adminApi.deleteSpot(parkingId, spot.id);
      onView(data);
      toast.success(t.spots.removed);
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      setBusy(false);
    }
  }
  function onEditPolygon(polygon: GeoPolygon) {
    if (tool === "contour")
      update({
        outline: polygon,
        settings: {
          ...study.settings,
          outlineSource:
            settings.outlineSource === "drawn" ? "drawn" : "edited",
        },
      });
    else if (selected) patchExclusion(selected.id, { geometry: polygon });
  }

  const focus =
    tool === "contour" ? "land" : tool === "spots" ? "spots" : "zones";
  const layers = useMemo(
    () =>
      planLayers({
        plan,
        parcels: study.parcels,
        showParcels: tool === "contour",
        shapes,
        selectedExclusion,
        spots,
        preview:
          tool === "spots" && result ? { estimate: result, layout } : null,
        suggestion,
        focus,
      }).concat(fileLayers(files, tool === "files" ? selectedFile : null)),
    [
      files,
      selectedFile,
      plan,
      study.parcels,
      tool,
      shapes,
      selectedExclusion,
      spots,
      result,
      layout,
      suggestion,
      focus,
    ],
  );
  const addressKey = address?.join(",");
  const labels = useMemo(
    () => [
      ...planLabels(plan, study.scaleFactor, areas, focus),
      ...fileLabels(files),
      ...(address
        ? [
            {
              id: "parking-address",
              lngLat: address,
              text: t.addressPin,
              variant: "address" as const,
            },
          ]
        : []),
    ],
    // The address is read through its key: a new array each render is the same point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, study.scaleFactor, areas, focus, files, addressKey],
  );
  const snapTo = useMemo(
    () => snapTargets(outline, study.parcels, shapes),
    [outline, study.parcels, shapes],
  );
  // The map is fitted once, on the plan as it was opened.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialBounds = useMemo(() => homeBounds(), []);

  // ---- The count on top -----------------------------------------------------------------------
  const estimated = counts?.[layout] ?? null;
  const filesCapacity = files.reduce(
    (n, f) => n + (f.active ? f.capacity : 0),
    0,
  );
  const headline = files.length
    ? t.files.headline(files.filter((f) => f.active).length, filesCapacity)
    : spots.length
      ? t.count(view.activeSpots)
      : estimated != null
        ? t.count(estimated)
        : outline
          ? computing
            ? tp.computing
            : t.count(0)
          : t.noOutlineYet;
  const subline = files.length
    ? t.files.subline
    : spots.length
      ? `${t.countGenerated(view.activeSpots, spots.length)} · ${tp.layouts[plan.layout ?? layout]}`
      : estimated != null
        ? `${t.countEstimated} · ${tp.layouts[layout]}`
        : "";
  const inSync =
    view.activeSpots > 0 && view.activeSpots === view.totalCapacity;

  const help = (() => {
    if (tool === "spots" && rowArmed) return t.spots.rowHelp;
    if (tool === "files" && fileArmed) return t.files.drawHelp;
    if (tool === "spots" && spotTool === "delete") return t.spots.removeHelp;
    if (tool === "contour")
      return contourMode === "draw"
        ? t.contour.drawHelp
        : contourMode === "edit"
          ? t.contour.editHelp
          : contourMode === "cut"
            ? t.contour.cutHelp
            : t.toolHelp.contour;
    if (tool === "obstacle" && obstacleKind) {
      const g = EXCLUSION_DEFAULTS[obstacleKind].geometry;
      return g === "Polygon"
        ? t.obstacle.drawPolygon
        : g === "LineString"
          ? t.obstacle.drawLine
          : t.obstacle.drawPoint;
    }
    if (tool === "landmark" && landmarkKind)
      return t.landmark.placeHelp(tp.landmarkKinds[landmarkKind]);
    return t.toolHelp[tool];
  })();

  const chip = (
    label: string,
    active: boolean,
    onClick: () => void,
    swatch?: string,
    disabled = false,
  ) => (
    <button
      key={label}
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 border px-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-lime-deep bg-primary text-primary-foreground"
          : "border-border hover:bg-accent",
      )}
    >
      {swatch && <span className="h-3 w-3" style={{ background: swatch }} />}
      {label}
    </button>
  );

  // ---- Tool cards -----------------------------------------------------------------------------
  function contourCard() {
    const c = t.contour;
    const parcelIds = study.parcels
      .map(
        (p) => `${p.section.replace(/^0+/, "")} ${p.numero.replace(/^0+/, "")}`,
      )
      .join(" + ");
    return (
      <>
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr.capacity.addressPlaceholder}
            aria-label={fr.capacity.address}
            className="h-10 w-full border border-border bg-background px-3 text-sm"
          />
          {results && query.trim().length >= 3 && (
            <ul className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto border border-border bg-card shadow-lg">
              {searching && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  {fr.capacity.searching}
                </li>
              )}
              {!searching && results.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  {fr.capacity.noResult}
                </li>
              )}
              {results.map((r) => (
                <li key={`${r.lon},${r.lat}`}>
                  <button
                    type="button"
                    onClick={() => goTo(r)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="text-sm">
          {outline ? (
            <>
              <b>
                {settings.outlineSource === "drawn" || !study.parcels.length
                  ? c.drawn
                  : c.parcels(parcelIds)}
              </b>
              <span className="ml-2 font-mono text-muted-foreground">
                {c.area(m2.format(areaM2(outline, study.scaleFactor)))}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {message ?? fr.capacity.noOutline}
            </span>
          )}
          {outline && message && (
            <div className="text-muted-foreground">{message}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip(c.draw, contourMode === "draw", () =>
            setContourMode(contourMode === "draw" ? "parcel" : "draw"),
          )}
          {chip(
            c.edit,
            contourMode === "edit",
            () => setContourMode(contourMode === "edit" ? "parcel" : "edit"),
            undefined,
            !outline,
          )}
          {chip(
            c.cut,
            contourMode === "cut",
            () => setContourMode(contourMode === "cut" ? "parcel" : "cut"),
            undefined,
            !outline,
          )}
        </div>
        {outline && (
          <button
            type="button"
            onClick={clearOutline}
            className="self-start text-xs text-muted-foreground underline hover:text-foreground"
          >
            {c.clear}
          </button>
        )}
      </>
    );
  }

  function brushCard() {
    const painting = tool === "parking";
    return (
      <>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">{t.brush.width}</span>
          {BRUSH_WIDTHS_M.map((w) =>
            chip(`${w} m`, brushWidth === w, () => setBrushWidth(w)),
          )}
        </div>
        {painting && (
          <div
            className="border-t border-border pt-2"
            data-testid="zone-suggestion"
          >
            {suggestion ? (
              <>
                <div className="font-bold">
                  {fr.capacity.suggestion.title(suggestion.zones.length)}
                </div>
                {suggestion.zones.length === 0 ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {fr.capacity.suggestion.none}
                  </p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-[13px]">
                    {suggestion.surfaces.map((s) => (
                      <li key={s.name} className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 border-2 border-dashed"
                          style={{ borderColor: PROPOSAL }}
                        />
                        <b>{s.name}</b>
                        <span className="text-muted-foreground">
                          {s.label} ·{" "}
                          {fr.capacity.suggestion.surfaces[
                            s.surface as keyof typeof fr.capacity.suggestion.surfaces
                          ] ?? s.surface}{" "}
                          ·{" "}
                          {fr.capacity.suggestion.confidence(
                            Math.round(s.confidence * 100),
                          )}
                        </span>
                        <span className="ml-auto font-mono">
                          {m2.format(s.area)} m²
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex gap-2">
                  {suggestion.zones.length > 0 && (
                    <ToolButton
                      variant="primary"
                      className="min-h-9"
                      onClick={applySuggestion}
                    >
                      {fr.capacity.suggestion.apply}
                    </ToolButton>
                  )}
                  <ToolButton
                    className="min-h-9"
                    onClick={() => setSuggestion(null)}
                  >
                    {fr.capacity.suggestion.dismiss}
                  </ToolButton>
                </div>
              </>
            ) : (
              <>
                <ToolButton
                  className="min-h-9 w-full"
                  disabled={suggesting || !outline}
                  onClick={() => void askClaude()}
                >
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  {suggesting ? fr.capacity.suggesting : fr.capacity.suggest}
                </ToolButton>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.suggestGrass !== false}
                    onChange={(e) =>
                      update({
                        settings: {
                          ...study.settings,
                          suggestGrass: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 accent-[#A3E635]"
                  />
                  {fr.capacity.suggestGrass}
                </label>
              </>
            )}
          </div>
        )}
        <div className="border-t border-border pt-2 text-[13px]">
          <div className="flex items-center justify-between">
            <b>{t.brush.zones(zones.length)}</b>
            {!zonesAuto && outline && (
              <button
                type="button"
                onClick={() => applyAutoZones(zones)}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                {fr.capacity.autoZones}
              </button>
            )}
          </div>
          {zonesAuto && (
            <p className="text-muted-foreground">{t.brush.autoHelp}</p>
          )}
          <ul className="mt-1 max-h-40 overflow-y-auto">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-2 py-0.5">
                <span className="h-3 w-3 bg-primary" />
                <span>{z.name}</span>
                <span className="ml-auto font-mono text-muted-foreground">
                  {m2.format(areas.get(z.id) ?? 0)} m²
                </span>
                <button
                  type="button"
                  aria-label={`${t.brush.removeZone} ${z.name}`}
                  title={t.brush.removeZone}
                  onClick={() =>
                    update({
                      zones: zones.filter((x) => x.id !== z.id),
                      settings: manual,
                    })
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  function obstacleCard() {
    const o = t.obstacle;
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {OBSTACLE_KINDS.map((k) =>
            chip(
              fr.capacity.exclusionKinds[k],
              obstacleKind === k,
              () => {
                setObstacleKind(obstacleKind === k ? null : k);
                setSelectedExclusion(null);
              },
              EXCLUSION_COLORS[k],
            ),
          )}
        </div>
        {selected && (
          <div className="border border-lime-deep p-2 text-sm">
            <div className="flex items-center justify-between">
              <b>
                {fr.capacity.exclusionKinds[selected.kind]}
                {selected.source === "ign" && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({o.ign})
                  </span>
                )}
              </b>
              <span className="font-mono text-muted-foreground">
                {m2.format(shapes.get(selected.id)?.area ?? 0)} m²
              </span>
            </div>
            <label className="mt-1 flex items-center justify-between gap-2">
              <span>{o.clearance}</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={selected.clearance}
                onChange={(e) =>
                  patchExclusion(selected.id, {
                    clearance: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="h-8 w-20 border border-border bg-background px-2 text-right font-mono"
              />
            </label>
            <ToolButton
              className="mt-2 min-h-8 w-full"
              onClick={() => removeExclusion(selected.id)}
            >
              {o.remove}
            </ToolButton>
          </div>
        )}
        <div className="text-[13px] text-muted-foreground">
          {o.list(exclusions.length)}
        </div>
      </>
    );
  }

  function landmarkCard() {
    const l = t.landmark;
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {LANDMARK_KINDS.map((k) =>
            chip(
              tp.landmarkKinds[k],
              landmarkKind === k,
              () => setLandmarkKind(landmarkKind === k ? null : k),
              LANDMARK_COLORS[k],
            ),
          )}
        </div>
        <div className="text-[13px]">
          <b>{l.placed}</b>
          {landmarks.length === 0 ? (
            <p className="text-muted-foreground">{l.none}</p>
          ) : (
            <ul className="mt-1">
              {landmarks.map((lm) => (
                <li key={lm.id} className="flex items-center gap-2 py-0.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: LANDMARK_COLORS[lm.kind] }}
                  />
                  {tp.landmarkKinds[lm.kind]}
                  <button
                    type="button"
                    aria-label={`${l.remove} ${tp.landmarkKinds[lm.kind]}`}
                    onClick={() =>
                      update({
                        landmarks: landmarks.filter((x) => x.id !== lm.id),
                      })
                    }
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  }

  // S-C (07/10/2026): the files of the parking: draw one, correct its capacity, drop it.
  function filesCard() {
    const f = t.files;
    const drawButton = (
      <ToolButton
        className="min-h-9 w-full"
        active={fileArmed}
        aria-pressed={fileArmed}
        disabled={!outline || saveFiles.isPending}
        onClick={() => setFileArmed((a) => !a)}
      >
        {f.draw}
      </ToolButton>
    );
    const proposing = auto !== null || busy;
    return (
      <>
        {drawButton}
        {files.length === 0 && (
          <p className="text-sm text-muted-foreground">{f.none}</p>
        )}
        <div className="flex flex-col gap-1">
          <ToolButton
            className="min-h-9 w-full"
            disabled={!outline || proposing || filesOccupied.size > 0}
            onClick={() => void proposeFiles()}
            title={filesOccupied.size > 0 ? f.occupied : undefined}
          >
            {proposing && (
              <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
            )}
            {f.propose}
          </ToolButton>
          <p className="text-xs text-muted-foreground">{f.proposeHelp}</p>
        </div>
        {files.length > 0 && (
          <ul
            className="flex flex-col divide-y divide-border text-sm"
            data-testid="file-list"
          >
            {files.map((file) => (
              <li
                key={file.id}
                data-testid={`file-${file.code}`}
                className={cn(
                  "flex items-center gap-2 py-1.5",
                  selectedFile === file.id && "bg-primary/20",
                )}
                onMouseEnter={() => setSelectedFile(file.id)}
              >
                <input
                  aria-label={f.code}
                  defaultValue={file.code}
                  maxLength={8}
                  className="h-8 w-16 border border-border bg-background px-1 font-mono text-sm font-bold uppercase"
                  onBlur={(e) => {
                    const code = e.target.value.trim().toUpperCase();
                    if (!code || code === file.code) return;
                    if (
                      files.some((x) => x.id !== file.id && x.code === code)
                    ) {
                      toast.error(f.duplicate);
                      e.target.value = file.code;
                      return;
                    }
                    patchFile(file.id, { code });
                  }}
                />
                <input
                  aria-label={f.capacity}
                  type="number"
                  min={1}
                  max={200}
                  defaultValue={file.capacity}
                  className="h-8 w-16 border border-border bg-background px-1 font-mono text-sm"
                  onBlur={(e) => {
                    const capacity = Math.max(
                      1,
                      Math.min(200, Number(e.target.value) || 1),
                    );
                    if (capacity !== file.capacity)
                      patchFile(file.id, { capacity });
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {f.capacity}
                </span>
                <button
                  type="button"
                  aria-label={`${f.remove} ${file.code}`}
                  className="ml-auto p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
                  disabled={filesOccupied.has(file.id)}
                  title={filesOccupied.has(file.id) ? f.occupied : f.remove}
                  onClick={() => void removeFile(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && (
          <Link
            to="/parking/occupation"
            className="text-sm font-semibold text-lime-deep underline-offset-2 hover:underline"
          >
            {f.occupation}
          </Link>
        )}
      </>
    );
  }
  function spotsCard() {
    const s = t.spots;
    const manualCount = spots.filter((sp) => sp.manual).length;
    const rowButton = (
      <ToolButton
        className="min-h-9 w-full"
        active={rowArmed}
        aria-pressed={rowArmed}
        disabled={!outline || busy}
        onClick={() => setRowArmed((a) => !a)}
      >
        {s.row}
      </ToolButton>
    );
    if (!zones.length)
      return (
        <>
          <p className="text-sm text-muted-foreground">{s.needZones}</p>
          {rowButton}
        </>
      );
    const stayCounts: Record<StayClass, number> = {
      short: 0,
      medium: 0,
      long: 0,
    };
    for (const sp of spots)
      if (sp.active && sp.stayClass) stayCounts[sp.stayClass] += 1;
    const hasStay = stayCounts.short + stayCounts.medium + stayCounts.long > 0;
    const n = counts?.[layout] ?? 0;
    return (
      <>
        <div
          role="radiogroup"
          aria-label={s.layout}
          className="flex flex-col gap-1"
        >
          {LAYOUT_KEYS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-2 border px-2 text-sm",
                layout === key
                  ? "border-lime-deep bg-primary/20"
                  : "border-border hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name="layout"
                value={key}
                checked={layout === key}
                onChange={() => setLayout(key)}
                className="accent-[#A3E635]"
              />
              <span className="flex-1">{tp.layouts[key]}</span>
              <span className="font-mono font-bold">
                {counts ? tp.places(counts[key]) : "…"}
              </span>
            </label>
          ))}
        </div>
        <ToolButton
          variant="primary"
          className="min-h-10 w-full"
          disabled={!result || computing || busy || n === 0}
          onClick={() => void generate()}
        >
          {spots.length ? s.regenerate(n) : s.generate(n)}
        </ToolButton>
        {rowButton}
        {spots.length > 0 && (
          <>
            <div className="border-t border-border pt-2 text-[13px]">
              <b>{s.adjust}</b>
              {manualCount > 0 && (
                <span className="ml-2 text-muted-foreground">
                  {s.manualCount(manualCount)}
                </span>
              )}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {chip(tp.tools.toggle, spotTool === "toggle", () =>
                  setSpotTool("toggle"),
                )}
                {chip(s.remove, spotTool === "delete", () =>
                  setSpotTool("delete"),
                )}
                {SPOT_KINDS.map((k) =>
                  chip(
                    tp.spotKinds[k],
                    spotTool === "kind" && spotKind === k,
                    () => {
                      setSpotTool("kind");
                      setSpotKind(k);
                    },
                    SPOT_KIND_COLORS[k],
                  ),
                )}
              </div>
            </div>
            {hasStay && (
              <div className="flex flex-wrap gap-3 text-[13px]">
                {STAY_CLASSES.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-3 w-3"
                      style={{ background: STAY_COLORS[c] }}
                    />
                    {tp.stayClasses[c]}{" "}
                    <span className="font-mono">{stayCounts[c]}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-2 text-[13px]">
              <div className="flex justify-between">
                <span>{tp.countDeclared}</span>
                <span className="font-mono font-bold">
                  {view.totalCapacity}
                </span>
              </div>
              {inSync ? (
                <p className="mt-1 text-muted-foreground">
                  {tp.capacityInSync}
                </p>
              ) : (
                <ToolButton
                  className="mt-1 min-h-9 w-full"
                  disabled={busy || view.activeSpots === 0}
                  onClick={() => void applyCapacity()}
                >
                  {tp.applyCapacity(view.activeSpots)}
                </ToolButton>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  const card =
    tool === "contour"
      ? contourCard()
      : tool === "parking" || tool === "passage"
        ? brushCard()
        : tool === "obstacle"
          ? obstacleCard()
          : tool === "landmark"
            ? landmarkCard()
            : tool === "files"
              ? filesCard()
              : spotsCard();
  const toolEnabled = (k: Tool) => k === "contour" || !!outline;
  const toolButton = (k: Tool) => {
    const Icon = TOOL_ICONS[k];
    return (
      <button
        key={k}
        type="button"
        aria-pressed={tool === k}
        disabled={!toolEnabled(k)}
        onClick={() => setTool(k)}
        className={cn(
          "flex min-h-[72px] flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.3px] disabled:cursor-not-allowed disabled:opacity-40",
          tool === k
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-5 w-5" />
        {t.tools[k]}
      </button>
    );
  };

  return (
    <div className="-mx-4 flex flex-col border-y border-border sm:-mx-6 lg:h-[calc(100vh-200px)] lg:min-h-[640px]">
      {/* Top bar: the count, the save state, the drawer and the reset menu. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-4 py-2 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-2xl font-bold text-lime-deep"
            data-testid="plan-count"
          >
            {headline}
          </span>
          <span className="text-sm text-muted-foreground">{subline}</span>
        </div>
        <span
          className={cn(
            "text-xs",
            saveState === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
          role="status"
          aria-live="polite"
        >
          {saveState === "saving"
            ? tp.saving
            : saveState === "saved"
              ? tp.saved
              : saveState === "error"
                ? tp.saveError
                : ""}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
            {t.settings}
          </button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={resetOpen}
              disabled={!outline}
              onClick={() => setResetOpen((o) => !o)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {tp.reset}
            </button>
            {resetOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-1 w-80 border border-border bg-card p-1 shadow-lg"
              >
                {(
                  [
                    ["all", tp.resetAll, tp.resetAllHelp],
                    ["files", tp.resetFiles, tp.resetFilesHelp],
                    ["zones", tp.resetZones, tp.resetZonesHelp],
                    ["spots", tp.resetSpots, tp.resetSpotsHelp],
                  ] as const
                ).map(([scope, label, helpText]) => (
                  <button
                    key={scope}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setResetOpen(false);
                      const before: Step =
                        scope === "files"
                          ? { files: files.map(fileInput) }
                          : scope === "all"
                            ? {
                                plan: planFields(planRef.current),
                                files: files.map(fileInput),
                              }
                            : { plan: planFields(planRef.current) };
                      void onReset(scope).then((done) => {
                        // "Places seulement" only touches the spots: nothing to undo here.
                        if (done && scope !== "spots")
                          history.current.record(before, Date.now());
                        setTool(RESET_TOOL[scope]);
                        if (done && scope === "all") showAddress();
                      });
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {helpText}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* The toolbar: the three tools of the plan in files, the estimator's behind "Avancé". */}
        <nav
          aria-label={fr.parkingPlan.title}
          className="flex w-[92px] shrink-0 flex-col border-r border-border bg-card"
        >
          {PRIMARY_TOOLS.map(toolButton)}
          <button
            type="button"
            aria-expanded={advancedShown}
            aria-controls="plan-advanced-tools"
            onClick={() => {
              // Folding with an estimator tool in hand would keep the panel open (the tool
              // shows it): hand a primary tool over first.
              if (advancedShown && ADVANCED_TOOLS.includes(tool))
                setTool(outline ? "files" : "contour");
              setAdvancedOpen(!advancedShown);
            }}
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 border-t border-border px-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.3px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                advancedShown && "rotate-180",
              )}
            />
            {t.advanced}
          </button>
          {advancedShown && (
            <div
              id="plan-advanced-tools"
              className="flex flex-col border-t border-border"
            >
              {ADVANCED_TOOLS.map(toolButton)}
            </div>
          )}
        </nav>

        <div className="relative min-h-[55vh] min-w-0 flex-1 lg:min-h-0">
          <MapView
            ref={mapRef}
            layers={layers}
            labels={labels}
            showPhoto={showPhoto}
            initialBounds={initialBounds}
            rotatable
            initialBearing={bearing}
            onBearingChange={onBearingChange}
            editPolygon={editPolygon}
            midpoints
            onEditPolygon={onEditPolygon}
            drawMode={drawMode}
            onDrawn={onDrawn}
            snapTo={snapTo}
            paint={paint}
            onPaintStart={() => setPainting(true)}
            onPaintStroke={(points) => {
              setPainting(false);
              onPaintStroke(points);
            }}
            onMapClick={onMapClick}
            cursor={
              tool === "contour" && contourMode === "parcel"
                ? parcelBusy
                  ? "progress"
                  : "pointer"
                : drawMode
                  ? "crosshair"
                  : "pointer"
            }
            className="h-full w-full"
          >
            {/* The tool's card: its two or three options, and the help line. P-B: it folds into a
                bar by hand, and by itself while a line or a stroke is being drawn. */}
            <div
              className={cn(
                "absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] flex-col gap-2.5 bg-card/95 shadow-lg backdrop-blur-sm",
                collapsed
                  ? "w-auto px-3 py-2"
                  : "max-h-[calc(100%-24px)] w-[340px] overflow-y-auto p-3",
              )}
              data-testid="tool-card"
              data-collapsed={collapsed ? "true" : "false"}
            >
              <div className="flex items-center justify-between gap-3">
                {collapsed && !drawing ? (
                  <button
                    type="button"
                    onClick={togglePalette}
                    aria-label={t.palette.expand}
                    aria-expanded={false}
                    className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.5px]"
                  >
                    {t.tools[tool]}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <b className="text-sm uppercase tracking-[0.5px]">
                    {t.tools[tool]}
                  </b>
                )}
                <span className="flex items-center gap-3">
                  {(contourMode !== "parcel" ||
                    obstacleKind ||
                    landmarkKind ||
                    rowArmed ||
                    fileArmed) && (
                    <button
                      type="button"
                      onClick={() => {
                        setContourMode("parcel");
                        setObstacleKind(null);
                        setLandmarkKind(null);
                        setRowArmed(false);
                        setFileArmed(false);
                      }}
                      className="text-xs text-muted-foreground underline"
                    >
                      {t.contour.stop}
                    </button>
                  )}
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={togglePalette}
                      aria-label={t.palette.collapse}
                      aria-expanded
                      title={t.palette.collapse}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </div>
              {(!collapsed || drawing) && (
                <p className="max-w-[316px] text-[13px] text-muted-foreground">
                  {help}
                </p>
              )}
              {!collapsed && card}
            </div>
            {auto && (
              <div
                role="status"
                className="absolute left-1/2 top-3 z-20 w-[360px] max-w-[calc(100%-24px)] -translate-x-1/2 border border-lime-deep bg-card p-3 shadow-lg"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Loader2 className="h-4 w-4 animate-spin text-lime-deep" />
                  {t.auto.title}
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t.auto.intro}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {AUTO_STEPS.map((step) => {
                    const p = auto[step];
                    return (
                      <li key={step} className="flex items-center gap-2">
                        {p?.state === "done" ? (
                          <Check className="h-4 w-4 text-lime-deep" />
                        ) : p?.state === "running" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : p?.state === "skipped" ? (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="h-4 w-4 border border-border" />
                        )}
                        {t.auto.steps[step]}
                        {p?.note && (
                          <span className="ml-auto font-mono text-xs text-muted-foreground">
                            {p.note}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="absolute bottom-14 right-3 z-20 flex flex-col items-end gap-2 sm:bottom-9">
              {Math.abs(bearing) >= 0.5 && (
                <button
                  type="button"
                  onClick={() => mapRef.current?.rotateTo(0)}
                  aria-label={t.rotation.northUp}
                  title={t.rotation.northUp}
                  className={MAP_BUTTON}
                >
                  <Navigation2
                    className="h-4 w-4 text-lime-deep"
                    style={{ transform: `rotate(${-bearing}deg)` }}
                  />
                  <span className="hidden sm:inline">{t.rotation.north}</span>
                </button>
              )}
              {outline && (
                <button
                  type="button"
                  onClick={alignOnParking}
                  aria-label={t.rotation.align}
                  title={t.rotation.hint}
                  className={MAP_BUTTON}
                >
                  <RotateCw className="h-4 w-4 text-lime-deep" />
                  <span className="hidden sm:inline">{t.rotation.align}</span>
                </button>
              )}
              {(address || outline) && (
                <button
                  type="button"
                  onClick={recenter}
                  aria-label={t.recenter}
                  title={t.recenter}
                  className={MAP_BUTTON}
                >
                  <LocateFixed className="h-4 w-4 text-lime-deep" />
                  <span className="hidden sm:inline">{t.recenter}</span>
                </button>
              )}
            </div>
          </MapView>
          {settingsOpen && (
            <PlanSettings
              study={study}
              update={update}
              showPhoto={showPhoto}
              onShowPhoto={setShowPhoto}
              onIgnBuildings={setIgnBuildings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
