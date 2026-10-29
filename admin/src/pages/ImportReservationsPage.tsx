import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plate } from "@/components/Plate";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi } from "@/lib/api";
import {
  IMPORT_FIELDS,
  ImportField,
  ImportMapping,
  guessMapping,
  missingFields,
  readImportFile,
  rowsFor,
} from "@/lib/booking-import";
import { dateTimeShort } from "@/lib/datetime";
import { bookingImportFr, describeError, fr } from "@/lib/fr";
import type { ImportOutcome, ImportPreview, ImportPreviewRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = bookingImportFr;
const PAGE = 100;
const NO_ROWS: string[][] = [];

const OUTCOME_PILL: Record<ImportOutcome, string> = {
  create: "bg-ok-soft text-ok-text",
  check: "bg-warn-soft text-warn-text",
  duplicate: "bg-info-soft text-info-text",
  error: "bg-bad-soft text-bad-text",
};
const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold";

const euros = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

/** Why a row is what it is, in a few words under its state. */
function reasonOf(row: ImportPreviewRow): string {
  if (row.outcome === "error") return row.errors.map(e => t.errors[e] ?? e).join(" · ");
  if (row.outcome === "duplicate" && row.duplicateOf) {
    return row.duplicateOf.reference ? t.sameReference(row.duplicateOf.reference) : t.sameLine(row.duplicateOf.line ?? 0);
  }
  const parts = row.booking ? [`${t.timing[row.booking.timing]} · ${fr.status[row.booking.status]}`] : [];
  return [...parts, ...row.warnings.map(w => t.warnings[w] ?? w)].join(" · ");
}

/**
 * « Importer des réservations » (28/10/2026, direction A « Tout sur une page »): the file dropped, its columns
 * recognised (and corrected in place), the preview of every row from the server, then « Importer N réservations ».
 */
export default function ImportReservationsPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [filter, setFilter] = useState<ImportOutcome | "all">("all");
  const [shown, setShown] = useState(PAGE);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const cells = sheets[sheetIndex]?.rows ?? NO_ROWS;
  const header = cells[0] ?? [];
  const missing = missingFields(mapping);
  const rows = useMemo(() => rowsFor(cells, mapping), [cells, mapping]);

  const imports = useQuery({ queryKey: ["reservation-imports"], queryFn: adminApi.getReservationImports });

  const previewRun = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      adminApi.importReservations({ rows, fileName, dryRun: true }).then(result => ({ id, result })),
    onSuccess: ({ id, result }) => {
      if (id === requestId.current) setPreview(result);
    },
    onError: (err: Error) => toast.error(describeError(err, t.apiErrors)),
  });

  // The preview follows the file and the columns (a short pause after each change).
  useEffect(() => {
    setPreview(null);
    if (!rows.length || missing.length) return;
    const id = ++requestId.current;
    const timer = setTimeout(() => previewRun.mutate({ id }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, missing.length]);

  const run = useMutation({
    mutationFn: () => adminApi.importReservations({ rows, fileName, dryRun: false }),
    onSuccess: result => {
      toast.success(t.done(result.import?.created ?? 0));
      setSheets([]);
      setMapping([]);
      setFileName("");
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["reservation-imports"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: Error) => toast.error(describeError(err, t.apiErrors)),
  });

  const undo = useMutation({
    mutationFn: (id: string) => adminApi.undoReservationImport(id),
    onSuccess: result => {
      toast.success(t.undone(result.removed, result.kept));
      queryClient.invalidateQueries({ queryKey: ["reservation-imports"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: Error) => toast.error(describeError(err, t.apiErrors)),
  });

  const open = async (file: File) => {
    try {
      const read = await readImportFile(file);
      const sheet = read.sheets.findIndex(s => s.rows.length > 1);
      if (sheet < 0) {
        toast.error(t.fileErrors.empty);
        return;
      }
      setFileName(file.name);
      setSheets(read.sheets);
      setSheetIndex(sheet);
      setMapping(guessMapping(read.sheets[sheet].rows[0] ?? []));
      setFilter("all");
      setShown(PAGE);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      toast.error(t.fileErrors[code] ?? t.fileErrors.not_a_workbook);
    }
  };

  const chooseSheet = (index: number) => {
    setSheetIndex(index);
    setMapping(guessMapping(sheets[index]?.rows[0] ?? []));
  };

  const setColumn = (column: number, field: ImportField | null) =>
    setMapping(current =>
      header.map((_, i) => {
        if (i === column) return field;
        // A field belongs to one column: taking it here frees it elsewhere.
        return current[i] === field ? null : (current[i] ?? null);
      }),
    );

  const counts = preview?.counts;
  const toImport = counts ? counts.create + counts.check : 0;
  const visible = (preview?.rows ?? []).filter(r => filter === "all" || r.outcome === filter);

  const startImport = async () => {
    const ok = await confirm(t.confirmText, { title: t.confirmTitle(toImport), confirmLabel: t.confirm });
    if (ok) run.mutate();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[13px] text-muted-foreground">
            <Link to="/reservations" className="hover:underline">
              {fr.reservation.listTitle}
            </Link>{" "}
            › {t.link}
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-wide">{t.title}</h1>
        </div>
      </div>
      <p className="max-w-3xl text-[14px] text-muted-foreground">{t.intro}</p>

      <section className="flex flex-col gap-4 rounded-[14px] border border-panel-line bg-white p-4 sm:p-5">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-panel-line p-4",
            dragging && "border-lime-deep bg-lime/10",
          )}
          onDragOver={e => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void open(file);
          }}
          data-testid="import-drop"
        >
          {fileName ? (
            <>
              <span className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-[13px]">
                {fileName} · {t.lines(Math.max(0, cells.length - 1))}
              </span>
              {sheets.length > 1 && (
                <label className="flex items-center gap-2 text-[13px]">
                  {t.sheet}
                  <select
                    id="import-sheet"
                    className="h-9 rounded-md border border-panel-line bg-white px-2"
                    value={sheetIndex}
                    onChange={e => chooseSheet(Number(e.target.value))}
                  >
                    {sheets.map((s, i) => (
                      <option key={s.name + i} value={i}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className="text-[13px] text-muted-foreground">{t.firstRow}</span>
            </>
          ) : (
            <span className="text-[14px]">{t.drop}</span>
          )}
          <button
            type="button"
            className="min-h-9 rounded-full border border-panel-line bg-white px-4 text-[14px] font-semibold hover:bg-panel-2"
            onClick={() => input.current?.click()}
          >
            {fileName ? t.change : t.choose}
          </button>
          <input
            ref={input}
            id="import-file"
            type="file"
            accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label={t.choose}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) void open(file);
              e.target.value = "";
            }}
          />
        </div>

        {header.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-muted-foreground">{t.columns}</p>
            <div className="flex flex-wrap gap-2" data-testid="import-columns">
              {header.map((title, column) => (
                <label
                  key={`${title}-${column}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px]",
                    mapping[column] ? "border-panel-line" : "border-panel-line text-muted-foreground",
                  )}
                >
                  <b className="font-semibold">{title || `Colonne ${column + 1}`}</b> →
                  <select
                    id={`import-column-${column}`}
                    aria-label={title || `Colonne ${column + 1}`}
                    className={cn("bg-transparent font-semibold", mapping[column] ? "text-lime-deep" : "text-muted-foreground")}
                    value={mapping[column] ?? ""}
                    onChange={e => setColumn(column, (e.target.value || null) as ImportField | null)}
                  >
                    <option value="">{t.ignored}</option>
                    {IMPORT_FIELDS.map(f => (
                      <option key={f} value={f}>
                        {t.fields[f]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {missing.length > 0 && (
              <p className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad-text" role="alert">
                {t.missing(missing.map(m => t.required[m]))}
              </p>
            )}
          </div>
        )}

        {header.length > 0 && !missing.length && !preview && <p className="text-[13px] text-muted-foreground">{t.reading}</p>}

        {preview && counts && (
          <>
            {preview.dateOrder === "mdy" && (
              <p className="rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info-text" data-testid="import-month-first">
                {t.monthFirst}
              </p>
            )}
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.columnsTable.state}>
              {(["all", "create", "check", "duplicate", "error"] as const).map(key => {
                const n = key === "all" ? preview.rows.length : counts[key];
                if (key !== "all" && !n) return null;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={filter === key}
                    data-testid={`import-filter-${key}`}
                    onClick={() => {
                      setFilter(key);
                      setShown(PAGE);
                    }}
                    className={cn(
                      pill,
                      "min-h-8 border px-3 text-[13px]",
                      key === "all" ? "bg-panel-2 text-foreground" : OUTCOME_PILL[key],
                      filter === key ? "border-foreground" : "border-transparent",
                    )}
                  >
                    {t.filters[key]} · {n}
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-[10px] border border-panel-line">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b border-panel-line text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    {Object.values(t.columnsTable).map(label => (
                      <th key={label} className="px-3 py-2 font-semibold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.slice(0, shown).map(row => {
                    const b = row.booking;
                    return (
                      <tr key={row.line} className="border-b border-panel-line align-top last:border-0" data-testid={`import-row-${row.line}`}>
                        <td className="px-3 py-2 font-mono text-[12px] tabular-nums">{row.line}</td>
                        <td className="px-3 py-2">
                          <span className={cn(pill, OUTCOME_PILL[row.outcome])}>{t.filters[row.outcome]}</span>
                          <div className="mt-1 max-w-[16rem] text-[12px] text-muted-foreground">{reasonOf(row)}</div>
                        </td>
                        <td className="px-3 py-2">
                          {b?.customerName ?? "—"}
                          {b?.customerPhone && <div className="text-[12px] text-muted-foreground">{b.customerPhone}</div>}
                        </td>
                        <td className="min-w-[120px] whitespace-nowrap px-3 py-2">{b?.plate ? <Plate value={b.plate} size="sm" /> : "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] tabular-nums">
                          {b ? dateTimeShort(b.arrivalAt, preview.timezone) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] tabular-nums">
                          {b ? dateTimeShort(b.returnAt, preview.timezone) : "—"}
                        </td>
                        <td className="px-3 py-2">{b ? (b.channelDetail ?? fr.channels[b.channel]) : "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] tabular-nums">
                          {b?.priceCents != null ? euros(b.priceCents) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visible.length > shown && (
              <button
                type="button"
                className="self-start text-[13px] font-semibold text-lime-deep hover:underline"
                onClick={() => setShown(s => s + PAGE)}
              >
                {t.more(Math.min(PAGE, visible.length - shown))}
              </button>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-panel-line pt-4">
              <p className="max-w-2xl text-[13px] text-muted-foreground">{t.footnote}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-10 rounded-full border border-panel-line bg-white px-4 font-semibold hover:bg-panel-2"
                  onClick={() => {
                    setSheets([]);
                    setMapping([]);
                    setFileName("");
                    setPreview(null);
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  data-testid="import-submit"
                  disabled={!toImport || run.isPending || previewRun.isPending}
                  className="min-h-10 rounded-full bg-lime px-5 font-bold text-lime-ink hover:brightness-105 disabled:opacity-50"
                  onClick={startImport}
                >
                  {t.importN(toImport)}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {!!imports.data?.data.length && (
        <section className="flex flex-col gap-2 rounded-[14px] border border-panel-line bg-white p-4 sm:p-5" data-testid="import-history">
          <h2 className="text-[15px] font-bold">{t.recent}</h2>
          <ul className="flex flex-col divide-y divide-panel-line">
            {imports.data.data.map(item => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                <div className="min-w-0">
                  <span className="font-semibold">{item.fileName || t.title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {t.recentLine(item.createdCount, dateTimeShort(item.createdAt), item.by)}
                    {item.undoneAt && ` · ${t.removed(item.removedCount)}`}
                  </span>
                </div>
                {item.undoable && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={undo.isPending}
                      className="min-h-8 rounded-full border border-bad px-3 text-[12px] font-semibold text-bad-text hover:bg-bad-soft disabled:opacity-50"
                      onClick={async () => {
                        const ok = await confirm(t.undoText, { title: t.undoTitle, confirmLabel: t.undoConfirm, destructive: true });
                        if (ok) undo.mutate(item.id);
                      }}
                    >
                      {t.undo}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Link to="/reservations" className="self-start text-[13px] font-semibold text-lime-deep hover:underline">
            {t.seeReservations}
          </Link>
        </section>
      )}
    </div>
  );
}
