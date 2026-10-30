import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { adminApi, ApiError } from "@/lib/api";
import { contractFieldsFr as t, describeError } from "@/lib/fr";
import { loadPdf, type LoadedPdf } from "@/lib/pdf-render";
import type { ContractField, ContractFieldKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const KEYS: ContractFieldKey[] = [
  "customer_name",
  "phone",
  "plate",
  "vehicle",
  "arrival_at",
  "return_at",
  "price",
  "reference",
  "return_flight",
  "signed_on",
  "signature",
];
const SIZES = [8, 9, 10, 11, 12, 14];
const PAGE_WIDTH = 620;

/** A new box for this key, its top left at (x, y), kept in the page. */
function newField(key: ContractFieldKey, page: number, x: number, y: number): ContractField {
  const w = key === "signature" ? 0.3 : key === "customer_name" || key === "vehicle" ? 0.32 : 0.22;
  const h = key === "signature" ? 0.08 : 0.024;
  return { key, page, x: clamp(x, 0, 1 - w), y: clamp(y, 0, 1 - h), w, h };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number) => Math.round(v * 10000) / 10000;

/**
 * « Placer les informations » (30/10/2026, « le contrat doit être pré-rempli avec les infos et la date de signature »,
 * direction A of https://claude.ai/artifact/MQjG7RcXy893kwj2M7a9ii): the parking's PDF, page by page, and the pieces of
 * information the manager drags where they go. Plazo stamps them on every contract read and signed.
 */
export default function ContractFieldsPage() {
  const { templateId = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["contract-template"], queryFn: adminApi.getContractTemplate });
  const template = query.data?.current?.id === templateId ? query.data.current : null;

  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [aspect, setAspect] = useState(1.414);
  const [fields, setFields] = useState<ContractField[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; mode: "move" | "resize"; dx: number; dy: number } | null>(null);

  // The fields kept on the version, once.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (template && loadedFor.current !== template.id) {
      loadedFor.current = template.id;
      setFields(template.fields ?? []);
    }
  }, [template]);

  // The PDF, drawn page by page.
  useEffect(() => {
    if (!template) return;
    let gone = false;
    let loaded: LoadedPdf | null = null;
    adminApi
      .contractTemplateFile(template.id)
      .then(({ blob }) => loadPdf(blob))
      .then((doc) => {
        loaded = doc;
        if (gone) doc.destroy();
        else setPdf(doc);
      })
      .catch(() => !gone && setPdfError(true));
    return () => {
      gone = true;
      loaded?.destroy();
    };
  }, [template?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let gone = false;
    pdf
      .render(pageIndex, canvas.current, PAGE_WIDTH)
      .then((a) => !gone && setAspect(a))
      .catch(() => !gone && setPdfError(true));
    return () => {
      gone = true;
    };
  }, [pdf, pageIndex]);

  const change = (next: ContractField[]) => {
    setFields(next);
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: () => adminApi.setContractFields(templateId, fields),
    onSuccess: (data) => {
      queryClient.setQueryData(["contract-template"], data);
      setDirty(false);
      toast.success(t.saved);
    },
    onError: (err: Error) => {
      const code = err instanceof ApiError ? (err.fields?.fields ?? err.code) : undefined;
      toast.error(code && t.errors[code] ? t.errors[code] : describeError(err));
    },
  });
  const preview = useMutation({
    mutationFn: () => adminApi.contractFieldsPreview(templateId, fields),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  /** A point of the page as fractions, from a pointer or drop event. */
  const pointOf = (clientX: number, clientY: number) => {
    const box = sheet.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return { x: 0.5, y: 0.5 };
    return { x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height };
  };

  const add = (key: ContractFieldKey, at?: { x: number; y: number }) => {
    const field = newField(key, pageIndex, at?.x ?? 0.35, at?.y ?? 0.45);
    change([...fields, field]);
    setSelected(fields.length);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = pointOf(e.clientX, e.clientY);
    change(
      fields.map((f, i) => {
        if (i !== d.index) return f;
        if (d.mode === "move")
          return { ...f, x: round(clamp(p.x - d.dx, 0, 1 - f.w)), y: round(clamp(p.y - d.dy, 0, 1 - f.h)) };
        return { ...f, w: round(clamp(p.x - f.x, 0.03, 1 - f.x)), h: round(clamp(p.y - f.y, 0.012, 1 - f.y)) };
      }),
    );
  };

  const startDrag = (e: React.PointerEvent, index: number, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    const p = pointOf(e.clientX, e.clientY);
    const f = fields[index];
    drag.current = { index, mode, dx: p.x - f.x, dy: p.y - f.y };
    setSelected(index);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  if (query.isLoading) return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  if (!template)
    return (
      <div className="space-y-3">
        <Back />
        <p className="text-sm text-muted-foreground" data-testid="fields-no-template">
          {t.noTemplate}
        </p>
      </div>
    );

  const pageCount = pdf?.numPages ?? template.pageCount;
  const onPage = fields.map((f, i) => ({ f, i })).filter(({ f }) => f.page === pageIndex);
  const current = selected != null ? fields[selected] : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Back />
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.title}</h1>
        <p className="text-sm font-semibold">{t.subtitle(template.title, template.version)}</p>
        <p className="max-w-3xl text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="space-y-3 rounded-xl border border-panel-line bg-panel p-4 lg:w-64 lg:shrink-0">
          <div>
            <h2 className="text-sm font-semibold">{t.palette}</h2>
            <p className="text-xs text-muted-foreground">{t.paletteHint}</p>
          </div>
          <ul className="space-y-1.5">
            {KEYS.map((key) => {
              const placed = fields.some((f) => f.key === key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    draggable
                    data-testid={`palette-${key}`}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", key)}
                    onClick={() => add(key)}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm",
                      placed
                        ? "bg-lime/20 font-semibold text-lime-deep"
                        : "border border-dashed border-panel-line hover:bg-panel-2",
                    )}
                  >
                    {placed ? "✓ " : ""}
                    {t.keys[key]}
                  </button>
                </li>
              );
            })}
          </ul>
          {current && (
            <div className="space-y-2 rounded-lg border border-panel-line p-3" data-testid="field-selected">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.selected}</p>
              <p className="text-sm font-semibold">{t.keys[current.key]}</p>
              {current.key !== "signature" && (
                <label className="flex items-center justify-between gap-2 text-sm">
                  {t.size}
                  <select
                    className="h-9 rounded-md border border-panel-line bg-panel px-2"
                    value={current.size ?? 10}
                    onChange={(e) =>
                      change(fields.map((f, i) => (i === selected ? { ...f, size: Number(e.target.value) } : f)))
                    }
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} pt
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                className="min-h-10 w-full rounded-full border border-panel-line text-sm font-semibold hover:bg-panel-2"
                onClick={() => {
                  change(fields.filter((_, i) => i !== selected));
                  setSelected(null);
                }}
              >
                {t.remove}
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t.placedCount(fields.length)}</p>
          <button
            type="button"
            data-testid="fields-save"
            disabled={save.isPending || !dirty}
            onClick={() => save.mutate()}
            className="min-h-11 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {save.isPending ? t.saving : t.save}
          </button>
          <button
            type="button"
            data-testid="fields-preview"
            disabled={preview.isPending}
            onClick={() => preview.mutate()}
            className="min-h-10 w-full rounded-full border border-lime-deep text-sm font-semibold text-lime-deep hover:bg-accent disabled:opacity-50"
          >
            {preview.isPending ? t.previewing : t.preview}
          </button>
        </aside>

        <section className="min-w-0 flex-1 space-y-3 overflow-x-auto rounded-xl bg-panel-2 p-4">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label={t.previousPage}
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-panel-line bg-panel disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold" data-testid="fields-page">
              {t.page(pageIndex + 1, pageCount)}
            </span>
            <button
              type="button"
              aria-label={t.nextPage}
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-panel-line bg-panel disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {pdfError && <p className="text-sm text-bad-text">{t.loadError}</p>}
          {!pdf && !pdfError && <p className="text-center text-sm text-muted-foreground">{t.loading}</p>}
          <div
            ref={sheet}
            data-testid="fields-sheet"
            className="relative mx-auto bg-white shadow-md"
            style={{ width: PAGE_WIDTH, height: PAGE_WIDTH * aspect, touchAction: "none" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const key = e.dataTransfer.getData("text/plain") as ContractFieldKey;
              if (KEYS.includes(key)) add(key, pointOf(e.clientX, e.clientY));
            }}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerDown={() => setSelected(null)}
          >
            <canvas ref={canvas} className="absolute inset-0" aria-hidden="true" />
            {onPage.map(({ f, i }) => (
              <div
                key={i}
                data-testid={`field-${f.key}`}
                onPointerDown={(e) => startDrag(e, i, "move")}
                className={cn(
                  "absolute flex cursor-move items-center overflow-hidden rounded border px-1 text-[11px] font-semibold text-lime-deep",
                  i === selected ? "border-lime-deep bg-lime/40" : "border-lime bg-lime/25",
                  f.key === "signature" && "border-dashed justify-center",
                )}
                style={{
                  left: `${f.x * 100}%`,
                  top: `${f.y * 100}%`,
                  width: `${f.w * 100}%`,
                  height: `${f.h * 100}%`,
                }}
              >
                <span className="truncate" title={t.keys[f.key]}>
                  {t.samples[f.key]}
                </span>
                {i === selected && (
                  <button
                    type="button"
                    aria-label={t.removeAria(t.keys[f.key])}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      change(fields.filter((_, j) => j !== i));
                      setSelected(null);
                    }}
                    className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-lime-deep text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
                <span
                  aria-hidden="true"
                  onPointerDown={(e) => startDrag(e, i, "resize")}
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 cursor-se-resize bg-lime-deep"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link to="/parking/reglages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      {t.crumb}
    </Link>
  );
}
