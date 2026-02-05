// tests/Home.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Navbar, { NavbarItem } from "../../src/components/navbar";

const testItems: NavbarItem[] = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

describe("Test Navbar For Desktop Version", () => {
  it("should render passed items", () => {
    renderNavbar(testItems);

    testItems.forEach((item) => {
      const linkElement = findLinkByLabel(item.label);
      expect(linkElement).toBeInTheDocument();
    });
  });

  it("should render passed items as links with correct href", () => {
    renderNavbar(testItems);

    testItems.forEach((item) => {
      const linkElement = findLinkByLabel(item.label);
      expect(linkElement).toHaveAttribute("href", item.path);
    });
  });

  it("should highlight the active link based on current pathname", () => {
    renderNavbar(testItems, "/about");

    const activeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("text-primary"));

    expect(activeLinks.length).toBe(1);
  });
});

const renderNavbar = (items: NavbarItem[], initialPath = "/") => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar items={items} />
    </MemoryRouter>,
  );
};

const findLinkByLabel = (label: string): HTMLElement => {
  return screen.getByText(label);
};