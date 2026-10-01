import { errorMessage } from "@/lib/fr";

/** Inline error under a field, linked to it with aria-describedby. */
export function FieldError({ id, code }: { id: string; code?: string | null }) {
  if (!code) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-semibold text-danger">
      {errorMessage(code)}
    </p>
  );
}
