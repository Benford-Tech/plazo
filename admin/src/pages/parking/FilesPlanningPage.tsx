import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ToolButton } from "@/components/capacity/ui";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { longDate, shortDay } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type {
  FilesPlanningAlert,
  FilesPlanningDay,
  FilesPlanningFile,
} from "@/lib/plan/parkingFiles";
import { cn } from "@/lib/utils";
import { fileDayLabel } from "./fileLabels";

const t = fr.filesPlanning;
const tf = fr.occupation.files;
const WINDOWS = [7, 14] as const;

function alertText(a: FilesPlanningAlert): string {
  switch (a.kind) {
    case "missing_room":
      return t.missingRoom(shortDay(a.date), a.count);
    case "over_capacity":
      return t.overCapacity(shortDay(a.date), a.count);
    case "unsound":
      return t.unsound(a.fileCode, a.count);
  }
}

/**
 * "Planning des files" (07/10/2026), on a parking stored in files (S-C): one row per coming day
 * with the returns expected, the files serving them, the ones kept empty for them, the room left
 * and what is missing. The night's preparation keeps files for the big days; the staff can keep
 * one by hand for a given day, or free it.
 *
 * Without `from`, the window starts on the parking's local day as the server reckons it; the UI
 * takes "today" from the answer (`data.today`, else `data.from`).
 */
