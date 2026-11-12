import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, adminApi } from "@/lib/api";
import { pdfName, savePdf } from "@/lib/contract";
import { contractTemplateFr, describeError, paperworkFr } from "@/lib/fr";
import type {
  BookingInspection,
  BookingPaperwork,
  InspectionDamage,
  InspectionKind,
  InspectionPhotoRef,
  ReservationStatus,
  SignedContractFileKind,
  TravellerInspectionReport,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const t = paperworkFr;
const GUIDED = ["front", "right", "back", "left"] as const;
const LEGACY = ["dashboard", "interior"] as const;
const ghost =
  "min-h-9 whitespace-nowrap rounded-full border border-lime-deep px-3 text-[13px] font-semibold text-lime-deep hover:bg-accent disabled:opacity-50";

const shortFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});
/** « 12/11 11:20 » (Paris). */
const short = (iso: string) =>
  shortFormat.format(new Date(iso)).replace(",", "");

type TabKey = InspectionKind | "traveller";

/** The latest photo of a slot (a photo retaken replaces the one before). */
function photoOf(
  photos: InspectionPhotoRef[],
  slot: string,
): InspectionPhotoRef | null {
  const of = photos.filter((p) => p.slot === slot);
  return of.length ? of[of.length - 1] : null;
}

/** The slots shown for a report: the four sides, then the old dashboard and interior when the report has them. */
function slotsOf(photos: InspectionPhotoRef[]): string[] {
  return [...GUIDED, ...LEGACY.filter((s) => photos.some((p) => p.slot === s))];
}

/**
 * A private photo: read with the staff's token as a blob (cached by React Query, never synced), shown from an object URL
 * revoked when the image leaves the screen.
 */
function usePhotoUrl(
  reservationId: string,
  kind: InspectionKind,
  photoId: string,
) {
  const query = useQuery({
    queryKey: ["inspection-photo", reservationId, kind, photoId],
    queryFn: () => adminApi.inspectionPhoto(reservationId, kind, photoId),
    staleTime: Infinity,
    retry: false,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data) return;
    const next = URL.createObjectURL(query.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [query.data]);
  const unavailable =
    query.error instanceof ApiError &&
    query.error.code === "photos_unavailable";
  return { url, error: query.isError, unavailable };
}

function Photo({
  reservationId,
  kind,
  photo,
  label,
  className,
}: {
  reservationId: string;
  kind: InspectionKind;
  photo: InspectionPhotoRef;
  label: string;
  className?: string;
}) {
  const { url, error, unavailable } = usePhotoUrl(
    reservationId,
    kind,
    photo.id,
  );
  if (error)
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-panel-2 p-2 text-center text-[12px] text-muted-foreground",
          className,
        )}
      >
        {unavailable ? t.photosUnavailable : t.photoError}
      </div>
    );
  if (!url)
    return (
      <div
        className={cn("animate-pulse bg-panel-2", className)}
        aria-label={label}
      />
    );
  return (
    <img src={url} alt={label} className={cn("object-cover", className)} />
  );
}

interface Opened {
  kind: InspectionKind;
  photo: InspectionPhotoRef;
  label: string;
  /** The same slot of the other team report, to compare (drop-off vs return). */
  other: { kind: InspectionKind; photo: InspectionPhotoRef } | null;
}

