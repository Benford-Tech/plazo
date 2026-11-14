import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import {
  OperatorContractPanel,
  ContractPill,
} from "@/components/platform/OperatorContractPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { shortDate } from "@/lib/platform";
import type { InvitationResult, PlatformOperatorDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CommissionCell,
  ListingCell,
  PaymentsCell,
  RowActions,
} from "./OperatorsPage";
import { KindPill, OperatorStatePill } from "./operator-bits";
import { OperatorWhatsappPanel } from "@/components/platform/OperatorWhatsappPanel";

const t = fr.platform.operatorPage;
const TABS = [
  "vue",
  "annonce",
  "paiements",
  "contrat",
  "whatsapp",
  "equipe",
  "journal",
] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  vue: t.tabs.overview,
  annonce: t.tabs.listing,
  paiements: t.tabs.payments,
  contrat: t.tabs.contract,
  whatsapp: t.tabs.whatsapp,
  equipe: t.tabs.team,
  journal: t.tabs.journal,
};
const card = "rounded-[14px] border border-border bg-card";
const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

function Tile({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(card, "flex flex-col gap-1.5 p-4")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-[17px] font-semibold">{children}</div>
      {action}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#EEF0EE] p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="font-mono text-2xl">{value}</div>
    </div>
  );
}

