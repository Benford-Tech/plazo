import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plate } from "@/components/Plate";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { dateTimeShort, localParts, nightsBetween } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mirrors backend/src/domain/reservation.ts. Forward steps first, then the corrections.
const NEXT_STEPS: Record<ReservationStatus, ReservationStatus[]> = {
  upcoming: ["arrived", "no_show", "cancelled"],
  arrived: ["shuttled_out", "return_requested", "returned", "upcoming"],
  shuttled_out: ["return_requested", "returned", "arrived"],
  return_requested: ["returned", "shuttled_out"],
  returned: ["return_requested"],
  cancelled: ["upcoming"],
  no_show: ["upcoming"],
};
const MANAGE_ONLY: ReservationStatus[] = ["cancelled", "no_show"];
const CLOSED: ReservationStatus[] = ["returned", "cancelled", "no_show"];

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2.5">
      <dt className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg">{children}</dd>
    </div>
  );
}

function StatusActions({ reservation }: { reservation: Reservation }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const change = useMutation({
    mutationFn: (status: ReservationStatus) => adminApi.changeReservationStatus(reservation.id, status),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["reservation", reservation.id], data);
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      toast.success(fr.status[data.status]);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  // A booking refunded online stays closed: the API refuses every status change (booking_refunded).
  const steps = (reservation.paymentStatus === "refunded" ? [] : NEXT_STEPS[reservation.status]).filter(
    s => can(user?.role, "reservations:status") && (!MANAGE_ONLY.includes(s) && !MANAGE_ONLY.includes(reservation.status) ? true : can(user?.role, "reservations:manage")),
  );
  if (!steps.length) return null;
  const [primary, ...others] = steps;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => change.mutate(primary)}
        disabled={change.isPending}
        className="h-12 bg-primary px-5 text-lg font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {fr.statusAction[primary]}
      </button>
      {others.map(s => (
        <button
          key={s}
          onClick={() => change.mutate(s)}
          disabled={change.isPending}
          className={cn(
            "h-12 border px-4 font-semibold uppercase tracking-wide hover:bg-accent disabled:opacity-50",
            MANAGE_ONLY.includes(s) ? "border-destructive/60 text-destructive" : "border-border",
          )}
        >
          {fr.statusAction[s]}
        </button>
      ))}
    </div>
  );
}

export default function ReservationPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { data: r, isLoading, error } = useQuery({ queryKey: ["reservation", id], queryFn: () => adminApi.getReservation(id) });
  const t = fr.reservation;

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !r) return <p className="text-destructive">{describeError(error)}</p>;

  const canEdit = can(user?.role, "reservations:manage") && !CLOSED.includes(r.status);
  const nights = nightsBetween(localParts(r.arrivalAt).date, localParts(r.returnAt).date);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-primary pb-3">
        <Link to={`/?date=${localParts(r.arrivalAt).date}`} aria-label={t.back} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Plate value={r.plate} size="lg" />
        <h1 className="text-3xl font-bold">{r.customerName}</h1>
        <span className="tabular ml-auto font-mono text-muted-foreground">{r.reference}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-foreground px-2.5 py-1 text-lg font-bold uppercase text-background">{fr.status[r.status]}</span>
        {r.overbooked && <span className="bg-primary px-2.5 py-1 font-bold uppercase text-primary-foreground">{t.overbookedBadge}</span>}
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="ml-auto h-11 border border-border px-4 font-semibold uppercase hover:bg-accent">
            {t.edit}
          </button>
        )}
        {editing && (
          <button onClick={() => setEditing(false)} className="ml-auto h-11 border border-border px-4 font-semibold uppercase hover:bg-accent">
            {t.cancelEdit}
          </button>
        )}
      </div>

      {editing ? (
        <ReservationForm
          reservation={r}
          onSaved={data => {
            queryClient.setQueryData(["reservation", r.id], data);
            queryClient.invalidateQueries({ queryKey: ["planning"] });
            setEditing(false);
            toast.success(t.saved);
          }}
        />
      ) : (
        <>
          <StatusActions reservation={r} />
          <div className="grid gap-x-8 sm:grid-cols-2">
            <dl>
              <Info label={t.arrival}>
                <span className="tabular font-mono font-bold text-primary">{dateTimeShort(r.arrivalAt)}</span>
              </Info>
              <Info label={t.return}>
                <span className="tabular font-mono font-bold text-primary">{dateTimeShort(r.returnAt)}</span>
                <span className="ml-2 text-muted-foreground">· {t.nights(nights)}</span>
              </Info>
              <Info label={t.returnFlight}>
                <span className="tabular font-mono">{r.returnFlight ?? "—"}</span>
              </Info>
              <Info label={t.passengers}>{r.passengers}</Info>
            </dl>
            <dl>
              <Info label={t.customerPhone}>
                <a href={`tel:${r.customerPhone.replace(/[^+\d]/g, "")}`} className="tabular font-mono text-primary underline-offset-4 hover:underline">
                  {r.customerPhone}
                </a>
              </Info>
              <Info label={t.email}>{r.customerEmail ?? "—"}</Info>
              <Info label={t.channel}>
                {fr.channels[r.channel]}
                {r.channelDetail ? ` · ${r.channelDetail}` : ""}
                {r.externalReference && <span className="tabular ml-2 font-mono text-muted-foreground">{r.externalReference}</span>}
              </Info>
              {r.priceCents !== null && (
                <Info label={fr.importEmail.price}>
                  <span className="tabular font-mono">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(r.priceCents / 100)}
                  </span>
                </Info>
              )}
              <Info label={t.created}>{dateTimeShort(r.createdAt)}</Info>
            </dl>
          </div>
          {r.notes && (
            <dl>
              <Info label={t.notes}>
                <span className="whitespace-pre-line">{r.notes}</span>
              </Info>
            </dl>
          )}
        </>
      )}
    </div>
  );
}
