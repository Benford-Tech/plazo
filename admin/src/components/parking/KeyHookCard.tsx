import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { describeError, keyHookFr as t } from "@/lib/fr";
import type { Parking } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * « Crochets des clés » of Parking › Réglages (04/11/2026, « Configuration place = crochet »): keys left go on the hook of
 * the car's place and follow the car (on, the default), or wait for the number the team types.
 */
export function KeyHookCard({ parking }: { parking: Parking }) {
  const queryClient = useQueryClient();
  const on = parking.keyHookIsPlace ?? true;
  const save = useMutation({
    mutationFn: (placeHook: boolean) => adminApi.setKeyHook(parking.id, placeHook),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["parking"], (old: Parking | undefined) => (old ? { ...old, keyHookIsPlace: data.keyHookIsPlace } : old));
      toast.success(t.saved(data.keyHookIsPlace ?? true));
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">{t.toggle}</p>
            <p className="text-sm text-muted-foreground" data-testid="key-hook-explain">
              {on ? t.on : t.off} {t.typed}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={t.toggle}
            data-testid="key-hook-toggle"
            disabled={save.isPending}
            onClick={() => save.mutate(!on)}
            className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50", on ? "bg-primary" : "bg-muted")}
          >
            <span className={cn("absolute top-1 h-6 w-6 rounded-full transition-all", on ? "right-1 bg-primary-foreground" : "left-1 bg-white shadow")} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
