import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { timeOf } from "@/lib/datetime";
import { describeError, inboundFr, inboundWizardFr as t, type MailProvider, type PreviewRow, type WizardLine } from "@/lib/fr";
import type { InboundEmailStatus, InboundRecent } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDERS: MailProvider[] = ["gmail", "outlook", "ovh", "other"];
/** Emails that prove the forwarding works (anything but Gmail's code). */
const BOOKING: InboundEmailStatus[] = ["imported", "duplicate", "incomplete", "unrecognised"];
const TONE: Record<InboundEmailStatus, BadgeTone> = { imported: "ok", duplicate: "line", incomplete: "warn", unrecognised: "bad", dismissed: "line", forwarding: "info" };
/** The Gmail code and the first email show up while the wizard is open. */
const POLL_MS = 5000;
/** A booking email this recent counts as the check, even if it came just before the wizard was opened. */
const FRESH_MS = 30 * 60_000;
const HIGHLIGHT = "border-2 border-primary bg-white shadow-[0_0_0_4px_rgba(163,230,53,0.25)]";

/** "Cliquez **Créer un filtre**" → bold words. */
function rich(text: string): ReactNode {
  return text.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

const plain = (text: string) => text.replace(/\*\*/g, "");

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

function CopyField({ value, accent, testId }: { value: string; accent?: boolean; testId: string }) {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-2">
      <code data-testid={testId} className={cn("break-all rounded-[10px] border px-3 py-2 font-mono text-sm", accent ? "border-lime-deep bg-accent" : "border-panel-line bg-panel-2")}>
        {value}
      </code>
      <button type="button" onClick={() => copyText(value)} className="h-9 rounded-[10px] border border-panel-line bg-white px-3 text-[13px] font-medium hover:bg-panel-2">
        {t.copy}
      </button>
    </span>
  );
}

function Lines({ lines, sender, address }: { lines: WizardLine[]; sender: string; address: string }) {
  return (
    <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed">
      {lines.map(line => (
        <li key={line.text}>
          {rich(line.text)}
          {line.copy && <CopyField value={line.copy === "sender" ? sender : address} accent={line.copy === "address"} testId={`copy-${line.copy}`} />}
        </li>
      ))}
    </ol>
  );
}

