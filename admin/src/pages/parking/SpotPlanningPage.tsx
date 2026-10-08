import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Aside, PanelLabel, ToolButton } from "@/components/capacity/ui";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import {
  addDays,
  dateTimeShort,
  localParts,
  shortDay,
  todayLocal,
} from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import {
  freeSpotsFor,
  type PlannedSpot,
  type PlannedStay,
  type SpotPlanning,
} from "@/lib/plan/spotPlanning";
import { cn } from "@/lib/utils";
import { FilesPlanningPage } from "./FilesPlanningPage";

const DAY_PX = 96;
const ROW_PX = 30;
const LABEL_PX = 112;
const COLORS = {
  onSite: "#6ec071",
  upcoming: "#5fd3ff",
  leaving: "#A3E635",
} as const;

/** Where an instant falls in the window, in days from its first midnight (parking time), clamped to [0, days]. */
function offsetDays(iso: string, from: string, days: number): number {
  const { date, time } = localParts(iso);
  const whole = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );
  const [h, m] = time.split(":").map(Number);
  return Math.min(days, Math.max(0, whole + (h * 60 + m) / 1440));
}

function tone(stay: PlannedStay, today: string): keyof typeof COLORS {
  if (stay.onSite)
    return localParts(stay.returnAt).date === today ? "leaving" : "onSite";
  return "upcoming";
}

/**
 * Bloc 2, step "Planning des places" (P-A, 04/10/2026): a Gantt with one line per spot, the stays
 * as bars, the load per day against the capacity, the bookings without a spot, and a one-click
 * pre-assignment. A click on a bar lets the staff move or release the vehicle.
 */
