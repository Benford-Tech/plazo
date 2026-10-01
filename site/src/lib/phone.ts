/** Display form of a phone number: "0612345678" -> "06 12 34 56 78", "+33612345678" -> "+33 6 12 34 56 78". */
export function formatPhone(phone: string): string {
  const compact = phone.replace(/[\s.()-]/g, "");
  if (/^0\d{9}$/.test(compact)) return compact.replace(/(\d{2})(?=\d)/g, "$1 ");
  if (/^\+33\d{9}$/.test(compact)) return `+33 ${compact.slice(3, 4)} ${compact.slice(4).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  return phone.trim();
}

// Titles and initials are not first names: "M. Dupont" gets no name in the greeting.
const NOT_A_FIRST_NAME = /^(m|mr|mme|mlle|mrs|ms|dr|pr|me)\.?$|\.$/i;

/** First name for a greeting: "Camille Laurent" -> "Camille"; "" when the first word is a title or an initial. */
export function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return NOT_A_FIRST_NAME.test(first) ? "" : first;
}

/** Whether the API sends the confirmation SMS to this number (French mobiles 06 / 07 only). */
export function isFrenchMobile(phone: string): boolean {
  let digits = phone.replace(/\(0\)/g, "").replace(/[\s.()-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+33")) digits = `0${digits.slice(3).replace(/^0/, "")}`;
  return /^0[67]\d{8}$/.test(digits);
}
