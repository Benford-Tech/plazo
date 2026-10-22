import { useEffect, useRef, useState } from "react";
import { googleButtonWidth, loadGoogleIdentity } from "@/lib/google-identity";
import { fr } from "@/lib/fr";

/**
 * « Continuer avec Google » (22/10/2026): Google's own button (its branding rules), drawn by its script into this box.
 * Hands the ID token to `onIdToken`; nothing is drawn while the script loads, a line says so when it cannot load.
 */
export function GoogleSignInButton({
  clientId,
  onIdToken,
  text = "continue_with",
  disabled = false,
}: {
  clientId: string;
  onIdToken: (idToken: string) => void;
  text?: "continue_with" | "signin_with";
  disabled?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const callback = useRef(onIdToken);
  const [failed, setFailed] = useState(false);
  callback.current = onIdToken;

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then(id => {
        if (cancelled || !box.current) return;
        id.initialize({
          client_id: clientId,
          callback: response => {
            if (response.credential) callback.current(response.credential);
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_button: true,
        });
        box.current.replaceChildren();
        id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "center",
          width: googleButtonWidth(box.current),
          locale: "fr",
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (failed) return <p className="text-center text-sm text-muted-foreground">{fr.google.unavailable}</p>;
  return (
    <div
      ref={box}
      data-testid="google-sign-in"
      aria-busy={disabled}
      className={disabled ? "pointer-events-none flex min-h-[44px] justify-center opacity-60" : "flex min-h-[44px] justify-center"}
    />
  );
}
