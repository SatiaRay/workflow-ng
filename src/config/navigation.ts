import type { NavbarItem } from "@/components/navbar";

export const navItems: NavbarItem[] = [
  { label: "کارتابل", path: "/tasks", allowedRoles: ["user", "superadmin"] },
  { label: "گردشکار", path: "/workflows", allowedRoles: ["superadmin"] },
  { label: "فرم ها", path: "/form", allowedRoles: ["superadmin"] },
  { label: "نقش ها", path: "/roles", allowedRoles: ["superadmin"] },
  { label: "کاربران", path: "/users", allowedRoles: ["superadmin"] },
];