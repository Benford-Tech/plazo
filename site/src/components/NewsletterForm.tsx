"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const t = fr.newsletter;

/**
 * « La lettre Plazo » on the espresso footer (A, 15/10/2026). The e-mail and « S'inscrire » side by side from md up, stacked
 * at full width on phones (48 px). Errors and the success note are light boxes: rose or sage text on the espresso would
 * not be legible. Sending it is the consent the sentence under the field describes; Brevo then asks for a confirmation.
 */
export function NewsletterForm({ action, className = "" }: { action: Action; className?: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const id = useId();
  const inputId = `${id}-email`;
  const errorId = `${id}-error`;
  const textId = `${id}-text`;
  const consentId = `${id}-consent`;
  const problem = state.fields.email ?? state.fields.consent ?? (state.error && state.error !== "validation_failed" ? state.error : null);
  const sent = state.notice === "newsletter_sent";
  return (
    <form action={formAction} noValidate className={`relative flex min-w-0 flex-col gap-3 ${className}`}>
      <label htmlFor={inputId} className="eyebrow self-start text-lilac/60">
        {t.title}
      </label>
      <p id={textId} className="text-[13px] leading-normal font-medium text-lilac/72">
        {t.text}
      </p>
      <div className="flex flex-col gap-3 md:flex-row md:gap-2">
        <input
          id={inputId}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder={t.placeholder}
          defaultValue={state.values.email}
          aria-invalid={problem && state.fields.email ? true : undefined}
          // What the letter is and the consent sentence (under the button) are read with the field, before « S'inscrire ».
          aria-describedby={[textId, consentId, problem ? errorId : null].filter(Boolean).join(" ")}
          // Placeholder lilac/60, not the mockup's /55: 5.0:1 on the field instead of 4.47:1.
          className="h-12 w-full min-w-0 rounded-field border border-white/18 bg-white/6 px-3.5 text-[16px] font-medium text-lilac placeholder:text-lilac/60 hover:border-white/30 focus-visible:border-white aria-invalid:border-danger-line md:h-11 md:flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary h-12 min-h-12 flex-none px-[18px] text-[15px] font-extrabold md:h-11 md:min-h-11 md:text-[14px]"
        >
          {pending ? t.sending : t.submit}
        </button>
      </div>
      {problem && (
        <p id={errorId} role="alert" className="rounded-field border border-danger-line bg-danger-bg px-3.5 py-2.5 text-[13px] leading-snug font-semibold text-danger">
          {errorMessage(problem)}
        </p>
      )}
      {/* Always in the page, so that the note is read out when it appears; while empty it takes no room (its gap is undone). */}
      <div aria-live="polite" className="empty:-mt-3">
        {sent && <p className="rounded-field bg-ok-bg px-3.5 py-2.5 text-[13px] leading-snug font-semibold text-ok">{t.sent}</p>}
      </div>
      <p id={consentId} className="text-[12px] leading-normal font-medium text-lilac/60">
        {t.consent} {t.unsubscribe}{" "}
        <Link href="/confidentialite" className="text-lilac/85 underline underline-offset-2 hover:text-white">
          {t.privacyLink}
        </Link>
      </p>
      {/* Honeypot: invisible to people (and to screen readers), filled by bots. */}
      <div aria-hidden="true" className="absolute top-auto left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>{t.honeypot}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </form>
  );
}
