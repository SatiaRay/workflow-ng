// tests/components/workflow/information-tab.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { InformationTab } from "../../../../src/components/workflow/detail-tabs/information-tab";
import { WorkflowDetailProvider } from "../../../../src/context/workflow-detail-context";
import { supabaseService } from "../../../../src/services/supabase.service";
import type { Workflow } from "../../../../src/types/workflow";
import { User } from "../../../../src/services/supabase/user-services";
import { Tabs } from "../../../../src/components/ui/tabs";

// Mock the supabase service
vi.mock("@/services/supabase.service", () => ({
  supabaseService: {
    users: {
      getProfiles: vi.fn(),
    },
    forms: {
      getForms: vi.fn(),
    },
    updateWorkflow: vi.fn(),
  },
}));

// Mock the formatDateTime utility
vi.mock("@/lib/utils", () => ({
  formatDateTime: (date: string) => date,
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
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

const mockUsers: User[] = [
  {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-456",
    name: "Jane Smith",
    email: "jane@example.com",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockForms = [
  { id: 123, title: "Test Form" },
  { id: 456, title: "Another Form" },
];

describe("InformationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabaseService.users.getProfiles).mockResolvedValue({
      data: mockUsers,
      total: mockUsers.length,
      page: 1,
      pageSize: 100,
    });

    vi.mocked(supabaseService.forms.getForms).mockResolvedValue(mockForms);
  });

  const renderInformationTab = (workflow: Workflow = mockWorkflow) => {
    return render(
      <MemoryRouter>
        <WorkflowDetailProvider workflow={workflow}>
          <Tabs
            defaultValue="information"
            value="information"
            onValueChange={() => {}}
          >
            <InformationTab />
          </Tabs>
        </WorkflowDetailProvider>
      </MemoryRouter>,
    );
  };

  describe("Initial Render", () => {
    it("should render workflow information correctly", async () => {
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("اطلاعات پایه")).toBeInTheDocument();
        expect(screen.getByText("Test Workflow")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Test Form")).toBeInTheDocument();
        expect(screen.getByText("شناسه: 123")).toBeInTheDocument();
      });
    });

    it("should show edit button when not in edit mode", async () => {
      renderInformationTab();

      await waitFor(() => {
        const editButton = screen.getByRole("button", { name: /ویرایش/i });
        expect(editButton).toBeInTheDocument();
      });
    });

    it("should display created by information with user avatar", async () => {
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        const avatar = screen.getByText("JD");
        expect(avatar).toBeInTheDocument();
      });
    });

    it("should display dates correctly", async () => {
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("2024-01-01T00:00:00Z")).toBeInTheDocument();
        expect(screen.getByText("2024-01-02T00:00:00Z")).toBeInTheDocument();
      });
    });

    it("should handle missing description", async () => {
      const workflowWithoutDesc = { ...mockWorkflow, description: undefined };
      renderInformationTab(workflowWithoutDesc);

      await waitFor(() => {
        expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
      });
    });

    it("should handle missing form title", async () => {
      const workflowWithoutForm = {
        ...mockWorkflow,
        form: { id: 123, title: undefined as any },
      };
      renderInformationTab(workflowWithoutForm);

      await waitFor(() => {
        expect(screen.getByText("فرم نامشخص")).toBeInTheDocument();
      });
    });

    it("should display status badge correctly", async () => {
      renderInformationTab();

      await waitFor(() => {
        const statusBadge = screen.getByText("پیش‌نویس");
        expect(statusBadge).toBeInTheDocument();
      });
    });
  });

  describe("Edit Mode", () => {
    it("should enter edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
        expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /ذخیره/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /انصراف/i })).toBeInTheDocument();
      });
    });

    it("should allow editing name field", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Workflow");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Workflow");

      expect(nameInput).toHaveValue("Updated Workflow");
    });

    it("should allow editing description field", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
      });

      const descriptionInput = screen.getByDisplayValue("Test Description");
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "Updated Description");

      expect(descriptionInput).toHaveValue("Updated Description");
    });

    it("should allow editing status field", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
      });

      const statusSelect = screen.getAllByRole("combobox")[0];
      await user.click(statusSelect);

      const activeOption = await screen.findByText("فعال");
      await user.click(activeOption);

      expect(screen.getByText("فعال")).toBeInTheDocument();
    });

    it("should allow editing trigger form", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);
      });

      const selects = screen.getAllByRole("combobox");
      const triggerFormSelect = selects[1];

      await user.click(triggerFormSelect);

      const formOption = await screen.findByText("Another Form");
      await user.click(formOption);

      expect(screen.getByText("Another Form")).toBeInTheDocument();
    });

    it("should cancel edit mode without saving", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Workflow");
      await user.clear(nameInput);
      await user.type(nameInput, "Changed Value");

      await user.click(screen.getByRole("button", { name: /انصراف/i }));

      expect(screen.getByText("Test Workflow")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Changed Value")).not.toBeInTheDocument();
    });

    it("should validate empty name before saving", async () => {
      const user = userEvent.setup();
      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Workflow");
      await user.clear(nameInput);

      await user.click(screen.getByRole("button", { name: /ذخیره/i }));

      await waitFor(() => {
        expect(
          screen.getByText("نام گردش کار نمی‌تواند خالی باشد")
        ).toBeInTheDocument();
      });

      expect(vi.mocked(supabaseService.updateWorkflow)).not.toHaveBeenCalled();
    });
  });

  describe("Save Functionality", () => {
    it("should save changes successfully", async () => {
      const user = userEvent.setup();
      const updatedWorkflow = {
        ...mockWorkflow,
        name: "Updated Workflow",
        description: "Updated Description",
        status: "active" as const,
        trigger_form_id: 456,
      };

      vi.mocked(supabaseService.updateWorkflow).mockResolvedValue(updatedWorkflow);

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Workflow");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Workflow");

      const descriptionInput = screen.getByDisplayValue("Test Description");
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "Updated Description");

      const statusSelect = screen.getAllByRole("combobox")[0];
      await user.click(statusSelect);
      const activeOption = await screen.findByText("فعال");
      await user.click(activeOption);

      const formSelect = screen.getAllByRole("combobox")[1];
      await user.click(formSelect);
      const formOption = await screen.findByText("Another Form");
      await user.click(formOption);

      await user.click(screen.getByRole("button", { name: /ذخیره/i }));

      await waitFor(() => {
        expect(supabaseService.updateWorkflow).toHaveBeenCalledWith(1, {
          name: "Updated Workflow",
          description: "Updated Description",
          trigger_form_id: 456,
          status: "active",
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Updated Workflow")).toBeInTheDocument();
      });
      
      expect(screen.getByText("فعال")).toBeInTheDocument();
    });

    it("should handle save error gracefully", async () => {
      const user = userEvent.setup();
      const errorMessage = "Network error";
      
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(supabaseService.updateWorkflow).mockRejectedValue(
        new Error(errorMessage),
      );

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /ویرایش/i }));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /ذخیره/i }));
      });

      await waitFor(() => {
        expect(
          screen.getByText(`ذخیره تغییرات ناموفق بود: ${errorMessage}`)
        ).toBeInTheDocument();
      });

      // Verify that console.error was called (optional)
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it("should show loading state while saving", async () => {
      const user = userEvent.setup();

      vi.mocked(supabaseService.updateWorkflow).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /ویرایش/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Workflow")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /ذخیره/i }));

      const saveButton = screen.getByRole("button", { name: /ذخیره/i });
      const cancelButton = screen.getByRole("button", { name: /انصراف/i });
      
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(saveButton.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("User Information", () => {
    it("should display system as creator when created_by is undefined", async () => {
      const workflowWithoutCreator = { ...mockWorkflow, created_by: undefined };

      vi.mocked(supabaseService.users.getProfiles).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 100,
      });

      renderInformationTab(workflowWithoutCreator);

      await waitFor(() => {
        expect(screen.getByText("سیستم")).toBeInTheDocument();
      });
    });

    it("should display email when user has no name", async () => {
      const usersWithoutName = [
        {
          id: "user-123",
          email: "john@example.com",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(supabaseService.users.getProfiles).mockResolvedValue({
        data: usersWithoutName,
        total: usersWithoutName.length,
        page: 1,
        pageSize: 100,
      });

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("should use user id as fallback when no profile data", async () => {
      vi.mocked(supabaseService.users.getProfiles).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 100,
      });

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("user-123")).toBeInTheDocument();
      });
    });
  });

  describe("Form Loading", () => {
    it("should handle empty forms list", async () => {
      vi.mocked(supabaseService.forms.getForms).mockResolvedValue([]);

      renderInformationTab();

      await waitFor(() => {
        expect(screen.getByText("Test Form")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /ویرایش/i }));

      await waitFor(() => {
        expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);
      });

      const select = screen.getAllByRole("combobox")[1];
      await user.click(select);

      expect(screen.queryByText("Another Form")).not.toBeInTheDocument();
    });

    it("should handle form fetch error gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(supabaseService.forms.getForms).mockRejectedValue(
        new Error("Failed to fetch"),
      );

      renderInformationTab();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});