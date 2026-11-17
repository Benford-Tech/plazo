import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AGREEMENTS_KEY } from "@/lib/contract";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { agreementsFr, contractFr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { can } from "@/lib/roles";

/**
 * « Vos contrats Plazo sont prêts à signer » (20/10/2026, choice 2a; the two contracts of 17/11/2026, choice C): to the
 * managers, until one of them signs. Nothing else is blocked.
 */
export function ContractBanner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const enabled =
    !!user && !user.viewAs && !user.demo && can(user.role, "parking:manage");
  const contract = useQuery({
    queryKey: ["contract"],
    queryFn: adminApi.getMyContract,
    enabled,
    staleTime: 5 * 60_000,
  });
  const agreements = useQuery({
    queryKey: AGREEMENTS_KEY,
    queryFn: adminApi.getAgreements,
    enabled,
    staleTime: 5 * 60_000,
  });
  const due =
    (agreements.data?.toSign.length ?? 0) +
    (contract.data?.current?.status === "pending" ? 1 : 0);
  if (!enabled || !due || pathname === "/mon-contrat") return null;
  const onlyParticular = !agreements.data?.toSign.length;

  return (
    <div role="status" className="border-b border-warn bg-warn-soft">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <p className="flex-1 font-semibold text-[#78350F]">
          {onlyParticular
            ? contractFr.banner(PRODUCT.name)
            : agreementsFr.banner(due)}
        </p>
        <Link
          to="/mon-contrat"
          className="flex min-h-11 items-center font-bold text-[#78350F] underline"
        >
          {onlyParticular ? contractFr.bannerAction : agreementsFr.bannerAction}
        </Link>
      </div>
    </div>
  );
}
