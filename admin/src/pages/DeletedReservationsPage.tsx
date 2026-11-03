import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { DeletedReservation } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.trash;
const DAY_MS = 86_400_000;
const GRID = "md:grid md:grid-cols-[minmax(0,1.3fr)_150px_minmax(0,1.4fr)_130px_130px] md:items-center md:gap-3";

function dayMonth(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(new Date(iso));
}

function when(iso: string, now = Date.now()): string {
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...o, timeZone: "Europe/Paris" }).format(new Date(iso));
  const day = (d: number) => fmt({ year: "numeric", month: "2-digit", day: "2-digit" }) === new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" }).format(new Date(now - d * DAY_MS));
  const time = fmt({ hour: "2-digit", minute: "2-digit" });
  if (day(0)) return `aujourd'hui ${time}`;
  if (day(1)) return `hier ${time}`;
  return dayMonth(iso);
}

function sourceOf(r: DeletedReservation): string {
  if (r.channel === "aggregator" && r.channelDetail) return r.channelDetail;
  return (fr.channels as Record<string, string>)[r.channel]?.toLowerCase() ?? r.channel;
}

/**
 * Réservations › Supprimées (03/11/2026, maquette « Trash »): the bookings managers deleted, kept 45 days with who, when
 * and why, then erased by the nightly purge. « Restaurer » brings one back as it was.
 */
export default function DeletedReservationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["deleted-reservations"], queryFn: () => adminApi.deletedReservations() });
  const restore = useMutation({
    mutationFn: (id: string) => adminApi.restoreReservation(id),
    onSuccess: ({ overbooked }) => {
      void queryClient.invalidateQueries({ queryKey: ["deleted-reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(overbooked ? t.restoredOverbooked : t.restoredToast);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });
  const rows = query.data?.data ?? [];
  const now = Date.now();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/reservations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>
      <h1 className="font-narrow text-3xl font-bold">{t.title}</h1>
      <p className="max-w-[65ch] text-sm text-muted-foreground">{t.intro(query.data?.retentionDays ?? 45)}</p>
      {query.error && <p className="text-destructive">{describeError(query.error)}</p>}
      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <p className="rounded-[14px] bg-card p-6 text-center text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className={cn("hidden border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground", GRID)}>
            <span>{t.columns.who}</span>
            <span>{t.columns.stay}</span>
            <span>{t.columns.deleted}</span>
            <span>{t.columns.purge}</span>
            <span />
          </div>
          <ul>
            {rows.map(r => {
              const left = Math.ceil((new Date(r.purgeAt).getTime() - now) / DAY_MS);
              return (
                <li key={r.id} data-testid={`deleted-${r.id}`} className={cn("flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0", GRID)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Plate value={r.plate} size="sm" />
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{r.customerName}</span>
                      <span className="text-muted-foreground"> · {sourceOf(r)}</span>
                    </span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {dayMonth(r.arrivalAt)} → {dayMonth(r.returnAt)}
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block text-muted-foreground">{t.by(r.deletedBy?.firstName ?? null, when(r.deletedAt, now))}</span>
                    <span className="block truncate">{r.deleteReason ? `« ${r.deleteReason} »` : <span className="text-muted-foreground">{t.noReason}</span>}</span>
                  </span>
                  <span className={cn("text-sm", left <= 3 && "font-semibold text-red-700")}>
                    {dayMonth(r.purgeAt)} · {t.inDays(left)}
                  </span>
                  <div className="md:text-right">
                    <button
                      type="button"
                      data-testid={`restore-${r.id}`}
                      disabled={restore.isPending}
                      onClick={() => restore.mutate(r.id)}
                      className="h-10 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      {restore.isPending && restore.variables === r.id ? t.restoring : t.restore}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="max-w-[65ch] text-xs text-muted-foreground">{t.restoreHelp}</p>
    </div>
  );
}
