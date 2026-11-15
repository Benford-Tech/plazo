import { FileSignature } from "lucide-react";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

const when = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * 15/11/2026 (« avoir une indication des contrats déjà signés sur la réservation et sur le planning », choix C): a small
 * green signed-document icon beside the traveller's name, « Contrat signé le 15 nov., 08:32 » on hover. Nothing while the
 * contract is not signed.
 */
export function ContractSignedIcon({ signedAt, className }: { signedAt?: string | null; className?: string }) {
  if (!signedAt) return null;
  const label = fr.contractSigned.title(when.format(new Date(signedAt)));
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      data-testid="contract-signed-icon"
      className={cn("inline-flex shrink-0 items-center text-lime-deep", className)}
    >
      <FileSignature className="size-4" aria-hidden="true" />
    </span>
  );
}
