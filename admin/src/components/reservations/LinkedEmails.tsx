import { useQuery } from "@tanstack/react-query";
import { Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import {
  ChangeBlock,
  MailBody,
  ReadingLine,
  StatusBadge,
  Understood,
} from "@/pages/InboundEmailsPage";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { inboundFr, linkedEmailsFr as t } from "@/lib/fr";
import type { LinkedEmail, LinkedEmailRole } from "@/lib/types";

const ROLE_TONE: Record<LinkedEmailRole, BadgeTone> = {
  created: "ok",
  change: "info",
  cancellation: "bad",
  duplicate: "warn",
  linked: "line",
};

const LINK = "font-semibold text-lime-deep underline-offset-4 hover:underline";

/**
 * « Mails liés » of a booking (27/10/2026, « pouvoir retrouver le mail qui a permis de créer la réservation »,
 * direction C): the mails that made it, changed it, cancelled it or repeated it, oldest first; « Voir » opens the mail
 * in a drawer on the booking's page. Shown to the staff who reach the inbox, and only when the booking has mails.
 */
export function LinkedEmails({ reservationId }: { reservationId: string }) {
  const query = useQuery({
    queryKey: ["reservation-emails", reservationId],
    queryFn: () => adminApi.getReservationEmails(reservationId),
  });
  const [open, setOpen] = useState<LinkedEmail | null>(null);
  const emails = query.data?.data ?? [];
  if (emails.length === 0) return null;
  return (
    <section
      data-testid="linked-emails"
      aria-labelledby="linked-emails-title"
      className="rounded-xl border border-panel-line bg-white p-4"
    >
      <h2 id="linked-emails-title" className="text-base font-semibold">
        {t.title(emails.length)}
      </h2>
      <ul className="mt-2 divide-y divide-panel-line">
        {emails.map((email) => (
          <li
            key={email.id}
            data-testid="linked-email"
            data-role={email.role}
            className="flex items-center gap-3 py-2.5"
          >
            <Badge tone={ROLE_TONE[email.role]} className="shrink-0">
              {t.role[email.role]}
            </Badge>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {email.subject ?? inboundFr.list.noSubject}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {[
                  email.provider ??
                    email.fromName ??
                    email.fromAddress ??
                    inboundFr.list.unknownSender,
                  dateTimeShort(email.receivedAt),
                ].join(" · ")}
              </span>
            </span>
            <button
              type="button"
              className={`${LINK} shrink-0 text-sm`}
              onClick={() => setOpen(email)}
              aria-haspopup="dialog"
            >
              {t.view} ›
            </button>
          </li>
        ))}
      </ul>
      {open && <MailDrawer email={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** The mail on the booking's page: the inbox's reading pane without its gestures, and the way to the inbox. */
function MailDrawer({
  email,
  onClose,
}: {
  email: LinkedEmail;
  onClose: () => void;
}) {
  const l = inboundFr.list;
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);
  const understood = email.parsed !== null || email.missing.length > 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t.close}
        tabIndex={-1}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.dialog}
        data-testid="linked-email-drawer"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-panel-line bg-panel shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-panel-line px-5 py-3">
          <Badge tone={ROLE_TONE[email.role]}>{t.role[email.role]}</Badge>
          <StatusBadge email={email} />
          <span className="flex-1" />
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-panel-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <header className="space-y-2 border-b border-panel-line px-5 py-4">
          <h2 className="flex items-start gap-2 text-xl font-bold leading-tight">
            <Mail
              className="mt-1 h-5 w-5 shrink-0 text-lime-deep"
              aria-hidden="true"
            />
            <span
              className={email.subject ? undefined : "text-muted-foreground"}
            >
              {email.subject ?? l.noSubject}
            </span>
          </h2>
          <p className="break-all text-sm">
            <span className="text-muted-foreground">{l.from} : </span>
            {l.sender(email.fromName, email.fromAddress)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">{l.received} : </span>
            <span className="font-mono">{dateTimeShort(email.receivedAt)}</span>
          </p>
          {email.provider && (
            <p className="text-sm">
              <span className="text-muted-foreground">{l.recognised} : </span>
              <span className="font-semibold text-lime-deep">
                {email.provider}
              </span>
            </p>
          )}
          {email.reading && (
            <ReadingLine
              reading={email.reading}
              missing={email.missing}
              changed={!!email.change}
            />
          )}
        </header>
        <div className="px-5 py-4">
          {email.textBody ? (
            <MailBody text={email.textBody} />
          ) : (
            <p className="text-sm text-muted-foreground">{t.textGone}</p>
          )}
        </div>
        {email.change && <ChangeBlock change={email.change} />}
        {!email.change && understood && <Understood email={email} />}
        <div className="mt-auto border-t border-panel-line px-5 py-4">
          {email.inboxView ? (
            <Link
              to={`/reservations/a-verifier?vue=${email.inboxView}&mail=${email.id}`}
              data-testid="linked-email-inbox"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-110"
            >
              {t.openInbox}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{t.leftInbox}</p>
          )}
        </div>
      </div>
    </div>
  );
}