export function FilesPlanningPage({
  parkingId,
  from,
}: {
  parkingId: string;
  from?: string;
}) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(7);
  // The day a file is being kept for: its picker is open under that row.
  const [picking, setPicking] = useState<string | null>(null);
  const planning = useQuery({
    queryKey: ["files-planning", parkingId, days, from ?? "today"],
    queryFn: () => adminApi.getFilesPlanning(parkingId, days, from),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["files-planning", parkingId],
    });
    void queryClient.invalidateQueries({ queryKey: ["files", parkingId] });
  };
  const keep = useMutation({
    mutationFn: (v: { fileId: string; code: string; day: string | null }) =>
      adminApi.keepFile(parkingId, v.fileId, v.day),
    onSuccess: (_res, v) => {
      toast.success(
        v.day ? t.kept(v.code, shortDay(v.day)) : t.released(v.code),
      );
      setPicking(null);
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const prepare = useMutation({
    mutationFn: () => adminApi.prepareFiles(parkingId),
    onSuccess: ({ data }) => {
      toast.success(tf.prepared(data.planned, data.free));
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const data = planning.data;
  if (planning.isLoading || !data) {
    return (
      <>
        <ParkingTabs />
        {planning.error ? (
          <p className="text-destructive">{describeError(planning.error)}</p>
        ) : (
          <Skeleton className="h-96 w-full" />
        )}
      </>
    );
  }
  const today = data.today ?? data.from;
  const fileByCode = new Map(data.files.map((f) => [f.code, f]));
  const emptyFiles = data.files.filter((f) => f.active && f.cars === 0);
  const busy = keep.isPending || prepare.isPending;

  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="flex flex-col gap-4" data-testid="files-planning">
        {/* Window, capacity, preparation. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div
            role="group"
            aria-label={t.windowLabel}
            className="flex items-center gap-1"
          >
            {WINDOWS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={days === n}
                onClick={() => setDays(n)}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-3 font-mono text-[13px] font-semibold",
                  days === n
                    ? "border-lime-deep bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                {t.window(n)}
              </button>
            ))}
          </div>
          <span className="font-mono font-bold" data-testid="files-capacity">
            {t.capacity(data.capacity)}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <ToolButton
              className="min-h-9"
              disabled={busy}
              onClick={() => prepare.mutate()}
            >
              {t.prepare}
            </ToolButton>
            <Link
              to="/parking/occupation"
              className="text-lime-deep underline-offset-2 hover:underline"
            >
              {fr.parking.tabs.occupation}
            </Link>
          </span>
        </div>

        {/* Alerts. */}
        <section
          className="rounded-xl border border-border bg-card p-4"
          data-testid="alerts"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[1px] text-muted-foreground">
            {t.alerts}
          </h2>
          {data.alerts.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">{t.noAlert}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {data.alerts.map((a, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-2 border-l-2 pl-2",
                    a.kind === "unsound"
                      ? "border-warn text-warn-text"
                      : "border-bad text-bad-text",
                  )}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {alertText(a)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* One row per day. */}
        <section className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[1px] text-muted-foreground">
                <th className="px-4 py-2 font-semibold">{t.columns.day}</th>
                <th className="px-3 py-2 font-semibold">{t.columns.returns}</th>
                <th className="px-3 py-2 font-semibold">{t.columns.serving}</th>
                <th className="px-3 py-2 font-semibold">{t.columns.kept}</th>
                <th className="px-3 py-2 text-right font-semibold">
                  {t.columns.room}
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  {t.columns.missing}
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.load.map((d) => (
                <DayRow
                  key={d.date}
                  day={d}
                  today={today}
                  fileByCode={fileByCode}
                  emptyFiles={emptyFiles}
                  picking={picking === d.date}
                  busy={busy}
                  onPick={() => setPicking(picking === d.date ? null : d.date)}
                  onKeep={(f, day) =>
                    keep.mutate({ fileId: f.id, code: f.code, day })
                  }
                />
              ))}
            </tbody>
          </table>
        </section>

        {/* The files. */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[1px] text-muted-foreground">
            {t.files}
          </h2>
          <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
            {data.files.map((f) => (
              <li
                key={f.id}
                data-testid={`planning-file-${f.code}`}
                className={cn(
                  "flex flex-wrap items-center gap-x-2 gap-y-1 border px-3 py-2",
                  f.sound ? "border-border" : "border-bad",
                  !f.active && "opacity-50",
                )}
              >
                <b className="font-mono text-base">{f.code}</b>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {f.name ?? fileDayLabel(f, today)}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    f.cars >= f.capacity ? "text-bad" : "text-muted-foreground",
                  )}
                >
                  {f.cars}/{f.capacity}
                </span>
                {f.keptByHand && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-lime-deep">
                    {t.byHand}
                  </span>
                )}
                {!f.sound && (
                  <span className="rounded-full bg-bad-soft px-2 py-0.5 text-[11px] font-semibold text-bad-text">
                    {t.unsoundBadge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-lime-deep">
      {children}
    </span>
  );
}

function DayRow({
  day,
  today,
  fileByCode,
  emptyFiles,
  picking,
  busy,
  onPick,
  onKeep,
}: {
  day: FilesPlanningDay;
  today: string;
  fileByCode: Map<string, FilesPlanningFile>;
  emptyFiles: FilesPlanningFile[];
  picking: boolean;
  busy: boolean;
  onPick: () => void;
  onKeep: (file: FilesPlanningFile, day: string | null) => void;
}) {
  const isToday = day.date === today;
  // A day already gone is read-only: nothing to keep a file for.
  const past = day.date < today;
  return (
    <>
      <tr
        data-testid={`day-${day.date}`}
        className={cn(
          "border-b border-border/60 align-top",
          isToday && "bg-primary/10",
        )}
      >
        <td className="px-4 py-2">
          <div
            className={cn(
              "font-mono text-xs font-bold uppercase",
              isToday ? "text-lime-deep" : "text-muted-foreground",
            )}
          >
            {shortDay(day.date)}
          </div>
          <div className="text-[13px]">{longDate(day.date)}</div>
          <div className="text-xs text-muted-foreground">
            {t.onSite(day.onSite)}
          </div>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-lg font-bold">{day.toCome}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {t.returnsCell(day.toCome, day.placed)}
          </span>
        </td>
        <td className="px-3 py-2">
          {day.filesServing.length === 0 ? (
            <span className="text-muted-foreground">{t.none}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {day.filesServing.map((code) => (
                <Chip key={code}>{code}</Chip>
              ))}
            </div>
          )}
        </td>
        <td className="px-3 py-2">
          {day.filesKept.length === 0 ? (
            <span className="text-muted-foreground">{t.none}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {day.filesKept.map((code) => {
                const f = fileByCode.get(code);
                return (
                  <Chip key={code}>
                    {code}
                    {f?.keptByHand && (
                      <button
                        type="button"
                        aria-label={`${t.release} ${code}`}
                        title={t.release}
                        disabled={busy}
                        onClick={() => onKeep(f, null)}
                        className="ml-0.5 text-lime-deep/70 hover:text-bad"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Chip>
                );
              })}
            </div>
          )}
        </td>
        <td className="px-3 py-2 text-right font-mono font-bold">{day.room}</td>
        <td
          className={cn(
            "px-3 py-2 text-right font-mono font-bold",
            day.missing > 0 ? "text-bad" : "text-muted-foreground",
          )}
          data-testid={`missing-${day.date}`}
        >
          {day.missing > 0 ? day.missing : t.none}
        </td>
        <td className="px-3 py-2 text-right">
          <ToolButton
            className="min-h-8 whitespace-nowrap px-2 text-xs"
            active={picking}
            aria-pressed={picking}
            disabled={busy || past}
            onClick={onPick}
          >
            {t.keep}
          </ToolButton>
        </td>
      </tr>
      {picking && (
        <tr className="border-b border-border/60 bg-accent/40">
          <td colSpan={7} className="px-4 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {t.keepFor(shortDay(day.date))}
              </span>
              {emptyFiles.length === 0 && (
                <span className="text-muted-foreground">{t.noEmptyFile}</span>
              )}
              {emptyFiles.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  data-testid={`keep-${f.code}`}
                  disabled={busy}
                  onClick={() => onKeep(f, day.date)}
                  className="inline-flex min-h-8 items-center gap-1.5 border border-border bg-card px-2 font-mono text-xs font-semibold hover:bg-accent disabled:opacity-50"
                >
                  {f.code}
                  {f.plannedDay && f.plannedDay !== day.date && (
                    <span className="font-sans font-normal text-muted-foreground">
                      {tf.keptFor(shortDay(f.plannedDay))}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
