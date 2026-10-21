import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";

/** 21/10/2026 (B): the citron band of the prospects' demo, with « Quitter » back to its entry. */
export function DemoBanner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user?.demo) return null;

  const quit = async () => {
    await logout();
    navigate("/demo", { replace: true });
  };

  return (
    <div role="status" className="bg-lime text-lime-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm sm:px-6">
        <strong>{fr.demo.banner}</strong>
        <span>· {fr.demo.bannerNote}</span>
        <span className="hidden text-xs md:inline">· {fr.demo.simulated}</span>
        <button type="button" onClick={quit} className="ml-auto min-h-11 px-2 font-bold underline-offset-4 hover:underline">
          {fr.demo.quit}
        </button>
      </div>
    </div>
  );
}
