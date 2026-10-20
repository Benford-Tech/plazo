import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-context";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { contractDate, contractDateTime, pdfName, savePdf } from "@/lib/contract";
import { contractFr as t, describeError } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import type { ContractFileKind, PartnerContract } from "@/lib/types";

const labelClass = "text-[13px] text-muted-foreground";
const ghostButton = "min-h-11 rounded-[10px] border border-border bg-card px-4 font-semibold hover:bg-accent disabled:opacity-50";
const primaryButton = "min-h-12 rounded-[10px] bg-primary px-5 font-bold text-primary-foreground hover:brightness-105 disabled:opacity-50";

function useDownload() {
  return useMutation({
    mutationFn: async ({ c, kind }: { c: PartnerContract; kind: ContractFileKind }) => {
      const { blob, filename } = await adminApi.myContractFile(c.id, kind);
      savePdf(blob, pdfName(filename, kind));
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
}

/** The PDF shown in the page (the browser's own viewer), fetched with the session. */
function PdfPreview({ contract }: { contract: PartnerContract }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl: string | null = null;
    let live = true;
    adminApi
      .myContractFile(contract.id, "original")
      .then(({ blob }) => {
        if (!live) return;
        objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setUrl(objectUrl);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [contract.id]);

  if (failed) return <p className="p-6 text-destructive">{t.loadError}</p>;
  if (!url) return <p className="p-6 text-muted-foreground">{t.previewLoading}</p>;
  return (
    <object data={url} type="application/pdf" title={t.previewTitle} className="h-[70vh] min-h-[420px] w-full">
      <p className="p-6 text-sm">
        {t.previewFallback}{" "}
        <a href={url} download={contract.fileName} className="text-lime-deep underline">
          {t.download}
        </a>
      </p>
    </object>
  );
}

function SignPanel({ contract, canSign, operatorName }: { contract: PartnerContract; canSign: boolean; operatorName: string }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => user?.name ?? "");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sign = useMutation({
    mutationFn: () => adminApi.signMyContract(contract.id, name.trim()),
    onSuccess: (data) => {
      queryClient.setQueryData(["contract"], data);
      toast.success(t.signedToast);
    },
    onError: (err: Error) => {
      const code = err instanceof ApiError ? err.fields?.signerName : undefined;
      if (code) setError(t.signErrors[code] ?? describeError(err));
      else toast.error(describeError(err));
    },
  });

  return (
    <aside className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5 lg:w-[360px] lg:shrink-0">
      <h2 className="text-lg font-semibold">{t.signTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.depositedBy(PRODUCT.name, contractDate(contract.uploadedAt))}</p>
      {!canSign ? (
        <p className="rounded-[10px] bg-warn-soft p-3 text-sm text-warn-text">{t.viewAsNote}</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (name.trim().split(/\s+/).length < 2) return setError(t.signErrors.full_name);
            if (!(await confirm(t.signConfirm(name.trim()), { title: t.signConfirmTitle, confirmLabel: t.sign }))) return;
            sign.mutate();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t.nameLabel}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
              aria-invalid={!!error}
              aria-describedby={error ? "signer-error" : undefined}
              className="h-11 rounded-[10px] border border-border bg-background px-3 text-base font-normal outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive"
            />
            {error && (
              <span id="signer-error" className="font-normal text-destructive">
                {error}
              </span>
            )}
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#1E5E2E]"
            />
            <span>{t.acceptLabel(operatorName)}</span>
          </label>
          <button type="submit" disabled={!accepted || !name.trim() || sign.isPending} className={primaryButton}>
            {sign.isPending ? t.signing : t.sign}
          </button>
          <p className="text-xs text-muted-foreground">{t.proofNote}</p>
        </form>
      )}
    </aside>
  );
}

function SignedCard({ contract }: { contract: PartnerContract }) {
  const download = useDownload();
  const rows: [string, string, boolean?][] = [
    [t.proofRows.typedName, contract.signer?.name ?? "—"],
    [t.proofRows.mention, t.proofRows.mentionValue],
    [t.proofRows.date, contract.signedAt ? contractDateTime(contract.signedAt) : "—", true],
    [t.proofRows.ip, contract.signerIp ?? "—", true],
    [t.proofRows.hash, contract.signedSha256 ?? "—", true],
    [t.proofRows.originalHash, contract.sha256, true],
    [t.proofRows.deposited, `${PRODUCT.name}, ${contractDate(contract.uploadedAt)}`],
  ];
  return (
    <section className="flex flex-col gap-5 rounded-[14px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold">
            {contract.title} · v{contract.version}
          </p>
          {contract.signedAt && contract.signer && (
            <p className="text-muted-foreground">{t.signedLine(contractDateTime(contract.signedAt).slice(0, 16), contract.signer.name)}</p>
          )}
        </div>
        <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-sm font-semibold text-ok-text">{t.signedBadge}</span>
      </div>
      <dl className="grid gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        {rows.map(([label, value, mono]) => (
          <div key={label} className="min-w-0">
            <dt className={labelClass}>{label}</dt>
            <dd className={mono ? "break-all font-mono" : "font-semibold"}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={primaryButton} onClick={() => download.mutate({ c: contract, kind: "signed" })}>
          {t.downloadSigned}
        </button>
        <button type="button" className={ghostButton} onClick={() => download.mutate({ c: contract, kind: "proof" })}>
          {t.downloadProof}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t.signedNote}</p>
    </section>
  );
}

/**
 * « Mon contrat » (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a): the contract Plazo deposited,
 * read in the page and signed by a manager (typed full name + « Lu et approuvé »), then the proof kept.
 */
export default function ContractPage() {
  const { user } = useAuth();
  const contract = useQuery({ queryKey: ["contract"], queryFn: adminApi.getMyContract });
  const download = useDownload();
  const current = contract.data?.current ?? null;
  const operatorName = user?.operatorName ?? "";

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.pageTitle}</h1>
      {contract.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : contract.error ? (
        <p className="text-destructive">{describeError(contract.error)}</p>
      ) : !current ? (
        <p className="rounded-[14px] border border-border bg-card p-5 text-muted-foreground">{t.noneYet(PRODUCT.name)}</p>
      ) : current.status === "pending" ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <span className="font-semibold">
                {current.title} · v{current.version}
              </span>
              <button type="button" className="text-lime-deep underline" onClick={() => download.mutate({ c: current, kind: "original" })}>
                {t.download}
              </button>
            </div>
            <PdfPreview contract={current} />
          </section>
          <SignPanel contract={current} canSign={!!contract.data?.canSign} operatorName={operatorName} />
        </div>
      ) : (
        <SignedCard contract={current} />
      )}

      {!!contract.data?.history.length && (
        <section className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 text-sm">
          <h2 className="text-[13px] uppercase tracking-[0.04em] text-muted-foreground">{t.previous}</h2>
          {contract.data.history.map((c) => (
            <div key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="w-28 font-mono text-lime-deep">{contractDate(c.signedAt ?? c.uploadedAt)}</span>
              <span className="flex-1">
                {t.historyLine(c)}
                {c.signer && ` ${t.signedBy(c.signer.name)}`}
              </span>
              <button type="button" className="text-lime-deep underline" onClick={() => download.mutate({ c, kind: "signed" })}>
                {t.signedPdf}
              </button>
              <button type="button" className="text-lime-deep underline" onClick={() => download.mutate({ c, kind: "proof" })}>
                {t.proof}
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
