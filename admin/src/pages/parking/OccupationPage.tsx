import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MapView,
  type MapLabel,
  type MapLayer,
} from "@/components/capacity/MapView";
import { Aside, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { boundsOf, fc, feature, positionsOf } from "@/lib/capacity/mapData";
import {
  carIcons,
  filesOf,
  headingOf,
  manoeuvreStrip,
  ringCentroid,
} from "@/lib/plan/files";
import type { LonLat } from "@/lib/capacity/projection";
import { dateTimeShort, timeOf } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { pointInRing } from "@/lib/plan/numbering";
import {
  spotTone,
  type ArrivalToPlace,
  type OccupationBoard,
  type SpotState,
  type VehicleHit,
} from "@/lib/plan/occupation";
import type { LandmarkKind } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

const TONE_COLORS = {
  occupied: "#6ec071",
  leaving: "#A3E635",
  booked: "#5fd3ff",
  free: "#F3F3F0",
  inactive: "#6b6b66",
} as const;
const SELECTED = "#ff6600";
/** D-B (07/10/2026): the stay classes, in the plan's colours (Z-A), plus grey for a spot or a car without one. */
const STAY_COLORS = {
  short: "#fff3b0",
  medium: "#A3E635",
  long: "#b58900",
  none: "#9a9a94",
} as const;
type StayKey = keyof typeof STAY_COLORS;
type ViewMode = "state" | "stay";
const stayKeyOf = (s: SpotState): StayKey =>
  s.occupant ? (s.occupant.stayClass ?? "none") : (s.stayClass ?? "none");
/** O-A (06/10/2026): a car to take out before a return. */
const TO_TAKE_OUT = "#D97706";
/** The plate, name and return read on a spot from this zoom (a spot is about 5 m long). */
const SPOT_LABEL_MIN_ZOOM = 19;
const CAR_ICONS = carIcons({ ...TONE_COLORS, ...STAY_COLORS });
const LANDMARK_COLORS: Record<LandmarkKind, string> = {
  entrance: "#6ec071",
  exit: "#ff8a3d",
  handover: "#A3E635",
  shuttle_stop: "#5fd3ff",
  key_box: "#f3f3f0",
};

/** "Ouvrir la réservation" (C-A, 06/10/2026): the operational card, not a page change. */
function OpenBooking({ id }: { id: string }) {
  const card = useQuickCard();
  return (
    <button
      type="button"
      onClick={() => card.open(id)}
      className="flex min-h-9 items-center px-2 text-sm text-lime-deep underline"
    >
      {fr.occupation.openBooking}
    </button>
  );
}

/** A vehicle being placed: the next click on a free spot assigns it. */
type Choosing = { reservationId: string; plate: string } | null;

/**
 * Bloc 2, step "Occupation" (P-A, 04/10/2026): the plan in colours, the arrivals to place with a
 * suggested spot, and the search of a vehicle (plate, name, reference) showing its spot and keys.
 */
export default function OccupationPage() {
  const t = fr.occupation;
  const queryClient = useQueryClient();
  const { data: parking } = useQuery({
    queryKey: ["parking"],
    queryFn: adminApi.getParking,
  });
  const parkingId = parking?.id;
  const board = useQuery({
    queryKey: ["occupation", parkingId],
    queryFn: () => adminApi.getOccupation(parkingId!),
    enabled: !!parkingId,
    refetchInterval: 30_000,
  });
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<VehicleHit | null>(null);
  const [choosing, setChoosing] = useState<Choosing>(null);
  // D-B: the plan read by state (default) or by stay length.
  const [mode, setMode] = useState<ViewMode>("state");
  // O-A (06/10/2026): the arrival whose file is read on the plan (hovered or being placed).
  const [focusArrivalId, setFocusArrivalId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);
  const search = useQuery({
    queryKey: ["vehicle-search", parkingId, debounced],
    queryFn: () => adminApi.searchVehicles(parkingId!, debounced),
    enabled: !!parkingId && debounced.length >= 2,
  });
  // C-A (06/10/2026): "?focus=<reservation>" from a booking's card opens that vehicle's card at once.
  const [params, setParams] = useSearchParams();
  const focus = params.get("focus");
  useEffect(() => {
    if (!focus || !parkingId) return;
    let cancelled = false;
    (async () => {
      try {
        const booking = await adminApi.getReservation(focus);
        const hits = await adminApi.searchVehicles(
          parkingId,
          booking.reference,
        );
        const hit = hits.results.find((h) => h.id === focus) ?? null;
        if (cancelled) return;
        setQuery(booking.reference);
        if (hit) {
          setSelectedReservation(hit);
          setSelectedSpotId(hit.spotId);
        }
      } catch {
        // The booking is gone or not placeable: the page simply opens as usual.
      }
      if (!cancelled)
        setParams(
          (p) => {
            p.delete("focus");
            return p;
          },
          { replace: true },
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [focus, parkingId, setParams]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["occupation", parkingId] });
  const assign = useMutation({
    mutationFn: (input: {
      reservationId: string;
      plate: string;
      spotId: string | null;
      keyHook?: string | null;
      code?: string;
    }) =>
      adminApi.assignSpot(input.reservationId, {
        spotId: input.spotId,
        ...(input.keyHook !== undefined ? { keyHook: input.keyHook } : {}),
      }),
    onSuccess: ({ data }, input) => {
      refresh();
      setChoosing(null);
      if (input.spotId) {
        toast.success(
          t.placed(input.plate, data.spot?.code ?? input.code ?? ""),
        );
        setSelectedSpotId(input.spotId);
      } else if (
        input.keyHook !== undefined &&
        input.spotId === null &&
        input.code === "keys"
      )
        toast.success(t.keysSaved);
      else toast.success(t.released(input.plate));
      setSelectedReservation((r) =>
        r && r.id === input.reservationId
          ? {
              ...r,
              spotId: data.spotId ?? null,
              spot: data.spot,
              keyHook: data.keyHook ?? null,
            }
          : r,
      );
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError && e.code === "spot_taken"
          ? t.spotTaken
          : describeError(e),
      ),
  });

  const data = board.data;
  const spots = useMemo(() => data?.spots ?? [], [data]);
  const spotById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);
  const selectedSpot = selectedSpotId
    ? (spotById.get(selectedSpotId) ?? null)
    : null;

  const onMapClick = (lngLat: LonLat) => {
    const hit = spots.find((s) => pointInRing(lngLat, s.geometry));
    if (!hit) return;
    if (choosing) {
      if (!hit.active || hit.occupant) return toast.error(t.spotTaken);
      assign.mutate({
        reservationId: choosing.reservationId,
        plate: choosing.plate,
        spotId: hit.id,
        code: hit.code,
      });
      return;
    }
    setSelectedSpotId(hit.id);
    setSelectedReservation(null);
  };

  const files = useMemo(() => filesOf(spots), [spots]);
  const fileByKey = useMemo(
    () => new Map(files.map((f) => [f.key, f])),
    [files],
  );
  // The file marks of the focused arrival: its proposed spot, and the cars to take out.
  const fileFocus = useMemo(() => {
    const arrival =
      data?.arrivals.find(
        (a) => a.id === (focusArrivalId ?? choosing?.reservationId),
      ) ?? null;
    const best = arrival?.suggestions[0];
    if (!arrival || !best) return null;
    const spot = spots.find((s) => s.id === best.spotId);
    return {
      proposedId: best.spotId,
      fileKey: spot?.fileKey ?? null,
      takeOut: new Set((best.blocking ?? []).map((b) => b.spotCode)),
    };
  }, [data, spots, focusArrivalId, choosing]);
  const layers = useMemo<MapLayer[]>(() => {
    if (!data) return [];
    const list: MapLayer[] = [];
    const features = spots.map((s) =>
      feature(
        { type: "Polygon", coordinates: [s.geometry] },
        {
          color:
            s.id === selectedSpotId
              ? SELECTED
              : mode === "stay"
                ? STAY_COLORS[stayKeyOf(s)]
                : TONE_COLORS[spotTone(s)],
          free: spotTone(s) === "free",
          // By stay, a free spot shows its own zone a little stronger than the see-through default.
          freeOpacity: mode === "stay" && s.stayClass ? 0.3 : 0.12,
          active: s.active,
          selected: s.id === selectedSpotId,
        },
      ),
    );
    // O-A: the manoeuvring strips in front of every file (kept clear), under the spots.
    const strips = files
      .map(manoeuvreStrip)
      .filter((r): r is NonNullable<typeof r> => !!r);
    if (strips.length) {
      list.push({
        id: "manoeuvre-fill",
        type: "fill",
        data: fc(
          strips.map((ring) =>
            feature({ type: "Polygon", coordinates: [ring] }),
          ),
        ),
        paint: { "fill-color": "#FFFFFF", "fill-opacity": 0.18 },
      });
      list.push({
        id: "manoeuvre-line",
        type: "line",
        data: fc(
          strips.map((ring) =>
            feature({ type: "Polygon", coordinates: [ring] }),
          ),
        ),
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
          "line-opacity": 0.9,
        },
      });
    }
    // Free spots stay see-through so the photo reads; taken ones are solid.
    list.push({
      id: "spots-fill",
      type: "fill",
      data: fc(features),
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": [
          "case",
          ["get", "selected"],
          0.9,
          ["get", "free"],
          ["get", "freeOpacity"],
          ["get", "active"],
          0.7,
          0.08,
        ],
      },
    });
    list.push({
      id: "spots-line",
      type: "line",
      data: fc(features),
      paint: {
        "line-color": ["get", "color"],
        "line-opacity": ["case", ["get", "free"], 0.6, 1],
        "line-width": ["case", ["get", "selected"], 2.5, 1],
      },
    });
    // O-A: the file of the focused arrival: the proposed spot in orange, the cars to take out in amber.
    if (fileFocus) {
      const marked = spots.filter(
        (s) =>
          s.id === fileFocus.proposedId ||
          (fileFocus.takeOut.has(s.code) && s.fileKey === fileFocus.fileKey),
      );
      if (marked.length)
        list.push({
          id: "file-marks",
          type: "line",
          data: fc(
            marked.map((s) =>
              feature(
                { type: "Polygon", coordinates: [s.geometry] },
                {
                  color: s.id === fileFocus.proposedId ? SELECTED : TO_TAKE_OUT,
                  proposed: s.id === fileFocus.proposedId,
                },
              ),
            ),
          ),
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["get", "proposed"], 4, 3],
          },
        });
    }
    // The cars, nose towards the aisle, in the colour of their spot.
    const cars = spots.filter((s) => s.occupant && s.active);
    if (cars.length)
      list.push({
        id: "cars-icons",
        type: "symbol",
        data: fc(
          cars.map((s) =>
            feature(
              { type: "Point", coordinates: ringCentroid(s.geometry) },
              {
                icon: `car-${mode === "stay" ? stayKeyOf(s) : spotTone(s)}`,
                bearing: headingOf(
                  s,
                  s.fileKey ? fileByKey.get(s.fileKey) : undefined,
                ),
              },
            ),
          ),
        ),
        paint: { "icon-opacity": 0.95 },
        layout: {
          "icon-image": ["get", "icon"],
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            0.12,
            18,
            0.35,
            20,
            1.1,
            21,
            2.1,
          ],
        },
      });
    if (data.plan?.zones?.length)
      list.push({
        id: "zones",
        type: "line",
        data: fc(data.plan.zones.map((z) => feature(z.geometry))),
        paint: {
          "line-color": "#A3E635",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
        },
      });
    if (data.plan?.outline)
      list.push({
        id: "outline",
        type: "line",
        data: fc([feature(data.plan.outline)]),
        paint: { "line-color": "#A3E635", "line-width": 3 },
      });
    if (data.plan?.landmarks?.length) {
      list.push({
        id: "landmarks",
        type: "circle",
        data: fc(
          data.plan.landmarks.map((l) =>
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
    }
    // Where the cars stand (06/10/2026): the GPS fixes recorded by the travellers or the valets.
    const located = [
      ...data.arrivals,
      ...spots
        .map((s) => s.occupant)
        .filter((o): o is NonNullable<typeof o> => !!o),
    ].filter((o) => o.carLat != null && o.carLng != null);
    if (located.length)
      list.push({
        id: "cars",
        type: "circle",
        data: fc(
          located.map((o) =>
            feature(
              { type: "Point", coordinates: [o.carLng!, o.carLat!] },
              { color: o.carLocatedBy === "staff" ? "#1E5E2E" : "#FF6600" },
            ),
          ),
        ),
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
        },
      });
    return list;
  }, [data, spots, selectedSpotId, mode, files, fileByKey, fileFocus]);
  const labels = useMemo<MapLabel[]>(() => {
    const list: MapLabel[] = (data?.plan?.landmarks ?? []).map((l) => ({
      id: `lm-${l.id}`,
      lngLat: l.geometry.coordinates,
      text: fr.parkingPlan.landmarkKinds[l.kind],
      variant: "vertex" as const,
    }));
    // O-A: plate, name and return on every taken spot once close enough; the focused file reads at any zoom.
    for (const s of spots) {
      const o = s.occupant;
      if (!o || !s.active) continue;
      const inFocus =
        !!fileFocus && !!fileFocus.fileKey && s.fileKey === fileFocus.fileKey;
      list.push({
        id: `spot-${s.id}`,
        lngLat: ringCentroid(s.geometry),
        text: `${o.plate}\n${o.customerName}\n${t.returnOn(dateTimeShort(o.returnAt))}`,
        variant: "spot",
        minZoom: inFocus ? 0 : SPOT_LABEL_MIN_ZOOM,
      });
    }
    return list;
  }, [data, spots, fileFocus, t]);
  const initialBounds = useMemo(
    () =>
      boundsOf(
        positionsOf(
          (data?.plan?.outline as { coordinates?: unknown } | null)
            ?.coordinates,
        ),
      ),
    [data?.plan?.outline],
  );

  if (!parking || board.isLoading) {
    return (
      <>
        <ParkingTabs />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }
  if (board.error || !data) {
    return (
      <>
        <ParkingTabs />
        <p className="text-destructive">
          {describeError(board.error ?? new Error())}
        </p>
      </>
    );
  }

  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      {spots.length === 0 ? (
        <p className="rounded-none border border-border p-5 text-muted-foreground">
          {t.noPlan}{" "}
          <Link to="/parking/plan" className="text-lime-deep underline">
            {fr.parking.tabs.plan}
          </Link>
        </p>
      ) : (
        <div className="-mx-4 flex flex-col border-y border-border sm:-mx-6 lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-6 py-2 text-sm">
            <span
              className="font-mono font-bold"
              data-testid="occupation-stats"
            >
              {t.stats(
                data.stats.occupied,
                data.stats.active,
                data.stats.leavingToday,
              )}
            </span>
            <span
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label={t.mode.state + " / " + t.mode.stay}
            >
              {(["state", "stay"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-8 border px-2.5 text-[13px] font-semibold",
                    mode === m
                      ? "border-lime-deep bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {t.mode[m]}
                </button>
              ))}
            </span>
            {mode === "state" ? (
              (Object.keys(TONE_COLORS) as (keyof typeof TONE_COLORS)[]).map(
                (tone) => (
                  <span
                    key={tone}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <span
                      className="h-3 w-3"
                      style={{
                        background: TONE_COLORS[tone],
                        opacity: tone === "free" ? 0.5 : 1,
                      }}
                    />
                    {t.legend[tone]}
                  </span>
                ),
              )
            ) : (
              <>
                {(["short", "medium", "long"] as const).map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <span
                      className="h-3 w-3"
                      style={{ background: STAY_COLORS[c] }}
                    />
                    {t.stayLegend[c]}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-3 w-3"
                    style={{ background: STAY_COLORS.medium, opacity: 0.35 }}
                  />
                  {t.stayLegend.freeZone}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-3 w-3"
                    style={{ background: STAY_COLORS.none }}
                  />
                  {t.stayLegend.none}
                </span>
              </>
            )}
            {choosing && (
              <span className="ml-auto flex items-center gap-2 text-lime-deep">
                {t.choosing(choosing.plate)}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setChoosing(null)}
                >
                  {t.cancelChoice}
                </button>
              </span>
            )}
          </div>
          <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <MapView
              layers={layers}
              labels={labels}
              icons={CAR_ICONS}
              initialBounds={initialBounds}
              onMapClick={onMapClick}
              cursor={choosing ? "crosshair" : "pointer"}
              className="min-h-[55vh] min-w-0 flex-1 lg:min-h-0"
            />
            <Aside wide>
              <PanelLabel>{t.search}</PanelLabel>
              <input
                aria-label={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-11 w-full border border-lime-deep bg-card px-3 font-mono text-base uppercase text-foreground"
              />
              {debounced.length >= 2 && !selectedReservation && (
                <ul className="flex flex-col">
                  {(search.data?.results ?? []).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReservation(r);
                          setSelectedSpotId(r.spotId);
                        }}
                        className="flex min-h-11 w-full items-center gap-3 border-b border-border text-left hover:bg-accent"
                      >
                        <Plate value={r.plate} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {r.customerName}
                        </span>
                        <span className="font-mono text-sm font-bold text-lime-deep">
                          {r.spot?.code ?? "—"}
                        </span>
                      </button>
                    </li>
                  ))}
                  {search.data && search.data.results.length === 0 && (
                    <li className="py-2 text-sm text-muted-foreground">
                      {t.noResult}
                    </li>
                  )}
                </ul>
              )}

              {selectedReservation ? (
                <VehicleCard
                  hit={selectedReservation}
                  onClose={() => setSelectedReservation(null)}
                  onMove={() =>
                    setChoosing({
                      reservationId: selectedReservation.id,
                      plate: selectedReservation.plate,
                    })
                  }
                  onRelease={() =>
                    assign.mutate({
                      reservationId: selectedReservation.id,
                      plate: selectedReservation.plate,
                      spotId: null,
                    })
                  }
                  onKeys={(keyHook) =>
                    assign.mutate({
                      reservationId: selectedReservation.id,
                      plate: selectedReservation.plate,
                      spotId: selectedReservation.spotId,
                      keyHook,
                      code: "keys",
                    })
                  }
                />
              ) : selectedSpot ? (
                <SpotCard
                  spot={selectedSpot}
                  onMove={(o) =>
                    setChoosing({ reservationId: o.id, plate: o.plate })
                  }
                  onRelease={(o) =>
                    assign.mutate({
                      reservationId: o.id,
                      plate: o.plate,
                      spotId: null,
                    })
                  }
                />
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  {t.clickSpot}
                </p>
              )}

              <PanelLabel className="mt-2">
                {t.arrivals(data.arrivals.length)}
              </PanelLabel>
              {data.arrivals.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.noArrival}</p>
              )}
              <ul className="flex flex-col">
                {data.arrivals.map((a) => (
                  <ArrivalRow
                    key={a.id}
                    arrival={a}
                    busy={assign.isPending}
                    focused={
                      (focusArrivalId ?? choosing?.reservationId) === a.id
                    }
                    onFocus={setFocusArrivalId}
                    onPlace={(s) =>
                      assign.mutate({
                        reservationId: a.id,
                        plate: a.plate,
                        spotId: s.spotId,
                        code: s.code,
                      })
                    }
                    onChoose={() =>
                      setChoosing({ reservationId: a.id, plate: a.plate })
                    }
                  />
                ))}
              </ul>
            </Aside>
          </main>
        </div>
      )}
    </>
  );
}

