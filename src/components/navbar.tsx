import { Moon, Sun, Menu, X, User, LogOut, LogIn } from "lucide-react";
import React, { useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@/types/user";

export interface NavbarProps {
  items?: NavbarItem[];
}

export interface NavbarItem {
  label: string;
  path: string;
  allowedRoles: UserRole[];
}

export default function Navbar({ items }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isPathnameActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "??";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <NavbarContainer>
      <div className="flex h-16 items-center justify-between">
        <NavbarLogo />

        <DesktopNavigationMenu
          items={items || []}
          isPathnameActive={isPathnameActive}
        />

        <NavbarLeft>
          <ThemeToggleButton />

          {isAuthenticated() ? (
            <UserMenu
              userEmail={user?.email || "کاربر"}
              onLogout={handleLogout}
              getUserInitials={getUserInitials}
            />
          ) : (
            <LoginLink />
          )}

          <MobileMenuButton
            isMenuOpen={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </NavbarLeft>
      </div>

      {isMenuOpen && (
        <MobileMenuButtons
          items={items || []}
          isPathnameActive={isPathnameActive}
          onClick={() => setIsMenuOpen(false)}
          isAuthenticated={isAuthenticated()}
          userEmail={user?.email}
          onLogout={handleLogout}
        />
      )}
    </NavbarContainer>
  );
}

const NavbarContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">{children}</div>
    </nav>
  );
};

const NavbarLogo = () => {
  return (
    <Link to="/" className="flex items-center">
      <div className="text-xl font-bold text-primary">گردش کار ساتیا</div>
    </Link>
  );
};

const DesktopNavigationMenu = ({
  items,
  isPathnameActive,
}: {
  items: NavbarItem[];
  isPathnameActive: (pathname: string) => boolean;
}) => {
  return (
    <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={`text-sm font-medium transition-colors ${
            isPathnameActive(item.path)
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

const NavbarLeft = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center space-x-4 rtl:space-x-reverse">
      {children}
    </div>
  );
};

const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
};

const LoginLink = () => {
  const location = useLocation()

  if(location.pathname == '/auth/login')
    return null

  return (
    <Link to="/auth/login">
      <Button variant="ghost" size="sm" className="gap-2">
        <LogIn />
        <span>ورود</span>
      </Button>
    </Link>
  );
};

const UserMenu = ({
  userEmail,
  onLogout,
  getUserInitials,
}: {
  userEmail: string;
  onLogout: () => void;
  getUserInitials: () => string;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          data-testid="user-menu-trigger"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-right">
              {userEmail}
            </p>
            <p className="text-xs leading-none text-muted-foreground text-right">
              حساب کاربری
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-right"
        >
          <LogOut className="inline-block ml-2 h-4 w-4" />
          <span>خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MobileMenuButton = ({
  isMenuOpen,
  onClick,
}: {
  isMenuOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onClick}
      aria-label="Toggle menu"
    >
      {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
};

const MobileMenuButtons = ({
  items,
  isPathnameActive,
  onClick,
  isAuthenticated,
  userEmail,
  onLogout,
}: {
  items: NavbarItem[];
  isPathnameActive: (pathname: string) => boolean;
  onClick: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onLogout: () => void;
}) => {
  return (
    <div className="md:hidden border-t border-gray-800 py-4">
      <div className="flex flex-col space-y-4">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors mobile-nav-button ${
              isPathnameActive(item.path)
                ? "text-primary bg-accent"
                : "text-muted-foreground hover:text-primary hover:bg-accent"
            }`}
            onClick={onClick}
          >
            {item.label}
          </Link>
        ))}

        {/* Mobile menu footer with auth info */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="px-4 py-2 text-sm text-muted-foreground">
                {userEmail}
              </div>
              <button
                onClick={() => {
                  onLogout();
                  onClick();
                }}
                className="w-full px-4 py-2 text-sm font-medium text-right rounded-md transition-colors text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="inline-block ml-2 h-4 w-4" />
                خروج
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="block px-4 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-accent"
              onClick={onClick}
            >
              ورود
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
