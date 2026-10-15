import Link from "next/link";
import { FacebookIcon, InstagramIcon, LinkedInIcon, LockIcon } from "@/components/FooterIcons";
import { HelpCard } from "@/components/HelpCard";
import { HiddenOn } from "@/components/HiddenOn";
import { Logo } from "@/components/Logo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ACCOUNT_DELETION_PATH } from "@/lib/account-deletion";
import { newsletterAction } from "@/lib/contact-actions";
import { currentYear, type FooterConfig, footerConfig, legalLine, type SocialNetwork } from "@/lib/footer";
import { fr } from "@/lib/fr";
import { topicLinks } from "@/lib/guides";
import { AIRPORTS, airportPath, CONTACT_PATH, PRO_LOGIN_PATH, PRO_SIGNUP_PATH } from "@/lib/site";

// 44 px targets on phones (20 px line + 2 x 12 px), with the same spacing whether a label takes one line or two; from md
// up the mockup's 14 px / 1.6 lines, 6 px apart, with a mouse only (a tablet's finger keeps the 44 px).
const linkClass =
  "block w-fit py-3 text-[14px] leading-5 font-medium text-lilac/85 no-underline underline-offset-4 transition-colors hover:text-white hover:underline md:leading-[1.6] md:pointer-fine:py-[3px]";

function Column({
  id,
  title,
  className = "",
  listClassName = "flex flex-col",
  children,
}: {
  id?: string;
  title: string;
  className?: string;
  listClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`flex min-w-0 flex-col ${className}`}>
      <h2 className="eyebrow mb-1 text-lilac/60 md:mb-[9px]">{title}</h2>
      <ul className={listClassName}>{children}</ul>
    </div>
  );
}

const SOCIAL_ICONS: Record<SocialNetwork, () => React.ReactNode> = {
  instagram: () => <InstagramIcon />,
  facebook: () => <FacebookIcon />,
  linkedin: () => <LinkedInIcon />,
};

// The payment chips: white tags, like the cards' own marks. Only Visa has its colour (the mark's blue).
const CHIP = "inline-flex h-[30px] items-center rounded-[6px] bg-white px-2.5 text-[12px] leading-none";
const CHIP_STYLE: Record<string, string> = {
  CB: "font-extrabold text-ink",
  Visa: "font-extrabold italic tracking-[0.04em] text-visa uppercase",
};

// The second row from md up: Paiement · Suivez-nous · La lettre, whatever is configured; on phones the blocks stack,
// the letter before the socials (A-mobile), which is also their order in the page.
function secondRow(social: boolean, newsletter: boolean) {
  if (social && newsletter) {
    return { grid: "md:grid-cols-[1.2fr_0.8fr_1.3fr]", newsletter: "md:col-start-3 md:row-start-1", social: "md:col-start-2 md:row-start-1" };
  }
  return { grid: newsletter ? "md:grid-cols-[1.2fr_1.3fr_0.8fr]" : "md:grid-cols-[1.2fr_0.8fr_1.3fr]", newsletter: "", social: "" };
}

/**
 * Footer A (chosen by Joanny on 15/10/2026, mockups « A · Bande d'aide »): the help card on the ivory ground, then the
 * espresso footer: logo and pitch, three columns of links, a row with the payment means, the social accounts and « La
 * lettre Plazo », and the legal line. What depends on facts not given yet stays hidden (see lib/footer.ts).
 */
