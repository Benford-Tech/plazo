"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";
import { formatEuros } from "@/lib/money";
import {
  commissionExample,
  DEFAULT_PLAN,
  discounted,
  MARKETPLACE_RATE_PERCENT,
  PRO_OPTIONS,
  PRO_PLANS,
  quote,
  YEARLY_DISCOUNT_PERCENT,
  type OptionId,
  type ProSelection,
} from "@/lib/pro-pricing";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const t = fr.proPricing;
const STORAGE_KEY = "plazo:pro-pricing";

/** Whole euros when exact (« 149 € »), else with cents (« 134,10 € »). */
function eur(cents: number): string {
  return cents % 100 === 0 ? formatEuros(cents).replace(",00", "") : formatEuros(cents);
}

function readSaved(): ProSelection | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<ProSelection>;
    return {
      plan: PRO_PLANS.some(p => p.id === saved.plan) ? saved.plan! : DEFAULT_PLAN,
      yearly: saved.yearly === true,
      marketplace: saved.marketplace !== false,
      options: Array.isArray(saved.options) ? saved.options.filter(o => PRO_OPTIONS.some(p => p.id === o && !p.soon)) : [],
    };
  } catch {
    return null;
  }
}

const card = "rounded-[14px] border border-pro-line bg-white";
const btnLime = "inline-flex min-h-11 items-center justify-center rounded-[10px] bg-lime px-4 text-[14px] font-semibold text-lime-ink no-underline hover:brightness-95";
const btnGhost =
  "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-pro-line bg-white px-4 text-[14px] font-semibold text-pro-ink no-underline hover:border-pro-soft";
const sectionTitle = "font-pro-display text-[26px] leading-tight font-bold text-balance";
const sectionLead = "mt-1.5 mb-4 max-w-[70ch] text-[14px] text-pro-soft";

/**
 * Plazo Pro « Tarifs » (27/10/2026, mockup validated by Joanny): the plans, the listing on Plazo at a commission, the
 * options and a summary that totals the selection, month by month or for a year; « Demander un devis » sends the
 * selection with the operator's details.
 */
