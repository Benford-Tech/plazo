import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { describeError, fr } from "@/lib/fr";

/** Persistent yellow banner while the super admin acts inside an operator's space. */
export function ViewAsBanner() {
  const { user, stopViewAs } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  if (!user?.viewAs) return null;

  const back = async () => {
    setLeaving(true);
    try {
      await stopViewAs();
      queryClient.clear();
      navigate("/plateforme", { replace: true });
    } catch (err) {
      toast.error(describeError(err));
      setLeaving(false);
    }
  };

  return (
    <div role="status" className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
        <p className="text-base font-bold uppercase tracking-wide">{fr.viewAs.banner(user.viewAs.operatorName)}</p>
        <p className="hidden text-sm md:block">{fr.viewAs.note}</p>
        <button
          type="button"
          onClick={back}
          disabled={leaving}
          className="ml-auto min-h-11 border-2 border-primary-foreground px-3 text-base font-bold uppercase tracking-wide hover:bg-primary-foreground hover:text-primary disabled:opacity-60"
        >
          {fr.viewAs.back}
        </button>
      </div>
    </div>
  );
}
