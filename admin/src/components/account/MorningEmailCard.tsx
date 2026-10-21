import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { MorningEmailPreference } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.account.morning;
const HOURS = [5, 6, 7, 8, 9, 10];
const KEY = ["notifications", "morning-email"];

/**
 * « Mail du matin » (Mon compte, 21/10/2026, choice A): on or off, the hour it leaves at, and « M'envoyer celui
 * d'aujourd'hui ». On by default for managers; the email's own link turns it off too.
 */
export function MorningEmailCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pref = useQuery({ queryKey: KEY, queryFn: adminApi.getMorningEmail });
  const update = useMutation({
    mutationFn: (patch: { enabled?: boolean; hour?: number }) => adminApi.updateMorningEmail(patch),
    onSuccess: (data: MorningEmailPreference, patch) => {
      queryClient.setQueryData(KEY, data);
      toast.success(patch.enabled === undefined ? t.saved : patch.enabled ? t.on : t.off);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const send = useMutation({
    mutationFn: adminApi.sendMorningEmail,
    onSuccess: () => toast.success(t.sent),
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const data = pref.data;
  const intro = can(user?.role, "revenue:view") ? t.intro : t.introStaff;

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <p className="font-mono text-xs text-lime-deep">{t.section}</p>
        {pref.isLoading ? (
          <Skeleton className="h-24" />
        ) : pref.error || !data ? (
          <p className="text-destructive">{describeError(pref.error)}</p>
        ) : (
          <>
            <div className="flex items-start gap-4 border-b border-panel-line pb-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p id="morning-email-label" className="text-base font-semibold">
                  {t.title}
                </p>
                <p className="text-sm text-muted-foreground">{intro}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data.enabled}
                aria-labelledby="morning-email-label"
                disabled={update.isPending}
                onClick={() => update.mutate({ enabled: !data.enabled })}
                className={cn(
                  "flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60",
                  data.enabled ? "justify-end bg-lime-deep" : "justify-start bg-[#D4D8D2]",
                )}
              >
                <span className={cn("h-[26px] w-[26px] rounded-full", data.enabled ? "bg-lime" : "bg-white")} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="morning-email-hour" className="text-sm font-semibold">
                  {t.hour}
                </label>
                <select
                  id="morning-email-hour"
                  value={data.hour}
                  disabled={!data.enabled || update.isPending}
                  onChange={e => update.mutate({ hour: Number(e.target.value) })}
                  className="h-11 w-full rounded-[10px] border border-input bg-white px-3 text-[15px] disabled:opacity-60"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t.hourHint}</p>
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-semibold">{t.to}</p>
                <p className="flex h-11 items-center truncate rounded-[10px] border border-panel-line bg-panel-2 px-3 text-[15px]">{data.email}</p>
                <Button type="button" variant="link" className="h-auto min-h-11 px-0 text-sm font-semibold" disabled={send.isPending} onClick={() => send.mutate()}>
                  {send.isPending ? t.sending : t.sendNow}
                </Button>
              </div>
            </div>
            <div className="space-y-1 rounded-[10px] bg-panel-2 px-3 py-2.5">
              <p className="text-sm font-semibold">{t.who}</p>
              <p className="text-sm text-muted-foreground">{t.whoText}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
