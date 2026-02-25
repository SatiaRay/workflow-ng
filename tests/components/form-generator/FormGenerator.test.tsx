import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import DiagramTab from "../../../src/components/workflow/detail-tabs/diagram-tab";
import FromGenerator from "../../../src/components/form-generator/form-generator";
import { WorkflowDetailContext } from "../../../src/context/workflow-detail-context";
import type { Workflow } from "../../../src/types/workflow";
import FormGenerator from "../../../src/components/form-generator/form-generator";
import { supabaseService } from "../../../src/services/supabase.service";
import { Form } from "../../../src/types/form";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    createForm: vi.fn(),
    associateFormToWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
  },
}));


const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockForm: Form = {
  id: 1,
  title: "Trigger Form",
  description: "Form for triggering workflow",
  schema: {},
  created_at: "2026-02-20T10:00:00.000Z",
  updated_at: "2026-02-20T10:00:00.000Z",
  nodeId: "trigger-node-1",
};

export const renderFormGenerator = (
  params: Record<string, string> = {},
  path: string = "/",
) => {
  const searchParams = new URLSearchParams(params).toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  return render(
    <MemoryRouter initialEntries={[fullPath]}>
      <FormGenerator />
    </MemoryRouter>,
  );
};

const findSaveButton = async () => {
  return screen.getByRole("button", { name: "ذخیره در پایگاه داده" });
};

const clickSaveButton = async () => {
  await act(async () => {
    await userEvent.click(await findSaveButton());
  });
};

describe("Render Tests", () => {
  it("should render save button", async () => {
    // act
    renderFormGenerator();

    // assert
    await waitFor(async () => {
      const saveButton = await findSaveButton();
      expect(saveButton).toBeInTheDocument();
    });
  });
});

describe("Server Interactions Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear()
  });

  it("should call create form service", async () => {
    // act
    renderFormGenerator();
    await clickSaveButton();

    // assert
    expect(supabaseService.createForm).toHaveBeenCalledOnce();
  });

  it("should associate created form to workflow when the workflow search param is present in the url", async () => {
    // arrange
    (supabaseService.createForm as any).mockResolvedValue(mockForm);

    // act
    renderFormGenerator({ workflow: "1" });
    await clickSaveButton();

    // assert
    expect(supabaseService.associateFormToWorkflow).toHaveBeenCalledWith(
      "1",
      mockForm,
    );
  });

  it("should set workflow trigger form id when workflow and type_trigger_form are present in the url", async () => {
    // arrange
    (supabaseService.createForm as any).mockResolvedValue(mockForm);

    // act
    renderFormGenerator({ workflow: "1", type_trigger_form: "true" });
    await clickSaveButton();

    // assert
    expect(supabaseService.updateWorkflow).toHaveBeenCalledWith("1", {
      trigger_form: {
        id: mockForm.id
      },
    });
  });

  it("should not set workflow trigger form id when workflow search param is peresent but type_trigger_form is absent in the url", async () => {
    // arrange
    (supabaseService.createForm as any).mockResolvedValue(mockForm);

    // act
    renderFormGenerator({ workflow: "1" });
    await clickSaveButton();

    // assert
    expect(supabaseService.updateWorkflow).not.toHaveBeenCalled();
  });

  it("should navigate to workflow detail page when workflow search param is present in the url", async () => {
    // arrange
    (supabaseService.createForm as any).mockResolvedValue(mockForm);

    // act
    renderFormGenerator({ workflow: "1" });
    await clickSaveButton();

    // assert
    expect(mockNavigate).toHaveBeenCalledWith(`/workflows/1`)
  });
});
