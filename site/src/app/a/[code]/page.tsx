import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  APP_LINK_CODE_RE,
  appSchemeUrl,
  appStoreUrl,
  platformOf,
  playStoreUrl,
} from "@/lib/app-link";
import { formatDay, parseLocal } from "@/lib/dates";
import { fr } from "@/lib/fr";
import { managePath } from "@/lib/manage-access";
import type { AppLinkTarget } from "@/lib/types";

export const dynamic = "force-dynamic";

// Personal data behind the code: never indexed, never sent to another site as a Referer.
export const metadata: Metadata = {
  title: fr.meta.manageTitle,
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

const t = fr.appLink;

function Invalid() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
      <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">
        {t.invalidTitle}
      </h1>
      <p className="text-[15px] leading-snug font-medium text-soft">
        {t.invalidText}
      </p>
      <Link
        href="/ma-reservation"
        className="btn-primary min-h-12 self-start px-7 text-[15px]"
      >
        {fr.nav.myBooking}
      </Link>
    </main>
  );
}

/**
 * « Lien court Plazo » (direction B, 27/10/2026): https://www.plazo.fr/a/<REF>-<code>. A phone with the app never
 * gets here (the OS opens the app itself). A phone without it is remembered by the API for 24 h, then sent to the
 * store: at the app's first launch, the booking opens by itself. A computer goes straight to the booking's page.
 */
export default async function AppLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!APP_LINK_CODE_RE.test(code)) return <Invalid />;

  let target: AppLinkTarget | null = null;
  try {
    target = await api.appLink(code);
  } catch (error) {
    if (
      !(
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      )
    )
      throw error;
  }
  if (!target) return <Invalid />;

  const manageHref = `${managePath(target.reference)}?cle=${encodeURIComponent(target.manageToken)}`;
  const platform = platformOf((await headers()).get("user-agent"));
  if (!platform) redirect(manageHref);

  // Remembered before the store (nothing readable is stored: a hash of the address and the platform, 24 h).
  await api.claimAppLink(code, platform).catch(() => undefined);

  const appStore = appStoreUrl();
  const storeHref = platform === "android" ? playStoreUrl(code) : appStore;
  const arrival = parseLocal(target.arrivalAt);
  const when = arrival
    ? `${formatDay(arrival.date)} · ${arrival.time}`
    : target.arrivalAt;

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
      <div className="flex flex-col gap-2">
        <p className="eyebrow text-accent-dark">{fr.nav.myBooking}</p>
        <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">
          {t.title(target.reference)}
        </h1>
        <p className="text-[15px] leading-snug font-medium text-soft">
          {t.lead(target.parking.title)}
        </p>
      </div>
      <div
        className="card flex flex-col gap-4 p-4 md:p-6"
        data-testid="app-link-card"
      >
        <div className="flex items-baseline justify-between gap-3 text-[15px]">
          <span className="font-mono tracking-[0.08em]">
            {target.reference}
          </span>
          <span className="font-hour text-soft">{when}</span>
        </div>
        {storeHref ? (
          <a
            href={storeHref}
            rel="noreferrer"
            className="btn-primary min-h-12 px-7 text-[15px]"
            data-testid="app-link-install"
          >
            {t.install}
          </a>
        ) : (
          <p className="text-[14px] leading-snug text-soft">{t.iosSoon}</p>
        )}
        <div className="flex items-center justify-center">
          {platform === "android" ? (
            <a
              href={storeHref ?? "#"}
              rel="noreferrer"
              aria-label={t.playBadge}
            >
              <Image
                src="/badges/google-play-fr.png"
                alt={t.playBadge}
                width={180}
                height={54}
              />
            </a>
          ) : appStore ? (
            <a href={appStore} rel="noreferrer" aria-label={t.appStoreBadge}>
              <Image
                src="/badges/app-store-fr.png"
                alt={t.appStoreBadge}
                width={160}
                height={54}
              />
            </a>
          ) : (
            <Image
              src="/badges/app-store-fr-soon.png"
              alt=""
              width={160}
              height={54}
              className="opacity-60"
            />
          )}
        </div>
        <a
          href={appSchemeUrl(code)}
          className="text-center text-[14px] font-semibold text-accent-dark underline underline-offset-4"
        >
          {t.alreadyInstalled}
        </a>
        <Link
          href={manageHref}
          className="btn-secondary min-h-12 px-7 text-[15px]"
          data-testid="app-link-web"
        >
          {t.continueWeb}
        </Link>
      </div>
    </main>
  );
}
