import { CircleUser, LayoutDashboard, LogOut, ParkingSquare, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { can, type Permission } from "@/lib/roles";

const mainItems: { title: string; url: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { title: fr.nav.dashboard, url: "/", icon: LayoutDashboard, permission: "dashboard:view" },
  { title: fr.nav.parking, url: "/parking", icon: ParkingSquare, permission: "parking:manage" },
  { title: fr.nav.team, url: "/equipe", icon: UserCog, permission: "team:manage" },
  { title: fr.nav.account, url: "/mon-compte", icon: CircleUser },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  // Screens the role cannot use are hidden; the backend refuses them anyway.
  const items = mainItems.filter(i => !i.permission || can(user?.role, i.permission));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-auto py-2">
            {collapsed ? (
              <span className="text-base font-bold text-sidebar-primary">{PRODUCT.name.charAt(0)}</span>
            ) : (
              <div className="px-1">
                <p className="text-base font-bold tracking-tight text-sidebar-primary">{PRODUCT.name}</p>
                <p className="truncate text-xs font-normal text-sidebar-foreground/70">{user?.operatorName}</p>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} size="lg">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={() => setOpenMobile(false)}
                      className="text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={fr.nav.logout} size="lg" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="h-5 w-5" />
              <span>{fr.nav.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
