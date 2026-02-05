import { Outlet } from "react-router-dom";
import Navbar, { type NavbarItem } from "./navbar";

export default function Layout() {
  const navItems: NavbarItem[] = [
    { label: "خانه", path: "/" },
    { label: "فرم ها", path: "/form" },
  ];
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar items={navItems} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
