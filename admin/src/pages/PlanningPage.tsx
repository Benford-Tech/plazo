import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { addDays, longDate, shortDay, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { NightLoad, Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

function NightCell({ night }: { night: NightLoad }) {
  const t = fr.planning;
  const almostFull = !night.overbooked && night.free <= Math.ceil(night.bookable * 0.05);
  return (
    <div
      className={cn(
        "flex min-w-[124px] shrink-0 flex-col gap-0.5 whitespace-nowrap px-3.5 py-3",
        night.overbooked ? "bg-primary text-primary-foreground" : "bg-card",
        almostFull && "shadow-[inset_0_-4px_0_hsl(var(--primary))]",
      )}
    >
      <span className="text-[15px] font-semibold uppercase">{shortDay(night.date)}</span>
      <span className="tabular font-mono text-2xl font-bold">
        {night.count}
        <span className="text-[15px] font-medium"> / {night.bookable}</span>
      </span>
      <span className="text-sm font-semibold">
        {night.overbooked ? t.overbookedBy(night.count - night.bookable).toUpperCase() : almostFull ? t.almostFull : t.free(night.free)}
      </span>
    </div>
  );
}

function Row({ r, kind, index }: { r: Reservation; kind: "arrival" | "return"; index: number }) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
  const onSite = r.status !== "upcoming";
  return (
    <li>
      <Link
        to={`/reservations/${r.id}`}
        className={cn(
          "grid min-h-16 grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-[#262625] px-1 py-2 hover:bg-accent sm:grid-cols-[64px_1fr_auto] sm:gap-3.5",
          index % 2 ? "bg-[#111112]" : "bg-background",
        )}
      >
        <span className="tabular font-mono text-xl font-bold text-primary">{timeOf(isArrival ? r.arrivalAt : r.returnAt)}</span>
        {/* On a phone the plate sits above the name; side by side from sm up. */}
        <span className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3.5">
          <Plate value={r.plate} />
          <span className="min-w-0 max-w-full">
            <span className="block truncate text-lg font-semibold">{r.customerName}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {t.pax(r.passengers)} · {isArrival ? (r.channelDetail ?? fr.channels[r.channel]) : fr.status[r.status]}
            </span>
          </span>
        </span>
        {isArrival ? (
          <span
            className={cn(
              "whitespace-nowrap px-2 py-1 text-xs font-bold uppercase sm:text-sm",
              onSite ? "bg-foreground text-background" : "border border-border text-muted-foreground",
            )}
          >
            {fr.status[r.status]}
          </span>
        ) : r.returnFlight ? (
          <span className="tabular whitespace-nowrap border border-primary px-2 py-1 font-mono text-sm font-bold text-primary sm:text-[15px]">{r.returnFlight}</span>
        ) : (
          <span />
        )}
      </Link>
    </li>
  );
}

function Column({ title, count, items, kind, empty }: { title: string; count: string; items: Reservation[]; kind: "arrival" | "return"; empty: string }) {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between border-b-2 border-primary px-1 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-wider">{title}</h2>
        <span className="tabular font-mono text-muted-foreground">{count}</span>
      </div>
      <ul>
        {items.map((r, i) => (
          <Row key={r.id} r={r} kind={kind} index={i} />
        ))}
      </ul>
      {items.length === 0 && <p className="px-1 py-6 text-muted-foreground">{empty}</p>}
    </section>
  );
}

export default function PlanningPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? todayLocal();
  const { data, isLoading, error } = useQuery({ queryKey: ["planning", date], queryFn: () => adminApi.getPlanning(date), refetchInterval: 60_000 });
  const t = fr.planning;
  const go = (d: string) => setParams(d === todayLocal() ? {} : { date: d });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button aria-label={t.previousDay} onClick={() => go(addDays(date, -1))} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold uppercase tracking-wide">{longDate(date)}</h1>
          <button aria-label={t.nextDay} onClick={() => go(addDays(date, 1))} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
            <ChevronRight className="h-5 w-5" />
          </button>
          {date !== todayLocal() && (
            <button onClick={() => go(todayLocal())} className="h-11 border border-border px-3 font-semibold uppercase hover:bg-accent">
              {t.today}
            </button>
          )}
        </div>
        {can(user?.role, "reservations:manage") && (
          <Link
            to={`/reservations/nouvelle${date !== todayLocal() ? `?date=${date}` : ""}`}
            className="flex h-11 items-center bg-primary px-5 text-base font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110"
          >
            {t.newReservation}
          </Link>
        )}
      </div>

      {error && <p className="text-destructive">{describeError(error)}</p>}
      {isLoading && <Skeleton className="h-96 w-full" />}

      {data && (
        <>
          <section aria-label={t.nightsTitle} className="flex gap-1 overflow-x-auto">
            {data.nights.map(n => (
              <NightCell key={n.date} night={n} />
            ))}
          </section>
          <div className="grid gap-8 lg:grid-cols-2">
            <Column
              title={t.arrivals}
              count={t.arrivalsCount(data.stats.arrivals, data.stats.arrived)}
              items={data.arrivals}
              kind="arrival"
              empty={t.noArrival}
            />
            <Column title={t.returns} count={String(data.stats.returns)} items={data.returns} kind="return" empty={t.noReturn} />
          </div>
        </>
      )}
    </>
  );
}
