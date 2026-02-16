import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { router } from "./router";
import { AuthProvider } from "@/context/auth-context";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
