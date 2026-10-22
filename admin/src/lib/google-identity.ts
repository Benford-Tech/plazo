/**
 * Google Identity Services on the web (22/10/2026, « ajoute la connexion google »): Google's own button, which hands
 * back an ID token the API verifies (POST /internal/auth/google, /internal/staff/me/identities/google). The client ID is
 * the Web client the API already accepts (GET /internal/auth/providers → googleClientId); the page's origin must be in
 * that client's « Authorized JavaScript origins » in Google Cloud.
 */

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

interface CredentialResponse {
  credential?: string;
}

interface GoogleButtonOptions {
  type: "standard";
  theme: "outline";
  size: "large";
  text: "continue_with" | "signin_with";
  shape: "rectangular";
  logo_alignment: "center";
  width: number;
  locale: string;
}

export interface GoogleIdentity {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    ux_mode: "popup";
    auto_select: false;
    cancel_on_tap_outside: true;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

let loading: Promise<GoogleIdentity> | null = null;

/** Loads Google's script once per page; a failed load is tried again at the next call. */
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error("google_identity_missing"));
    };
    script.onerror = () => reject(new Error("google_identity_unreachable"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Google's button, as wide as its box (Google allows 200 to 400 px). */
export function googleButtonWidth(box: HTMLElement): number {
  return Math.max(200, Math.min(400, Math.floor(box.getBoundingClientRect().width) || 320));
}

export type { CredentialResponse };
