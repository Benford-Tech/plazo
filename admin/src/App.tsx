import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { ConfirmProvider } from "@/components/ui/confirm";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { can, type Permission } from "@/lib/roles";
import AccountPage from "@/pages/AccountPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import ListingPage from "@/pages/ListingPage";
import NewReservationPage from "@/pages/NewReservationPage";
import InboundEmailsPage from "@/pages/InboundEmailsPage";
import RemindersPage from "@/pages/RemindersPage";
import RevenuePage from "@/pages/RevenuePage";
import ParkingPage from "@/pages/ParkingPage";
import DashboardPage from "@/pages/DashboardPage";
import PlanningPage from "@/pages/PlanningPage";
import ShuttleWavesPage from "@/pages/ShuttleWavesPage";
import { QuickCardProvider } from "@/components/reservations/ReservationQuickCard";
import PricingPage from "@/pages/PricingPage";
import ReservationPage from "@/pages/ReservationPage";
import ReservationsPage from "@/pages/ReservationsPage";
import TeamPage from "@/pages/TeamPage";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import AcceptInvitationPage from "@/pages/AcceptInvitationPage";
import SignupPage from "@/pages/SignupPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import { lazy, Suspense } from "react";

// The platform space is only loaded by the platform owner; the capacity estimator (maps, geometry) on demand.
const OperatorsPage = lazy(() => import("@/pages/platform/OperatorsPage"));
const PlatformListingsPage = lazy(
  () => import("@/pages/platform/ListingsPage"),
);
const PlatformReservationsPage = lazy(
  () => import("@/pages/platform/PlatformReservationsPage"),
);
const PlatformPaymentsPage = lazy(
  () => import("@/pages/platform/PaymentsPage"),
);
const PlatformNotificationsPage = lazy(
  () => import("@/pages/platform/NotificationsPage"),
);
const CapacityStudiesPage = lazy(
  () => import("@/pages/capacity/CapacityStudiesPage"),
);
const CapacityStudyPage = lazy(
  () => import("@/pages/capacity/CapacityStudyPage"),
);
const ParkingPlanPage = lazy(() => import("@/pages/parking/ParkingPlanPage"));
const OccupationPage = lazy(() => import("@/pages/parking/OccupationPage"));
const SpotPlanningPage = lazy(() => import("@/pages/parking/SpotPlanningPage"));

const lazyPage = (page: React.ReactNode) => (
  <Suspense fallback={null}>{page}</Suspense>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-deep border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** The "Plateforme" space: only for the platform owner (PLATFORM_ADMIN_EMAILS on the API). */
function RequirePlatformAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.isPlatformAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  return can(user?.role, permission) ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}

/** "Parking" opens on the plan for managers, on the occupation for the rest of the staff. */
function ParkingIndex() {
  const { user } = useAuth();
  return (
    <Navigate
      to={
        can(user?.role, "parking:manage")
          ? "/parking/plan"
          : "/parking/occupation"
      }
      replace
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner position="top-center" theme="dark" />
        <BrowserRouter
          basename={import.meta.env.BASE_URL.replace(/\/$/, "")}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inscription" element={<SignupPage />} />
            <Route path="/invitation" element={<AcceptInvitationPage />} />
            <Route path="/verifier-email" element={<VerifyEmailPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <ConfirmProvider>
                    <QuickCardProvider>
                      <AdminLayout />
                    </QuickCardProvider>
                  </ConfirmProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/navettes" element={<ShuttleWavesPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route
                path="/reservations/nouvelle"
                element={
                  <RequirePermission permission="reservations:manage">
                    <NewReservationPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/reservations/a-verifier"
                element={
                  <RequirePermission permission="reservations:manage">
                    <InboundEmailsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/reservations/sms-veille"
                element={<RemindersPage />}
              />
              <Route path="/reservations/:id" element={<ReservationPage />} />
              <Route path="/parking" element={<ParkingIndex />} />
              <Route
                path="/parking/occupation"
                element={lazyPage(<OccupationPage />)}
              />
              <Route
                path="/parking/planning"
                element={lazyPage(<SpotPlanningPage />)}
              />
              <Route
                path="/parking/plan"
                element={
                  <RequirePermission permission="parking:manage">
                    {lazyPage(<ParkingPlanPage />)}
                  </RequirePermission>
                }
              />
              <Route
                path="/parking/plan/:step"
                element={
                  <RequirePermission permission="parking:manage">
                    {lazyPage(<ParkingPlanPage />)}
                  </RequirePermission>
                }
              />
              <Route
                path="/parking/reglages"
                element={
                  <RequirePermission permission="parking:manage">
                    <ParkingPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/chiffre-affaires"
                element={
                  <RequirePermission permission="revenue:view">
                    <RevenuePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/equipe"
                element={
                  <RequirePermission permission="team:manage">
                    <TeamPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/plazo"
                element={<Navigate to="/plazo/fiche" replace />}
              />
              <Route
                path="/plazo/fiche"
                element={
                  <RequirePermission permission="parking:manage">
                    <ListingPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/plazo/tarifs"
                element={
                  <RequirePermission permission="parking:manage">
                    <PricingPage />
                  </RequirePermission>
                }
              />
              <Route path="/mon-compte" element={<AccountPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <RequirePlatformAdmin>
                    <PlatformLayout />
                  </RequirePlatformAdmin>
                </ProtectedRoute>
              }
            >
              <Route
                path="/plateforme"
                element={<Navigate to="/plateforme/loueurs" replace />}
              />
              <Route
                path="/plateforme/loueurs"
                element={lazyPage(<OperatorsPage />)}
              />
              <Route
                path="/plateforme/annonces"
                element={lazyPage(<PlatformListingsPage />)}
              />
              <Route
                path="/plateforme/reservations"
                element={lazyPage(<PlatformReservationsPage />)}
              />
              <Route
                path="/plateforme/paiements"
                element={lazyPage(<PlatformPaymentsPage />)}
              />
              <Route
                path="/plateforme/notifications"
                element={lazyPage(<PlatformNotificationsPage />)}
              />
              <Route
                path="/plateforme/capacite"
                element={lazyPage(<CapacityStudiesPage />)}
              />
              <Route
                path="/plateforme/capacite/:id"
                element={<Navigate to="terrain" replace />}
              />
              <Route
                path="/plateforme/capacite/:id/:step"
                element={lazyPage(<CapacityStudyPage />)}
              />
            </Route>
            {/* The capacity estimator's former address. */}
            <Route
              path="/outil/*"
              element={<Navigate to="/plateforme/capacite" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
