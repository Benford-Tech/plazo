import { fr } from "@/lib/fr";

/**
 * Lien d'avis Google, option B (22/11/2026): once the car is handed back, « Ma réservation » asks for a review on the
 * parking's Google page (the link the parking gave in « Ma fiche »; the API sends it only after « Rendu »).
 */
export function ReviewCard({ parking, url }: { parking: string; url: string }) {
  const t = fr.manage.review;
  return (
    <section className="card flex flex-col gap-2 border-accent/40 p-4 md:px-6" data-testid="booking-review">
      <p aria-hidden="true" className="text-[18px] tracking-[4px] text-accent">
        ★★★★★
      </p>
      <h2 className="font-title text-[22px] leading-tight">{t.title}</h2>
      <p className="text-sm leading-relaxed text-soft">{t.text(parking)}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-1 h-11 self-start px-5">
        {t.button}
      </a>
    </section>
  );
}
