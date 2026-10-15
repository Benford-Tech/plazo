import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { PhoneIcon } from "@/components/FooterIcons";
import type { FooterConfig } from "@/lib/footer";
import type { FormState } from "@/lib/forms";
import { fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const t = fr.contact;

/**
 * /contact (footer A, 15/10/2026), Boutique like « Ma réservation »: the title on the ivory ground, the form in a white
 * card. Without a real support address (product.json) the page says the form is not open yet and points to « Ma
 * réservation » and the FAQ. The phone line shows only once product.json gives one.
 */
export function ContactView({ config, action }: { config: FooterConfig; action: Action }) {
  const { contactForm, phone } = config;
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">{t.title}</h1>
        {contactForm && <p className="text-[15px] leading-snug font-medium text-soft">{t.lead(contactForm.responseTime)}</p>}
      </div>

      {contactForm ? (
        <div className="card p-4 md:p-6">
          <ContactForm action={action} responseTime={contactForm.responseTime} />
        </div>
      ) : (
        <section aria-labelledby="contact-soon" className="card flex flex-col gap-3 p-5 md:p-6">
          <h2 id="contact-soon" className="font-title text-[23px] leading-[1.2] text-ink md:text-[26px]">
            {t.unavailableTitle}
          </h2>
          <p className="text-[15px] leading-relaxed font-medium text-soft">{t.unavailableText}</p>
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
            <Link href="/ma-reservation" className="btn-primary min-h-12 px-6 text-[15px]">
              {fr.help.findBooking}
            </Link>
            <Link href="/#faq" className="btn-secondary min-h-12 px-6 text-[15px]">
              {fr.help.faq}
            </Link>
          </div>
        </section>
      )}

      {phone && (
        <section aria-labelledby="contact-phone" className="card flex items-center gap-3.5 p-4 md:p-5">
          <span className="flex size-11 flex-none items-center justify-center rounded-field bg-tint text-ink">
            <PhoneIcon />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id="contact-phone" className="eyebrow">
              {t.phoneTitle}
            </h2>
            <p className="text-[17px] leading-snug font-bold text-ink">{phone.display}</p>
            {phone.hours && <p className="text-[13px] leading-snug font-medium text-soft">{phone.hours}</p>}
          </div>
          <a href={phone.href} aria-label={fr.help.callLabel} className="btn-secondary flex-none px-4 text-[14px]">
            {fr.help.call}
          </a>
        </section>
      )}

      <p className="rounded-field bg-tint px-3.5 py-3 text-[13.5px] leading-normal font-medium text-ink">{fr.help.dayOfDeparture}</p>
    </main>
  );
}
