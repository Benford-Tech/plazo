import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import type { ShuttleVehicle, ShuttleVehicleInput, Staff } from "@/lib/types";

interface Form {
  model: string;
  colour: string;
  plate: string;
  seats: string;
  driverId: string;
  inService: boolean;
}

const EMPTY: Form = { model: "", colour: "", plate: "", seats: "", driverId: "", inService: true };

const toForm = (v: ShuttleVehicle): Form => ({
  model: v.model,
  colour: v.colour ?? "",
  plate: v.plate ?? "",
  seats: v.seats === null ? "" : String(v.seats),
  driverId: v.driverId ?? "",
  inService: v.inService,
});

const toInput = (f: Form): ShuttleVehicleInput => ({
  model: f.model,
  colour: f.colour.trim() || null,
  plate: f.plate.trim() || null,
  seats: f.seats.trim() === "" ? null : Number(f.seats),
  driverId: f.driverId || null,
  inService: f.inService,
});

type Cache = { data: ShuttleVehicle[] } | undefined;

/**
 * "Navettes" block of the Parking page: the vehicle sheets (V-A, 04/10/2026): model, colour,
 * plate, passenger seats, in service, usual driver. One form adds a vehicle or edits the one picked.
 */
export function ShuttleVehicles() {
  const t = fr.vehicles;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.getVehicles });
  const team = useQuery({ queryKey: ["team"], queryFn: adminApi.getTeam });
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onError = (err: Error) => {
    setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
    toast.error(describeError(err));
  };
  const reset = () => {
    setFieldErrors({});
    setForm(EMPTY);
    setEditingId(null);
  };
  const add = useMutation({
    mutationFn: () => adminApi.addVehicle(toInput(form)),
    onSuccess: ({ data: vehicle }) => {
      reset();
      queryClient.setQueryData(["vehicles"], (old: Cache) => ({ data: [...(old?.data ?? []), vehicle] }));
      toast.success(t.added);
    },
    onError,
  });
  const update = useMutation({
    mutationFn: (id: string) => adminApi.updateVehicle(id, toInput(form)),
    onSuccess: ({ data: vehicle }) => {
      reset();
      queryClient.setQueryData(["vehicles"], (old: Cache) => ({ data: (old?.data ?? []).map(v => (v.id === vehicle.id ? vehicle : v)) }));
      toast.success(t.updated);
    },
    onError,
  });
  const toggleService = useMutation({
    mutationFn: (v: ShuttleVehicle) => adminApi.updateVehicle(v.id, { inService: !v.inService }),
    onSuccess: ({ data: vehicle }) => {
      queryClient.setQueryData(["vehicles"], (old: Cache) => ({ data: (old?.data ?? []).map(v => (v.id === vehicle.id ? vehicle : v)) }));
      toast.success(t.updated);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.removeVehicle(id),
    onSuccess: (_, id) => {
      if (editingId === id) reset();
      queryClient.setQueryData(["vehicles"], (old: Cache) => ({ data: (old?.data ?? []).filter(v => v.id !== id) }));
      toast.success(t.removed);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;
  const vehicles = data.data;
  const drivers = (team.data ?? []).filter((s: Staff) => s.isActive);
  const busy = add.isPending || update.isPending;
  const editing = editingId ? vehicles.find(v => v.id === editingId) : undefined;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {vehicles.map(v => (
              <li key={v.id} className={`flex flex-wrap items-center gap-3 px-3 py-2 ${v.inService ? "" : "opacity-70"}`}>
                <span className="min-w-0 flex-1 text-base font-semibold">
                  {v.model}
                  {v.colour && <span className="font-normal text-muted-foreground"> · {v.colour}</span>}
                  <span className="block text-sm font-normal text-muted-foreground">
                    {[v.seats !== null ? t.seatsShort(v.seats) : null, v.driverName ? `${t.driver} : ${v.driverName}` : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {v.plate && <Plate value={v.plate} />}
                <Badge variant={v.inService ? "default" : "outline"}>{v.inService ? t.inService : t.outOfService}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={!v.inService}
                  aria-label={`${v.inService ? t.outOfService : t.inService} · ${v.model}`}
                  disabled={toggleService.isPending}
                  onClick={() => toggleService.mutate(v)}
                >
                  {v.inService ? t.outOfService : t.inService}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t.editLabel(v.model)}
                  disabled={busy}
                  onClick={() => {
                    setFieldErrors({});
                    setEditingId(v.id);
                    setForm(toForm(v));
                  }}
                >
                  {t.edit}
                </Button>
                <Button type="button" variant="outline" size="sm" aria-label={t.removeLabel(v.model)} disabled={remove.isPending} onClick={() => remove.mutate(v.id)}>
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="space-y-3"
          aria-label={editing ? t.editing(editing.model) : t.add}
          onSubmit={e => {
            e.preventDefault();
            if (editingId) update.mutate(editingId);
            else add.mutate();
          }}
        >
          {editing && <p className="text-sm font-semibold text-primary">{t.editing(editing.model)}</p>}
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <FormField id="vehicle-model" label={t.model} placeholder={t.modelPlaceholder} maxLength={60} required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} error={fieldErrors.model} />
            <FormField id="vehicle-colour" label={t.colour} placeholder={t.colourPlaceholder} maxLength={30} value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} error={fieldErrors.colour} />
            <FormField id="vehicle-plate" label={t.plate} placeholder="AB-123-CD" maxLength={15} value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} error={fieldErrors.plate} />
            <FormField id="vehicle-seats" label={t.seats} type="number" inputMode="numeric" min={1} max={60} help={t.seatsHelp} value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} error={fieldErrors.seats} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-driver">{t.driver}</Label>
              <select
                id="vehicle-driver"
                className="flex h-11 w-full border border-input bg-background px-3 text-base"
                value={form.driverId}
                aria-invalid={!!fieldErrors.driverId}
                onChange={e => setForm({ ...form, driverId: e.target.value })}
              >
                <option value="">{t.driverNone}</option>
                {drivers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {fr.roles[s.role]}
                  </option>
                ))}
              </select>
              {fieldErrors.driverId && <p className="text-sm text-destructive">{errorMessage(fieldErrors.driverId)}</p>}
            </div>
            <label className="flex h-11 items-center gap-2 text-base" htmlFor="vehicle-in-service">
              <input id="vehicle-in-service" type="checkbox" className="h-5 w-5 accent-primary" checked={form.inService} onChange={e => setForm({ ...form, inService: e.target.checked })} />
              {t.inService}
            </label>
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
          </div>
          <p className="text-xs text-muted-foreground">{t.outOfServiceHelp}</p>
        </form>
      </CardContent>
    </Card>
  );
}
