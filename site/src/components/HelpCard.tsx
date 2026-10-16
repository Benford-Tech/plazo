import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/FooterIcons";
import { type FooterConfig, lowerFirst } from "@/lib/footer";
import { fr } from "@/lib/fr";

const t = fr.help;

/** The cream tile of an icon (44 px, 12 px corners). */
function IconTile({ children }: { children: React.ReactNode }) {
  return <span className="flex size-11 flex-none items-center justify-center rounded-field bg-tint text-ink">{children}</span>;
}

/** The lead under the title: the phone hours when they are known, else what the visitor can do. */
function lead({ phone, contactForm }: FooterConfig): string {
  if (phone?.hours) return t.leadHours(lowerFirst(phone.hours));
  if (phone && contactForm) return t.leadBoth;
  if (phone) return t.leadPhone;
  if (contactForm) return t.leadWritten;
  return t.leadSelf;
}

// From lg up: the head and the cream note in the first column, one column per way to reach the team (tiles span both
// rows so that their button sits at the bottom). Below lg: one column, a row per way, the note last (A-mobile).
const GRID: Record<number, string> = {
  0: "lg:grid-cols-[1.35fr_1fr]",
  1: "lg:grid-cols-[1.35fr_1fr]",
  2: "lg:grid-cols-[1.35fr_1fr_1fr]",
};

// A tile's frame: a hairline above on phones, a hairline on its left from lg up.
const TILE = "border-t border-line-soft pt-[18px] lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10";

/**
 * Footer A (15/10/2026): « Besoin d'aide ? » on the ivory ground, above the espresso footer. The phone tile and the
 * written tile appear only once product.json gives a support number or a real support address; without either, the card
 * keeps its title, a short text, the cream note and two quiet links (« Ma réservation », the FAQ).
 */
export function HelpCard({ config }: { config: FooterConfig }) {
  const { phone, contactForm } = config;
  const tiles = (phone ? 1 : 0) + (contactForm ? 1 : 0);
  return (
    <section aria-labelledby="aide-titre" className="px-4 py-8 md:px-12 md:pt-16 md:pb-14">
      <div className={`card mx-auto flex max-w-[1184px] flex-col gap-5 px-5 py-[22px] md:px-10 md:py-9 lg:grid lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-4 ${GRID[tiles]}`}>
        <div className="flex min-w-0 flex-col gap-2.5 md:gap-3 lg:col-start-1 lg:row-start-1">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="aide-titre" className="font-title text-[25px] leading-[1.2] text-balance text-ink md:text-[30px]">
            {t.title}
          </h2>
          <p className="text-[14.5px] leading-[1.55] font-medium text-pretty text-soft md:text-[15px] md:leading-[1.6]">{lead(config)}</p>
        </div>

        {/* Last on phones, under the lead from lg up. */}
        <p className="order-last rounded-field bg-tint px-3.5 py-3 text-[13px] leading-normal font-medium text-ink md:text-[13.5px] lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start">
          {t.dayOfDeparture}
        </p>

        {phone && (
          <div className={`flex items-center gap-3.5 lg:col-start-2 lg:flex-col lg:items-start lg:gap-2.5 ${TILE}`}>
            <IconTile>
              <PhoneIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-none lg:gap-2.5">
              <p className="eyebrow sr-only lg:not-sr-only">{t.byPhone}</p>
              <p className="text-[17px] leading-snug font-bold text-ink lg:text-[22px] lg:leading-[1.25]">{phone.display}</p>
              {phone.hours && <p className="text-[13px] leading-snug font-medium text-soft lg:text-[13.5px]">{phone.hours}</p>}
            </div>
            <a href={phone.href} aria-label={t.callLabel} className="btn-secondary flex-none px-4 text-[14px] lg:mt-auto lg:self-start lg:px-[18px]">
              {t.call}
            </a>
          </div>
        )}

        {contactForm && (
          <div className={`flex flex-col gap-3 lg:gap-2.5 ${tiles === 2 ? "lg:col-start-3" : "lg:col-start-2"} ${TILE}`}>
            <div className="flex items-center gap-3.5 lg:flex-col lg:items-start lg:gap-2.5">
              <IconTile>
                <MailIcon />
              </IconTile>
              <div className="flex min-w-0 flex-col gap-0.5 lg:gap-2.5">
                <p className="eyebrow sr-only lg:not-sr-only">{t.inWriting}</p>
                <p className="text-[17px] leading-snug font-bold text-ink lg:text-[22px] lg:leading-[1.25]">{t.contactForm}</p>
                <p className="text-[13px] leading-snug font-medium text-soft lg:text-[13.5px]">
                  {contactForm.responseTime ? t.replyWithin(contactForm.responseTime) : t.replyByEmail}
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="btn-primary min-h-12 px-5 text-[15px] font-extrabold lg:mt-auto lg:min-h-11 lg:self-start lg:text-[14px]"
            >
              {t.write}
            </Link>
          </div>
        )}

        {tiles === 0 && (
          <div className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:col-start-2 lg:flex-col lg:justify-center ${TILE}`}>
            <Link href="/ma-reservation" className="btn-secondary px-5 text-[14px] lg:self-start">
              {t.findBooking}
            </Link>
            <Link href="/#faq" className="btn-secondary px-5 text-[14px] lg:self-start">
              {t.faq}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
