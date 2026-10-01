// The product name is still a working name: it lives only in the repository's product.json.
import product from "../../../product.json";

export const PRODUCT_NAME: string = product.name;
export const SUPPORT_EMAIL: string = product.supportEmail;

/** Whether the support address is a real one (product.json still holds a placeholder before launch). */
export function hasSupportEmail(email: string = SUPPORT_EMAIL): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !/@example\.(com|org|net)$/i.test(email);
}
