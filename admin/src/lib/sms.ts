/**
 * A phone number typed by the manager ("06 12 34 56 78", "+33 6 12 34 56 78", "0033612345678") in
 * E.164 ("+33612345678"), or the trimmed input when it does not look like a French number (the
 * API validates it).
 */
export function toE164(value: string): string {
  let digits = value.replace(/\(0\)/g, "").replace(/[\s.()-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^0[1-9]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (digits.startsWith("+33")) return `+33${digits.slice(3).replace(/^0/, "")}`;
  return digits;
}

/** "+33612345678" shown as "+33 6 12 34 56 78". */
export function formatPhone(value: string | null): string {
  if (!value) return "";
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  return m ? `+33 ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : value;
}
