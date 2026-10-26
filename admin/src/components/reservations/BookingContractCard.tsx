import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { contractDateTime, pdfName, savePdf } from "@/lib/contract";
import { contractTemplateFr, describeError } from "@/lib/fr";
import type { ReservationStatus, SignedContractFileKind } from "@/lib/types";

const t = contractTemplateFr.booking;
const ghost =
  "min-h-9 whitespace-nowrap rounded-full border border-lime-deep px-3 text-[13px] font-semibold text-lime-deep hover:bg-accent disabled:opacity-50";

/** « Contrat de stationnement » on the booking page (26/10/2026): signed or not, the signed PDF and the proof. */
export function BookingContractCard({
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
  const c = query.data?.contract;
  if (!c) return null;
  const closed = ["cancelled", "no_show", "returned"].includes(status);
  return (
    <section
      data-testid="booking-contract"
      className="rounded-xl border border-panel-line bg-white p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{t.title}</h2>
        <span
          className={
            c.signed
              ? "rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text"
              : "rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
          }
        >
          {c.signed ? t.signed : t.unsigned}
        </span>
      </div>
      {c.signed ? (
        <div className="mt-2 space-y-1 text-sm">
          <p>
            {t.signedLine(
              contractDateTime(c.signed.signedAt),
              (t.how[c.signed.method] ?? t.how.handwritten)(
                c.signed.phoneMasked,
              ),
            )}
          </p>
          <p className="text-muted-foreground">
            {t.version(c.signed.version, c.template)}
          </p>
          <p
            className="font-mono text-[12px] text-muted-foreground"
            title={c.signed.proofSha256}
          >
            {t.proof(c.signed.proofSha256)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {c.files.signed && (
              <button
                type="button"
                className={ghost}
                onClick={() => download.mutate("signed")}
                disabled={download.isPending}
              >
                {contractTemplateFr.page.signedPdf}
              </button>
            )}
            {c.files.proof && (
              <button
                type="button"
                className={ghost}
                onClick={() => download.mutate("proof")}
                disabled={download.isPending}
              >
                {contractTemplateFr.page.proof}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {closed ? t.closed : `${t.atCounter} ${t.willSign(c.template)}`}
        </p>
      )}
    </section>
  );
}
