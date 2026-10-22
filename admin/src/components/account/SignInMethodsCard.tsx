import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-context";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { IdentityProvider } from "@/lib/types";

/**
 * Mon compte › Connexion (22/10/2026, « ajoute la connexion google »): how one signs in (password, Apple, Google), Google
 * linked here with its button, Apple or Google unlinked. Linking Apple stays in Plazo Pro on iPhone.
 */
export function SignInMethodsCard() {
  const { user, refresh } = useAuth();
  const confirm = useConfirm();
  const t = fr.account.signIn;
  const providers = useQuery({ queryKey: ["auth-providers"], queryFn: adminApi.authProviders, staleTime: 3600_000, retry: false });
  const googleClientId = providers.data?.google ? (providers.data.googleClientId ?? null) : null;
  const identities = user?.identities ?? [];
  const google = identities.find(i => i.provider === "google");

  const link = useMutation({
    mutationFn: (idToken: string) => adminApi.linkGoogle(idToken),
    onSuccess: async () => {
      toast.success(t.linked);
      await refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const unlink = useMutation({
    mutationFn: (provider: IdentityProvider) => adminApi.unlinkIdentity(provider),
    onSuccess: async () => {
      toast.success(t.unlinked);
      await refresh();
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const askUnlink = async (provider: IdentityProvider) => {
    const ok = await confirm(t.unlinkMessage, { title: t.unlinkTitle(t.provider[provider]), confirmLabel: t.unlink, destructive: true });
    if (ok) unlink.mutate(provider);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y divide-border rounded-lg border">
          {user?.hasPassword !== false && (
            <li className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span>
                <span className="font-medium">{t.password}</span>
                <span className="block text-muted-foreground">{user?.email}</span>
              </span>
            </li>
          )}
          {identities.map(identity => (
            <li key={identity.provider} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="font-medium">{t.provider[identity.provider]}</span>
                {identity.email && <span className="block truncate text-muted-foreground">{identity.email}</span>}
              </span>
              <Button variant="outline" size="sm" disabled={unlink.isPending} onClick={() => void askUnlink(identity.provider)}>
                {t.unlink}
              </Button>
            </li>
          ))}
        </ul>
        {!google && googleClientId && (
          <div className="max-w-sm space-y-2">
            <p className="text-sm text-muted-foreground">{t.linkGoogleHelp}</p>
            <GoogleSignInButton clientId={googleClientId} text="signin_with" onIdToken={idToken => link.mutate(idToken)} disabled={link.isPending} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
