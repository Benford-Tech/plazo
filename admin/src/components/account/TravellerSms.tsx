import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-context";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { timeAgo } from "@/lib/datetime";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import { formatPhone, toE164 } from "@/lib/sms";
import type { SmsMode, SmsSettings, SmsStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const kicker =
  "text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const primaryButton =
  "min-h-11 bg-primary px-4 font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50";
const secondaryButton =
  "min-h-11 border border-border px-4 font-semibold hover:bg-accent disabled:opacity-50";
const MODES: SmsMode[] = ["gateway", "brevo", "none"];
const STATUS_POLL_MS = 60_000;

/**
 * « SMS aux voyageurs » (Mon compte): the operator chooses how its SMS go out — its own Android
 * phone through the free "SMS Gateway for Android" app, Plazo (Brevo, charged), or none — links the
 * phone and watches it. Managers only; read-only in a platform admin's view-as session (the API
 * refuses those writes too).
 */
export function TravellerSms() {
  const { user } = useAuth();
  const manager = can(user?.role, "parking:manage");
  const readOnly = !!user?.viewAs;
  const [editing, setEditing] = useState(false);
  const t = fr.sms;

  const settings = useQuery({
    queryKey: ["sms", "settings"],
    queryFn: adminApi.getSmsSettings,
    enabled: manager,
  });
  const linked = settings.data?.mode === "gateway" && !!settings.data.gateway;
  const status = useQuery({
    queryKey: ["sms", "status"],
    queryFn: adminApi.getSmsStatus,
    enabled: manager && linked,
    refetchInterval: STATUS_POLL_MS,
  });

  if (!manager || !settings.data) return null;
  const s = settings.data;

  return (
    <section aria-labelledby="sms-title" className="flex flex-col gap-3">
      <h2 id="sms-title" className="text-2xl font-semibold">
        {t.title}
      </h2>
      {linked && !editing ? (
        <LinkedBox
          settings={s}
          status={status.data}
          readOnly={readOnly}
          onEdit={() => setEditing(true)}
        />
      ) : s.mode === "brevo" && !editing ? (
        <ChannelBox
          kicker={t.kickerBrevo}
          text={t.brevoActive}
          readOnly={readOnly}
          onChange={() => setEditing(true)}
        />
      ) : (
        <SetupBox
          settings={s}
          readOnly={readOnly}
          onDone={() => setEditing(false)}
          onCancel={s.mode !== "none" ? () => setEditing(false) : undefined}
        />
      )}
      {!linked && <p className="text-sm text-muted-foreground">{t.footnote}</p>}
    </section>
  );
}

function ReadOnlyNote() {
  return <p className="text-sm text-muted-foreground">{fr.sms.readOnly}</p>;
}

/** The three channels as a radio group (arrows move and choose, like native radios). */
function ModeTiles({
  value,
  brevoAvailable,
  readOnly,
  onChange,
}: {
  value: SmsMode;
  brevoAvailable: boolean;
  readOnly: boolean;
  onChange: (mode: SmsMode) => void;
}) {
  const t = fr.sms;
  const modes = brevoAvailable ? MODES : MODES.filter((m) => m !== "brevo");
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const choose = (index: number) => {
    const next = modes[(index + modes.length) % modes.length];
    refs.current[modes.indexOf(next)]?.focus();
    if (!readOnly) onChange(next);
  };
  const onKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") choose(index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") choose(index - 1);
    else if (e.key === " " || e.key === "Enter") {
      if (!readOnly) onChange(modes[index]);
    } else return;
    e.preventDefault();
  };
  return (
    <div
      role="radiogroup"
      aria-label={t.title}
      aria-readonly={readOnly || undefined}
      className="grid gap-2 sm:grid-cols-3"
    >
      {modes.map((mode, i) => {
        const checked = mode === value;
        return (
          <div
            key={mode}
            ref={(el) => (refs.current[i] = el)}
            role="radio"
            aria-checked={checked}
            aria-disabled={readOnly || undefined}
            tabIndex={checked ? 0 : -1}
            onClick={() => !readOnly && onChange(mode)}
            onKeyDown={onKeyDown(i)}
            className={cn(
              "flex min-h-[68px] flex-col justify-center px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              checked
                ? "border-2 border-lime-deep px-[11px]"
                : "border border-border",
              readOnly ? "cursor-default" : "cursor-pointer hover:bg-accent",
            )}
          >
            <span className={cn("font-bold", checked && "text-lime-deep")}>
              {checked && <span aria-hidden="true">● </span>}
              {t.modes[mode].title}
            </span>
            <span className="text-[15px] leading-tight text-muted-foreground">
              {t.modes[mode].text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Before the phone is linked (or while changing the channel): choose, then link and test. */
function SetupBox({
  settings,
  readOnly,
  onDone,
  onCancel,
}: {
  settings: SmsSettings;
  readOnly: boolean;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const t = fr.sms;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SmsMode>(
    settings.mode === "brevo" ? "brevo" : "gateway",
  );
  const [login, setLogin] = useState(settings.gateway?.login ?? "");
  const [password, setPassword] = useState("");
  const [senderPhone, setSenderPhone] = useState(
    formatPhone(settings.gateway?.senderPhone ?? null),
  );
  const [testTo, setTestTo] = useState("");
  const [baseUrl, setBaseUrl] = useState(settings.gateway?.baseUrl ?? "");
  const [advanced, setAdvanced] = useState(!!settings.gateway?.baseUrl);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasStoredPassword =
    !!settings.gateway && settings.gateway.login === login.trim();

  const refresh = (data: SmsSettings) => {
    queryClient.setQueryData(["sms", "settings"], data);
    void queryClient.invalidateQueries({ queryKey: ["sms", "status"] });
  };

  const link = useMutation({
    mutationFn: async () => {
      const saved = await adminApi.updateSmsSettings({
        mode: "gateway",
        login: login.trim(),
        ...(password ? { password } : {}),
        senderPhone: toE164(senderPhone),
        baseUrl: advanced && baseUrl.trim() ? baseUrl.trim() : null,
      });
      refresh(saved);
      const to = testTo.trim() ? toE164(testTo) : null;
      if (!to)
        return {
          saved,
          test: null as null | { outcome: "sent" | "queued" },
          to,
        };
      try {
        return { saved, test: await adminApi.testSms(to), to };
      } catch (error) {
        // Linked, but the test did not go through: the linked state shows the error, the toast says why.
        toast.error(`${t.testFailed} ${describeError(error)}`);
        void queryClient.invalidateQueries({ queryKey: ["sms", "status"] });
        return { saved, test: null, to };
      }
    },
    onSuccess: ({ test, to }) => {
      setFieldErrors({});
      if (test && to)
        toast.success(
          test.outcome === "sent"
            ? t.testSent(formatPhone(to))
            : t.testQueued(formatPhone(to)),
        );
      else if (!to) toast.success(t.linked);
      onDone();
    },
    onError: (error: Error) => {
      setFieldErrors(error instanceof ApiError ? (error.fields ?? {}) : {});
      toast.error(describeError(error));
    },
  });

  const choose = useMutation({
    mutationFn: (next: "brevo" | "none") =>
      adminApi.updateSmsSettings({ mode: next }),
    onSuccess: (data) => {
      refresh(data);
      toast.success(t.saved);
      onDone();
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const busy = link.isPending || choose.isPending;
  const noAndroid = () => setMode(settings.brevoAvailable ? "brevo" : "none");

  return (
    <section
      data-testid="sms-setup"
      aria-labelledby="sms-setup-title"
      className="flex flex-col gap-3 border border-lime-deep p-4"
    >
      <p className={kicker}>{t.kickerSetup}</p>
      <h3 id="sms-setup-title" className="text-xl font-bold leading-tight">
        {t.headline}
      </h3>
      <p className="max-w-4xl text-base leading-snug text-muted-foreground">
        {t.intro}
      </p>
      <ModeTiles
        value={mode}
        brevoAvailable={settings.brevoAvailable}
        readOnly={readOnly}
        onChange={setMode}
      />
      {readOnly ? (
        <ReadOnlyNote />
      ) : mode === "gateway" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            link.mutate();
          }}
        >
          <ol className="flex flex-col gap-0.5 text-[15px] leading-relaxed">
            {t.steps.map((step, i) => (
              <li key={i}>
                <span className="font-bold text-lime-deep">{i + 1}.</span>{" "}
                {step.before}
                {step.strong && (
                  <span className="font-bold text-lime-deep">
                    {step.strong}
                  </span>
                )}
                {step.after}
              </li>
            ))}
          </ol>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="sms-login"
              label={t.login}
              placeholder={t.loginPlaceholder}
              autoComplete="off"
              autoCapitalize="characters"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              error={fieldErrors.login}
            />
            <FormField
              id="sms-password"
              label={t.password}
              type="password"
              autoComplete="new-password"
              required={!hasStoredPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              help={hasStoredPassword ? t.passwordKept : undefined}
            />
            <FormField
              id="sms-sender"
              label={t.senderPhone}
              type="tel"
              placeholder={t.phonePlaceholder}
              autoComplete="tel"
              required
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              error={fieldErrors.senderPhone}
            />
            <FormField
              id="sms-test-to"
              label={t.testRecipient}
              type="tel"
              placeholder={t.phonePlaceholder}
              autoComplete="off"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              error={fieldErrors.to}
            />
          </div>
          {advanced ? (
            <div className="max-w-xl">
              <FormField
                id="sms-base-url"
                label={t.advanced}
                type="url"
                placeholder="https://"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                error={fieldErrors.baseUrl}
                help={t.advancedHelp}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdvanced(true)}
              className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t.advanced}
            </button>
          )}
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" disabled={busy} className={primaryButton}>
              {link.isPending ? t.linking : t.link}
            </button>
            <button
              type="button"
              onClick={noAndroid}
              disabled={busy}
              className={secondaryButton}
            >
              {t.noAndroid}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="min-h-11 px-3 text-muted-foreground underline-offset-4 hover:underline"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="max-w-4xl text-base leading-snug">
            {mode === "brevo" ? t.brevoActive : t.noneActive}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => choose.mutate(mode)}
              disabled={busy || settings.mode === mode}
              className={primaryButton}
            >
              {t.chooseOther}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="min-h-11 px-3 text-muted-foreground underline-offset-4 hover:underline"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** The phone is linked: status, counters, test, edit, disable. */
function LinkedBox({
  settings,
  status,
  readOnly,
  onEdit,
}: {
  settings: SmsSettings;
  status?: SmsStatus;
  readOnly: boolean;
  onEdit: () => void;
}) {
  const confirm = useConfirm();
  const t = fr.sms;
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const gateway = settings.gateway!;

  const test = useMutation({
    mutationFn: (to: string) => adminApi.testSms(to),
    onSuccess: ({ outcome }, to) => {
      toast.success(
        outcome === "sent"
          ? t.testSent(formatPhone(to))
          : t.testQueued(formatPhone(to)),
      );
      setTesting(false);
      setTestTo("");
    },
    onError: (error) => toast.error(`${t.testFailed} ${describeError(error)}`),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ["sms", "status"] }),
  });
  const disable = useMutation({
    mutationFn: () => adminApi.disableSms(),
    onSuccess: (data) => {
      queryClient.setQueryData(["sms", "settings"], data);
      toast.success(t.disabled);
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const statusLine = status?.lastSentAt
    ? t.lastSent(timeAgo(status.lastSentAt))
    : t.neverSent;
  const counters = [
    t.monthSent(status?.month.sent ?? 0),
    t.monthFailed(status?.month.failed ?? 0),
  ];
  if (status?.pending)
    counters.push(
      `${t.pending(status.pending)}${status.pendingStale ? ` · ${t.pendingStale}` : ""}`,
    );

  return (
    <section
      data-testid="sms-linked"
      aria-labelledby="sms-linked-title"
      className="flex flex-col gap-2.5 border border-border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p id="sms-linked-title" className={kicker}>
          {t.kickerGateway}
        </p>
        <p
          className={cn(
            "font-semibold",
            status?.pendingStale ? "text-lime-deep" : "text-success",
          )}
        >
          <span aria-hidden="true">● </span>
          {t.linkedStatus} · {statusLine}
        </p>
      </div>
      <p className="text-base">
        {t.sender}{" "}
        <span className="font-mono">{formatPhone(gateway.senderPhone)}</span> ·{" "}
        {counters.join(" · ")}
      </p>
      {status?.lastError && (
        <p className="text-sm text-lime-deep">
          {t.lastError(status.lastErrorAt ? timeAgo(status.lastErrorAt) : "")}{" "}
          {errorMessage(status.lastError)}
        </p>
      )}
      {readOnly ? (
        <ReadOnlyNote />
      ) : testing ? (
        <form
          className="flex flex-wrap items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            test.mutate(toE164(testTo));
          }}
        >
          <div className="w-64">
            <FormField
              id="sms-test-to"
              label={t.sendTestTo}
              type="tel"
              placeholder={t.phonePlaceholder}
              required
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={test.isPending}
            className={primaryButton}
          >
            {t.send}
          </button>
          <button
            type="button"
            onClick={() => setTesting(false)}
            disabled={test.isPending}
            className={secondaryButton}
          >
            {t.cancel}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setTesting(true)}
            className={secondaryButton}
          >
            {t.sendTest}
          </button>
          <button type="button" onClick={onEdit} className={secondaryButton}>
            {t.edit}
          </button>
          <button
            type="button"
            onClick={() =>
              void confirm(t.disableConfirm, { destructive: true }).then(
                (ok) => ok && disable.mutate(),
              )
            }
            disabled={disable.isPending}
            className={secondaryButton}
          >
            {t.disable}
          </button>
        </div>
      )}
      <p className="text-sm text-warn">
        <span aria-hidden="true">⚠ </span>
        {t.offlineWarning}
      </p>
    </section>
  );
}

/** Brevo chosen: a line with the channel and a way to change it. */
function ChannelBox({
  kicker: title,
  text,
  readOnly,
  onChange,
}: {
  kicker: string;
  text: string;
  readOnly: boolean;
  onChange: () => void;
}) {
  const t = fr.sms;
  return (
    <section
      data-testid="sms-channel"
      className="flex flex-col gap-2.5 border border-border p-4"
    >
      <p className={kicker}>{title}</p>
      <p className="text-base">{text}</p>
      {readOnly ? (
        <ReadOnlyNote />
      ) : (
        <button
          type="button"
          onClick={onChange}
          className={cn(secondaryButton, "self-start")}
        >
          {t.changeChannel}
        </button>
      )}
    </section>
  );
}
