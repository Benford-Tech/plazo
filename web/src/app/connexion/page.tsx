import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui";
import { PRODUCT } from "@/config/product";
import { fr } from "@/i18n/fr";
import { getCurrentUser } from "@/server/auth/current";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: fr.login.title };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ motdepasse?: string }> }) {
  if (await getCurrentUser()) redirect("/espace");
  const { motdepasse } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-2xl font-bold text-sky-800">{PRODUCT.name}</p>
      <h1 className="mt-1 mb-6 text-slate-600">{fr.login.subtitle}</h1>
      {motdepasse === "modifie" && (
        <div className="mb-4">
          <Alert tone="success">{fr.login.passwordChanged}</Alert>
        </div>
      )}
      <LoginForm />
    </main>
  );
}
