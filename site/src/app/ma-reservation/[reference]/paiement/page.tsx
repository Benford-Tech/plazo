import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingSteps } from "@/components/BookingSteps";
import { HoldCountdown } from "@/components/HoldCountdown";
import { EditForm, PayForm } from "@/components/PayForm";
import { Plate } from "@/components/Plate";
import { api, ApiError } from "@/lib/api";
import { editBookingAction, payAction } from "@/lib/actions";
import { formatDay } from "@/lib/dates";
import { manageHref } from "@/lib/forms";
import { fr } from "@/lib/fr";
import { REFERENCE_RE } from "@/lib/manage-access";
import { manageTokenFor } from "@/lib/manage-session";
import { formatEuros } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { PublicBooking } from "@/lib/types";

export const dynamic = "force-dynamic";

// Personal data: never indexed, never sent to another site as a Referer.
export const metadata: Metadata = {
  title: fr.pay.title,
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

/**
 * Step 2 of a booking paid online: the recap, the time left on the place's hold, and "Payer", which
 * leads to Stripe's payment page. Stripe sends the traveller back here if they leave it, and to the
 * booking's page once paid. Once the hold is over: "Le délai est dépassé".
 */
export default async function PaymentPage({ params }: PageProps<"/ma-reservation/[reference]/paiement">) {
  const { reference } = await params;
  const token = REFERENCE_RE.test(reference) ? await manageTokenFor(reference) : null;
  if (!token) redirect(`/ma-reservation?reference=${encodeURIComponent(reference.slice(0, 12))}`);

  let booking: PublicBooking | null = null;
  try {
    booking = await api.booking(reference, token);
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 404 || error.status === 400))) throw error;
  }
  if (!booking) redirect(manageHref(reference));

  const b = booking;
  const expired = b.status === "cancelled" && b.payment?.status === "expired";
  // Paid (or paid at the parking, or closed otherwise): the booking's own page.
  if (b.paymentMode !== "online" || (b.status !== "pending_payment" && !expired)) redirect(manageHref(b.reference));

  const total = b.priceCents === null ? "" : formatEuros(b.priceCents);
  const edit = editBookingAction.bind(null, b.reference);
  const row = "flex justify-between gap-3 text-[15px] text-soft";

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 pt-5 pb-10 md:gap-5 md:pt-8 md:pb-12">
      <BookingSteps current={2} />
      <h1 className="font-title text-[30px] md:text-[40px]">{fr.pay.title}</h1>

      {expired ? (
        <section role="alert" aria-labelledby="delai" className="flex flex-col items-start gap-3 rounded-[20px] border border-danger-line bg-danger-bg p-5">
          <h2 id="delai" className="text-lg font-bold text-danger">
            {fr.pay.expiredTitle}
          </h2>
          <p className="leading-relaxed">{fr.pay.expiredText}</p>
          <EditForm action={edit} label={fr.pay.restart} variant="button" />
        </section>
      ) : (
        <>
          <section aria-labelledby="recap" className="flex flex-col gap-2.5 rounded-[20px] border border-line p-4 md:p-[22px]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="recap" className="font-title text-[22px] md:text-2xl">
                {fr.pay.recap}
              </h2>
              <EditForm action={edit} label={fr.pay.modify} variant="link" />
            </div>
            <div className={row}>
              <span>{b.parking.title}</span>
              <b className="text-ink">{fr.pay.days(b.days)}</b>
            </div>
            <div className={row}>
              <span className="min-w-0">
                {formatDay(b.arrivalAt.slice(0, 10))} <span className="whitespace-nowrap">→ {formatDay(b.returnAt.slice(0, 10))}</span>
              </span>
              <span className="flex-none">
                <Plate plate={b.plate} size="sm" />
              </span>
            </div>
            <div className={row}>
              <span>{b.customerName}</span>
              <b className="text-ink tabular-nums">{formatPhone(b.customerPhone)}</b>
            </div>
            <div className="mt-1 flex justify-between gap-3 border-t border-line pt-3 text-lg font-bold">
              <span>{fr.pay.total}</span>
              <span>{total}</span>
            </div>
          </section>

          {b.payment?.holdSecondsLeft != null && <HoldCountdown key={b.payment.holdExpiresAt} secondsLeft={b.payment.holdSecondsLeft} />}
          <PayForm action={payAction.bind(null, b.reference)} total={total} />
        </>
      )}
    </main>
  );
}
