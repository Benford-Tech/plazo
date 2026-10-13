import { useQuery } from "@tanstack/react-query";
import { Copy, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { joinCodeRefetchMs } from "@/lib/join-code";

const t = fr.team.code;

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
  const { data, error, isError } = useQuery({
    queryKey: ["join-code"],
    queryFn: adminApi.getJoinCode,
    refetchInterval: query => joinCodeRefetchMs(query.state.data),
  });

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
      {isError ? (
        <p className="text-sm text-destructive">{describeError(error)}</p>
      ) : !data ? (
        <Skeleton className="h-9 w-56" />
      ) : (
        <>
          <p data-testid="join-code" className="select-all font-mono text-[30px] font-bold leading-none tracking-[0.05em] text-foreground">
            {data.code}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-10 rounded-full px-4" onClick={() => void copy(data.code, t.codeCopied)}>
              <Copy aria-hidden="true" />
              {t.copyCode}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              onClick={() => void copy(t.message(data.operatorName, data.code), t.messageCopied)}
            >
              <MessageSquareText aria-hidden="true" />
              {t.copyMessage}
            </Button>
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground">{t.help}</p>
    </section>
  );
}
