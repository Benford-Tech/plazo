import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { LISTING_TONE, percent, shortDate } from "@/lib/platform";
import type { InvitationResult, PlatformOperator } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.operators;

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";
const inputClass = "h-11 w-full border border-border bg-background px-3 text-base outline-none focus-visible:border-primary aria-[invalid=true]:border-destructive";
const ghostButton = "min-h-10 whitespace-nowrap border border-border px-3 text-base hover:bg-accent disabled:opacity-50";

function ListingCell({ operator }: { operator: PlatformOperator }) {
  if (operator.invitation || !operator.listing) return <span className="text-muted-foreground">{operator.invitation ? "—" : t.noListing}</span>;
  return (
    <span className={LISTING_TONE[operator.listing.status]}>
      <span aria-hidden="true">● </span>
      {fr.listingStatus[operator.listing.status]}
    </span>
  );
}

function PaymentsCell({ operator }: { operator: PlatformOperator }) {
  if (operator.invitation) return <span className="text-muted-foreground">—</span>;
  const { connected, payoutsEnabled } = operator.payments;
  if (connected && payoutsEnabled) return <span className="text-success">{t.paymentsActive}</span>;
  if (connected) return <span className="text-warn">{t.paymentsToActivate}</span>;
  return <span className="text-muted-foreground">{t.paymentsNone}</span>;
}

function CommissionCell({ operator, defaultBps }: { operator: PlatformOperator; defaultBps: number | null }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const save = useMutation({
    mutationFn: (bps: number | null) => adminApi.setCommission(operator.id, bps),
    onSuccess: () => {
      toast.success(t.commissionSaved);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["platform", "operators"] });
    },
    onError: (err: Error) => {
      setError(err instanceof ApiError ? (err.fields?.commissionBps ?? err.code) : undefined);
      toast.error(describeError(err));
    },
  });

  if (!editing) {
    const label =
      operator.commissionBps !== null ? `${percent(operator.commissionBps)} %` : defaultBps !== null ? t.defaultCommission(percent(defaultBps)) : t.noCommission;
    return (
      <button
        type="button"
        aria-label={t.editCommission(operator.name)}
        onClick={() => {
          setValue(operator.commissionBps !== null ? percent(operator.commissionBps) : "");
          setError(undefined);
          setEditing(true);
        }}
        className="font-mono text-primary underline-offset-4 hover:underline"
      >
        {label}
      </button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = value.trim().replace(",", ".");
    if (!raw) return save.mutate(null);
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 50) return setError("commission_range");
    save.mutate(Math.round(pct * 100));
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <label htmlFor={`commission-${operator.id}`} className="sr-only">
        {t.commissionLabel}
      </label>
      <input
        id={`commission-${operator.id}`}
        autoFocus
        inputMode="decimal"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={defaultBps !== null ? percent(defaultBps) : ""}
        title={t.commissionHelp}
        aria-invalid={!!error}
        className={cn(inputClass, "h-10 w-16 px-2 font-mono")}
      />
      <span className="text-muted-foreground">%</span>
      <button type="submit" disabled={save.isPending} className={cn(ghostButton, "border-primary text-primary")}>
        {t.save}
      </button>
      <button type="button" onClick={() => setEditing(false)} className={ghostButton}>
        {t.cancel}
      </button>
      {error && <span className="text-sm text-destructive">{errorMessage(error)}</span>}
    </form>
  );
}

function InviteLink({ result, onClose }: { result: InvitationResult; onClose: () => void }) {
  const url = result.inviteUrl?.startsWith("/") ? `${window.location.origin}${result.inviteUrl}` : (result.inviteUrl ?? "");
  return (
    <div role="alert" className="flex flex-col gap-2 border border-primary p-4">
      <span className="font-bold uppercase tracking-wide text-primary">{t.linkTitle}</span>
      <p className="text-base">{t.linkWarning}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} aria-label={t.linkTitle} onFocus={e => e.currentTarget.select()} className={cn(inputClass, "font-mono text-sm")} />
        <button
          type="button"
          className="min-h-11 shrink-0 bg-primary px-4 font-bold uppercase tracking-wide text-primary-foreground"
          onClick={() =>
            navigator.clipboard?.writeText(url).then(
              () => toast.success(t.copied),
              () => toast.error(fr.errors.unknown),
            )
          }
        >
          {t.copy}
        </button>
        <button type="button" onClick={onClose} className={cn(ghostButton, "min-h-11")}>
          {t.close}
        </button>
      </div>
    </div>
  );
}

