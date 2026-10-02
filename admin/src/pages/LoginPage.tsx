import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordChanged = new URLSearchParams(location.search).get("motdepasse") === "modifie";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(describeError(err));
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-2xl font-bold text-primary">{PRODUCT.name}</p>
      <h1 className="mb-6 mt-1 text-muted-foreground">{fr.login.subtitle}</h1>
      {passwordChanged && (
        <Alert className="mb-4 border-success/40 bg-success/10">
          <AlertDescription>{fr.login.passwordChanged}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField id="email" label={fr.login.email} type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
            <FormField
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
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-muted-foreground">
        {fr.login.noAccount}{" "}
        <Link to="/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">
          {fr.login.signup}
        </Link>
      </p>
    </main>
  );
}
