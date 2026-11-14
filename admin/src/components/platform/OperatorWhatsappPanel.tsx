import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { PlatformWhatsappNumber, WhatsappNumber } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.operatorPage.whatsapp;
const card = "rounded-[14px] border border-border bg-card";
const input = "min-h-11 rounded-lg border border-border bg-background px-3 text-base";
const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

function Pill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "ok" && "bg-ok-soft text-ok-text",
        tone === "warn" && "bg-warn-soft text-warn-text",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * 14/11/2026 (« Un compte WhatsApp Business par parking », chemin 1, maquettes
 * https://claude.ai/artifact/Je3eFB8AcgzoAocy9q2xz4): Plateforme › Loueurs › X › WhatsApp. The platform adds the parking's
 * number to Benford Tech's account (display name « Plazo »), has Meta send the code, types it, and follows Meta's review.
 */
export function OperatorWhatsappPanel({ operatorId }: { operatorId: string }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const key = ["platform", "whatsapp-number", operatorId];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getPlatformWhatsappNumber(operatorId) });
  const [phone, setPhone] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [code, setCode] = useState("");

  const act = useMutation({
    mutationFn: ({ action, body }: { action: Parameters<typeof adminApi.platformWhatsappNumber>[1]; body?: Record<string, string> }) =>
      adminApi.platformWhatsappNumber(operatorId, action, body),
    onSuccess: (data) => {
      queryClient.setQueryData<PlatformWhatsappNumber>(key, (old) =>
        old ? { ...old, number: "removed" in data ? null : (data as WhatsappNumber) } : old,
      );
      queryClient.invalidateQueries({ queryKey: ["platform", "overview"] });
      setCode("");
      toast.success(t.saved);
    },
    onError: (error) => toast.error(describeError(error)),
  });

  if (!query.data) return null;
  const { number, displayName, available } = query.data;
  const busy = act.isPending;
  const withNumber = number && number.status !== "requested" && number.phone;
  const waitingCode = number?.status === "added" || number?.status === "code_sent";
  const verified = number?.status === "registered" || number?.status === "active" || number?.status === "paused";
  const nameOk = number?.nameStatus === "APPROVED" || number?.nameStatus === "AVAILABLE_WITHOUT_REVIEW";

  return (
    <div className="flex flex-col gap-4 lg:flex-row" data-testid="operator-whatsapp">
      <section className={cn(card, "flex min-w-0 flex-1 flex-col gap-5 p-5")}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro(displayName)}</p>
          {number?.requestedAt && <p className="text-sm font-medium text-warn-text">{t.requested(dateTime.format(new Date(number.requestedAt)))}</p>}
        </div>
        {!available && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{t.unavailable}</p>}

        {!withNumber && available && (
          <>
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                act.mutate({ action: "add", body: { phone } });
              }}
            >
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.phone}
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" className={cn(input, "font-mono")} />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.displayName}
                <input value={displayName} readOnly className={cn(input, "bg-muted text-muted-foreground")} />
              </label>
              <button type="submit" disabled={busy || !phone.trim()} className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? t.adding : t.add}
              </button>
            </form>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-lime-deep">{t.orLink}</summary>
              <form
                className="mt-3 flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  act.mutate({ action: "link", body: { phoneNumberId } });
                }}
              >
                <label className="flex flex-col gap-1 font-medium">
                  {t.phoneNumberId}
                  <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} inputMode="numeric" className={cn(input, "font-mono")} />
                </label>
                <button type="submit" disabled={busy || !phoneNumberId.trim()} className="min-h-11 rounded-full border border-border px-5 font-semibold disabled:opacity-50">
                  {t.link}
                </button>
              </form>
            </details>
          </>
        )}

        {withNumber && (
          <p className="text-base font-semibold">
            <span className="font-mono">{number.phone}</span> · {displayName}
          </p>
        )}

        {withNumber && waitingCode && (
          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="font-semibold">{t.codeTitle}</p>
            <p className="text-sm text-muted-foreground">
              {t.codeText}
              {number.codeSentAt && ` ${t.codeSent(dateTime.format(new Date(number.codeSentAt)))}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => act.mutate({ action: "code", body: { method: "SMS" } })} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
                {t.sendSms}
              </button>
              <button type="button" disabled={busy} onClick={() => act.mutate({ action: "code", body: { method: "VOICE" } })} className="min-h-11 rounded-full px-3 text-sm font-medium text-lime-deep disabled:opacity-50">
                {t.sendVoice}
              </button>
            </div>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                act.mutate({ action: "verify", body: { code } });
              }}
            >
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.code}
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={cn(input, "w-40 font-mono tracking-[0.3em]")} />
              </label>
              <button type="submit" disabled={busy || code.replace(/\D/g, "").length !== 6} className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {t.verify}
              </button>
            </form>
          </div>
        )}

        {withNumber && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {verified && (
              <button type="button" disabled={busy} onClick={() => act.mutate({ action: "check" })} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
                {t.check}
              </button>
            )}
            {number.status === "active" && (
              <button type="button" disabled={busy} onClick={() => act.mutate({ action: "pause" })} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
                {t.pause}
              </button>
            )}
            {number.status === "paused" && (
              <button type="button" disabled={busy} onClick={() => act.mutate({ action: "resume" })} className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {t.resume}
              </button>
            )}
            <span className="flex-1" />
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await confirm(t.removeConfirm, { title: t.remove, confirmLabel: t.remove, destructive: true }))
                  act.mutate({ action: "remove" });
              }}
              className="min-h-11 px-2 text-sm font-medium text-destructive disabled:opacity-50"
            >
              {t.remove}
            </button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{t.rules}</p>
      </section>

      <aside className={cn(card, "flex flex-col gap-3 p-5 lg:w-80")}>
        <h3 className="font-semibold">{t.meta}</h3>
        <ul className="flex flex-col gap-2.5 text-sm">
          <li className="flex items-center justify-between gap-2">
            {t.rows.added}
            {withNumber ? <Pill tone="ok">{t.done}</Pill> : <Pill tone="muted">{t.notYet}</Pill>}
          </li>
          <li className="flex items-center justify-between gap-2">
            {t.rows.code}
            {verified ? <Pill tone="ok">{t.done}</Pill> : waitingCode ? <Pill tone="warn">{t.waiting}</Pill> : <Pill tone="muted">{t.notYet}</Pill>}
          </li>
          <li className="flex items-center justify-between gap-2">
            {t.rows.name}
            {nameOk ? <Pill tone="ok">{t.done}</Pill> : verified ? <Pill tone="warn">{number?.nameStatus ?? t.waiting}</Pill> : <Pill tone="muted">{t.notYet}</Pill>}
          </li>
          <li className="flex items-center justify-between gap-2">
            {t.rows.sending}
            {number?.status === "active" ? <Pill tone="ok">{t.done}</Pill> : number?.status === "paused" ? <Pill tone="warn">{t.paused}</Pill> : <Pill tone="muted">{t.notYet}</Pill>}
          </li>
          {number?.quality && (
            <li className="flex items-center justify-between gap-2">
              {t.quality}
              <span className="font-mono text-xs">{number.quality}</span>
            </li>
          )}
        </ul>
        {number?.lastError && <p className="text-sm text-destructive">{t.lastError(number.lastError)}</p>}
      </aside>
    </div>
  );
}
