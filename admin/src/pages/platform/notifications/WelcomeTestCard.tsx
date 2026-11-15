import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const t = fr.platform.notifications.welcome;
const selectClass = "flex h-11 w-full border border-input bg-background px-3 text-base";

/** 15/11/2026: « M'envoyer un test » of the welcome email to travellers, for the parking chosen. */
export default function WelcomeTestCard() {
  const [operatorId, setOperatorId] = useState("");
  const operators = useQuery({ queryKey: ["platform", "operators"], queryFn: () => adminApi.getPlatformOperators() });
  const send = useMutation({
    mutationFn: () => adminApi.sendTravellerWelcomeTest(operatorId || null),
    onSuccess: r => toast.success(t.sent(r.to, r.from)),
    onError: err => toast.error(err instanceof ApiError && err.code && t.errors[err.code] ? t.errors[err.code] : describeError(err)),
  });
  return (
    <section className="max-w-3xl space-y-3 rounded-[14px] border border-border bg-card p-4" data-testid="welcome-test">
      <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-sm">
          <Label htmlFor="welcome-operator">{t.parking}</Label>
          <select id="welcome-operator" className={selectClass} value={operatorId} onChange={e => setOperatorId(e.target.value)}>
            <option value="">{t.parkingExample}</option>
            {(operators.data?.operators ?? []).map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" className="h-11" onClick={() => send.mutate()} disabled={send.isPending} data-testid="welcome-test-send">
          {send.isPending ? t.sending : t.send}
        </Button>
      </div>
    </section>
  );
}
