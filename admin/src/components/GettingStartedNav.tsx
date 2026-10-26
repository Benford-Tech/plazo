import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import type { GettingStartedStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.gettingStarted;
const HIDDEN_KEY = "plazo:getting-started-hidden";

/** Where each step is set up on the web (the member's steps point to Plazo Pro, with no link). */
const GETTING_STARTED_LINKS: Record<string, string> = {
  parking: "/parking/reglages",
  bookings: "/parking/reglages",
  team: "/equipe",
  shuttles: "/parking/reglages",
  listing: "/plazo",
  contract: "/parking/reglages",
  sms: "/reservations/sms-veille",
  plan: "/parking/plan",
  inbox: "/reservations/a-verifier",
  reservations: "/reservations",
};

const readHidden = () => {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
};
const writeHidden = (hidden: boolean) => {
  try {
    if (hidden) localStorage.setItem(HIDDEN_KEY, "1");
    else localStorage.removeItem(HIDDEN_KEY);
  } catch {
    /* private window: the choice lasts the page */
  }
};

/**
 * T-A (26/10/2026, « ajoute un tutoriel pour bien démarrer avec Plazo Pro »), moved into the left rail the same day
 * (« les étapes bien démarrer doivent être sur la nav bar de gauche »): under the rail's sections, « Bien démarrer · 2 / 7 »
 * then one line per step of the member's post, ticked from what Plazo sees (`GET /internal/getting-started`), each a link to
 * where it is set up. Folded by a click (kept in the browser), gone of itself once everything is done. Desktop rail only.
 */
export function GettingStartedNav() {
  const [hidden, setHidden] = useState(readHidden);
  const { data } = useQuery({
    queryKey: ["getting-started"],
    queryFn: () => adminApi.getGettingStarted(),
    staleTime: 60_000,
  });
  if (!data || data.done >= data.total) return null;
  const toggle = () => {
    writeHidden(!hidden);
    setHidden(!hidden);
  };
  return (
    <section
      data-testid="getting-started"
      aria-label={t.title}
      className="mt-4 hidden border-t border-panel-line px-2 pt-3 lg:block"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!hidden}
        className="flex min-h-9 w-full items-center gap-2 rounded-lg px-1 text-left hover:bg-panel-2"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-deep">
          {t.title}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {t.progress(data.done, data.total)}
        </span>
        {hidden ? (
          <ChevronDown
            className="ml-auto h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <ChevronUp
            className="ml-auto h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </button>
      <div
        className="mx-1 mb-2 h-1 overflow-hidden rounded-full bg-panel-2"
        role="progressbar"
        aria-valuenow={data.done}
        aria-valuemin={0}
        aria-valuemax={data.total}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(data.done / data.total) * 100}%` }}
        />
      </div>
      {!hidden && (
        <ol className="flex flex-col gap-0.5">
          {data.steps.map((step) => (
            <StepRow key={step.key} step={step} />
          ))}
        </ol>
      )}
    </section>
  );
}

function StepRow({ step }: { step: GettingStartedStep }) {
  const text = t.steps[step.key as keyof typeof t.steps];
  const to = GETTING_STARTED_LINKS[step.key];
  const inner = (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border",
          step.done
            ? "border-transparent bg-ok text-white"
            : "border-panel-line bg-panel",
        )}
        style={{ width: 18, height: 18 }}
        aria-label={step.done ? t.done : t.todo}
      >
        {step.done ? <Check className="h-3 w-3" aria-hidden="true" /> : ""}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px] leading-tight",
          step.done ? "text-muted-foreground line-through" : "font-medium",
        )}
        title={step.detail ?? text?.body}
      >
        {text?.title ?? step.key}
      </span>
    </>
  );
  const className = "flex min-h-8 items-center gap-2 rounded-lg px-1";
  return (
    <li data-testid={`getting-started-${step.key}`}>
      {to && !step.done ? (
        <NavLink
          to={to}
          className={cn(className, "hover:bg-panel-2 hover:text-foreground")}
        >
          {inner}
        </NavLink>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}
