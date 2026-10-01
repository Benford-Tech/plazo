import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: parking, isLoading, error } = useQuery({ queryKey: ["parking"], queryFn: adminApi.getParking });
  const t = fr.dashboard;

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.hello(user?.name ?? "")}</h1>
      {error && <p className="text-destructive">{describeError(error)}</p>}
      {isLoading && <Skeleton className="h-40 w-full" />}
      {parking && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>{parking.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t.totalCapacity} value={t.places(parking.totalCapacity)} />
              <Stat label={t.bookableCapacity} value={t.places(parking.bookableCapacity)} />
              <Stat label={t.safetyMargin} value={`${parking.safetyMarginPct} %`} />
              <Stat label={t.shuttle} value={t.minutes(parking.shuttleTravelMinutes)} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.bookableHelp}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
