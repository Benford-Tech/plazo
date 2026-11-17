import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { ParkingLogo } from "@/components/ParkingLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import {
  buildFlyerPdf,
  FLYER_NAME_MAX,
  flyerFileName,
  flyerQrUrl,
  initialsOf,
  type FlyerFormat,
  type FlyerImage,
  type FlyerInput,
} from "@/lib/flyer";
import { fr } from "@/lib/fr";
import { loadPdf } from "@/lib/pdf-render";
import { cn } from "@/lib/utils";

// The traveller site shares the domain (served at /); VITE_SITE_URL points elsewhere in development.
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

const card = "flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5";
const labelClass = "text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";

/** A PNG or JPEG as it is; anything else (WebP) redrawn as a PNG, which pdf-lib embeds. */
async function asFlyerImage(blob: Blob): Promise<FlyerImage | null> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { bytes, type: "png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { bytes, type: "jpeg" };
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return png ? { bytes: new Uint8Array(await png.arrayBuffer()), type: "png" } : null;
  } catch {
    return null;
  }
}

async function fetchBadge(path: string): Promise<FlyerImage | null> {
  try {
    const res = await fetch(`${SITE_URL}${path}`);
    if (!res.ok) return null;
    return asFlyerImage(await res.blob());
  } catch {
    return null;
  }
}

/**
 * « Flyer pour vos clients » (17/11/2026, direction C « Partez léger, revenez sans attendre. »): the manager checks the
 * name, chooses whether to print the parking's phone, and downloads the A4 flyer or two A5 on one sheet. The preview is
 * the PDF itself, drawn by pdf.js.
 */
