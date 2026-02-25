import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Workflow, WorkflowStatus } from "../../../src/types/workflow";
import type { Form } from "../../../src/types/form";
import EditWorkflowInformationForm from "../../../src/components/workflow/edit-workflow-information-form";
import { it, expect, vi, describe } from "vitest";
import "@testing-library/jest-dom";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { supabaseService } from "../../../src/services/supabase.service";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    getForms: vi.fn(),
    getWorkflowForms: vi.fn(),
    updateWorkflow: vi.fn(),
  },
}));

const mockAllForms: Form[] = [
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

const mockTriggerForm: Form = mockAllForms[0];

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

const renderEditForm = (
  workflow: Workflow,
  onSave?: (workflow: Workflow) => void,
  onCancel?: () => void,
  forms: Form[] = mockAllForms,
): void => {
  render(
    <EditWorkflowInformationForm
      workflow={workflow}
      forms={forms}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
};

const findSelectionWithValue = (value: string | number): HTMLSelectElement => {
  return screen.getByRole("combobox", { name: `${value}` });
};

const findInputWithValue = (value: string) => {
  return screen.getByDisplayValue(value);
};

const findCancelButton = () => {
  return screen.getByRole("button", { name: "انصراف" });
};

const findElementByTestId = (testId: string) => {
  return screen.findByTestId(testId);
};

const clickCancelButton = async () => {
  const button = findCancelButton();

  if (!button) throw new Error("Cancel button not found in the document");

  await act(async () => {
    await userEvent.click(button);
  });
};

const findSaveButton = () => {
  return screen.getByRole("button", { name: "ذخیره" });
};

const clickSaveButton = async () => {
  const button = findSaveButton();

  if (!button) throw new Error("Save button not found in the document");

  await act(async () => {
    await userEvent.click(button);
  });
};

describe("Server trade-off Assertions", () => {
  it("should fetch associated forms to the workflow for fill select trigger form options", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(supabaseService.getWorkflowForms).toHaveBeenCalled();
  });

  it("should not fetch all forms for fill select trigger form options", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(supabaseService.getForms).not.toHaveBeenCalled();
  });
});

describe("Form Render Assertions", () => {
  it("should render input for edit workflow name", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(findInputWithValue(workflow.name)).toBeInTheDocument();
  });

  it("should render input for edit workflow description", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(findInputWithValue(workflow.description)).toBeInTheDocument();
  });

  it("should render selection for edit workflow trigger form", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(
      findSelectionWithValue(workflow.trigger_form.id),
    ).toBeInTheDocument();
  });

  it("should render selection for edit workflow status", () => {
    // arrange
    const workflow = workflowFactory();

    // act
    renderEditForm(workflow);

    // assert
    expect(findSelectionWithValue(workflow.status)).toBeInTheDocument();
  });
});

describe("Form Action Assertions", () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  const changeInputValue = async (input: HTMLElement, value: string) => {
    await user.clear(input);
    await user.type(input, value);
  };

  it("should call onCancel property on click cancel button", async () => {
    // arrange
    const workflow = workflowFactory();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    (supabaseService.getWorkflowForms as any).mockResolvedValue(mockAllForms);

    // act
    renderEditForm(workflow, onSave, onCancel);
    await clickCancelButton();

    // assert
    expect(onCancel).toBeCalled();
  });

  it("should evolve modified workflow's name on click save button", async () => {
    // arrange
    const workflow = workflowFactory();
    const onSave = vi.fn();

    // act
    renderEditForm(workflow, onSave);
    const nameInput = findInputWithValue(workflow.name);
    await changeInputValue(nameInput, "testing name modification action");
    await clickSaveButton();

    // assert
    expect(onSave).toBeCalledWith({
      ...workflow,
      name: "testing name modification action",
    });
  });

  it("should submit modification on click save button", async () => {
    // arrange
    const workflow = workflowFactory();
    const onSave = vi.fn();

    // act
    renderEditForm(workflow, onSave);
    const nameInput = findInputWithValue(workflow.name);
    await changeInputValue(nameInput, "testing name modification action");
    await clickSaveButton();

    // assert
    await waitFor(() => {
      expect(supabaseService.updateWorkflow).toHaveBeenCalledWith(workflow.id, {
        ...workflow,
        name: "testing name modification action",
      });
    });
  });

  it("should evolve modified workflow's description on click save button", async () => {
    // arrange
    const workflow = workflowFactory();
    const onSave = vi.fn();

    // act
    renderEditForm(workflow, onSave);
    const descriptionInput = findInputWithValue(workflow.description ?? "");
    await changeInputValue(
      descriptionInput,
      "testing description modification action",
    );
    await clickSaveButton();

    // assert
    expect(onSave).toBeCalledWith({
      ...workflow,
      description: "testing description modification action",
    });
  });
});
