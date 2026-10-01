import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { can, type Permission } from "@/lib/roles";
import AccountPage from "@/pages/AccountPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import ImportEmailPage from "@/pages/ImportEmailPage";
import ListingPage from "@/pages/ListingPage";
import NewReservationPage from "@/pages/NewReservationPage";
import ParkingPage from "@/pages/ParkingPage";
import PlanningPage from "@/pages/PlanningPage";
import PricingPage from "@/pages/PricingPage";
import ReservationPage from "@/pages/ReservationPage";
import ReservationsPage from "@/pages/ReservationsPage";
import TeamPage from "@/pages/TeamPage";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user } = useAuth();
  return can(user?.role, permission) ? <>{children}</> : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner position="top-center" theme="dark" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<PlanningPage />} />
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
                path="/reservations/import"
                element={
                  <RequirePermission permission="reservations:manage">
                    <ImportEmailPage />
                  </RequirePermission>
                }
              />
              <Route path="/reservations/:id" element={<ReservationPage />} />
              <Route
                path="/parking"
                element={
                  <RequirePermission permission="parking:manage">
                    <ParkingPage />
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
              <Route path="/plazo" element={<Navigate to="/plazo/fiche" replace />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
