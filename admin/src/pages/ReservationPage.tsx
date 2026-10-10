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
import { adminApi, ApiError } from "@/lib/api";
import {
  dateTimeShort,
  localParts,
  nightsBetween,
  timeOf,
} from "@/lib/datetime";
import { describeError, errorMessage, fr, quickCardFr } from "@/lib/fr";
import { centsToInput, euros, isPriceLocked, parseEuros } from "@/lib/pricing";
import { can } from "@/lib/roles";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// The next statuses come from the API (GET /internal/reservations/:id, 06/10/2026): one table, on the server.
const MANAGE_ONLY: ReservationStatus[] = ["cancelled", "no_show"];
const CLOSED: ReservationStatus[] = ["returned", "cancelled", "no_show"];

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-2.5">
      <dt className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg">{children}</dd>
    </div>
  );
}

/**
 * « Prix payé » (10/10/2026, « Pouvoir modifier le prix après l'intégration du mail »): the amount, with « Modifier le
 * prix » (« Ajouter le prix » when there is none) for the staff who manage bookings (managers and agents), also once
 * the stay is over; never a Plazo booking's nor a cancelled one's (PUT /internal/reservations/:id/price, as the revenue
 * page's « Les compléter »).
 */
function PriceLine({
  reservation: r,
  canManage,
}: {
  reservation: Reservation;
  canManage: boolean;
}) {
  const t = fr.reservation;
  const queryClient = useQueryClient();
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editable =
    canManage && !isPriceLocked(r) && r.status !== "cancelled";
  const save = useMutation({
    mutationFn: (cents: number | null) =>
      adminApi.setReservationPrice(r.id, cents),
    onSuccess: ({ priceCents }) => {
      queryClient.setQueryData<Reservation>(["reservation", r.id], (old) =>
        old ? { ...old, priceCents } : old,
      );
      void queryClient.invalidateQueries({ queryKey: ["revenue"] });
      setValue(null);
      setError(null);
      toast.success(t.priceSaved);
    },
    // The field's own reason (too large, locked) rather than « some fields need fixing ».
    onError: (err) =>
      setError(
        err instanceof ApiError && err.fields?.priceCents
          ? errorMessage(err.fields.priceCents)
          : describeError(err),
      ),
  });
  if (r.priceCents === null && !editable) return null;

  return (
    <Info label={t.pricePaid}>
      {value === null ? (
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="tabular font-mono">
            {r.priceCents === null ? "—" : euros(r.priceCents)}
          </span>
          {editable && (
            <button
              type="button"
              onClick={() =>
                setValue(
                  r.priceCents === null ? "" : centsToInput(r.priceCents),
                )
              }
              className="text-base text-lime-deep underline-offset-4 hover:underline"
            >
              {r.priceCents === null ? t.addPrice : t.editPrice}
            </button>
          )}
        </span>
      ) : (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const cents = value.trim() ? parseEuros(value) : null;
            if (value.trim() && cents === null) {
              setError(errorMessage("invalid_amount"));
              return;
            }
            save.mutate(cents);
          }}
        >
          <input
            aria-label={t.priceInput}
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            aria-invalid={!!error}
            className="tabular h-10 w-32 border border-border bg-card px-2.5 text-right font-mono text-lg outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            €
          </span>
          <button
            type="submit"
            disabled={save.isPending}
            className="h-10 bg-primary px-4 text-base font-bold uppercase text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {t.savePrice}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue(null);
              setError(null);
            }}
            className="h-10 border border-border px-3 text-base hover:bg-accent"
          >
            {t.cancelPrice}
          </button>
          {error && (
            <p role="alert" className="w-full text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </Info>
  );
}