export function SiteFooter({ config = footerConfig(), year = currentYear() }: { config?: FooterConfig; year?: number }) {
  const legal = legalLine(config.company, year, fr.footer.rights, fr.footer.vat);
  const social = config.social.length > 0;
  const row = secondRow(social, config.newsletter);
  return (
    <div className="mt-auto">
      <HiddenOn paths={[CONTACT_PATH]}>
        <HelpCard config={config} />
      </HiddenOn>
      <footer className="on-dark bg-dark text-lilac">
        <div className="mx-auto max-w-[1280px] px-4 pt-10 md:px-12 md:pt-14">
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-[2fr_1fr_1fr_1.15fr] md:gap-10">
            <div className="col-span-2 flex flex-col gap-3.5 border-b border-white/10 pb-7 md:col-span-1 md:gap-4 md:border-b-0 md:pb-0">
              <Logo height={30} className="self-start" />
              <p className="font-title max-w-[380px] text-[19px] leading-[1.35] text-lilac md:text-[21px]">{fr.footer.pitch}</p>
            </div>
            <Column id="aeroports" title={fr.footer.airports}>
              {AIRPORTS.map(a => (
                <li key={a.slug}>
                  <Link href={airportPath(a.slug)} className={linkClass}>
                    {a.name}
                  </Link>
                </li>
              ))}
              <li className="py-3 text-[14px] leading-5 font-medium text-lilac/60 md:leading-[1.6] md:pointer-fine:py-[3px]">{fr.footer.moreAirports}</li>
            </Column>
            <Column title={fr.footer.travellers}>
              <li>
                <Link href="/ma-reservation" className={linkClass}>
                  {fr.nav.myBooking}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={linkClass}>
                  {fr.footer.faq}
                </Link>
              </li>
              {/* The topic guides of each airport (09/10/2026), linked from every page. */}
              {AIRPORTS.flatMap(a =>
                topicLinks(a.slug).map(topic => (
                  <li key={topic.href}>
                    <Link href={topic.href} className={linkClass}>
                      {fr.guide.footerLink(topic.short, a.name)}
                    </Link>
                  </li>
                )),
              )}
              {/* The contact form needs a real support address: hidden while product.json holds a placeholder. */}
              {config.contactForm && (
                <li>
                  <Link href={CONTACT_PATH} className={linkClass}>
                    {fr.footer.contact}
                  </Link>
                </li>
              )}
            </Column>
            {/* Phones: across both columns, its links two by two (A-mobile). */}
            <Column title={fr.footer.product} className="col-span-2 md:col-span-1" listClassName="grid grid-cols-2 gap-x-5 md:flex md:flex-col">
              <li>
                {/* The pro space is another service on the same domain: full page loads, not client-side navigations. */}
                <a href={PRO_SIGNUP_PATH} className={linkClass}>
                  {fr.nav.forOperators}
                </a>
              </li>
              <li>
                <a href={PRO_LOGIN_PATH} className={linkClass}>
                  {fr.footer.proLogin}
                </a>
              </li>
              <li>
                <Link href="/conditions" className={linkClass}>
                  {fr.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className={linkClass}>
                  {fr.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className={linkClass}>
                  {fr.footer.legal}
                </Link>
              </li>
              <li>
                <Link href={ACCOUNT_DELETION_PATH} className={linkClass}>
                  {fr.footer.deleteProAccount}
                </Link>
              </li>
            </Column>
          </div>

          <div className={`mt-7 flex flex-col md:mt-11 md:grid md:gap-10 md:border-t md:border-white/10 md:py-8 ${row.grid}`}>
            <div className="flex min-w-0 flex-col gap-3 border-t border-white/10 py-6 md:border-t-0 md:py-0">
              <h2 className="eyebrow flex items-center gap-2 text-lilac/60">
                <LockIcon />
                {fr.footer.paymentTitle}
              </h2>
              <ul aria-label={fr.footer.paymentMethods} className="flex flex-wrap gap-2">
                {fr.footer.paymentChips.map(chip => (
                  <li key={chip} className={`${CHIP} ${CHIP_STYLE[chip] ?? "font-bold text-ink"}`}>
                    {chip}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-normal font-medium text-lilac/72">{fr.footer.paymentText}</p>
            </div>
            {config.newsletter && (
              <NewsletterForm action={newsletterAction} className={`border-t border-white/10 py-6 md:border-t-0 md:py-0 ${row.newsletter}`} />
            )}
            {social && (
              <div
                className={`flex items-center justify-between gap-3 border-t border-white/10 py-5 md:flex-col md:items-start md:justify-start md:border-t-0 md:py-0 ${row.social}`}
              >
                <h2 className="eyebrow text-lilac/60">{fr.footer.followTitle}</h2>
                <ul className="flex gap-2 md:gap-2.5">
                  {config.social.map(s => (
                    <li key={s.network}>
                      <a
                        href={s.url}
                        rel="noreferrer"
                        aria-label={fr.footer.followOn(s.label)}
                        className="flex size-11 items-center justify-center rounded-full border border-white/20 text-lilac transition-colors hover:border-white/45 hover:text-white"
                      >
                        {SOCIAL_ICONS[s.network]()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-white/10 pt-[18px] pb-7 text-[12px] leading-normal font-medium text-lilac/60 md:flex-row md:flex-wrap md:justify-between md:gap-x-6 md:gap-y-2 md:pt-5 md:text-[12.5px]">
            <p>{legal.copyright}</p>
            {legal.identity && <p>{legal.identity}</p>}
          </div>
        </div>
      </footer>
    </div>
  );
}