function Lightbox({
  reservationId,
  opened,
  onClose,
}: {
  reservationId: string;
  opened: Opened;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);
  const sides = [
    { kind: opened.kind, photo: opened.photo },
    ...(opened.other ? [opened.other] : []),
  ].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "dropoff" ? -1 : 1));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        tabIndex={-1}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.lightbox}
        data-testid="photo-lightbox"
        className="relative flex max-h-full w-full max-w-5xl flex-col gap-3 overflow-y-auto rounded-xl bg-white p-4"
      >
        <div className="flex items-center gap-2">
          <h3 className="flex-1 text-base font-semibold">{opened.label}</h3>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-panel-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className={cn("grid gap-3", sides.length > 1 && "sm:grid-cols-2")}>
          {sides.map((side) => (
            <figure key={side.photo.id} className="space-y-1">
              <Photo
                reservationId={reservationId}
                kind={side.kind}
                photo={side.photo}
                label={`${opened.label} · ${side.kind === "dropoff" ? t.compareDropoff : t.compareReturn}`}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
              {sides.length > 1 && (
                <figcaption className="text-[12px] font-semibold text-muted-foreground">
                  {side.kind === "dropoff" ? t.compareDropoff : t.compareReturn}{" "}
                  · {short(side.photo.takenAt)}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The car seen from above, front at the top, the damages as numbered dots (as drawn in Plazo Pro). */
function CarOutline({ damages }: { damages: InspectionDamage[] }) {
  const W = 200;
  const H = 190;
  const w = W * 0.42;
  const h = H * 0.86;
  const left = (W - w) / 2;
  const top = (H - h) / 2;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={t.outline}
      className="h-44 w-full max-w-[220px]"
    >
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={w * 0.32}
        className="fill-panel-2 stroke-foreground"
        strokeWidth={2}
      />
      {[
        [0.14, 0.22, 0.72, 0.16],
        [0.16, 0.42, 0.68, 0.24],
        [0.14, 0.7, 0.72, 0.12],
      ].map(([x, y, ww, hh]) => (
        <rect
          key={y}
          x={left + w * x}
          y={top + h * y}
          width={w * ww}
          height={h * hh}
          rx={6}
          className="fill-none stroke-muted-foreground"
          strokeWidth={1.4}
        />
      ))}
      {damages.map((d) => (
        <g key={d.n}>
          <circle cx={d.x * W} cy={d.y * H} r={9} className="fill-bad" />
          <text
            x={d.x * W}
            y={d.y * H}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={800}
            fill="#fff"
          >
            {d.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PhotoTile({
  label,
  photo,
  onOpen,
  reservationId,
  kind,
  badge,
}: {
  label: string;
  photo: InspectionPhotoRef | null;
  onOpen: () => void;
  reservationId: string;
  kind: InspectionKind;
  badge?: string;
}) {
  return (
    <div className="space-y-1">
      {photo ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={t.open(label)}
          className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-panel-line"
        >
          <Photo
            reservationId={reservationId}
            kind={kind}
            photo={photo}
            label={label}
            className="h-full w-full"
          />
          {badge && (
            <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-bad px-1.5 text-[11px] font-bold text-white">
              {badge}
            </span>
          )}
        </button>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-panel-line bg-panel-2 text-[12px] text-muted-foreground">
          {t.noPhoto}
        </div>
      )}
      <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-panel-2 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{children}</p>
    </div>
  );
}

function decisionLine(r: BookingInspection): string {
  const what = t.decision[r.decision] ?? r.decision;
  if (r.decision === "pending" || r.decision === "accepted_by_default")
    return what;
  const how = r.decisionMethod ? t.decisionHow[r.decisionMethod] : null;
  return how ? `${what} · ${how}` : what;
}

function TeamReport({
  reservationId,
  report,
  other,
  photosAvailable,
  open,
}: {
  reservationId: string;
  report: BookingInspection;
  other: BookingInspection | null;
  photosAvailable: boolean;
  open: (opened: Opened) => void;
}) {
  const closeUps = report.photos.filter((p) => p.slot === "damage");
  const linked = new Set(report.damages.map((d) => d.photoId).filter(Boolean));
  const loose = closeUps.filter((p) => !linked.has(p.id));
  const openSlot = (slot: string, photo: InspectionPhotoRef) => {
    const twin =
      other && slot !== "damage" ? photoOf(other.photos, slot) : null;
    open({
      kind: report.kind,
      photo,
      label: t.slots[slot] ?? slot,
      other: twin && other ? { kind: other.kind, photo: twin } : null,
    });
  };
  const showPhotos = photosAvailable && !report.photosErased;
  return (
    <div className="space-y-3">
      {!report.completedAt && (
        <p className="text-[13px] text-warn-text">{t.inProgress}</p>
      )}
      {!photosAvailable ? (
        <p className="text-[13px] text-muted-foreground">
          {t.photosUnavailable}
        </p>
      ) : report.photosErased ? (
        <p className="text-[13px] text-muted-foreground">{t.photosErased}</p>
      ) : null}
      {showPhotos && (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid={`photos-${report.kind}`}
        >
          {slotsOf(report.photos).map((slot) => {
            const photo = photoOf(report.photos, slot);
            return (
              <PhotoTile
                key={slot}
                label={t.slots[slot] ?? slot}
                photo={photo}
                reservationId={reservationId}
                kind={report.kind}
                onOpen={() => photo && openSlot(slot, photo)}
              />
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <CarOutline damages={report.damages} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.damages}
          </p>
          {report.damages.length === 0 && (
            <p className="text-[13px] text-muted-foreground">{t.noDamage}</p>
          )}
          <ul className="space-y-1.5">
            {report.damages.map((d) => {
              const closeUp = d.photoId
                ? closeUps.find((p) => p.id === d.photoId)
                : undefined;
              return (
                <li
                  key={d.n}
                  className="flex items-center gap-2 text-sm"
                  data-testid="damage"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bad text-[11px] font-bold text-white">
                    {d.n}
                  </span>
                  <span className="min-w-0 flex-1">{d.label}</span>
                  {closeUp && showPhotos && (
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-lime-deep underline"
                      onClick={() =>
                        open({
                          kind: report.kind,
                          photo: closeUp,
                          label: `${d.n}. ${d.label}`,
                          other: null,
                        })
                      }
                    >
                      {t.closeUp}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {showPhotos && loose.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {loose.map((p) => (
                <PhotoTile
                  key={p.id}
                  label={t.slots.damage}
                  photo={p}
                  reservationId={reservationId}
                  kind={report.kind}
                  onOpen={() => openSlot("damage", p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Fact label={t.mileage}>
          {report.mileageKm != null ? t.km(report.mileageKm) : "—"}
        </Fact>
        <Fact label={t.fuel}>
          {report.fuelQuarters != null ? t.fuelValue(report.fuelQuarters) : "—"}
        </Fact>
        <Fact label={t.client}>
          <span
            className={
              report.decision === "reserved"
                ? "text-warn-text"
                : report.decision === "accepted"
                  ? "text-ok-text"
                  : undefined
            }
          >
            {decisionLine(report)}
          </span>
        </Fact>
      </div>
      {report.decision === "reserved" && report.reserveText && (
        <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn-text">
          « {report.reserveText} »
        </p>
      )}
      {report.notes && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.notes}
          </p>
          <p className="whitespace-pre-wrap text-sm">{report.notes}</p>
        </div>
      )}
    </div>
  );
}

function TravellerReports({
  reservationId,
  reports,
  photosAvailable,
  open,
}: {
  reservationId: string;
  reports: TravellerInspectionReport[];
  photosAvailable: boolean;
  open: (opened: Opened) => void;
}) {
  return (
    <div className="space-y-4">
      {reports.map((r) => (
        <div
          key={r.kind}
          className="space-y-2"
          data-testid={`traveller-${r.kind}`}
        >
          <p className="text-sm font-semibold">
            {t.travellerAt[r.kind]}
            {r.completedAt && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {t.travellerSent(short(r.completedAt))}
              </span>
            )}
          </p>
          {!photosAvailable ? (
            <p className="text-[13px] text-muted-foreground">
              {t.photosUnavailable}
            </p>
          ) : r.photosErased ? (
            <p className="text-[13px] text-muted-foreground">
              {t.photosErased}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {r.photos.map((p) => (
                <PhotoTile
                  key={p.id}
                  label={t.slots[p.slot] ?? p.slot}
                  photo={p}
                  reservationId={reservationId}
                  kind={r.kind}
                  onOpen={() =>
                    open({
                      kind: r.kind,
                      photo: p,
                      label: t.slots[p.slot] ?? p.slot,
                      other: null,
                    })
                  }
                />
              ))}
            </div>
          )}
          {r.notes && (
            <p className="whitespace-pre-wrap text-sm">« {r.notes} »</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ContractPart({
  reservationId,
  data,
  status,
}: {
  reservationId: string;
  data: BookingPaperwork;
  status: ReservationStatus;
}) {
  const c = data.contract;
  const download = useMutation({
    mutationFn: async (kind: SignedContractFileKind) => {
      const { blob, filename } = await adminApi.reservationContractFile(
        reservationId,
        kind,
      );
      savePdf(
        blob,
        filename ?? pdfName(null, kind === "template" ? "original" : kind),
      );
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  if (!c.signed) {
    const b = contractTemplateFr.booking;
    const closed = ["cancelled", "no_show", "returned"].includes(status);
    return (
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{t.contractUnsigned}</p>
        <p className="text-muted-foreground">
          {closed ? b.closed : `${b.atCounter} ${b.willSign(c.template)}`}
        </p>
      </div>
    );
  }
  const s = c.signed;
  const how = (t.how[s.method] ?? t.how.handwritten)(s.phoneMasked);
  return (
    <div className="space-y-2 text-sm" data-testid="paperwork-contract">
      <p className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text">
          {t.contractSigned(short(s.signedAt))}
        </span>
      </p>
      <p>
        {t.signedBy} <strong>{s.signerName}</strong>, {how}
        {s.witnessName ? ` · ${t.witness(s.witnessName)}` : ""} ·{" "}
        {t.version(s.version, c.template)}
      </p>
      <p
        className="font-mono text-[12px] text-muted-foreground"
        title={s.proofSha256}
      >
        {contractTemplateFr.booking.proof(s.proofSha256)}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.files.signed && (
          <button
            type="button"
            className={ghost}
            onClick={() => download.mutate("signed")}
            disabled={download.isPending}
          >
            {t.signedPdf}
          </button>
        )}
        {c.files.proof && (
          <button
            type="button"
            className={ghost}
            onClick={() => download.mutate("proof")}
            disabled={download.isPending}
          >
            {t.proof}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * « Contrat et état des lieux » on the web booking page (12/11/2026, section 2 des maquettes): the contract signed and
 * its proof, then the drop-off and return reports of the team and the traveller's own photos, read-only (the photos are
 * taken in Plazo Pro). A photo opens large, beside the same side of the other report.
 */
export function BookingPaperworkCard({
  reservationId,
  status,
}: {
  reservationId: string;
  status: ReservationStatus;
}) {
  const query = useQuery({
    queryKey: ["booking-contract", reservationId],
    queryFn: () => adminApi.getBookingContract(reservationId),
  });
  const [tab, setTab] = useState<TabKey | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const closeLightbox = useCallback(() => setOpened(null), []);
  const data = query.data;
  if (!data?.contract) return null;
  const traveller = [
    data.travellerReports?.dropoff,
    data.travellerReports?.return,
  ].filter((r): r is TravellerInspectionReport => !!r);
  const travellerCount = traveller.reduce((n, r) => n + r.photos.length, 0);
  const hasReports = !!data.dropoff || !!data.return || traveller.length > 0;
  const tabs: { key: TabKey; label: string }[] = [
    {
      key: "dropoff",
      label: t.tabDropoff(
        data.dropoff
          ? short(data.dropoff.completedAt ?? data.dropoff.startedAt)
          : null,
      ),
    },
    {
      key: "return",
      label: t.tabReturn(
        data.return
          ? short(data.return.completedAt ?? data.return.startedAt)
          : null,
      ),
    },
    ...(traveller.length
      ? [{ key: "traveller" as const, label: t.tabTraveller(travellerCount) }]
      : []),
  ];
  const fallback: TabKey = data.dropoff
    ? "dropoff"
    : data.return
      ? "return"
      : "traveller";
  const current = tab && tabs.some((x) => x.key === tab) ? tab : fallback;
  const report =
    current === "dropoff"
      ? data.dropoff
      : current === "return"
        ? data.return
        : null;
  const other =
    current === "dropoff"
      ? data.return
      : current === "return"
        ? data.dropoff
        : null;

  return (
    <section
      data-testid="booking-contract"
      className="space-y-4 rounded-xl border border-panel-line bg-white p-4"
    >
      <h2 className="text-base font-semibold">{t.title}</h2>
      <ContractPart reservationId={reservationId} data={data} status={status} />
      {hasReports && (
        <div className="space-y-3 border-t border-panel-line pt-3">
          <div
            role="tablist"
            aria-label={t.tabsAria}
            className="flex flex-wrap gap-1.5"
          >
            {tabs.map((x) => (
              <button
                key={x.key}
                type="button"
                role="tab"
                aria-selected={current === x.key}
                onClick={() => setTab(x.key)}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-[13px] font-medium",
                  current === x.key
                    ? "border-lime-deep bg-primary text-primary-foreground"
                    : "border-panel-line bg-white hover:bg-panel-2",
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {current === "traveller" ? (
              <TravellerReports
                reservationId={reservationId}
                reports={traveller}
                photosAvailable={data.photosAvailable}
                open={setOpened}
              />
            ) : report ? (
              <TeamReport
                reservationId={reservationId}
                report={report}
                other={other?.completedAt ? other : null}
                photosAvailable={data.photosAvailable}
                open={setOpened}
              />
            ) : (
              <p className="text-[13px] text-muted-foreground">{t.notDone}</p>
            )}
          </div>
        </div>
      )}
      {opened && (
        <Lightbox
          reservationId={reservationId}
          opened={opened}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
