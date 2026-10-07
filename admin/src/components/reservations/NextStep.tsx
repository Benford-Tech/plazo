import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  KeyRound,
  PlaneLanding,
  PlaneTakeoff,
  SquareParking,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useConfirm } from "@/components/ui/confirm-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { describeError, fr, quickCardFr as t } from "@/lib/fr";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CLOSED: ReservationStatus[] = ["returned", "cancelled", "no_show"];
const DECISIONS: ReservationStatus[] = ["cancelled", "no_show"];

/** The journey's next gesture for a booking (C-A, 06/10/2026): one button, the other statuses behind a menu. */
export function NextStep({
  reservation,
  onNavigate,
  compact = false,
}: {
  reservation: Reservation;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [handover, setHandover] = useState(false);
  const change = useMutation({
    mutationFn: ({
      status,
      note,
    }: {
      status: ReservationStatus;
      note?: string;
    }) => adminApi.changeReservationStatus(reservation.id, status, note),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["reservation", reservation.id], {
        ...data,
        nextStatuses: data.nextStatuses ?? [],
      });
      void queryClient.invalidateQueries({
        queryKey: ["reservation", reservation.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["occupation"] });
      void queryClient.invalidateQueries({ queryKey: ["shuttle-pickups"] });
      void queryClient.invalidateQueries({ queryKey: ["shuttle-departures"] });
      setHandover(false);
      toast.success(fr.status[data.status]);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const next = reservation.nextStatuses ?? [];
  const go = (to: string) => {
    onNavigate?.();
    navigate(to);
  };
  const n = t.next;
  const step: {
    key: string;
    label: string;
    help: string;
    icon: ReactNode;
    run: () => void;
  } | null =
    reservation.status === "upcoming" && next.includes("arrived")
      ? {
          key: "place",
          label: n.place,
          help: n.placeHelp,
          icon: <SquareParking className="h-5 w-5" aria-hidden="true" />,
          run: () => go(`/parking/occupation?focus=${reservation.id}`),
        }
      : reservation.status === "arrived" && next.includes("shuttled_out")
        ? {
            key: "drop_off",
            label: n.dropOff,
            help: n.dropOffHelp,
            icon: <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />,
            run: () =>
              go(`/navettes?sens=dropoff&reservation=${reservation.id}`),
          }
        : (reservation.status === "shuttled_out" ||
              reservation.status === "return_requested") &&
            next.includes("back_at_parking")
          ? {
              key: "pick_up",
              label: n.pickUp,
              help: n.pickUpHelp,
              icon: <PlaneLanding className="h-5 w-5" aria-hidden="true" />,
              run: () =>
                go(`/navettes?sens=pickup&reservation=${reservation.id}`),
            }
          : reservation.status === "back_at_parking" &&
              next.includes("returned")
            ? {
                key: "hand_over",
                label: n.handOver,
                help: n.handOverHelp,
                icon: <KeyRound className="h-5 w-5" aria-hidden="true" />,
                run: () => setHandover(true),
              }
            : null;
  const pick = async (status: ReservationStatus) => {
    if (status === "returned") return setHandover(true);
    if (
      DECISIONS.includes(status) &&
      !(await confirm(
        status === "cancelled" ? n.confirmCancel : n.confirmNoShow,
        { destructive: true },
      ))
    )
      return;
    change.mutate({ status });
  };
  if (!step && next.length === 0) {
    return CLOSED.includes(reservation.status) ? (
      <p className="text-[13px] text-muted-foreground">{n.closed}</p>
    ) : null;
  }
  return (
    <div data-testid="next-step" className="space-y-2">
      {step && !handover && (
        <>
          <button
            type="button"
            data-testid={`next-${step.key}`}
            disabled={change.isPending}
            onClick={step.run}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60",
              compact ? "h-11 text-[14px]" : "h-12 text-[15px]",
            )}
          >
            {step.icon}
            {step.label}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {step.help}
          </p>
        </>
      )}
      {handover && (
        <HandoverForm
          reservation={reservation}
          busy={change.isPending}
          onCancel={() => setHandover(false)}
          onConfirm={(note) => change.mutate({ status: "returned", note })}
        />
      )}
      {next.length > 0 && !handover && (
        <label className="relative mx-auto flex w-fit items-center gap-1 text-[13px] font-semibold text-lime-deep">
          <span>{n.more}</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
          <select
            aria-label={n.more}
            data-testid="more-actions"
            value=""
            disabled={change.isPending}
            onChange={(e) =>
              e.target.value && pick(e.target.value as ReservationStatus)
            }
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="">{n.more}</option>
            {next.map((s) => (
              <option key={s} value={s}>
                {fr.statusAction[s]}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

/** "Rendre le véhicule": the keys switch (required) and the remark (optional). */
function HandoverForm({
  reservation,
  busy,
  onCancel,
  onConfirm,
}: {
  reservation: Reservation;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note?: string) => void;
}) {
  const h = t.handover;
  const [keys, setKeys] = useState(false);
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState("");
  return (
    <form
      data-testid="handover"
      className="space-y-3 rounded-xl border border-panel-line bg-panel p-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!keys) return setTried(true);
        onConfirm(note.trim() || undefined);
      }}
    >
      <p className="font-mono text-[17px] font-medium">{h.title}</p>
      <p className="text-[13px] text-muted-foreground">
        {reservation.customerName} · {reservation.plate}
        {reservation.spot?.code ? ` · ${t.spot} ${reservation.spot.code}` : ""}
        {reservation.keyHook ? ` · ${t.keys} ${reservation.keyHook}` : ""}
      </p>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          data-testid="handover-keys"
          checked={keys}
          onChange={(e) => setKeys(e.target.checked)}
          className="mt-1 h-5 w-5 accent-[#1E5E2E]"
        />
        <span>
          <span className="block text-[14px] font-semibold">{h.keys}</span>
          <span
            className={cn(
              "block text-xs",
              tried && !keys ? "text-bad-text" : "text-muted-foreground",
            )}
          >
            {tried && !keys ? h.keysRequired : h.keysHelp}
          </span>
        </span>
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold">{h.note}</span>
        <textarea
          data-testid="handover-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded-lg border border-panel-line bg-background px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{h.noteHint}</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-full border border-panel-line text-[14px] font-semibold hover:bg-panel-2"
        >
          {h.back}
        </button>
        <button
          type="submit"
          data-testid="handover-confirm"
          disabled={busy}
          className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {h.confirm}
        </button>
      </div>
    </form>
  );
}
