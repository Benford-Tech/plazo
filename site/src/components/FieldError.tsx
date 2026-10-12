import { errorMessage } from "@/lib/fr";

/** Inline error under a field, linked to it with aria-describedby: rose text with a small stroked warning sign. */
export function FieldError({ id, code }: { id: string; code?: string | null }) {
  if (!code) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13.5px] leading-snug font-semibold text-danger">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
      </svg>
      <span>{errorMessage(code)}</span>
    </p>
  );
}
