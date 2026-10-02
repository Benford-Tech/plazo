import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError, DEV_VERIFICATION_KEY } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { emptySignup as empty, type SignupForm as Form, validateSignup } from "@/lib/signup";

/** Public sign-up of an operator (/pro/inscription), in the login page's style (direction B). */
export default function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const airports = useQuery({ queryKey: ["airports"], queryFn: adminApi.getAirports, staleTime: Infinity });
  const [form, setForm] = useState<Form>(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = fr.signup;

  if (isAuthenticated && !isSubmitting) return <Navigate to="/" replace />;

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });
  const airportCode = form.airportCode || (airports.data?.length === 1 ? airports.data[0].code : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const values = { ...form, airportCode };
    const errors = validateSignup(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.signup({ ...values, totalCapacity: Number(values.totalCapacity), email: values.email.trim() });
      try {
        if (res.devVerificationUrl) sessionStorage.setItem(DEV_VERIFICATION_KEY, res.devVerificationUrl);
      } catch {
        // Storage unavailable: the banner's "resend" gives the link again.
      }
      try {
        await login(values.email.trim(), values.password);
        navigate("/plazo/fiche?bienvenue=1", { replace: true });
      } catch {
        // The email already had an account (the API does not say so): it was emailed instead.
        setForm(empty);
        setNotice(t.checkInbox);
        setIsSubmitting(false);
      }
    } catch (err) {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      setError(describeError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <p className="text-2xl font-bold text-primary">{PRODUCT.name}</p>
      <h1 className="mt-1 text-muted-foreground">{fr.login.subtitle}</h1>
      <p className="mb-6 mt-3 text-lg">{t.subtitle(PRODUCT.name)}</p>
      {notice && (
        <Alert className="mb-4 border-success/40 bg-success/10">
          <AlertDescription>
            {notice}{" "}
            <Link to="/login" className="font-semibold text-primary underline">
              {t.login}
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">{t.title}</h2>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="companyName" label={t.company} autoComplete="organization" required maxLength={120} value={form.companyName} onChange={set("companyName")} error={fieldErrors.companyName} />
              <FormField id="parkingName" label={t.parkingName} required maxLength={80} value={form.parkingName} onChange={set("parkingName")} error={fieldErrors.parkingName} />
              <FormField
                id="totalCapacity"
                label={t.capacity}
                inputMode="numeric"
                required
                value={form.totalCapacity}
                onChange={set("totalCapacity")}
                error={fieldErrors.totalCapacity}
                className="font-mono"
              />
              <div className="space-y-1.5">
                <Label htmlFor="airportCode">{t.airport}</Label>
                <select
                  id="airportCode"
                  required
                  value={airportCode}
                  onChange={set("airportCode")}
                  aria-invalid={!!fieldErrors.airportCode}
                  aria-describedby={fieldErrors.airportCode ? "airportCode-error" : undefined}
                  className={`flex h-11 w-full border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${fieldErrors.airportCode ? "border-destructive" : "border-input"}`}
                >
                  <option value="">{t.chooseAirport}</option>
                  {airports.data?.map(a => (
                    <option key={a.code} value={a.code}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.airportCode && (
                  <p id="airportCode-error" className="text-sm text-destructive">
                    {errorMessage(fieldErrors.airportCode)}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="managerName" label={t.managerName} autoComplete="name" required maxLength={120} value={form.managerName} onChange={set("managerName")} error={fieldErrors.managerName} />
              <FormField id="phone" label={t.phone} type="tel" autoComplete="tel" required value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
            </div>
            <FormField id="email" label={t.email} type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="password"
                label={t.password}
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={set("password")}
                help={t.passwordHelp}
                error={fieldErrors.password}
              />
              <FormField
                id="passwordConfirmation"
                label={t.passwordConfirmation}
                type="password"
                autoComplete="new-password"
                required
                value={form.passwordConfirmation}
                onChange={set("passwordConfirmation")}
                error={fieldErrors.passwordConfirmation}
              />
            </div>
            {/* Honeypot: invisible to people (and to screen readers), filled by bots. */}
            <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">{t.honeypot}</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="acceptTerms" className="flex min-h-11 cursor-pointer items-start gap-3 text-base">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={e => setForm({ ...form, acceptTerms: e.target.checked })}
                  aria-invalid={!!fieldErrors.acceptTerms}
                  aria-describedby={fieldErrors.acceptTerms ? "acceptTerms-error" : undefined}
                  className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                />
                <span>
                  {t.terms}{" "}
                  <a href="/conditions" target="_blank" rel="noreferrer" className="text-primary underline">
                    {t.termsLink}
                  </a>
                </span>
              </label>
              {fieldErrors.acceptTerms && (
                <p id="acceptTerms-error" className="text-sm text-destructive">
                  {errorMessage(fieldErrors.acceptTerms)}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t.privacy}</p>
            <Button type="submit" className="h-11 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? t.submitting : t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-muted-foreground">
        {t.hasAccount}{" "}
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t.login}
        </Link>
      </p>
    </main>
  );
}
