import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, DEV_VERIFICATION_KEY, getTokens } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";

/** The link of the confirmation email (/pro/verifier-email#token): works with or without a session. */
export default function VerifyEmailPage() {
  const { isAuthenticated, refresh } = useAuth();
  const token = useLocation().hash.replace(/^#/, "");
  const [state, setState] = useState<{ status: "checking" | "done" | "error"; message?: string }>({ status: token ? "checking" : "error" });
  const sent = useRef(false);
  const t = fr.verifyEmail;

  useEffect(() => {
    if (!token || sent.current) return;
    // Once only (React's development double effect would use the single-use link twice).
    sent.current = true;
    adminApi
      .verifyEmail(token)
      .then(async () => {
        try {
          sessionStorage.removeItem(DEV_VERIFICATION_KEY);
        } catch {
          // Nothing to clean.
        }
        // Signed in on this device: read the account again (the banner goes away).
        if (getTokens()?.access?.token) await refresh();
        setState({ status: "done" });
      })
      .catch(err => setState({ status: "error", message: describeError(err) }));
  }, [token, refresh]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-2xl font-bold text-primary">{PRODUCT.name}</p>
      <h1 className="mb-6 mt-1 text-muted-foreground">{fr.login.subtitle}</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold uppercase tracking-wide">{t.title}</h2>
          {state.status === "checking" && <p className="text-muted-foreground">{t.checking}</p>}
          {state.status === "done" && (
            <Alert className="border-success/40 bg-success/10">
              <AlertDescription>{t.done}</AlertDescription>
            </Alert>
          )}
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{token ? state.message : t.missing}</AlertDescription>
            </Alert>
          )}
          {state.status !== "checking" && (
            <Link to={isAuthenticated ? "/plazo/fiche" : "/login"} className="flex h-11 items-center justify-center bg-primary font-bold uppercase tracking-wide text-primary-foreground">
              {isAuthenticated ? t.toSpace : t.toLogin}
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
