"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { FieldError } from "./FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const t = fr.contact;

/** Props of a field's input: its error, linked with aria-describedby next to its hint. */
function described(name: string, error: string | undefined, hint?: boolean) {
  const ids = [hint ? `c-${name}-hint` : null, error ? `c-${name}-error` : null].filter(Boolean).join(" ");
  return { "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined };
}

/**
 * /contact (footer A, 15/10/2026): name, e-mail, booking reference (optional) and message, sent by e-mail to the service
 * client. Once sent, the form gives way to a confirmation that takes the focus; « Écrire un autre message » brings an
 * empty form back (a new key: a fresh action state).
 */
export function ContactForm({ action, responseTime }: { action: Action; responseTime: string | null }) {
  const [round, setRound] = useState(0);
  return <ContactRound key={round} action={action} responseTime={responseTime} onAgain={() => setRound(r => r + 1)} />;
}

function ContactRound({ action, responseTime, onAgain }: { action: Action; responseTime: string | null; onAgain: () => void }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const sent = state.notice === "contact_sent";
  const done = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);
  // Field errors are not a live region: the first invalid field takes the focus, so that its label and its error (in
  // aria-describedby) are read out, and the page scrolls to it.
  useEffect(() => {
    if (state.error === "validation_failed") form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (sent) {
    return (
      <div ref={done} tabIndex={-1} className="flex flex-col items-start gap-3 outline-none">
        <span className="pill pill-ok">{t.sentTitle}</span>
        <p role="status" className="text-[15px] leading-relaxed font-medium text-ink">
          {t.sentText(responseTime)}
        </p>
        <button type="button" onClick={onAgain} className="link inline-flex min-h-11 items-center bg-transparent p-0 text-[14px]">
          {t.writeAnother}
        </button>
      </div>
    );
  }

  const v = state.values;
  const f = state.fields;
  return (
    <form ref={form} action={formAction} noValidate className="relative flex flex-col gap-4">
      {state.error && state.error !== "validation_failed" && (
        <p role="alert" className="rounded-field border border-danger-line bg-danger-bg px-3.5 py-3 text-sm leading-snug font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <div>
        <label htmlFor="c-name" className="label">
          {t.name}
        </label>
        <input id="c-name" name="name" type="text" required maxLength={80} autoComplete="name" defaultValue={v.name} {...described("name", f.name)} className="field" />
        <FieldError id="c-name-error" code={f.name} />
      </div>
      <div>
        <label htmlFor="c-email" className="label">
          {t.email}
        </label>
        <input
          id="c-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          defaultValue={v.email}
          {...described("email", f.email, true)}
          className="field"
        />
        <p id="c-email-hint" className="mt-1.5 text-[13px] leading-snug font-medium text-soft">
          {t.emailHint}
        </p>
        <FieldError id="c-email-error" code={f.email} />
      </div>
      <div>
        <label htmlFor="c-reference" className="label">
          {t.reference} <span className="font-medium">({t.optional})</span>
        </label>
        <input
          id="c-reference"
          name="reference"
          type="text"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={v.reference}
          {...described("reference", f.reference, true)}
          className="field font-semibold tracking-[.06em] uppercase"
        />
        <p id="c-reference-hint" className="mt-1.5 text-[13px] leading-snug font-medium text-soft">
          {t.referenceHint}
        </p>
        <FieldError id="c-reference-error" code={f.reference} />
      </div>
      <div>
        <label htmlFor="c-message" className="label">
          {t.message}
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          defaultValue={v.message}
          {...described("message", f.message, true)}
          className="field h-auto min-h-40 resize-y py-3 leading-normal"
        />
        <p id="c-message-hint" className="mt-1.5 text-[13px] leading-snug font-medium text-soft">
          {t.messageHint}
        </p>
        <FieldError id="c-message-error" code={f.message} />
      </div>
      {/* Honeypot: invisible to people (and to screen readers), filled by bots. */}
      <div aria-hidden="true" className="absolute top-auto left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor="c-website">{t.honeypot}</label>
        <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary mt-1 min-h-12 px-6 text-base">
        {pending ? t.sending : t.submit}
      </button>
      <p className="text-[13px] leading-snug font-medium text-soft">
        {t.privacy}{" "}
        <Link href="/confidentialite" className="font-semibold text-accent-dark underline decoration-accent-dark/35 underline-offset-[3px] hover:decoration-accent-dark">
          {t.privacyLink}
        </Link>
      </p>
    </form>
  );
}
