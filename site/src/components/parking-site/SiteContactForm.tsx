"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * The contact form of a parking's own site (24/11/2026, « tout »): name, e-mail, phone and booking (optional), message.
 * It reaches the parking itself (its « Messages » and its managers' e-mail), not Plazo's customer service.
 */
export function SiteContactForm({ action }: { action: Action }) {
  const [round, setRound] = useState(0);
  return <Round key={round} action={action} onAgain={() => setRound(r => r + 1)} />;
}

function Round({ action, onAgain }: { action: Action; onAgain: () => void }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const t = fr.parkingSite.form;
  const c = fr.contact;
  const sent = state.notice === "contact_sent";
  const done = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);
  useEffect(() => {
    if (state.error === "validation_failed") form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (sent) {
    return (
      <div ref={done} tabIndex={-1} data-testid="site-contact-sent" className="flex flex-col items-start gap-3 outline-none">
        <p role="status" className="text-[15px] leading-relaxed font-medium">
          {t.sent}
        </p>
        <button type="button" onClick={onAgain} className="link inline-flex min-h-11 items-center bg-transparent p-0 text-[14px]">
          {t.another}
        </button>
      </div>
    );
  }

  const v = state.values;
  const f = state.fields;
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, optional = false) => (
    <div>
      <label htmlFor={`sc-${name}`} className="label">
        {label} {optional && <span className="font-medium">({c.optional})</span>}
      </label>
      <input
        id={`sc-${name}`}
        name={name}
        defaultValue={v[name]}
        aria-invalid={f[name] ? true : undefined}
        aria-describedby={f[name] ? `sc-${name}-error` : undefined}
        className="field"
        {...props}
      />
      <FieldError id={`sc-${name}-error`} code={f[name]} />
    </div>
  );
  return (
    <form ref={form} action={formAction} noValidate data-testid="site-contact-form" className="relative flex flex-col gap-4">
      {state.error && state.error !== "validation_failed" && (
        <p role="alert" className="rounded-field border border-danger-line bg-danger-bg px-3.5 py-3 text-sm leading-snug font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", c.name, { type: "text", required: true, maxLength: 80, autoComplete: "name" })}
        {field("email", c.email, { type: "email", required: true, maxLength: 254, autoComplete: "email", inputMode: "email", spellCheck: false })}
        {field("phone", t.phone, { type: "tel", maxLength: 30, autoComplete: "tel", inputMode: "tel" }, true)}
        {field("reference", c.reference, { type: "text", maxLength: 20, autoComplete: "off", spellCheck: false }, true)}
      </div>
      <div>
        <label htmlFor="sc-message" className="label">
          {c.message}
        </label>
        <textarea
          id="sc-message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          defaultValue={v.message}
          aria-invalid={f.message ? true : undefined}
          aria-describedby={f.message ? "sc-message-error" : undefined}
          className="field min-h-[120px]"
        />
        <FieldError id="sc-message-error" code={f.message} />
      </div>
      {/* Honeypot: hidden from people, filled by robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="sc-website">Website</label>
        <input id="sc-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-[13px] text-soft">{t.privacy}</p>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] bg-[var(--ps-accent)] px-5 py-2.5 text-[15px] font-semibold text-[var(--ps-ink)] disabled:opacity-60"
      >
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
