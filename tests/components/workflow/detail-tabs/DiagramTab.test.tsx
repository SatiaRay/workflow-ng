import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";
import "@testing-library/jest-dom";
import DiagramTab from "@/components/workflow/detail-tabs/diagram-tab";
import { WorkflowDetailContext } from "@/context/workflow-detail-context";
import type { Workflow } from "@/types/workflow";

// Mock the WorkflowEditor component
vi.mock("@/components/workflow/diagram/workflow-editor", () => ({
  default: ({ onChange, workflowData }: any) => (
    <div data-testid="workflow-editor">
      <button 
        onClick={() => onChange({ nodes: [{ id: "new-node" }], edges: [] })}
        data-testid="mock-editor-change"
      >
        Mock Editor Change
      </button>
      <div data-testid="editor-data">{JSON.stringify(workflowData)}</div>
    </div>
  ),
}));

// Mock the Loader2 icon to have a test ID
vi.mock("lucide-react", () => ({
  Save: () => <div data-testid="save-icon">Save Icon</div>,
  Loader2: () => <div data-testid="save-loading-spinner">Loading...</div>,
  AlertCircle: () => <div>Alert Icon</div>
}));

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

describe("DiagramTab", () => {
  const mockSaveWorkflow = vi.fn();
  
  const renderDiagramTab = (
    workflow: Workflow = mockWorkflow,
    contextOverrides: Partial<typeof WorkflowDetailContext> = {}
  ) => {
    const defaultContext = {
      workflow,
      saveWorkflow: mockSaveWorkflow,
      isSaving: false,
      loading: false,
      error: null
    };

    return render(
      <MemoryRouter>
        <WorkflowDetailContext.Provider 
          value={{ ...defaultContext, ...contextOverrides }}
        >
          <Tabs defaultValue="diagram" value="diagram" onValueChange={() => {}}>
            <DiagramTab />
          </Tabs>
        </WorkflowDetailContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveWorkflow.mockResolvedValue(true);
  });

  it("should render the diagram tab with editor", () => {
    renderDiagramTab();

    expect(screen.getByText("نمودار گردش کار")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-editor")).toBeInTheDocument();
  });

  it("should not show save button when no changes", () => {
    renderDiagramTab();

    expect(screen.queryByRole("button", { name: /ذخیره تغییرات/i })).not.toBeInTheDocument();
  });

  it("should show save button when changes are made", async () => {
    const user = userEvent.setup();
    renderDiagramTab();

    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    expect(screen.getByRole("button", { name: /ذخیره تغییرات/i })).toBeInTheDocument();
    expect(screen.getByText("تغییرات ذخیره نشده وجود دارد")).toBeInTheDocument();
  });

  it("should call saveWorkflow when save button is clicked", async () => {
    const user = userEvent.setup();
    mockSaveWorkflow.mockResolvedValue(true);
    
    renderDiagramTab();

    // Make a change to show save button
    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    // Click save button
    const saveButton = screen.getByRole("button", { name: /ذخیره تغییرات/i });
    await act(async () => {
      await user.click(saveButton);
    });

    // Verify saveWorkflow was called with correct data
    expect(mockSaveWorkflow).toHaveBeenCalledTimes(1);
    expect(mockSaveWorkflow).toHaveBeenCalledWith({
      schema: { nodes: [{ id: "new-node" }], edges: [] }
    });
  });

  it("should show loading state on save button when saving", async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolveSave: (value: any) => void;
    const savePromise = new Promise(resolve => {
      resolveSave = resolve;
    });
    
    mockSaveWorkflow.mockImplementation(() => savePromise);
    
    // Render with isSaving=false initially
    const { rerender } = render(
      <MemoryRouter>
        <WorkflowDetailContext.Provider 
          value={{
            workflow: mockWorkflow,
            saveWorkflow: mockSaveWorkflow,
            isSaving: false,
            loading: false,
            error: null
          }}
        >
          <Tabs defaultValue="diagram" value="diagram" onValueChange={() => {}}>
            <DiagramTab />
          </Tabs>
        </WorkflowDetailContext.Provider>
      </MemoryRouter>
    );

    // Make a change to show save button
    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    // Click save button
    const saveButton = screen.getByRole("button", { name: /ذخیره تغییرات/i });
    await act(async () => {
      await user.click(saveButton);
    });

    // Now update the context to show saving state
    rerender(
      <MemoryRouter>
        <WorkflowDetailContext.Provider 
          value={{
            workflow: mockWorkflow,
            saveWorkflow: mockSaveWorkflow,
            isSaving: true, // Set to true to simulate saving
            loading: false,
            error: null
          }}
        >
          <Tabs defaultValue="diagram" value="diagram" onValueChange={() => {}}>
            <DiagramTab />
          </Tabs>
        </WorkflowDetailContext.Provider>
      </MemoryRouter>
    );

    // Check for loading spinner and disabled button
    await waitFor(() => {
      const updatedButton = screen.getByRole("button", { name: /ذخیره تغییرات/i });
      expect(updatedButton).toBeDisabled();
      expect(screen.getByTestId("save-loading-spinner")).toBeInTheDocument();
    });

    // Resolve the save promise to clean up
    resolveSave!(true);
  });

  it("should hide save button after successful save", async () => {
    const user = userEvent.setup();
    mockSaveWorkflow.mockResolvedValue(true);
    
    renderDiagramTab();

    // Make a change
    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    // Verify save button appears
    expect(screen.getByRole("button", { name: /ذخیره تغییرات/i })).toBeInTheDocument();

    // Click save
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /ذخیره تغییرات/i }));
    });

    // Wait for the save button to disappear (successful save)
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /ذخیره تغییرات/i })).not.toBeInTheDocument();
    });
    
    // Verify the unsaved changes message is gone
    expect(screen.queryByText("تغییرات ذخیره نشده وجود دارد")).not.toBeInTheDocument();
  });

  it("should show error alert when save fails", async () => {
    const user = userEvent.setup();
    
    // Mock console.error to avoid polluting test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock saveWorkflow to reject
    mockSaveWorkflow.mockRejectedValue(new Error("Network error"));
    
    renderDiagramTab();

    // Make a change
    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    // Click save
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /ذخیره تغییرات/i }));
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    
    // Clean up
    consoleSpy.mockRestore();
  });

  it("should keep save button visible when save fails", async () => {
    const user = userEvent.setup();
    
    // Mock saveWorkflow to reject
    mockSaveWorkflow.mockRejectedValue(new Error("Network error"));
    
    renderDiagramTab();

    // Make a change
    await act(async () => {
      await user.click(screen.getByTestId("mock-editor-change"));
    });

    // Click save
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /ذخیره تغییرات/i }));
    });

    // Wait for error
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    
    // Save button should still be visible (hasChanges is still true)
    expect(screen.getByRole("button", { name: /ذخیره تغییرات/i })).toBeInTheDocument();
    expect(screen.getByText("تغییرات ذخیره نشده وجود دارد")).toBeInTheDocument();
  });

  it("should pass workflow schema to editor", () => {
    renderDiagramTab();

    const editorData = screen.getByTestId("editor-data");
    expect(editorData).toHaveTextContent(JSON.stringify(mockWorkflow.schema));
  });
});