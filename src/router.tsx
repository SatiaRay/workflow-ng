// In your router configuration file
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import HomePage from "./routes/home";
import AboutPage from "./routes/about";
import ServicesPage from "./routes/services";
import NotFoundPage from "./routes/not-found";
import FormGenerator from "./routes/form/form-generator";
import FormList from "./routes/form/form-list";
import SubmitForm from "./routes/form/submit-form";
import EditForm from "./routes/form/edit-form";
import ResponsesIndex from "./routes/response/responses-index";
import EditResponse from "./routes/response/edit-response";
import ShowResponse from "./routes/response/show-response";
import LoginPage from "./routes/login";
import ProtectedRoute from "./components/protected-route";

const brandingRoutes = () => {
  return {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "services",
        element: <ServicesPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  };
};

const authRoutes = () => {
  return {
    path: "/auth",
    element: <Layout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  };
};

const formRoutes = () => {
  return {
    path: "/form",
    element: <Layout />,
    children: [
      {
        path: "generator",
        element: (
          <ProtectedRoute>
            <FormGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: "submit/:id",
        element: (
          <ProtectedRoute>
            <SubmitForm />
          </ProtectedRoute>
        ),
      },
      {
        index: true,
        path: "",
        element: (
          <ProtectedRoute>
            <FormList />
          </ProtectedRoute>
        ),
      },
      {
        path: "edit/:formId",
        element: (
          <ProtectedRoute>
            <EditForm />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

const formResponseRoutes = () => {
  return {
    path: "/responses",
    element: <Layout />,
    children: [
      {
        path: ":formId",
        element: (
          <ProtectedRoute>
            <ResponsesIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: ":formId/show/:responseId",
        element: (
          <ProtectedRoute>
            <ShowResponse />
          </ProtectedRoute>
        ),
      },
      {
        path: ":formId/edit/:responseId",
        element: (
          <ProtectedRoute>
            <EditResponse />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

export const router = createBrowserRouter([
  brandingRoutes(),
  authRoutes(),
  formRoutes(),
  formResponseRoutes()
]);