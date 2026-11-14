import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { WhatsappNumber, WhatsappSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.whatsapp.number;

function Check({ done, waiting }: { done: boolean; waiting?: boolean }) {
  if (done)
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    );
  return (
    <span
      className={cn(
        "h-6 w-6 shrink-0 rounded-full border-2",
        waiting ? "border-warn bg-warn-soft" : "border-border",
      )}
      aria-hidden="true"
    />
  );
}

/**
 * 14/11/2026 (« Un compte WhatsApp Business par parking », chemin 1, maquettes
 * https://claude.ai/artifact/Je3eFB8AcgzoAocy9q2xz4): under « WhatsApp aux voyageurs », the parking asks for its own
 * number (the platform adds it on Benford Tech's account, display name « Plazo »), then follows it until it sends.
 */
export function WhatsappNumberCard({ number, readOnly }: { number: WhatsappNumber | null; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const request = useMutation({
    mutationFn: adminApi.requestWhatsappNumber,
    onSuccess: (data) => {
      queryClient.setQueryData<WhatsappSettings>(["whatsapp", "settings"], (old) => (old ? { ...old, number: data } : old));
      toast.success(t.requestedToast);
    },
    onError: (error) => toast.error(describeError(error)),
  });

  if (!number) {
    return (
      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5" data-testid="whatsapp-number">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold">{t.title}</p>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {t.benefits.map(([title, text]) => (
            <div key={title} className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3.5">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="whatsapp-number-request"
              disabled={request.isPending}
              onClick={() => request.mutate()}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {t.request}
            </button>
            <span className="text-sm text-muted-foreground">{t.requestHint}</span>
          </div>
        )}
      </div>
    );
  }

  if (number.status === "requested" || !number.phone) {
    return (
      <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5" data-testid="whatsapp-number">
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold">
          {t.requested}
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">{t.pill.pending}</span>
        </p>
        <p className="text-sm text-muted-foreground">{t.requestedText}</p>
      </div>
    );
  }

  const state = number.status === "active" ? "active" : number.status === "paused" ? "paused" : "pending";
  const verified = number.status === "registered" || number.status === "active" || number.status === "paused";
  const nameOk = number.nameStatus === "APPROVED" || number.nameStatus === "AVAILABLE_WITHOUT_REVIEW";
  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5" data-testid="whatsapp-number">
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-base font-semibold">{t.ownTitle(number.phone)}</p>
          <p className="text-sm text-muted-foreground">{t.ownText[state]}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            state === "active" ? "bg-ok-soft text-ok-text" : "bg-warn-soft text-warn-text",
          )}
        >
          {t.pill[state]}
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        <li className="flex items-start gap-3 rounded-xl border border-border p-3.5">
          <Check done={verified} waiting={!verified} />
          <p className="text-sm font-semibold">{verified ? t.steps.verified : t.steps.verifiedWaiting}</p>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-border p-3.5">
          <Check done={nameOk} waiting={verified && !nameOk} />
          <p className="text-sm font-semibold">{nameOk ? t.steps.name : t.steps.nameWaiting}</p>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-border p-3.5">
          <Check done={number.sending} />
          <div className="flex flex-col gap-0.5">
            <p className={cn("text-sm font-semibold", !number.sending && "text-muted-foreground")}>{t.steps.sending}</p>
            <p className="text-sm text-muted-foreground">{t.steps.sendingHint}</p>
          </div>
        </li>
      </ol>
      <p className="text-sm text-muted-foreground">{t.repliesHint}</p>
    </div>
  );
}
