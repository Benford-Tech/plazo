import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plate } from "@/components/Plate";
import { adminApi } from "@/lib/api";
import { contractDateTime, pdfName, savePdf } from "@/lib/contract";
import { contractTemplateFr, describeError } from "@/lib/fr";
import type { SignedContractFileKind, SignedContractRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = contractTemplateFr.page;
/** "2027-03-01T06:30" (the parking's clock) → "01/03 06:30". */
const stay = (local: string) =>
  `${local.slice(8, 10)}/${local.slice(5, 7)} ${local.slice(11, 16)}`;
const pill =
  "inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-white px-2.5 text-[13px] font-medium hover:bg-panel-2";
const ghost =
  "min-h-8 whitespace-nowrap rounded-full border border-lime-deep px-2.5 text-[12px] font-semibold text-lime-deep hover:bg-accent disabled:opacity-50";

/** « Contrats » (26/10/2026, R-A): every signed contract with its PDF and its proof, searchable, exportable. */
export default function ContractsPage() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ from: "", to: "" });
  const [reserved, setReserved] = useState(false);
  const [page, setPage] = useState(1);
  const query = {
    q,
    from: applied.from || undefined,
    to: applied.to || undefined,
    reserved,
    page,
  };
  const list = useQuery({
    queryKey: ["contracts", query],
    queryFn: () => adminApi.getSignedContracts(query),
  });
  const download = useMutation({
    mutationFn: async ({
      row,
      kind,
    }: {
      row: SignedContractRow;
      kind: SignedContractFileKind;
    }) => {
      const { blob, filename } = await adminApi.reservationContractFile(
        row.reservationId,
        kind,
      );
      savePdf(
        blob,
        filename ?? pdfName(null, kind === "template" ? "original" : kind),
      );
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const exportCsv = useMutation({
    mutationFn: async () => {
      const { blob, filename } = await adminApi.exportSignedContracts({
        ...query,
        page: undefined,
      });
      savePdf(blob, filename ?? "contrats-signes.csv");
      toast.success(t.exported);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const data = list.data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" data-testid="contract-filters">
          <button
            type="button"
            aria-pressed={!reserved}
            onClick={() => {
              setReserved(false);
              setPage(1);
            }}
            className={cn(
              pill,
              !reserved
                ? "border-lime-deep bg-primary text-primary-foreground hover:bg-primary"
                : "border-panel-line",
            )}
          >
            {t.signed(data?.total ?? 0)}
          </button>
          {(data?.reservedCount ?? 0) > 0 && (
            <button
              type="button"
              aria-pressed={reserved}
              onClick={() => {
                setReserved(true);
                setPage(1);
              }}
              className={cn(
                pill,
                reserved
                  ? "border-lime-deep bg-primary text-primary-foreground hover:bg-primary"
                  : "border-warn text-warn-text",
              )}
            >
              {t.reserved(data?.reservedCount ?? 0)}
            </button>
          )}
        </div>
        <form
          className="flex flex-wrap items-center gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ from, to });
            setPage(1);
          }}
        >
          <label className="flex items-center gap-1">
            {t.from}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-full border border-panel-line bg-white px-2 text-[13px]"
            />
          </label>
          <label className="flex items-center gap-1">
            {t.to}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-full border border-panel-line bg-white px-2 text-[13px]"
            />
          </label>
          <button type="submit" className={ghost}>
            {t.apply}
          </button>
        </form>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          aria-label={t.searchAria}
          placeholder={t.searchPlaceholder}
          className="min-h-8 w-full rounded-full border border-panel-line bg-white px-3 text-[13px] sm:w-56"
        />
        <button
          type="button"
          className={cn(ghost, "ml-auto")}
          onClick={() => exportCsv.mutate()}
          disabled={exportCsv.isPending || !data?.total}
        >
          {t.export}
        </button>
      </div>
      {list.isError && (
        <p className="text-sm text-destructive">{describeError(list.error)}</p>
      )}
      {data && data.data.length === 0 && (
        <p className="text-[13px] text-muted-foreground">{t.empty}</p>
      )}
      {data && data.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-panel-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-panel-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">{t.columns.signedAt}</th>
                  <th className="px-3 py-2">{t.columns.customer}</th>
                  <th className="px-3 py-2">{t.columns.plate}</th>
                  <th className="px-3 py-2">{t.columns.stay}</th>
                  <th className="px-3 py-2">{t.columns.method}</th>
                  <th className="px-3 py-2">{t.columns.version}</th>
                  <th className="px-3 py-2">{t.columns.proof}</th>
                  <th className="px-3 py-2">{t.columns.files}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr
                    key={row.reservationId}
                    data-testid="contract-row"
                    className="border-t border-panel-line align-middle hover:bg-panel-2/60"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]">
                      {contractDateTime(row.signedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/reservations/${row.reservationId}`}
                        className="font-semibold hover:underline"
                      >
                        {row.customerName}
                      </Link>
                      {row.reserved && (
                        <span className="ml-2 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn-text">
                          {t.reservedPill}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Plate value={row.plate} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] text-muted-foreground">
                      {stay(row.arrivalAt)} → {stay(row.returnAt)}
                    </td>
                    <td className="px-3 py-2">
                      {t.methodWith(
                        t.method[row.method] ?? row.method,
                        row.witnessName,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]">
                      {t.version(row.version, row.templateVersion)}
                    </td>
                    <td
                      className="px-3 py-2 font-mono text-[12px] text-muted-foreground"
                      title={row.proofSha256}
                    >
                      {row.proofSha256.slice(0, 8)}…{row.proofSha256.slice(-4)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {row.files.signed ? (
                          <button
                            type="button"
                            className={ghost}
                            onClick={() =>
                              download.mutate({ row, kind: "signed" })
                            }
                          >
                            {t.signedPdf}
                          </button>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">
                            {t.noFiles}
                          </span>
                        )}
                        {row.files.proof && (
                          <button
                            type="button"
                            className={ghost}
                            onClick={() =>
                              download.mutate({ row, kind: "proof" })
                            }
                          >
                            {t.proof}
                          </button>
                        )}
                        {row.files.template && (
                          <button
                            type="button"
                            className="text-[12px] text-lime-deep underline"
                            onClick={() =>
                              download.mutate({ row, kind: "template" })
                            }
                          >
                            {t.templatePdf}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-panel-2 px-3 py-2 text-[13px] text-muted-foreground">
            <span>
              {t.shown(data.data.length + (data.page - 1) * 50, data.total)}
            </span>
            {data.totalPages > 1 && (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  className={ghost}
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t.previous}
                </button>
                {t.pageOf(data.page, data.totalPages)}
                <button
                  type="button"
                  className={ghost}
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t.next}
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
