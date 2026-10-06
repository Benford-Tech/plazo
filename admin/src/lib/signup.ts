import type { SignupInput } from "./types";

const MIN_PASSWORD_LENGTH = 10;

/** The sign-up form as typed (capacity as text). */
export type SignupForm = Omit<SignupInput, "totalCapacity" | "acceptTerms"> & { totalCapacity: string; acceptTerms: boolean };

export const emptySignup: SignupForm = {
  companyName: "",
  parkingName: "",
  totalCapacity: "",
  airportCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirmation: "",
  acceptTerms: false,
  website: "",
};

/** Same rules as the API, checked before sending (the API stays the authority). Error codes as the API's. */
export function validateSignup(form: SignupForm): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of ["companyName", "parkingName", "airportCode", "firstName", "lastName", "email", "phone"] as const) {
    if (!form[key].trim()) errors[key] = "required";
  }
  const capacity = Number(form.totalCapacity);
  if (!form.totalCapacity.trim()) errors.totalCapacity = "required";
  else if (!Number.isInteger(capacity)) errors.totalCapacity = "integer";
  else if (capacity < 1) errors.totalCapacity = "min_1";
  if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = "password_too_short";
  if (form.passwordConfirmation !== form.password) errors.passwordConfirmation = "password_mismatch";
  if (!form.acceptTerms) errors.acceptTerms = "terms_required";
  return errors;
}
