import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { renderSubjectText, renderText, stepFor, valuesOf, VARIABLES } from "@/lib/prospecting";
import type { Prospect, ProspectingSettings, ProspectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImportDialog } from "./prospecting/ImportDialog";
import { ProspectForm } from "./prospecting/ProspectForm";
import { StepsEditor } from "./prospecting/StepsEditor";

const t = fr.platform.prospecting;
const FILTERS: (ProspectStatus | null)[] = [null, "to_contact", "contacted", "replied", "interested", "not_interested", "unsubscribed"];
const PILL: Record<ProspectStatus | "waiting", string> = {
  to_contact: "bg-panel-2 text-[#4B5563]",
  waiting: "bg-panel-2 text-[#4B5563]",
  contacted: "bg-info-soft text-info-text",
  replied: "bg-ok-soft text-ok-text",
  interested: "bg-lime text-lime-ink",
  not_interested: "bg-warn-soft text-warn-text",
  unsubscribed: "bg-bad-soft text-bad-text",
};
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const dayTime = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const isOpen = (p: Prospect) => p.status === "to_contact" || p.status === "contacted";
const eligible = (p: Prospect) => p.status === "to_contact" && p.step === 0;
const contactName = (p: Prospect) => [p.contactFirstName, p.contactLastName].filter(Boolean).join(" ");

function stateLabel(p: Prospect): { text: string; tone: string } {
  if (p.status === "to_contact") return p.nextSendAt ? { text: t.states.waiting, tone: PILL.waiting } : { text: t.states.to_contact, tone: PILL.to_contact };
  if (p.status === "contacted") return { text: t.states.contacted[p.step] ?? t.states.contacted[1], tone: PILL.contacted };
  return { text: t.states[p.status], tone: PILL[p.status] };
}

function nextLabel(p: Prospect): string {
  if (p.status === "unsubscribed") return t.next.never;
  if (!isOpen(p)) return t.next.stopped;
  if (p.nextSendAt) {
    const step = p.nextStep ?? 1;
    const when = new Date(p.nextSendAt);
    // The first email waiting for a sending window: its day and hour; a follow-up: its day.
    return `${t.stepShort[step]} · ${step === 1 ? dayTime.format(when) : dayMonth.format(when)}`;
  }
  if (p.stoppedAt) return t.next.stopped;
  if (p.status === "contacted") return t.next.finished;
  return t.next.none;
}

/** « Inviter sur Plazo »: the Loueurs tab's invitation form, prefilled. */
const inviteLink = (p: Prospect) =>
  `/plateforme/loueurs?${new URLSearchParams({
    inviter: "1",
    parking: p.companyName,
    ...(p.contactFirstName ? { prenom: p.contactFirstName } : {}),
    ...(p.contactLastName ? { nom: p.contactLastName } : {}),
    email: p.email,
  })}`;

function RowActions({ prospect, onEdit }: { prospect: Prospect; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: refresh,
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const name = prospect.companyName;
  const run = async (action: "replied" | "interested" | "not_interested" | "unsubscribed" | "stop" | "remove") => {
    setOpen(false);
    if (action === "unsubscribed" && !(await confirm(t.unsubscribeConfirm(name), { confirmLabel: t.markUnsubscribed, destructive: true }))) return;
    if (action === "stop" && !(await confirm(t.stopConfirm(name), { confirmLabel: t.stop }))) return;
    if (action === "remove") {
      if (!(await confirm(t.removeConfirm(name), { confirmLabel: t.remove, destructive: true }))) return;
      act.mutate(() => adminApi.deleteProspect(prospect.id).then(() => toast.success(t.removed)));
      return;
    }
    if (action === "stop") act.mutate(() => adminApi.stopProspect(prospect.id));
    else act.mutate(() => adminApi.setProspectStatus(prospect.id, action).then(() => toast.success(t.updated)));
  };
  const item = "flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-panel-2";
  const closed = prospect.status === "unsubscribed";
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t.actionsFor(name)}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[12px] border border-panel-line bg-white py-1 shadow-lg">
          {!closed && (
            <>
              <button role="menuitem" className={item} onClick={() => run("replied")}>
                {t.replied}
              </button>
              <button role="menuitem" className={item} onClick={() => run("interested")}>
                {t.interested}
              </button>
              <button role="menuitem" className={item} onClick={() => run("not_interested")}>
                {t.notInterested}
              </button>
              {prospect.nextSendAt && (
                <button role="menuitem" className={item} onClick={() => run("stop")}>
                  {t.stop}
                </button>
              )}
            </>
          )}
          {!closed && (
            <Link role="menuitem" className={item} to={inviteLink(prospect)}>
              {t.invite}
            </Link>
          )}
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            {t.edit}
          </button>
          {!closed && (
            <button role="menuitem" className={cn(item, "text-destructive")} onClick={() => run("unsubscribed")}>
              {t.markUnsubscribed}
            </button>
          )}
          <button role="menuitem" className={cn(item, "text-destructive")} onClick={() => run("remove")}>
            {t.remove}
          </button>
        </div>
      )}
    </div>
  );
}