export default function ReservationPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const {
    data: r,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => adminApi.getReservation(id),
  });
  const t = fr.reservation;

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !r)
    return <p className="text-destructive">{describeError(error)}</p>;

  const canEdit =
    can(user?.role, "reservations:manage") && !CLOSED.includes(r.status);
  const nights = nightsBetween(
    localParts(r.arrivalAt).date,
    localParts(r.returnAt).date,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-lime-deep pb-3">
        <Link
          to={`/?date=${localParts(r.arrivalAt).date}`}
          aria-label={t.back}
          className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Plate value={r.plate} size="lg" />
        <h1 className="text-3xl font-bold">{r.customerName}</h1>
        <span className="tabular ml-auto font-mono text-muted-foreground">
          {r.reference}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-foreground px-2.5 py-1 text-lg font-bold uppercase text-background">
          {fr.status[r.status]}
        </span>
        {r.overbooked && (
          <span className="bg-primary px-2.5 py-1 font-bold uppercase text-primary-foreground">
            {t.overbookedBadge}
          </span>
        )}
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto h-11 border border-border px-4 font-semibold uppercase hover:bg-accent"
          >
            {t.edit}
          </button>
        )}
        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="ml-auto h-11 border border-border px-4 font-semibold uppercase hover:bg-accent"
          >
            {t.cancelEdit}
          </button>
        )}
      </div>

      {editing ? (
        <ReservationForm
          reservation={r}
          onSaved={(data) => {
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
                <span className="tabular font-mono font-bold text-lime-deep">
                  {dateTimeShort(r.arrivalAt)}
                </span>
              </Info>
              <Info label={t.return}>
                <span className="tabular font-mono font-bold text-lime-deep">
                  {dateTimeShort(r.returnAt)}
                </span>
                <span className="ml-2 text-muted-foreground">
                  · {t.nights(nights)}
                </span>
              </Info>
              <Info label={t.departureFlight}>
                <span className="tabular font-mono">
                  {r.departureFlight ?? "—"}
                </span>
                {r.departureFlight && r.departureStatus && (
                  <span className="ml-2 text-muted-foreground">
                    ·{" "}
                    {t.departureStatus[r.departureStatus] ?? r.departureStatus}
                    {(r.departureEstimatedAt ?? r.departureScheduledAt) &&
                      ` · ${t.takeOff(timeOf((r.departureEstimatedAt ?? r.departureScheduledAt)!))}`}
                  </span>
                )}
              </Info>
              <Info label={t.returnFlight}>
                <span className="tabular font-mono">
                  {r.returnFlight ?? "—"}
                </span>
              </Info>
              {r.stop && <Info label={t.stop}>{r.stop.name}</Info>}
              <Info label={quickCardFr.spot}>
                <span className="tabular font-mono">
                  {r.file
                    ? quickCardFr.inFile(r.file.code, r.filePosition ?? null)
                    : (r.spot?.code ?? quickCardFr.noSpot)}
                </span>
                <span className="ml-2 text-muted-foreground">
                  · {quickCardFr.keys} {r.keyHook ?? quickCardFr.noKeys}
                </span>
              </Info>
              <Info label={t.passengers}>{r.passengers}</Info>
              {(r.vehicleModel || r.vehicleColour) && (
                <Info label={t.vehicleModel}>
                  {t.vehicleDetails(r.vehicleModel, r.vehicleColour)}
                </Info>
              )}
              {r.returnNoticeKind && r.returnNoticeAt && (
                <Info label={t.returnNotice}>
                  <span className="font-semibold text-warn-text">
                    {t.returnNoticeLine(
                      r.returnNoticeKind,
                      r.returnNoticeText ?? null,
                      dateTimeShort(r.returnNoticeAt),
                    )}
                  </span>
                </Info>
              )}
              {r.carLat != null && r.carLng != null && r.carLocatedAt && (
                <Info label={t.carPosition}>
                  <span className="tabular font-mono">
                    {r.carLat.toFixed(5)}, {r.carLng.toFixed(5)}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    · {t.carBy[r.carLocatedBy ?? "traveller"]} ·{" "}
                    {dateTimeShort(r.carLocatedAt)}
                    {r.carAccuracyM != null &&
                      ` · ${t.carAccuracy(r.carAccuracyM)}`}
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
                <a
                  href={`tel:${r.customerPhone.replace(/[^+\d]/g, "")}`}
                  className="tabular font-mono text-lime-deep underline-offset-4 hover:underline"
                >
                  {r.customerPhone}
                </a>
              </Info>
              <Info label={t.email}>{r.customerEmail ?? "—"}</Info>
              <Info label={t.channel}>
                {fr.channels[r.channel]}
                {r.channelDetail ? ` · ${r.channelDetail}` : ""}
                {r.externalReference && (
                  <span className="tabular ml-2 font-mono text-muted-foreground">
                    {r.externalReference}
                  </span>
                )}
              </Info>
              <PriceLine
                reservation={r}
                canManage={can(user?.role, "reservations:manage")}
              />
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
