import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail, TriangleAlert } from "lucide-react";
import { Fragment, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-context";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { timeAgo } from "@/lib/datetime";
import { describeError, inboundFr as t } from "@/lib/fr";
import type {
  ComparatorArrival,
  InboundComparator,
  InboundEmailStatus,
} from "@/lib/types";
import { InboundSetupWizard } from "./InboundSetupWizard";

const SHOWN: InboundEmailStatus[] = [
  "imported",
  "duplicate",
  "incomplete",
  "unrecognised",
  "handled",
  "archived",
];

const ARRIVAL_TONE: Record<ComparatorArrival, BadgeTone> = {
  direct: "ok",
  forwarded: "info",
  manual: "warn",
  unknown: "line",
  none: "warn",
};

async function copyText(value: string, done: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(done);
  } catch {
    window.prompt(t.copy, value);
  }
}

/** C (14/10/2026): one comparator, its last email and how it arrives; « Comment faire » opens its steps under it. */
function ComparatorRow({
  line,
  address,
}: {
  line: InboundComparator;
  address: string;
}) {
  const [open, setOpen] = useState(false);
  const c = t.comparators;
  const what = line.lastStatus ? c.lastStatus[line.lastStatus] : "";
  return (
    <Fragment>
      <tr
        data-testid={`comparator-${line.provider}`}
        className="border-t border-panel-line align-middle"
      >
        <th scope="row" className="px-4 py-3 text-left text-[15px] font-bold">
          {line.provider}
        </th>
        <td
          className={
            line.lastReceivedAt
              ? "px-4 py-3 text-sm"
              : "px-4 py-3 text-sm text-muted-foreground"
          }
        >
          {line.lastReceivedAt
            ? c.last(timeAgo(line.lastReceivedAt), what)
            : c.never}
        </td>
        <td className="px-4 py-3">
          <Badge tone={ARRIVAL_TONE[line.arrival]}>
            {c.arrival[line.arrival]}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="min-h-11 text-sm font-semibold text-lime-deep underline-offset-4 hover:underline"
          >
            {open ? c.hide : c.howTo}
          </button>
        </td>
      </tr>
      {open && (
        <tr data-testid={`comparator-${line.provider}-steps`}>
          <td colSpan={4} className="bg-panel-2 px-4 py-3">
            <div className="flex max-w-3xl flex-col gap-2 text-sm leading-relaxed">
              <p className="m-0">{c.steps(line.provider)}</p>
              <p className="m-0 text-muted-foreground">
                {c.ask(line.provider)}
              </p>
              <pre className="m-0 whitespace-pre-wrap rounded-[10px] border border-panel-line bg-white p-3 font-sans text-[13px]">
                {c.message(address)}
              </pre>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => copyText(c.message(address), c.messageCopied)}
                >
                  {c.copyMessage}
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/**
 * M-A (06/10/2026): the operator's inbound address, the setup wizard (G-B, 07/10/2026; A, 14/10/2026) and what came
 * in. C (14/10/2026, « C puis A »): the address is first given to the comparators themselves, one line each; the
 * mailbox rule is the fallback.
 */
export function InboundEmailCard() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [wizard, setWizard] = useState(false);
  const settings = useQuery({
    queryKey: ["inbound-settings"],
    queryFn: adminApi.getInboundSettings,
  });
  const enable = useMutation({
    mutationFn: (regenerate: boolean) =>
      adminApi.enableInboundAddress(regenerate),
    onSuccess: (data) => queryClient.setQueryData(["inbound-settings"], data),
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const s = settings.data;
  // Once a booking email came in (whatever became of it since), the wizard is only there to look the steps up again.
  const connected = s
    ? SHOWN.reduce((sum, k) => sum + s.counts[k], 0) + s.counts.dismissed > 0
    : false;
  const unexpected = s?.unexpected?.count ?? 0;
  return (
    <Card data-testid="inbound-card">
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Mail className="h-5 w-5 text-lime-deep" aria-hidden="true" />
              {t.title}
            </h2>
            {s?.available && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t.intro}
              </p>
            )}
          </div>
          {s?.available && s.address && (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.addressLabel}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <code
                  data-testid="inbound-address"
                  className="break-all rounded-lg border border-lime-deep bg-accent px-3 py-2 font-mono text-[15px]"
                >
                  {s.address}
                </code>
                <Button
                  type="button"
                  className="h-10"
                  onClick={() => copyText(s.address!, t.copied)}
                >
                  <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.copy}
                </Button>
              </div>
              <button
                type="button"
                disabled={enable.isPending}
                onClick={() =>
                  void confirm(t.regenerateConfirm).then(
                    (ok) => ok && enable.mutate(true),
                  )
                }
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {t.regenerate}
              </button>
            </div>
          )}
        </div>
        {settings.isError ? (
          <p className="text-sm text-destructive">
            {describeError(settings.error)}
          </p>
        ) : !s ? (
          <Skeleton className="h-20" />
        ) : (
          <>
            {!s.available ? (
              <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                {t.unavailable}
              </p>
            ) : (
              <>
                {unexpected > 0 && (
                  <div
                    data-testid="inbound-unexpected"
                    role="status"
                    className="flex flex-wrap items-start gap-3 rounded-xl bg-warn-soft p-4 text-warn-text"
                  >
                    <TriangleAlert
                      className="mt-0.5 h-5 w-5 flex-none"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-[1_1_320px] text-sm leading-relaxed">
                      <p className="m-0 font-bold">{t.unexpected.title}</p>
                      <p className="m-0">{t.unexpected.text(unexpected)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 bg-white"
                      onClick={() => setWizard(true)}
                    >
                      {t.unexpected.action}
                    </Button>
                  </div>
                )}
                {s.address && s.comparators && s.comparators.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-panel-line">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <caption className="sr-only">
                        {t.comparators.title}
                      </caption>
                      <thead>
                        <tr className="bg-panel-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          <th scope="col" className="px-4 py-2.5">
                            {t.comparators.columns.provider}
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            {t.comparators.columns.last}
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            {t.comparators.columns.arrival}
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            <span className="sr-only">
                              {t.comparators.howTo}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.comparators.map((line) => (
                          <ComparatorRow
                            key={line.provider}
                            line={line}
                            address={s.address!}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel-2 px-4 py-3">
                  <span className="min-w-0 flex-[1_1_320px] text-sm text-muted-foreground">
                    {t.comparators.fallback}
                  </span>
                  <Button
                    type="button"
                    data-testid="inbound-connect"
                    variant={connected ? "outline" : "default"}
                    className={connected ? "h-11 bg-white" : "h-11"}
                    onClick={() => setWizard(true)}
                  >
                    {connected ? t.reviewSteps : t.connect}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    {s.lastReceivedAt
                      ? t.lastReceived(timeAgo(s.lastReceivedAt))
                      : t.neverReceived}
                  </span>
                  <span className="text-muted-foreground">
                    {t.counts30} ·{" "}
                    {SHOWN.map(
                      (k) => `${t.status[k].toLowerCase()} ${s.counts[k]}`,
                    ).join(" · ")}
                  </span>
                  <Link
                    to="/reservations/a-verifier"
                    className="font-semibold text-lime-deep underline-offset-4 hover:underline"
                  >
                    {t.toCheck(s.toCheck)} · {t.openList}
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      {wizard && <InboundSetupWizard onClose={() => setWizard(false)} />}
    </Card>
  );
}
