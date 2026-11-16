import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi, ApiError, TravellerCampaignInput } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const t = fr.platform.notifications.campaign;
const fieldClass = "flex w-full border border-input bg-background px-3 text-base";

function dateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));
}

/**
 * 15/11/2026 (« Mail de promotion à Plazo… pensez à Plazo pour la prochaine location de parking », direction C « La saison des
 * départs », campagne à la main): the platform writes the email, sees it, sends itself a test, then sends it to the travellers.
 */
export default function CampaignCard() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [form, setForm] = useState<TravellerCampaignInput>({
    subject: t.defaults.subject,
    title: t.defaults.title,
    body: t.defaults.body,
    airport: "",
    arrival: null,
    return: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const overview = useQuery({ queryKey: ["platform", "traveller-campaigns"], queryFn: adminApi.getTravellerCampaigns });
  const airports = useQuery({ queryKey: ["airports"], queryFn: adminApi.getAirports, staleTime: Infinity });
  const airport = form.airport || airports.data?.[0]?.slug || "";
  const input = { ...form, airport };

  const onError = (err: unknown) => {
    if (err instanceof ApiError && err.fields) setErrors(err.fields);
    const code = err instanceof ApiError ? err.code : undefined;
    toast.error(code && t.errors[code] ? t.errors[code] : describeError(err));
  };
  const showPreview = useMutation({
    mutationFn: () => adminApi.previewTravellerCampaign(input),
    onSuccess: r => {
      setErrors({});
      setPreview(r.html);
    },
    onError,
  });
  const test = useMutation({
    mutationFn: () => adminApi.testTravellerCampaign(input),
    onSuccess: r => {
      setErrors({});
      toast.success(t.testSent(r.to));
    },
    onError,
  });
  const start = useMutation({
    mutationFn: () => adminApi.startTravellerCampaign(input),
    onSuccess: r => {
      setErrors({});
      toast.success(t.started(r.recipients));
      void queryClient.invalidateQueries({ queryKey: ["platform", "traveller-campaigns"] });
    },
    onError,
  });

  const set = (key: keyof TravellerCampaignInput) => (value: string) =>
    setForm(f => ({ ...f, [key]: key === "arrival" || key === "return" ? value || null : value }));
  const err = (key: string) =>
    errors[key] ? (
      <p className="text-sm text-destructive" data-testid={`campaign-error-${key}`}>
        {t.fields[errors[key]] ?? t.fields.invalid}
      </p>
    ) : null;

  const data = overview.data;
  const audience = data?.audience ?? 0;
  const blocked = !data?.available || !!data?.nextAt || audience === 0;
  const send = async () => {
    const ok = await confirm(t.confirm(audience), { title: t.confirmTitle, confirmLabel: t.confirmYes });
    if (ok) start.mutate();
  };

  return (
    <section className="max-w-3xl space-y-4 rounded-[14px] border border-border bg-card p-4" data-testid="traveller-campaign">
      <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-subject">{t.subject}</Label>
        <Input id="campaign-subject" className="h-11" maxLength={120} value={form.subject} onChange={e => set("subject")(e.target.value)} />
        {err("subject")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-title">{t.heading}</Label>
        <Input id="campaign-title" className="h-11" maxLength={120} value={form.title} onChange={e => set("title")(e.target.value)} />
        {err("title")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-body">{t.body}</Label>
        <textarea
          id="campaign-body"
          className={`${fieldClass} min-h-32 rounded-md py-2`}
          maxLength={1200}
          value={form.body}
          onChange={e => set("body")(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">{t.bodyHint}</p>
        {err("body")}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
          <Label htmlFor="campaign-airport">{t.airport}</Label>
          <select id="campaign-airport" className={`${fieldClass} h-11`} value={airport} onChange={e => set("airport")(e.target.value)}>
            {(airports.data ?? []).map(a => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          {err("airport")}
        </div>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t.dates}</legend>
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label htmlFor="campaign-arrival" className="text-sm text-muted-foreground">
              {t.arrival}
            </Label>
            <Input id="campaign-arrival" type="datetime-local" className="h-11" value={form.arrival ?? ""} onChange={e => set("arrival")(e.target.value)} />
            {err("arrival")}
          </div>
          <div className="space-y-1">
            <Label htmlFor="campaign-return" className="text-sm text-muted-foreground">
              {t.ret}
            </Label>
            <Input id="campaign-return" type="datetime-local" className="h-11" value={form.return ?? ""} onChange={e => set("return")(e.target.value)} />
            {err("return")}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.datesHint}</p>
      </fieldset>

      {data && (
        <p className="text-sm" data-testid="campaign-audience">
          {!data.available ? t.unavailable : data.nextAt ? t.next(dateTime(data.nextAt)) : t.audience(audience)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => (preview ? setPreview(null) : showPreview.mutate())}
          disabled={showPreview.isPending || !airport}
          data-testid="campaign-preview"
        >
          {preview ? t.hidePreview : t.preview}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => test.mutate()} disabled={test.isPending || !airport} data-testid="campaign-test">
          {test.isPending ? t.sending : t.test}
        </Button>
        <Button type="button" className="h-11" onClick={send} disabled={blocked || start.isPending || !airport} data-testid="campaign-send">
          {start.isPending ? t.sending : t.send(audience)}
        </Button>
      </div>
      {preview && (
        <iframe
          title={t.previewTitle}
          sandbox=""
          srcDoc={preview}
          className="h-[640px] w-full rounded-[10px] border border-border bg-white"
          data-testid="campaign-preview-frame"
        />
      )}

      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t.history}</h3>
        {!data?.campaigns.length ? (
          <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>
        ) : (
          <ul className="divide-y divide-border rounded-[10px] border border-border">
            {data.campaigns.map(c => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm" data-testid={`campaign-row-${c.id}`}>
                <span className="min-w-0">
                  <span className="font-medium">{c.subject}</span>
                  <span className="block text-muted-foreground">
                    {dateTime(c.createdAt)}
                    {c.by ? ` · ${t.by(c.by)}` : ""}
                  </span>
                </span>
                <span className="font-mono text-sm">
                  {t.progress(c.sent, c.recipients)}
                  {c.failed ? ` · ${t.failed(c.failed)}` : ""}
                  {!c.finishedAt ? ` · ${t.running}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
