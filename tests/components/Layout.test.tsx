import { vi, beforeEach, describe, it, expect } from "vitest";

// Mock at top level
const navbarSpy = vi.fn();

vi.mock("@/components/navbar", () => ({
  default: (props: any) => {
    navbarSpy(props);
    return <div data-testid="navbar-mock" />;
  },
}));

import { renderWithAuth } from "../__mocks__/auth-context";
import { BrowserRouter } from "react-router-dom";
import Layout from "../../src/components/layout";

describe("Layout Tests", () => {
  beforeEach(() => {
    navbarSpy.mockClear();
  });

  it("should pass empty to Navbar component when user is not authenticated", () => {
    renderLayout(false); // is authenticated = false

    expect(navbarSpy).toHaveBeenCalledTimes(1);

    const passedPropsToNavbar = extractNavbarSpyProps(navbarSpy);

    expect(passedPropsToNavbar.items).toHaveLength(0);
  });

  it("should pass items to Navbar component when user is authenticated", () => {  // Fixed test name
    renderLayout(true); // is authenticated = true

    expect(navbarSpy).toHaveBeenCalledTimes(1);

    const passedPropsToNavbar = extractNavbarSpyProps(navbarSpy);

    expect(passedPropsToNavbar.items).not.toHaveLength(0);
  });
});

const renderLayout = (isAuthenticated?: boolean): void => {
  renderWithAuth(
    <BrowserRouter>
      <Layout />
    </BrowserRouter>,
    {
      isAuthenticated: () => isAuthenticated,
    },
  );
};

const extractNavbarSpyProps = (navbarSpy: vi.Mock): any => {
  return navbarSpy.mock.calls[0][0];
};