const emptyInvite = { operatorName: "", managerEmail: "", totalCapacity: "", commission: "" };

function InviteForm({ defaultBps, onInvited }: { defaultBps: number | null; onInvited: (result: InvitationResult) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyInvite);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const invite = useMutation({
    mutationFn: () => {
      const commission = form.commission.trim().replace(",", ".");
      return adminApi.inviteOperator({
        operatorName: form.operatorName,
        managerEmail: form.managerEmail,
        totalCapacity: Number(form.totalCapacity),
        commissionBps: commission ? Math.round(Number(commission) * 100) : null,
      });
    },
    onSuccess: result => {
      setForm(emptyInvite);
      setFieldErrors({});
      if (result.emailSent) toast.success(t.invited);
      onInvited(result);
      queryClient.invalidateQueries({ queryKey: ["platform", "operators"] });
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? (err.code === "email_taken" ? { managerEmail: "email_taken" } : {})) : {});
      toast.error(describeError(err));
    },
  });
  const field = (key: keyof typeof emptyInvite, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const errorKey = key === "commission" ? "commissionBps" : key;
    return (
      <div>
        <label htmlFor={`invite-${key}`} className="sr-only">
          {label}
        </label>
        <input
          id={`invite-${key}`}
          placeholder={label}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          aria-invalid={!!fieldErrors[errorKey]}
          className={inputClass}
          {...props}
        />
        {fieldErrors[errorKey] && <p className="mt-1 text-sm text-destructive">{errorMessage(fieldErrors[errorKey])}</p>}
      </div>
    );
  };

  return (
    <form
      id="inviter"
      className="flex flex-col gap-2.5 border border-border p-4"
      onSubmit={e => {
        e.preventDefault();
        invite.mutate();
      }}
    >
      <h2 className={labelClass}>{t.inviteTitle}</h2>
      {field("operatorName", t.inviteName, { required: true, maxLength: 80 })}
      {field("managerEmail", t.inviteEmail, { required: true, type: "email", autoComplete: "off" })}
      {field("totalCapacity", t.inviteCapacity, { required: true, inputMode: "numeric" })}
      {field("commission", t.inviteCommission(defaultBps !== null ? percent(defaultBps) : null), { inputMode: "decimal" })}
      <button
        type="submit"
        disabled={invite.isPending}
        className="min-h-11 self-start bg-primary px-4 text-base font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {t.inviteSubmit}
      </button>
      <p className="text-sm text-muted-foreground">{t.inviteHelp}</p>
    </form>
  );
}

