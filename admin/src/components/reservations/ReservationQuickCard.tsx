import { useQuery } from "@tanstack/react-query";
import {
  KeyRound,
  MessageSquare,
  Phone,
  PlaneLanding,
  PlaneTakeoff,
  SquareParking,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { NextStep } from "@/components/reservations/NextStep";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTimeShort, timeOf } from "@/lib/datetime";
import { describeError, fr, quickCardFr as t } from "@/lib/fr";
import type { Reservation } from "@/lib/types";

/** Opens the operational card of a booking from anywhere in the pro space (C-A, 06/10/2026). */
const QuickCardContext = createContext<{
  open: (id: string) => void;
  close: () => void;
}>({ open: () => undefined, close: () => undefined });

export const useQuickCard = () => useContext(QuickCardContext);

export function QuickCardProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((next: string) => setId(next), []);
  const close = useCallback(() => setId(null), []);
  const value = useMemo(() => ({ open, close }), [open, close]);
  return (
    <QuickCardContext.Provider value={value}>
      {children}
      {id && <ReservationQuickCard id={id} onClose={close} />}
    </QuickCardContext.Provider>
  );
}

/** "Atterri 10:02" and the like: the return flight's state. */
export function flightState(
  r: Reservation,
): { tone: BadgeTone; text: string } | null {
  if (!r.returnFlight) return null;
  const f = t.flightState;
  const at = r.flightLandedAt ?? r.flightEstimatedAt ?? r.flightScheduledAt;
  switch (r.flightStatus) {
    case "landed":
      return { tone: "ok", text: f.landed(at ? timeOf(at) : "") };
    case "cancelled":
      return { tone: "bad", text: f.cancelled };
    case "diverted":
      return { tone: "bad", text: f.diverted };
    case "delayed":
      return { tone: "warn", text: f.delayed(at ? timeOf(at) : "") };
    case "unknown":
      return { tone: "warn", text: f.unknown };
    default:
      return at ? { tone: "line", text: f.scheduled(timeOf(at)) } : null;
  }
}

const STATUS_TONE: Partial<Record<Reservation["status"], BadgeTone>> = {
  upcoming: "line",
  arrived: "ok",
  shuttled_out: "info",
  return_requested: "warn",
  back_at_parking: "accent",
  returned: "line",
  cancelled: "bad",
  no_show: "bad",
};

