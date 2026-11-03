import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { deletable } from "@/lib/reservation-trash";
import type { Reservation } from "@/lib/types";

const t = fr.trash;
const DAY_MS = 86_400_000;

function longDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(date);
}

/**
 * « Supprimer la réservation… » (03/11/2026, maquettes https://claude.ai/artifact/JD6yJ7YvnSpFkrKp5nCM1D): managers only,
 * at the foot of the booking's next step. A question with an optional reason, then the booking goes to Réservations ›
 * Supprimées for 45 days; the toast offers « Annuler » (restore) for a few seconds.
 */
export function DeleteReservation({ reservation }: { reservation: Reservation }) {
  const [open, setOpen] = useState(false);
  if (!deletable(reservation)) return null;
  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          data-testid="delete-reservation"
          onClick={() => setOpen(true)}
          title={t.deleteHelp}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-red-700 hover:bg-bad-soft"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t.deleteButton}
        </button>
      </div>
      {open && <DeleteDialog reservation={reservation} onClose={() => setOpen(false)} />}
    </>
  );
}

function DeleteDialog({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    keep.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    void queryClient.invalidateQueries({ queryKey: ["planning"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["deleted-reservations"] });
  };
  const restore = async () => {
    try {
      const { overbooked } = await adminApi.restoreReservation(reservation.id);
      refresh();
      toast.success(overbooked ? t.restoredOverbooked : t.restoredToast);
      navigate(`/reservations/${reservation.id}`);
    } catch (err) {
      toast.error(describeError(err, t.errors));
    }
  };
  const remove = useMutation({
    mutationFn: () => adminApi.deleteReservation(reservation.id, reason.trim() || undefined),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["reservation", reservation.id] });
      refresh();
      toast.success(t.deleted, { duration: 8000, action: { label: t.undo, onClick: () => void restore() } });
      onClose();
      navigate("/reservations");
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });
  const purge = longDate(new Date(Date.now() + 45 * DAY_MS));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label={t.keep} tabIndex={-1} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        data-testid="delete-dialog"
        className="relative w-full max-w-md space-y-4 rounded-[14px] bg-card p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <h2 id="delete-title" className="flex-1 text-lg font-bold">
            {t.dialogTitle(reservation.customerName)}
          </h2>
          <button type="button" onClick={onClose} aria-label={t.keep} className="-m-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{t.dialogBody}</p>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
            <span>{t.restoreLine}</span>
          </li>
          <li className="flex gap-2">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>{t.purgeLine(purge)}</span>
          </li>
        </ul>
        <label className="block space-y-1 text-sm font-medium">
          <span>{t.reasonLabel}</span>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={200}
            placeholder={t.reasonPlaceholder}
            data-testid="delete-reason"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px] outline-none focus-visible:border-lime-deep"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button ref={keep} type="button" onClick={onClose} className="h-11 rounded-full border border-border px-5 font-semibold hover:bg-muted">
            {t.keep}
          </button>
          <button
            type="button"
            data-testid="delete-confirm"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
            className="h-11 rounded-full bg-red-700 px-5 font-bold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {remove.isPending ? t.deleting : t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
