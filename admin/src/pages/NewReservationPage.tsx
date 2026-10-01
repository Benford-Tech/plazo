import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { fr } from "@/lib/fr";
import type { ParsedBooking } from "@/lib/types";

export default function NewReservationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const prefill = (useLocation().state as { prefill?: ParsedBooking } | null)?.prefill;
  const t = fr.reservation;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3 border-b-2 border-primary pb-3">
        <Link to="/" aria-label={t.back} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-wide">{t.newTitle}</h1>
      </div>
      <ReservationForm
        defaultDate={params.get("date") ?? undefined}
        prefill={prefill}
        onSaved={reservation => {
          toast.success(t.saved);
          queryClient.invalidateQueries({ queryKey: ["planning"] });
          navigate(`/reservations/${reservation.id}`);
        }}
      />
    </div>
  );
}