function SendPanel({
  chosen,
  settings,
  today,
  configured,
  onEdit,
  onSent,
}: {
  chosen: Prospect[];
  settings: ProspectingSettings | undefined;
  today: { sent: number; cap: number; remaining: number } | undefined;
  configured: boolean;
  onEdit: () => void;
  onSent: () => void;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [previewStep, setPreviewStep] = useState(1);
  const ready = chosen.filter(eligible);
  const skipped = chosen.length - ready.length;
  const first = chosen[0] ?? null;
  const steps = settings?.steps ?? [];
  const step = steps.find(s => s.step === previewStep) ?? (first ? stepFor(first, steps) : steps[0]);
  const values = first ? valuesOf(first) : null;

  const send = useMutation({
    mutationFn: () => adminApi.sendProspects(ready.map(p => p.id)),
    onSuccess: result => {
      toast.success(t.sent(result.sent, result.queued, result.failed));
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
      onSent();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const test = useMutation({
    mutationFn: () => adminApi.sendProspectTest({ step: step?.step ?? 1, prospectId: first?.id ?? null }),
    onSuccess: ({ sentTo }) => toast.success(t.testSent(sentTo)),
    onError: (err: Error) => toast.error(describeError(err)),
  });

  return (
    <aside aria-label={t.panelTitle(ready.length)} className="flex flex-col gap-4 rounded-[14px] border border-panel-line bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">{t.panelTitle(ready.length)}</h2>
        {today && <span className="font-mono text-xs text-muted-foreground">{t.today(today.sent, today.cap)}</span>}
      </div>
      {chosen.length === 0 && <p className="text-sm text-muted-foreground">{t.pickSome}</p>}
      {skipped > 0 && <p className="text-sm text-warn-text">{t.notEligible(skipped)}</p>}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{t.sequence}</span>
          <Button type="button" variant="outline" className="h-11" onClick={onEdit} disabled={!settings}>
            {t.editSteps}
          </Button>
        </div>
        <div role="group" aria-label={t.sequence} className="grid gap-2">
          {steps.map(s => (
            <button
              key={s.step}
              type="button"
              aria-pressed={previewStep === s.step}
              onClick={() => setPreviewStep(s.step)}
              className={cn(
                "flex flex-col gap-0.5 rounded-[12px] border px-3 py-2 text-left",
                previewStep === s.step ? "border-lime-deep bg-panel-2" : "border-panel-line hover:bg-panel-2",
                !s.enabled && "opacity-60",
              )}
            >
              <span className="flex justify-between gap-2 text-sm font-bold">
                {t.stepTitle[s.step]}
                <span className="font-mono text-xs font-normal text-lime-deep">{s.enabled ? t.stepWhen(s.delayDays) : t.stepOff}</span>
              </span>
              <span className="truncate text-xs text-muted-foreground">« {s.subject} »</span>
            </button>
          ))}
        </div>
      </div>

      {step && (
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">{first ? t.previewFor(first.companyName) : t.previewSample}</span>
          <div className="space-y-2 rounded-[10px] border border-panel-line bg-[#FAFBF9] p-3.5 text-sm leading-relaxed" data-testid="prospect-preview">
            <p className="font-semibold">{values ? renderSubjectText(step.subject, values) : step.subject}</p>
            <p className="whitespace-pre-line">{values ? renderText(step.body, values) : step.body}</p>
            {settings?.sender && <p>{settings.sender.name}</p>}
          </div>
          <p className="text-xs text-muted-foreground">{t.footerNote}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t.variables} {VARIABLES.join(" ")}
      </p>
      {settings?.sender && (
        <p className="text-xs text-muted-foreground">
          {t.senderLine(settings.sender.name, settings.sender.email)} · {t.replyLine(settings.replyTo)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t.rules}</p>
      <div className="mt-auto flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="h-11 flex-1" disabled={!configured || test.isPending} onClick={() => test.mutate()}>
          {t.sendTest}
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 bg-lime font-bold text-lime-ink hover:bg-lime/90"
          disabled={!configured || ready.length === 0 || send.isPending}
          onClick={async () => {
            if (await confirm(t.confirm(ready.length, today?.remaining ?? ready.length), { title: t.confirmTitle, confirmLabel: t.confirmYes })) send.mutate();
          }}
        >
          {t.send(ready.length)}
        </Button>
      </div>
    </aside>
  );
}

/**
 * Plateforme › Prospection (18/10/2026, choix « A avec les relances de B »): the list of airport parkings to bring to Plazo,
 * the panel that sends them the sequence (first contact now, follow-ups by themselves), the import and the editor.
 */
export default function ProspectingPage() {
  const [status, setStatus] = useState<ProspectStatus | null>(null);
  const [airport, setAirport] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{ kind: "add" } | { kind: "edit"; prospect: Prospect } | { kind: "import" } | { kind: "steps" } | null>(null);

  const list = useQuery({
    queryKey: ["platform", "prospects", status, airport],
    queryFn: () => adminApi.getProspects({ status, airport: airport || null }),
  });
  const settings = useQuery({ queryKey: ["platform", "prospects", "settings"], queryFn: adminApi.getProspectingSettings });
  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  // The chosen prospects of the current view, in the list's order.
  const chosen = rows.filter(p => selected.has(p.id));
  const allChosen = rows.length > 0 && rows.every(p => selected.has(p.id));
  const toggle = (id: string) =>
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-narrow text-[30px] font-bold text-lime-deep">{t.title}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 font-semibold" onClick={() => setDialog({ kind: "import" })}>
            {t.importCsv}
          </Button>
          <Button type="button" variant="outline" className="h-11 font-semibold" onClick={() => setDialog({ kind: "add" })}>
            {t.add}
          </Button>
        </div>
      </div>

      {list.data && !list.data.configured && (
        <p role="status" className="rounded-[14px] border border-warn/40 bg-warn-soft p-3 text-sm text-warn-text">
          {t.notConfigured}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t.filters} className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const pressed = f === status;
            const count = list.data?.counts[f ?? "all"];
            return (
              <button
                key={f ?? "all"}
                type="button"
                aria-pressed={pressed}
                onClick={() => setStatus(f)}
                className={cn(
                  "min-h-11 rounded-full px-3.5 text-sm",
                  pressed ? "bg-lime-deep font-semibold text-white" : "border border-panel-line bg-white hover:bg-panel-2",
                )}
              >
                {f ? t.filterLabels[f] : t.all}
                {count !== undefined && ` · ${count}`}
              </button>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="prospect-airport">
          {t.airport}
        </label>
        <select
          id="prospect-airport"
          value={airport}
          onChange={e => setAirport(e.target.value)}
          className="h-11 rounded-full border border-panel-line bg-white px-3.5 text-sm"
        >
          <option value="">{t.airportAll}</option>
          {(list.data?.airports ?? []).map(a => (
            <option key={a.code} value={a.code}>
              {`${t.airport} : ${a.name ?? a.code} (${a.count})`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-panel-line bg-white">
          {list.isLoading ? (
            <Skeleton className="m-4 h-40" />
          ) : list.error ? (
            <p className="p-4 text-destructive">{describeError(list.error)}</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-muted-foreground">{status || airport ? t.emptyFilter : t.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-panel-line text-left text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={t.selectAll}
                        className="h-[18px] w-[18px] accent-[#1E5E2E]"
                        checked={allChosen}
                        onChange={() =>
                          setSelected(s => {
                            const next = new Set(s);
                            rows.forEach(p => (allChosen ? next.delete(p.id) : next.add(p.id)));
                            return next;
                          })
                        }
                      />
                    </th>
                    <th className="px-2 py-3 font-semibold">{t.colParking}</th>
                    <th className="px-2 py-3 font-semibold">{t.colContact}</th>
                    <th className="px-2 py-3 font-semibold">{t.colAirport}</th>
                    <th className="px-2 py-3 font-semibold">{t.colState}</th>
                    <th className="px-2 py-3 font-semibold">{t.colNext}</th>
                    <th className="w-14 px-2 py-3">
                      <span className="sr-only">{t.actions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => {
                    const state = stateLabel(p);
                    return (
                      <tr key={p.id} className="border-b border-[#F1F2EF] align-middle">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            aria-label={t.selectOne(p.companyName)}
                            className="h-[18px] w-[18px] accent-[#1E5E2E]"
                            checked={selected.has(p.id)}
                            onChange={() => toggle(p.id)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className="block font-semibold">{p.companyName}</span>
                          {p.town && <span className="block text-xs text-muted-foreground">{p.town}</span>}
                        </td>
                        <td className="max-w-[220px] px-2 py-2">
                          <span className="block">{contactName(p) || "—"}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                        </td>
                        <td className="px-2 py-2 font-mono text-[13px]">{p.airportCode ?? "—"}</td>
                        <td className="px-2 py-2">
                          <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", state.tone)}>{state.text}</span>
                          {p.failedAttempts > 0 && <span className="mt-1 block text-xs text-destructive">{t.failed(p.failedAttempts)}</span>}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-[13px] text-[#4B5563]">{nextLabel(p)}</td>
                        <td className="px-2 py-2">
                          <RowActions prospect={p} onEdit={() => setDialog({ kind: "edit", prospect: p })} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-auto px-4 py-3 text-xs text-muted-foreground">{t.chosen(chosen.length)}</p>
        </section>
        <SendPanel
          chosen={chosen}
          settings={settings.data?.data}
          today={list.data?.today}
          configured={!!list.data?.configured}
          onEdit={() => setDialog({ kind: "steps" })}
          onSent={() => setSelected(new Set())}
        />
      </div>

      {dialog?.kind === "add" && <ProspectForm prospect={null} onClose={() => setDialog(null)} />}
      {dialog?.kind === "edit" && <ProspectForm prospect={dialog.prospect} onClose={() => setDialog(null)} />}
      {dialog?.kind === "import" && <ImportDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "steps" && settings.data && <StepsEditor settings={settings.data.data} onClose={() => setDialog(null)} />}
    </>
  );
}
