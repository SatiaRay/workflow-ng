import { Moon, Sun, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";


export interface NavbarProps {
  items?: NavbarItem[];
}

export interface NavbarItem {
  label: string;
  path: string;
}

export default function Navbar({ items }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const location = useLocation();

  console.log(location.pathname);
  

  const isPathnameActive = (path: string) => {
    return location.pathname === path;
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
          <ThemToggleButton />

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
    <div className="hidden md:flex items-center space-x-6">
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
  return <div className="flex items-center space-x-4">{children}</div>;
};

const ThemToggleButton = () => {
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const { theme, setTheme } = useTheme();
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
}: {
  items: NavbarItem[];
  isPathnameActive: (pathname: string) => boolean;
  onClick: () => void;
}) => {
  return (
    <div className="md:hidden border-t border-gray-800 py-4">
      <div className="flex flex-col space-y-4">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isPathnameActive(item.path)
                ? "text-primary bg-accent"
                : "text-muted-foreground hover:text-primary hover:bg-accent"
            }`}
            onClick={onClick}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};
