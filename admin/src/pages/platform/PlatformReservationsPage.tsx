import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTime, describeError, fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { PlatformReservation } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.reservations;
const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";
const inputClass = "h-11 border border-border bg-background px-3 text-base outline-none focus-visible:border-lime-deep";

const statusLabel = (status: PlatformReservation["status"]) => (status === "pending_payment" ? t.pendingPayment : fr.status[status]);

/** "Réservations" tab: every operator's bookings, read-only, without the travellers' contact details. */
export default function PlatformReservationsPage() {
  const [operatorId, setOperatorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["platform", "reservations", operatorId, from, to, page],
    queryFn: () => adminApi.getPlatformReservations({ operatorId, from, to, page }),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <>
      <h1 className="text-[26px] font-bold uppercase tracking-[0.03em]">{t.title}</h1>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="res-operator" className={labelClass}>
            {t.operator}
          </label>
          <select id="res-operator" value={operatorId} onChange={filter(setOperatorId)} className={cn(inputClass, "min-w-[14rem]")}>
            <option value="">{t.allOperators}</option>
            {data?.operators.map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="res-from" className={labelClass}>
            {t.from}
          </label>
          <input id="res-from" type="date" value={from} onChange={filter(setFrom)} className={cn(inputClass, "font-mono")} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="res-to" className={labelClass}>
            {t.to}
          </label>
          <input id="res-to" type="date" value={to} onChange={filter(setTo)} className={cn(inputClass, "font-mono")} />
        </div>
        {data && <p className="pb-2 text-muted-foreground">{t.total(data.totalDocs)}</p>}
      </div>
      <p className="text-sm text-muted-foreground">{t.privacy}</p>

      {query.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : query.error ? (
        <p className="text-destructive">{describeError(query.error)}</p>
      ) : data?.docs.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-base">
            <thead>
              <tr className="border-b border-border text-left">
                {[t.colArrival, t.colOperator, t.colParking, t.colReference, t.colPlate, t.colStatus, t.colAmount, t.colChannel].map(h => (
                  <th key={h} scope="col" className={cn(labelClass, "px-2 py-2 font-normal")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.docs.map(r => (
                <tr key={r.id} className="border-b border-border">
                  <td className="whitespace-nowrap px-2 py-2.5 font-mono text-lime-deep">{dateTime.format(new Date(r.arrivalAt))}</td>
                  <td className="px-2 py-2.5 font-bold">{r.operator.name}</td>
                  <td className="px-2 py-2.5">{r.parking.name}</td>
                  <td className="px-2 py-2.5 font-mono">{r.reference}</td>
                  <td className="px-2 py-2.5">
                    <Plate value={r.plate} size="sm" />
                  </td>
                  <td className="px-2 py-2.5">{statusLabel(r.status)}</td>
                  <td className="px-2 py-2.5 font-mono">{r.amountCents !== null ? euros(r.amountCents) : "—"}</td>
                  <td className="px-2 py-2.5">{r.channel === "aggregator" && r.channelDetail ? r.channelDetail : fr.channels[r.channel]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-muted-foreground">{t.empty}</p>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button type="button" disabled={!data.hasPrevPage} onClick={() => setPage(page - 1)} className="min-h-10 border border-border px-3 hover:bg-accent disabled:opacity-40">
            {fr.reservation.previous}
          </button>
          <span className="font-mono text-muted-foreground">{fr.reservation.page(data.page, data.totalPages)}</span>
          <button type="button" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)} className="min-h-10 border border-border px-3 hover:bg-accent disabled:opacity-40">
            {fr.reservation.next}
          </button>
        </div>
      )}
    </>
  );
}
