import { vi, beforeEach, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Navbar, { NavbarItem } from "../../src/components/navbar";
import { renderAsSuperAdmin, renderAsUser } from "../__mocks__/auth-context";

// Mock at top level
const navbarSpy = vi.fn();

vi.mock("@/components/navbar", () => ({
  default: (props: any) => {
    navbarSpy(props);
    return <div data-testid="navbar-mock" />;
  },
}));

let mockNavItems: NavbarItem[] = [
  {
    label: "dashboard",
    path: "/dashboard",
    allowedRoles: ["superadmin", "user"],
  },
  {
    label: "about",
    path: "/about",
    allowedRoles: ["superadmin", "user"],
  },
  { label: "users", path: "/users", allowedRoles: ["superadmin"] },
  { label: "roles", path: "/roles", allowedRoles: ["superadmin"] },
];

export const __setMockNavItems = (items: NavbarItem[]) => {
  mockNavItems = items;
};

vi.mock("@/config/navigation", () => ({
  get navItems() {
    return mockNavItems;
  },
}));

const renderLayoutWithoutAuth = (isAuthenticated?: boolean): void => {
  renderWithAuth(
    <BrowserRouter>
      <Layout />
    </BrowserRouter>,
    {
      isAuthenticated: () => isAuthenticated,
    },
  );
};

const renderLayoutWithUserRole = (items: NavbarItem[], initialPath = "/") => {
  __setMockNavItems(items);
  renderAsUser(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout />
    </MemoryRouter>,
  );
};

const renderLayoutWithSuperAdminRole = (
  items: NavbarItem[],
  initialPath = "/",
) => {
  __setMockNavItems(items);
  renderAsSuperAdmin(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout />
    </MemoryRouter>,
  );
};

const extractNavbarSpyProps = (navbarSpy: vi.Mock): any => {
  return navbarSpy.mock.calls[0][0];
};

import { renderWithAuth } from "../__mocks__/auth-context";
import { BrowserRouter } from "react-router-dom";
import Layout from "../../src/components/layout";

describe("Layout Tests", () => {
  beforeEach(() => {
    navbarSpy.mockClear();
  });

  it("should pass empty to Navbar component when user is not authenticated", () => {
    renderLayoutWithoutAuth(false); // is authenticated = false

    expect(navbarSpy).toHaveBeenCalledTimes(1);

    const passedPropsToNavbar = extractNavbarSpyProps(navbarSpy);

    expect(passedPropsToNavbar.items).toHaveLength(0);
  });

  it("should pass items to Navbar component when user is authenticated", () => {
    // Fixed test name
    renderLayoutWithoutAuth(true); // is authenticated = true

    expect(navbarSpy).toHaveBeenCalledTimes(1);

    const passedPropsToNavbar = extractNavbarSpyProps(navbarSpy);

    expect(passedPropsToNavbar.items).not.toHaveLength(0);
  });

  it("should not pass superadmin level nav items to Navbar component when user is not superadmin", () => {
    // act
    renderLayoutWithUserRole(mockNavItems);

    // assert
    const passedItemsToNavbar = extractNavbarSpyProps(navbarSpy)
      .items as NavbarItem[];
    mockNavItems.forEach((item) => {
      if (item.allowedRoles.includes("superadmin") && !item.allowedRoles.includes("user")) {
        expect(passedItemsToNavbar).not.toContainEqual(item);
      }
    });
  });

  it("should pass user level nav items to Navbar component when user is not superadmin", () => {
    // act
    renderLayoutWithUserRole(mockNavItems);

    // assert
    const passedItemsToNavbar = extractNavbarSpyProps(navbarSpy)
      .items as NavbarItem[];
    mockNavItems.forEach((item) => {
      if (item.allowedRoles.includes("user"))
        expect(passedItemsToNavbar).toContainEqual(item);
    });
  });

  it("should pass user level nav items to Navbar component when authenticated user is superadmin", () => {
    // act
    renderLayoutWithSuperAdminRole(mockNavItems);

    // assert
    const passedItemsToNavbar = extractNavbarSpyProps(navbarSpy)
      .items as NavbarItem[];
    mockNavItems.forEach((item) => {
      if (item.allowedRoles.includes("user"))
        expect(passedItemsToNavbar).toContainEqual(item);
    });
  });

  it("should pass superadmin level nav items to Navbar component when authenticated user is superadmin", () => {
    // act
    renderLayoutWithSuperAdminRole(mockNavItems);

    // assert
    const passedItemsToNavbar = extractNavbarSpyProps(navbarSpy)
      .items as NavbarItem[];
    mockNavItems.forEach((item) => {
      if (item.allowedRoles.includes("user"))
        expect(passedItemsToNavbar).toContainEqual(item);
    });
  });
});
