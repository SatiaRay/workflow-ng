import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { navItems } from "@/config/navigation";
import type { NavbarItem } from "@/components/navbar";

export default function Layout() {
  const { isAuthenticated, role } = useAuth();
  
  const filteredNavItems = (isAuthenticated() ? navItems : []).filter(
    (item: NavbarItem) => item.allowedRoles.includes(role)
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar items={filteredNavItems} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}