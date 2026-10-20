import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { contractFr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { can } from "@/lib/roles";

/** « Votre contrat Plazo est prêt à signer » (20/10/2026, choice 2a): to the managers, until one of them signs. */
export function ContractBanner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const enabled = !!user && !user.viewAs && can(user.role, "parking:manage");
  const contract = useQuery({
    queryKey: ["contract"],
    queryFn: adminApi.getMyContract,
    enabled,
    staleTime: 5 * 60_000,
  });
  if (!enabled || contract.data?.current?.status !== "pending" || pathname === "/mon-contrat") return null;

  return (
    <div role="status" className="border-b border-warn bg-warn-soft">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <p className="flex-1 font-semibold text-[#78350F]">{contractFr.banner(PRODUCT.name)}</p>
        <Link to="/mon-contrat" className="flex min-h-11 items-center font-bold text-[#78350F] underline">
          {contractFr.bannerAction}
        </Link>
      </div>
    </div>
  );
}
