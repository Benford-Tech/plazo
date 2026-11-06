import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { savePdf } from "@/lib/contract";
import { dateTime, describeError, fr, invoiceFr } from "@/lib/fr";
import type { InvoiceView, PaymentMethod, ReservationChannel, ReservationInvoices } from "@/lib/types";

const t = invoiceFr.booking;
const ghost =
  "min-h-9 whitespace-nowrap rounded-full border border-lime-deep px-3 text-[13px] font-semibold text-lime-deep hover:bg-accent disabled:opacity-50";
const main =
  "min-h-9 whitespace-nowrap rounded-full bg-lime px-4 text-[13px] font-semibold text-lime-ink hover:opacity-90 disabled:opacity-50";

const money = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/**
 * « Facture » on the booking page (06/11/2026, « une facture au nom du parking avec son logo », direction A): issue the
 * invoice in the parking's name, preview it, send it by e-mail, download it, or cancel it by a credit note.
 */
export function BookingInvoiceCard({
  reservationId,
  priceCents,
  channel,
  paymentMethod,
}: {
  reservationId: string;
  priceCents: number | null;
  channel: ReservationChannel;
  paymentMethod: PaymentMethod | null;
}) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const key = ["reservation-invoices", reservationId];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.reservationInvoices(reservationId) });
  const [showCustomer, setShowCustomer] = useState(false);
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const customer = { customerCompany: company.trim() || undefined, customerAddress: address.trim() || undefined };
  const set = (data: ReservationInvoices) => queryClient.setQueryData(key, data);
  const fail = (err: unknown) => toast.error(describeError(err, t.errors));

  const create = useMutation({
    mutationFn: () => adminApi.createInvoice(reservationId, customer),
    onSuccess: (data) => {
      set(data);
      setShowCustomer(false);
      const issued = data.invoices.find((i) => i.kind === "invoice");
      if (issued) toast.success(t.created(issued.number));
    },
    onError: fail,
  });
  const preview = useMutation({
    mutationFn: async () => {
      const { blob, filename } = await adminApi.invoicePreview(reservationId, customer);
      savePdf(blob, filename ?? "Facture-apercu.pdf");
    },
    onError: fail,
  });
  const download = useMutation({
    mutationFn: async (invoice: InvoiceView) => {
      const { blob, filename } = await adminApi.invoicePdf(invoice.id);
      savePdf(blob, filename ?? `Facture-${invoice.number}.pdf`);
    },
    onError: fail,
  });
  const send = useMutation({
    mutationFn: ({ invoice, email }: { invoice: InvoiceView; email?: string }) => adminApi.sendInvoice(invoice.id, email),
    onSuccess: (result) => {
      setSendingTo(null);
      toast.success(t.sent(result.sentTo));
      void query.refetch();
    },
    onError: fail,
  });
  const credit = useMutation({
    mutationFn: (invoice: InvoiceView) => adminApi.creditInvoice(invoice.id),
    onSuccess: (data) => {
      set(data);
      const note = data.invoices.find((i) => i.kind === "credit_note");
      if (note) toast.success(t.creditDone(note.number));
    },
    onError: fail,
  });

  const data = query.data;
  if (!data) return null;
  const readOnly = !!user?.demo;
  const refusalText = data.refusal ? t.refusals[data.refusal] : "";
  const paidLabel = channel === "plazo" ? fr.paidBy.online : paymentMethod ? fr.paidBy[paymentMethod] : null;

  const sendInvoice = (invoice: InvoiceView) => {
    const email = invoice.customer.email ?? data.customerEmail;
    if (!email) setSendingTo(invoice.id);
    else send.mutate({ invoice });
  };

  return (
    <section data-testid="booking-invoice" className="rounded-xl border border-panel-line bg-white p-4">
      <h2 className="text-base font-semibold">{t.title}</h2>
      {data.invoices.length === 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {priceCents != null ? t.paid(money(priceCents), paidLabel) : null}
        </p>
      )}

      {data.invoices.length > 0 && (
        <ul className="mt-2 divide-y divide-panel-line">
          {data.invoices.map((invoice) => (
            <li key={invoice.id} data-testid={`invoice-${invoice.number}`} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {invoice.kind === "credit_note" ? t.creditNote : t.invoice} {invoice.number}
                </span>
                <span className="tabular font-mono text-sm">{money(invoice.totalTtcCents)}</span>
                {invoice.creditedBy ? (
                  <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {t.cancelledPill}
                  </span>
                ) : invoice.sentAt ? (
                  <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text">{t.sentPill}</span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {t.issued(dateTime.format(new Date(invoice.issuedAt)))}
                {" · "}
                {invoice.sentAt && invoice.sentTo ? t.sentTo(invoice.sentTo, dateTime.format(new Date(invoice.sentAt))) : t.notSent}
                {invoice.creditOf ? ` · ${t.creditOf(invoice.creditOf)}` : ""}
                {invoice.creditedBy ? ` · ${t.creditedBy(invoice.creditedBy)}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={ghost} onClick={() => download.mutate(invoice)}>
                  {t.download}
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className={ghost}
                    disabled={send.isPending}
                    onClick={() => sendInvoice(invoice)}
                  >
                    {invoice.sentAt ? t.resend : t.send}
                  </button>
                )}
                {!readOnly && invoice.kind === "invoice" && !invoice.creditedBy && (
                  <button
                    type="button"
                    className={ghost}
                    disabled={credit.isPending}
                    onClick={async () => {
                      if (await confirm(t.creditConfirm(invoice.number), { title: t.credit, confirmLabel: t.credit, destructive: true }))
                        credit.mutate(invoice);
                    }}
                  >
                    {t.credit}
                  </button>
                )}
              </div>
              {sendingTo === invoice.id && (
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
                    if (email) send.mutate({ invoice, email });
                  }}
                >
                  <label className="flex flex-col gap-1 text-sm">
                    {t.sendTo}
                    <input
                      name="email"
                      type="email"
                      required
                      autoFocus
                      className="h-10 min-w-64 rounded-md border border-input px-3 text-base"
                    />
                  </label>
                  <button type="submit" className={main} disabled={send.isPending}>
                    {t.send}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.canCreate && !readOnly ? (
        <div className="mt-3 flex flex-col gap-3">
          {showCustomer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                {t.company}
                <input
                  value={company}
                  maxLength={120}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 rounded-md border border-input px-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t.customerAddress}
                <input
                  value={address}
                  maxLength={300}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-10 rounded-md border border-input px-3 text-base"
                />
              </label>
            </div>
          ) : (
            <button
              type="button"
              className="self-start text-sm font-semibold text-lime-deep underline-offset-2 hover:underline"
              onClick={() => setShowCustomer(true)}
            >
              {t.addCustomer}
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={main} disabled={create.isPending} onClick={() => create.mutate()}>
              {t.create}
            </button>
            <button type="button" className={ghost} disabled={preview.isPending} onClick={() => preview.mutate()}>
              {t.preview}
            </button>
          </div>
        </div>
      ) : (
        refusalText && (
          <p data-testid="invoice-refusal" className="mt-2 text-sm text-muted-foreground">
            {refusalText}{" "}
            {data.refusal === "billing_incomplete" && (
              <Link to="/parking/reglages" className="font-semibold text-lime-deep underline-offset-2 hover:underline">
                {t.settingsLink}
              </Link>
            )}
          </p>
        )
      )}
    </section>
  );
}
