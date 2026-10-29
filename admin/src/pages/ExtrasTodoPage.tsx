import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { addDays, dateTimeShort, localParts, timeOf } from "@/lib/datetime";
import { EXTRA_ICONS } from "@/lib/extras";
import { describeError, extrasFr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { ExtrasBoard, ExtrasBoardRow, ExtrasBoardView } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = extrasFr.board;
const o = extrasFr.orders;
const VIEWS: ExtrasBoardView[] = ["todo", "done", "refused"];
const GRID = "md:grid md:grid-cols-[140px_190px_minmax(0,1fr)_140px_90px_minmax(0,250px)] md:items-center md:gap-3";

/** "dans 1 h 40", "dans 25 min" */
function untilText(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return t.inLine(`${minutes} min`);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return t.inLine(m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`);
}

type Group = { key: string; label: string; rows: ExtrasBoardRow[] };

/** To do: late first, then today, tomorrow, later (the parking's days). */
function groupsOf(board: ExtrasBoard): Group[] {
  if (board.view !== "todo") return [{ key: "all", label: "", rows: board.data }];
  const today = localParts(board.now, board.timezone).date;
  const tomorrow = addDays(today, 1);
  const groups: Group[] = [
    { key: "late", label: t.late, rows: [] },
    { key: "today", label: t.today, rows: [] },
    { key: "tomorrow", label: t.tomorrow, rows: [] },
    { key: "later", label: t.later, rows: [] },
  ];
  for (const row of board.data) {
    const day = localParts(row.dueAt, board.timezone).date;
    const g = row.late ? groups[0] : day <= today ? groups[1] : day === tomorrow ? groups[2] : groups[3];
    g.rows.push(row);
  }
  return groups.filter(g => g.rows.length);
}

function placeOf(row: ExtrasBoardRow): string {
  const { file, spot } = row.reservation;
  if (file) return t.file(file.code, file.rank);
  if (spot) return t.spot(spot);
  return t.noPlace;
}

/**
 * « Services à faire » (29/10/2026, direction A, « une vue des services additionnels à faire avant le retour des
 * passagers »): every service the travellers ordered on Plazo, sorted by « à faire avant » (one hour before the expected
 * return), the late ones on top; « Accepter », « Fait » and « Pas possible » on the line, each one told to the traveller.
 */
export default function ExtrasTodoPage() {
  const [params, setParams] = useSearchParams();
  const view: ExtrasBoardView = params.get("vue") === "faits" ? "done" : params.get("vue") === "refuses" ? "refused" : "todo";
  const queryClient = useQueryClient();
  const quickCard = useQuickCard();
  const key = ["extras-board", view];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getExtrasBoard(view), refetchInterval: 60000 });
  const [refusing, setRefusing] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["extras-board"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const act = useMutation({
    mutationFn: ({ row, action, why }: { row: ExtrasBoardRow; action: "accept" | "done" | "refuse"; why?: string }) =>
      action === "accept"
        ? adminApi.acceptExtra(row.reservation.id, row.id)
        : action === "done"
          ? adminApi.markExtraDone(row.reservation.id, row.id)
          : adminApi.refuseExtra(row.reservation.id, row.id, why ?? ""),
    onSuccess: (_data, { row, action }) => {
      queryClient.invalidateQueries({ queryKey: ["reservation-extras", row.reservation.id] });
      refresh();
      setRefusing(null);
      setReason("");
      toast.success(action === "accept" ? o.acceptedToast : action === "done" ? o.doneToast : o.refusedToast);
    },
    onError: (err: Error) => toast.error(describeError(err, o.errors)),
  });

  const board = query.data;
  const tz = board?.timezone;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Link to="/reservations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.crumb}
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <div role="tablist" aria-label={t.title} className="flex flex-wrap gap-2" data-testid="extras-tabs">
        {VIEWS.map(v => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            data-testid={`extras-tab-${v}`}
            onClick={() => setParams(v === "todo" ? {} : { vue: v === "done" ? "faits" : "refuses" })}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-semibold",
              view === v ? "bg-foreground text-background" : "border border-panel-line bg-panel hover:bg-panel-2",
            )}
          >
            {t.tabs[v]}
            {board && ` · ${board.counts[v]}`}
          </button>
        ))}
      </div>

      {query.isLoading && <Skeleton className="h-64 w-full rounded-xl" />}
      {query.isError && <p className="text-sm text-bad-text">{t.loadError}</p>}
      {board && !board.data.length && (
        <p className="rounded-xl border border-panel-line bg-panel p-6 text-sm text-muted-foreground" data-testid="extras-empty">
          {t.empty[view]}
        </p>
      )}
      {board && board.data.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-panel-line bg-panel" data-testid="extras-board">
          <div className={cn("hidden border-b border-panel-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", GRID)}>
            <span>{t.columns.due}</span>
            <span>{t.columns.service}</span>
            <span>{t.columns.client}</span>
            <span>{t.columns.place}</span>
            <span>{t.columns.paid}</span>
            <span />
          </div>
          {groupsOf(board).map(group => (
            <div key={group.key}>
              {group.label && (
                <div
                  className={cn(
                    "px-5 py-2 text-xs font-semibold",
                    group.key === "late" ? "bg-bad/10 text-bad-text" : "bg-panel-2 text-foreground",
                  )}
                >
                  {group.label} · {group.rows.length}
                </div>
              )}
              <ul>
                {group.rows.map(row => {
                  const Icon = EXTRA_ICONS[row.kind] ?? Sparkles;
                  const r = row.reservation;
                  const vehicle = [r.vehicleModel, r.vehicleColour].filter(Boolean).join(" ");
                  const flightReturn = r.returnFlight && r.expectedReturnAt !== r.returnAt;
                  return (
                    <li
                      key={row.id}
                      data-testid={`extra-row-${row.id}`}
                      className={cn("flex flex-col gap-2 border-b border-panel-line px-5 py-3 last:border-b-0", GRID, row.late && "bg-bad/5")}
                    >
                      <div className="flex flex-col">
                        {view === "todo" ? (
                          <>
                            <span className={cn("font-mono text-base font-semibold", row.late ? "text-bad-text" : group.key === "today" && "text-warn-text")}>
                              {timeOf(row.dueAt, tz)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {flightReturn ? t.flightLine(r.returnFlight!, timeOf(r.expectedReturnAt, tz)) : t.returnLine(timeOf(r.expectedReturnAt, tz))}
                              {" · "}
                              {row.late ? t.overdue : untilText(Date.parse(row.dueAt) - Date.parse(board.now))}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {view === "done" && row.doneAt
                              ? t.doneAt(timeOf(row.doneAt, tz), row.doneBy)
                              : row.refusedAt
                                ? t.refusedAt(dateTimeShort(row.refusedAt, tz), row.refusedReason)
                                : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime-deep">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold">{row.label}</span>
                          {view === "todo" && row.acceptedAt && <span className="text-xs text-lime-deep">{t.accepted(row.acceptedBy ?? null)}</span>}
                        </span>
                      </div>
                      <button type="button" onClick={() => quickCard.open(r.id)} className="flex min-w-0 flex-col text-left hover:underline">
                        <span className="truncate text-sm font-semibold">{r.customerName}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground">{[r.plate, vehicle].filter(Boolean).join(" · ")}</span>
                      </button>
                      <span className="text-sm">{placeOf(row)}</span>
                      <span className="font-mono text-sm">{euros(row.priceCents)}</span>
                      {view === "todo" && refusing !== row.id && (
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {!row.acceptedAt && (
                            <button
                              type="button"
                              disabled={act.isPending}
                              onClick={() => act.mutate({ row, action: "accept" })}
                              className="h-10 rounded-full border border-lime-deep px-4 text-sm font-semibold text-lime-deep hover:bg-lime/10 disabled:opacity-50"
                            >
                              {o.accept}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={act.isPending}
                            onClick={() => act.mutate({ row, action: "done" })}
                            className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
                          >
                            {o.done}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRefusing(row.id);
                              setReason("");
                            }}
                            className="h-10 rounded-full border border-panel-line bg-panel px-4 text-sm font-semibold hover:bg-panel-2"
                          >
                            {o.refuse}
                          </button>
                        </div>
                      )}
                      {view === "todo" && refusing === row.id && (
                        <form
                          className="flex flex-col gap-2 md:col-span-6"
                          onSubmit={ev => {
                            ev.preventDefault();
                            act.mutate({ row, action: "refuse", why: reason.trim() });
                          }}
                        >
                          <label htmlFor={`refuse-${row.id}`} className="text-xs font-semibold">
                            {o.reasonLabel}
                          </label>
                          <input
                            id={`refuse-${row.id}`}
                            value={reason}
                            maxLength={200}
                            placeholder={o.reasonPlaceholder}
                            onChange={ev => setReason(ev.target.value)}
                            className="h-10 w-full max-w-md rounded-lg border border-panel-line bg-panel px-3 text-sm"
                          />
                          <p className="text-xs text-muted-foreground">{o.hint}</p>
                          <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={act.isPending} className="h-10 rounded-full bg-bad px-4 text-sm font-semibold text-white disabled:opacity-50">
                              {o.confirmRefuse}
                            </button>
                            <button type="button" onClick={() => setRefusing(null)} className="h-10 rounded-full border border-panel-line px-4 text-sm font-semibold">
                              {o.cancel}
                            </button>
                          </div>
                        </form>
                      )}
                      {view !== "todo" && <span />}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
