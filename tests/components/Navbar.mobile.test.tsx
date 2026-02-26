// tests/Home.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Navbar, { NavbarItem } from "../../src/components/navbar";
import { act } from "react";

const testItems: NavbarItem[] = [
  { label: "Home", path: "/", allowedRoles: ['user'] },
  { label: "About", path: "/about", allowedRoles: ['user'] },
  { label: "Contact", path: "/contact", allowedRoles: ['user'] },
];

describe("Test Navbar For Mobile Version", () => {
  it("should render menu button", () => {
    renderNavbar(testItems);

    const menuButton = findMenuButton();

    expect(menuButton).toBeInTheDocument();
  });

  it("should open mobile menu on button click", async () => {
    renderNavbar(testItems);

    const menuButton = findMenuButton();
    await clickMenuButton(menuButton);

    testItems.forEach((item) => {
      const link = findLinkByLabel(item.label);
      expect(link).toBeInTheDocument();
    });
  });

  it("should highlight active link based on current path", async () => {
    renderNavbar(testItems, "/about");

    const menuButton = findMenuButton();
    await menuButton.click();

    const activeLink = findLinkByLabel("About");

    expect(activeLink).toHaveClass("text-primary");
  });
});

const findMenuButton = (): HTMLElement => {
  return screen.getByLabelText("Toggle menu");
};

const renderNavbar = (items: NavbarItem[], initialPath = "/") => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar items={items} />
    </MemoryRouter>,
  );
};

const findLinkByLabel = (label: string): HTMLElement | null => {
  const links = screen.getAllByRole('link');

  if(links.length === 0) 
    return null;

  const link = links.find((link) => link.textContent === label && link.classList.contains("mobile-nav-button"));

  return link || null;
};

const clickMenuButton = async (menuButton: HTMLElement) => {
  return await act(async () => {
    await userEvent.click(menuButton);
  });
};
