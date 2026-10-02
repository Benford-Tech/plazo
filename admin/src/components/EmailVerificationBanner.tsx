import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, DEV_VERIFICATION_KEY } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

/** Asks a self sign-up to confirm its email (needed to send the listing for review). */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [devLink, setDevLink] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(DEV_VERIFICATION_KEY);
    } catch {
      return null;
    }
  });
  const resend = useMutation({
    mutationFn: adminApi.resendVerification,
    onSuccess: data => {
      setDevLink(data.devVerificationUrl ?? null);
      toast.success(fr.emailBanner.resent);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  if (!user || user.viewAs || user.emailVerified !== false) return null;

  return (
    <div role="status" className="border-b border-primary bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <p className="flex-1 text-base">
          <span aria-hidden="true" className="mr-2 font-bold text-primary">
            ●
          </span>
          {fr.emailBanner.text}
        </p>
        {devLink && (
          <a href={devLink} className="text-sm text-primary underline">
            {fr.emailBanner.devLink}
          </a>
        )}
        <button
          type="button"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          className="min-h-11 border border-border px-3 font-semibold uppercase hover:bg-accent disabled:opacity-50"
        >
          {fr.emailBanner.resend}
        </button>
      </div>
    </div>
  );
}
