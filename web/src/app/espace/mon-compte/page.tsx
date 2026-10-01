import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { fr } from "@/i18n/fr";
import { requireUser } from "@/server/auth/current";
import { ChangePasswordForm } from "./password-form";

export const metadata: Metadata = { title: fr.account.title };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <h1 className="text-2xl font-semibold">{fr.account.title}</h1>
      <Card title={`${user.name} · ${user.email}`}>
        <ChangePasswordForm />
      </Card>
    </>
  );
}
