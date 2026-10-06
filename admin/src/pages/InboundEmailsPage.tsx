import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { describeError, inboundFr as t } from "@/lib/fr";
import type { InboundEmail, InboundEmailStatus } from "@/lib/types";

const TONE: Record<InboundEmailStatus, BadgeTone> = { imported: "ok", duplicate: "line", incomplete: "warn", unrecognised: "bad", dismissed: "line" };
const TO_CHECK: InboundEmailStatus[] = ["incomplete", "unrecognised"];

function Row({ email }: { email: InboundEmail }) {
  const l = t.list;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dismiss = useMutation({
    mutationFn: () => adminApi.dismissInboundEmail(email.id),
    onSuccess: () => {
      toast.success(l.dismissed);
      void queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      void queryClient.invalidateQueries({ queryKey: ["inbound-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const waiting = TO_CHECK.includes(email.status);
  const summary = email.parsed
    ? [email.parsed.customerName, email.parsed.plate, email.parsed.arrivalAt ? dateTimeShort(email.parsed.arrivalAt) : null, email.parsed.externalReference].filter(Boolean).join(" · ")
    : null;
  return (
    <li data-testid="inbound-row" data-status={email.status} className="space-y-2 border-b border-border py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONE[email.status]}>{t.status[email.status]}</Badge>
        <span className="min-w-0 flex-1 truncate font-semibold">{email.subject ?? "—"}</span>
        <span className="font-mono text-xs text-muted-foreground">{l.received(dateTimeShort(email.receivedAt))}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {l.from(email.fromName, email.fromAddress)}
        {email.provider && ` · ${l.provider(email.provider)}`}
      </p>
      {summary && <p className="text-sm">{summary}</p>}
      {email.missing.length > 0 && <p className="text-sm text-warn-text">{l.missing(email.missing.map(f => l.field[f] ?? f).join(", "))}</p>}
      {open && (email.textBody ? <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-xs">{email.textBody}</pre> : <p className="text-xs text-muted-foreground">{l.textGone}</p>)}
      <div className="flex flex-wrap gap-2">
        {waiting && (
          <button
            type="button"
            data-testid="inbound-complete"
            onClick={() => navigate("/reservations/nouvelle", { state: { prefill: email.parsed ?? { provider: email.provider ?? "" }, inboundId: email.id } })}
            className="h-10 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-110"
          >
            {email.parsed ? l.complete : l.typeIt}
          </button>
        )}
        {email.reservationId && (
          <Link to={`/reservations/${email.reservationId}`} className="flex h-10 items-center rounded-full border border-lime-deep px-4 text-sm font-semibold text-lime-deep hover:bg-accent">
            {l.openBooking(email.reservationReference ?? "")}
          </Link>
        )}
        <button type="button" onClick={() => setOpen(o => !o)} className="flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold hover:bg-accent">
          {open ? l.hideText : l.showText}
        </button>
        {waiting && (
          <button type="button" data-testid="inbound-dismiss" disabled={dismiss.isPending} onClick={() => dismiss.mutate()} className="flex h-10 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline">
            {l.dismiss}
          </button>
        )}
      </div>
    </li>
  );
}

/** "Mails à vérifier" (M-A, 06/10/2026): the forwarded emails Plazo could not turn into a booking alone. */
export default function InboundEmailsPage() {
  const l = t.list;
  const emails = useQuery({ queryKey: ["inbound-emails"], queryFn: () => adminApi.getInboundEmails(), refetchInterval: 60_000 });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3 border-b-2 border-lime-deep pb-3">
        <Link to="/reservations" aria-label={l.back} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold uppercase tracking-wide">
            <Mail className="h-6 w-6 text-lime-deep" aria-hidden="true" />
            {l.title}
          </h1>
          <p className="text-sm text-muted-foreground">{l.subtitle}</p>
        </div>
      </div>
      {emails.isError ? (
        <p className="text-destructive">{describeError(emails.error) || l.loadError}</p>
      ) : !emails.data ? (
        <Skeleton className="h-40" />
      ) : emails.data.data.length === 0 ? (
        <p className="py-8 text-muted-foreground">{l.empty}</p>
      ) : (
        <ul>
          {emails.data.data.map(email => (
            <Row key={email.id} email={email} />
          ))}
        </ul>
      )}
    </div>
  );
}
