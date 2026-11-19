import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import {
  filterProspects,
  groupByRegion,
  hasFilters,
  NO_FILTERS,
  NO_REGION,
  nextSort,
  type ProspectFilters,
  type ProspectSort,
  type ProspectSortKey,
  type RegionGroup,
  renderSubjectText,
  renderText,
  sequenceFor,
  smsCandidates,
  sortProspects,
  stepFor,
  toolOptions,
  valuesOf,
  VARIABLES,
} from "@/lib/prospecting";
import type {
  DemoLink,
  Prospect,
  ProspectingSettings,
  ProspectStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImportDialog } from "./prospecting/ImportDialog";
import { SmsDialog } from "./prospecting/SmsDialog";
import { ProspectForm } from "./prospecting/ProspectForm";
import { StepsEditor } from "./prospecting/StepsEditor";

const t = fr.platform.prospecting;
const FILTERS: (ProspectStatus | null)[] = [
  null,
  "to_contact",
  "contacted",
  "replied",
  "interested",
  "not_interested",
  "unsubscribed",
];
const PILL: Record<ProspectStatus | "waiting", string> = {
  to_contact: "bg-panel-2 text-[#4B5563]",
  waiting: "bg-panel-2 text-[#4B5563]",
  contacted: "bg-info-soft text-info-text",
  replied: "bg-ok-soft text-ok-text",
  interested: "bg-lime text-lime-ink",
  not_interested: "bg-warn-soft text-warn-text",
  unsubscribed: "bg-bad-soft text-bad-text",
};
const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});
const dayTime = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});
const isOpen = (p: Prospect) =>
  p.status === "to_contact" || p.status === "contacted";
// 13/11/2026: a prospect without an email is called, never sent the sequence.
const eligible = (p: Prospect) =>
  !!p.email && p.status === "to_contact" && p.step === 0;
const contactName = (p: Prospect) =>
  [p.contactFirstName, p.contactLastName].filter(Boolean).join(" ");

/** The region blocks folded by the admin, kept in this browser only (19/10/2026). */
const COLLAPSED_KEY = "plazo:prospects-collapsed-regions";

function readCollapsed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    const keys: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(keys)
        ? keys.filter((k): k is string => typeof k === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeCollapsed(keys: Set<string>) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...keys]));
  } catch {
    // Private window or blocked storage: the blocks simply open again next time.
  }
}

