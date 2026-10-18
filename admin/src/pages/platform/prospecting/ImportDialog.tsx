import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { readProspectsCsv } from "@/lib/prospecting";
import type { ProspectImportOutcome, ProspectImportReport, ProspectInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";

const t = fr.platform.prospecting;
const PREVIEW_ROWS = 200;
const TONE: Record<ProspectImportOutcome, string> = {
  new: "bg-ok-soft text-ok-text",
  duplicate: "bg-panel-2 text-muted-foreground",
  suppressed: "bg-bad-soft text-bad-text",
  invalid: "bg-warn-soft text-warn-text",
};

/** The file's text (UTF-8), read by a FileReader. */
const readText = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });

/**
 * « Importer un CSV »: the file is read in the browser, the API answers what each row would become (dry run: duplicates,
 * opted-out addresses, errors), then « Importer N prospects » writes the new ones.
 */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Partial<ProspectInput>[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [report, setReport] = useState<ProspectImportReport | null>(null);

  const preview = useMutation({
    mutationFn: (read: Partial<ProspectInput>[]) => adminApi.importProspects(read, true),
    onSuccess: setReport,
    onError: (err: Error) => setProblem(describeError(err)),
  });
  const run = useMutation({
    mutationFn: () => adminApi.importProspects(rows, false),
    onSuccess: result => {
      toast.success(t.imported(result.created));
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
      onClose();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const onFile = async (file: File | undefined) => {
    setReport(null);
    setProblem(null);
    setIgnored([]);
    setRows([]);
    if (!file) return;
    const reading = readProspectsCsv(await readText(file));
    if (reading.missing.length) {
      setProblem(t.importMissing(reading.missing.map(c => t.fields[c])));
      return;
    }
    if (!reading.rows.length) {
      setProblem(t.importEmpty);
      return;
    }
    setIgnored(reading.ignored);
    setRows(reading.rows);
    preview.mutate(reading.rows);
  };

  return (
    <Modal title={t.importTitle} onClose={onClose} wide>
      <p className="text-sm text-muted-foreground">{t.importHelp}</p>
      <div className="space-y-1.5">
        <Label htmlFor="prospect-csv">{t.importFile}</Label>
        <input
          id="prospect-csv"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="block w-full text-sm file:mr-3 file:h-11 file:rounded-md file:border file:border-input file:bg-white file:px-4 file:font-semibold"
          onChange={e => void onFile(e.target.files?.[0])}
        />
      </div>
      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}
      {ignored.length > 0 && <p className="text-sm text-muted-foreground">{t.importIgnored(ignored)}</p>}
      {preview.isPending && <p className="text-sm text-muted-foreground">{t.importReading}</p>}
      {report && (
        <>
          <p className="font-semibold" aria-live="polite">
            {t.importCounts(report.counts)}
          </p>
          <div className="max-h-72 overflow-auto rounded-md border border-panel-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-panel-line text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">{t.importRow}</th>
                  <th className="px-3 py-2 font-semibold">{t.colParking}</th>
                  <th className="px-3 py-2 font-semibold">{t.fields.email}</th>
                  <th className="px-3 py-2 font-semibold">{t.colState}</th>
                </tr>
              </thead>
              <tbody>
                {report.results.slice(0, PREVIEW_ROWS).map(r => {
                  const row = rows[r.row - 1] ?? {};
                  return (
                    <tr key={r.row} className="border-b border-panel-line/60 align-top">
                      <td className="px-3 py-2 font-mono">{r.row}</td>
                      <td className="px-3 py-2">{row.companyName || "—"}</td>
                      <td className="px-3 py-2">{r.email ?? row.email ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[r.outcome])}>{t.outcomes[r.outcome]}</span>
                        {r.fields && (
                          <span className="mt-1 block text-xs text-destructive">
                            {Object.entries(r.fields)
                              .map(([k, code]) => `${t.fields[k as keyof ProspectInput] ?? k} : ${errorMessage(code)}`)
                              .join(" ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
          {t.cancel}
        </Button>
        <Button type="button" className="h-11" disabled={!report || report.counts.new === 0 || run.isPending} onClick={() => run.mutate()}>
          {t.importSubmit(report?.counts.new ?? 0)}
        </Button>
      </div>
    </Modal>
  );
}
