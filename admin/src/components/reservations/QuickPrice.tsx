import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { parseEuros } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const t = fr.noPrice;

/**
 * A price typed in place for a booking without one (21/10/2026, « Mets en évidence les réservations sans prix », choice
 * A + C): the list's row and the dashboard's « Les compléter » card. Enter saves; the lists and counts are read again.
 */
export function QuickPrice({
  id,
  reference,
  autoFocus,
  onCancel,
  className,
}: {
  id: string;
  reference: string;
  autoFocus?: boolean;
  /** Shows « Annuler » (the list's row folds back to its pill). */
  onCancel?: () => void;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const save = useMutation({
    mutationFn: (cents: number) => adminApi.setReservationPrice(id, cents),
    onSuccess: () => {
      toast.success(t.saved);
      for (const key of ["reservations", "dashboard", "revenue", "reservation"])
        void queryClient.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => toast.error(describeError(error)),
  });
  return (
    <form
      className={cn("flex items-center gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const cents = parseEuros(value);
        if (cents === null) {
          toast.error(t.invalid);
          return;
        }
        save.mutate(cents);
      }}
    >
      <label className="flex h-10 items-center gap-1 rounded-lg border-2 border-primary bg-panel px-2">
        <input
          aria-label={t.input(reference)}
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && onCancel) onCancel();
          }}
          placeholder="0,00"
          className="w-20 bg-transparent text-right font-mono text-sm outline-none"
        />
        <span className="text-sm text-muted-foreground">€</span>
      </label>
      <button
        type="submit"
        disabled={!value || save.isPending}
        className="h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {t.save}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {t.cancel}
        </button>
      )}
    </form>
  );
}
