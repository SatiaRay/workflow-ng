// tests/context/WorkflowDetailContext.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WorkflowDetailProvider, useWorkflowDetail } from "@/context/workflow-detail-context";
import type { Workflow } from "@/types/workflow";

// Mock modules — define vi.fn() directly inside factories
vi.mock("@/services/supabase", () => ({
  supabaseService: {
    updateWorkflow: vi.fn(),
    toggleWorkflowStatus: vi.fn(),
    deleteWorkflow: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Now safe to import — these will be the mocked versions
import { supabaseService } from "@/services/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Mock workflow data
const mockWorkflow: Workflow = {
  id: 1,
  name: "Test Workflow",
  description: "Test Description",
  schema: { nodes: [], edges: [] },
  trigger_form_id: 123,
  status: "draft",
  active_instances: 5,
  completed_instances: 10,
  created_by: "user-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  form: {
    id: 123,
    title: "Test Form",
  },
};

// Test component that uses the context
function TestComponent() {
  const {
    workflow,
    saveWorkflow,
    toggleWorkflowStatus,
    deleteWorkflow,
    isSaving,
  } = useWorkflowDetail();

  return (
    <div>
      <div data-testid="workflow-name">{workflow.name}</div>
      <div data-testid="workflow-status">{workflow.status}</div>
      <div data-testid="is-saving">{isSaving ? "saving" : "not-saving"}</div>

      <button
        onClick={() => saveWorkflow({ name: "Updated Name" })}
        data-testid="save-button"
      >
        Save
      </button>

      <button onClick={toggleWorkflowStatus} data-testid="toggle-button">
        Toggle Status
      </button>

      <button onClick={deleteWorkflow} data-testid="delete-button">
        Delete
      </button>
    </div>
  );
}

describe("WorkflowDetailContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (workflow: Workflow = mockWorkflow) => {
    return render(
      <MemoryRouter>
        <WorkflowDetailProvider workflow={workflow}>
          <TestComponent />
        </WorkflowDetailProvider>
      </MemoryRouter>
    );
  };

  it("should provide workflow data to children", () => {
    renderWithProvider();
    expect(screen.getByTestId("workflow-name")).toHaveTextContent("Test Workflow");
    expect(screen.getByTestId("workflow-status")).toHaveTextContent("draft");
  });

  describe("saveWorkflow", () => {
    it("should successfully save workflow updates", async () => {
      const user = userEvent.setup();
      const updatedWorkflow = { ...mockWorkflow, name: "Updated Name" };

      supabaseService.updateWorkflow.mockResolvedValueOnce(updatedWorkflow);

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("save-button"));
      });

      await waitFor(() => {
        expect(supabaseService.updateWorkflow).toHaveBeenCalledWith(1, {
          name: "Updated Name",
        });
      });

      expect(screen.getByTestId("workflow-name")).toHaveTextContent("Updated Name");
      expect(toast.success).toHaveBeenCalledWith("تغییرات با موفقیت ذخیره شد");
    });

    it("should handle save error gracefully", async () => {
      const user = userEvent.setup();
      const errorMessage = "Network error";

      supabaseService.updateWorkflow.mockRejectedValueOnce(new Error(errorMessage));

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("save-button"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(`ذخیره تغییرات ناموفق بود: ${errorMessage}`);
      });
    });

    it("should show saving state while updating", async () => {
      const user = userEvent.setup();

      let resolvePromise: (value: any) => void;
      const pending = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      supabaseService.updateWorkflow.mockReturnValueOnce(pending as any);

      renderWithProvider();

      let savePromise: Promise<void>;

      await act(async () => {
        savePromise = user.click(screen.getByTestId("save-button"));
      });

      expect(screen.getByTestId("is-saving")).toHaveTextContent("saving");

      await act(async () => {
        resolvePromise({ ...mockWorkflow, name: "Updated Name" });
        await savePromise;
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-saving")).toHaveTextContent("not-saving");
      });
    });
  });

  describe("toggleWorkflowStatus", () => {
    it("should toggle workflow status successfully", async () => {
      const user = userEvent.setup();
      const toggledWorkflow = { ...mockWorkflow, status: "active" as const };

      supabaseService.toggleWorkflowStatus.mockResolvedValueOnce(toggledWorkflow);

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("toggle-button"));
      });

      await waitFor(() => {
        expect(supabaseService.toggleWorkflowStatus).toHaveBeenCalledWith(mockWorkflow);
      });

      expect(screen.getByTestId("workflow-status")).toHaveTextContent("active");
    });

    it("should handle toggle error gracefully", async () => {
      const user = userEvent.setup();

      supabaseService.toggleWorkflowStatus.mockRejectedValueOnce(new Error("Network error"));

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("toggle-button"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("workflow-status")).toHaveTextContent("draft");
      });
    });
  });

  describe("deleteWorkflow", () => {
    it("should delete workflow and navigate to workflows list", async () => {
      const user = userEvent.setup();

      supabaseService.deleteWorkflow.mockResolvedValueOnce(undefined);

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("delete-button"));
      });

      await waitFor(() => {
        expect(supabaseService.deleteWorkflow).toHaveBeenCalledWith(1);
      });

      expect(toast.success).toHaveBeenCalledWith("گردش‌کار با موفقیت حذف شد");
      expect(useNavigate).toHaveBeenCalledWith("/workflows");
    });

    it("should handle delete error gracefully", async () => {
      const user = userEvent.setup();
      const errorMessage = "Network error";

      supabaseService.deleteWorkflow.mockRejectedValueOnce(new Error(errorMessage));

      renderWithProvider();

      await act(async () => {
        await user.click(screen.getByTestId("delete-button"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(`حذف گردش‌کار ناموفق بود: ${errorMessage}`);
      });

      expect(useNavigate).not.toHaveBeenCalled();
    });
  });
});