function RowActions({ operator, onLink }: { operator: PlatformOperator; onLink: (result: InvitationResult) => void }) {
  const { startViewAs } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "operators"] });
  const open = useMutation({
    mutationFn: () => startViewAs(operator.id),
    onSuccess: () => {
      // Nothing cached from the platform or the admin's own space may show in the operator's.
      queryClient.clear();
      navigate("/");
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const resend = useMutation({
    mutationFn: () => adminApi.resendInvitation(operator.id),
    onSuccess: result => {
      if (result.emailSent) toast.success(t.resent);
      onLink(result);
      refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const suspension = useMutation({
    mutationFn: () => (operator.status === "active" ? adminApi.suspendOperator(operator.id) : adminApi.reactivateOperator(operator.id)),
    onSuccess: () => {
      toast.success(operator.status === "active" ? t.suspended : t.reactivated);
      refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  if (operator.invitation) {
    return (
      <button type="button" className={ghostButton} disabled={resend.isPending} onClick={() => resend.mutate()}>
        {t.resend}
      </button>
    );
  }
  return (
    <div className="flex justify-end gap-1.5">
      <button type="button" className={ghostButton} disabled={open.isPending} onClick={() => open.mutate()}>
        {t.open}
      </button>
      {!operator.isPlatform && (
        <button
          type="button"
          className={cn(ghostButton, operator.status === "active" ? "text-muted-foreground hover:text-destructive" : "border-primary text-primary")}
          disabled={suspension.isPending}
          onClick={() => {
            if (operator.status === "active" && !window.confirm(t.confirmSuspend(operator.name))) return;
            suspension.mutate();
          }}
        >
          {operator.status === "active" ? t.suspend : t.reactivate}
        </button>
      )}
    </div>
  );
}

function subline(o: PlatformOperator): string {
  if (o.invitation) return o.invitation.expired ? t.invitationExpired(shortDate.format(new Date(o.invitation.sentAt))) : t.invitedOn(shortDate.format(new Date(o.invitation.sentAt)));
  if (o.status === "suspended" && o.suspendedAt) return t.suspendedOn(shortDate.format(new Date(o.suspendedAt)));
  const base = t.parkingsPlaces(o.parkings, o.places);
  return o.isPlatform ? `${base} · ${t.platformAccount}` : base;
}

/** "Loueurs" tab: every operator, its figures and the actions on it, plus the invitation form. */
export default function OperatorsPage() {
  const operators = useQuery({ queryKey: ["platform", "operators"], queryFn: adminApi.getPlatformOperators });
  const [link, setLink] = useState<InvitationResult | null>(null);
  const defaultBps = operators.data?.defaultCommissionBps ?? null;
  const showLink = (result: InvitationResult) => setLink(result.inviteUrl ? result : null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold uppercase tracking-[0.03em]">{t.title}</h1>
        <a
          href="#inviter"
          onClick={e => {
            e.preventDefault();
            document.getElementById("invite-operatorName")?.focus();
          }}
          className="flex min-h-11 items-center bg-primary px-4 text-base font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110"
        >
          {t.invite}
        </a>
      </div>

      {link && <InviteLink result={link} onClose={() => setLink(null)} />}

      {operators.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : operators.error ? (
        <p className="text-destructive">{describeError(operators.error)}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-base">
            <thead>
              <tr className="border-b border-border text-left">
                {[t.colOperator, t.colManager, t.colListing, t.colPayments, t.colCommission, t.colBookings, ""].map((h, i) => (
                  <th key={i} scope="col" className={cn(labelClass, "whitespace-nowrap px-2 py-2 font-normal")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.data?.operators.map(o => (
                <tr key={o.id} className={cn("border-b border-border align-middle", o.status === "suspended" && "opacity-70")}>
                  <td className="px-2 py-3">
                    <span className="font-bold">{o.name}</span>
                    {o.isDemo && (
                      <span title={t.demoHint} className="ml-2 border border-border px-1.5 text-xs font-bold uppercase text-muted-foreground">
                        {t.statusDemo}
                      </span>
                    )}
                    {o.status === "suspended" && (
                      <span className="ml-2 border border-destructive px-1.5 text-xs font-bold uppercase text-destructive">{t.statusSuspended}</span>
                    )}
                    <br />
                    <span className={labelClass}>{subline(o)}</span>
                  </td>
                  <td className="max-w-[13rem] px-2 py-3">
                    <span className="block truncate" title={o.manager?.email}>
                      {o.manager?.email ?? "—"}
                    </span>
                    {o.manager && !o.manager.emailVerified && !o.invitation && <span className={labelClass}>{t.emailToConfirm}</span>}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <ListingCell operator={o} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <PaymentsCell operator={o} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <CommissionCell operator={o} defaultBps={defaultBps} />
                  </td>
                  <td className="px-2 py-3 font-mono">{o.invitation ? "—" : o.bookingsThisMonth}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right">
                    <RowActions operator={o} onLink={showLink} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operators.data?.operators.length === 0 && <p className="py-6 text-muted-foreground">{t.empty}</p>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <InviteForm defaultBps={defaultBps} onInvited={showLink} />
        <div className="flex flex-col gap-2.5 border border-border p-4">
          <h2 className={labelClass}>{t.canDoTitle}</h2>
          <ul className="space-y-1 text-base leading-relaxed">
            {t.canDo.map(item => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
