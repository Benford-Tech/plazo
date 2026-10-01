import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

export default function AccountPage() {
  const { user, forget } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = fr.account;

  const change = useMutation({
    mutationFn: () => adminApi.changePassword(currentPassword, newPassword),
    // Every session was revoked, including this one.
    onSuccess: () => {
      forget();
      navigate("/login?motdepasse=modifie", { replace: true });
    },
    onError: (err: Error) => {
      const fields = err instanceof ApiError ? (err.fields ?? (err.code === "wrong_current_password" ? { currentPassword: err.code } : {})) : {};
      setFieldErrors(fields);
      toast.error(describeError(err));
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {user?.name} · {user?.email}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="max-w-sm space-y-4"
            onSubmit={e => {
              e.preventDefault();
              change.mutate();
            }}
          >
            <FormField
              id="currentPassword"
              label={t.currentPassword}
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              error={fieldErrors.currentPassword}
            />
            <FormField
              id="newPassword"
              label={t.newPassword}
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
            />
            <Button type="submit" className="h-11 text-base" disabled={change.isPending}>
              {t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
