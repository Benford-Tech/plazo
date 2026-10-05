import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { describeError, errorMessage, fr } from "@/lib/fr";
import type { PlatformAudience, PlatformNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.notifications;
const TITLE_MAX = 50;
const BODY_MAX = 160;
const AUDIENCES: PlatformAudience[] = ["staff", "travellers", "operator"];
const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";
const selectClass = "flex h-11 w-full border border-input bg-background px-3 text-base";

const audienceLabel = (n: PlatformNotification) => (n.audience === "operator" ? `${t.audiences.operator} · ${n.operatorName ?? "—"}` : t.audiences[n.audience]);

/**
 * "Notifications" tab of the platform space (E-A, C-A, 05/10/2026): a push to every operator's
 * staff, to every traveller with a current booking, or to one operator's staff; the real count
 * of phones before sending, an explicit confirmation, and the history below.
 */
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [audience, setAudience] = useState<PlatformAudience>("staff");
  const [operatorId, setOperatorId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const history = useQuery({ queryKey: ["platform", "notifications"], queryFn: adminApi.getPlatformNotifications });
  const operators = useQuery({ queryKey: ["platform", "operators"], queryFn: adminApi.getPlatformOperators, enabled: audience === "operator" });
  const target = audience === "operator" ? operatorId || null : null;
  const reach = useQuery({
    queryKey: ["platform", "notifications", "audience", audience, target],
    queryFn: () => adminApi.getPlatformNotificationAudience(audience, target),
    enabled: audience !== "operator" || !!target,
  });

  const send = useMutation({
    mutationFn: () => adminApi.sendPlatformNotification({ audience, operatorId: target, title: title.trim(), body: body.trim(), url: url.trim() || null }),
    onSuccess: ({ data }) => {
      setConfirming(false);
      setFieldErrors({});
      setTitle("");
      setBody("");
      setUrl("");
      queryClient.setQueryData(["platform", "notifications"], (old: { data: PlatformNotification[] } | undefined) => ({ data: [data, ...(old?.data ?? [])] }));
      toast.success(t.sent(data.recipients));
    },
    onError: (err: Error) => {
      setConfirming(false);
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });

  const devices = reach.data?.devices ?? 0;
  const ready = title.trim().length > 0 && body.trim().length > 0 && (audience !== "operator" || !!target) && reach.isSuccess && devices > 0;

  return (
    <>
      <h1 className="text-[26px] font-bold uppercase tracking-[0.03em]">{t.title}</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{t.intro}</p>
      {reach.data && !reach.data.configured && <p className="border border-destructive/40 p-3 text-destructive">{t.notConfigured}</p>}
      <form
        className="max-w-3xl space-y-4"
        aria-label={t.title}
        onSubmit={e => {
          e.preventDefault();
          if (ready) setConfirming(true);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pn-audience">{t.audience}</Label>
            <select
              id="pn-audience"
              className={selectClass}
              value={audience}
              onChange={e => {
                setAudience(e.target.value as PlatformAudience);
                setOperatorId("");
              }}
            >
              {AUDIENCES.map(a => (
                <option key={a} value={a}>
                  {t.audiences[a]}
                </option>
              ))}
            </select>
            {audience === "travellers" && <p className="text-xs text-muted-foreground">{t.travellersLimit}</p>}
          </div>
          {audience === "operator" && (
            <div className="space-y-1.5">
              <Label htmlFor="pn-operator">{t.operator}</Label>
              <select id="pn-operator" className={selectClass} value={operatorId} onChange={e => setOperatorId(e.target.value)} aria-invalid={!!fieldErrors.operatorId}>
                <option value="">{t.operatorNone}</option>
                {(operators.data?.operators ?? []).map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {fieldErrors.operatorId && <p className="text-sm text-destructive">{errorMessage(fieldErrors.operatorId)}</p>}
            </div>
          )}
        </div>
        <FormField id="pn-title" label={t.titleField} placeholder={t.titlePlaceholder} maxLength={TITLE_MAX} required value={title} onChange={e => setTitle(e.target.value)} error={fieldErrors.title} help={t.charsLeft(TITLE_MAX - title.length)} />
        <div className="space-y-1.5">
          <Label htmlFor="pn-body">{t.body}</Label>
          <textarea
            id="pn-body"
            className="flex min-h-24 w-full border border-input bg-background px-3 py-2 text-base"
            maxLength={BODY_MAX}
            required
            placeholder={t.bodyPlaceholder}
            value={body}
            aria-invalid={!!fieldErrors.body}
            onChange={e => setBody(e.target.value)}
          />
          <p className={cn("text-xs", fieldErrors.body ? "text-destructive" : "text-muted-foreground")}>{fieldErrors.body ? errorMessage(fieldErrors.body) : t.charsLeft(BODY_MAX - body.length)}</p>
        </div>
        <FormField id="pn-url" label={t.url} placeholder="https://…" maxLength={300} value={url} onChange={e => setUrl(e.target.value)} error={fieldErrors.url} help={t.urlHelp} />
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base font-semibold" aria-live="polite">
            {reach.isFetching ? t.counting : reach.isSuccess ? t.reach(devices) : audience === "operator" ? t.operatorNone : ""}
          </p>
          <Button type="submit" className="h-11" disabled={!ready || send.isPending}>
            {t.send(devices)}
          </Button>
        </div>
      </form>
      {confirming && (
        <div role="dialog" aria-modal="true" aria-labelledby="pn-confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 border border-lime-deep bg-background p-5">
            <h2 id="pn-confirm-title" className="text-xl font-bold uppercase tracking-wide">
              {t.confirmTitle}
            </h2>
            <p>{t.confirm(devices, audience === "operator" ? `${t.audiences.operator} ${operators.data?.operators.find(o => o.id === target)?.name ?? ""}` : t.audiences[audience])}</p>
            <div className="border border-border p-3">
              <p className="font-semibold">{title}</p>
              <p className="text-sm">{body}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="h-11" onClick={() => setConfirming(false)} disabled={send.isPending}>
                {t.cancel}
              </Button>
              <Button type="button" className="h-11" onClick={() => send.mutate()} disabled={send.isPending}>
                {t.confirmYes}
              </Button>
            </div>
          </div>
        </div>
      )}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold uppercase tracking-wide">{t.history}</h2>
        {history.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : history.error ? (
          <p className="text-destructive">{describeError(history.error)}</p>
        ) : (history.data?.data.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-base">
              <thead>
                <tr className="border-b border-border text-left">
                  {[t.colWhen, t.colAudience, t.colMessage, t.colRecipients, t.colBy].map(h => (
                    <th key={h} scope="col" className={cn(labelClass, "px-2 py-2 font-normal")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.data!.data.map(n => (
                  <tr key={n.id} className="border-b border-border align-top">
                    <td className="tabular whitespace-nowrap px-2 py-2 font-mono text-lime-deep">{dateTimeShort(n.createdAt)}</td>
                    <td className="px-2 py-2">{audienceLabel(n)}</td>
                    <td className="px-2 py-2">
                      <span className="font-semibold">{n.title}</span>
                      <span className="block text-sm text-muted-foreground">{n.body}</span>
                      {n.url && (
                        <a href={n.url} className="block text-sm text-lime-deep underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                          {n.url}
                        </a>
                      )}
                    </td>
                    <td className="tabular px-2 py-2 font-mono">{n.recipients}</td>
                    <td className="px-2 py-2 text-muted-foreground">{n.sentByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
