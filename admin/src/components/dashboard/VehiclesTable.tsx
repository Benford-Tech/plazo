import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MovementPill } from "@/components/MovementPill";
import { KeyRound } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { adminApi } from "@/lib/api";
import { shortDay, timeOf } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { DashboardVehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.dashboard.vehicles;

/** Direction A (26/10/2026, « améliore l'ergonomie d'affichage des véhicules sur le parking »): one aligned row per car. */
const SHOWN = 8;

/** Plate + name, place, keys, return, state: the name column takes what the fixed ones leave. */
const COLS =
  "grid items-center gap-x-3 gap-y-1.5 md:grid-cols-[minmax(150px,1fr)_auto_auto_auto_auto]";

type Filter = "all" | "returnsToday" | "noSpot" | "noKeys" | "flightLate";

function isFlightLate(v: DashboardVehicle): boolean {
  return (
    v.flightStatus === "delayed" ||
    v.flightStatus === "cancelled" ||
    v.flightStatus === "diverted" ||
    !!(
      v.flightScheduledAt &&
      v.flightEstimatedAt &&
      v.flightEstimatedAt > v.flightScheduledAt
    )
  );
}

const MATCH: Record<Filter, (v: DashboardVehicle) => boolean> = {
  all: () => true,
  returnsToday: (v) => v.returnsToday,
  noSpot: (v) => !v.spotCode,
  noKeys: (v) => !v.keyHook && !v.keysLeftAt,
  flightLate: isFlightLate,
};

const FILTERS: Filter[] = [
  "all",
  "returnsToday",
  "noSpot",
  "noKeys",
  "flightLate",
];

const FILTER_TONE: Partial<Record<Filter, string>> = {
  noSpot: "border-bad text-bad-text",
  noKeys: "border-warn text-warn-text",
};

/** The badges of the "Flotte" list: the return of the day, the flight, the spot, the trip. */
function vehicleBadges(
  v: DashboardVehicle,
): { tone: BadgeTone; text: string }[] {
  const b = t.badge;
  const out: { tone: BadgeTone; text: string }[] = [];
  if (v.returnsToday) out.push({ tone: "info", text: b.returnToday });
  if (v.flightStatus === "landed") out.push({ tone: "ok", text: b.landed });
  else if (v.flightStatus === "cancelled" || v.flightStatus === "diverted")
    out.push({ tone: "bad", text: b.cancelled });
  else if (isFlightLate(v)) {
    const late =
      v.flightScheduledAt && v.flightEstimatedAt
        ? Math.round(
            (new Date(v.flightEstimatedAt).getTime() -
              new Date(v.flightScheduledAt).getTime()) /
              60000,
          )
        : 0;
    out.push({
      tone: "warn",
      text:
        late > 0 ? b.delayed(late) : fr.dashboard.alerts.kind.flight_delayed,
    });
  }
  if (v.tripDirection) out.push({ tone: "accent", text: b.onTrip });
  else if (v.status === "return_requested")
    out.push({ tone: "warn", text: b.waiting });
  else if (v.status === "back_at_parking")
    out.push({ tone: "info", text: fr.status.back_at_parking });
  else if (v.status === "shuttled_out")
    out.push({ tone: "line", text: b.shuttled });
  if (v.spotCode && out.length === 0) out.push({ tone: "ok", text: b.onSite });
  return out;
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function VehiclesTable({ vehicles }: { vehicles: DashboardVehicle[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f, vehicles.filter(MATCH[f]).length]),
      ) as Record<Filter, number>,
    [vehicles],
  );
  const q = normalise(query);
  const rows = useMemo(
    () =>
      vehicles
        .filter(MATCH[filter])
        .filter(
          (v) =>
            !q ||
            normalise(v.plate).includes(q) ||
            normalise(v.customerName).includes(q),
        )
        .sort((a, b) => a.returnAt.localeCompare(b.returnAt)),
    [vehicles, filter, q],
  );
  const shown = all ? rows : rows.slice(0, SHOWN);
  const hidden = rows.length - shown.length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" data-testid="vehicle-filters">
          {FILTERS.map((f) =>
            f === "all" || counts[f] > 0 ? (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-white px-2.5 text-[13px] font-medium hover:bg-panel-2",
                  filter === f
                    ? "border-lime-deep bg-primary text-primary-foreground hover:bg-primary"
                    : (FILTER_TONE[f] ?? "border-panel-line"),
                )}
              >
                {t.filters[f]}
                <span className="font-mono text-[12px] font-bold">
                  {counts[f]}
                </span>
              </button>
            ) : null,
          )}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t.searchAria}
          placeholder={t.searchPlaceholder}
          className="ml-auto min-h-8 w-full rounded-full border border-panel-line bg-white px-3 text-[13px] sm:w-56"
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{t.noMatch}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-panel-line">
          <div
            className={cn(COLS, "hidden bg-panel-2 px-3 py-2 md:grid")}
            aria-hidden="true"
          >
            {(["plate", "place", "keys", "return", "state"] as const).map(
              (c) => (
                <span
                  key={c}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    c === "state" && "text-right",
                  )}
                >
                  {t.columns[c]}
                </span>
              ),
            )}
          </div>
          <ul>
            {shown.map((v) => (
              <li key={v.id}>
                <VehicleLine v={v} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between bg-panel-2 px-3 py-2 text-[13px] text-muted-foreground">
            <span>{t.shown(shown.length, rows.length)}</span>
            {(hidden > 0 || all) && (
              <button
                type="button"
                onClick={() => setAll((x) => !x)}
                className="font-semibold text-lime-deep hover:underline"
              >
                {all ? t.less : t.more(hidden)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleLine({ v }: { v: DashboardVehicle }) {
  const card = useQuickCard();
  const open = () => card.open(v.id);
  const place = v.spotCode
    ? [v.spotCode, v.stayClass ? t.stay[v.stayClass] : null]
        .filter(Boolean)
        .join(" · ")
    : t.noSpot;
  const ret = v.returnFlight
    ? t.flight(v.returnFlight, timeOf(v.flightEstimatedAt ?? v.returnAt))
    : v.returnsToday
      ? timeOf(v.returnAt)
      : shortDay(v.returnAt.slice(0, 10));
  return (
    <div
      data-testid="vehicle-row"
      className={cn(
        COLS,
        "grid-cols-[minmax(0,1fr)_auto] border-t border-panel-line px-3 py-2 first:border-t-0 hover:bg-panel-2/60",
      )}
    >
      {/* Plate above the name (26/10/2026, « les noms ne sont pas assez visibles »): the name gets a full line. */}
      <span className="flex min-w-0 flex-col items-start gap-1 max-md:col-span-2">
        <button type="button" onClick={open} className="text-left">
          <Plate value={v.plate} size="sm" />
        </button>
        <button
          type="button"
          onClick={open}
          className="min-w-0 break-words text-left text-[15px] font-bold leading-tight hover:underline"
        >
          {v.customerName}
          <span className="ml-1.5 text-[12px] font-medium text-muted-foreground">
            {t.pax(v.passengers)}
          </span>
        </button>
      </span>
      <span
        className={cn(
          "font-mono text-[13px] font-bold",
          v.spotCode ? "text-lime-deep" : "text-bad-text",
        )}
      >
        {place}
      </span>
      <KeysControl v={v} />
      {/* 28/10/2026: every car here has its departure next; today's in the indigo pill of the planning. */}
      <span>
        {v.returnsToday ? (
          <MovementPill kind="departure" time={ret} />
        ) : (
          <span className="font-mono text-[12px] text-info-text">{ret}</span>
        )}
      </span>
      <span className="flex flex-wrap items-center justify-end gap-1 md:justify-end">
        {vehicleBadges(v).map((b) => (
          <Badge key={b.text} tone={b.tone}>
            {b.text}
          </Badge>
        ))}
      </span>
    </div>
  );
}

/** Three positions, one click each: « Clés ? » · « Laissées » · « Crochet n° » (typed on the spot). */
function KeysControl({ v }: { v: DashboardVehicle }) {
  const k = t.keysSeg;
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [hook, setHook] = useState(v.keyHook ?? "");
  const save = useMutation({
    mutationFn: (patch: { left: boolean; keyHook?: string | null }) =>
      adminApi.setKeys(v.id, patch),
    onSuccess: (_data, patch) => {
      setEditing(false);
      toast.success(
        patch.keyHook
          ? k.hookDone(patch.keyHook)
          : patch.left
            ? t.keysLeftDone
            : t.keysLeftUndone,
      );
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(describeError(err)),
  });
  const position: "none" | "left" | "hook" = v.keyHook
    ? "hook"
    : v.keysLeftAt
      ? "left"
      : "none";
  const seg =
    "min-h-8 px-2.5 text-[12px] font-semibold disabled:opacity-60 first:rounded-l-full last:rounded-r-full";
  const on = "bg-primary text-primary-foreground";
  const off = "bg-white text-muted-foreground hover:bg-panel-2";
  const submitHook = () => {
    const value = hook.trim();
    if (!value) {
      setEditing(false);
      return;
    }
    save.mutate({ left: true, keyHook: value });
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitHook();
    } else if (e.key === "Escape") {
      setEditing(false);
      setHook(v.keyHook ?? "");
    }
  };
  return (
    <span
      role="group"
      aria-label={t.columns.keys}
      className="inline-flex w-fit items-stretch overflow-hidden rounded-full border border-panel-line"
    >
      <button
        type="button"
        aria-pressed={position === "none"}
        disabled={save.isPending || position === "none"}
        onClick={() => save.mutate({ left: false, keyHook: null })}
        className={cn(
          seg,
          position === "none" ? "bg-warn-soft text-warn-text" : off,
        )}
      >
        {k.none}
      </button>
      <button
        type="button"
        aria-pressed={position === "left"}
        disabled={save.isPending || position === "left"}
        title={
          position === "left" && v.keysLeftAt
            ? t.keysLeft(timeOf(v.keysLeftAt))
            : undefined
        }
        onClick={() => save.mutate({ left: true, keyHook: null })}
        className={cn(
          seg,
          "border-l border-panel-line",
          position === "left" ? on : off,
        )}
      >
        {k.left}
      </button>
      {editing ? (
        <span className="flex items-center gap-1 border-l border-panel-line bg-white pl-2 pr-1">
          <KeyRound className="h-3 w-3 text-lime-deep" aria-hidden="true" />
          <input
            autoFocus
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            onKeyDown={onKey}
            onBlur={submitHook}
            aria-label={k.hookAria}
            placeholder={k.hookPlaceholder}
            maxLength={20}
            className="w-12 bg-transparent font-mono text-[12px] outline-none"
          />
        </span>
      ) : (
        <button
          type="button"
          aria-pressed={position === "hook"}
          disabled={save.isPending}
          onClick={() => {
            setHook(v.keyHook ?? "");
            setEditing(true);
          }}
          className={cn(
            seg,
            "border-l border-panel-line",
            position === "hook" ? on : off,
          )}
        >
          {v.keyHook ? k.hookN(v.keyHook) : k.hook}
        </button>
      )}
    </span>
  );
}