function stateLabel(p: Prospect): { text: string; tone: string } {
  if (p.status === "to_contact")
    return p.nextSendAt
      ? { text: t.states.waiting, tone: PILL.waiting }
      : { text: t.states.to_contact, tone: PILL.to_contact };
  if (p.status === "contacted")
    return {
      text: t.states.contacted[p.step] ?? t.states.contacted[1],
      tone: PILL.contacted,
    };
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
    ...(p.email ? { email: p.email } : {}),
  })}`;

const ago = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** 21/10/2026 (C): the prospect's demo link: opened how often and when, valid until when; or « Créer un lien de démo ». */
function DemoCell({
  prospect,
  onShow,
}: {
  prospect: Prospect;
  onShow: (link: DemoLink) => void;
}) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (renew: boolean) =>
      adminApi.createProspectDemoLink(prospect.id, renew),
    onSuccess: ({ data }) => {
      onShow(data);
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const demo = prospect.demo;
  if (prospect.status === "unsubscribed" && !demo)
    return <span className="text-muted-foreground">—</span>;
  if (!demo)
    return (
      <Button
        type="button"
        className="h-11 whitespace-nowrap text-[13px]"
        disabled={create.isPending}
        onClick={() => create.mutate(false)}
      >
        {create.isPending ? t.demoCreating : t.demoCreate}
      </Button>
    );
  return (
    <div className="flex flex-col gap-0.5 text-[13px]">
      {demo.opens > 0 ? (
        <span className="font-semibold text-ok-text">
          {t.demoOpened(
            demo.opens,
            demo.lastOpenedAt ? ago.format(new Date(demo.lastOpenedAt)) : null,
          )}
        </span>
      ) : (
        <span className="text-[#4B5563]">{t.demoNotOpened}</span>
      )}
      <span className="text-xs text-[#4B5563]">
        {demo.expired
          ? t.demoExpired
          : t.demoValidUntil(dayMonth.format(new Date(demo.expiresAt)))}
      </span>
      <button
        type="button"
        className="min-h-11 self-start text-left text-xs font-semibold text-lime-deep underline-offset-4 hover:underline disabled:opacity-60"
        disabled={create.isPending}
        onClick={() => (demo.expired ? create.mutate(true) : onShow(demo))}
      >
        {demo.expired ? t.demoRenew : t.demoShow}
      </button>
    </div>
  );
}

function DemoLinkPanel({
  company,
  link,
  onClose,
}: {
  company: string;
  link: DemoLink;
  onClose: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success(t.demoCopied);
    } catch {
      toast.error(link.url);
    }
  };
  return (
    <div
      data-testid="demo-link-panel"
      className="m-3 flex flex-col gap-2.5 rounded-[14px] border-2 border-lime bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <strong className="text-[15px]">{t.demoPanelTitle(company)}</strong>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto min-h-11 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {t.demoClose}
        </button>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={link.url}
          aria-label={t.colDemo}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-[10px] bg-panel-2 px-3 py-2.5 font-mono text-[13px]"
        />
        <Button type="button" variant="outline" className="h-11" onClick={copy}>
          {t.demoCopy}
        </Button>
      </div>
      <span className="text-[13px] text-[#4B5563]">{t.demoPanelNote}</span>
    </div>
  );
}

function RowActions({
  prospect,
  onEdit,
}: {
  prospect: Prospect;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: refresh,
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const name = prospect.companyName;
  const run = async (
    action:
      | "replied"
      | "interested"
      | "not_interested"
      | "unsubscribed"
      | "reopen"
      | "stop"
      | "remove",
  ) => {
    setOpen(false);
    if (
      action === "unsubscribed" &&
      !(await confirm(t.unsubscribeConfirm(name), {
        confirmLabel: t.markUnsubscribed,
        destructive: true,
      }))
    )
      return;
    if (
      action === "stop" &&
      !(await confirm(t.stopConfirm(name), { confirmLabel: t.stop }))
    )
      return;
    if (action === "remove") {
      if (
        !(await confirm(t.removeConfirm(name), {
          confirmLabel: t.remove,
          destructive: true,
        }))
      )
        return;
      act.mutate(() =>
        adminApi
          .deleteProspect(prospect.id)
          .then(() => toast.success(t.removed)),
      );
      return;
    }
    if (action === "stop") act.mutate(() => adminApi.stopProspect(prospect.id));
    else
      act.mutate(() =>
        adminApi
          .setProspectStatus(prospect.id, action)
          .then(() => toast.success(t.updated)),
      );
  };
  const item =
    "flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-panel-2";
  const closed = prospect.status === "unsubscribed";
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t.actionsFor(name)}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[12px] border border-panel-line bg-white py-1 shadow-lg"
        >
          {!closed && (
            <>
              <button
                role="menuitem"
                className={item}
                onClick={() => run("replied")}
              >
                {t.replied}
              </button>
              <button
                role="menuitem"
                className={item}
                onClick={() => run("interested")}
              >
                {t.interested}
              </button>
              <button
                role="menuitem"
                className={item}
                onClick={() => run("not_interested")}
              >
                {t.notInterested}
              </button>
              {MARKED.includes(prospect.status) && (
                <button
                  role="menuitem"
                  className={item}
                  onClick={() => run("reopen")}
                >
                  {t.reopen}
                </button>
              )}
              {prospect.nextSendAt && (
                <button
                  role="menuitem"
                  className={item}
                  onClick={() => run("stop")}
                >
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
            <button
              role="menuitem"
              className={cn(item, "text-destructive")}
              onClick={() => run("unsubscribed")}
            >
              {t.markUnsubscribed}
            </button>
          )}
          <button
            role="menuitem"
            className={cn(item, "text-destructive")}
            onClick={() => run("remove")}
          >
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
  // 13/11/2026: the sequence in the first chosen prospect's language.
  const steps = sequenceFor(first, settings);
  const step =
    steps.find((s) => s.step === previewStep) ??
    (first ? stepFor(first, steps) : steps[0]);
  const values = first ? valuesOf(first) : null;

  const send = useMutation({
    mutationFn: () => adminApi.sendProspects(ready.map((p) => p.id)),
    onSuccess: (result) => {
      toast.success(t.sent(result.sent, result.queued, result.failed));
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
      onSent();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const test = useMutation({
    mutationFn: () =>
      adminApi.sendProspectTest({
        step: step?.step ?? 1,
        prospectId: first?.id ?? null,
        language: first?.language,
      }),
    onSuccess: ({ sentTo }) => toast.success(t.testSent(sentTo)),
    onError: (err: Error) => toast.error(describeError(err)),
  });

  return (
    <aside
      aria-label={t.panelTitle(ready.length)}
      className="flex flex-col gap-4 rounded-[14px] border border-panel-line bg-white p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">{t.panelTitle(ready.length)}</h2>
        {today && (
          <span className="font-mono text-xs text-muted-foreground">
            {t.today(today.sent, today.cap)}
          </span>
        )}
      </div>
      {chosen.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.pickSome}</p>
      )}
      {skipped > 0 && (
        <p className="text-sm text-warn-text">{t.notEligible(skipped)}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{t.sequence}</span>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={onEdit}
            disabled={!settings}
          >
            {t.editSteps}
          </Button>
        </div>
        <div role="group" aria-label={t.sequence} className="grid gap-2">
          {steps.map((s) => (
            <button
              key={s.step}
              type="button"
              aria-pressed={previewStep === s.step}
              onClick={() => setPreviewStep(s.step)}
              className={cn(
                "flex flex-col gap-0.5 rounded-[12px] border px-3 py-2 text-left",
                previewStep === s.step
                  ? "border-lime-deep bg-panel-2"
                  : "border-panel-line hover:bg-panel-2",
                !s.enabled && "opacity-60",
              )}
            >
              <span className="flex justify-between gap-2 text-sm font-bold">
                {t.stepTitle[s.step]}
                <span className="font-mono text-xs font-normal text-lime-deep">
                  {s.enabled ? t.stepWhen(s.delayDays) : t.stepOff}
                </span>
              </span>
              <span className="truncate text-xs text-muted-foreground">
                « {s.subject} »
              </span>
            </button>
          ))}
        </div>
      </div>

      {step && (
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">
            {first ? t.previewFor(first.companyName) : t.previewSample}
            {first && first.language !== "fr" && (
              <span className="ml-1 font-normal text-muted-foreground">
                · {t.previewLanguage(t.languages[first.language])}
              </span>
            )}
          </span>
          <div
            className="space-y-2 rounded-[10px] border border-panel-line bg-[#FAFBF9] p-3.5 text-sm leading-relaxed"
            data-testid="prospect-preview"
          >
            <p className="font-semibold">
              {values ? renderSubjectText(step.subject, values) : step.subject}
            </p>
            <p className="whitespace-pre-line">
              {values ? renderText(step.body, values) : step.body}
            </p>
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
          {t.senderLine(settings.sender.name, settings.sender.email)} ·{" "}
          {t.replyLine(settings.replyTo)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t.rules}</p>
      <div className="mt-auto flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          disabled={!configured || test.isPending}
          onClick={() => test.mutate()}
        >
          {t.sendTest}
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 bg-lime font-bold text-lime-ink hover:bg-lime/90"
          disabled={!configured || ready.length === 0 || send.isPending}
          onClick={async () => {
            if (
              await confirm(
                t.confirm(ready.length, today?.remaining ?? ready.length),
                { title: t.confirmTitle, confirmLabel: t.confirmYes },
              )
            )
              send.mutate();
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
  const [region, setRegion] = useState<string>("");
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ProspectFilters>(NO_FILTERS);
  const [sort, setSort] = useState<ProspectSort | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [demoPanel, setDemoPanel] = useState<{
    company: string;
    link: DemoLink;
  } | null>(null);
  const [dialog, setDialog] = useState<
    | { kind: "add" }
    | { kind: "edit"; prospect: Prospect }
    | { kind: "import" }
    | { kind: "sms" }
    | { kind: "steps" }
    | null
  >(null);

  const list = useQuery({
    queryKey: ["platform", "prospects", status, airport, region],
    queryFn: () =>
      adminApi.getProspects({
        status,
        airport: airport || null,
        region: region || null,
      }),
  });
  const settings = useQuery({
    queryKey: ["platform", "prospects", "settings"],
    queryFn: adminApi.getProspectingSettings,
  });
  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  // 16/11/2026 (direction A): the page's own filters and the column sort, on what the server sent.
  const rows = useMemo(
    () => sortProspects(filterProspects(all, filters), sort),
    [all, filters, sort],
  );
  const tools = useMemo(() => toolOptions(all), [all]);
  const languages = useMemo(
    () => [...new Set(all.map((p) => p.language))].sort(),
    [all],
  );
  const filtered = hasFilters(filters);
  const withEmail = rows.filter((p) => !!p.email);
  // 19/11/2026 (choix C): the filtered prospects that can get a prospecting SMS.
  const textable = useMemo(() => smsCandidates(rows), [rows]);
  const setFilter = <K extends keyof ProspectFilters>(
    key: K,
    value: ProspectFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));
  const checkFiltered = () =>
    setSelected((s) => {
      const next = new Set(s);
      withEmail.forEach((p) => next.add(p.id));
      return next;
    });
  const sortHeader = (key: ProspectSortKey, label: string) => {
    const on = sort?.key === key ? sort.dir : null;
    const Icon =
      on === "asc" ? ArrowUp : on === "desc" ? ArrowDown : ArrowUpDown;
    return (
      <th
        className="px-2 py-3 font-semibold"
        aria-sort={
          on === "asc" ? "ascending" : on === "desc" ? "descending" : "none"
        }
      >
        <button
          type="button"
          title={t.sortBy(label)}
          onClick={() => setSort((c) => nextSort(c, key))}
          className={cn(
            "inline-flex min-h-11 items-center gap-1 uppercase tracking-[0.04em] hover:text-lime-deep",
            on && "text-lime-deep",
          )}
        >
          {label}
          <Icon
            className={cn("h-3.5 w-3.5", !on && "opacity-50")}
            aria-hidden
          />
        </button>
      </th>
    );
  };
  // The chosen prospects of the current view, in the list's order.
  const chosen = rows.filter((p) => selected.has(p.id));
  const allChosen = rows.length > 0 && rows.every((p) => selected.has(p.id));
  // « Groupés par région »: one block per region (alphabetical), « Sans région » last.
  const regions = useMemo(() => list.data?.regions ?? [], [list.data]);
  // A column sort shows one sorted list instead of the region blocks (the sort would only hold inside each block).
  const groups = useMemo(
    () =>
      sort
        ? rows.length
          ? [{ key: "sorted", label: t.sortedAll, prospects: rows }]
          : []
        : groupByRegion(rows, regions),
    [rows, regions, sort],
  );
  const regionCounts = list.data?.regionCounts ?? {};
  const toggleBlock = (key: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeCollapsed(next);
      return next;
    });
  /** « Tout cocher dans la région »: every prospect of the block, or none when they all are. */
  const toggleGroup = (group: RegionGroup) =>
    setSelected((s) => {
      const next = new Set(s);
      const all = group.prospects.every((p) => next.has(p.id));
      group.prospects.forEach((p) =>
        all ? next.delete(p.id) : next.add(p.id),
      );
      return next;
    });
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-narrow text-[30px] font-bold text-lime-deep">
            {t.title}
          </h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 font-semibold"
            onClick={() => setDialog({ kind: "import" })}
          >
            {t.importCsv}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 font-semibold"
            onClick={() => setDialog({ kind: "add" })}
          >
            {t.add}
          </Button>
        </div>
      </div>

      {list.data && !list.data.configured && (
        <p
          role="status"
          className="rounded-[14px] border border-warn/40 bg-warn-soft p-3 text-sm text-warn-text"
        >
          {t.notConfigured}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label={t.filters}
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map((f) => {
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
                  pressed
                    ? "bg-lime-deep font-semibold text-white"
                    : "border border-panel-line bg-white hover:bg-panel-2",
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
          onChange={(e) => setAirport(e.target.value)}
          className="h-11 rounded-full border border-panel-line bg-white px-3.5 text-sm"
        >
          <option value="">{t.airportAll}</option>
          {(list.data?.airports ?? []).map((a) => (
            <option key={a.code} value={a.code}>
              {`${t.airport} : ${a.name ?? a.code} (${a.count})`}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="prospect-region-filter">
          {t.region}
        </label>
        <select
          id="prospect-region-filter"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-11 rounded-full border border-panel-line bg-white px-3.5 text-sm"
        >
          <option value="">{t.regionAll}</option>
          {[false, true].map((country) => {
            const shown = regions.filter(
              (r) =>
                !!r.country === country &&
                ((regionCounts[r.key] ?? 0) > 0 || r.key === region),
            );
            return shown.length ? (
              <optgroup
                key={String(country)}
                label={country ? t.regionGroupEurope : t.regionGroupFrance}
              >
                {shown.map((r) => (
                  <option key={r.key} value={r.key}>
                    {t.regionOption(r.label, regionCounts[r.key] ?? 0)}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
          {((regionCounts[NO_REGION] ?? 0) > 0 || region === NO_REGION) && (
            <option value={NO_REGION}>
              {t.regionOption(t.regionNone, regionCounts[NO_REGION] ?? 0)}
            </option>
          )}
        </select>
      </div>

      <div
        role="group"
        aria-label={t.filterBar}
        className="flex flex-wrap items-center gap-2 rounded-[14px] border border-panel-line bg-white p-3"
      >
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-[10px] bg-panel-2 px-3 sm:max-w-[300px]">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">{t.search}</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <FilterSelect
          label={t.filterEmail}
          value={filters.email}
          onChange={(v) => setFilter("email", v as ProspectFilters["email"])}
        >
          {(
            Object.keys(
              t.filterEmailOptions,
            ) as (keyof typeof t.filterEmailOptions)[]
          ).map((k) => (
            <option key={k} value={k}>
              {t.filterEmailOptions[k]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t.filterLanguage}
          value={filters.language}
          onChange={(v) => setFilter("language", v)}
        >
          <option value="">{t.filterLanguageAll}</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {t.languages[l]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t.filterTool}
          value={filters.tool}
          onChange={(v) => setFilter("tool", v)}
        >
          <option value="">{t.filterToolAll}</option>
          <option value="none">{t.filterToolNone}</option>
          <option value="unknown">{t.filterToolUnknown}</option>
          {tools.map((o) => (
            <option key={o.value} value={o.value}>
              {`${o.value} (${o.count})`}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t.filterDemo}
          value={filters.demo}
          onChange={(v) => setFilter("demo", v as ProspectFilters["demo"])}
        >
          {(
            Object.keys(
              t.filterDemoOptions,
            ) as (keyof typeof t.filterDemoOptions)[]
          ).map((k) => (
            <option key={k} value={k}>
              {t.filterDemoOptions[k]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t.filterLastMail}
          value={filters.lastMail}
          onChange={(v) =>
            setFilter("lastMail", v as ProspectFilters["lastMail"])
          }
        >
          {(
            Object.keys(
              t.filterLastMailOptions,
            ) as (keyof typeof t.filterLastMailOptions)[]
          ).map((k) => (
            <option key={k} value={k}>
              {t.filterLastMailOptions[k]}
            </option>
          ))}
        </FilterSelect>
        {filtered && (
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-lime-deep underline-offset-4 hover:underline"
          >
            <X className="h-4 w-4" aria-hidden />
            {t.clearFilters}
          </button>
        )}
      </div>

      {filtered && list.data && (
        <div
          role="status"
          data-testid="prospects-filtered"
          className="flex flex-wrap items-center gap-3 rounded-[12px] bg-lime-deep px-4 py-2.5 text-sm text-white"
        >
          <span className="font-semibold">{t.filteredCount(rows.length)}</span>
          <span className="text-[#CFE7B8]">
            ·{" "}
            {t.filteredSplit(withEmail.length, rows.length - withEmail.length)}
          </span>
          {withEmail.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={checkFiltered}
                className="min-h-11 rounded-full border border-lime px-4 font-semibold text-lime"
              >
                {t.checkFiltered(withEmail.length)}
              </button>
              <button
                type="button"
                onClick={() => {
                  checkFiltered();
                  panelRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="min-h-11 rounded-full bg-lime px-4 font-semibold text-lime-ink"
              >
                {t.sendFiltered(withEmail.length)}
              </button>
            </div>
          )}
          {textable.length > 0 && (
            <button
              type="button"
              data-testid="prospects-sms"
              onClick={() => setDialog({ kind: "sms" })}
              className={cn(
                "min-h-11 rounded-full border border-lime px-4 font-semibold text-lime",
                withEmail.length === 0 && "ml-auto",
              )}
            >
              {t.smsFiltered(textable.length)}
            </button>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-panel-line bg-white">
          {demoPanel && (
            <DemoLinkPanel
              company={demoPanel.company}
              link={demoPanel.link}
              onClose={() => setDemoPanel(null)}
            />
          )}
          {list.isLoading ? (
            <Skeleton className="m-4 h-40" />
          ) : list.error ? (
            <p className="p-4 text-destructive">{describeError(list.error)}</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              {status || airport || region || filtered
                ? t.emptyFilter
                : t.empty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-panel-line text-left text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={t.selectAll}
                        className="h-[18px] w-[18px] accent-[#1E5E2E]"
                        checked={allChosen}
                        onChange={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            rows.forEach((p) =>
                              allChosen ? next.delete(p.id) : next.add(p.id),
                            );
                            return next;
                          })
                        }
                      />
                    </th>
                    {sortHeader("parking", t.colParking)}
                    {sortHeader("contact", t.colContact)}
                    {sortHeader("airport", t.colAirport)}
                    {sortHeader("tool", t.colTool)}
                    {sortHeader("state", t.colState)}
                    {sortHeader("next", t.colNext)}
                    {sortHeader("demo", t.colDemo)}
                    <th className="w-14 px-2 py-3">
                      <span className="sr-only">{t.actions}</span>
                    </th>
                  </tr>
                </thead>
                {groups.map((group) => {
                  const open = !collapsed.has(group.key);
                  const label = t.regionBlock(
                    group.label,
                    group.prospects.length,
                  );
                  const groupChosen = group.prospects.every((p) =>
                    selected.has(p.id),
                  );
                  return (
                    <tbody key={group.key} data-testid={`region-${group.key}`}>
                      <tr className="border-b border-panel-line bg-panel-2">
                        <td colSpan={9} className="px-2 py-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => toggleBlock(group.key)}
                              title={
                                open
                                  ? t.regionCollapse(group.label)
                                  : t.regionExpand(group.label)
                              }
                              className="flex min-h-11 items-center gap-2 rounded-md px-2 text-left text-xs font-bold uppercase tracking-[0.06em] text-lime-deep hover:bg-white"
                            >
                              {open ? (
                                <ChevronDown className="h-4 w-4" aria-hidden />
                              ) : (
                                <ChevronRight className="h-4 w-4" aria-hidden />
                              )}
                              {label}
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-11 text-sm font-semibold"
                              aria-label={`${groupChosen ? t.regionUncheckAll : t.regionCheckAll} · ${group.label}`}
                              onClick={() => toggleGroup(group)}
                            >
                              {groupChosen
                                ? t.regionUncheckAll
                                : t.regionCheckAll}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {open &&
                        group.prospects.map((p) => {
                          const state = stateLabel(p);
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-[#F1F2EF] align-middle"
                            >
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  title={
                                    p.email
                                      ? undefined
                                      : t.noEmailCheck(p.companyName)
                                  }
                                  aria-label={t.selectOne(p.companyName)}
                                  className="h-[18px] w-[18px] accent-[#1E5E2E]"
                                  checked={selected.has(p.id)}
                                  onChange={() => toggle(p.id)}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <span className="block font-semibold">
                                  {p.companyName}
                                </span>
                                {p.town && (
                                  <span className="block text-xs text-muted-foreground">
                                    {p.town}
                                  </span>
                                )}
                              </td>
                              <td className="max-w-[220px] px-2 py-2">
                                <span className="block">
                                  {contactName(p) || "—"}
                                </span>
                                {p.email ? (
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {p.email}
                                  </span>
                                ) : (
                                  <span
                                    className="block text-xs font-semibold text-warn-text"
                                    data-testid="prospect-no-email"
                                  >
                                    {t.noEmail}
                                  </span>
                                )}
                                {!p.email && p.phone && (
                                  <span className="block font-mono text-xs text-[#4B5563]">
                                    {p.phone}
                                  </span>
                                )}
                                {p.lastSmsAt && (
                                  <span
                                    className="block text-xs font-semibold text-lime-deep"
                                    data-testid="prospect-sms-sent"
                                  >
                                    {t.smsSent(dayMonth.format(new Date(p.lastSmsAt)))}
                                  </span>
                                )}
                                {p.website && (
                                  <a
                                    href={p.website}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="block truncate text-xs font-semibold text-lime-deep underline-offset-4 hover:underline"
                                  >
                                    {t.website} ·{" "}
                                    {p.website.replace(
                                      /^https?:\/\/(www\.)?/,
                                      "",
                                    )}
                                  </a>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <span className="block font-mono text-[13px]">
                                  {p.airportCode ?? "—"}
                                </span>
                                {p.region && (
                                  <span className="block text-xs text-muted-foreground">
                                    {p.region.label}
                                    {p.region.manual && ` · ${t.regionManual}`}
                                  </span>
                                )}
                                {p.language !== "fr" && (
                                  <span
                                    title={t.languageOf(
                                      t.languages[p.language],
                                    )}
                                    className="mt-0.5 inline-block rounded-full bg-info-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-info-text"
                                  >
                                    {t.languageShort(p.language)}
                                  </span>
                                )}
                              </td>
                              <td
                                className="max-w-[200px] px-2 py-2"
                                data-testid="prospect-tool"
                              >
                                <ToolCell prospect={p} />
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={cn(
                                    "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                                    state.tone,
                                  )}
                                >
                                  {state.text}
                                </span>
                                <StateMarks prospect={p} />
                                <StatusNote prospect={p} />
                                {p.failedAttempts > 0 && (
                                  <span className="mt-1 block text-xs text-destructive">
                                    {t.failed(p.failedAttempts)}
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-[13px] text-[#4B5563]">
                                {nextLabel(p)}
                              </td>
                              <td className="px-2 py-2">
                                <DemoCell
                                  prospect={p}
                                  onShow={(link) =>
                                    setDemoPanel({
                                      company: p.companyName,
                                      link,
                                    })
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <RowActions
                                  prospect={p}
                                  onEdit={() =>
                                    setDialog({ kind: "edit", prospect: p })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {t.chosen(chosen.length)}
            </p>
            {chosen.length > 0 && (
              <BulkMarks
                ids={chosen.map((p) => p.id)}
                onDone={() => setSelected(new Set())}
              />
            )}
          </div>
        </section>
        <div ref={panelRef} className="scroll-mt-4">
          <SendPanel
            chosen={chosen}
            settings={settings.data?.data}
            today={list.data?.today}
            configured={!!list.data?.configured}
            onEdit={() => setDialog({ kind: "steps" })}
            onSent={() => setSelected(new Set())}
          />
        </div>
      </div>

      {dialog?.kind === "add" && (
        <ProspectForm
          prospect={null}
          regions={regions}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "edit" && (
        <ProspectForm
          prospect={dialog.prospect}
          regions={regions}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "import" && (
        <ImportDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "sms" && (
        <SmsDialog
          prospects={textable}
          today={list.data?.sms}
          window={list.data?.window}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "steps" && settings.data && (
        <StepsEditor
          settings={settings.data.data}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

/** 15/11/2026: the software seen at the parking, its detail beneath (whole text in the tooltip). */
function ToolCell({ prospect }: { prospect: Prospect }) {
  if (!prospect.tool && !prospect.toolDetail)
    return <span className="text-muted-foreground">—</span>;
  const tool = (prospect.tool ?? "").replace(/^[^\p{L}\p{N}]+/u, "");
  return (
    <span
      title={[tool, prospect.toolDetail].filter(Boolean).join(" · ")}
      className="block"
    >
      {tool && (
        <span
          className={cn(
            "inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
            t.noTool(tool)
              ? "bg-ok-soft text-ok-text"
              : "bg-panel-2 text-[#4B5563]",
          )}
        >
          {tool}
        </span>
      )}
      {prospect.toolDetail && (
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {prospect.toolDetail}
        </span>
      )}
    </span>
  );
}

/** 16/11/2026: one filter of the bar; outlined in green while it filters. */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="contents">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 rounded-[10px] border px-3 text-sm",
          value
            ? "border-lime-deep bg-[#F1F8E6] font-semibold text-lime-deep"
            : "border-panel-line bg-white",
        )}
      >
        {children}
      </select>
    </label>
  );
}

/** The states a prospect is « marked » in (17/11/2026): the row's thumbs and « Remettre à contacter » undo them. */
const MARKED: ProspectStatus[] = ["replied", "interested", "not_interested"];

function useProspectsRefresh() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
}

/**
 * 👍 / 👎 next to the state (17/11/2026, « pouvoir marquer des prospects comme intéressés ou non »): one click marks; a
 * click on the lit one puts the prospect back (« À contacter », or « Contacté » once a mail left).
 */
function StateMarks({ prospect }: { prospect: Prospect }) {
  const refresh = useProspectsRefresh();
  const mark = useMutation({
    mutationFn: (status: "interested" | "not_interested" | "reopen") =>
      adminApi.setProspectStatus(prospect.id, status),
    onSuccess: (_, status) => {
      if (status === "reopen") toast.success(t.reopened);
      return refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  if (prospect.status === "unsubscribed") return null;
  const name = prospect.companyName;
  const button = (
    lit: boolean,
    status: "interested" | "not_interested",
    label: string,
    Icon: typeof ThumbsUp,
    litClass: string,
  ) => (
    <button
      type="button"
      aria-pressed={lit}
      aria-label={lit ? t.unmark(name) : label}
      title={lit ? t.unmark(name) : label}
      disabled={mark.isPending}
      onClick={() => mark.mutate(lit ? "reopen" : status)}
      data-testid={`prospect-${status}-${prospect.id}`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        lit
          ? litClass
          : "border-panel-line bg-white text-muted-foreground hover:border-lime-deep hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
  return (
    <span className="ml-1.5 inline-flex gap-1 align-middle">
      {button(
        prospect.status === "interested",
        "interested",
        t.markInterested(name),
        ThumbsUp,
        "border-lime-deep bg-lime text-lime-ink",
      )}
      {button(
        prospect.status === "not_interested",
        "not_interested",
        t.markNotInterested(name),
        ThumbsDown,
        "border-warn-text/40 bg-warn-soft text-warn-text",
      )}
    </span>
  );
}

/** The note on why, under the state (17/11/2026): « + Note » opens a field, a click on the note edits it. */
function StatusNote({ prospect }: { prospect: Prospect }) {
  const refresh = useProspectsRefresh();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(prospect.statusNote ?? "");
  const save = useMutation({
    mutationFn: (note: string) => adminApi.setProspectNote(prospect.id, note),
    onSuccess: () => {
      setEditing(false);
      return refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const note = prospect.statusNote ?? "";
  if (!editing) {
    return note ? (
      <button
        type="button"
        onClick={() => {
          setText(note);
          setEditing(true);
        }}
        aria-label={t.editNote(prospect.companyName)}
        className="mt-1 block max-w-[220px] text-left text-xs text-muted-foreground hover:text-foreground"
        data-testid={`prospect-note-${prospect.id}`}
      >
        {note}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setText("");
          setEditing(true);
        }}
        className="mt-1 block text-xs font-semibold text-lime-deep hover:underline"
        data-testid={`prospect-add-note-${prospect.id}`}
      >
        {t.addNote}
      </button>
    );
  }
  const tooLong = text.trim().length > 300;
  return (
    <form
      className="mt-1 flex max-w-[240px] flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!tooLong) save.mutate(text);
      }}
    >
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label={t.noteLabel(prospect.companyName)}
        placeholder={t.notePlaceholder}
        className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
        data-testid={`prospect-note-input-${prospect.id}`}
      />
      {tooLong && <span className="text-xs text-destructive">{t.noteTooLong}</span>}
      <span className="flex gap-1">
        <Button type="submit" size="sm" className="h-8" disabled={save.isPending || tooLong}>
          {t.noteSave}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>
          {t.noteCancel}
        </Button>
      </span>
    </form>
  );
}

/** « Intéressés » / « Pas intéressés » for the ticked prospects (17/11/2026). */
function BulkMarks({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const refresh = useProspectsRefresh();
  const mark = useMutation({
    mutationFn: (status: "interested" | "not_interested") =>
      adminApi.setProspectStatuses(ids, status),
    onSuccess: (r) => {
      toast.success(t.bulkDone(r.updated, r.skipped));
      onDone();
      return refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  return (
    <span className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9"
        disabled={mark.isPending}
        onClick={() => mark.mutate("interested")}
        data-testid="bulk-interested"
      >
        <ThumbsUp className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.bulkInterested}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9"
        disabled={mark.isPending}
        onClick={() => mark.mutate("not_interested")}
        data-testid="bulk-not-interested"
      >
        <ThumbsDown className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.bulkNotInterested}
      </Button>
    </span>
  );
}
