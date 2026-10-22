import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";

const LINK = "font-semibold text-lime-deep underline-offset-4 hover:underline";

/** The pro wordmark on the lime panel: the name in lime on a dark green plate, « PRO » beside it. */
function Wordmark() {
  return (
    <div className="flex items-center gap-2.5" aria-label={`${PRODUCT.name} Pro`} role="img">
      <span className="rounded-[10px] bg-lime-deep px-3.5 py-1.5 text-[30px] font-extrabold leading-none tracking-tight text-lime">{PRODUCT.name}</span>
      <span className="font-narrow text-[26px] font-bold text-lime-deep">PRO</span>
    </div>
  );
}

function StepDots({ step }: { step: 0 | 1 }) {
  return (
    <div className="flex justify-center gap-1.5" aria-label={fr.login.step(step + 1)} role="img">
      {[0, 1].map(i => (
        <span key={i} className={cn("h-[7px] rounded-full", i === step ? "w-[18px] bg-lime-deep" : "w-[7px] bg-[#C9D2C4]")} />
      ))}
    </div>
  );
}

/**
 * The pro space's sign-in. Choice B of 21/10/2026 (« revois la page de connexion », then « revoi le design sur web aussi »,
 * mockups https://claude.ai/artifact/2hNzBfHaph589Vdhjing8h): the lime screen with the pro wordmark, and a white panel that
 * asks one thing at a time, the email address and then the password, as in Plazo Pro. Side by side on a wide screen, the
 * panel under the lime band on a phone. « Continuer avec Google » under « ou » on the first step (22/10/2026), when the API
 * has a Google client: a Google account linked to a member signs in; one in no team is sent to Plazo Pro's code of the day.
 */
export default function LoginPage() {
  const { login, signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordChanged = new URLSearchParams(location.search).get("motdepasse") === "modifie";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStep, setPasswordStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const providers = useQuery({ queryKey: ["auth-providers"], queryFn: adminApi.authProviders, staleTime: 3600_000, retry: false });
  const googleClientId = providers.data?.google ? (providers.data.googleClientId ?? null) : null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim().includes("@")) {
      setError(fr.login.invalidEmail);
      return;
    }
    setError(null);
    setPasswordStep(true);
  };

  const back = () => {
    setPassword("");
    setError(null);
    setPasswordStep(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(describeError(err));
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const withGoogle = async (idToken: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await adminApi.googleSignIn(idToken);
      if (result.status === "signed_in") {
        signIn(result.tokenData, result.user);
        navigate("/", { replace: true });
        return;
      }
      // A Google account in no team: joining is done in Plazo Pro; the unused onboarding session is closed.
      void adminApi.onboardingLogout(result.onboardingToken).catch(() => undefined);
      setError(fr.login.googleNotMember);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-lime md:flex-row">
      <section className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 py-12 text-center md:py-0">
        <Wordmark />
        <p className="text-base font-semibold text-lime-ink">{fr.login.tagline}</p>
      </section>
      <section className="rounded-t-3xl bg-card px-5 pb-8 pt-5 md:flex md:w-[440px] md:flex-col md:justify-center md:rounded-none md:px-10">
        <div className="mx-auto w-full max-w-sm space-y-4">
          <StepDots step={passwordStep ? 1 : 0} />
          {passwordChanged && (
            <Alert className="border-success/40 bg-success/10">
              <AlertDescription>{fr.login.passwordChanged}</AlertDescription>
            </Alert>
          )}
          {!passwordStep ? (
            <form onSubmit={next} className="space-y-4" noValidate>
              <h1 className="text-[22px] font-bold">{fr.login.emailTitle}</h1>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                id="email"
                label={fr.login.email}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
                {fr.login.next}
              </Button>
              {googleClientId && (
                <>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden>
                    <span className="h-px flex-1 bg-border" />
                    {fr.login.or}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <GoogleSignInButton clientId={googleClientId} onIdToken={withGoogle} disabled={isSubmitting} />
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h1 className="text-[22px] font-bold">{fr.login.passwordTitle}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                  <span className="min-w-0 truncate">{email.trim()}</span>
                  <button type="button" onClick={back} className={LINK} disabled={isSubmitting}>
                    {fr.login.changeEmail}
                  </button>
                </div>
              </div>
              {/* The address again, hidden, so that password managers pair it with the password. */}
              <input type="email" name="email" autoComplete="username" value={email.trim()} readOnly hidden />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                autoFocus
                id="password"
                label={fr.login.password}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
                {fr.login.submit}
              </Button>
              <p className="text-center text-sm text-muted-foreground">{fr.login.help}</p>
            </form>
          )}
          <div className="space-y-1.5 pt-2 text-center text-sm text-muted-foreground">
            <p>
              {fr.login.noAccount}{" "}
              <Link to="/inscription" className={LINK}>
                {fr.login.signup}
              </Link>
            </p>
            <p>
              {fr.demo.loginLinkIntro}{" "}
              <Link to="/demo" className={LINK}>
                {fr.demo.loginLink}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
