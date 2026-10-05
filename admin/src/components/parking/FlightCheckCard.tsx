import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { todayLocal } from "@/lib/datetime";
import { describeError, flightCheckFr as t } from "@/lib/fr";
import type { FlightCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "—");

/** Diagnostic of the flight provider (manager): one flight, one date, the raw answer. */
export function FlightCheckCard() {
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [role, setRole] = useState<"arrival" | "departure">("arrival");
  const check = useMutation({ mutationFn: () => adminApi.checkFlight(flight, date, role) });
  const r = check.data;
  const arrival = role === "arrival";
  const rows = (c: FlightCheck) =>
    c.info
      ? [
          [t.fields.status, c.info.status],
          [t.fields.scheduled, fmt(arrival ? c.info.scheduledArrivalAt : c.info.scheduledDepartureAt)],
          [t.fields.estimated, fmt(arrival ? c.info.estimatedArrivalAt : c.info.estimatedDepartureAt)],
          [t.fields.actual, fmt(arrival ? c.info.actualArrivalAt : c.info.actualDepartureAt)],
          [t.fields.airport, (arrival ? c.info.arrivalAirport : c.info.departureAirport) ?? "—"],
          [t.fields.terminal, (arrival ? c.info.terminal : c.info.departureTerminal) ?? "—"],
          ...(arrival ? [[t.fields.gate, c.info.gate ?? "—"]] : []),
        ]
      : [];
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end"
          onSubmit={e => {
            e.preventDefault();
            if (flight.trim()) check.mutate();
          }}
        >
          <FormField id="check-flight" label={t.flight} value={flight} onChange={e => setFlight(e.target.value.toUpperCase())} placeholder="TO 3627" required />
          <FormField id="check-date" label={t.date} type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <div className="space-y-1.5">
            <label htmlFor="check-role" className="text-sm font-medium">
              {t.role}
            </label>
            <select id="check-role" value={role} onChange={e => setRole(e.target.value as "arrival" | "departure")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="arrival">{t.arrival}</option>
              <option value="departure">{t.departure}</option>
            </select>
          </div>
          <Button type="submit" disabled={check.isPending || !flight.trim()}>
            {check.isPending ? t.running : t.run}
          </Button>
        </form>
        {check.isError && <p className="text-sm text-bad-text">{describeError(check.error)}</p>}
        {r && (
          <div data-testid="flight-check-result" className={cn("rounded-xl border p-3 text-sm", r.outcome === "found" ? "border-ok bg-ok-soft" : r.outcome === "not_found" ? "border-warn bg-warn-soft" : "border-bad bg-bad-soft")}>
            <p className="font-mono text-xs text-muted-foreground">{t.provider(r.provider, r.host)} · {r.flight} · {r.date}</p>
            <p className="mt-1 font-semibold">{t.outcome[r.outcome]}</p>
            {r.error && <p className="mt-1 break-words">{t.errorHint(r.error)}</p>}
            {r.info && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {rows(r).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
