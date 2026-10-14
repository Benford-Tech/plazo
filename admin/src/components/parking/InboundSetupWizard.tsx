import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, TriangleAlert, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTimeShort, localParts, timeOf, todayLocal } from "@/lib/datetime";
import {
  describeError,
  inboundFr,
  inboundWizardFr as t,
  type MailProvider,
  type WizardLine,
} from "@/lib/fr";
import type {
  InboundEmailStatus,
  InboundRecent,
  InboundSettings,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDERS: MailProvider[] = ["gmail", "outlook", "ovh", "other"];
/** Emails that prove the forwarding works (anything but Gmail's code). */
const BOOKING: InboundEmailStatus[] = [
  "imported",
  "duplicate",
  "incomplete",
  "unrecognised",
  "dismissed",
  "handled",
  "archived",
];
const TONE: Record<InboundEmailStatus, BadgeTone> = {
  imported: "ok",
  duplicate: "line",
  incomplete: "warn",
  unrecognised: "bad",
  dismissed: "line",
  handled: "ok",
  archived: "line",
  forwarding: "info",
  ignored: "line",
};
/** The Gmail code and the first email show up while the wizard is open. */
const POLL_MS = 5000;
/** A booking email this recent counts as the test, even if it came just before the wizard was opened. */
const FRESH_MS = 30 * 60_000;

/**
 * A (14/10/2026): the settings page each button opens, in a new tab. Gmail's settings tabs have their own address;
 * Outlook's rules do not: Outlook opens on the mailbox, the steps say where the rules are.
 */
const LINKS = {
  gmailForwarding: "https://mail.google.com/mail/u/0/#settings/fwdandpop",
  gmailFilters: "https://mail.google.com/mail/u/0/#settings/filters",
  outlook: "https://outlook.live.com/mail/",
  outlookWork: "https://outlook.office.com/mail/",
};

/** "Cliquez **Créer un filtre**" → bold words. */
function rich(text: string): ReactNode {
  return text
    .split("**")
    .map((part, i) =>
      i % 2 ? (
        <strong key={i}>{part}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

const plain = (text: string) => text.replace(/\*\*/g, "");

/** "à 14:02" today, "le mar. 14 oct., 14:02" before. */
function when(iso: string): string {
  return localParts(iso).date === todayLocal()
    ? `à ${timeOf(iso)}`
    : `le ${dateTimeShort(iso)}`;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(t.copied);
  } catch {
    window.prompt(t.copy, value);
  }
}

/** Several comparators: Gmail's "De" field takes "a OR b", the others a list. */
function senderFor(provider: MailProvider | null, senders: string[]): string {
  return senders.join(provider === "gmail" ? " OR " : ", ");
}

function CopyField({
  value,
  accent,
  testId,
}: {
  value: string;
  accent?: boolean;
  testId: string;
}) {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-2">
      <code
        data-testid={testId}
        className={cn(
          "break-all rounded-[10px] border px-3 py-2 font-mono text-sm",
          accent
            ? "border-lime-deep bg-accent"
            : "border-panel-line bg-panel-2",
        )}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => copyText(value)}
        className="h-9 rounded-[10px] border border-panel-line bg-white px-3 text-[13px] font-medium hover:bg-panel-2"
      >
        {t.copy}
      </button>
    </span>
  );
}

function Lines({
  lines,
  sender,
  address,
}: {
  lines: WizardLine[];
  sender: string;
  address: string;
}) {
  return (
    <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed">
      {lines.map((line) => (
        <li key={line.text}>
          {rich(line.text)}
          {line.copy && (
            <CopyField
              value={line.copy === "sender" ? sender : address}
              accent={line.copy === "address"}
              testId={`copy-${line.copy}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function OpenLink({
  href,
  label,
  testId,
}: {
  href: string;
  label: string;
  testId: string;
}) {
  return (
    <a
      data-testid={testId}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-panel-line bg-white px-3 text-[13px] font-semibold text-lime-deep no-underline hover:bg-panel-2"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
    </span>
  );
}

type BlockState = "done" | "current" | "later";

/** One setting: its number (a check once Plazo saw it done), its title and state, then its steps. */
function Block({
  n,
  state,
  title,
  testId,
  children,
}: {
  n: number;
  state: BlockState;
  title: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      data-state={state}
      className={cn(
        "flex flex-col gap-3 rounded-xl p-[18px]",
        state === "current"
          ? "border-2 border-primary p-[17px] shadow-[0_0_0_4px_rgba(163,230,53,0.2)]"
          : "border border-panel-line",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-extrabold",
            state === "done"
              ? "bg-lime-deep"
              : state === "current"
                ? "bg-primary text-primary-foreground"
                : "border-2 border-gray-300 text-muted-foreground",
          )}
        >
          {state === "done" ? (
            <Check
              className="h-3.5 w-3.5 text-white"
              strokeWidth={3.5}
              aria-hidden="true"
            />
          ) : (
            n
          )}
        </span>
        <h3 className="m-0 flex-1 text-base font-bold">{title}</h3>
        {state === "done" ? (
          <Badge tone="ok">{t.state.done}</Badge>
        ) : state === "current" ? (
          <Badge tone="warn">{t.state.waiting}</Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:pl-10">{children}</div>
    </section>
  );
}

/** A line of « Ce que Plazo voit »: seen (green check and when), awaited (lime ring) or later (grey ring). */
function Seen({
  state,
  title,
  detail,
  testId,
}: {
  state: BlockState;
  title: string;
  detail: string;
  testId: string;
}) {
  return (
    <li
      data-testid={testId}
      data-state={state}
      className="flex items-start gap-3"
    >
      {state === "done" ? (
        <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-ok">
          <Check
            className="h-3 w-3 text-white"
            strokeWidth={3.5}
            aria-hidden="true"
          />
        </span>
      ) : (
        <span
          className={cn(
            "mt-0.5 h-[22px] w-[22px] flex-none rounded-full border-2",
            state === "current" ? "border-primary" : "border-gray-300",
          )}
          aria-hidden="true"
        />
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </span>
    </li>
  );
}

function RecentRow({ email }: { email: InboundRecent }) {
  return (
    <li
      data-testid="wizard-recent"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-panel-line py-2 last:border-b-0"
    >
      <span className="font-mono text-xs text-muted-foreground">
        {timeOf(email.receivedAt)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold">
          {email.fromName ?? email.fromAddress ?? "—"}
        </span>
        {email.subject && (
          <span className="text-muted-foreground"> · {email.subject}</span>
        )}
      </span>
      <Badge tone={TONE[email.status]}>{t.seen.status[email.status]}</Badge>
    </li>
  );
}

/** The email to whoever runs the mailbox: the rule, then the provider's steps in plain text. */
function shareHref(
  provider: MailProvider,
  address: string,
  sender: string,
): string {
  const steps =
    provider === "gmail"
      ? [
          ...t.gmail.add.lines.map((l) => plain(l.text)),
          t.share.gmailCode,
          ...t.gmail.filter.lines.map((l) => plain(l.text)),
        ]
      : t.rule[provider].lines.map((l) => plain(l.text));
  const title =
    provider === "gmail" ? t.gmail.filter.title : t.rule[provider].title;
  const body = [
    t.share.intro,
    "",
    t.share.sender(sender),
    t.share.address(address),
    "",
    `${title} :`,
    ...steps.map((step, i) => `${i + 1}. ${step}`),
    "",
    t.share.outro,
  ].join("\n");
  return `mailto:?subject=${encodeURIComponent(t.share.subject)}&body=${encodeURIComponent(body)}`;
}

/** The test: transfer an old booking email by hand; the latest one received since the wizard opened says how it went. */
function TestBlock({
  n,
  state,
  s,
  address,
  openedAt,
}: {
  n: number;
  state: BlockState;
  s: InboundSettings;
  address: string;
  openedAt: number;
}) {
  const fresh =
    s.recent.find(
      (r) =>
        BOOKING.includes(r.status) &&
        Date.parse(r.receivedAt) >= openedAt - FRESH_MS,
    ) ?? null;
  return (
    <Block n={n} state={state} title={t.test.title} testId="wizard-test">
      <Lines lines={t.test.lines} sender="" address={address} />
      {fresh &&
        (fresh.status === "imported" || fresh.status === "duplicate" ? (
          <p
            data-testid="wizard-ok"
            className="m-0 rounded-[10px] bg-ok-soft px-3.5 py-3 text-sm font-semibold text-ok-text"
          >
            {t.test.ok}
          </p>
        ) : (
          <p
            data-testid="wizard-to-check"
            className="m-0 rounded-[10px] bg-warn-soft px-3.5 py-3 text-sm text-warn-text"
          >
            {t.test.toCheck}{" "}
            <Link
              to="/reservations/a-verifier"
              className="font-semibold underline"
            >
              {t.test.openToCheck}
            </Link>
          </p>
        ))}
    </Block>
  );
}

/**
 * A (14/10/2026, « C puis A »; the four steps of G-B, 07/10/2026, before): « Relier votre boîte mail » on one page.
 * The mail service comes detected by the server (Gmail when Gmail asked to forward to Plazo, else the domain or MX of
 * the manager's address) or picked; its settings are blocks, each with the button that opens the right page, ticked
 * by what Plazo sees: Gmail's code, a comparator's email that came by itself, a booking. « Ce que Plazo voit » shows
 * it live, with the last emails and the alert when a too-wide rule sends every email on.
 */
export function InboundSetupWizard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  // undefined: not chosen yet (the detected service, once known); null: « Changer » asked to pick again.
  const [picked, setPicked] = useState<MailProvider | null | undefined>(
    undefined,
  );
  const [openedAt] = useState(() => Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settings = useQuery({
    queryKey: ["inbound-settings"],
    queryFn: adminApi.getInboundSettings,
    refetchInterval: POLL_MS,
  });
  const enable = useMutation({
    mutationFn: () => adminApi.enableInboundAddress(false),
    // A settings read still in flight (the wizard's mount refetch, a poll) would land after the POST and put
    // `address: null` back: drop it, the POST's answer is the fresher one.
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: ["inbound-settings"] }),
    onSuccess: (data) => queryClient.setQueryData(["inbound-settings"], data),
    onError: (err: Error) => toast.error(describeError(err)),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => headingRef.current?.focus(), []);

  const s = settings.data;
  const address = s?.address ?? null;
  // Every operator has its address from the start (08/10/2026); one created before gets it here, without a button.
  const {
    mutate: enableNow,
    isPending: enabling,
    isError: enableFailed,
  } = enable;
  const enableAsked = useRef(false);
  useEffect(() => {
    if (
      s?.available &&
      !s.address &&
      !enabling &&
      !enableFailed &&
      !enableAsked.current
    ) {
      enableAsked.current = true;
      enableNow();
    }
  }, [s?.available, s?.address, enabling, enableFailed, enableNow]);

  const detected = s?.mailProvider ?? null;
  const provider: MailProvider | null =
    picked === undefined ? (detected?.id ?? null) : picked;
  const sender = senderFor(
    provider,
    (s?.senders ?? []).map((x) => x.address),
  );
  const progress = s?.progress ?? {
    confirmationAt: null,
    comparatorMailAt: null,
    comparator: null,
    bookingAt: null,
  };
  const confirmed = Boolean(progress.confirmationAt ?? s?.forwarding);
  const ruled = Boolean(progress.comparatorMailAt);
  const booked = Boolean(progress.bookingAt);
  // The blocks in order; the first not seen done is the current one.
  const seen =
    provider === "gmail" ? [confirmed, ruled, booked] : [ruled, booked];
  const current = seen.indexOf(false);
  const stateOf = (i: number): BlockState =>
    seen[i] ? "done" : i === current ? "current" : "later";
  const business = detected?.id === provider ? detected.business : null;

  let body: ReactNode;
  if (settings.isError) {
    body = (
      <p className="text-sm text-destructive">
        {describeError(settings.error)}
      </p>
    );
  } else if (!s) {
    body = <Skeleton className="h-40 w-full" />;
  } else if (!s.available) {
    body = (
      <p className="rounded-lg bg-panel-2 p-3 text-sm text-muted-foreground">
        {inboundFr.unavailable}
      </p>
    );
  } else if (!address) {
    body = (
      <p
        data-testid="wizard-preparing"
        className={cn(
          "m-0 text-sm",
          enable.isError ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {enable.isError ? describeError(enable.error) : t.preparing}
      </p>
    );
  } else {
    const unexpected = s.unexpected?.count ?? 0;
    const blocks: ReactNode =
      provider === "gmail" ? (
        <>
          <Block
            n={1}
            state={stateOf(0)}
            title={t.gmail.add.title}
            testId="wizard-gmail-add"
          >
            <div className="flex flex-wrap gap-2">
              <OpenLink
                href={LINKS.gmailForwarding}
                label={t.open.gmailForwarding}
                testId="open-gmail-forwarding"
              />
            </div>
            <Lines
              lines={t.gmail.add.lines}
              sender={sender}
              address={address}
            />
            <div
              data-testid="gmail-code"
              className="rounded-xl bg-panel-2 p-3.5"
              aria-live="polite"
            >
              {s.forwarding ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-muted-foreground">
                      {t.gmail.add.received(when(s.forwarding.receivedAt))}
                    </span>
                    {s.forwarding.code ? (
                      <span className="font-mono text-2xl font-semibold tracking-wider">
                        {s.forwarding.code.replace(/(\d{3})(?=\d)/g, "$1 ")}
                      </span>
                    ) : (
                      <span className="text-sm">{t.gmail.add.linkOnly}</span>
                    )}
                    {s.forwarding.requester && (
                      <span className="text-xs text-muted-foreground">
                        {t.gmail.add.requester(s.forwarding.requester)}
                      </span>
                    )}
                  </div>
                  {s.forwarding.code && (
                    <button
                      type="button"
                      onClick={() => copyText(s.forwarding!.code!)}
                      className="h-10 rounded-[10px] border border-panel-line bg-white px-3 text-sm font-medium hover:bg-panel-2"
                    >
                      {t.gmail.add.copyCode}
                    </button>
                  )}
                  {s.forwarding.link && (
                    <a
                      data-testid="gmail-link"
                      href={s.forwarding.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center rounded-[10px] bg-primary px-3 text-sm font-semibold text-primary-foreground hover:brightness-105"
                    >
                      {t.gmail.add.openLink}
                    </a>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LiveDot />
                  {t.gmail.add.waiting}
                </span>
              )}
            </div>
            {business !== false && (
              <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
                {t.gmail.add.workspace}
              </p>
            )}
          </Block>
          <Block
            n={2}
            state={stateOf(1)}
            title={t.gmail.filter.title}
            testId="wizard-gmail-filter"
          >
            <div className="flex flex-wrap gap-2">
              <OpenLink
                href={LINKS.gmailFilters}
                label={t.open.gmailFilters}
                testId="open-gmail-filters"
              />
            </div>
            <Lines
              lines={t.gmail.filter.lines}
              sender={sender}
              address={address}
            />
            <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
              {rich(t.gmail.filter.keepOff)}
            </p>
            <p className="m-0 rounded-[10px] bg-panel-2 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
              {t.gmail.filter.note}
            </p>
          </Block>
          <TestBlock
            n={3}
            state={stateOf(2)}
            s={s}
            address={address}
            openedAt={openedAt}
          />
        </>
      ) : provider ? (
        <>
          <Block
            n={1}
            state={stateOf(0)}
            title={t.rule[provider].title}
            testId={`wizard-rule-${provider}`}
          >
            {provider === "outlook" && (
              <div className="flex flex-wrap gap-2">
                {business !== true && (
                  <OpenLink
                    href={LINKS.outlook}
                    label={t.open.outlook}
                    testId="open-outlook"
                  />
                )}
                {business !== false && (
                  <OpenLink
                    href={LINKS.outlookWork}
                    label={t.open.outlookWork}
                    testId="open-outlook-work"
                  />
                )}
              </div>
            )}
            <Lines
              lines={t.rule[provider].lines}
              sender={sender}
              address={address}
            />
            <p className="m-0 rounded-[10px] bg-panel-2 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
              {t.rule[provider].note}
            </p>
          </Block>
          <TestBlock
            n={2}
            state={stateOf(1)}
            s={s}
            address={address}
            openedAt={openedAt}
          />
        </>
      ) : (
        <fieldset className="m-0 grid grid-cols-1 gap-2 border-0 p-0 sm:grid-cols-2">
          <legend className="mb-3 text-base font-semibold">
            {t.choose.title}
          </legend>
          {PROVIDERS.map((p) => (
            <label
              key={p}
              data-testid={`provider-${p}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-panel-line p-3.5 hover:bg-panel-2"
            >
              <input
                type="radio"
                name="mail-provider"
                checked={false}
                onChange={() => setPicked(p)}
                className="h-5 w-5 accent-[#1E5E2E]"
              />
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">
                  {t.providers[p].label}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {t.providers[p].hint}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      );
    body = (
      <div className="flex flex-wrap">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.addressLabel}
            </span>
            <CopyField value={address} accent testId="wizard-address" />
          </div>
          {provider && (
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              {t.lead[provider]}
            </p>
          )}
          {blocks}
        </div>
        <aside
          className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 border-t border-panel-line bg-[#FAFBF9] p-6 lg:max-w-[400px] lg:border-l lg:border-t-0"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 font-narrow text-xl font-bold">
              {t.seen.title}
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-lime-deep">
              <LiveDot />
              {t.seen.live}
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {provider === "gmail" && (
              <Seen
                testId="seen-confirmation"
                state={confirmed ? "done" : "current"}
                title={t.seen.confirmation}
                detail={
                  progress.confirmationAt
                    ? t.seen.confirmationAt(when(progress.confirmationAt))
                    : t.gmail.add.waiting
                }
              />
            )}
            <Seen
              testId="seen-comparator"
              state={
                ruled
                  ? "done"
                  : provider !== "gmail" || confirmed
                    ? "current"
                    : "later"
              }
              title={t.seen.comparator}
              detail={
                progress.comparatorMailAt
                  ? t.seen.comparatorAt(
                      progress.comparator ?? "",
                      when(progress.comparatorMailAt),
                    )
                  : t.seen.comparatorWaiting
              }
            />
            <Seen
              testId="seen-booking"
              state={booked ? "done" : ruled ? "current" : "later"}
              title={t.seen.booking}
              detail={
                progress.bookingAt
                  ? t.seen.bookingAt(when(progress.bookingAt))
                  : t.seen.bookingWaiting
              }
            />
          </ul>
          {unexpected > 0 && (
            <div
              data-testid="wizard-unexpected"
              className="flex flex-col gap-1 rounded-[10px] bg-warn-soft px-3.5 py-3 text-warn-text"
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                {inboundFr.unexpected.title}
              </span>
              <span className="text-[13px] leading-relaxed">
                {inboundFr.unexpected.text(unexpected)}
              </span>
              <span className="text-[13px] font-semibold">
                {provider === "gmail" ? t.unexpected.gmail : t.unexpected.other}
              </span>
              {provider === "gmail" && (
                <a
                  href={LINKS.gmailForwarding}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-bold text-warn-text underline"
                >
                  {t.open.gmailForwarding}
                </a>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1 border-t border-panel-line pt-3.5">
            <h4 className="m-0 text-sm font-semibold">{t.seen.recent}</h4>
            {s.recent.length ? (
              <ul className="m-0 list-none p-0">
                {s.recent.map((email) => (
                  <RecentRow key={email.id} email={email} />
                ))}
              </ul>
            ) : (
              <p className="m-0 py-2 text-sm text-muted-foreground">
                {t.seen.none}
              </p>
            )}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbound-wizard-title"
        data-testid="inbound-wizard"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[1120px] flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-line px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              ref={headingRef}
              tabIndex={-1}
              id="inbound-wizard-title"
              className="m-0 text-xl font-semibold outline-none"
            >
              {t.title}
            </h2>
            {provider && (
              <span
                data-testid="wizard-provider"
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-[#F3FBE6] px-3 py-1.5 text-[13px] font-semibold text-lime-deep"
              >
                <Check
                  className="h-3.5 w-3.5"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {detected && detected.id === provider && picked === undefined
                  ? t.detected(t.providers[provider].label, detected.email)
                  : t.providers[provider].label}
              </span>
            )}
            {provider && (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="min-h-10 text-[13px] font-semibold text-lime-deep underline-offset-4 hover:underline"
              >
                {t.change}
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label={t.close}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-panel-line hover:bg-panel-2"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        {body}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-panel-line px-6 py-4">
          {address ? (
            <a
              data-testid="wizard-share"
              href={shareHref(provider ?? "other", address, sender)}
              className="text-sm font-semibold text-lime-deep underline underline-offset-2"
            >
              {t.share.link}
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-[10px] border border-panel-line bg-white px-[18px] text-sm font-medium hover:bg-panel-2"
            >
              {t.later}
            </button>
            {provider && (
              <button
                type="button"
                data-testid="wizard-done"
                onClick={onClose}
                className="h-11 rounded-[10px] bg-primary px-[18px] text-sm font-semibold text-primary-foreground hover:brightness-105"
              >
                {t.done[provider]}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
