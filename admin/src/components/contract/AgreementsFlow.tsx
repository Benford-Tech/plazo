import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { AGREEMENTS_KEY, contractDateTime, savePdf } from "@/lib/contract";
import { agreementsFr as t, describeError } from "@/lib/fr";
import type {
  Agreement,
  AgreementKind,
  Agreements,
  SignedAgreement,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const ghostButton =
  "min-h-11 rounded-full border border-border bg-card px-4 font-semibold hover:bg-accent disabled:opacity-50";
const primaryButton =
  "min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:brightness-105 disabled:opacity-50";

/** The text of a contract, as it will be signed. */
export function AgreementText({ agreement }: { agreement: Agreement }) {
  return (
    <div
      className="max-h-[60vh] min-h-[240px] overflow-y-auto rounded-[10px] border border-border bg-background px-4 py-3 text-sm leading-relaxed sm:px-6"
      tabIndex={0}
      aria-label={agreement.title}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {t.between}
      </p>
      {agreement.parties.map((p) => (
        <p key={p} className="mt-1">
          {p}
        </p>
      ))}
      {agreement.articles.map((a) => (
        <section key={a.heading} className="mt-4">
          <h4 className="font-semibold">{a.heading}</h4>
          {a.paragraphs.map((p, i) => (
            <p key={i} className="mt-1">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

function useFiles() {
  return useMutation({
    mutationFn: async (
      arg:
        | { preview: AgreementKind }
        | { id: string; kind: "signed" | "proof" },
    ) => {
      const { blob, filename } =
        "preview" in arg
          ? await adminApi.agreementPreview(arg.preview)
          : await adminApi.agreementFile(arg.id, arg.kind);
      savePdf(blob, filename ?? "contrat.pdf");
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
}

function SignedLine({ signed }: { signed: SignedAgreement }) {
  const files = useFiles();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="flex-1 text-muted-foreground">
        {t.signedLine(
          contractDateTime(signed.signedAt).slice(0, 16),
          signed.signerName,
        )}
      </span>
      <button
        type="button"
        className="text-lime-deep underline"
        onClick={() => files.mutate({ id: signed.id, kind: "signed" })}
      >
        {t.signedPdf}
      </button>
      <button
        type="button"
        className="text-lime-deep underline"
        onClick={() => files.mutate({ id: signed.id, kind: "proof" })}
      >
        {t.proof}
      </button>
    </div>
  );
}

/** One card per contract: signed (PDF and proof), to sign, or waiting for the listing. */
function Overview({
  data,
  onStart,
}: {
  data: Agreements;
  onStart: (kinds: AgreementKind[]) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.agreements.map((a) => {
        const due = data.toSign.includes(a.kind);
        return (
          <article
            key={a.kind}
            className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-border bg-card p-5"
            data-testid={`agreement-${a.kind}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{a.title}</h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  a.signed
                    ? "bg-ok-soft text-ok-text"
                    : due
                      ? "bg-warn-soft text-warn-text"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {a.signed ? t.signedBadge : due ? t.toSignBadge : t.laterBadge}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.summary[a.kind]} {t.version(a.version)}.
            </p>
            {a.signed ? (
              <SignedLine signed={a.signed} />
            ) : (
              <div>
                <button
                  type="button"
                  className={due ? primaryButton : ghostButton}
                  onClick={() => onStart([a.kind])}
                >
                  {t.startOne}
                </button>
              </div>
            )}
            {a.history.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-border pt-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {t.previous}
                </p>
                {a.history.map((h) => (
                  <SignedLine key={h.id} signed={h} />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/**
 * « Mon contrat » (17/11/2026, choice C « Un parcours, deux signatures »): read the terms of use of Plazo Pro, read the
 * listing contract (skippable while the parking does not sell on Plazo), then sign both with one typed name and a box per
 * contract. Nothing is blocked while they wait.
 */
export function AgreementsFlow() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: AGREEMENTS_KEY,
    queryFn: adminApi.getAgreements,
  });
  const files = useFiles();
  const [flow, setFlow] = useState<AgreementKind[] | null>(null);
  const [step, setStep] = useState(0);
  const [read, setRead] = useState<AgreementKind[]>([]);
  const [ticked, setTicked] = useState<AgreementKind[]>([]);
  const [name, setName] = useState(() => user?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const operatorName = user?.operatorName ?? "";
  const data = query.data;

  const start = (kinds: AgreementKind[]) => {
    setFlow(kinds);
    setStep(0);
    setRead([]);
    setTicked([]);
    setNameError(null);
  };
  const close = () => setFlow(null);

  const sign = useMutation({
    mutationFn: () => {
      const kinds = ticked;
      const shas = Object.fromEntries(
        (data?.agreements ?? [])
          .filter((a) => kinds.includes(a.kind))
          .map((a) => [a.kind, a.textSha256]),
      );
      return adminApi.signAgreements(name.trim(), kinds, shas);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(AGREEMENTS_KEY, next);
      toast.success(t.signedToast(ticked.length));
      close();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.code === "text_changed") {
        toast.error(t.textChanged);
        queryClient.invalidateQueries({ queryKey: AGREEMENTS_KEY });
        if (flow) start(flow);
        return;
      }
      const code = err instanceof ApiError ? err.fields?.signerName : undefined;
      if (code) setNameError(t.signErrors[code] ?? describeError(err));
      else toast.error(describeError(err));
    },
  });

  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  if (query.error || !data)
    return <p className="text-destructive">{describeError(query.error)}</p>;

  const header = (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
    </div>
  );

  if (!flow) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          {header}
          {data.toSign.length > 0 && (
            <button
              type="button"
              className={primaryButton}
              onClick={() =>
                start(
                  data.agreements.filter((a) => !a.signed).map((a) => a.kind),
                )
              }
            >
              {t.start}
            </button>
          )}
        </div>
        <Overview data={data} onStart={start} />
      </section>
    );
  }

  const steps: (AgreementKind | "sign")[] = [...flow, "sign"];
  const current = steps[step];
  const agreement =
    current === "sign"
      ? null
      : data.agreements.find((a) => a.kind === current)!;
  const readAgreements = data.agreements.filter((a) => read.includes(a.kind));

  const next = (kind: AgreementKind, accepted: boolean) => {
    if (accepted) {
      setRead((r) => [...new Set([...r, kind])]);
      setTicked((tk) => tk.filter((k) => k !== kind));
    } else {
      setRead((r) => r.filter((k) => k !== kind));
    }
    const after = step + 1;
    // Nothing read at all (listing skipped alone): back to the overview.
    if (
      steps[after] === "sign" &&
      !accepted &&
      read.filter((k) => k !== kind).length === 0
    )
      return close();
    setStep(after);
  };

  return (
    <section className="flex flex-col gap-4">
      {header}
      <ol
        className="flex flex-wrap items-center gap-2 text-sm"
        aria-label={t.stepLabel(step + 1, steps.length)}
      >
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">—</span>}
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-lime-deep text-white"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span
              className={i === step ? "font-semibold" : "text-muted-foreground"}
            >
              {t.steps[s]}
            </span>
          </li>
        ))}
      </ol>

      {agreement ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold">
              {agreement.title}{" "}
              <span className="font-normal text-muted-foreground">
                · {t.version(agreement.version)}
              </span>
            </h3>
            <button
              type="button"
              className="text-lime-deep underline"
              onClick={() => files.mutate({ preview: agreement.kind })}
            >
              {t.downloadPdf}
            </button>
          </div>
          {agreement.kind === "listing" && !data.sellsOnPlazo && (
            <p className="text-sm text-muted-foreground">{t.listingOptional}</p>
          )}
          <AgreementText agreement={agreement} />
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              className={primaryButton}
              onClick={() => next(agreement.kind, true)}
            >
              {t.read}
            </button>
            {agreement.kind === "listing" && (
              <button
                type="button"
                className={ghostButton}
                onClick={() => next("listing", false)}
              >
                {t.skipListing}
              </button>
            )}
            <button
              type="button"
              className={ghostButton}
              onClick={() => (step === 0 ? close() : setStep(step - 1))}
            >
              {t.back}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-4 rounded-[14px] border border-border bg-card p-5">
          <h3 className="text-base font-semibold">{t.signTitle}</h3>
          {!data.canSign ? (
            <p className="rounded-[10px] bg-warn-soft p-3 text-sm text-warn-text">
              {t.viewAsNote}
            </p>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setNameError(null);
                const trimmed = name.trim();
                if (trimmed.split(/\s+/).length < 2)
                  return setNameError(t.signErrors.full_name);
                if (
                  !(await confirm(t.confirm(trimmed, ticked.length), {
                    title: t.confirmTitle,
                    confirmLabel: t.signCount(ticked.length),
                  }))
                )
                  return;
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
                  aria-invalid={!!nameError}
                  aria-describedby={
                    nameError ? "agreement-signer-error" : undefined
                  }
                  className="h-11 rounded-[10px] border border-border bg-background px-3 text-base font-normal outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive"
                />
                {nameError && (
                  <span
                    id="agreement-signer-error"
                    className="font-normal text-destructive"
                  >
                    {nameError}
                  </span>
                )}
              </label>
              {readAgreements.map((a) => (
                <label key={a.kind} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={ticked.includes(a.kind)}
                    onChange={(e) =>
                      setTicked((tk) =>
                        e.target.checked
                          ? [...tk, a.kind]
                          : tk.filter((k) => k !== a.kind),
                      )
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#1E5E2E]"
                  />
                  <span>{t.accept(a.title, operatorName)}</span>
                </label>
              ))}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="submit"
                  disabled={!ticked.length || !name.trim() || sign.isPending}
                  className={primaryButton}
                >
                  {sign.isPending
                    ? t.signing
                    : t.signCount(Math.max(ticked.length, 1))}
                </button>
                <button
                  type="button"
                  className={ghostButton}
                  onClick={() => setStep(step - 1)}
                >
                  {t.back}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t.proofNote}</p>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
