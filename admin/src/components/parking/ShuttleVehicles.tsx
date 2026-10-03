import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { ShuttleVehicle } from "@/lib/types";

const EMPTY = { model: "", colour: "", plate: "" };

/** "Navettes" block of the Parking page: the operator's vehicles (model, colour, plate). */
export function ShuttleVehicles() {
  const t = fr.vehicles;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.getVehicles });
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const add = useMutation({
    mutationFn: () => adminApi.addVehicle({ model: form.model, colour: form.colour.trim() || null, plate: form.plate.trim() || null }),
    onSuccess: ({ data: vehicle }) => {
      setFieldErrors({});
      setForm(EMPTY);
      queryClient.setQueryData(["vehicles"], (old: { data: ShuttleVehicle[] } | undefined) => ({ data: [...(old?.data ?? []), vehicle] }));
      toast.success(t.added);
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.removeVehicle(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["vehicles"], (old: { data: ShuttleVehicle[] } | undefined) => ({ data: (old?.data ?? []).filter(v => v.id !== id) }));
      toast.success(t.removed);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;
  const vehicles = data.data;

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
              <li key={v.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 text-base font-semibold">
                  {v.model}
                  {v.colour && <span className="font-normal text-muted-foreground"> · {v.colour}</span>}
                </span>
                {v.plate && <Plate value={v.plate} />}
                <Button type="button" variant="outline" size="sm" aria-label={t.removeLabel(v.model)} disabled={remove.isPending} onClick={() => remove.mutate(v.id)}>
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
          onSubmit={e => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <FormField id="vehicle-model" label={t.model} placeholder={t.modelPlaceholder} maxLength={60} required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} error={fieldErrors.model} />
          <FormField id="vehicle-colour" label={t.colour} placeholder={t.colourPlaceholder} maxLength={30} value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} error={fieldErrors.colour} />
          <FormField id="vehicle-plate" label={t.plate} placeholder="AB-123-CD" maxLength={15} value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} error={fieldErrors.plate} />
          <Button type="submit" variant="outline" className="h-11" disabled={add.isPending}>
            {t.add}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
