import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import { toE164 } from "@/lib/sms";
import type { WhatsappSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * « WhatsApp aux voyageurs » (03/11/2026, « Plazo envoie par WhatsApp », SMS en repli): Parking › Réglages, above the SMS
 * card. On: the confirmation, day-before and landing messages go first by WhatsApp from Plazo's number, the SMS channel
 * below being the fallback. Managers only; read-only in the prospects' demo.
 */
export function WhatsappCard() {
  const { user } = useAuth();
  const manager = can(user?.role, "parking:manage");
  const readOnly = !!user?.demo;
  const t = fr.whatsapp;
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");

  const settings = useQuery({
    queryKey: ["whatsapp", "settings"],
    queryFn: adminApi.getWhatsappSettings,
    enabled: manager,
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => adminApi.updateWhatsappSettings(enabled),
    onSuccess: (data: WhatsappSettings) => {
      queryClient.setQueryData(["whatsapp", "settings"], data);
      toast.success(t.saved(data.enabled));
    },
    onError: (error) => toast.error(describeError(error)),
  });
  const test = useMutation({
    mutationFn: (to: string) => adminApi.testWhatsapp(to),
    onSuccess: () => toast.success(t.testSent),
    onError: (error) => toast.error(describeError(error)),
  });

  if (!manager || !settings.data) return null;
  const s = settings.data;
  const on = s.available && s.enabled;

  return (
    <section
      id="whatsapp"
      aria-labelledby="whatsapp-title"
      className="flex scroll-mt-6 flex-col gap-3"
    >
      <h2 id="whatsapp-title" className="text-2xl font-semibold">
        {t.title}
      </h2>
      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-base font-semibold">{t.headline}</p>
            <p className="text-sm text-muted-foreground">{t.intro}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={t.toggle}
            data-testid="whatsapp-toggle"
            disabled={!s.available || readOnly || toggle.isPending}
            onClick={() => toggle.mutate(!s.enabled)}
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50",
              on ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full transition-all",
                on ? "right-1 bg-primary-foreground" : "left-1 bg-white shadow",
              )}
            />
          </button>
        </div>

        {!s.available ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm" data-testid="whatsapp-unavailable">
            {t.unavailable}
          </p>
        ) : on ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text">
                {t.on}
              </span>
              <span>{t.sender}</span>
            </p>
            {!s.smsFallback && (
              <p className="rounded-lg bg-warn-soft px-3 py-2 text-warn-text" data-testid="whatsapp-no-fallback">
                {t.noFallback}
              </p>
            )}
            <p className="text-muted-foreground" data-testid="whatsapp-month">
              {t.month(s.month.whatsapp, s.month.read, s.month.fallbacks, s.month.failed)}
            </p>
            <p className="text-muted-foreground">{t.signatureNote}</p>
          </div>
        ) : null}

        {readOnly ? (
          <p className="text-sm text-muted-foreground">{t.readOnly}</p>
        ) : (
          on && (
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                test.mutate(toE164(phone));
              }}
            >
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.testLabel}
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="06 12 34 56 78"
                  className="min-h-11 rounded-lg border border-border bg-background px-3 text-base"
                />
              </label>
              <button
                type="submit"
                disabled={!phone.trim() || test.isPending}
                className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {test.isPending ? t.testSending : t.test}
              </button>
            </form>
          )
        )}
      </div>
    </section>
  );
}