function ArrivalRow({
  arrival,
  busy,
  focused,
  onFocus,
  onPlace,
  onChoose,
}: {
  arrival: ArrivalToPlace;
  busy: boolean;
  focused: boolean;
  onFocus: (id: string | null) => void;
  onPlace: (s: ArrivalToPlace["suggestions"][number]) => void;
  onChoose: () => void;
}) {
  const t = fr.occupation;
  const best = arrival.suggestions[0];
  return (
    <li
      className={cn(
        "flex flex-col gap-1.5 border-b border-border py-2",
        focused && "-mx-2 border-l-4 border-l-[#ff6600] bg-lime/10 px-2",
      )}
      data-testid={`arrival-${arrival.reference}`}
      onMouseEnter={() => onFocus(arrival.id)}
      onMouseLeave={() => onFocus(null)}
      onFocusCapture={() => onFocus(arrival.id)}
    >
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-lime-deep">
          {timeOf(arrival.arrivalAt)}
        </span>
        <Plate value={arrival.plate} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm">
          {arrival.customerName}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {best ? (
          <>
            <span className="text-lime-deep">{t.suggested(best.code)}</span>
            <span className="text-muted-foreground">
              {best.reason === "free"
                ? t.reason.free
                : t.reason[best.reason](best.distanceM ?? 0)}
              {best.stayClass ? ` · ${t.stayZone[best.stayClass]}` : ""}
            </span>
            {best.moves !== undefined && (
              <span
                data-testid="moves"
                className={best.moves === 0 ? "text-ok-text" : "text-warn-text"}
              >
                {movesLabel(best)}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{t.noSpot}</span>
        )}
        <span className="ml-auto flex gap-1.5">
          {best && (
            <ToolButton
              variant="primary"
              className="min-h-9"
              disabled={busy}
              onClick={() => onPlace(best)}
            >
              {t.place}
            </ToolButton>
          )}
          <ToolButton className="min-h-9" onClick={onChoose}>
            {t.chooseOnMap}
          </ToolButton>
        </span>
      </div>
    </li>
  );
}

/** O-A (06/10/2026): "sans déplacement", or the cars this choice would make the valet move. */
function movesLabel(s: ArrivalToPlace["suggestions"][number]): string {
  const t = fr.occupation;
  if (!s.moves) return t.noMove;
  const parts: string[] = [];
  if (s.blocking?.length)
    parts.push(
      t.movesOut(
        s.blocking.length,
        s.blocking[0].spotCode,
        dateTimeShort(s.blocking[0].returnAt),
      ),
    );
  if (s.blocked?.length)
    parts.push(t.movesBlocked(s.blocked.length, s.blocked[0].spotCode));
  return parts.join(" · ");
}

function SpotCard({
  spot,
  onMove,
  onRelease,
}: {
  spot: SpotState;
  onMove: (o: NonNullable<SpotState["occupant"]>) => void;
  onRelease: (o: NonNullable<SpotState["occupant"]>) => void;
}) {
  const t = fr.occupation;
  const o = spot.occupant;
  return (
    <div
      className="flex flex-col gap-2 border border-border p-3"
      data-testid="spot-card"
    >
      <div className="font-mono text-[34px] font-bold leading-none text-lime-deep">
        {spot.code}
      </div>
      <div className="text-[13px] text-muted-foreground">
        {t.rowIndex(spot.row, spot.index)} ·{" "}
        {fr.parkingPlan.spotKinds[spot.kind]}
      </div>
      {o ? (
        <>
          <div className="flex items-center gap-2.5">
            <Plate value={o.plate} />
            <span className="text-sm">{o.customerName}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {o.onSite
              ? t.returnOn(dateTimeShort(o.returnAt))
              : t.bookedFor(o.plate, dateTimeShort(o.arrivalAt))}
            {o.returnFlight ? ` · ${t.flight(o.returnFlight)}` : ""}
            {o.keyHook ? ` · ${t.keyHook} ${o.keyHook}` : ""}
          </div>
          {o.nights != null && o.stayClass && (
            <div
              className="text-sm text-muted-foreground"
              data-testid="spot-stay"
            >
              {t.stayLine(
                o.nights,
                t.stayLegend[o.stayClass],
                spot.stayClass ? t.stayZone[spot.stayClass] : null,
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <ToolButton className="min-h-9" onClick={() => onMove(o)}>
              {t.move}
            </ToolButton>
            <ToolButton className="min-h-9" onClick={() => onRelease(o)}>
              {t.release}
            </ToolButton>
            <OpenBooking id={o.id} />
          </div>
        </>
      ) : (
        <div className="text-sm">
          {spot.active ? t.freeSpot : fr.parkingPlan.legend.inactive}
        </div>
      )}
    </div>
  );
}

function VehicleCard({
  hit,
  onClose,
  onMove,
  onRelease,
  onKeys,
}: {
  hit: VehicleHit;
  onClose: () => void;
  onMove: () => void;
  onRelease: () => void;
  onKeys: (keyHook: string | null) => void;
}) {
  const t = fr.occupation;
  const [keys, setKeys] = useState(hit.keyHook ?? "");
  useEffect(() => setKeys(hit.keyHook ?? ""), [hit.keyHook]);
  return (
    <div
      className="flex flex-col gap-2 border border-lime-deep p-3"
      data-testid="vehicle-card"
    >
      <div className="flex items-center gap-2.5">
        <Plate value={hit.plate} />
        <span className="min-w-0 flex-1 truncate text-sm">
          {hit.customerName}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground underline"
        >
          {fr.common.close}
        </button>
      </div>
      <div
        className="font-mono text-[34px] font-bold leading-none text-lime-deep"
        data-testid="vehicle-spot"
      >
        {hit.spot?.code ?? t.noSpot}
      </div>
      <div className="text-sm text-muted-foreground">
        {fr.status[hit.status]} · {t.returnOn(dateTimeShort(hit.returnAt))}
        {hit.returnFlight ? ` · ${t.flight(hit.returnFlight)}` : ""}
      </div>
      {hit.carLat != null && hit.carLng != null && hit.carLocatedAt && (
        <div
          className="text-sm text-muted-foreground"
          data-testid="vehicle-car-position"
        >
          {t.carPosition(
            hit.carLocatedBy ?? "traveller",
            dateTimeShort(hit.carLocatedAt),
            hit.carAccuracyM ?? null,
          )}
          {hit.carNote ? ` · ${hit.carNote}` : ""}{" "}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${hit.carLat},${hit.carLng}&travelmode=walking`}
            target="_blank"
            rel="noreferrer"
            className="text-lime-deep underline"
          >
            {t.carDirections}
          </a>
        </div>
      )}
      <form
        className={cn("flex items-center gap-2 text-sm")}
        onSubmit={(e) => {
          e.preventDefault();
          onKeys(keys.trim() || null);
        }}
      >
        <label htmlFor="key-hook" className="text-muted-foreground">
          {t.keyHook}
        </label>
        <input
          id="key-hook"
          value={keys}
          onChange={(e) => setKeys(e.target.value)}
          placeholder={t.keyHookPlaceholder}
          maxLength={12}
          className="h-9 w-20 border border-border bg-card px-2 font-mono"
        />
        <ToolButton type="submit" className="min-h-9">
          {t.saveKeys}
        </ToolButton>
      </form>
      <div className="flex flex-wrap gap-1.5">
        <ToolButton variant="primary" className="min-h-9" onClick={onMove}>
          {hit.spot ? t.move : t.chooseOnMap}
        </ToolButton>
        {hit.spot && (
          <ToolButton className="min-h-9" onClick={onRelease}>
            {t.release}
          </ToolButton>
        )}
        <OpenBooking id={hit.id} />
      </div>
    </div>
  );
}