export function ProPricing({ action, demoHref, signupHref, supportEmail }: { action: Action; demoHref: string; signupHref: string; supportEmail: string | null }) {
  const [selection, setSelection] = useState<ProSelection>({ plan: DEFAULT_PLAN, yearly: false, marketplace: true, options: [] });
  const loaded = useRef(false);
  useEffect(() => {
    // The viewer's last selection, once on the client (the server renders the default one).
    const saved = readSaved();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after hydration
    if (saved) setSelection(saved);
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // Private window or blocked storage: the page works without it.
    }
  }, [selection]);

  const q = quote(selection);
  const example = commissionExample();
  const set = (patch: Partial<ProSelection>) => setSelection(s => ({ ...s, ...patch }));
  const toggleOption = (id: OptionId, on: boolean) =>
    setSelection(s => ({ ...s, options: on ? [...new Set([...s.options, id])] : s.options.filter(o => o !== id) }));
  const totalText = eur(q.periodCents);
  const totalNote = (selection.yearly ? t.yearlyNote(eur(q.monthlyCents)) : t.noCommitment) + (q.onceCents ? t.atOrder(eur(q.onceCents)) : "");

  return (
    <>
      <div className="pt-10 pb-6 md:pt-12">
        <p className="text-[12px] font-semibold tracking-[.12em] text-lime-deep uppercase">{t.eyebrow}</p>
        <h1 className="mt-2.5 font-pro-display text-[clamp(34px,5vw,54px)] leading-[1.02] font-bold text-balance">{t.title}</h1>
        <p className="mt-3.5 max-w-[62ch] text-[16px] text-pro-soft">{t.lead}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["#logiciel", t.anchors.software],
                ["#plazo", t.anchors.marketplace],
                ["#options", t.anchors.options],
              ] as const
            ).map(([href, label]) => (
              <a key={href} href={href} className="inline-flex min-h-9 items-center rounded-full border border-pro-line bg-white px-3 text-[13px] text-pro-ink no-underline">
                {label}
              </a>
            ))}
          </div>
          <div role="group" aria-label={t.billing} className="inline-flex rounded-full border border-pro-line bg-white p-[3px]">
            {[false, true].map(yearly => (
              <button
                key={String(yearly)}
                type="button"
                aria-pressed={selection.yearly === yearly}
                onClick={() => set({ yearly })}
                className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold ${selection.yearly === yearly ? "bg-lime text-lime-ink" : "text-pro-soft"}`}
              >
                {yearly ? t.yearly : t.monthly}
                {yearly && <span className="ml-1 font-mono">−{YEARLY_DISCOUNT_PERCENT} %</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 pb-16 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section id="logiciel" className="scroll-mt-24 pt-6">
            <h2 className={sectionTitle}>{t.softwareTitle}</h2>
            <p className={sectionLead}>{t.softwareLead}</p>
            <div role="radiogroup" aria-label={t.plans} className="grid grid-cols-1 gap-3.5 pt-3 md:grid-cols-3">
              {PRO_PLANS.map((plan, index) => {
                const checked = selection.plan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => set({ plan: plan.id })}
                    className={`relative flex flex-col gap-3 rounded-[14px] bg-white p-[18px] text-left ${checked ? "border-2 border-lime-deep p-[17px]" : "border border-pro-line"}`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-[11px] left-4 rounded-md bg-lime px-2 py-1.5 font-pro-display text-[11px] leading-none font-bold tracking-[.08em] text-lime-ink uppercase">
                        ★ {t.recommended}
                      </span>
                    )}
                    <span className="font-pro-display text-[22px] font-bold">{plan.name}</span>
                    <span className="min-h-10 text-[13px] text-pro-soft">{plan.pitch}</span>
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      {selection.yearly && <s className="font-mono text-[14px] text-pro-soft">{eur(plan.monthlyCents)}</s>}
                      <span className="font-mono text-[30px] leading-none font-bold tabular-nums">{eur(discounted(plan.monthlyCents, selection.yearly))}</span>
                      <span className="text-[13px] text-pro-soft">{t.perMonth}</span>
                    </span>
                    <ul className="m-0 grid list-none gap-1.5 p-0 text-[13.5px]">
                      {plan.features.map((feature, i) => (
                        <li key={feature} className={`grid grid-cols-[16px_minmax(0,1fr)] gap-2 ${i === 0 && index > 0 ? "text-pro-soft italic" : ""}`}>
                          <span aria-hidden="true" className={`mt-[3px] size-3.5 rounded ${i === 0 && index > 0 ? "" : "border-[3px] border-lime-soft bg-lime-deep"}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-auto rounded-[10px] border p-2 text-center text-[14px] font-semibold ${checked ? "border-lime bg-lime text-lime-ink" : "border-pro-line"}`}
                    >
                      {checked ? t.chosen : t.choose}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section id="plazo" className="scroll-mt-24 pt-8">
            <h2 className={sectionTitle}>{t.marketTitle}</h2>
            <p className={sectionLead}>{t.marketLead}</p>
            <div className="grid grid-cols-1 gap-5 rounded-[14px] bg-lime-ink p-5 text-lime-band md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:p-6">
              <div>
                <h3 className="font-pro-display text-[24px] font-bold text-lime">{t.marketHeadline}</h3>
                <p className="mt-2 text-[14px]">{t.marketPitch}</p>
                <ul className="mt-3 grid list-disc gap-1 pl-[18px] text-[14px] marker:text-lime">
                  {t.marketPoints.map(point => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <label htmlFor="pp-market" className="mt-3.5 flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px]">
                  <input id="pp-market" type="checkbox" checked={selection.marketplace} onChange={e => set({ marketplace: e.target.checked })} className="size-5 accent-lime" />
                  {t.marketToggle}
                </label>
              </div>
              <div className="grid content-start gap-2 rounded-xl border border-lime/30 bg-lime/10 p-4">
                <div className="font-mono text-[44px] leading-none font-bold text-lime">{MARKETPLACE_RATE_PERCENT} %</div>
                <div className="text-[13px]">{t.marketRate}</div>
                <dl aria-label={t.example} className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 font-mono text-[13px]">
                  <dt>{t.exampleStay}</dt>
                  <dd className="m-0 text-right">{formatEuros(example.priceCents)}</dd>
                  <dt>{t.exampleCommission}</dt>
                  <dd className="m-0 text-right">−{formatEuros(example.commissionCents)}</dd>
                  <dt className="border-t border-lime/30 pt-1.5 font-bold text-lime">{t.exampleNet}</dt>
                  <dd className="m-0 border-t border-lime/30 pt-1.5 text-right font-bold text-lime">{formatEuros(example.netCents)}</dd>
                </dl>
              </div>
            </div>
          </section>

          <section id="options" className="scroll-mt-24 pt-8">
            <h2 className={sectionTitle}>{t.optionsTitle}</h2>
            <p className={sectionLead}>{t.optionsLead}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PRO_OPTIONS.map(option => (
                <label
                  key={option.id}
                  htmlFor={`pp-opt-${option.id}`}
                  className={`${card} grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-4 ${option.soon ? "opacity-75" : "cursor-pointer"}`}
                >
                  <input
                    id={`pp-opt-${option.id}`}
                    type="checkbox"
                    disabled={option.soon}
                    checked={selection.options.includes(option.id)}
                    onChange={e => toggleOption(option.id, e.target.checked)}
                    className="mt-0.5 size-[18px] accent-lime-deep"
                  />
                  <span>
                    <b className="block text-[15px]">
                      {option.name}
                      {option.soon && <span className="ml-1.5 rounded-full bg-lime-soft px-2 py-1 align-[2px] text-[11px] font-semibold text-lime-deep">{t.soon}</span>}
                    </b>
                    <span className="text-[13px] text-pro-soft">{option.description}</span>
                  </span>
                  <span className="text-right font-mono text-[14px] font-bold whitespace-nowrap">
                    {option.priceCents === null ? t.onQuote : eur(option.priceCents)}
                    {option.priceCents !== null && <small className="block font-pro text-[11px] font-medium text-pro-soft">{option.once ? t.once : t.perMonth}</small>}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section id="devis" className={`${card} mt-10 grid scroll-mt-24 grid-cols-1 gap-6 p-5 md:grid-cols-2 md:p-6`}>
            <div>
              <h2 className={sectionTitle}>{t.questionTitle}</h2>
              <p className="mt-2 text-[14px] text-pro-soft">{t.questionLead}</p>
              <p className="mt-4 flex flex-wrap gap-2">
                <a href={demoHref} className={btnLime}>
                  {t.tryDemo}
                </a>
                <a href={signupHref} className={btnGhost}>
                  {t.signup}
                </a>
              </p>
              {supportEmail && <p className="mt-4 text-[14px] text-pro-soft select-all">{supportEmail}</p>}
            </div>
            <QuoteForm action={action} selection={selection} />
          </section>
        </div>

        <aside aria-label={t.recap} className={`${card} sticky top-24 hidden gap-3 p-[18px] lg:grid`}>
          {recap()}
        </aside>
        <aside aria-label={t.recap} className={`${card} grid gap-3 p-[18px] lg:hidden`}>
          {recap()}
        </aside>
      </div>

      {/* Phones and tablets: the total stays in sight. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-pro-line bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <div>
          <small className="block text-[11px] text-pro-soft">{t.totalShort}</small>
          <span className="font-mono text-[20px] leading-none font-bold">
            {totalText}
            {selection.yearly ? t.perYearShort : t.perMonthShort}
          </span>
        </div>
        <a href="#devis" className={`${btnLime} ml-auto`}>
          {t.askQuote}
        </a>
      </div>
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </>
  );

  function recap() {
    return (
      <>
        <h2 className="font-pro-display text-[20px] font-bold">{t.recap}</h2>
        <div className="grid gap-2 text-[14px]">
          {q.lines.map(line => (
            <div key={line.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
              <span>{line.label}</span>
              <span className="text-right font-mono whitespace-nowrap tabular-nums">
                {line.kind === "commission" ? (
                  t.commissionLine(MARKETPLACE_RATE_PERCENT)
                ) : (
                  <>
                    {line.fullCents !== undefined && <s className="mr-1.5 text-pro-soft">{eur(line.fullCents)}</s>}
                    {eur(line.cents ?? 0)}
                    {line.kind === "once" ? ` ${t.once}` : t.perMonthShort}
                  </>
                )}
              </span>
            </div>
          ))}
          {selection.marketplace && <p className="m-0 text-[13px] text-pro-soft">{t.commissionNote}</p>}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline border-t border-pro-line pt-3">
          <span>{t.total(selection.yearly)}</span>
          <span className="font-mono text-[28px] leading-none font-bold tabular-nums">{totalText}</span>
          <small className="col-span-2 text-[12px] text-pro-soft">{totalNote}</small>
        </div>
        <a href="#devis" className={`${btnLime} w-full`}>
          {t.askQuote}
        </a>
        <a href={demoHref} className={`${btnGhost} w-full`}>
          {t.tryDemo}
        </a>
        <ul className="m-0 grid list-none gap-1 p-0 text-[12.5px] text-pro-soft">
          {t.trust.map(line => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </>
    );
  }
}

/**
 * The operator's details, sent to the support address: « Demander un devis » with the page's selection (Tarifs), or
 * « Demander une démo » without one (the home page of Plazo Pro, 27/10/2026).
 */
export function QuoteForm({
  action,
  selection,
  submitLabel = t.askQuote,
  sentText = t.form.sentText,
}: {
  action: Action;
  selection: ProSelection | null;
  submitLabel?: string;
  sentText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const sent = state.notice === "quote_sent";
  useEffect(() => {
    if (sent) done.current?.focus();
    else if (state.error === "validation_failed") form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state, sent]);

  if (sent) {
    return (
      <div ref={done} tabIndex={-1} className="flex flex-col items-start gap-2 self-center outline-none">
        <span className="rounded-full bg-lime-soft px-3 py-1 text-[13px] font-semibold text-lime-deep">{t.form.sent}</span>
        <p role="status" className="text-[15px] font-medium">
          {sentText}
        </p>
      </div>
    );
  }

  const v = state.values;
  const f = state.fields;
  const field = "min-h-11 w-full min-w-0 rounded-lg border border-pro-line bg-pro-ground px-2.5 text-[14px] text-pro-ink";
  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, full = false, optional = false) => (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={`pp-${name}`} className="mb-1 block text-[12.5px] font-semibold">
        {label}
        {optional && <span className="font-normal text-pro-soft"> ({t.form.optional})</span>}
      </label>
      <input
        id={`pp-${name}`}
        name={name}
        defaultValue={v[name]}
        maxLength={80}
        aria-invalid={f[name] ? true : undefined}
        aria-describedby={f[name] ? `pp-${name}-error` : undefined}
        className={field}
        {...props}
      />
      <FieldError id={`pp-${name}-error`} code={f[name]} />
    </div>
  );
  return (
    <form ref={form} action={formAction} noValidate className="relative grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {state.error && state.error !== "validation_failed" && (
        <p role="alert" className="rounded-lg border border-danger-line bg-danger-bg px-3 py-2.5 text-sm font-semibold text-danger sm:col-span-2">
          {errorMessage(state.error)}
        </p>
      )}
      {input("firstName", t.form.firstName, { type: "text", autoComplete: "given-name", required: true })}
      {input("lastName", t.form.lastName, { type: "text", autoComplete: "family-name", required: true })}
      {input("parking", t.form.parking, { type: "text", autoComplete: "organization", required: true }, true)}
      {input("email", t.form.email, { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254, spellCheck: false, required: true })}
      {input("phone", t.form.phone, { type: "tel", autoComplete: "tel" }, false, true)}
      {input("airport", t.form.airport, { type: "text" }, true, true)}
      {selection ? (
        <>
          <input type="hidden" name="plan" value={selection.plan} />
          <input type="hidden" name="yearly" value={selection.yearly ? "1" : "0"} />
          <input type="hidden" name="marketplace" value={selection.marketplace ? "1" : "0"} />
          {selection.options.map(option => (
            <input key={option} type="hidden" name="options" value={option} />
          ))}
        </>
      ) : (
        <input type="hidden" name="request" value="demo" />
      )}
      {/* Honeypot: invisible to people (and to screen readers), filled by bots. */}
      <div aria-hidden="true" className="absolute top-auto left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor="pp-website">{t.form.honeypot}</label>
        <input id="pp-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className={`${btnLime} sm:col-span-2`}>
        {pending ? t.form.sending : submitLabel}
      </button>
    </form>
  );
}
