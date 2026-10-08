import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ConfirmContext,
  type ConfirmFn,
  type ConfirmOptions,
} from "./confirm-context";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

interface Pending {
  message: string;
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirm = useCallback<ConfirmFn>(
    (message, options = {}) =>
      new Promise<boolean>((resolve) => {
        // A second question while one is open answers the first with "no".
        setPending((current) => {
          current?.resolve(false);
          return { message, options, resolve };
        });
      }),
    [],
  );
  const answer = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <ConfirmDialog pending={pending} onAnswer={answer} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  pending,
  onAnswer,
}: {
  pending: Pending;
  onAnswer: (ok: boolean) => void;
}) {
  const t = fr.common.confirm;
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    yesRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnswer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer]);
  const {
    title = t.title,
    confirmLabel = t.yes,
    destructive = false,
  } = pending.options;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4"
      onClick={() => onAnswer(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <p
          id="confirm-message"
          className="mt-2 whitespace-pre-line text-sm text-foreground"
        >
          {pending.message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="inline-flex min-h-11 items-center border border-border px-4 text-[15px] font-bold uppercase tracking-[0.5px] hover:bg-accent"
          >
            {t.no}
          </button>
          <button
            ref={yesRef}
            type="button"
            onClick={() => onAnswer(true)}
            className={cn(
              "inline-flex min-h-11 items-center px-4 text-[15px] font-bold uppercase tracking-[0.5px]",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
