import { useQuery } from "@tanstack/react-query";
import { Copy, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { isJoinCodeStale, joinCodeRefetchMs } from "@/lib/join-code";

const t = fr.team.code;
/** Long labels wrap on a phone instead of pushing the card wider than the screen; 44 px to touch. */
const BUTTON = "h-auto min-h-11 whitespace-normal rounded-full px-4 py-2 text-left";

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    // No native dialog (07/10/2026): the code stays selectable on the page.
    toast.error(t.copyFailed);
  }
}

/**
 * 13/10/2026: « Code du jour ». A new recruit signs in to Plazo Pro with Apple or Google and types it; a manager then
 * accepts the request. Read-only (copying is not a write), so the platform sees it in consultation too.
 */
export function JoinCodeCard() {
  const { data, dataUpdatedAt, error, isError } = useQuery({
    queryKey: ["join-code"],
    queryFn: adminApi.getJoinCode,
    refetchInterval: query => joinCodeRefetchMs(query.state.data),
    // An Équipe tab left open overnight: read again when it comes back, and keep ticking while hidden.
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });

  // Re-render at the code's end and when the tab shows again, so yesterday's code never stays on screen.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const left = data ? Date.parse(data.validUntil) - Date.now() : NaN;
    if (!(left > 0)) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [data]);
  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);

  const code = data && !isJoinCodeStale(data, dataUpdatedAt, now) ? data : null;
  const accepting = code?.accepting !== false;

  return (
    <section
      aria-labelledby="join-code-title"
      data-testid="join-code-card"
      className="flex flex-col gap-3 rounded-[var(--radius)] border-[1.5px] border-primary bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="join-code-title" className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-lime-deep">
          {t.title}
        </h2>
        <span className="text-xs text-muted-foreground">{t.changes}</span>
      </div>
      {isError && !code ? (
        <p className="text-sm text-destructive">{describeError(error)}</p>
      ) : !code ? (
        <Skeleton data-testid="join-code-loading" className="h-9 w-56" />
      ) : (
        <>
          <p data-testid="join-code" className="select-all font-mono text-[30px] font-bold leading-none tracking-[0.05em] text-foreground">
            {code.code}
          </p>
          {accepting && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" className={BUTTON} onClick={() => void copy(code.code, t.codeCopied)}>
                <Copy aria-hidden="true" />
                {t.copyCode}
              </Button>
              <Button type="button" variant="outline" className={BUTTON} onClick={() => void copy(t.message(code.operatorName, code.code), t.messageCopied)}>
                <MessageSquareText aria-hidden="true" />
                {t.copyMessage}
              </Button>
            </div>
          )}
        </>
      )}
      <p className="text-sm text-muted-foreground">{accepting ? t.help : t.notAccepting}</p>
    </section>
  );
}
