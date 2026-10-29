import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { Sparkles } from "lucide-react";
import { EXTRA_ICONS } from "@/lib/extras";
import { describeError, extrasFr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { ExtraStatus, ReservationExtra } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = extrasFr.orders;

const TONE: Record<ExtraStatus, BadgeTone> = { ordered: "warn", done: "ok", refused: "line", refunded: "line" };

/**
 * « Services commandés » of a booking (21/10/2026, direction P): what the traveller ordered on Plazo, « Fait » (the
 * traveller hears it) or « Pas possible » (refunded at once). Hidden when nothing was ordered. On the full booking page
 * and the operational card.
 */
export function ReservationExtras({
  reservationId,
  compact = false,
  mayAct = true,
}: {
  reservationId: string;
  compact?: boolean;
  /** « Fait » / « Pas possible » (permission reservations:status, which every staff role has; the API checks it). */
  mayAct?: boolean;
}) {
  const queryClient = useQueryClient();
  const key = ["reservation-extras", reservationId];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getReservationExtras(reservationId) });
  const [refusing, setRefusing] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const onDone = (data: { extras: ReservationExtra[] }) => {
    queryClient.setQueryData(key, data);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const accept = useMutation({
    mutationFn: (extraId: string) => adminApi.acceptExtra(reservationId, extraId),
    onSuccess: data => {
      onDone(data);
      toast.success(t.acceptedToast);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });
  const done = useMutation({
    mutationFn: (extraId: string) => adminApi.markExtraDone(reservationId, extraId),
    onSuccess: data => {
      onDone(data);
      toast.success(t.doneToast);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });
  const refuse = useMutation({
    mutationFn: ({ extraId, why }: { extraId: string; why: string }) => adminApi.refuseExtra(reservationId, extraId, why),
    onSuccess: data => {
      onDone(data);
      setRefusing(null);
      setReason("");
      toast.success(t.refusedToast);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });

  const extras = query.data?.extras ?? [];
  if (!extras.length) return null;
  const toDo = extras.filter(e => e.status === "ordered").length;

  return (
    <section data-testid="reservation-extras" className={cn("space-y-2", !compact && "rounded-xl border border-panel-line bg-panel p-4")}>
      <div className="flex items-center gap-2">
        <h3 className={cn(compact ? "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" : "text-base font-semibold")}>{t.title}</h3>
        {toDo > 0 && (
          <Badge tone="warn" className="ml-auto">
            {t.toDoCount(toDo)}
          </Badge>
        )}
      </div>
      <ul className="space-y-2">
        {extras.map(e => {
          const Icon = EXTRA_ICONS[e.kind] ?? Sparkles;
          return (
            <li key={e.id} data-testid={`order-${e.kind}`} className="space-y-2 rounded-lg border border-panel-line bg-background p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime-deep">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{e.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {euros(e.priceCents)} · {e.withBooking || !e.paidAt ? t.paidWithBooking : t.paidOn(dateTimeShort(e.paidAt))}
                  </span>
                  {e.status === "ordered" && e.acceptedAt && (
                    <span className="text-xs text-lime-deep">{t.acceptedLine(dateTimeShort(e.acceptedAt), e.acceptedBy ?? null)}</span>
                  )}
                  {e.status === "done" && e.doneAt && <span className="text-xs text-ok-text">{t.doneLine(dateTimeShort(e.doneAt), e.doneBy)}</span>}
                  {e.status === "refused" && <span className="text-xs text-muted-foreground">{t.refusedLine(e.refusedReason)}</span>}
                </span>
                <Badge tone={TONE[e.status]}>{t.status[e.status]}</Badge>
              </div>
              {e.status === "ordered" && mayAct && refusing !== e.id && (
                <div className="flex flex-wrap gap-2">
                  {!e.acceptedAt && (
                    <button
                      type="button"
                      disabled={accept.isPending}
                      onClick={() => accept.mutate(e.id)}
                      className="h-10 rounded-lg border border-lime-deep px-4 text-sm font-semibold text-lime-deep hover:bg-lime/10 disabled:opacity-50"
                    >
                      {t.accept}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={done.isPending}
                    onClick={() => done.mutate(e.id)}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
                  >
                    {t.done}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefusing(e.id);
                      setReason("");
                    }}
                    className="h-10 rounded-lg border border-panel-line bg-panel px-4 text-sm font-semibold hover:bg-panel-2"
                  >
                    {t.refuse}
                  </button>
                </div>
              )}
              {refusing === e.id && (
                <form
                  className="space-y-2"
                  onSubmit={ev => {
                    ev.preventDefault();
                    refuse.mutate({ extraId: e.id, why: reason.trim() });
                  }}
                >
                  <label htmlFor={`refuse-${e.id}`} className="text-xs font-semibold">
                    {t.reasonLabel}
                  </label>
                  <input
                    id={`refuse-${e.id}`}
                    value={reason}
                    maxLength={200}
                    placeholder={t.reasonPlaceholder}
                    onChange={ev => setReason(ev.target.value)}
                    className="h-10 w-full rounded-lg border border-panel-line bg-panel px-3 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{t.hint}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={refuse.isPending}
                      className="h-10 rounded-lg bg-bad px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {t.confirmRefuse}
                    </button>
                    <button type="button" onClick={() => setRefusing(null)} className="h-10 rounded-lg border border-panel-line px-4 text-sm font-semibold">
                      {t.cancel}
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
