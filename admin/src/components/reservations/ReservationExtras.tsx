import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { adminApi } from "@/lib/api";
import { dateTimeShort } from "@/lib/datetime";
import { Sparkles } from "lucide-react";
import { EXTRA_ICONS } from "@/lib/extras";
import { describeError, extrasFr } from "@/lib/fr";
import { centsToInput, euros, parseEuros } from "@/lib/pricing";
import type {
  AddableExtra,
  ExtraKind,
  ExtraStatus,
  ParkingPaymentChoice,
  ReservationExtra,
  ReservationExtrasView,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const t = extrasFr.orders;

const TONE: Record<ExtraStatus, BadgeTone> = { ordered: "warn", done: "ok", refused: "line", refunded: "line" };

/** « Payé par » of a service added at the parking (12/11/2026), in the mockup's order. */
const CHOICES: ParkingPaymentChoice[] = ["card", "cash", "cheque", "transfer", "holiday_vouchers", "on_return"];
const MIN_CENTS = 100;
const MAX_CENTS = 100000;

const iconOf = (kind: string) => EXTRA_ICONS[kind as ExtraKind] ?? Sparkles;
const byStaff = (e: ReservationExtra) => e.source === "staff";

/** How the service was paid, as its pill says. */
function paymentPill(e: ReservationExtra): { label: string; tone: BadgeTone } {
  if (!byStaff(e)) return { label: t.paidOnline, tone: "info" };
  if (e.paymentMethod) return { label: t.paidAtParking(t.methods[e.paymentMethod]), tone: "line" };
  return { label: t.toCollect, tone: "warn" };
}

function Chips({
  value,
  onChange,
  name,
  choices = CHOICES,
}: {
  value: ParkingPaymentChoice | null;
  onChange: (v: ParkingPaymentChoice) => void;
  name: string;
  choices?: ParkingPaymentChoice[];
}) {
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-2">
      {choices.map(c => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={cn(
            "h-9 rounded-full border px-3 text-sm font-semibold",
            value === c ? "border-lime bg-lime text-lime-ink" : "border-panel-line bg-panel hover:bg-panel-2",
          )}
        >
          {t.methods[c]}
        </button>
      ))}
    </div>
  );
}

