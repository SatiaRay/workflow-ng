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
import UsersIndex from "./routes/user";
import CreateUser from "./routes/user/create-user";
import RolesIndex from "./routes/role";
import WorkflowsIndex from "./routes/workflow";
import CreateWorkflow from "./routes/workflow/create-workflow";
import EditWorkflow from "./routes/workflow/edit-workflow";
import TaskIndex from "./routes/task";
import TaskDetail from "./routes/task/task-detail";
import WorkflowDetail from "./routes/workflow/workflow-detail";
import { ProtectedRoute } from "./lib/protected-route";

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
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <FormGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: "submit/:id",
        element: (
          <ProtectedRoute allowedRoles={["superadmin", 'user']}>
            <SubmitForm />
          </ProtectedRoute>
        ),
      },
      {
        index: true,
        path: "",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <FormList />
          </ProtectedRoute>
        ),
      },
      {
        path: "edit/:formId",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
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
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <ResponsesIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: ":formId/show/:responseId",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <ShowResponse />
          </ProtectedRoute>
        ),
      },
      {
        path: ":formId/edit/:responseId",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <EditResponse />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

const userRoutes = () => {
  return {
    path: "/users",
    element: <Layout />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <UsersIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: "create",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <CreateUser />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

const roleRoutes = () => {
  return {
    path: "/roles",
    element: <Layout />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <RolesIndex />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

const workflowRoutes = () => {
  return {
    path: "/workflows",
    element: <Layout />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <WorkflowsIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <WorkflowDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "create",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <CreateWorkflow />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id/edit",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <EditWorkflow />
          </ProtectedRoute>
        ),
      },
    ],
  };
};

const taskRoutes = () => {
  return {
    path: "/tasks",
    element: <Layout />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute allowedRoles={["superadmin", "user"]}>
            <TaskIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id",
        element: (
          <ProtectedRoute allowedRoles={["superadmin", "user"]}>
            <TaskDetail />
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
  workflowRoutes(),
  formResponseRoutes(),
  userRoutes(),
  roleRoutes(),
  taskRoutes(),
]);
