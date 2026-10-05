import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { geocode, type GeocodeHit } from "@/lib/geocode";
import type { ShuttleStop, ShuttleStopInput, ShuttleStopKind } from "@/lib/types";

export const INSTRUCTIONS_MAX = 500;
const KINDS: ShuttleStopKind[] = ["station", "other", "airport"];

interface Form {
  kind: ShuttleStopKind;
  name: string;
  point: { lat: number; lng: number } | null;
  instructions: string;
}

const EMPTY: Form = { kind: "station", name: "", point: null, instructions: "" };
const toForm = (s: ShuttleStop): Form => ({ kind: s.kind, name: s.name, point: { lat: s.lat, lng: s.lng }, instructions: s.instructions ?? "" });
const toInput = (f: Form): ShuttleStopInput => ({ kind: f.kind, name: f.name.trim(), lat: f.point!.lat, lng: f.point!.lng, instructions: f.instructions.trim() || null });

type Cache = { data: ShuttleStop[] } | undefined;

/**
 * "Dessertes de la navette" block of the Parking page (D-A, 05/10/2026): the places served besides
 * the airport (a train station, a hotel…), each placed by the IGN geocoder, with directions for the
 * traveller. The airport itself is the return meeting point above (built in).
 */
export function ShuttleStops() {
  const t = fr.stops;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["stops"], queryFn: adminApi.getStops });
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[] | null>(null);
  const [searching, setSearching] = useState(false);

  const onError = (err: Error) => {
    setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
    toast.error(describeError(err));
  };
  const reset = () => {
    setFieldErrors({});
    setForm(EMPTY);
    setEditingId(null);
    setQuery("");
    setHits(null);
  };
  const add = useMutation({
    mutationFn: () => adminApi.addStop(toInput(form)),
    onSuccess: ({ data: stop }) => {
      reset();
      queryClient.setQueryData(["stops"], (old: Cache) => ({ data: [...(old?.data ?? []), stop] }));
      toast.success(t.added);
    },
    onError,
  });
  const update = useMutation({
    mutationFn: (id: string) => adminApi.updateStop(id, toInput(form)),
    onSuccess: ({ data: stop }) => {
      reset();
      queryClient.setQueryData(["stops"], (old: Cache) => ({ data: (old?.data ?? []).map(s => (s.id === stop.id ? stop : s)) }));
      toast.success(t.updated);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.removeStop(id),
    onSuccess: (_, id) => {
      if (editingId === id) reset();
      queryClient.setQueryData(["stops"], (old: Cache) => ({ data: (old?.data ?? []).filter(s => s.id !== id) }));
      toast.success(t.removed);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const search = async () => {
    setSearching(true);
    setHits(await geocode(query));
    setSearching(false);
  };
  const pick = (hit: GeocodeHit) => {
    setForm({ ...form, point: { lat: hit.lat, lng: hit.lng }, name: form.name || hit.label });
    setHits(null);
  };

  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;
  const airport = data.data.find(s => s.builtIn) ?? null;
  const stops = data.data.filter(s => !s.builtIn);
  const busy = add.isPending || update.isPending;
  const editing = editingId ? stops.find(s => s.id === editingId) : undefined;
  const left = INSTRUCTIONS_MAX - form.instructions.length;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <ul className="divide-y divide-border border border-border">
          <li className="flex flex-wrap items-center gap-3 px-3 py-2">
            <span className="min-w-0 flex-1 text-base font-semibold">
              {airport ? airport.name : t.airportUnset}
              <span className="block text-sm font-normal text-muted-foreground">{t.airportHelp}</span>
            </span>
            <Badge variant="secondary">{t.airport}</Badge>
          </li>
          {stops.map(s => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 text-base font-semibold">
                {s.name}
                {s.instructions && <span className="block text-sm font-normal text-muted-foreground">{s.instructions}</span>}
              </span>
              <Badge variant="outline">{t.kinds[s.kind]}</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={t.editLabel(s.name)}
                disabled={busy}
                onClick={() => {
                  setFieldErrors({});
                  setEditingId(s.id);
                  setForm(toForm(s));
                }}
              >
                {t.edit}
              </Button>
              <Button type="button" variant="outline" size="sm" aria-label={t.removeLabel(s.name)} disabled={remove.isPending} onClick={() => remove.mutate(s.id!)}>
                {t.remove}
              </Button>
            </li>
          ))}
        </ul>
        {stops.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
        <form
          className="space-y-3"
          aria-label={editing ? t.editing(editing.name) : t.add}
          onSubmit={e => {
            e.preventDefault();
            if (!form.point) {
              toast.error(t.needPoint);
              return;
            }
            if (editingId) update.mutate(editingId);
            else add.mutate();
          }}
        >
          {editing && <p className="text-sm font-semibold text-primary">{t.editing(editing.name)}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="stop-search">{t.search}</Label>
            <div className="flex gap-2">
              <input
                id="stop-search"
                className="flex h-11 w-full border border-input bg-background px-3 text-base"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void search();
                  }
                }}
                placeholder={t.searchPlaceholder}
              />
              <Button type="button" variant="outline" className="h-11" disabled={searching || query.trim().length < 3} onClick={() => void search()}>
                {t.searchAction}
              </Button>
            </div>
            {hits && (
              <ul className="border border-border" aria-label={t.search}>
                {hits.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t.noResult}</li>}
                {hits.map(h => (
                  <li key={`${h.lat},${h.lng}`}>
                    <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => pick(h)}>
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="font-mono text-xs text-muted-foreground">{form.point ? t.coordinates(form.point.lat, form.point.lng) : t.needPoint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <Label htmlFor="stop-kind">{t.kind}</Label>
              <select id="stop-kind" className="flex h-11 w-full border border-input bg-background px-3 text-base" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as ShuttleStopKind })}>
                {KINDS.map(k => (
                  <option key={k} value={k}>
                    {t.kinds[k]}
                  </option>
                ))}
              </select>
            </div>
            <FormField id="stop-name" label={t.name} placeholder={t.namePlaceholder} maxLength={80} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={fieldErrors.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stop-instructions">{t.instructions}</Label>
            <textarea
              id="stop-instructions"
              className="flex min-h-20 w-full border border-input bg-background px-3 py-2 text-base"
              maxLength={INSTRUCTIONS_MAX}
              value={form.instructions}
              aria-invalid={!!fieldErrors.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{fieldErrors.instructions ? errorMessage(fieldErrors.instructions) : t.instructionsHelp(left)}</p>
          </div>
          <div className="flex gap-2">
            {editing && (
              <Button type="button" variant="ghost" className="h-11" onClick={reset}>
                {t.cancel}
              </Button>
            )}
            <Button type="submit" variant={editing ? "default" : "outline"} className="h-11" disabled={busy}>
              {editing ? t.save : t.add}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