function Journal({
  entries,
  limit,
}: {
  entries: PlatformOperatorDetail["journal"];
  limit?: number;
}) {
  const shown = limit ? entries.slice(0, limit) : entries;
  if (!shown.length)
    return <p className="text-sm text-muted-foreground">{t.journalEmpty}</p>;
  return (
    <ul>
      {shown.map((e) => (
        <li
          key={e.id}
          className="border-t border-[#EEF0EE] py-2 text-sm first:border-t-0"
        >
          <span className="font-mono text-xs text-muted-foreground">
            {dateTime.format(new Date(e.at))}
          </span>{" "}
          · {t.actions[e.action] ?? e.action}{" "}
          <span className="text-muted-foreground">({e.by})</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 11/11/2026 (« A avec la page loueur de C », direction C): one operator's page. A green band with its state and « Ouvrir
 * son espace », tabs (Vue d'ensemble · Annonce · Paiements · Contrat · WhatsApp · Équipe · Journal, `?onglet=`), the health tiles, the
 * month's activity, the platform's last actions on it, and the sensitive actions apart at the foot.
 */
export default function PlatformOperatorPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((x) => x === params.get("onglet")) ?? "vue";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startViewAs } = useAuth();
  const [link, setLink] = useState<InvitationResult | null>(null);
  const detail = useQuery({
    queryKey: ["platform", "operators", "detail", id],
    queryFn: () => adminApi.getPlatformOperator(id),
  });
  const operators = useQuery({
    queryKey: ["platform", "operators", "current"],
    queryFn: () => adminApi.getPlatformOperators(),
  });
  const open = useMutation({
    mutationFn: () => startViewAs(id),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  if (detail.isError)
    return (
      <div className="space-y-3">
        <p className="text-destructive">{describeError(detail.error)}</p>
        <Link
          to="/plateforme/loueurs"
          className="text-sm font-semibold text-lime-deep hover:underline"
        >
          ‹ {t.back}
        </Link>
      </div>
    );
  if (!detail.data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  const o = detail.data;
  const go = (next: Tab) =>
    setParams(next === "vue" ? {} : { onglet: next }, { replace: true });
  const defaultBps = operators.data?.defaultCommissionBps ?? null;

  return (
    <div className="space-y-5">
      <nav aria-label={t.breadcrumb} className="text-sm text-muted-foreground">
        <Link to="/plateforme" className="hover:underline">
          {fr.platform.brand}
        </Link>{" "}
        ›{" "}
        <Link to="/plateforme/loueurs" className="hover:underline">
          {t.back}
        </Link>{" "}
        › <span className="text-foreground">{o.name}</span>
      </nav>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-lime-deep px-6 py-5 text-white">
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <OperatorStatePill operator={o} />
            <KindPill kind={o.kind} />
            <span className="text-sm text-[#D9F99D]">
              {o.listingDetail ? `${o.listingDetail.airport.name} · ` : ""}
              {t.places(o.places)}
            </span>
          </span>
          <h1 className="text-[28px] font-bold leading-tight">{o.name}</h1>
          {o.manager && (
            <span className="text-sm text-[#E4F5D0]">
              {t.manager(o.manager.email)}
            </span>
          )}
        </div>
        {o.status === "active" && (
          <button
            onClick={() => open.mutate()}
            disabled={open.isPending}
            className="min-h-12 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {fr.platform.operators.open} ›
          </button>
        )}
      </section>

      <nav
        aria-label={o.name}
        className="flex flex-wrap gap-1.5 border-b border-border pb-2"
      >
        {TABS.map((x) => (
          <button
            key={x}
            onClick={() => go(x)}
            aria-current={tab === x ? "page" : undefined}
            className={cn(
              "min-h-10 rounded-full px-3.5 text-sm",
              tab === x ? "bg-foreground text-background" : "hover:bg-accent",
            )}
          >
            {TAB_LABEL[x]}
          </button>
        ))}
      </nav>

      {tab === "vue" && (
        <>
          <section
            aria-label={t.tabs.overview}
            className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
          >
            <Tile
              label={t.tiles.listing}
              action={
                <button
                  onClick={() => go("annonce")}
                  className="self-start text-sm text-lime-deep hover:underline"
                >
                  {TAB_LABEL.annonce} ›
                </button>
              }
            >
              <ListingCell operator={o} />
            </Tile>
            <Tile
              label={t.tiles.payments}
              action={
                <button
                  onClick={() => go("paiements")}
                  className="self-start text-sm text-lime-deep hover:underline"
                >
                  {TAB_LABEL.paiements} ›
                </button>
              }
            >
              <PaymentsCell operator={o} />
            </Tile>
            <Tile
              label={t.tiles.contract}
              action={
                <button
                  onClick={() => go("contrat")}
                  className="self-start text-sm text-lime-deep hover:underline"
                >
                  {t.openContract} ›
                </button>
              }
            >
              <ContractPill operator={o} />
            </Tile>
            <Tile label={t.tiles.commission}>
              <CommissionCell operator={o} defaultBps={defaultBps} />
            </Tile>
          </section>

          <div className="flex flex-wrap gap-4">
            <section
              className={cn(
                card,
                "min-w-[18rem] flex-[2_1_28rem] space-y-3 px-5 py-4",
              )}
            >
              <h2 className="text-base font-bold">{t.activity}</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Figure
                  label={t.bookingsThisMonth}
                  value={o.activity.bookingsThisMonth}
                />
                <Figure
                  label={t.plazoBookings}
                  value={o.activity.plazoBookingsThisMonth}
                />
                <Figure
                  label={t.inboxToCheck}
                  value={o.activity.inboxToCheck}
                />
                <Figure
                  label={t.failedPayouts}
                  value={o.activity.failedPayouts}
                />
              </div>
            </section>
            <section
              className={cn(
                card,
                "min-w-[16rem] flex-[1_1_18rem] space-y-2 px-5 py-4",
              )}
            >
              <h2 className="text-base font-bold">{t.journalTitle}</h2>
              <Journal entries={o.journal} limit={4} />
              {o.journal.length > 4 && (
                <button
                  onClick={() => go("journal")}
                  className="text-sm font-semibold text-lime-deep hover:underline"
                >
                  {t.allJournal}
                </button>
              )}
            </section>
          </div>
        </>
      )}

      {tab === "annonce" && (
        <section className={cn(card, "space-y-3 px-5 py-4")}>
          <h2 className="text-base font-bold">{t.listingTitle}</h2>
          {o.listingDetail ? (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
              <dt className="text-muted-foreground">{t.tiles.listing}</dt>
              <dd>
                <ListingCell operator={o} /> · {o.listingDetail.title}
              </dd>
              {o.listingDetail.submittedAt && (
                <>
                  <dt className="text-muted-foreground">{t.submittedAt}</dt>
                  <dd>
                    {shortDate.format(new Date(o.listingDetail.submittedAt))}
                  </dd>
                </>
              )}
              {o.listingDetail.reviewedAt && (
                <>
                  <dt className="text-muted-foreground">{t.reviewedAt}</dt>
                  <dd>
                    {shortDate.format(new Date(o.listingDetail.reviewedAt))}
                  </dd>
                </>
              )}
              {o.listingDetail.reviewMessage && (
                <>
                  <dt className="text-muted-foreground">{t.reviewMessage}</dt>
                  <dd className="whitespace-pre-line">
                    {o.listingDetail.reviewMessage}
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t.listingNone}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {o.listingDetail && o.listing?.status === "published" && (
              <a
                href={`/${o.listingDetail.airport.slug}/${o.listingDetail.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:bg-accent"
              >
                {t.seeOnSite}
              </a>
            )}
            <Link
              to="/plateforme/annonces"
              className="flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:bg-accent"
            >
              {t.reviewListing}
            </Link>
          </div>
        </section>
      )}

      {tab === "paiements" && (
        <section className={cn(card, "space-y-3 px-5 py-4")}>
          <p className="text-sm text-muted-foreground">{t.paymentsIntro}</p>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[14rem_1fr]">
            <dt className="text-muted-foreground">{t.tiles.payments}</dt>
            <dd>
              <PaymentsCell operator={o} />
            </dd>
            <dt className="text-muted-foreground">{t.commissionLabel}</dt>
            <dd>
              <CommissionCell operator={o} defaultBps={defaultBps} />
            </dd>
            <dt className="text-muted-foreground">{t.failedPayouts}</dt>
            <dd className="font-mono">{o.activity.failedPayouts}</dd>
          </dl>
          <Link
            to="/plateforme/paiements"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:bg-accent"
          >
            {t.seePayments}
          </Link>
        </section>
      )}

      {tab === "contrat" && <OperatorContractPanel operator={o} />}

      {tab === "whatsapp" && <OperatorWhatsappPanel operatorId={o.id} />}

      {tab === "equipe" && (
        <section className={cn(card, "px-5 py-4")}>
          {o.team.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.teamEmpty}</p>
          ) : (
            <ul>
              {o.team.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 border-t border-[#EEF0EE] py-3 text-sm first:border-t-0",
                    !m.isActive && "opacity-60",
                  )}
                >
                  <span className="min-w-[12rem] flex-1">
                    <span className="font-semibold">{m.name}</span>
                    {!m.isActive && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {t.inactive}
                      </span>
                    )}
                    <span className="block text-muted-foreground">
                      {m.email}
                    </span>
                  </span>
                  <span>{fr.roles[m.role]}</span>
                  <span className="text-muted-foreground">
                    {t.since(shortDate.format(new Date(m.createdAt)))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "journal" && (
        <section className={cn(card, "px-5 py-4")}>
          <Journal entries={o.journal} />
        </section>
      )}

      {!o.isPlatform && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#FECACA] bg-card px-5 py-4">
          <div className="max-w-xl">
            <h2 className="text-[15px] font-bold text-[#B91C1C]">{t.danger}</h2>
            <p className="text-sm text-muted-foreground">{t.dangerHint}</p>
          </div>
          <RowActions
            withOpen={false}
            operator={o}
            onLink={setLink}
            onDeleted={() => navigate("/plateforme/loueurs", { replace: true })}
          />
        </section>
      )}
      {link?.inviteUrl && (
        <p className="break-all rounded-[14px] border border-border bg-card px-5 py-3 font-mono text-sm">
          {link.inviteUrl}
        </p>
      )}
    </div>
  );
}
