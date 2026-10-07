import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { FlightCheckCard } from "@/components/parking/FlightCheckCard";
import { InboundEmailCard } from "@/components/parking/InboundEmailCard";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { ReturnMeetingPointForm } from "@/components/parking/ReturnMeetingPointForm";
import { ShuttleStops } from "@/components/parking/ShuttleStops";
import { ShuttleTrackingCard } from "@/components/parking/ShuttleTrackingCard";
import { ShuttleVehicles } from "@/components/parking/ShuttleVehicles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { bookableCapacity } from "@/lib/roles";
import type { Parking } from "@/lib/types";

type Form = { name: string; address: string; totalCapacity: string; safetyMarginPct: string; shuttleTravelMinutes: string; terminalLeadMinutes: string; landingDelayMinutes: string };

const toForm = (p: Parking): Form => ({
  name: p.name,
  address: p.address ?? "",
  totalCapacity: String(p.totalCapacity),
  safetyMarginPct: String(p.safetyMarginPct),
  shuttleTravelMinutes: String(p.shuttleTravelMinutes),
  terminalLeadMinutes: String(p.terminalLeadMinutes ?? 120),
  landingDelayMinutes: String(p.landingDelayMinutes ?? 30),
});

export default function ParkingPage() {
  const queryClient = useQueryClient();
  const { data: parking, isLoading } = useQuery({ queryKey: ["parking"], queryFn: adminApi.getParking });
  const [form, setForm] = useState<Form | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = fr.parking;

  useEffect(() => {
    if (parking && !form) setForm(toForm(parking));
  }, [parking, form]);

  const save = useMutation({
    mutationFn: (f: Form) =>
      adminApi.updateParking(parking!.id, {
        name: f.name,
        address: f.address.trim() ? f.address : null,
        totalCapacity: Number(f.totalCapacity),
        safetyMarginPct: Number(f.safetyMarginPct),
        shuttleTravelMinutes: Number(f.shuttleTravelMinutes),
        terminalLeadMinutes: Number(f.terminalLeadMinutes),
        landingDelayMinutes: Number(f.landingDelayMinutes),
      }),
    onSuccess: ({ data }) => {
      setFieldErrors({});
      queryClient.setQueryData(["parking"], data);
      setForm(toForm(data));
      toast.success(fr.common.saved);
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });

  if (isLoading || !form) {
    return (
      <>
        <ParkingTabs />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  const preview = bookableCapacity(Number(form.totalCapacity), Number(form.safetyMarginPct));

  return (
    <>
      <ParkingTabs />
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <FormField id="name" label={t.name} required value={form.name} onChange={set("name")} error={fieldErrors.name} />
            <FormField id="address" label={t.address} value={form.address} onChange={set("address")} error={fieldErrors.address} />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                id="totalCapacity"
                label={t.totalCapacity}
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={form.totalCapacity}
                onChange={set("totalCapacity")}
                error={fieldErrors.totalCapacity}
              />
              <FormField
                id="safetyMarginPct"
                label={t.safetyMarginPct}
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                required
                value={form.safetyMarginPct}
                onChange={set("safetyMarginPct")}
                help={t.safetyMarginHelp}
                error={fieldErrors.safetyMarginPct}
              />
              <FormField
                id="shuttleTravelMinutes"
                label={t.shuttleTravelMinutes}
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                required
                value={form.shuttleTravelMinutes}
                onChange={set("shuttleTravelMinutes")}
                help={t.shuttleHelp}
                error={fieldErrors.shuttleTravelMinutes}
              />
              <FormField
                id="terminalLeadMinutes"
                label={t.terminalLeadMinutes}
                type="number"
                inputMode="numeric"
                min={0}
                max={360}
                required
                value={form.terminalLeadMinutes}
                onChange={set("terminalLeadMinutes")}
                help={t.terminalLeadHelp}
                error={fieldErrors.terminalLeadMinutes}
              />
              <FormField
                id="landingDelayMinutes"
                label={t.landingDelayMinutes}
                type="number"
                inputMode="numeric"
                min={0}
                max={180}
                required
                value={form.landingDelayMinutes}
                onChange={set("landingDelayMinutes")}
                help={t.landingDelayHelp}
                error={fieldErrors.landingDelayMinutes}
              />
            </div>
            {preview !== null && (
              <Alert className="border-lime-deep/30 bg-accent">
                <AlertDescription>{t.bookablePreview(preview)}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="h-11 text-base" disabled={save.isPending}>
              {fr.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>
      <InboundEmailCard />
      <ReturnMeetingPointForm />
      {parking && <ShuttleTrackingCard parking={parking} />}
      <ShuttleStops />
      <ShuttleVehicles />
      <FlightCheckCard />
    </>
  );
}
