import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { bookingSurchargesFr as t, describeError } from "@/lib/fr";
import type { BookingSurcharges } from "@/lib/types";

const euros = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;
const eurosShort = (c: number) => (c % 100 === 0 ? `${c / 100} €` : euros(c));
const time = (local: string) => local.slice(11, 16);
const cents = (text: string): number | null => {
  const v = text.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const c = Math.round(Number(v) * 100);
  return c > 0 ? c : null;
};

/**
 * « Suppléments » of the booking page (12/11/2026, « A puis B », B): the late arrival Plazo spots (« Appliquer 10 € » ·
 * « Non »), the parking's supplements in one click, an amount typed on the spot, and what to collect at the parking.
 * Hidden when the parking offers none and none was applied.
 */
export function BookingSurchargesCard({
  reservationId,
  mayConfigure,
}: {
  reservationId: string;
  mayConfigure: boolean;
}) {
  const queryClient = useQueryClient();
  const key = ["reservation-surcharges", reservationId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => adminApi.bookingSurcharges(reservationId),
  });
  const [other, setOther] = useState<{ label: string; amount: string } | null>(
    null,
  );

  const done = (data: BookingSurcharges, message?: string) => {
    queryClient.setQueryData(key, data);
    void queryClient.invalidateQueries({ queryKey: ["reservation-invoices"] });
    void queryClient.invalidateQueries({
      queryKey: ["reservation-history", reservationId],
    });
    if (message) toast.success(message);
  };
  const onError = (err: unknown) => toast.error(describeError(err, t.errors));
  const add = useMutation({
    mutationFn: (
      body: { key: string } | { label: string; amountCents: number },
    ) => adminApi.addBookingSurcharge(reservationId, body),
    onSuccess: (data) => {
      setOther(null);
      done(data, t.added);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      adminApi.removeBookingSurcharge(reservationId, id),
    onSuccess: (data) => done(data, t.removed),
    onError,
  });
  const dismiss = useMutation({
    mutationFn: () => adminApi.dismissBookingSurcharge(reservationId),
    onSuccess: (data) => done(data),
    onError,
  });

  const s = query.data;
  if (!s || (!s.options.length && !s.surcharges.length && !s.suggestion))
    return null;
  const busy = add.isPending || remove.isPending || dismiss.isPending;
  const submitOther = (e: FormEvent) => {
    e.preventDefault();
    if (!other) return;
    const amountCents = cents(other.amount);
    if (!amountCents) {
      toast.error(t.amountInvalid);
      return;
    }
    add.mutate({ label: other.label, amountCents });
  };

  return (
    <section
      data-testid="booking-surcharges"
      className="flex flex-col gap-4 rounded-[14px] border border-panel-line bg-white p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-base font-semibold">{t.title}</h2>
        {mayConfigure && (
          <Link
            to="/parking/reglages"
            className="text-sm font-medium text-lime-deep hover:underline"
          >
            {t.settings}
          </Link>
        )}
      </div>

      {s.suggestion && s.canEdit && (
        <div
          data-testid="surcharge-suggestion"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[#FCD34D] bg-[#FEF3C7] px-4 py-3"
        >
          <div className="flex min-w-[220px] flex-1 flex-col gap-0.5">
            <strong className="text-sm text-[#78350F]">
              {t.lateTitle(s.suggestion.lateMinutes)}
            </strong>
            <span className="text-[13px] text-[#92400E]">
              {t.lateText(
                time(s.suggestion.scheduledAt),
                time(s.suggestion.arrivedAt),
                eurosShort(s.suggestion.amountCents),
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => add.mutate({ key: "late" })}
            className="h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t.apply(eurosShort(s.suggestion.amountCents))}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => dismiss.mutate()}
            className="h-11 rounded-full border border-panel-line bg-white px-4 text-sm disabled:opacity-50"
          >
            {t.no}
          </button>
        </div>
      )}

      {s.canEdit && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.quick}
          </span>
          <div className="flex flex-wrap gap-2">
            {s.options.map((o) => (
              <button
                key={o.key}
                type="button"
                disabled={busy}
                onClick={() => add.mutate({ key: o.key })}
                className="h-11 rounded-full border border-panel-line bg-white px-4 text-sm hover:bg-panel-2 disabled:opacity-50"
              >
                {o.label} · {eurosShort(o.amountCents)}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => setOther({ label: "", amount: "" })}
              className="h-11 rounded-full border border-dashed border-[#C9CDC7] bg-white px-4 text-sm text-muted-foreground hover:bg-panel-2"
            >
              {t.other}
            </button>
          </div>
          {other && (
            <form
              onSubmit={submitOther}
              className="flex flex-wrap items-end gap-2"
            >
              <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-muted-foreground">
                {t.otherLabel}
                <input
                  autoFocus
                  value={other.label}
                  maxLength={80}
                  onChange={(e) =>
                    setOther({ ...other, label: e.target.value })
                  }
                  className="h-11 rounded-lg border border-panel-line px-3 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t.otherAmount}
                <input
                  inputMode="decimal"
                  value={other.amount}
                  onChange={(e) =>
                    setOther({ ...other, amount: e.target.value })
                  }
                  className="h-11 w-28 rounded-lg border border-panel-line px-3 font-mono text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !other.label.trim()}
                className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.add}
              </button>
              <button
                type="button"
                onClick={() => setOther(null)}
                className="h-11 rounded-lg px-3 text-sm text-muted-foreground hover:bg-panel-2"
              >
                {t.cancel}
              </button>
            </form>
          )}
        </div>
      )}

      {s.surcharges.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-panel-line pt-3 text-sm">
          {s.surcharges.map((x) => (
            <div
              key={x.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="min-w-0 flex-1">
                {x.label}{" "}
                <span className="text-muted-foreground">
                  · {t.addedBy(x.by, time(x.at))}
                </span>
              </span>
              <span className="font-mono">{euros(x.amountCents)}</span>
              {s.canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove.mutate(x.id)}
                  className="text-sm font-medium text-lime-deep hover:underline disabled:opacity-50"
                >
                  {t.remove}
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-between font-semibold">
            <span>{t.total}</span>
            <span data-testid="surcharges-total" className="font-mono">
              {euros(s.totalCents)}
            </span>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t.note}</p>
    </section>
  );
}