export default function FlyerPage() {
  const t = fr.flyer;
  const { user } = useAuth();
  const listing = useQuery({ queryKey: ["listing"], queryFn: adminApi.getListing });
  const logoVersion = user?.operatorLogoUpdatedAt ?? null;
  const logo = useQuery({
    queryKey: ["flyer-logo", logoVersion],
    queryFn: async () => asFlyerImage(await adminApi.operatorLogo(logoVersion!)),
    enabled: !!logoVersion,
    staleTime: Infinity,
    retry: false,
  });
  const badges = useQuery({
    queryKey: ["flyer-badges"],
    queryFn: async () => {
      const [appStore, googlePlay] = await Promise.all([fetchBadge("/badges/app-store-fr.png"), fetchBadge("/badges/google-play-fr.png")]);
      return appStore && googlePlay ? { appStore, googlePlay } : null;
    },
    staleTime: Infinity,
    retry: false,
  });

  const [name, setName] = useState<string | null>(null);
  const [withPhone, setWithPhone] = useState(true);
  const [busy, setBusy] = useState<FlyerFormat | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = listing.data;
  const defaultName = (data?.listing?.title ?? data?.parking.name ?? user?.operatorName ?? "").slice(0, FLYER_NAME_MAX);
  const shownName = name ?? defaultName;
  const phone = data?.listing?.contactPhone?.trim() || null;
  const qr = flyerQrUrl(SITE_URL || window.location.origin, data?.listing ?? null);
  const ready = !!data && (!logoVersion || !logo.isLoading) && !badges.isLoading;

  const input = (format: FlyerFormat): FlyerInput => ({
    name: shownName.trim() || defaultName,
    phone: withPhone ? phone : null,
    qrUrl: qr.url,
    logo: logo.data ?? null,
    badges: badges.data ?? null,
    format,
  });
  const inputKey = JSON.stringify({ n: shownName, p: withPhone && phone, q: qr.url, l: logoVersion, b: !!badges.data });

  // The preview follows each change, 300 ms after the last one.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const bytes = await buildFlyerPdf(input("a4"));
        const pdf = await loadPdf(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
        if (!cancelled && canvasRef.current) await pdf.render(0, canvasRef.current, canvasRef.current.parentElement?.clientWidth || 360);
        pdf.destroy();
        if (!cancelled) setPreviewFailed(false);
      } catch {
        if (!cancelled) setPreviewFailed(true);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, inputKey]);

  const download = async (format: FlyerFormat) => {
    setBusy(format);
    try {
      const bytes = await buildFlyerPdf(input(format));
      const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = flyerFileName(shownName.trim() || defaultName, format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PlazoTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">{t.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.intro}</p>
      </div>
      {!data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className={card} aria-labelledby="flyer-parking">
              <h2 id="flyer-parking" className="text-lg font-bold">{t.parkingTitle}</h2>
              <div className="flex items-center gap-3.5">
                {logoVersion ? (
                  <ParkingLogo version={logoVersion} name={shownName} size={56} />
                ) : (
                  <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-lime-deep text-lg font-extrabold text-white">
                    {initialsOf(shownName || defaultName)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">{t.logo}</span>
                  <span className="text-sm text-muted-foreground">{logoVersion ? t.logoSet : t.logoNone}</span>
                  <Link to="/parking/reglages" className="text-sm font-semibold text-lime-deep underline-offset-2 hover:underline">
                    {t.changeLogo}
                  </Link>
                </div>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>{t.name}</span>
                <input
                  type="text"
                  data-testid="flyer-name"
                  value={shownName}
                  maxLength={FLYER_NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-border bg-card px-3 text-base outline-none focus-visible:border-lime-deep"
                />
                <span className="text-xs text-muted-foreground">{t.nameHint(FLYER_NAME_MAX)}</span>
              </label>
              {phone ? (
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    data-testid="flyer-phone"
                    checked={withPhone}
                    onChange={(e) => setWithPhone(e.target.checked)}
                    className="mt-0.5 size-[18px] accent-[#1E5E2E]"
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{t.phone}</span>
                    <span className="text-sm text-muted-foreground">{t.phoneHint(phone)}</span>
                  </span>
                </label>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/plazo/fiche" className="font-semibold text-lime-deep underline-offset-2 hover:underline">{t.phoneMissing}</Link>
                </p>
              )}
            </section>

            <section className={card} aria-labelledby="flyer-qr">
              <h2 id="flyer-qr" className="text-lg font-bold">{t.qrTitle}</h2>
              {qr.listing ? (
                <p className="text-sm">
                  {t.qrListing}{" "}
                  <a href={qr.url} target="_blank" rel="noreferrer" data-testid="flyer-qr-url" className="break-all font-semibold text-lime-deep underline-offset-2 hover:underline">
                    {qr.url}
                  </a>
                </p>
              ) : (
                <p role="status" data-testid="flyer-qr-fallback" className="rounded-[10px] bg-amber-50 p-3 text-sm text-amber-900">
                  {t.qrNoListing}
                </p>
              )}
            </section>
          </div>

          <section className={cn(card, "items-center")} aria-labelledby="flyer-preview">
            <h2 id="flyer-preview" className="self-stretch text-lg font-bold">{t.preview} · A4</h2>
            <div className="w-full max-w-[360px] overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.10)]">
              <canvas ref={canvasRef} data-testid="flyer-preview" className="block w-full" aria-label={t.title} role="img" />
            </div>
            {previewFailed && <p className="text-sm text-muted-foreground">{t.previewFailed}</p>}
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                data-testid="flyer-download-a4"
                disabled={!ready || busy !== null}
                onClick={() => download("a4")}
                className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:brightness-105 disabled:opacity-50"
              >
                {busy === "a4" ? t.preparing : t.downloadA4}
              </button>
              <button
                type="button"
                data-testid="flyer-download-a5"
                disabled={!ready || busy !== null}
                onClick={() => download("a5")}
                className="min-h-11 rounded-full border border-lime-deep px-5 font-semibold text-lime-deep hover:bg-accent disabled:opacity-50"
              >
                {busy === "a5" ? t.preparing : t.downloadA5}
              </button>
            </div>
            <p className="max-w-sm text-center text-sm text-muted-foreground">{t.footnote}</p>
          </section>
        </div>
      )}
    </>
  );
}
