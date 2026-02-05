// tests/Home.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HomePage from "../../src/routes/home";
import "@testing-library/jest-dom";
import Navbar, { NavbarItem } from "../../src/components/navbar";

const testItems: NavbarItem[] = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
];

describe("Navbar Tests", () => {
  it("should render passed items as link", () => {
    render(
      <BrowserRouter>
        <Navbar items={testItems} />
      </BrowserRouter>,
    );

    testItems.forEach((item) => {
      const linkElement = screen.getByText(item.label);
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute("href", item.path);
    });
  });
});
