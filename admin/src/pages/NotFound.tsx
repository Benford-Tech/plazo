import { Link } from "react-router-dom";
import { fr } from "@/lib/fr";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">{fr.notFound.title}</h1>
      <Link to="/" className="text-primary underline">
        {fr.notFound.back}
      </Link>
    </main>
  );
}
