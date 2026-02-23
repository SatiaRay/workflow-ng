import { render, screen, waitFor } from "@testing-library/react";
import type { Workflow, WorkflowStatus } from "../../../../src/types/workflow";
import type { Form } from "../../../../src/types/form";
import FormsTab from "../../../../src/components/workflow/detail-tabs/forms-tab";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { supabaseService } from "../../../../src/services/supabase.service";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    getWorkflowForms: vi.fn(),
    deleteForm: vi.fn(),
    getForms: vi.fn(),
  },
}));

const mockWorkflowForms: Form[] = [
  {
    id: 1,
    title: "Trigger Form",
    description: "Form for triggering workflow",
    schema: {},
    created_at: "2026-02-20T10:00:00.000Z",
    updated_at: "2026-02-20T10:00:00.000Z",
    nodeId: "trigger-node-1",
  },
  {
    id: 2,
    title: "Trigger Form 2",
    description: "Form for triggering workflow 2",
    schema: {},
    created_at: "2026-02-20T10:00:00.000Z",
    updated_at: "2026-02-20T10:00:00.000Z",
    nodeId: "trigger-node-2",
  },
];

const mockTriggerForm: Form = mockWorkflowForms[0];

const mockWorkflow: Workflow = {
  id: 1,
  name: "Test Workflow",
  description: "Workflow for mock and test",
  schema: {
    edges: [],
    nodes: [],
  },
  trigger_form: mockTriggerForm,
  status: "active",
  active_instances: 0,
  completed_instances: 0,
  created_by: "admin@example.com",
  created_at: "2026-02-20T10:00:00.000Z",
  updated_at: "2026-02-20T10:00:00.000Z",
};

const workflowFactory = (status: WorkflowStatus = "active"): Workflow => {
  return {
    ...mockWorkflow,
    status,
  };
};

const renderFormsTab = (workflow: Workflow): void => {
  render(
    <MemoryRouter>
      <FormsTab workflow={workflow} />
    </MemoryRouter>,
  );
};

const findLinkByName = (name: string) => {
  return screen.getByRole("link", { name: name });
};

const findLinkByHref = (href: string) => {
  const links = screen.getAllByRole("link");
  return links.find((link) => link.getAttribute("href") === href);
};

const findButtonsByName = (name: string): HTMLButtonElement[] => {
  return screen.getAllByRole("button", { name: name });
};

const findButtonByName = (name: string): HTMLButtonElement => {
  return screen.getByRole("button", { name: name });
};

const clickButton = async (button: HTMLButtonElement) => {
  await act(async () => {
    await userEvent.click(button);
  });
};

describe("FormsTab Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display link to create new form for the workflow", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderFormsTab(workflow);

    // assert
    const createNewFormLink = findLinkByName("ایجاد فرم جدید");
    expect(createNewFormLink).toBeInTheDocument();
  });

  it("should set correct href for create new form link", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderFormsTab(workflow);

    // assert
    const createNewFormLink = findLinkByName("ایجاد فرم جدید");
    expect(createNewFormLink).toHaveAttribute(
      "href",
      `/form/generator?workflow=${workflow.id}`,
    );
  });

  it("should inquire workflow forms from supabase service", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderFormsTab(workflow);

    // assert
    expect(supabaseService.getWorkflowForms).toHaveBeenCalled();
  });

  it("should not inquire all forms without workflow scope", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderFormsTab(workflow);

    // assert
    expect(supabaseService.getForms).not.toHaveBeenCalledOnce();
  });

  it("should render workflow's forms list", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);

    // assert
    await waitFor(() => {
      forms.forEach((form) => {
        expect(screen.getByText(form.title)).toBeInTheDocument();
      });
    });
  });

  it("should display edit workflow's form link", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);

    // assert
    await waitFor(() => {
      forms.forEach((form) => {
        const link = findLinkByHref(`/form/edit/${form.id}`);
        expect(link).toBeInTheDocument();
      });
    });
  });

  it("should display delete workflow's form button", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);

    // assert
    await waitFor(() => {
      const deleteButtons = findButtonsByName("حذف");
      expect(deleteButtons).toHaveLength(forms.length);
    });
  });

  it("should display delete workflow form confirmation dialog on click delete button", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);
    await waitFor(async () => {
      const deleteButtons = findButtonsByName("حذف");
      await clickButton(deleteButtons[0]);
    });

    // assert
    await waitFor(async () => {
      expect(
        await screen.findByRole("heading", {
          name: `آیا از حذف فرم "${forms[0].title}" مطمئن هستید؟`,
        }),
      ).toBeInTheDocument();
    });
  });

  it("should close dialog after confirm", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);
    (supabaseService.deleteForm as any).mockResolvedValue({});

    // act
    renderFormsTab(workflow);
    const deleteButtons: HTMLButtonElement[] = await screen.findAllByRole(
      "button",
      {
        name: "حذف",
      },
    );
    await clickButton(deleteButtons[0]);
    const confirmBtn: HTMLButtonElement = await screen.findByRole("button", {
      name: "بله، حذف شود",
    });
    await clickButton(confirmBtn);

    // assert
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: `آیا از حذف فرم "${forms[0].title}" مطمئن هستید؟`,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("should call delete form after approve delete workflow's form confirmation", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);
    const deleteButtons: HTMLButtonElement[] = await screen.findAllByRole(
      "button",
      {
        name: "حذف",
      },
    );
    await clickButton(deleteButtons[0]);
    const confirmBtn: HTMLButtonElement = await screen.findByRole("button", {
      name: "بله، حذف شود",
    });
    await clickButton(confirmBtn);

    // assert
    expect(supabaseService.deleteForm).toBeCalledWith(forms[0].id);
  });

  it("should remove deleted form after delete", async () => {
    // arrange
    const workflow = workflowFactory();
    const forms = mockWorkflowForms;
    (supabaseService.getWorkflowForms as any).mockResolvedValue(forms);

    // act
    renderFormsTab(workflow);
    const deleteButtons: HTMLButtonElement[] = await screen.findAllByRole(
      "button",
      {
        name: "حذف",
      },
    );
    await clickButton(deleteButtons[0]);
    const confirmBtn: HTMLButtonElement = await screen.findByRole("button", {
      name: "بله، حذف شود",
    });
    await clickButton(confirmBtn);

    // assert
    await waitFor(() => {
      expect(screen.queryByText(forms[0].title)).not.toBeInTheDocument();
    });
  });
});