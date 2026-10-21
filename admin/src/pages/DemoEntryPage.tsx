import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import type { DemoRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.demo;
const ROLES: DemoRole[] = ["manager", "agent", "driver", "valet"];

/**
 * 21/10/2026 (A): the prospects' entry to the demo, /pro/demo (anyone) or /pro/demo/<token> (a prospect's own link, its
 * opens counted). A role, then « Entrer dans la démo »: a demo session of « Parking des Cèdres ».
 */
export default function DemoEntryPage() {
  const { token } = useParams();
  const { signIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [role, setRole] = useState<DemoRole>("manager");
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const link = useQuery({ queryKey: ["demo-link", token], queryFn: () => adminApi.demoLink(token!), enabled: !!token, retry: false });
  // An expired or unknown link still lets the prospect in, without counting it.
  const usable = link.data?.status === "valid" ? token : undefined;

  const enter = async () => {
    setError(null);
    setEntering(true);
    try {
      const { tokenData, user } = await adminApi.enterDemo(role, usable);
      queryClient.clear();
      signIn(tokenData, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(describeError(err));
      setEntering(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-lime-deep">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 pb-6 pt-10 text-white">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-lime px-2.5 py-1 text-xl font-extrabold text-lime-ink">{PRODUCT.name}</span>
          <span className="font-narrow text-xl font-bold text-lime">PRO</span>
          <span className="ml-auto rounded-full border border-lime px-2.5 py-0.5 text-xs font-bold uppercase text-lime">{t.badge}</span>
        </div>
        <h1 className="font-narrow text-[32px] font-bold leading-[1.08]">{t.title}</h1>
        <p className="text-[15px] text-[#D6E9D9]">{t.intro}</p>
        {link.data?.status === "valid" && link.data.companyName && <p className="text-[15px] font-semibold text-lime">{t.welcome(link.data.companyName)}</p>}
      </div>
      <div className="flex-1 rounded-t-[24px] bg-background">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-5 py-6">
          {link.data && link.data.status !== "valid" && (
            <Alert>
              <AlertDescription>{link.data.status === "expired" ? t.linkExpired : t.linkUnknown}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <h2 className="text-[15px] font-bold" id="demo-role">
            {t.chooseRole}
          </h2>
          <div role="radiogroup" aria-labelledby="demo-role" className="flex flex-col gap-3">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[14px] bg-white px-4 py-3.5 text-left",
                  role === r ? "border-2 border-lime ring-1 ring-lime" : "border border-[#D4D8D2]",
                )}
              >
                <strong className="text-base">{t.roles[r].label}</strong>
                <span className="text-[13px] text-[#4B5563]">{t.roles[r].hint}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={enter}
            disabled={entering || (!!token && link.isLoading)}
            className="mt-4 h-[54px] rounded-full bg-lime text-[17px] font-bold text-lime-ink disabled:opacity-60"
          >
            {entering ? t.entering : t.enter}
          </button>
          <p className="text-center text-xs text-[#4B5563]">{t.footnote}</p>
        </div>
      </div>
    </main>
  );
}
