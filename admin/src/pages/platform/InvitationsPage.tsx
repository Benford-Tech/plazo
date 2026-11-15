import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { PlatformInvitation } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.invitations;
const VIEWS = ["all", "not_opened", "not_clicked", "no_app"] as const;
const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
const td = "border-t border-border px-3 py-2.5 align-top";

/** One step of the path: a green dot and what happened, or a grey dash. */
function Step({ done, children, testId }: { done: boolean; children?: ReactNode; testId?: string }) {
  return (
    <div className="flex items-start gap-1.5 text-sm" data-testid={testId}>
      <span
        aria-hidden
        className={cn("mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full", done ? "bg-ok" : "border border-border bg-transparent")}
      />
      <span className={cn("min-w-0", !done && "text-muted-foreground")}>{done ? children : "—"}</span>
    </div>
  );
}

const device = (d: string | null | undefined) => (d ? (t.devices[d] ?? d) : null);

function Row({ i }: { i: PlatformInvitation }) {
  return (
    <tr data-testid={`invitation-${i.staff.id}`}>
      <td className={td}>
        <div className="font-semibold">{i.staff.name || i.staff.email}</div>
        <div className="text-xs text-muted-foreground">{i.staff.email}</div>
        <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
          <span className="rounded-full bg-panel-2 px-2 py-0.5 font-semibold">{t.roles[i.staff.role] ?? i.staff.role}</span>
          <span className="rounded-full bg-panel-2 px-2 py-0.5">{t.kinds[i.kind]}</span>
          {!i.staff.isActive && <span className="rounded-full bg-bad-soft px-2 py-0.5 text-bad-text">{t.inactive}</span>}
        </div>
      </td>
      <td className={td}>
        <Link to={`/plateforme/loueurs/${i.operator.id}`} className="text-sm font-semibold text-lime-deep hover:underline">
          {i.operator.name}
        </Link>
      </td>
      <td className={td}>
        {i.emailSent ? (
          <Step done>
            <span className="font-mono tabular-nums">{dateTimeShort(i.sentAt)}</span>
            {i.sends > 1 && <span className="block text-xs text-muted-foreground">{t.sends(i.sends)}</span>}
          </Step>
        ) : (
          <span className="text-sm font-semibold text-warn-text">{t.notSent}</span>
        )}
      </td>
      <td className={td}>
        <Step done={!!i.opened} testId="step-opened">
          {i.opened && (
            <>
              <span className="font-mono tabular-nums">{dateTimeShort(i.opened.at)}</span>
              <span className="block text-xs text-muted-foreground">
                {[device(i.opened.device), t.opened(i.opened.count), t.approx].filter(Boolean).join(" · ")}
              </span>
            </>
          )}
        </Step>
      </td>
      <td className={td}>
        <Step done={!!i.clicked} testId="step-clicked">
          {i.clicked && (
            <>
              <span className="font-mono tabular-nums">{dateTimeShort(i.clicked.at)}</span>
              <span className="block text-xs text-muted-foreground">
                {[device(i.clicked.device), i.store?.store ? t.store[i.store.store] : null, i.demoAt ? t.demo : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </>
          )}
        </Step>
      </td>
      <td className={td}>
        <Step done={!!i.passwordSetAt}>{i.passwordSetAt && <span className="font-mono tabular-nums">{dateTimeShort(i.passwordSetAt)}</span>}</Step>
      </td>
      <td className={td}>
        <Step done={!!i.app} testId="step-app">
          {i.app && (
            <>
              <span className="font-semibold">{t.platforms[i.app.platform ?? "app"] ?? t.platforms.app}</span>
              <span className="block font-mono text-xs tabular-nums text-muted-foreground">{dateTimeShort(i.app.at)}</span>
            </>
          )}
        </Step>
        {i.web && (
          <div className="mt-1 text-xs text-muted-foreground">
            {t.web} · {[device(i.web.device), dateTimeShort(i.web.at)].filter(Boolean).join(" · ")}
          </div>
        )}
      </td>
    </tr>
  );
}

/**
 * Plateforme › Invitations (15/11/2026, « traquer les ouvertures de mail d'invitation, par qui, sur quel support, s'ils
 * téléchargent l'app »): the last invitation of each invited person, manager or team member, and each step that followed.
 */
export default function InvitationsPage() {
  const [view, setView] = useState<(typeof VIEWS)[number]>("all");
  const query = useQuery({ queryKey: ["platform", "invitations", view], queryFn: () => adminApi.getPlatformInvitations(view) });
  const r = query.data;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={v === view}
            data-testid={`invitations-view-${v}`}
            onClick={() => setView(v)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              v === view ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {t.views[v]}
            {r ? ` · ${r.counts[v]}` : ""}
          </button>
        ))}
      </div>
      {query.error ? (
        <p className="text-destructive">{describeError(query.error) || t.loadError}</p>
      ) : !r ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : r.data.length === 0 ? (
        <p className="rounded-[14px] border border-border bg-card p-5 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr>
                {Object.values(t.columns).map((c) => (
                  <th key={c} className={th}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.data.map((i) => (
                <Row key={i.id} i={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t.note}</p>
    </div>
  );
}
