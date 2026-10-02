import { fr } from "@/lib/fr";

/** "1 · Vos informations / 2 · Paiement" when a booking is paid online. */
export function BookingSteps({ current }: { current: 1 | 2 }) {
  const steps = [fr.booking.stepDetails, fr.booking.stepPayment];
  return (
    <ol aria-label={fr.booking.steps} className="flex gap-2 text-[13px] font-semibold md:max-w-[460px]">
      {steps.map((label, i) => {
        const active = i + 1 === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex-1 rounded-full px-2 py-2 text-center ${active ? "bg-accent text-white" : "bg-tint text-soft"}`}
          >
            {label}
            {active && <span className="sr-only"> {fr.booking.currentStep}</span>}
          </li>
        );
      })}
    </ol>
  );
}
