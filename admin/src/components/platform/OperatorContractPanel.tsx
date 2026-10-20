import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi, ApiError } from "@/lib/api";
import { contractDate, fileSize, pdfName, savePdf } from "@/lib/contract";
import { contractFr as t, describeError } from "@/lib/fr";
import type { ContractFileKind, PartnerContract, PlatformOperator } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";
const ghostButton = "min-h-10 whitespace-nowrap border border-border px-3 text-base hover:bg-accent disabled:opacity-50";
const MAX_BYTES = 4 * 1024 * 1024;

/** The pill of the Loueurs list: « À signer · v2 », « Signé · v1 », or « Aucun ». */
export function ContractPill({ operator }: { operator: PlatformOperator }) {
  const c = operator.contract;
  if (!c) return <span className="text-muted-foreground">{t.none}</span>;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-sm font-semibold",
        c.status === "signed" ? "bg-ok-soft text-ok-text" : "bg-warn-soft text-warn-text",
      )}
    >
      {c.status === "signed" ? t.signedPill(c.version) : t.pendingPill(c.version)}
    </span>
  );
}

/**
 * Plateforme › Loueurs › « Contrat » (20/10/2026, mockup 1): the operator's contract, its history, and the upload of a
 * new version (a version still waiting is replaced, a signed one stays).
 */
export function OperatorContractPanel({ operator }: { operator: PlatformOperator }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const key = ["platform", "contracts", operator.id];
  const contracts = useQuery({ queryKey: key, queryFn: () => adminApi.getOperatorContracts(operator.id) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["platform", "operators"] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.uploadOperatorContract(operator.id, file, title.trim() || undefined),
    onSuccess: (contract) => {
      toast.success(t.uploaded(contract.version));
      setTitle("");
      refresh();
    },
    onError: (err: Error) => {
      const code = err instanceof ApiError ? (err.fields?.file ?? err.code) : undefined;
      if (code && t.fileErrors[code]) setFileError(t.fileErrors[code]);
      else toast.error(describeError(err));
    },
  });
  const remind = useMutation({
    mutationFn: (c: PartnerContract) => adminApi.remindOperatorContract(operator.id, c.id),
    onSuccess: () => {
      toast.success(t.reminded);
      refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const remove = useMutation({
    mutationFn: (c: PartnerContract) => adminApi.removeOperatorContract(operator.id, c.id),
    onSuccess: () => {
      toast.success(t.removed);
      refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const download = useMutation({
    mutationFn: async ({ c, kind }: { c: PartnerContract; kind: ContractFileKind }) => {
      const { blob, filename } = await adminApi.operatorContractFile(operator.id, c.id, kind);
      savePdf(blob, pdfName(filename, kind));
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const pick = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (file.type && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return setFileError(t.fileErrors.not_a_pdf);
    if (file.size > MAX_BYTES) return setFileError(t.fileErrors.too_large);
    upload.mutate(file);
  };

  const list = contracts.data?.contracts ?? [];
  const latest = list.find((c) => c.status !== "superseded") ?? null;

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t.cardTitle(operator.name)}</h2>
        {latest && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-sm font-semibold",
              latest.status === "signed" ? "bg-ok-soft text-ok-text" : "bg-warn-soft text-warn-text",
            )}
          >
            {t.status[latest.status]}
          </span>
        )}
      </div>

      {contracts.isLoading ? (
        <p className="text-muted-foreground">…</p>
      ) : contracts.error ? (
        <p className="text-destructive">{t.loadError}</p>
      ) : !latest ? (
        <p className="text-muted-foreground">{t.empty}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {latest.title} · v{latest.version}
              </p>
              <p className="break-words text-sm text-muted-foreground">
                {t.fileLine(latest.fileName, fileSize(latest.sizeBytes), contractDate(latest.uploadedAt), latest.uploadedBy)}
              </p>
            </div>
            <button type="button" className={ghostButton} onClick={() => download.mutate({ c: latest, kind: "original" })}>
              {t.view}
            </button>
            {latest.status === "pending" && (
              <>
                <button type="button" className={ghostButton} disabled={upload.isPending} onClick={() => input.current?.click()}>
                  {t.replace}
                </button>
                <button
                  type="button"
                  className={cn(ghostButton, "text-muted-foreground hover:text-destructive")}
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (await confirm(t.removeConfirm(latest.version), { title: t.removeTitle, confirmLabel: t.remove, destructive: true }))
                      remove.mutate(latest);
                  }}
                >
                  {t.remove}
                </button>
              </>
            )}
          </div>

          {latest.status === "pending" && (
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className={labelClass}>{t.signerExpected}</p>
                <p className="font-semibold">{t.signerExpectedValue}</p>
              </div>
              <div>
                <p className={labelClass}>{t.notified}</p>
                <p className="font-semibold">{latest.notifiedAt ? t.notifiedValue(contractDate(latest.notifiedAt)) : t.notNotified}</p>
              </div>
              <div>
                <p className={labelClass}>{t.reminder}</p>
                <button
                  type="button"
                  className="font-semibold text-lime-deep underline disabled:opacity-50"
                  disabled={remind.isPending}
                  onClick={() => remind.mutate(latest)}
                >
                  {t.remind}
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className={labelClass}>{t.history}</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {list.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="w-28 font-mono text-lime-deep">{contractDate(c.signedAt ?? c.uploadedAt)}</span>
                  <span>
                    {t.historyLine(c)}
                    {c.signer && ` ${t.signedBy(c.signer.name)}`}
                  </span>
                  {c.status === "signed" && (
                    <>
                      <button type="button" className="text-lime-deep underline" onClick={() => download.mutate({ c, kind: "signed" })}>
                        {t.signedPdf}
                      </button>
                      <button type="button" className="text-lime-deep underline" onClick={() => download.mutate({ c, kind: "proof" })}>
                        {t.proof}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="flex flex-col items-center gap-2 border-2 border-dashed border-border p-4 text-center">
        <p className="font-semibold">{t.dropTitle}</p>
        <p className="max-w-xl text-sm text-muted-foreground">{t.dropHint}</p>
        <label className="flex w-full max-w-sm flex-col gap-1 text-left text-sm">
          <span className={labelClass}>{t.titleLabel}</span>
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            className="h-11 border border-border bg-background px-3 text-base outline-none focus-visible:border-lime-deep"
          />
        </label>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label={t.choose}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
          className="min-h-11 bg-primary px-4 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {upload.isPending ? t.uploading : t.choose}
        </button>
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
