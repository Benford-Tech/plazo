import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { bookingPageFr as t, describeError } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** The first field error of the answer, in words. */
function errorOf(error: unknown): string {
  if (error instanceof ApiError && error.fields) {
    const code = Object.values(error.fields)[0];
    if (code && t.errors[code]) return t.errors[code];
  }
  return describeError(error);
}

/**
 * « Réservation Plazo dans votre site » (Site du parking, niveau 3, 19/11/2026, choix « 2 et 3 », « reversé entier »):
 * the parking's own Plazo booking page, its address, button colour, and the code to paste in its site.
 */
export function BookingPageCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const readOnly = !!user?.demo;
  const query = useQuery({ queryKey: ["booking-page"], queryFn: adminApi.getBookingPage });
  const data = query.data?.data;
  const [slug, setSlug] = useState("");
  const [accent, setAccent] = useState("#FF6600");
  useEffect(() => {
    if (!data) return;
    setSlug(data.slug);
    setAccent(data.accent);
  }, [data]);

  const save = useMutation({
    mutationFn: adminApi.updateBookingPage,
    onSuccess: (r) => {
      queryClient.setQueryData(["booking-page"], r);
      toast.success(t.saved);
    },
    onError: (e) => toast.error(errorOf(e)),
  });
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    } catch {
      /* shown in the field, to select by hand */
    }
  };
  if (!data) return null;
  const changed = slug !== data.slug || accent.toUpperCase() !== data.accent;

  return (
    <Card id="page-reservation">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CreditCard className="h-5 w-5 text-lime-deep" aria-hidden />
            {t.title}
          </h2>
          <span
            data-testid="booking-page-state"
            className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", data.enabled ? "bg-ok-soft text-ok-text" : "bg-panel-2 text-muted-foreground")}
          >
            {data.enabled ? t.on : t.off}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
        {!data.listingOnline && <p className="rounded-[12px] bg-warn-soft px-3 py-2 text-sm text-warn-text">{t.listingOffline}</p>}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="bp-slug">{t.slug}</Label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">plazo.fr/r/</span>
              <Input id="bp-slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={readOnly} className="font-mono" />
            </div>
            <p className="text-xs text-muted-foreground">{t.slugHint}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bp-accent">{t.accent}</Label>
            <div className="flex items-center gap-2">
              <input
                id="bp-accent"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value.toUpperCase())}
                disabled={readOnly}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-white"
              />
              <span className="font-mono text-sm">{accent.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {data.enabled ? (
              <>
                <Button disabled={!changed || save.isPending} onClick={() => save.mutate({ slug, accent })}>
                  {t.save}
                </Button>
                <Button variant="ghost" disabled={save.isPending} onClick={() => save.mutate({ enabled: false })}>
                  {t.off}
                </Button>
              </>
            ) : (
              <Button
                data-testid="booking-page-enable"
                disabled={!data.listingOnline || save.isPending}
                onClick={() => save.mutate({ enabled: true, slug, accent })}
              >
                {t.enable}
              </Button>
            )}
          </div>
        )}

        {data.enabled && data.embed && data.page && (
          <div className="space-y-3" data-testid="booking-page-code">
            <div className="space-y-1">
              <p className="text-sm">{t.code}</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 select-all break-all rounded-md bg-panel-2 px-2 py-1.5 font-mono text-xs">{data.embed}</code>
                <Button size="sm" variant="outline" onClick={() => copy(data.embed!)}>
                  {t.copy}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm">{t.link}</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 select-all break-all rounded-md bg-panel-2 px-2 py-1.5 font-mono text-xs">{data.page}</code>
                <Button size="sm" variant="outline" onClick={() => copy(data.page!)}>
                  {t.copy}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={data.page} target="_blank" rel="noopener noreferrer">
                    {t.open}
                  </a>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.payouts}</p>
          </div>
        )}
        {readOnly && <p className="text-xs text-muted-foreground">{t.demo}</p>}
      </CardContent>
    </Card>
  );
}
