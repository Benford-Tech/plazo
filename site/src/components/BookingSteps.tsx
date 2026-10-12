import { fr } from "@/lib/fr";

/**
 * "1 · Vos informations / 2 · Paiement" when a booking is paid online. Boutique: soft pills in spaced capitals,
 * the current step in espresso (orange is kept for the action).
 */
export function BookingSteps({ current }: { current: 1 | 2 }) {
  const steps = [fr.booking.stepDetails, fr.booking.stepPayment];
  return (
    <ol aria-label={fr.booking.steps} className="flex gap-1.5 md:max-w-[460px]">
      {steps.map((label, i) => {
        const active = i + 1 === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={`pill min-h-9 flex-1 justify-center px-2 ${active ? "pill-dark" : ""}`}>
            {label}
            {active && <span className="sr-only"> {fr.booking.currentStep}</span>}
          </li>
        );
      })}
    </ol>
  );
}
