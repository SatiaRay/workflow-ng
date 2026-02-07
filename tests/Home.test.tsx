import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HomePage from "../src/routes/home";
import { AuthProvider } from "@/context/auth-context";

describe("HomePage tests", () => {
  it("should render app title", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>,
    );

    const appTitle = screen.getByText("گردش کار ساتیا");
    expect(appTitle).toBeInTheDocument();
  });
});
