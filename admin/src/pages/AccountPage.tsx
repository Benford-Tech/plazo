import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { TravellerSms } from "@/components/account/TravellerSms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { nameParts } from "@/lib/names";

/** 09/10/2026: everyone corrects their own first and last name (the server rebuilds the display name). */
function NameForm() {
  const { user, refresh } = useAuth();
  const [names, setNames] = useState(() => nameParts(user?.firstName, user?.lastName, user?.name));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = fr.account;

  const save = useMutation({
    mutationFn: () => adminApi.updateMe({ firstName: names.firstName.trim(), lastName: names.lastName.trim() }),
    onSuccess: async () => {
      setFieldErrors({});
      toast.success(t.nameSaved);
      await refresh();
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{t.nameTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="max-w-sm space-y-4"
          onSubmit={e => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <FormField
            id="account-first-name"
            label={t.firstName}
            autoComplete="given-name"
            required
            maxLength={60}
            value={names.firstName}
            onChange={e => setNames({ ...names, firstName: e.target.value })}
            error={fieldErrors.firstName}
          />
          <FormField
            id="account-last-name"
            label={t.lastName}
            autoComplete="family-name"
            required
            maxLength={60}
            value={names.lastName}
            onChange={e => setNames({ ...names, lastName: e.target.value })}
            error={fieldErrors.lastName}
          />
          <Button type="submit" className="h-11 text-base" disabled={save.isPending}>
            {t.saveName}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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

  // A platform admin viewing an operator's space: no password change from here; the SMS channel is read-only.
  if (user?.viewAs) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="border border-lime-deep p-3 text-base">{fr.viewAs.readOnly}</p>
        <TravellerSms />
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      {user && <NameForm key={user.id} />}
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
      <TravellerSms />
    </>
  );
}
