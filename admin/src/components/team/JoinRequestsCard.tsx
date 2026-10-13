import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, ConciergeBell, KeyRound, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { ApiError, adminApi } from "@/lib/api";
import { dateTimeShort, localParts, timeAgo, timeOf } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { JoinRequest, JoinRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SignInBadge } from "./SignInBadge";

const t = fr.team.requests;
const JOIN_ROLES: { role: JoinRole; icon: LucideIcon }[] = [
  { role: "agent", icon: ConciergeBell },
  { role: "driver", icon: Bus },
  { role: "valet", icon: KeyRound },
];
/** New requests show up while the page is open. */
const POLL_MS = 30_000;

const fullName = (r: JoinRequest) => `${r.firstName} ${r.lastName}`.trim();

/** « à 09:38 » today, « le mar. 13 oct., 09:38 » before. */
function sentWhen(iso: string, now = new Date()): string {
  return localParts(iso).date === localParts(now.toISOString()).date ? `à ${timeOf(iso)}` : `le ${dateTimeShort(iso)}`;
}

/** The request is gone (cancelled, expired, already answered): the list is read again. */
const isClosed = (err: unknown) => err instanceof ApiError && (err.code === "join_request_closed" || err.code === "not_found");

/** Accepting a request: the role, preset to the post the person asked for (never « Gérant », promoted later in Équipe). */
function AcceptDialog({ request, onClose }: { request: JoinRequest; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<JoinRole>(request.wishedRole);
  const chosen = useRef<HTMLInputElement>(null);
  const name = fullName(request);

  const accept = useMutation({
    mutationFn: () => adminApi.acceptJoinRequest(request.id, role),
    onSuccess: () => {
      toast.success(t.accepted(name, t.roles[role].label));
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(describeError(err, t.errors));
      if (isClosed(err)) {
        void queryClient.invalidateQueries({ queryKey: ["join-requests"] });
        onClose();
      }
    },
  });

  // The parent re-renders on each poll: focus once, and read the latest onClose through a ref.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    chosen.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-accept-title"
        aria-describedby="join-accept-sub"
        onClick={e => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-t-[22px] bg-card p-5 shadow-2xl sm:rounded-[var(--radius)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="join-accept-title" className="font-narrow text-xl font-bold leading-tight">
              {t.dialogTitle(name)}
            </h2>
            <p id="join-accept-sub" className="break-all text-sm text-muted-foreground">
              {request.email} · {t.sentAt(sentWhen(request.createdAt))}
            </p>
          </div>
          <button
            type="button"
            aria-label={t.cancel}
            onClick={onClose}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border border-panel-line hover:bg-panel-2"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={e => {
            e.preventDefault();
            accept.mutate();
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{t.roleLabel}</legend>
            {JOIN_ROLES.map(({ role: value, icon: Icon }) => {
              const on = value === role;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 focus-within:ring-2 focus-within:ring-ring",
                    on ? "border-[1.5px] border-lime-deep" : "border-panel-line hover:bg-panel-2",
                  )}
                >
                  <input
                    ref={on ? chosen : undefined}
                    type="radio"
                    name="join-role"
                    value={value}
                    checked={on}
                    onChange={() => setRole(value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn("flex h-8 w-8 flex-none items-center justify-center rounded-lg", on ? "bg-lime-deep text-white" : "bg-[#EEF8DC] text-lime-deep")}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-narrow text-[15px] font-bold leading-tight">{t.roles[value].label}</span>
                    <span className="block text-xs text-muted-foreground">{t.roles[value].help}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn("h-4 w-4 flex-none rounded-full", on ? "border-[5px] border-lime-deep bg-white" : "border-[1.5px] border-gray-300")}
                  />
                </label>
              );
            })}
          </fieldset>
          <p className="text-xs text-muted-foreground">{t.roleHelp}</p>
          <Button type="submit" className="mt-1 h-11 rounded-full text-[15px] font-semibold" disabled={accept.isPending}>
            {t.confirm(t.roles[role].label)}
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * 13/10/2026: the people who typed the code of the day and wait for a manager. Shown only when there are some.
 * `readOnly` (the platform in consultation, outside its own account): seen, not answered.
 */
export function JoinRequestsCard({ readOnly }: { readOnly: boolean }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState<JoinRequest | null>(null);
  const { data } = useQuery({ queryKey: ["join-requests"], queryFn: adminApi.getJoinRequests, refetchInterval: POLL_MS });

  const refuse = useMutation({
    mutationFn: (request: JoinRequest) => adminApi.refuseJoinRequest(request.id),
    onSuccess: (_answer, request) => {
      toast.success(t.refused(fullName(request)));
      void queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      toast.error(describeError(err, t.errors));
      if (isClosed(err)) void queryClient.invalidateQueries({ queryKey: ["join-requests"] });
    },
  });

  const requests = data?.data ?? [];
  if (requests.length === 0) return null;

  const askRefuse = async (request: JoinRequest) => {
    const ok = await confirm(t.refuseConfirm(fullName(request)), { title: t.refuseTitle, confirmLabel: t.refuse, destructive: true });
    if (ok) refuse.mutate(request);
  };

  return (
    <section aria-labelledby="join-requests-title" data-testid="join-requests" className="rounded-[var(--radius)] border bg-card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="join-requests-title" className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {t.title}
        </h2>
        <Badge tone="warn" className="font-sans">
          <span aria-hidden="true">{requests.length}</span>
          <span className="sr-only">{t.count(requests.length)}</span>
        </Badge>
      </div>
      <ul>
        {requests.map(r => {
          const name = fullName(r);
          return (
            <li key={r.id} data-testid={`join-request-${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-panel-line py-3 first:border-t-0">
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold">{name}</p>
                <p className="break-all text-sm text-muted-foreground">
                  {r.email}
                  {r.isPrivateEmail && <span className="break-normal"> · {t.privateEmail}</span>}
                </p>
              </div>
              <span title={t.via(fr.team.signIn[r.provider])}>
                <SignInBadge method={r.provider} />
              </span>
              <span className="text-sm">{t.roles[r.wishedRole].label}</span>
              <span className="text-sm text-muted-foreground">{timeAgo(r.createdAt)}</span>
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-4"
                  aria-label={t.refuseLabel(name)}
                  disabled={readOnly || refuse.isPending}
                  onClick={() => void askRefuse(r)}
                >
                  {t.refuse}
                </Button>
                <Button type="button" className="h-10 rounded-full px-4" aria-label={t.acceptLabel(name)} disabled={readOnly} onClick={() => setAccepting(r)}>
                  {t.accept}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {accepting && <AcceptDialog request={accepting} onClose={() => setAccepting(null)} />}
    </section>
  );
}
