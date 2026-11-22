import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-context";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

const t = fr.site.platform;
const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

/** Plateforme › loueur (22/11/2026, « le site est en supplément »): the platform switches the site's paid option on or off. */
export function OperatorSiteCard({ operatorId }: { operatorId: string }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const key = ["platform", "operator", operatorId, "site"];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getPlatformSite(operatorId) });
  const set = useMutation({
    mutationFn: (active: boolean) => adminApi.setPlatformSite(operatorId, active),
    onSuccess: (res) => {
      queryClient.setQueryData(key, res);
      queryClient.invalidateQueries({ queryKey: ["platform", "operators", "overview"] });
      toast.success(t.done);
    },
    onError: (err) => toast.error(describeError(err)),
  });
  const site = query.data?.data;
  if (!site) return null;
  return (
    <section data-testid="operator-site" className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-narrow text-lg font-bold">{t.title}</h2>
        <p className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", site.addon.active ? "text-ok-text" : "text-foreground")}>{site.addon.active ? t.active : t.inactive}</span>
          {" · "}
          {site.published ? t.online : t.offline}
          {site.addon.requestedAt && !site.addon.active && ` · ${t.requested(day.format(new Date(site.addon.requestedAt)))}`}
        </p>
        {site.url && <p className="break-all font-mono text-xs">{site.url.replace(/^https?:\/\//, "")}</p>}
      </div>
      <Button
        type="button"
        variant={site.addon.active ? "outline" : "default"}
        className={cn("h-11 font-bold", !site.addon.active && "bg-lime text-lime-ink hover:bg-lime/90")}
        disabled={set.isPending}
        onClick={async () => {
          if (site.addon.active && !(await confirm(t.deactivateConfirm, { destructive: true, confirmLabel: t.deactivate }))) return;
          set.mutate(!site.addon.active);
        }}
      >
        {site.addon.active ? t.deactivate : t.activate}
      </Button>
    </section>
  );
}
