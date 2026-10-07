import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { timeAgo } from "@/lib/datetime";
import { describeError, inboundFr as t } from "@/lib/fr";
import type { InboundEmailStatus } from "@/lib/types";
import { InboundSetupWizard } from "./InboundSetupWizard";

const SHOWN: InboundEmailStatus[] = ["imported", "duplicate", "incomplete", "unrecognised"];

/** M-A (06/10/2026): the operator's inbound address, the setup wizard (G-B, 07/10/2026) and what came in. */
export function InboundEmailCard() {
  const queryClient = useQueryClient();
  const [wizard, setWizard] = useState(false);
  const settings = useQuery({ queryKey: ["inbound-settings"], queryFn: adminApi.getInboundSettings });
  const enable = useMutation({
    mutationFn: (regenerate: boolean) => adminApi.enableInboundAddress(regenerate),
    onSuccess: data => queryClient.setQueryData(["inbound-settings"], data),
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const s = settings.data;
  // Once a booking email came in, the wizard is only there to look the steps up again.
  const connected = s ? s.counts.imported + s.counts.duplicate + s.counts.incomplete + s.counts.unrecognised > 0 : false;
  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(t.copied);
    } catch {
      window.prompt(t.copy, address);
    }
  };
  return (
    <Card data-testid="inbound-card">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Mail className="h-5 w-5 text-lime-deep" aria-hidden="true" />
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {settings.isError ? (
          <p className="text-sm text-destructive">{describeError(settings.error)}</p>
        ) : !s ? (
          <Skeleton className="h-20" />
        ) : !s.available ? (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{t.unavailable}</p>
        ) : (
          <>
            {s.address && (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t.addressLabel}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <code data-testid="inbound-address" className="rounded-lg border border-lime-deep bg-accent px-3 py-2 font-mono text-[15px]">
                    {s.address}
                  </code>
                  <Button type="button" variant="outline" className="h-10" onClick={() => copy(s.address!)}>
                    <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.copy}
                  </Button>
                  <button
                    type="button"
                    disabled={enable.isPending}
                    onClick={() => window.confirm(t.regenerateConfirm) && enable.mutate(true)}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {t.regenerate}
                  </button>
                </div>
              </div>
            )}
            <Button type="button" data-testid="inbound-connect" variant={connected ? "outline" : "default"} className="h-11" onClick={() => setWizard(true)}>
              {connected ? t.reviewSteps : t.connect}
            </Button>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">{s.lastReceivedAt ? t.lastReceived(timeAgo(s.lastReceivedAt)) : t.neverReceived}</span>
              <span className="text-muted-foreground">
                {t.counts30} ·{" "}
                {SHOWN.map(k => `${t.status[k].toLowerCase()} ${s.counts[k]}`).join(" · ")}
              </span>
              <Link to="/reservations/a-verifier" className="font-semibold text-lime-deep underline-offset-4 hover:underline">
                {t.toCheck(s.toCheck)} · {t.openList}
              </Link>
            </div>
          </>
        )}
      </CardContent>
      {wizard && <InboundSetupWizard onClose={() => setWizard(false)} />}
    </Card>
  );
}
