import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import type { ParsedBooking } from "@/lib/types";

export default function NewReservationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const state = useLocation().state as { prefill?: ParsedBooking; inboundId?: string } | null;
  const prefill = state?.prefill;
  const inboundId = state?.inboundId;
  const t = fr.reservation;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3 border-b-2 border-lime-deep pb-3">
        <Link to="/" aria-label={t.back} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.newTitle}</h1>
      </div>
      <ReservationForm
        defaultDate={params.get("date") ?? undefined}
        prefill={prefill}
        onSaved={async reservation => {
          toast.success(t.saved);
          queryClient.invalidateQueries({ queryKey: ["planning"] });
          // Typed from a forwarded email (M-A): the email leaves "À vérifier", linked to this booking.
          if (inboundId) {
            await adminApi.attachInboundEmail(inboundId, reservation.id).catch(() => undefined);
            queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }
          navigate(`/reservations/${reservation.id}`);
        }}
      />
    </div>
  );
}
