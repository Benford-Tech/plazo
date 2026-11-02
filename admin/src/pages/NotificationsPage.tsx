import { BellList } from "@/components/notifications/BellList";
import { fr } from "@/lib/fr";

/** « Voir tout » of the bell: the 30 last days. */
export default function NotificationsPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">{fr.bell.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{fr.bell.pageIntro}</p>
      </div>
      <section className="overflow-hidden rounded-[14px] border border-panel-line bg-white">
        <BellList pageSize="page" />
      </section>
    </>
  );
}
