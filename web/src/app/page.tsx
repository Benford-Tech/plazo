import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current";

export default async function Home() {
  redirect((await getCurrentUser()) ? "/espace" : "/connexion");
}
