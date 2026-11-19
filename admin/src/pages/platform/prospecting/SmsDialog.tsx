import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { ApiError, adminApi } from "@/lib/api";
import { dateTime, describeError, fr } from "@/lib/fr";
import {
  DEFAULT_PROSPECT_SMS,
  PROSPECT_SMS_MAX_LENGTH,
  PROSPECT_SMS_MAX_SEGMENTS,
  renderText,
  unknownVariables,
  valuesOf,
  VARIABLES,
} from "@/lib/prospecting";
import { smsLength } from "@/lib/sms";
import type { Prospect, ProspectSmsResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";

const t = fr.platform.prospecting.sms;
const TONE: Record<string, string> = {
  sent: "bg-ok-soft text-ok-text",
  ready: "bg-ok-soft text-ok-text",
  failed: "bg-bad-soft text-bad-text",
  skipped: "bg-panel-2 text-muted-foreground",
};

/** The text once typing stops: the dry run waits 400 ms after the last key. */
function useSettled(value: string, ms = 400): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return settled;
}

const errorText = (error: unknown): string => {
  if (error instanceof ApiError && error.fields?.text) return t.errors.text[error.fields.text as keyof typeof t.errors.text] ?? describeError(error);
  return describeError(error, t.errors as unknown as Record<string, string>);
};

/**
 * « Envoyer un SMS à N prospects » (19/11/2026, choix C): one text for the prospects of the filters, each with its own
 * variables. The API says who will get it (dry run) before anything leaves.
 */
export function SmsDialog({
  prospects,
  today,
  window: sendingWindow,
  onClose,
}: {
  prospects: Prospect[];
  today?: { sent: number; cap: number; configured: boolean };
  window?: { open: boolean; nextOpening: string };
  onClose: () => void;
}) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [text, setText] = useState(DEFAULT_PROSPECT_SMS);
  const [result, setResult] = useState<ProspectSmsResult | null>(null);
  const settled = useSettled(text);
  const ids = useMemo(() => prospects.map((p) => p.id), [prospects]);
  const byId = useMemo(() => new Map(prospects.map((p) => [p.id, p])), [prospects]);
  const unknown = unknownVariables(text);
  const textOk = !!text.trim() && text.length <= PROSPECT_SMS_MAX_LENGTH && !unknown.length;

  const check = useQuery({
    queryKey: ["platform", "prospects", "sms-check", ids, settled],
    queryFn: () => adminApi.sendProspectsSms(ids, settled, true),
    enabled: ids.length > 0 && !!settled.trim() && !unknownVariables(settled).length && settled.length <= PROSPECT_SMS_MAX_LENGTH,
  });
  const ready = (check.data?.results ?? []).filter((r) => r.outcome === "ready").map((r) => r.id);
  const skipped = (check.data?.results ?? []).filter((r) => r.outcome === "skipped");
  const first = ready.length ? byId.get(ready[0]) : prospects[0];
  const preview = first ? renderText(text, valuesOf(first)) : text;
  const length = smsLength(preview);
  const tooLong = length.segments > PROSPECT_SMS_MAX_SEGMENTS;

  const test = useMutation({
    mutationFn: () => adminApi.sendProspectSmsTest(text, first?.id ?? null),
    onSuccess: (r) => toast.success(t.testSent(r.sentTo)),
    onError: (e) => toast.error(errorText(e)),
  });
  const send = useMutation({
    mutationFn: () => adminApi.sendProspectsSms(ready, text),
    onSuccess: (r) => {
      setResult(r);
      toast.success(t.done(r.counts.sent, r.counts.failed));
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (result) {
    return (
      <Modal title={t.title(ids.length)} onClose={onClose} wide>
        <h3 className="text-sm font-semibold">{t.results}</h3>
        <ul className="max-h-[50vh] divide-y divide-panel-line overflow-y-auto rounded-[12px] border border-panel-line" data-testid="sms-results">
          {result.results.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">{byId.get(r.id)?.companyName ?? r.id}</span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[r.outcome])}>
                {t.outcomes[r.outcome]}
                {r.reason ? ` · ${t.reasons[r.reason] ?? r.reason}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button onClick={onClose}>{t.close}</Button>
        </div>
      </Modal>
    );
  }

  const blocked = today && !today.configured ? t.unavailable : sendingWindow && !sendingWindow.open ? t.closedWindow(dateTime.format(new Date(sendingWindow.nextOpening))) : null;
  return (
    <Modal title={t.title(ids.length)} onClose={onClose} wide>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-2">
          <label htmlFor="prospect-sms-text" className="text-sm font-semibold">
            {t.textLabel}
          </label>
          <textarea
            id="prospect-sms-text"
            value={text}
            maxLength={PROSPECT_SMS_MAX_LENGTH}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full rounded-[10px] border border-panel-line bg-white px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{t.variables}</span>
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setText((s) => `${s}${s.endsWith(" ") || !s ? "" : " "}${v}`)}
                className="min-h-8 rounded-md bg-panel-2 px-2 font-mono"
              >
                {v}
              </button>
            ))}
          </div>
          <p className={cn("text-xs", tooLong ? "font-semibold text-bad-text" : "text-muted-foreground")} data-testid="sms-count">
            {tooLong ? t.tooLong : t.count(length.segments, length.characters)}
          </p>
          {unknown.length > 0 && <p className="text-xs font-semibold text-bad-text">{t.errors.text.unknown_variable}</p>}
          <p className="text-xs text-muted-foreground">{t.noReply}</p>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {t.previewFor(first?.companyName ?? "")}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">Plazo</p>
          <p className="whitespace-pre-wrap rounded-[16px] rounded-bl-[4px] bg-panel-2 px-3 py-2 text-sm" data-testid="sms-preview">
            {preview}
          </p>
        </div>
      </div>

      <div className="rounded-[12px] border border-panel-line px-3 py-2 text-sm" data-testid="sms-recipients">
        {check.isFetching || (!check.data && check.isLoading && textOk) ? (
          <span className="text-muted-foreground">{t.checking}</span>
        ) : check.data ? (
          <>
            <span className="font-semibold">{t.recipients(ready.length, skipped.length)}</span>
            {skipped.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {skipped.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    {byId.get(r.id)?.companyName ?? r.id} · {t.reasons[r.reason ?? ""] ?? r.reason}
                  </li>
                ))}
                {skipped.length > 8 && <li>…</li>}
              </ul>
            )}
          </>
        ) : check.error ? (
          <span className="text-bad-text">{errorText(check.error)}</span>
        ) : null}
        {today && <p className="mt-1 text-xs text-muted-foreground">{t.today(today.sent, today.cap)}</p>}
      </div>
      {blocked && (
        <p className="rounded-[10px] bg-warn-soft px-3 py-2 text-sm font-semibold text-warn-text" data-testid="sms-blocked">
          {blocked}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t.cancel}
        </Button>
        <Button variant="outline" disabled={!textOk || tooLong || test.isPending} onClick={() => test.mutate()} data-testid="sms-test">
          {t.test}
        </Button>
        <Button
          data-testid="sms-send"
          disabled={!textOk || tooLong || !ready.length || check.isFetching || send.isPending || !!blocked || settled !== text}
          onClick={async () => {
            if (await confirm(t.confirmTitle(ready.length), { title: t.confirmTitle(ready.length), confirmLabel: t.confirmYes })) send.mutate();
          }}
        >
          {t.send(ready.length)}
        </Button>
      </div>
    </Modal>
  );
}
