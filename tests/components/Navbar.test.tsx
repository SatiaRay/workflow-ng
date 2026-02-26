// tests/Home.test.tsx
import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Navbar, { NavbarItem } from "../../src/components/navbar";
import { renderAsUser, renderUnauthenticated } from "../__mocks__/auth-context";
import userEvent from "@testing-library/user-event";
import { User } from "@supabase/supabase-js";

const testItems: NavbarItem[] = [
  { label: "Home", path: "/", allowedRoles: ["user"] },
  { label: "About", path: "/about", allowedRoles: ["user"] },
  { label: "Contact", path: "/contact", allowedRoles: ["user"] },
];

const mockUser: User = {
  id: `1`,
  email: `test@example.com`,
  aud: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: { role: "user" },
  user_metadata: {
    name: `Test User`,
  },
};

const renderNavbarAsUnauthenticated = (
  items: NavbarItem[],
  initialPath = "/",
) => {
  renderUnauthenticated(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar items={items} />
    </MemoryRouter>,
  );
};

const renderNavbarAsAuthenticated = (
  items: NavbarItem[],
  initialPath = "/",
  user?: User,
) => {
  renderAsUser(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar items={items} />
    </MemoryRouter>,
    {
      user: user,
    },
  );
};

const findLinkByLabel = (label: string): HTMLElement => {
  return screen.getByRole("link", { name: label });
};

const findLinkByHref = (href: string) => {
  const links = screen.getAllByRole("link");
  return links.find((link) => link.getAttribute("href") === href);
};

const findUserMenuTrigger = (): HTMLElement => {
  return screen.getByTestId("user-menu-trigger");
};

const clickUserMenuTrigger = async (): Promise<void> => {
  const trigger = findUserMenuTrigger();
  await act(async () => {
    await userEvent.click(trigger);
  });
};

describe("Test Navbar", () => {
  it("should render passed items", () => {
    // act
    renderNavbarAsUnauthenticated(testItems);

    // assert
    testItems.forEach((item) => {
      const linkElement = findLinkByLabel(item.label);
      expect(linkElement).toBeInTheDocument();
    });
  });

  it("should render passed items as links with correct href", () => {
    // act
    renderNavbarAsUnauthenticated(testItems);

    // assert
    testItems.forEach((item) => {
      const linkElement = findLinkByLabel(item.label);
      expect(linkElement).toHaveAttribute("href", item.path);
    });
  });

  it("should highlight the active link based on current pathname", () => {
    // act
    renderNavbarAsUnauthenticated(testItems, "/about");

    // assert
    const activeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("text-primary"));

    expect(activeLinks.length).toBe(1);
  });

  it("should display login link when user unauthenticated", () => {
    // act
    renderNavbarAsUnauthenticated(testItems);

    // assert
    expect(findLinkByHref("/auth/login")).toBeInTheDocument();
  });

  it("should display authenticated user email", async () => {
    // act
    renderNavbarAsAuthenticated(testItems, "/", mockUser);
    await clickUserMenuTrigger();

    // assert
    expect(
      screen.queryByText(mockUser.email ?? "test@example.com"),
    ).toBeInTheDocument();
  });

  it("should display logout option when user authenticated", async () => {
    // act
    renderNavbarAsAuthenticated(testItems);
    await clickUserMenuTrigger();

    // assert
    expect(screen.queryByText("خروج")).toBeInTheDocument();
  });
});
