import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-context";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { dateTime, describeError, websiteFr as t } from "@/lib/fr";
import { cn } from "@/lib/utils";

/**
 * « Site du parking » (19/11/2026, niveau 2 « l'extension WordPress Plazo »): the key of the parking's WordPress site, the
 * plugin to download and whether bookings arrive. The key is shown once, right after it is made.
 */
export function WebsiteIntegrationCard() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [fresh, setFresh] = useState<string | null>(null);
  const readOnly = !!user?.demo;
  const query = useQuery({ queryKey: ["website-integration"], queryFn: adminApi.getWebsiteIntegration });
  const data = query.data?.data;

  const create = useMutation({
    mutationFn: adminApi.createWebsiteKey,
    onSuccess: (r) => {
      setFresh(r.data.key ?? null);
      queryClient.setQueryData(["website-integration"], { data: { ...r.data, key: undefined } });
      toast.success(t.created);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const remove = useMutation({
    mutationFn: adminApi.removeWebsiteKey,
    onSuccess: (r) => {
      setFresh(null);
      queryClient.setQueryData(["website-integration"], r);
      toast.success(t.removed);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const copy = async () => {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh);
      toast.success(t.copied);
    } catch {
      /* the key stays shown, to select by hand */
    }
  };

  const state = !data?.connected ? t.notConnected : data.lastUsedAt ? t.connected : t.waiting;
  return (
    <Card id="site">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Globe className="h-5 w-5 text-lime-deep" aria-hidden />
            {t.title}
          </h2>
          {data && (
            <span
              data-testid="website-state"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                data.connected && data.lastUsedAt ? "bg-ok-soft text-ok-text" : "bg-panel-2 text-muted-foreground",
              )}
            >
              {state}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
        {data?.connected && (
          <p className="text-sm" data-testid="website-line">
            {t.siteLine(data.siteHost, data.lastBookingAt ? dateTime.format(new Date(data.lastBookingAt)) : null)}
          </p>
        )}
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {t.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {fresh && (
          <div className="space-y-2 rounded-[12px] border border-lime bg-lime/10 p-3" data-testid="website-key">
            <p className="text-sm font-semibold">{t.keyOnce}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 select-all break-all rounded-md bg-white px-2 py-1.5 font-mono text-sm">{fresh}</code>
              <Button size="sm" onClick={copy}>
                {t.copy}
              </Button>
            </div>
          </div>
        )}
        {!fresh && data?.keyPrefix && <p className="font-mono text-sm text-muted-foreground">{t.keyShown(data.keyPrefix)}</p>}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={adminApi.wordpressPluginUrl()} download="plazo.zip">
              {t.download(data?.pluginVersion ?? "1.0.0")}
            </a>
          </Button>
          {!readOnly &&
            (data?.connected ? (
              <>
                <Button
                  variant="outline"
                  disabled={create.isPending}
                  onClick={async () => {
                    if (await confirm(t.renewConfirm, { confirmLabel: t.renew })) create.mutate();
                  }}
                >
                  {t.renew}
                </Button>
                <Button
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (await confirm(t.removeConfirm, { confirmLabel: t.remove, destructive: true })) remove.mutate();
                  }}
                >
                  {t.remove}
                </Button>
              </>
            ) : (
              <Button disabled={create.isPending || !data} onClick={() => create.mutate()} data-testid="website-create">
                {t.create}
              </Button>
            ))}
        </div>
        {readOnly && <p className="text-xs text-muted-foreground">{t.demo}</p>}
      </CardContent>
    </Card>
  );
}
