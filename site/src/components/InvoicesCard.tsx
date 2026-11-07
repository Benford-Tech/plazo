"use client";

import { useEffect, useState } from "react";
import { BookingClientError, bookingInvoices, downloadInvoice, requestInvoice, type TravellerInvoice, type TravellerInvoices } from "@/lib/booking-client";
import { fr } from "@/lib/fr";

const money = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
const day = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));

/**
 * « Facture » on Ma réservation (07/11/2026, « Le client peut retrouver ses factures dans Plazo », A + C): the invoices
 * the parking issued for this stay, as PDFs, or « Demander la facture » (company and address optional) when there is
 * none. Hidden while nothing can be shown nor asked.
 */
export function InvoicesCard({ reference, token }: { reference: string; token: string }) {
  const t = fr.manage.invoices;
  const [data, setData] = useState<TravellerInvoices | null>(null);
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    bookingInvoices(reference, token)
      .then(d => live && setData(d))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [reference, token]);

  if (!data) return null;
  const { invoices, request, canRequest, refusal } = data;
  if (!invoices.length && !request && !canRequest && refusal !== "no_price") return null;

  const ask = async () => {
    setBusy("request");
    setError(null);
    try {
      setData(await requestInvoice(reference, token, { company: company.trim() || undefined, address: address.trim() || undefined }));
    } catch (e) {
      const code = e instanceof BookingClientError ? e.code : "unknown";
      setError(t.errors[code] ?? t.errors.unknown);
    } finally {
      setBusy(null);
    }
  };

  const download = async (invoice: TravellerInvoice) => {
    setBusy(invoice.id);
    setError(null);
    try {
      await downloadInvoice(reference, token, invoice);
    } catch (e) {
      const code = e instanceof BookingClientError ? e.code : "unknown";
      setError(t.errors[code] ?? t.errors.unknown);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="facture" className="card flex flex-col gap-3 p-4 md:p-6" data-testid="invoices-card">
      <div className="flex items-center justify-between gap-3">
        <h2 id="facture" className="text-base font-extrabold">
          {t.title}
        </h2>
        {request && <span className="rounded-full bg-warn-bg px-2.5 py-0.5 text-[12px] font-bold text-warn">{t.requestedPill}</span>}
      </div>

      {invoices.length > 0 && (
        <ul className="flex flex-col gap-3">
          {invoices.map(invoice => (
            <li key={invoice.id} data-testid={`invoice-${invoice.number}`} className="flex flex-wrap items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-9 flex-none place-items-center rounded-md border border-line bg-ground text-[10px] font-extrabold text-accent-dark">
                PDF
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold">{invoice.kind === "credit_note" ? t.creditNote(invoice.number) : t.invoice(invoice.number)}</span>
                <span className="text-[13px] leading-snug text-soft">
                  {t.issued(money(invoice.totalTtcCents), day(invoice.issuedAt), invoice.issuer)}
                  {invoice.creditedBy ? ` · ${t.creditedBy(invoice.creditedBy)}` : ""}
                  {invoice.creditOf ? ` · ${t.creditOf(invoice.creditOf)}` : ""}
                </span>
              </div>
              <button type="button" onClick={() => download(invoice)} disabled={busy === invoice.id} aria-busy={busy === invoice.id || undefined} className={`${invoice.creditedBy || invoice.kind === "credit_note" ? "btn-secondary" : "btn-primary"} min-h-11 px-4 text-[14px]`}>
                {busy === invoice.id ? t.downloading : t.download}
              </button>
            </li>
          ))}
        </ul>
      )}

      {request && <p className="text-[14px] leading-snug text-soft">{t.requested(day(request.at))}</p>}

      {canRequest && (
        <div className="flex flex-col gap-3">
          {!invoices.length && <p className="text-[14px] leading-snug text-soft">{t.none}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col">
              <label htmlFor="inv-company" className="label">
                {t.company}
              </label>
              <input id="inv-company" className="field" value={company} maxLength={120} autoComplete="organization" onChange={e => setCompany(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="inv-address" className="label">
                {t.address}
              </label>
              <input id="inv-address" className="field" value={address} maxLength={300} autoComplete="street-address" onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
          <button type="button" onClick={ask} disabled={busy === "request"} aria-busy={busy === "request" || undefined} className="btn-primary min-h-12 self-start px-5 text-[15px]">
            {busy === "request" ? t.requesting : t.request}
          </button>
        </div>
      )}

      {!invoices.length && !request && refusal === "no_price" && <p className="text-[14px] leading-snug text-soft">{t.noPrice}</p>}

      <p role="status" className="text-[13.5px] font-semibold text-danger empty:hidden">
        {error ?? ""}
      </p>
    </section>
  );
}
