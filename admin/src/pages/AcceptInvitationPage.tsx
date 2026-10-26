import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { BoardBackdrop } from "@/components/BoardBackdrop";
import { Logo } from "@/components/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const MIN_PASSWORD_LENGTH = 10;

/** The official store badges, served by the site under the same domain (site/public/badges/). */
const BADGES = {
  googlePlay: "/badges/google-play-fr.png",
  appStore: "/badges/app-store-fr.png",
  appStoreSoon: "/badges/app-store-fr-soon.png",
};

/**
 * The store badges of Plazo Pro (26/10/2026, « le mail doit permettre d'installer plazo pro, définir son mot de passe »):
 * Google Play linked, the App Store greyed with its note until Apple publishes the app.
 */
function StoreBadges({
  stores,
}: {
  stores: { playStoreUrl: string; appStoreUrl: string | null };
}) {
  const t = fr.invitation;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <a href={stores.playStoreUrl} target="_blank" rel="noreferrer">
          <img
            src={BADGES.googlePlay}
            alt={t.googlePlay}
            width={155}
            height={46}
          />
        </a>
        {stores.appStoreUrl ? (
          <a href={stores.appStoreUrl} target="_blank" rel="noreferrer">
            <img
              src={BADGES.appStore}
              alt={t.appStore}
              width={142}
              height={46}
            />
          </a>
        ) : (
          <img
            src={BADGES.appStoreSoon}
            alt={t.appStore}
            width={142}
            height={46}
            className="opacity-60"
          />
        )}
      </div>
      {!stores.appStoreUrl && (
        <p className="text-sm text-muted-foreground">{t.appStoreSoon}</p>
      )}
    </div>
  );
}

/**
 * An invited manager or team member chooses their password (/pro/invitation#token). The token is in the
 * fragment: it never reaches a server log. A manager then lands on their listing; a team member is told to
 * install Plazo Pro (26/10/2026).
 */
export default function AcceptInvitationPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const token = useLocation().hash.replace(/^#/, "");
  const invitation = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => adminApi.getInvitation(token),
    enabled: !!token,
    retry: false,
  });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const t = fr.invitation;
  const isManager = invitation.data?.role === "manager";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (password.length < MIN_PASSWORD_LENGTH)
      errors.password = "password_too_short";
    if (confirmation !== password)
      errors.passwordConfirmation = "password_mismatch";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSubmitting(true);
    try {
      const { tokenData, user } = await adminApi.acceptInvitation(
        token,
        password,
      );
      signIn(tokenData, user);
      if (user.role === "manager")
        navigate("/plazo/fiche?bienvenue=1", { replace: true });
      else setDone(true);
    } catch (err) {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      setError(describeError(err));
      setIsSubmitting(false);
    }
  };

  const invalid = !token || invitation.isError;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <BoardBackdrop />
      <Logo height={40} suffix="Pro" className="mb-2" />
      <h1 className="mb-6 mt-1 text-muted-foreground">{fr.login.subtitle}</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold uppercase tracking-wide">
            {t.title}
          </h2>
          {invitation.isLoading && (
            <p className="text-muted-foreground">{t.checking}</p>
          )}
          {invalid && (
            <>
              <Alert variant="destructive">
                <AlertDescription>{t.invalid}</AlertDescription>
              </Alert>
              <Link to="/login" className="block text-lime-deep underline">
                {fr.verifyEmail.toLogin}
              </Link>
            </>
          )}
          {invitation.data && done && (
            <div className="space-y-4" data-testid="invitation-done">
              <h3 className="text-lg font-semibold">{t.doneTitle}</h3>
              <p className="text-muted-foreground">
                {t.doneIntro(invitation.data.email)}
              </p>
              <StoreBadges stores={invitation.data.stores} />
              <Link to="/" className="block text-lime-deep underline">
                {t.continueWeb}
              </Link>
            </div>
          )}
          {invitation.data && !done && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <p className="text-muted-foreground">
                {t.intro(invitation.data.operatorName, invitation.data.email)}
              </p>
              {!isManager && (
                <p className="text-sm text-muted-foreground">{t.nextApp}</p>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                id="password"
                label={t.password}
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                help={fr.signup.passwordHelp}
                error={fieldErrors.password}
              />
              <FormField
                id="passwordConfirmation"
                label={t.passwordConfirmation}
                type="password"
                autoComplete="new-password"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                error={fieldErrors.passwordConfirmation}
              />
              <Button
                type="submit"
                className="h-11 w-full text-base"
                disabled={isSubmitting}
              >
                {t.submit}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
