import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { geocode, type GeocodeHit } from "@/lib/geocode";
import type { ReturnMeetingPoint } from "@/lib/types";

const MeetingPointMap = lazy(() => import("./MeetingPointMap"));

/** Lyon Saint-Exupéry: the first airport served (the map opens there without a point). */
const DEFAULT_CENTER = { lat: 45.7256, lng: 5.0811 };
export const INSTRUCTIONS_MAX = 500;

type Form = { point: { lat: number; lng: number } | null; label: string; instructions: string; photoUrl: string };
const toForm = (p: ReturnMeetingPoint | null): Form => ({
  point: p ? { lat: p.lat, lng: p.lng } : null,
  label: p?.label ?? "",
  instructions: p?.instructions ?? "",
  photoUrl: p?.photoUrl ?? "",
});

/**
 * "Point de rendez-vous au retour" block of the Parking page (direction B): the point on a map
 * (click, drag, or an address search), its label, the written directions and a photo URL.
 */
export function ReturnMeetingPointForm() {
  const t = fr.meetingPoint;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["return-meeting-point"], queryFn: adminApi.getReturnMeetingPoint });
  const [form, setForm] = useState<Form | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);

  useEffect(() => {
    if (data && !form) setForm(toForm(data.data));
  }, [data, form]);

  const save = useMutation({
    mutationFn: (f: Form) =>
      adminApi.setReturnMeetingPoint(
        f.point
          ? { lat: f.point.lat, lng: f.point.lng, label: f.label.trim() || null, instructions: f.instructions.trim() || null, photoUrl: f.photoUrl.trim() || null }
          : null,
      ),
    onSuccess: ({ data }, f) => {
      setFieldErrors({});
      queryClient.setQueryData(["return-meeting-point"], { data });
      setForm(toForm(data));
      toast.success(f.point ? t.saved : t.cleared);
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });

  if (isLoading || !form) return <Skeleton className="h-72 w-full" />;

  const search = async () => {
    setSearching(true);
    setHits(await geocode(query));
    setSearching(false);
  };
  const pick = (hit: GeocodeHit) => {
    setForm({ ...form, point: { lat: hit.lat, lng: hit.lng } });
    setFlyTo({ lat: hit.lat, lng: hit.lng, key: Date.now() });
    setHits(null);
  };
  const left = INSTRUCTIONS_MAX - form.instructions.length;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (!form.point) {
              toast.error(t.needPoint);
              return;
            }
            save.mutate(form);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="mp-search">{t.search}</Label>
            <div className="flex gap-2">
              <input
                id="mp-search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void search();
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="flex h-11 w-full border border-input bg-background px-3 text-base"
              />
              <Button type="button" variant="outline" className="h-11" onClick={search} disabled={searching}>
                {t.searchAction}
              </Button>
            </div>
            {hits && (
              <ul className="border border-border" aria-label={t.search}>
                {hits.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t.noResult}</li>}
                {hits.map(h => (
                  <li key={`${h.lat},${h.lng}`}>
                    <button type="button" onClick={() => pick(h)} className="w-full px-3 py-2 text-left text-sm hover:bg-accent">
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <MeetingPointMap point={form.point} center={DEFAULT_CENTER} onPick={point => setForm({ ...form, point })} flyTo={flyTo} />
          </Suspense>
          <p className="font-mono text-xs text-muted-foreground">{form.point ? t.coordinates(form.point.lat, form.point.lng) : t.mapHelp}</p>
          {!data?.data && !form.point && <p className="text-sm text-muted-foreground">{t.none}</p>}
          <FormField id="mp-label" label={t.label} placeholder={t.labelPlaceholder} maxLength={80} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} error={fieldErrors.label} />
          <div className="space-y-1.5">
            <Label htmlFor="mp-instructions">{t.instructions}</Label>
            <textarea
              id="mp-instructions"
              value={form.instructions}
              maxLength={INSTRUCTIONS_MAX}
              rows={4}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              aria-invalid={!!fieldErrors.instructions}
              aria-describedby="mp-instructions-help"
              className={`w-full border bg-background px-3 py-2 text-base ${fieldErrors.instructions ? "border-destructive" : "border-input"}`}
            />
            <p id="mp-instructions-help" className={`text-sm ${fieldErrors.instructions ? "text-destructive" : "text-muted-foreground"}`}>
              {fieldErrors.instructions ? errorMessage(fieldErrors.instructions) : t.instructionsHelp(left)}
            </p>
          </div>
          <FormField
            id="mp-photo"
            label={t.photoUrl}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={form.photoUrl}
            onChange={e => setForm({ ...form, photoUrl: e.target.value })}
            help={t.photoUrlHelp}
            error={fieldErrors.photoUrl}
          />
          {form.photoUrl.trim().startsWith("http") && (
            <img src={form.photoUrl.trim()} alt={t.photoPreview} className="h-32 w-auto border border-border object-cover" />
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-11 text-base" disabled={save.isPending}>
              {fr.common.save}
            </Button>
            {data?.data && (
              <Button type="button" variant="outline" className="h-11" disabled={save.isPending} onClick={() => save.mutate({ ...form, point: null })}>
                {t.clear}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
