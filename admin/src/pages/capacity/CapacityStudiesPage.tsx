import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PanelLabel, ToolButton } from "@/components/capacity/ui";
import { adminApi } from "@/lib/api";
import { dateTime, describeError, fr } from "@/lib/fr";

/** "Mes études": every capacity study, most recent first. */
export default function CapacityStudiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studies = useQuery({ queryKey: ["capacity-studies"], queryFn: adminApi.listCapacityStudies });

  const create = useMutation({
    mutationFn: () => adminApi.createCapacityStudy(fr.capacity.newStudyName),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["capacity-studies"] });
      navigate(`/plateforme/capacite/${data.id}/terrain`);
    },
    onError: e => toast.error(describeError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCapacityStudy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacity-studies"] });
      toast.success(fr.capacity.deleted);
    },
    onError: e => toast.error(describeError(e)),
  });

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase">{fr.capacity.listTitle}</h1>
            <p className="text-muted-foreground">{fr.capacity.listSubtitle}</p>
          </div>
          <ToolButton variant="primary" disabled={create.isPending} onClick={() => create.mutate()}>
            {fr.capacity.newStudy}
          </ToolButton>
        </div>

        {studies.isLoading && <p className="text-muted-foreground">{fr.common.loading}</p>}
        {studies.error && <p className="text-destructive">{describeError(studies.error)}</p>}
        {studies.data && studies.data.length === 0 && <p className="text-muted-foreground">{fr.capacity.empty}</p>}
        {studies.data && studies.data.length > 0 && (
          <div>
            <div className="grid grid-cols-[1fr_200px_170px_140px_44px] gap-3 border-b border-border pb-1">
              <PanelLabel className="mb-0">{fr.capacity.colName}</PanelLabel>
              <PanelLabel className="mb-0">{fr.capacity.colParcels}</PanelLabel>
              <PanelLabel className="mb-0">{fr.capacity.colRange}</PanelLabel>
              <PanelLabel className="mb-0">{fr.capacity.colUpdated}</PanelLabel>
              <span />
            </div>
            {studies.data.map(s => (
              <div key={s.id} className="grid min-h-14 grid-cols-[1fr_200px_170px_140px_44px] items-center gap-3 border-b border-border">
                <button type="button" className="truncate text-left text-base font-bold hover:text-lime-deep" onClick={() => navigate(`/plateforme/capacite/${s.id}/terrain`)}>
                  {s.name}
                  {s.createdBy && <span className="block text-[13px] font-normal text-muted-foreground">{s.createdBy.name}</span>}
                </button>
                <span className="truncate text-sm text-muted-foreground" title={s.parcels.map(p => p.id).join(", ")}>
                  {s.parcels.map(p => `${p.section.replace(/^0+/, "")} ${p.numero.replace(/^0+/, "")}`).join(" + ") || "—"}
                </span>
                <span className="font-mono text-sm">{s.results.totals ? fr.capacity.rangeShort(s.results.totals.selfPark, s.results.totals.valet24) : "—"}</span>
                <span className="font-mono text-sm text-muted-foreground">{dateTime.format(new Date(s.updatedAt))}</span>
                <button
                  type="button"
                  aria-label={`${fr.capacity.delete} ${s.name}`}
                  title={fr.capacity.delete}
                  className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive"
                  onClick={() => window.confirm(fr.capacity.confirmDelete(s.name)) && remove.mutate(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
