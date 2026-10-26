import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import type { GettingStartedStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.gettingStarted;
const HIDDEN_KEY = "plazo:getting-started-hidden";

/** Where each step is set up on the web (the member's steps point to Plazo Pro, with no link). */
const LINKS: Record<string, string> = {
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
 * T-A (26/10/2026, « ajoute un tutoriel pour bien démarrer avec Plazo Pro »): the setup steps of the member's post
 * on the dashboard, ticked from what Plazo sees (`GET /internal/getting-started`), each with a link to where it is
 * set up. Folded by a click (kept in the browser), gone of itself once everything is done.
 */
export function GettingStartedCard() {
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
      className="rounded-xl border-2 border-primary bg-panel p-3.5"
    >
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
          <Rocket className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <h2 className="font-mono text-[19px] font-medium leading-tight">
            {t.title}
          </h2>
          <span className="block font-mono text-xs text-muted-foreground">
            {t.progress(data.done, data.total)}
          </span>
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!hidden}
          className="ml-auto flex min-h-11 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-lime-deep hover:bg-panel-2"
        >
          {hidden ? t.show : t.hide}
          {hidden ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </header>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2"
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
        <ol className="mt-3 grid gap-2 md:grid-cols-2">
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
  const to = LINKS[step.key];
  const inner = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
          step.done
            ? "border-transparent bg-ok text-white"
            : "border-panel-line bg-panel text-muted-foreground",
        )}
        aria-label={step.done ? t.done : t.todo}
      >
        {step.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : ""}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[14px] font-semibold leading-tight",
            step.done && "text-muted-foreground line-through decoration-1",
          )}
        >
          {text?.title ?? step.key}
        </span>
        <span className="block text-[12px] text-muted-foreground">
          {step.detail ?? text?.body ?? ""}
        </span>
      </span>
      {to && !step.done && (
        <span className="self-center text-[12px] font-semibold text-lime-deep">
          {t.open} ›
        </span>
      )}
    </>
  );
  const className =
    "flex items-start gap-2.5 rounded-lg border border-panel-line px-2.5 py-2";
  return (
    <li data-testid={`getting-started-${step.key}`}>
      {to && !step.done ? (
        <Link to={to} className={cn(className, "hover:bg-panel-2")}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}
