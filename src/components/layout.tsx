import { Outlet } from "react-router-dom";
import Navbar, { type NavbarItem } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";

export default function Layout() {
  const {isAuthenticated}  = useAuth()

  const navItems: NavbarItem[] = [
    { label: "خانه", path: "/" },
    { label: "فرم ها", path: "/form" },
    { label: "نقش ها", path: "/roles" },
    { label: "کاربران", path: "/users" },
  ];
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar items={isAuthenticated() ? navItems : []} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
