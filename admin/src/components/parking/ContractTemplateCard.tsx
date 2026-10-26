import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi, ApiError } from "@/lib/api";
import { contractDate, fileSize, savePdf } from "@/lib/contract";
import { contractTemplateFr as t, describeError } from "@/lib/fr";
import type { ContractTemplate, ContractTemplates } from "@/lib/types";

const ghostButton =
  "min-h-10 whitespace-nowrap rounded-full border border-lime-deep px-3 text-sm font-semibold text-lime-deep hover:bg-accent disabled:opacity-50";
const primaryButton =
  "min-h-10 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * « Contrat de stationnement » of Parking › Réglages (26/10/2026, choice A « Mon PDF »): the PDF the travellers sign at
 * the counter, its versions, « Remplacer » and « Revenir au modèle Plazo ». Managers only (parking:manage).
 */
export function ContractTemplateCard() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["contract-template"],
    queryFn: adminApi.getContractTemplate,
  });
  const settle = (data: ContractTemplates) =>
    queryClient.setQueryData(["contract-template"], data);

  const upload = useMutation({
    mutationFn: (file: File) =>
      adminApi.uploadContractTemplate(file, title.trim() || undefined),
    onSuccess: (data) => {
      settle(data);
      setTitle("");
      setFileError(null);
      toast.success(t.uploaded(data.current?.version ?? 0));
    },
    onError: (err: Error) => {
      const code =
        err instanceof ApiError ? (err.fields?.file ?? err.code) : undefined;
      if (code && t.fileErrors[code]) setFileError(t.fileErrors[code]);
      else toast.error(describeError(err));
    },
  });
  const revert = useMutation({
    mutationFn: adminApi.revertContractTemplate,
    onSuccess: (data) => {
      settle(data);
      toast.success(t.reverted);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const open = useMutation({
    mutationFn: async (c: ContractTemplate) => {
      const { blob } = await adminApi.contractTemplateFile(c.id);
      savePdf(blob, c.fileName);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return setFileError(t.fileErrors.too_large);
    setFileError(null);
    upload.mutate(file);
  };

  const data = query.data;
  const current = data?.current ?? null;
  return (
    <Card data-testid="contract-template-card">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {query.isError && (
          <p className="text-sm text-destructive">{t.loadError}</p>
        )}
        {data && (
          <div className="rounded-xl border border-panel-line p-4">
            {current ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text">
                    {t.inForce}
                  </span>
                  <span className="font-semibold">
                    {t.current(current.title, current.version)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.fileLine(
                    current.fileName,
                    current.pageCount,
                    fileSize(current.sizeBytes),
                    contractDate(current.uploadedAt),
                    current.uploadedBy,
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.signedCount(current.signedCount)}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    className={ghostButton}
                    onClick={() => open.mutate(current)}
                    disabled={open.isPending}
                  >
                    {t.view}
                  </button>
                  <button
                    type="button"
                    className={primaryButton}
                    disabled={upload.isPending}
                    onClick={() => input.current?.click()}
                  >
                    {upload.isPending ? t.uploading : t.replace}
                  </button>
                  <button
                    type="button"
                    className={ghostButton}
                    disabled={revert.isPending}
                    onClick={async () => {
                      if (
                        await confirm(t.revertConfirm(current.version), {
                          title: t.revertTitle,
                          confirmLabel: t.revert,
                          destructive: true,
                        })
                      )
                        revert.mutate();
                    }}
                  >
                    {t.revert}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {t.inForce}
                  </span>
                  <span className="font-semibold">{t.plazoTemplate}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.plazoTemplateHint}
                </p>
                {data.plazoSignedCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t.plazoSignedCount(data.plazoSignedCount)}
                  </p>
                )}
                <div className="flex flex-wrap items-end gap-3 pt-2">
                  <label className="flex w-full max-w-sm flex-col gap-1 text-sm">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {t.titleLabel}
                    </span>
                    <input
                      value={title}
                      maxLength={120}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.titlePlaceholder}
                      className="h-10 rounded-[10px] border border-border bg-background px-3 text-base outline-none focus-visible:border-lime-deep"
                    />
                  </label>
                  <button
                    type="button"
                    className={primaryButton}
                    disabled={upload.isPending}
                    onClick={() => input.current?.click()}
                  >
                    {upload.isPending ? t.uploading : t.upload}
                  </button>
                </div>
              </div>
            )}
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
            {fileError && (
              <p role="alert" className="pt-2 text-sm text-destructive">
                {fileError}
              </p>
            )}
            <p className="pt-2 text-xs text-muted-foreground">{t.hint}</p>
          </div>
        )}
        {data && data.history.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">{t.history}</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {data.history.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1"
                >
                  <span>
                    {t.historyLine(
                      c.version,
                      c.title,
                      contractDate(c.uploadedAt),
                      c.retiredAt ? contractDate(c.retiredAt) : "",
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    · {t.signedCount(c.signedCount)}
                  </span>
                  <button
                    type="button"
                    className="text-lime-deep underline"
                    onClick={() => open.mutate(c)}
                  >
                    {t.view}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link
          to="/contrats"
          className="inline-block text-sm font-semibold text-lime-deep underline"
        >
          {t.register} ›
        </Link>
      </CardContent>
    </Card>
  );
}
