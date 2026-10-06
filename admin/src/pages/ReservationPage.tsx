import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plate } from "@/components/Plate";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { NextStep } from "@/components/reservations/NextStep";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { dateTimeShort, localParts, nightsBetween, timeOf } from "@/lib/datetime";
import { describeError, fr, quickCardFr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// The next statuses come from the API (GET /internal/reservations/:id, 06/10/2026): one table, on the server.
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
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-lime-deep pb-3">
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
          <NextStep reservation={r} />
          <div className="grid gap-x-8 sm:grid-cols-2">
            <dl>
              <Info label={t.arrival}>
                <span className="tabular font-mono font-bold text-lime-deep">{dateTimeShort(r.arrivalAt)}</span>
              </Info>
              <Info label={t.return}>
                <span className="tabular font-mono font-bold text-lime-deep">{dateTimeShort(r.returnAt)}</span>
                <span className="ml-2 text-muted-foreground">· {t.nights(nights)}</span>
              </Info>
              <Info label={t.departureFlight}>
                <span className="tabular font-mono">{r.departureFlight ?? "—"}</span>
                {r.departureFlight && r.departureStatus && (
                  <span className="ml-2 text-muted-foreground">
                    · {t.departureStatus[r.departureStatus] ?? r.departureStatus}
                    {(r.departureEstimatedAt ?? r.departureScheduledAt) && ` · ${t.takeOff(timeOf((r.departureEstimatedAt ?? r.departureScheduledAt)!))}`}
                  </span>
                )}
              </Info>
              <Info label={t.returnFlight}>
                <span className="tabular font-mono">{r.returnFlight ?? "—"}</span>
              </Info>
              {r.stop && <Info label={t.stop}>{r.stop.name}</Info>}
              <Info label={quickCardFr.spot}>
                <span className="tabular font-mono">{r.spot?.code ?? quickCardFr.noSpot}</span>
                <span className="ml-2 text-muted-foreground">· {quickCardFr.keys} {r.keyHook ?? quickCardFr.noKeys}</span>
              </Info>
              <Info label={t.passengers}>{r.passengers}</Info>
              {(r.vehicleModel || r.vehicleColour) && <Info label={t.vehicleModel}>{t.vehicleDetails(r.vehicleModel, r.vehicleColour)}</Info>}
              {r.returnNoticeKind && r.returnNoticeAt && (
                <Info label={t.returnNotice}>
                  <span className="font-semibold text-warn-text">{t.returnNoticeLine(r.returnNoticeKind, r.returnNoticeText ?? null, dateTimeShort(r.returnNoticeAt))}</span>
                </Info>
              )}
              {r.carLat != null && r.carLng != null && r.carLocatedAt && (
                <Info label={t.carPosition}>
                  <span className="tabular font-mono">{r.carLat.toFixed(5)}, {r.carLng.toFixed(5)}</span>
                  <span className="ml-2 text-muted-foreground">
                    · {t.carBy[r.carLocatedBy ?? "traveller"]} · {dateTimeShort(r.carLocatedAt)}
                    {r.carAccuracyM != null && ` · ${t.carAccuracy(r.carAccuracyM)}`}
                    {r.carNote && ` · ${r.carNote}`}
                  </span>{" "}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${r.carLat},${r.carLng}&travelmode=walking`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lime-deep underline"
                  >
                    {t.carDirections}
                  </a>
                </Info>
              )}
            </dl>
            <dl>
              <Info label={t.customerPhone}>
                <a href={`tel:${r.customerPhone.replace(/[^+\d]/g, "")}`} className="tabular font-mono text-lime-deep underline-offset-4 hover:underline">
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
                <Info label={fr.reservation.pricePaid}>
                  <span className="tabular font-mono">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(r.priceCents / 100)}
                  </span>
                </Info>
              )}
              <Info label={t.created}>{dateTimeShort(r.createdAt)}</Info>
            </dl>
          </div>
          {(r.notes || r.customerNote) && (
            <dl>
              {r.customerNote && (
                <Info label={t.customerNote}>
                  <span className="whitespace-pre-line">{r.customerNote}</span>
                </Info>
              )}
              {r.notes && (
                <Info label={t.notes}>
                  <span className="whitespace-pre-line">{r.notes}</span>
                </Info>
              )}
            </dl>
          )}
        </>
      )}
    </div>
  );
}