/** The short operational sheet: contact, flight, spot and keys, stop, the next gesture, and the link to the full page. */
export function ReservationQuickCard({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => adminApi.getReservation(id),
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const r = query.data;
  const phone = r?.customerPhone.replace(/[^+\d]/g, "") ?? "";
  const flight = r ? flightState(r) : null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-stretch sm:justify-end"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label={t.title}
        data-testid="quick-card"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-background p-4 shadow-2xl sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {r?.reference ?? t.title}
          </span>
          <button
            type="button"
            aria-label={t.close}
            onClick={onClose}
            className="ml-auto rounded-full p-1.5 hover:bg-panel-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {query.isError ? (
          <p className="rounded-xl border border-bad bg-bad-soft p-3 text-sm text-bad-text">
            {describeError(query.error) || t.loadError}
          </p>
        ) : !r ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Plate value={r.plate} />
              <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">
                {r.customerName}
              </span>
              <Badge tone={STATUS_TONE[r.status] ?? "line"}>
                {fr.status[r.status]}
              </Badge>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${phone}`}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-lime-deep font-semibold text-lime-deep hover:bg-panel-2"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t.call}
              </a>
              <a
                href={`sms:${phone}`}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-panel-line font-semibold hover:bg-panel-2"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {t.sms}
              </a>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-xl border border-panel-line bg-panel p-3 text-[14px]">
              <dt className="text-muted-foreground">{t.arrival}</dt>
              <dd className="font-mono">
                {dateTimeShort(r.arrivalAt)} · {t.passengers(r.passengers)}
                {r.departureFlight && (
                  <span className="ml-1 inline-flex items-center gap-1 text-muted-foreground">
                    <PlaneTakeoff className="h-3.5 w-3.5" aria-hidden="true" />
                    {r.departureFlight}
                  </span>
                )}
              </dd>
              <dt className="text-muted-foreground">{t.return}</dt>
              <dd className="font-mono">
                {dateTimeShort(r.returnAt)}
                {r.stop && (
                  <span className="ml-1 text-muted-foreground">
                    · {r.stop.name}
                  </span>
                )}
              </dd>
              <dt className="text-muted-foreground">{t.flight}</dt>
              <dd className="flex flex-wrap items-center gap-1.5 font-mono">
                {r.returnFlight ? (
                  <>
                    <PlaneLanding
                      className="h-3.5 w-3.5 text-lime-deep"
                      aria-hidden="true"
                    />
                    {r.returnFlight}
                    {flight && <Badge tone={flight.tone}>{flight.text}</Badge>}
                    {(r.flightTerminal || r.flightGate) && (
                      <span className="text-muted-foreground">
                        {[
                          r.flightTerminal
                            ? t.terminal(r.flightTerminal)
                            : null,
                          r.flightGate ? t.gate(r.flightGate) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">{t.noFlight}</span>
                )}
              </dd>
              <dt className="text-muted-foreground">{t.spot}</dt>
              <dd className="flex flex-wrap items-center gap-1.5 font-mono">
                <SquareParking
                  className="h-3.5 w-3.5 text-lime-deep"
                  aria-hidden="true"
                />
                <span
                  data-testid="card-spot"
                  className={r.spot || r.file ? "" : "text-muted-foreground"}
                >
                  {r.file
                    ? t.inFile(r.file.code, r.filePosition ?? null)
                    : (r.spot?.code ?? t.noSpot)}
                </span>
                <KeyRound
                  className="ml-2 h-3.5 w-3.5 text-lime-deep"
                  aria-hidden="true"
                />
                <span
                  data-testid="card-keys"
                  className={r.keyHook ? "" : "text-muted-foreground"}
                >
                  {r.keyHook ?? t.noKeys}
                </span>
              </dd>
              {r.carLat != null && r.carLng != null && (
                <>
                  <dt className="text-muted-foreground">{t.car}</dt>
                  <dd className="font-mono">
                    {fr.reservation.carBy[r.carLocatedBy ?? "traveller"]}
                    {r.carNote ? ` · ${r.carNote}` : ""}{" "}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${r.carLat},${r.carLng}&travelmode=walking`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lime-deep underline"
                    >
                      {t.carDirections}
                    </a>
                  </dd>
                </>
              )}
            </dl>
            {(r.vehicleModel || r.vehicleColour) && (
              <p
                data-testid="card-vehicle"
                className="text-[13px] text-muted-foreground"
              >
                {t.vehicle} ·{" "}
                {fr.reservation.vehicleDetails(r.vehicleModel, r.vehicleColour)}
              </p>
            )}
            {r.returnNoticeKind && r.returnNoticeAt && (
              <p
                data-testid="card-notice"
                className="rounded-xl border border-panel-line bg-warn-soft p-3 text-[13px] font-semibold text-warn-text"
              >
                {t.returnNotice} ·{" "}
                {fr.reservation.returnNoticeLine(
                  r.returnNoticeKind,
                  r.returnNoticeText ?? null,
                  dateTimeShort(r.returnNoticeAt),
                )}
              </p>
            )}
            {r.customerNote && (
              <p
                data-testid="card-message"
                className="whitespace-pre-line rounded-xl border border-lime-deep/40 bg-panel p-3 text-[13px]"
              >
                <span className="font-semibold">{t.customerNote} :</span>{" "}
                {r.customerNote}
              </p>
            )}
            {r.notes && (
              <p className="whitespace-pre-line rounded-xl border border-panel-line bg-panel p-3 text-[13px]">
                {r.notes}
              </p>
            )}
            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.next.title}
              </h3>
              <NextStep reservation={r} onNavigate={onClose} compact />
            </section>
            <Link
              to={`/reservations/${r.id}`}
              onClick={onClose}
              className="block text-center text-[13px] font-semibold text-lime-deep hover:underline"
            >
              {t.open}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