export default function SpotPlanningPage() {
  const t = fr.spotPlanning;
  const queryClient = useQueryClient();
  const today = todayLocal();
  const [from, setFrom] = useState(today);
  const [days, setDays] = useState(14);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: parking } = useQuery({
    queryKey: ["parking"],
    queryFn: adminApi.getParking,
  });
  const parkingId = parking?.id;
  // S-C (07/10/2026): a parking stored in files plans its files, not its spots.
  const filesBoard = useQuery({
    queryKey: ["files", parkingId],
    queryFn: () => adminApi.getFiles(parkingId!),
    enabled: !!parkingId,
    refetchInterval: 30_000,
  });
  const hasFiles = (filesBoard.data?.files.length ?? 0) > 0;
  const filesKnown = filesBoard.isSuccess || filesBoard.isError;
  const planning = useQuery({
    queryKey: ["spot-planning", parkingId, from, days],
    queryFn: () => adminApi.getSpotPlanning(parkingId!, from, days),
    enabled: !!parkingId && filesKnown && !hasFiles,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["spot-planning", parkingId] });
  const assign = useMutation({
    mutationFn: (input: {
      stay: PlannedStay;
      spotId: string | null;
      code?: string;
    }) => adminApi.assignSpot(input.stay.id, { spotId: input.spotId }),
    onSuccess: (_, input) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["occupation", parkingId] });
      toast.success(
        input.spotId
          ? t.moved(input.stay.plate, input.code ?? "")
          : t.released(input.stay.plate),
      );
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError && e.code === "spot_taken"
          ? t.spotTaken
          : describeError(e),
      ),
  });
  const preassign = useMutation({
    mutationFn: () => adminApi.preassignSpots(parkingId!, from, days),
    onSuccess: ({ data }) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["occupation", parkingId] });
      toast.success(t.preassigned(data.assigned.length, data.skipped.length));
    },
    onError: (e: Error) => toast.error(describeError(e)),
  });

  const data = planning.data;
  const stays = useMemo(() => {
    const list: (PlannedStay & { spot: PlannedSpot | null })[] = [];
    for (const s of data?.spots ?? [])
      for (const st of s.stays) list.push({ ...st, spot: s });
    for (const st of data?.unplaced ?? []) list.push({ ...st, spot: null });
    return list;
  }, [data]);
  const selected = selectedId
    ? (stays.find((s) => s.id === selectedId) ?? null)
    : null;
  const dates = useMemo(
    () => Array.from({ length: days }, (_, i) => addDays(from, i)),
    [from, days],
  );
  const nowX = offsetDays(new Date().toISOString(), from, days);
  const groups = useMemo(() => {
    const byZone = new Map<string, PlannedSpot[]>();
    for (const s of data?.spots ?? [])
      byZone.set(s.zoneId, [...(byZone.get(s.zoneId) ?? []), s]);
    return [...byZone.entries()].map(([zoneId, spots]) => ({ zoneId, spots }));
  }, [data]);

  if (parkingId && hasFiles) return <FilesPlanningPage parkingId={parkingId} />;
  if (!parking || !filesKnown || planning.isLoading) {
    return (
      <>
        <ParkingTabs />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }
  if (planning.error || !data) {
    return (
      <>
        <ParkingTabs />
        <p className="text-destructive">
          {describeError(planning.error ?? new Error())}
        </p>
      </>
    );
  }

  const width = LABEL_PX + days * DAY_PX;
  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      {data.spots.length === 0 ? (
        <p className="rounded-none border border-border p-5 text-muted-foreground">
          {t.noPlan}{" "}
          <Link to="/parking/plan" className="text-lime-deep underline">
            {fr.parking.tabs.plan}
          </Link>
        </p>
      ) : (
        <div className="-mx-4 flex h-[calc(100vh-280px)] min-h-[600px] flex-col border-y border-border sm:-mx-6">
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-6 py-2 text-sm">
            <ToolButton
              variant="outline"
              onClick={() => setFrom(addDays(from, -7))}
              aria-label={t.prev}
            >
              ‹
            </ToolButton>
            <ToolButton
              variant="outline"
              onClick={() => setFrom(today)}
              active={from === today}
            >
              {t.today}
            </ToolButton>
            <ToolButton
              variant="outline"
              onClick={() => setFrom(addDays(from, 7))}
              aria-label={t.next}
            >
              ›
            </ToolButton>
            <select
              aria-label={t.windowLabel}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-9 border border-border bg-card px-2 font-mono"
            >
              {[7, 14, 31].map((n) => (
                <option key={n} value={n}>
                  {t.window(n)}
                </option>
              ))}
            </select>
            {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((k) => (
              <span
                key={k}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <span className="h-3 w-3" style={{ background: COLORS[k] }} />
                {t.legend[k]}
              </span>
            ))}
          </div>
          <main className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-auto" data-testid="gantt">
              <div style={{ width, minWidth: "100%" }} className="relative">
                {/* Day header */}
                <div className="sticky top-0 z-20 flex border-b border-border bg-background">
                  <div
                    className="sticky left-0 z-30 shrink-0 border-r border-border bg-background px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground"
                    style={{ width: LABEL_PX }}
                  >
                    {t.load}
                  </div>
                  {dates.map((d, i) => {
                    const load = data.load[i];
                    const need = load ? load.placed + load.unplaced : 0;
                    const over = load ? need > load.capacity : false;
                    return (
                      <div
                        key={d}
                        className={cn(
                          "shrink-0 border-r border-border px-2 py-1 font-mono text-xs",
                          d === today && "bg-primary/10",
                        )}
                        style={{ width: DAY_PX }}
                        data-testid={`day-${d}`}
                      >
                        <div
                          className={cn(
                            "uppercase",
                            d === today
                              ? "font-bold text-lime-deep"
                              : "text-muted-foreground",
                          )}
                        >
                          {shortDay(d)}
                        </div>
                        <div
                          className={cn(
                            "font-bold",
                            over && "text-destructive",
                          )}
                        >
                          {need} / {load?.capacity ?? data.capacity}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Rows */}
                {groups.map((g) => (
                  <div key={g.zoneId}>
                    {g.spots.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "relative flex border-b border-border/60",
                          !s.active && "opacity-50",
                        )}
                        style={{ height: ROW_PX }}
                        data-testid={`row-${s.code}`}
                      >
                        <div
                          className="sticky left-0 z-10 flex shrink-0 items-center border-r border-border bg-background px-2 font-mono text-xs font-bold"
                          style={{ width: LABEL_PX }}
                        >
                          {s.code}
                        </div>
                        <div className="relative flex-1">
                          {dates.map((d, i) => (
                            <div
                              key={d}
                              className={cn(
                                "absolute top-0 h-full border-r border-border/40",
                                d === today && "bg-primary/5",
                              )}
                              style={{ left: i * DAY_PX, width: DAY_PX }}
                            />
                          ))}
                          {s.stays.map((st) => {
                            const x0 = offsetDays(st.arrivalAt, from, days);
                            const x1 = offsetDays(st.returnAt, from, days);
                            if (x1 <= x0) return null;
                            const k = tone(st, today);
                            return (
                              <button
                                key={st.id}
                                type="button"
                                title={`${st.plate} · ${st.customerName} · ${dateTimeShort(st.arrivalAt)} → ${dateTimeShort(st.returnAt)}`}
                                onClick={() => setSelectedId(st.id)}
                                className={cn(
                                  "absolute top-1 flex h-[22px] items-center overflow-hidden whitespace-nowrap px-1.5 font-mono text-[11px] font-bold text-black",
                                  selectedId === st.id && "ring-2 ring-primary",
                                )}
                                style={{
                                  left: x0 * DAY_PX,
                                  width: Math.max(6, (x1 - x0) * DAY_PX - 1),
                                  background: COLORS[k],
                                }}
                                data-testid={`bar-${st.reference}`}
                              >
                                {st.plate}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {/* Now line */}
                {nowX > 0 && nowX < days && (
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-primary"
                    style={{ left: LABEL_PX + nowX * DAY_PX }}
                  />
                )}
              </div>
            </div>
            <Aside wide>
              <PanelLabel>{t.alerts}</PanelLabel>
              {data.alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.noAlert}</p>
              )}
              <ul className="flex flex-col gap-1 text-sm" data-testid="alerts">
                {data.alerts.map((a, i) => (
                  <li
                    key={i}
                    className={cn(
                      "border-l-2 pl-2",
                      a.kind === "over_capacity"
                        ? "border-destructive"
                        : "border-lime-deep",
                    )}
                  >
                    {a.kind === "over_capacity"
                      ? t.overCapacity(shortDay(a.date), a.count)
                      : a.kind === "unplaced"
                        ? t.unplacedAlert(a.count)
                        : a.kind === "blocked"
                          ? t.blockedAlert(a.count)
                          : t.inactiveUsed(a.spotCode, a.reference)}
                  </li>
                ))}
              </ul>

              <PanelLabel className="mt-2">{t.stay}</PanelLabel>
              {selected ? (
                <StayCard
                  stay={selected}
                  spots={data.spots}
                  busy={assign.isPending}
                  onClose={() => setSelectedId(null)}
                  onMove={(s) =>
                    assign.mutate({
                      stay: selected,
                      spotId: s.id,
                      code: s.code,
                    })
                  }
                  onRelease={() =>
                    assign.mutate({ stay: selected, spotId: null })
                  }
                />
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  {t.clickBar}
                </p>
              )}

              <PanelLabel className="mt-2">
                {t.unplaced(data.unplaced.length)}
              </PanelLabel>
              {data.unplaced.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.allPlaced}</p>
              )}
              {data.unplaced.length > 0 && (
                <>
                  <ToolButton
                    variant="primary"
                    onClick={() => preassign.mutate()}
                    disabled={preassign.isPending}
                    title={t.preassignHint}
                  >
                    {t.preassign}
                  </ToolButton>
                  <ul className="flex flex-col">
                    {data.unplaced.map((r) => (
                      <li key={r.id} data-testid={`unplaced-${r.reference}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          className={cn(
                            "flex min-h-11 w-full items-center gap-3 border-b border-border text-left hover:bg-accent",
                            selectedId === r.id && "bg-accent",
                          )}
                        >
                          <span className="font-mono text-xs text-lime-deep">
                            {shortDay(localParts(r.arrivalAt).date)}
                          </span>
                          <Plate value={r.plate} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {r.customerName}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Aside>
          </main>
        </div>
      )}
    </>
  );
}

function StayCard({
  stay,
  spots,
  busy,
  onClose,
  onMove,
  onRelease,
}: {
  stay: PlannedStay & { spot: PlannedSpot | null };
  spots: PlannedSpot[];
  busy: boolean;
  onClose: () => void;
  onMove: (spot: PlannedSpot) => void;
  onRelease: () => void;
}) {
  const t = fr.spotPlanning;
  const free = freeSpotsFor(spots, stay);
  return (
    <div
      className="flex flex-col gap-2 border border-lime-deep p-3"
      data-testid="stay-card"
    >
      <div className="flex items-center gap-2">
        <Plate value={stay.plate} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {stay.customerName}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={fr.common.close}
          className="px-1 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
      <div
        className="font-mono text-3xl font-bold text-lime-deep"
        data-testid="stay-spot"
      >
        {stay.spot?.code ?? fr.occupation.noSpot}
      </div>
      <p className="text-[13px] text-muted-foreground">
        {fr.status[stay.status]} · {dateTimeShort(stay.arrivalAt)} →{" "}
        {dateTimeShort(stay.returnAt)}
        {stay.returnFlight
          ? ` · ${fr.occupation.flight(stay.returnFlight)}`
          : ""}
      </p>
      {stay.blockedBy && stay.blockedBy.length > 0 && (
        <p
          data-testid="stay-blocked"
          className="text-[13px] font-semibold text-warn-text"
        >
          {fr.occupation.blockedBy(
            stay.blockedBy[0].spotCode,
            dateTimeShort(stay.blockedBy[0].returnAt),
          )}
          {stay.blockedBy.length > 1 ? ` (+${stay.blockedBy.length - 1})` : ""}
        </p>
      )}
      <label className="flex items-center gap-2 text-sm">
        <span className="shrink-0">{stay.spot ? t.moveTo : t.placeIn}</span>
        <select
          aria-label={stay.spot ? t.moveTo : t.placeIn}
          value=""
          disabled={busy || free.length === 0}
          onChange={(e) => {
            const s = free.find((x) => x.id === e.target.value);
            if (s) onMove(s);
          }}
          className="h-9 min-w-0 flex-1 border border-border bg-card px-2 font-mono"
        >
          <option value="">{free.length === 0 ? t.noFree : t.choose}</option>
          {free.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {stay.spot && (
          <ToolButton variant="outline" onClick={onRelease} disabled={busy}>
            {t.release}
          </ToolButton>
        )}
        <Link
          to={`/reservations/${stay.id}`}
          className="flex min-h-9 items-center text-sm text-lime-deep underline"
        >
          {t.openBooking}
        </Link>
      </div>
    </div>
  );
}
