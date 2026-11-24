import { Monitor, RotateCw, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

const t = fr.site.live;

/** What « Mon site » holds before « Enregistrer », sent to the framed site (site/src/components/parking-site/LivePreview). */
export interface SiteDraft {
  theme: string;
  accent: string;
  accent2: string | null;
  blocks: { id: string; kind: string; enabled: boolean; title: string | null; text: string | null }[];
  showLogo: boolean;
  rating: { value: number; count: number | null } | null;
  pages: boolean;
  heroPhotoUrl: string | null;
  teamPhotoUrl: string | null;
}

/** The width the site is drawn at, then scaled down to the frame. */
const WIDTHS = { desktop: 1280, phone: 390 } as const;
type Device = keyof typeof WIDTHS;

/**
 * The parking's site beside the form (24/11/2026, « Il faut un aperçu du site en cours d'édition », choix A côte à côte,
 * en direct): the site with the manager's preview key in a frame, drawn at a computer's or a phone's width and scaled to
 * fit; every change of the form is sent to it at once, before « Enregistrer ».
 */
export function SitePreview({ url, draft, onClose }: { url: string; draft: SiteDraft; onClose?: () => void }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [round, setRound] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const origin = new URL(url, window.location.href).origin;
  const latest = useRef(draft);
  latest.current = draft;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "plazo-site-draft", draft: latest.current }, origin);
  }, [origin]);

  // The framed page says it is ready (first load, a page opened inside it): it gets the draft.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === origin && event.source === frame.current?.contentWindow && event.data?.type === "plazo-site-ready") send();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin, send]);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(send, 120);
    return () => window.clearTimeout(timer);
  }, [draft, send]);

  const width = WIDTHS[device];
  const scale = size.width ? Math.min(1, size.width / width) : 1;
  const left = Math.max(0, (size.width - width * scale) / 2);

  return (
    <section aria-label={t.title} className="flex h-full min-h-0 flex-col gap-2" data-testid="site-live-preview">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-narrow text-xl font-bold">{t.title}</h2>
        <div role="group" aria-label={t.device} className="ml-auto flex rounded-[10px] border border-border bg-white p-0.5">
          {(["desktop", "phone"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn("flex min-h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-sm font-semibold", device === d ? "bg-lime text-lime-ink" : "text-muted-foreground")}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t[d]}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => setRound((r) => r + 1)} aria-label={t.reload} title={t.reload} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-white">
          <RotateCw className="h-4 w-4" aria-hidden />
        </button>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t.close} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-white">
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t.note}</p>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] border border-border bg-panel-2">
        {size.width > 0 && (
          <iframe
            key={`${round}-${device}`}
            ref={frame}
            src={url}
            title={t.frameTitle}
            data-testid="site-live-frame"
            style={{ width, height: size.height / scale, transform: `scale(${scale})`, transformOrigin: "top left", left }}
            className="absolute top-0 border-0 bg-white"
          />
        )}
      </div>
    </section>
  );
}