/** The simplified screen of the mail provider, the fields to fill highlighted in lime (G-B). */
function Preview({ rows, screen, sender, address }: { rows: PreviewRow[]; screen: string; sender: string; address: string }) {
  const valueOf = (value?: string) => (value === "sender" ? sender : value === "address" ? address : value);
  return (
    <figure className="m-0 flex min-w-0 flex-[1_1_340px] flex-col gap-2">
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.preview(screen)}</figcaption>
      <div aria-hidden="true" className="flex flex-col gap-2.5 rounded-xl border border-gray-300 bg-[#FAFAFA] p-4 text-[13px]">
        {rows.map(row =>
          row.kind === "field" ? (
            <div key={row.label} className="grid grid-cols-[minmax(90px,140px)_1fr] items-center gap-2">
              <span className={row.highlight ? "text-gray-600" : "text-gray-400"}>{row.label}</span>
              {row.value ? (
                <span className={cn("truncate rounded-md px-2 py-1.5 font-mono", row.highlight ? HIGHLIGHT : "border border-gray-200 bg-white")}>{valueOf(row.value)}</span>
              ) : (
                <span className="h-[22px] border-b border-gray-200" />
              )}
            </div>
          ) : row.kind === "check" ? (
            <span key={row.label} className={cn("flex flex-wrap items-center gap-2 rounded-md", row.highlight ? cn(HIGHLIGHT, "px-2 py-1.5") : "text-gray-400")}>
              <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-[3px]", row.checked ? "bg-lime-deep" : "border-[1.5px] border-gray-300")}>
                {row.checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
              </span>
              {row.label}
              {row.value && <span className="font-mono">{valueOf(row.value)}</span>}
            </span>
          ) : (
            <div key={row.label} className="flex justify-end">
              <span className="rounded-md bg-lime-deep px-3 py-1.5 font-semibold text-white">{row.label}</span>
            </div>
          ),
        )}
      </div>
    </figure>
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

function RecentRow({ email }: { email: InboundRecent }) {
  return (
    <li data-testid="wizard-recent" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-panel-line py-2 last:border-b-0">
      <span className="font-mono text-xs text-muted-foreground">{timeOf(email.receivedAt)}</span>
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold">{email.fromName ?? email.fromAddress ?? "—"}</span>
        {email.subject && <span className="text-muted-foreground"> · {email.subject}</span>}
      </span>
      <Badge tone={TONE[email.status]}>{t.check.status[email.status]}</Badge>
    </li>
  );
}

/** The email to whoever runs the mailbox: the rule, then the provider's steps in plain text. */
function shareHref(provider: MailProvider, address: string, sender: string): string {
  const forward = t.forward[provider];
  const steps =
    provider === "gmail"
      ? [plain(t.mail.gmail.lines[0].text), plain(t.mail.gmail.lines[1].text), t.share.gmailCode, ...forward.lines.map(l => plain(l.text))]
      : forward.lines.map(l => plain(l.text));
  const body = [t.share.intro, "", t.share.sender(sender), t.share.address(address), "", `${forward.title} :`, ...steps.map((step, i) => `${i + 1}. ${step}`), "", t.share.outro].join("\n");
  return `mailto:?subject=${encodeURIComponent(t.share.subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * G-B (07/10/2026): « Relier votre boîte mail », four steps over the Parking settings — the Plazo address,
 * the mail provider (with Gmail's confirmation code shown as soon as it arrives), the forwarding rule on a
 * simplified screen of that provider, and the check: the first email, live.
 */
export function InboundSetupWizard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<MailProvider | null>(null);
  const [openedAt] = useState(() => Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settings = useQuery({ queryKey: ["inbound-settings"], queryFn: adminApi.getInboundSettings, refetchInterval: POLL_MS });
  const enable = useMutation({
    mutationFn: () => adminApi.enableInboundAddress(false),
    onSuccess: data => queryClient.setQueryData(["inbound-settings"], data),
    onError: (err: Error) => toast.error(describeError(err)),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Screen readers hear each step's title as it opens.
  useEffect(() => headingRef.current?.focus(), [step]);

  const s = settings.data;
  const address = s?.address ?? null;
  // Every operator has its address from the start (08/10/2026); one created before gets it here, without a button.
  const { mutate: enableNow, isPending: enabling, isError: enableFailed } = enable;
  useEffect(() => {
    if (s?.available && !s.address && !enabling && !enableFailed) enableNow();
  }, [s?.available, s?.address, enabling, enableFailed, enableNow]);
  const sender = senderFor(provider, (s?.senders ?? []).map(x => x.address));
  const labels = t.steps.map((label, i) => (i === 1 && provider ? t.stepMail(t.mail.providers[provider].label) : label));
  const canNext = step === 0 ? Boolean(address) : step === 1 ? provider !== null : true;
  const fresh = s?.recent.find(r => BOOKING.includes(r.status) && Date.parse(r.receivedAt) >= openedAt - FRESH_MS) ?? null;
  const next = () => (step === 3 ? onClose() : setStep(step + 1));
  const heading = (text: string) => (
    <h3 ref={headingRef} tabIndex={-1} className="m-0 text-lg font-semibold outline-none">
      {text}
    </h3>
  );

  let body: ReactNode;
  if (settings.isError) {
    body = <p className="text-sm text-destructive">{describeError(settings.error)}</p>;
  } else if (!s) {
    body = <Skeleton className="h-40 w-full" />;
  } else if (!s.available) {
    body = <p className="rounded-lg bg-panel-2 p-3 text-sm text-muted-foreground">{inboundFr.unavailable}</p>;
  } else if (step === 0) {
    body = (
      <div className="flex max-w-xl flex-col gap-3">
        {heading(t.address.title)}
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{t.address.intro}</p>
        {address ? (
          <CopyField value={address} accent testId="wizard-address" />
        ) : enable.isError ? (
          <p data-testid="wizard-preparing" className="m-0 text-sm text-destructive">
            {describeError(enable.error)}
          </p>
        ) : (
          <p data-testid="wizard-preparing" className="m-0 text-sm text-muted-foreground">
            {t.address.preparing}
          </p>
        )}
      </div>
    );
  } else if (step === 1) {
    const code = s.forwarding;
    body = (
      <div className="flex flex-col gap-4">
        {heading(t.mail.title)}
        <fieldset className="m-0 grid grid-cols-1 gap-2 border-0 p-0 sm:grid-cols-2">
          <legend className="sr-only">{t.mail.legend}</legend>
          {PROVIDERS.map(p => (
            <label
              key={p}
              data-testid={`provider-${p}`}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5", provider === p ? "border-2 border-primary bg-[#F3FBE6] p-[13px]" : "border-panel-line hover:bg-panel-2")}
            >
              <input type="radio" name="mail-provider" checked={provider === p} onChange={() => setProvider(p)} className="h-5 w-5 accent-[#1E5E2E]" />
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{t.mail.providers[p].label}</span>
                <span className="text-[13px] text-muted-foreground">{t.mail.providers[p].hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {provider === "gmail" ? (
          <div className="flex flex-col gap-3 rounded-xl border border-panel-line p-4">
            <p className="m-0 text-[15px] font-semibold">{t.mail.gmail.title}</p>
            <Lines lines={t.mail.gmail.lines} sender={sender} address={address ?? ""} />
            <div data-testid="gmail-code" className="rounded-xl bg-panel-2 p-3.5" aria-live="polite">
              {code ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-muted-foreground">{t.mail.gmail.received(timeOf(code.receivedAt))}</span>
                    <span className="font-mono text-2xl font-semibold tracking-wider">{code.code.replace(/(\d{3})(?=\d)/g, "$1 ")}</span>
                    {code.requester && <span className="text-xs text-muted-foreground">{t.mail.gmail.requester(code.requester)}</span>}
                  </div>
                  <button type="button" onClick={() => copyText(code.code)} className="h-10 rounded-[10px] border border-panel-line bg-white px-3 text-sm font-medium hover:bg-panel-2">
                    {t.mail.gmail.copyCode}
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LiveDot />
                  {t.mail.gmail.waiting}
                </span>
              )}
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">{t.mail.gmail.keepOff}</p>
          </div>
        ) : provider ? (
          <p className="m-0 rounded-lg bg-panel-2 px-3.5 py-3 text-[13px] text-muted-foreground">{t.mail.noAuth}</p>
        ) : null}
      </div>
    );
  } else if (step === 2 && provider) {
    const f = t.forward[provider];
    body = (
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
          {heading(f.title)}
          <Lines lines={f.lines} sender={sender} address={address ?? ""} />
          <p className="m-0 rounded-[10px] bg-panel-2 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">{f.note}</p>
        </div>
        <Preview rows={f.preview} screen={f.screen} sender={sender} address={address ?? ""} />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
          {heading(t.check.title)}
          <Lines lines={t.check.lines} sender={sender} address={address ?? ""} />
          {fresh &&
            (fresh.status === "imported" || fresh.status === "duplicate" ? (
              <p data-testid="wizard-ok" className="m-0 rounded-[10px] bg-ok-soft px-3.5 py-3 text-sm font-semibold text-ok-text">
                {t.check.ok}
              </p>
            ) : (
              <p data-testid="wizard-to-check" className="m-0 rounded-[10px] bg-warn-soft px-3.5 py-3 text-sm text-warn-text">
                {t.check.toCheck}{" "}
                <Link to="/reservations/a-verifier" className="font-semibold underline">
                  {t.check.openToCheck}
                </Link>
              </p>
            ))}
        </div>
        <section className="flex min-w-0 flex-[1_1_340px] flex-col gap-2 rounded-xl border border-panel-line p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <h4 className="m-0 text-sm font-semibold">{t.check.received}</h4>
            <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-lime-deep">
              <LiveDot />
              {t.check.live}
            </span>
          </div>
          {s.recent.length ? (
            <ul className="m-0 list-none p-0">
              {s.recent.map(email => (
                <RecentRow key={email.id} email={email} />
              ))}
            </ul>
          ) : (
            <div className="py-4 text-sm">
              <p className="m-0 font-semibold">{t.check.waiting}</p>
              <p className="m-0 text-muted-foreground">{t.check.waitingHint}</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-12" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbound-wizard-title"
        data-testid="inbound-wizard"
        onClick={e => e.stopPropagation()}
        className="flex w-full max-w-[860px] flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl"
      >
        <div className="flex flex-col gap-4 border-b border-panel-line px-6 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="inbound-wizard-title" className="m-0 text-xl font-semibold">
              {t.title}
            </h2>
            <button type="button" aria-label={t.close} onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-panel-line hover:bg-panel-2">
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
          <ol aria-label={t.progress} className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[13px]">
            {labels.map((label, i) => (
              <Fragment key={label}>
                {i > 0 && <li aria-hidden="true" className={cn("hidden h-0.5 w-7 sm:block", i <= step ? "bg-lime-deep" : "bg-panel-line")} />}
                <li aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2", i < step ? "font-semibold text-lime-deep" : i === step ? "font-bold" : "text-muted-foreground")}>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      i < step ? "bg-lime-deep" : i === step ? "bg-primary text-primary-foreground" : "border-2 border-gray-300 font-semibold",
                    )}
                  >
                    {i < step ? <Check className="h-3 w-3 text-white" strokeWidth={3.5} aria-hidden="true" /> : i + 1}
                  </span>
                  {label}
                </li>
              </Fragment>
            ))}
          </ol>
        </div>
        <div className="p-6">{body}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-panel-line px-6 py-4">
          {address && step > 0 ? (
            <a data-testid="wizard-share" href={shareHref(provider ?? "other", address, sender)} className="text-sm font-semibold text-lime-deep underline underline-offset-2">
              {t.share.link}
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="h-11 rounded-[10px] border border-panel-line bg-white px-[18px] text-sm font-medium hover:bg-panel-2">
                {t.back}
              </button>
            )}
            <button
              type="button"
              data-testid="wizard-next"
              disabled={!canNext}
              onClick={next}
              className="flex h-11 items-center gap-1.5 rounded-[10px] bg-primary px-[18px] text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
            >
              {step === 2 && provider ? t.forward[provider].done : step === 3 ? t.finish : t.next}
              {step < 3 && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
