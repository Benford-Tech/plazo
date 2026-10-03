import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { Logo } from "@/components/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

const MIN_PASSWORD_LENGTH = 10;

/**
 * An invited manager chooses their password (/pro/invitation#token). The token is in the
 * fragment: it never reaches a server log.
 */
export default function AcceptInvitationPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const token = useLocation().hash.replace(/^#/, "");
  const invitation = useQuery({ queryKey: ["invitation", token], queryFn: () => adminApi.getInvitation(token), enabled: !!token, retry: false });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = fr.invitation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (password.length < MIN_PASSWORD_LENGTH) errors.password = "password_too_short";
    if (confirmation !== password) errors.passwordConfirmation = "password_mismatch";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSubmitting(true);
    try {
      const { tokenData, user } = await adminApi.acceptInvitation(token, password);
      signIn(tokenData, user);
      navigate("/plazo/fiche?bienvenue=1", { replace: true });
    } catch (err) {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      setError(describeError(err));
      setIsSubmitting(false);
    }
  };

  const invalid = !token || invitation.isError;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <Logo height={40} suffix="Pro" className="mb-2" />
      <h1 className="mb-6 mt-1 text-muted-foreground">{fr.login.subtitle}</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold uppercase tracking-wide">{t.title}</h2>
          {invitation.isLoading && <p className="text-muted-foreground">{t.checking}</p>}
          {invalid && (
            <>
              <Alert variant="destructive">
                <AlertDescription>{t.invalid}</AlertDescription>
              </Alert>
              <Link to="/login" className="block text-primary underline">
                {fr.verifyEmail.toLogin}
              </Link>
            </>
          )}
          {invitation.data && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <p className="text-muted-foreground">{t.intro(invitation.data.operatorName, invitation.data.email)}</p>
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
                onChange={e => setPassword(e.target.value)}
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
                onChange={e => setConfirmation(e.target.value)}
                error={fieldErrors.passwordConfirmation}
              />
              <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
                {t.submit}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
