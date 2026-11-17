import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { subscriptionFr as t } from "@/lib/fr";

const stripes = new Map<string, Promise<Stripe | null>>();
/** One Stripe.js per key, loaded from js.stripe.com the first time a form needs it. */
function stripeFor(key: string): Promise<Stripe | null> {
  if (!stripes.has(key)) stripes.set(key, loadStripe(key, { locale: "fr" }));
  return stripes.get(key)!;
}

const APPEARANCE = {
  theme: "stripe" as const,
  variables: { colorPrimary: "#1E5E2E", colorText: "#1A1D1A", borderRadius: "10px", fontFamily: "Inter, system-ui, sans-serif" },
};

export type StripeFormResult = { kind: "payment"; status: string } | { kind: "setup"; setupIntentId: string };

/**
 * Stripe's Payment Element (card or SEPA) for the first invoice of a subscription (`payment`) or a new payment method
 * (`setup`), in the page: Plazo never sees the numbers. 3D Secure opens in Stripe's own window; a method that must
 * leave the page comes back to this one (`return_url`), where the page reads the result back.
 */
export function StripeForm({
  publishableKey,
  clientSecret,
  mode,
  submitLabel,
  onDone,
}: {
  publishableKey: string;
  clientSecret: string;
  mode: "payment" | "setup";
  submitLabel: string;
  onDone: (result: StripeFormResult) => Promise<void> | void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | null = null;
    stripeFor(publishableKey)
      .then((s) => {
        if (cancelled || !s || !mount.current) {
          if (!s && !cancelled) setError(t.loadFailed);
          return;
        }
        const els = s.elements({ clientSecret, appearance: APPEARANCE, locale: "fr" });
        const element = els.create("payment", { layout: "tabs" });
        element.on("ready", () => setReady(true));
        element.mount(mount.current);
        unmount = () => element.destroy();
        setStripe(s);
        setElements(els);
      })
      .catch(() => !cancelled && setError(t.loadFailed));
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [publishableKey, clientSecret]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    try {
      const returnUrl = window.location.href.split("?")[0];
      if (mode === "payment") {
        const r = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
        if (r.error) setError(r.error.message ?? t.errors.payment_failed);
        else await onDone({ kind: "payment", status: r.paymentIntent?.status ?? "processing" });
      } else {
        const r = await stripe.confirmSetup({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
        if (r.error) setError(r.error.message ?? t.errors.setup_not_confirmed);
        else if (r.setupIntent) await onDone({ kind: "setup", setupIntentId: r.setupIntent.id });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" data-testid={`stripe-form-${mode}`}>
      <div ref={mount} className="min-h-[120px]" />
      {error && (
        <p role="alert" className="rounded-[10px] bg-bad-soft p-3 text-sm text-bad-text">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!ready || busy}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:brightness-105 disabled:opacity-50"
      >
        {busy ? t.paying : submitLabel}
      </button>
    </form>
  );
}
