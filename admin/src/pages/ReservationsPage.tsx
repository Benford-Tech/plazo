import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plate } from "@/components/Plate";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";

export default function ReservationsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);
  const [input, setInput] = useState(q);
  const { data, error, isFetching } = useQuery({
    queryKey: ["reservations", q, page],
    queryFn: () => adminApi.searchReservations({ q, page }),
    placeholderData: keepPreviousData,
  });
  const t = fr.reservation;

  return (
    <>
      <h1 className="text-3xl font-bold uppercase tracking-wide">{t.listTitle}</h1>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          setParams(input.trim() ? { q: input.trim() } : {});
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
          className="h-12 min-w-0 flex-1 border border-border bg-card px-3 text-lg outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />
        <button type="submit" aria-label={t.search} className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground">
          <Search className="h-5 w-5" />
        </button>
      </form>

      {error && <p className="text-destructive">{describeError(error)}</p>}
      <ul className={isFetching ? "opacity-70" : ""}>
        {data?.docs.map(r => (
          <li key={r.id}>
            <Link to={`/reservations/${r.id}`} className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-1 py-2 hover:bg-accent">
              <Plate value={r.plate} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold">{r.customerName}</span>
                <span className="tabular block text-sm text-muted-foreground">
                  <span className="font-mono">{r.reference}</span> · {dateTimeShort(r.arrivalAt)} → {dateTimeShort(r.returnAt)}
                </span>
              </span>
              <span className="border border-border px-2 py-1 text-sm font-bold uppercase text-muted-foreground">{fr.status[r.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
      {data && data.docs.length === 0 && <p className="text-muted-foreground">{t.noResult}</p>}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={!data.hasPrevPage}
            onClick={() => setParams({ ...(q ? { q } : {}), page: String(page - 1) })}
            className="h-11 border border-border px-4 font-semibold uppercase disabled:opacity-40"
          >
            {t.previous}
          </button>
          <span className="tabular font-mono text-muted-foreground">{t.page(data.page, data.totalPages)}</span>
          <button
            disabled={!data.hasNextPage}
            onClick={() => setParams({ ...(q ? { q } : {}), page: String(page + 1) })}
            className="h-11 border border-border px-4 font-semibold uppercase disabled:opacity-40"
          >
            {t.next}
          </button>
        </div>
      )}
    </>
  );
}
