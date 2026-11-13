import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { geocode, type GeocodeHit } from "@/lib/geocode";
import { MAX_PHOTO_BYTES, shrinkPhoto } from "@/lib/shrink-photo";
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
    <Card id="point-de-rendez-vous" className="scroll-mt-4">
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
          <MeetingPhotoField value={form.photoUrl} onChange={photoUrl => setForm(f => (f ? { ...f, photoUrl } : f))} />
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

/**
 * The meeting point's photo, choix A (13/11/2026, « pouvoir uploader la photo du point de rendez-vous »): a thumbnail with
 * « Changer » and « Retirer », or a drop zone. The photo is sent at once (Plazo serves it publicly); its address is then
 * saved with the point, like the rest of the form.
 */
function MeetingPhotoField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const t = fr.meetingPoint;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const send = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const photo = await shrinkPhoto(file);
      if (!photo) return void toast.error(t.photoUnreadable);
      if (photo.size > MAX_PHOTO_BYTES) return void toast.error(t.photoTooLarge);
      const { photoUrl } = await adminApi.uploadMeetingPhoto(photo);
      onChange(photoUrl);
      toast.success(t.photoSaved);
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : undefined;
      if (fields?.photo === "too_large") toast.error(t.photoTooLarge);
      else if (fields?.photo) toast.error(t.photoUnreadable);
      else if (err instanceof ApiError && err.code === "photos_unavailable") toast.error(t.photoUnavailable);
      else toast.error(describeError(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      if (value.includes("/meeting-photo/")) await adminApi.removeMeetingPhoto();
      onChange("");
      toast.success(t.photoRemoved);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const picker = (
    <input
      ref={input}
      id="mp-photo"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic"
      className="sr-only"
      onChange={e => void send(e.target.files?.[0])}
    />
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="mp-photo">{t.photo}</Label>
      {picker}
      {value ? (
        <div className="flex flex-wrap items-center gap-4">
          <img src={value} alt={t.photoPreview} className="h-28 w-40 rounded-lg border border-border object-cover" />
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" className="h-10" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? t.photoUploading : t.photoChange}
            </Button>
            <Button type="button" variant="ghost" className="h-10 text-destructive" disabled={busy} onClick={() => void remove()}>
              {t.photoRemove}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="mp-photo-drop"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={e => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={e => {
            e.preventDefault();
            setOver(false);
            void send(e.dataTransfer.files?.[0]);
          }}
          className={`flex h-28 w-full max-w-sm flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm ${
            over ? "border-lime-deep bg-lime/10" : "border-border bg-muted/30"
          }`}
        >
          <span className="font-semibold text-lime-deep">{busy ? t.photoUploading : t.photoAdd}</span>
          <span className="text-muted-foreground">{t.photoDrop}</span>
        </button>
      )}
      <p className="text-sm text-muted-foreground">{t.photoHelp}</p>
    </div>
  );
}