/** « Ajouter un service » (12/11/2026): the service, its price (the parking's by default) and how it is paid. */
function AddExtraForm({
  services,
  onCancel,
  onSubmit,
  pending,
}: {
  services: AddableExtra[];
  onCancel: () => void;
  onSubmit: (body: { kind: string; priceCents: number; paymentMethod: ParkingPaymentChoice }) => void;
  pending: boolean;
}) {
  const first = services.find(s => s.available) ?? null;
  const [kind, setKind] = useState<string | null>(first?.kind ?? null);
  const [price, setPrice] = useState(first ? centsToInput(first.priceCents) : "");
  const [method, setMethod] = useState<ParkingPaymentChoice>("card");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      data-testid="add-extra-form"
      className="space-y-3 rounded-lg border border-panel-line bg-background p-3"
      onSubmit={ev => {
        ev.preventDefault();
        if (!kind) return setError(t.chooseService);
        const cents = parseEuros(price);
        if (cents === null || cents < MIN_CENTS || cents > MAX_CENTS) return setError(t.priceInvalid);
        setError(null);
        onSubmit({ kind, priceCents: cents, paymentMethod: method });
      }}
    >
      <h4 className="text-sm font-semibold">{t.addTitle}</h4>
      <div role="group" aria-label={t.addTitle} className="grid gap-2 sm:grid-cols-3">
        {services.map(s => {
          const Icon = iconOf(s.kind);
          const on = kind === s.kind;
          return (
            <button
              key={s.kind}
              type="button"
              data-testid={`add-${s.kind}`}
              disabled={!s.available}
              aria-pressed={on}
              onClick={() => {
                setKind(s.kind);
                setPrice(centsToInput(s.priceCents));
              }}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
                on ? "border-lime-deep bg-lime/15" : "border-panel-line bg-panel hover:bg-panel-2",
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{s.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.available ? euros(s.priceCents) : (t.reasons[s.reason ?? ""] ?? s.reason)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <label className="block space-y-1 text-xs font-semibold" htmlFor="add-extra-price">
        <span>{t.price}</span>
        <input
          id="add-extra-price"
          inputMode="decimal"
          value={price}
          onChange={ev => setPrice(ev.target.value)}
          aria-invalid={error === t.priceInvalid}
          className="h-10 w-40 rounded-lg border border-panel-line bg-panel px-3 font-mono text-sm"
        />
      </label>
      <div className="space-y-1">
        <span className="text-xs font-semibold">{t.paidBy}</span>
        <Chips value={method} onChange={setMethod} name={t.paidBy} />
      </div>
      {error && (
        <p role="alert" className="text-xs text-bad-text">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
        >
          {t.submit}
        </button>
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-panel-line px-4 text-sm font-semibold">
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

/**
 * « Services additionnels » of a booking (21/10/2026, direction P; 12/11/2026 « Payé au parking »): what the traveller
 * ordered on Plazo and what the team added at the counter, « Fait » (the traveller hears it) or « Pas possible »
 * (refunded at once when paid online). With `mayAdd`, the block is always there when the parking offers a service, with
 * « + Ajouter un service ». On the full booking page and the operational card.
 */
export function ReservationExtras({
  reservationId,
  compact = false,
  mayAct = true,
  mayAdd = false,
  mayConfigure = false,
}: {
  reservationId: string;
  compact?: boolean;
  /** « Fait » / « Pas possible » (permission reservations:status, which every staff role has; the API checks it). */
  mayAct?: boolean;
  /** « + Ajouter un service » (reservations:manage, never in the demo). */
  mayAdd?: boolean;
  /** Managers: a link to Parking › Réglages when the parking offers no service. */
  mayConfigure?: boolean;
}) {
  const queryClient = useQueryClient();
  const key = ["reservation-extras", reservationId];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getReservationExtras(reservationId) });
  const [refusing, setRefusing] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  const onDone = (data: ReservationExtrasView) => {
    queryClient.setQueryData<ReservationExtrasView>(key, prev => ({ ...prev, ...data }));
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const onError = (err: Error) => toast.error(describeError(err, t.errors));
  const accept = useMutation({
    mutationFn: (extraId: string) => adminApi.acceptExtra(reservationId, extraId),
    onSuccess: data => {
      onDone(data);
      toast.success(t.acceptedToast);
    },
    onError,
  });
  const done = useMutation({
    mutationFn: (extraId: string) => adminApi.markExtraDone(reservationId, extraId),
    onSuccess: data => {
      onDone(data);
      toast.success(t.doneToast);
    },
    onError,
  });
  const refuse = useMutation({
    mutationFn: ({ extraId, why }: { extraId: string; why: string }) => adminApi.refuseExtra(reservationId, extraId, why),
    onSuccess: data => {
      onDone(data);
      setRefusing(null);
      setReason("");
      toast.success(t.refusedToast);
    },
    onError,
  });
  const add = useMutation({
    mutationFn: (body: { kind: string; priceCents: number; paymentMethod: ParkingPaymentChoice }) =>
      adminApi.addExtra(reservationId, body),
    onSuccess: data => {
      onDone(data);
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["extras-board"] });
      toast.success(t.addedToast);
    },
    onError,
  });
  const pay = useMutation({
    mutationFn: ({ extraId, method }: { extraId: string; method: ParkingPaymentChoice }) =>
      adminApi.setExtraPayment(reservationId, extraId, method),
    onSuccess: data => {
      onDone(data);
      setPaying(null);
      toast.success(t.paymentSaved);
    },
    onError,
  });

  const extras = query.data?.extras ?? [];
  const services = query.data?.services ?? [];
  const canAdd = mayAdd && !!query.data?.canAdd;
  const showEmptySettings = mayAdd && mayConfigure && !services.length && !extras.length && query.isSuccess;
  if (!extras.length && !(mayAdd && services.length) && !showEmptySettings) return null;
  const toDo = extras.filter(e => e.status === "ordered").length;

  return (
    <section data-testid="reservation-extras" className={cn("space-y-2", !compact && "rounded-xl border border-panel-line bg-panel p-4")}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={cn(compact ? "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" : "text-base font-semibold")}>
          {mayAdd ? t.titleAll : t.title}
        </h3>
        {toDo > 0 && (
          <Badge tone="warn" className="ml-auto">
            {t.toDoCount(toDo)}
          </Badge>
        )}
        {canAdd && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:brightness-105",
              toDo === 0 && "ml-auto",
            )}
          >
            {t.add}
          </button>
        )}
      </div>
      {showEmptySettings && (
        <p className="text-sm text-muted-foreground">
          {t.none}{" "}
          <Link to="/parking/reglages" className="font-semibold text-lime-deep underline">
            {t.noneLink}
          </Link>
        </p>
      )}
      {adding && (
        <AddExtraForm services={services} pending={add.isPending} onCancel={() => setAdding(false)} onSubmit={body => add.mutate(body)} />
      )}
      {extras.length > 0 && (
        <ul className="space-y-2">
          {extras.map(e => {
            const Icon = iconOf(e.kind);
            const staff = byStaff(e);
            const pill = paymentPill(e);
            return (
              <li key={e.id} data-testid={`order-${e.kind}`} className="space-y-2 rounded-lg border border-panel-line bg-background p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime-deep">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{e.label}</span>
                    <span className="text-xs text-muted-foreground">
                      <span className="font-mono">{euros(e.priceCents)}</span>
                      {" · "}
                      {staff ? t.addedLine(e.addedBy ?? null) : e.withBooking || !e.paidAt ? t.paidWithBooking : t.paidOn(dateTimeShort(e.paidAt))}
                    </span>
                    {e.status === "ordered" && e.acceptedAt && (
                      <span className="text-xs text-lime-deep">{t.acceptedLine(dateTimeShort(e.acceptedAt), e.acceptedBy ?? null)}</span>
                    )}
                    {e.status === "done" && e.doneAt && <span className="text-xs text-ok-text">{t.doneLine(dateTimeShort(e.doneAt), e.doneBy)}</span>}
                    {e.status === "refused" && (
                      <span className="text-xs text-muted-foreground">{staff ? t.refusedStaffLine(e.refusedReason) : t.refusedLine(e.refusedReason)}</span>
                    )}
                  </span>
                  {e.status !== "refused" && e.status !== "refunded" && <Badge tone={pill.tone}>{pill.label}</Badge>}
                  <Badge tone={TONE[e.status]}>{staff && e.status === "refused" ? t.refusedStaff : t.status[e.status]}</Badge>
                </div>
                {staff && !e.paymentMethod && mayAdd && (e.status === "ordered" || e.status === "done") && (
                  <div className="space-y-2">
                    {paying === e.id ? (
                      <Chips
                        name={t.paidBy}
                        value={null}
                        choices={CHOICES.filter(c => c !== "on_return")}
                        onChange={method => pay.mutate({ extraId: e.id, method })}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPaying(e.id)}
                        className="h-9 rounded-lg border border-panel-line bg-panel px-3 text-sm font-semibold hover:bg-panel-2"
                      >
                        {t.markPaid}
                      </button>
                    )}
                  </div>
                )}
                {e.status === "ordered" && mayAct && refusing !== e.id && (
                  <div className="flex flex-wrap gap-2">
                    {!e.acceptedAt && (
                      <button
                        type="button"
                        disabled={accept.isPending}
                        onClick={() => accept.mutate(e.id)}
                        className="h-10 rounded-lg border border-lime-deep px-4 text-sm font-semibold text-lime-deep hover:bg-lime/10 disabled:opacity-50"
                      >
                        {t.accept}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={done.isPending}
                      onClick={() => done.mutate(e.id)}
                      className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
                    >
                      {t.done}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefusing(e.id);
                        setReason("");
                      }}
                      className="h-10 rounded-lg border border-panel-line bg-panel px-4 text-sm font-semibold hover:bg-panel-2"
                    >
                      {t.refuse}
                    </button>
                  </div>
                )}
                {refusing === e.id && (
                  <form
                    className="space-y-2"
                    onSubmit={ev => {
                      ev.preventDefault();
                      refuse.mutate({ extraId: e.id, why: reason.trim() });
                    }}
                  >
                    <label htmlFor={`refuse-${e.id}`} className="text-xs font-semibold">
                      {t.reasonLabel}
                    </label>
                    <input
                      id={`refuse-${e.id}`}
                      value={reason}
                      maxLength={200}
                      placeholder={t.reasonPlaceholder}
                      onChange={ev => setReason(ev.target.value)}
                      className="h-10 w-full rounded-lg border border-panel-line bg-panel px-3 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">{staff ? t.hintStaff : t.hint}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={refuse.isPending}
                        className="h-10 rounded-lg bg-bad px-4 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {staff ? t.confirmRefuseStaff : t.confirmRefuse}
                      </button>
                      <button type="button" onClick={() => setRefusing(null)} className="h-10 rounded-lg border border-panel-line px-4 text-sm font-semibold">
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
