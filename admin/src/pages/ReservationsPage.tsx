import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MovementPill } from "@/components/MovementPill";
import { Plate } from "@/components/Plate";
import { QuickPrice } from "@/components/reservations/QuickPrice";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { bookingImportFr, describeError, fr, inboundFr, remindersFr } from "@/lib/fr";
import { euros, isPriceLocked } from "@/lib/pricing";
import { MOVEMENT_CARD, nextMovementOf } from "@/lib/movement";
import { can } from "@/lib/roles";
import { paidBy } from "@/lib/payment-method";
import type { Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReservationsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  // Page 1 opens on today, 0 and below go back in time (10/10/2026, « de manière chronologique »).
  const asked = Number(params.get("page") ?? 1);
  const page = Number.isInteger(asked) ? asked : 1;
  // 21/10/2026 (choice A): « Sans prix » keeps only the bookings without a price (managers).
  const noPrice = params.get("sansprix") === "1";
  const [input, setInput] = useState(q);
  const [editing, setEditing] = useState<string | null>(null);
  const { data, error, isFetching } = useQuery({
    queryKey: ["reservations", q, page, noPrice],
    queryFn: () => adminApi.searchReservations({ q, page, noPrice }),
    placeholderData: keepPreviousData,
  });
  const t = fr.reservation;
  const n = fr.noPrice;
  // The managers get the count (null for the other roles): only they see prices.
  const priced = data?.noPriceCount !== null && data?.noPriceCount !== undefined;
  const without = (r: Reservation) => priced && r.priceCents === null && r.status !== "cancelled";
  const withParams = (extra: Record<string, string>) => ({ ...(q ? { q } : {}), ...(noPrice ? { sansprix: "1" } : {}), ...extra });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.listTitle}</h1>
        {can(user?.role, "reservations:manage") && (
          <div className="flex flex-wrap gap-2">
            {can(user?.role, "parking:manage") && (
              <Link to="/reservations/importer" className="flex h-11 items-center border border-border px-4 font-semibold uppercase tracking-wide hover:bg-accent">
                {bookingImportFr.link}
              </Link>
            )}
            <Link to="/reservations/sms-veille" className="flex h-11 items-center border border-border px-4 font-semibold uppercase tracking-wide hover:bg-accent">
              {remindersFr.link}
            </Link>
            <Link to="/reservations/a-verifier" className="flex h-11 items-center border border-border px-4 font-semibold uppercase tracking-wide hover:bg-accent">
              {inboundFr.list.title}
            </Link>
            <Link to="/reservations/nouvelle" className="flex h-11 items-center bg-primary px-5 font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110">
              {fr.planning.newReservation}
            </Link>
          </div>
        )}
      </div>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          setParams({ ...(input.trim() ? { q: input.trim() } : {}), ...(noPrice ? { sansprix: "1" } : {}) });
        }}
      >
        <label htmlFor="search" className="sr-only">
          {t.searchPlaceholder}
        </label>
        <input
          id="search"
          type="search"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-12 min-w-0 flex-1 border border-border bg-card px-3 text-lg outline-none placeholder:text-muted-foreground focus-visible:border-lime-deep"
        />
        <button type="submit" aria-label={t.search} className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground">
          <Search className="h-5 w-5" />
        </button>
      </form>

      {priced && (data.noPriceCount! > 0 || noPrice) && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={!noPrice}
            onClick={() => setParams(q ? { q } : {})}
            className={cn("h-10 rounded-full border border-panel-line px-4 text-sm", !noPrice ? "bg-foreground text-background" : "bg-panel hover:bg-panel-2")}
          >
            {n.filterOff}
          </button>
          <button
            type="button"
            aria-pressed={noPrice}
            data-testid="filter-no-price"
            onClick={() => setParams({ ...(q ? { q } : {}), sansprix: "1" })}
            className={cn(
              "h-10 rounded-full border-2 border-warn px-4 text-sm font-semibold",
              noPrice ? "bg-amber-800 text-white" : "bg-warn-soft text-amber-800 hover:brightness-95",
            )}
          >
            ● {n.filter(data.noPriceCount!)}
          </button>
          {noPrice && <span className="text-sm text-muted-foreground">{n.filterHint}</span>}
        </div>
      )}
      {data && <p className="text-sm text-muted-foreground">{q ? t.orderSearch : data.page >= 1 ? t.orderFromToday : t.orderBeforeToday}</p>}
      {error && <p className="text-destructive">{describeError(error)}</p>}
      <ul className={cn("flex flex-col gap-1.5", isFetching && "opacity-70")}>
        {data?.docs.map(r => {
          // 28/10/2026: the row of its next movement, a green arrival or an indigo departure (a missing price stays amber).
          const move = nextMovementOf(r.status);
          return (
            <li
              key={r.id}
              className={cn("flex flex-wrap items-center gap-x-3 overflow-hidden rounded-lg border border-border bg-card", move && MOVEMENT_CARD[move], without(r) && "bg-warn-soft")}
              data-testid={without(r) ? "row-no-price" : undefined}
            >
            <Link to={`/reservations/${r.id}`} className="flex min-h-16 min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-1 py-2 hover:bg-accent">
              <Plate value={r.plate} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold">{r.customerName}</span>
                <span className="tabular block text-sm text-muted-foreground">
                  <span className="font-mono">{r.reference}</span> · {dateTimeShort(r.arrivalAt)} → {dateTimeShort(r.returnAt)}
                </span>
                {move && <MovementPill kind={move} time={dateTimeShort(move === "arrival" ? r.arrivalAt : r.returnAt)} className="mt-1" />}
              </span>
              {/* 19/10/2026: for the managers, the price and, for a comparator's booking, what they keep. */}
              {/* 29/10/2026 (« Payé par »): and how it was paid. */}
              {priced && r.priceCents !== null && (r.commission || paidBy(r)) && (
                <span className="tabular text-right font-mono text-sm" data-testid="list-net">
                  <span className="block">{euros(r.priceCents)}</span>
                  {r.commission && <span className="block text-lime-deep">{fr.commission.keeps(euros(r.commission.netCents ?? r.priceCents))}</span>}
                  {paidBy(r) && (
                    <span className="block font-sans text-muted-foreground" data-testid="list-paid-by">
                      {fr.paidBy[paidBy(r)!]}
                    </span>
                  )}
                </span>
              )}
              <span className="rounded-full border border-border bg-white px-2.5 py-1 text-sm font-bold uppercase text-muted-foreground">{fr.status[r.status]}</span>
            </Link>
            {/* 21/10/2026 (choice A): no price yet, typed here without opening the booking. */}
            {without(r) &&
              (isPriceLocked(r) ? (
                <span className="px-2 text-sm text-muted-foreground">{n.locked}</span>
              ) : editing === r.id ? (
                <QuickPrice id={r.id} reference={r.reference} autoFocus onCancel={() => setEditing(null)} className="px-1 py-2" />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(r.id)}
                  className="mx-1 my-2 h-10 rounded-full border border-dashed border-warn bg-warn-soft px-3 text-sm font-semibold text-amber-800 hover:brightness-95"
                >
                  + {n.toFill}
                </button>
              ))}
            </li>
          );
        })}
      </ul>
      {data && data.docs.length === 0 && (
        <p className="text-muted-foreground">{noPrice && !q && data.totalDocs === 0 ? n.none : !q && data.hasPrevPage ? t.noneFromToday : t.noResult}</p>
      )}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={!data.hasPrevPage}
            onClick={() => setParams(withParams({ page: String(page - 1) }))}
            className="h-11 border border-border px-4 font-semibold uppercase disabled:opacity-40"
          >
            {t.previous}
          </button>
          <span className="tabular font-mono text-muted-foreground">{t.page(data.pageNumber ?? data.page, data.totalPages)}</span>
          <button
            disabled={!data.hasNextPage}
            onClick={() => setParams(withParams({ page: String(page + 1) }))}
            className="h-11 border border-border px-4 font-semibold uppercase disabled:opacity-40"
          >
            {t.next}
          </button>
        </div>
      )}
    </>
  );
}
