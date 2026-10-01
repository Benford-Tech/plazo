import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";

export function AdminLayout() {
  const { user } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger className="h-10 w-10" />
            <span className="truncate text-sm text-muted-foreground">
              {user?.name} · {user ? fr.roles[user.role] : ""}
            </span>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
