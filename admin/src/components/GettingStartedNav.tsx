import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Rocket, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import type { GettingStarted, GettingStartedStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.gettingStarted;
const HIDDEN_KEY = "plazo:getting-started-hidden";
const WELCOME_KEY = "plazo:getting-started-welcome";

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
  return (
    <>
      <GettingStartedWelcome data={data} />
      <GettingStartedRail data={data} hidden={hidden} setHidden={setHidden} />
    </>
  );
}

const readWelcomed = (staffId: string) => {
  try {
    return (localStorage.getItem(WELCOME_KEY) ?? "")
      .split(",")
      .includes(staffId);
  } catch {
    return true;
  }
};
const writeWelcomed = (staffId: string) => {
  try {
    const seen = (localStorage.getItem(WELCOME_KEY) ?? "")
      .split(",")
      .filter(Boolean);
    if (!seen.includes(staffId))
      localStorage.setItem(WELCOME_KEY, [...seen, staffId].join(","));
  } catch {
    /* private window: shown again next time */
  }
};

/**
 * « Mets en avant le Bien démarrer : une pop-up à la première connexion » (27/10/2026): the first time a member opens the
 * pro space on this browser while steps remain, a welcome dialog names the next ones and points at the rail. Seen once per
 * member and browser (`plazo:getting-started-welcome`), never in a demo or while viewing another operator's space.
 */
function GettingStartedWelcome({ data }: { data: GettingStarted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const staffId = user?.id ?? "";
  const eligible = !!staffId && !user?.demo && !user?.viewAs;
  const [open, setOpen] = useState(() => eligible && !readWelcomed(staffId));
  const startRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    writeWelcomed(staffId);
    setOpen(false);
  };
  useEffect(() => {
    if (!open) return;
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  const next = data.steps.filter((s) => !s.done).slice(0, 3);
  const first = next.find((s) => GETTING_STARTED_LINKS[s.key]);
  const w = t.welcome;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4"
      onClick={close}
      data-testid="getting-started-welcome"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="getting-started-welcome-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="getting-started-welcome-title"
              className="font-mono text-[20px] font-medium leading-tight"
            >
              {w.title(user?.firstName ?? "")}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {w.body(data.done, data.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={w.later}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-panel-2 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <ol className="mt-4 flex flex-col gap-1.5">
          {next.map((step) => {
            const text = t.steps[step.key as keyof typeof t.steps];
            return (
              <li
                key={step.key}
                className="flex items-start gap-2.5 rounded-lg border border-panel-line px-3 py-2"
              >
                <span
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border border-panel-line bg-panel"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold leading-tight">
                    {text?.title ?? step.key}
                  </span>
                  <span className="block text-[12px] text-muted-foreground">
                    {step.detail ?? text?.body ?? ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[12px] text-muted-foreground">{w.hint}</p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-xl border border-panel-line px-4 text-[14px] font-semibold hover:bg-panel-2"
          >
            {w.later}
          </button>
          <button
            ref={startRef}
            type="button"
            onClick={() => {
              close();
              if (first) navigate(GETTING_STARTED_LINKS[first.key]);
            }}
            className="min-h-11 rounded-xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground hover:opacity-90"
          >
            {first
              ? w.start(t.steps[first.key as keyof typeof t.steps]?.title ?? "")
              : w.ok}
          </button>
        </div>
      </div>
    </div>
  );
}

function GettingStartedRail({
  data,
  hidden,
  setHidden,
}: {
  data: GettingStarted;
  hidden: boolean;
  setHidden: (h: boolean) => void;
}) {
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
