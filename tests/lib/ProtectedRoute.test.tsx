// tests/components/protected-route.test.tsx
import { vi, beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import { ProtectedRoute } from "../../src/lib/protected-route";
import { useAuth } from "../../src/context/auth-context";

// Mock the auth context
vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

// Mock Navigate component to test redirects
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: (props: any) => {
      mockNavigate(props);
      return <div data-testid="mock-navigate">Navigate to: {props.to}</div>;
    },
    useLocation: () => ({
      pathname: "/protected",
      search: "?foo=bar",
    }),
  };
});

// Test child component
const TestChild = () => <div data-testid="test-child">Protected Content</div>;

// Helper to render ProtectedRoute with different scenarios
const renderProtectedRoute = (
  {
    isAuthenticated = true,
    role = "user",
    loading = false,
    allowedRoles = [],
    initialPath = "/protected",
  }: {
    isAuthenticated?: boolean;
    role?: string;
    loading?: boolean;
    allowedRoles?: string[];
    initialPath?: string;
  } = {}
) => {
  // Setup auth mock
  (useAuth as any).mockReturnValue({
    isAuthenticated: () => isAuthenticated,
    role,
    loading,
  });

  // Parse the initial path to get pathname and search
  const url = new URL(`http://localhost${initialPath}`);
  
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path={url.pathname}
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <TestChild />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation for each test
    vi.mocked(useAuth).mockReset();
  });

  it("should show loading state when authentication is loading", () => {
    // act
    renderProtectedRoute({ loading: true });

    // assert
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByTestId("test-child")).not.toBeInTheDocument();
  });

  it("should render children when user is authenticated", () => {
    // act
    renderProtectedRoute({ isAuthenticated: true });

    // assert
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  describe("Role-Based Access Control", () => {
    it("should render children when user has required role", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: true,
        role: "admin",
        allowedRoles: ["admin", "superadmin"],
      });

      // assert
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should redirect to unauthorized when user does not have required role", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: true,
        role: "user",
        allowedRoles: ["admin", "superadmin"],
      });

      // assert
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/unauthorized",
          replace: true,
        })
      );
    });

    it("should render children when allowedRoles is empty (any authenticated user)", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: true,
        role: "user",
        allowedRoles: [],
      });

      // assert
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should allow multiple roles to access the same route", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: true,
        role: "editor",
        allowedRoles: ["admin", "editor", "reviewer"],
      });

      // assert
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined role gracefully", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: true,
        role: undefined,
        allowedRoles: ["admin"],
      });

      // assert
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/unauthorized",
          replace: true,
        })
      );
    });

    it("should prioritize authentication check before role check", () => {
      // act
      renderProtectedRoute({
        isAuthenticated: false,
        role: "admin",
        allowedRoles: ["admin"],
      });

      // assert
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.stringContaining("/login"),
        })
      );
    });

    it("should handle loading state even when authenticated", () => {
      // act
      renderProtectedRoute({
        loading: true,
        isAuthenticated: true,
        role: "admin",
      });

      // assert
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByTestId("test-child")).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});