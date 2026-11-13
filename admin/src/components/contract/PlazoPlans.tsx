import { useState } from "react";
import { plansFr as t } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { MARKETPLACE_RATE_PERCENT, PLAZO_PLANS, savings, yearlyMonthly } from "@/lib/pro-plans";

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

function Slider(props: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={props.id} className="flex justify-between gap-2 text-sm font-semibold">
        <span>{props.label}</span>
        <output htmlFor={props.id} className="font-mono text-lime-deep">
          {props.shown}
        </output>
      </label>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-[#1E5E2E]"
      />
    </div>
  );
}

/**
 * « Mon contrat Plazo » › the plans (13/11/2026, « intègre-le à Plazo Pro dans l'onglet Mon contrat Plazo »): the three
 * plans at 99 / 199 / 299 € HT, a monthly or yearly price, a calculator on the operator's own numbers, and the listing on
 * Plazo. « Demander cette formule » writes to Plazo (no online subscription yet).
 */
export function PlazoPlans({ operatorName }: { operatorName: string }) {
  const [yearly, setYearly] = useState(false);
  const [bookings, setBookings] = useState(400);
  const [minutes, setMinutes] = useState(3);
  const [calls, setCalls] = useState(15);
  const [hourly, setHourly] = useState(18);
  const [planId, setPlanId] = useState("operations");
  const plan = PLAZO_PLANS.find((p) => p.id === planId) ?? PLAZO_PLANS[1];
  const price = (monthly: number) => (yearly ? yearlyMonthly(monthly) : monthly);
  const s = savings({ bookingsPerMonth: bookings, minutesPerBooking: minutes, callsPerDay: calls, hourlyCost: hourly, planEuros: price(plan.monthlyEuros) });

  return (
    <section className="flex flex-col gap-5" data-testid="plazo-plans" aria-labelledby="plazo-plans-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-[62ch]">
          <h2 id="plazo-plans-title" className="font-narrow text-2xl font-bold">
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <div role="group" aria-label={t.billing} className="flex rounded-full border border-border bg-card p-1 text-sm font-semibold">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              aria-pressed={yearly === y}
              data-testid={y ? "plans-yearly" : "plans-monthly"}
              onClick={() => setYearly(y)}
              className={`min-h-9 rounded-full px-4 ${yearly === y ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {y ? t.yearly : t.monthly}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAZO_PLANS.map((p) => (
          <article
            key={p.id}
            data-testid={`plan-${p.id}`}
            className={`flex min-w-0 flex-col gap-3 rounded-[18px] bg-card p-5 shadow-sm ${p.recommended ? "border-2 border-primary" : "border border-border"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-narrow text-2xl font-bold">{p.name}</h3>
              {p.recommended && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-primary-foreground">{t.recommended}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{p.pitch}</p>
            <p className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-bold tabular-nums" data-testid={`price-${p.id}`}>
                {price(p.monthlyEuros)} €
              </span>
              <span className="text-[13px] text-muted-foreground">{t.perMonth}</span>
            </p>
            {!yearly && <p className="-mt-2 text-[13px] font-semibold text-lime-deep">{t.yearlyLine(yearlyMonthly(p.monthlyEuros))}</p>}
            <ul className="grid gap-2 text-sm">
              {p.features.map((f, i) => (
                <li key={f} className={`flex gap-2 ${i === 0 && p.id !== "essentiel" ? "font-semibold text-lime-deep" : ""}`}>
                  <span aria-hidden className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-lime-deep ${i === 0 && p.id !== "essentiel" ? "bg-primary" : ""}`} />
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>
            <a
              className={`mt-auto block min-h-11 rounded-full px-4 py-2.5 text-center text-sm font-bold ${p.recommended ? "bg-primary text-primary-foreground" : "bg-ok-soft text-ok-text"}`}
              href={`mailto:${PRODUCT.supportEmail}?subject=${encodeURIComponent(t.askSubject(p.name, operatorName))}`}
            >
              {t.ask}
            </a>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4 rounded-[18px] border border-border bg-card p-5">
          <div>
            <h3 className="font-narrow text-xl font-bold">{t.calcTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.calcIntro}</p>
          </div>
          <Slider id="calc-bookings" label={t.bookings} value={bookings} min={50} max={2000} step={50} shown={String(bookings)} onChange={setBookings} />
          <Slider id="calc-minutes" label={t.minutes} value={minutes} min={1} max={10} step={1} shown={String(minutes)} onChange={setMinutes} />
          <Slider id="calc-calls" label={t.calls} value={calls} min={0} max={80} step={5} shown={String(calls)} onChange={setCalls} />
          <Slider id="calc-hourly" label={t.hourly} value={hourly} min={12} max={40} step={1} shown={`${hourly} €`} onChange={setHourly} />
          <label htmlFor="calc-plan" className="grid gap-1.5 text-sm font-semibold">
            {t.plan}
            <select id="calc-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className="min-h-10 rounded-[10px] border border-border bg-card px-3 font-normal">
              {PLAZO_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {price(p.monthlyEuros)} €
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex min-w-0 flex-col gap-3 rounded-[18px] bg-lime-ink p-5 text-white" aria-live="polite" data-testid="calc-result">
          <span>{t.gained}</span>
          <span className="font-mono text-5xl font-bold tabular-nums text-primary" data-testid="calc-net">
            {s.net >= 0 ? "+ " : "− "}
            {euros(Math.abs(s.net))}
          </span>
          {(
            [
              [t.hours, `${Math.round(s.hours)} h`],
              [t.value, euros(s.value)],
              [t.subscription, `− ${euros(price(plan.monthlyEuros))}`],
              [t.paidBack, s.paidBackInDays === null ? "—" : t.days(s.paidBackInDays)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-t border-white/15 pt-2.5 text-sm">
              <span>{label}</span>
              <b className="font-mono tabular-nums">{value}</b>
            </div>
          ))}
          <small className="text-xs text-white/70">{t.calcNote}</small>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-narrow text-xl font-bold">{t.marketTitle}</h3>
          <p className="text-sm text-muted-foreground">{t.marketText}</p>
        </div>
        <div className="sm:text-right">
          <b className="font-mono text-4xl text-lime-deep">{t.marketRate(MARKETPLACE_RATE_PERCENT)}</b>
          <p className="text-[13px] text-muted-foreground">{t.marketRateNote}</p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {t.included.map((line) => (
          <li key={line} className="rounded-[14px] bg-ok-soft p-3.5 text-sm font-medium text-ok-text">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
