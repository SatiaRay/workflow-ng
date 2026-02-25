import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, redirect } from "react-router-dom";
import "@testing-library/jest-dom";
import CreateNewTaskDialog from "../../../src/components/task/create-new-task-dialog";
import { supabaseService } from "../../../src/services/supabase.service";
import { Form } from "../../../src/types/form";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    getTriggerForms: vi.fn(),
    getForms: vi.fn(),
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

const mockTriggerForms: Form[] = [
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

export const renderCreateNewTaskDialog = (
  params: Record<string, string> = {},
  path: string = "/",
) => {
  const searchParams = new URLSearchParams(params).toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  return render(
    <MemoryRouter initialEntries={[fullPath]}>
      <CreateNewTaskDialog />
    </MemoryRouter>,
  );
};

const findTriggerButton = () => {
  return screen.getByRole("button", { name: "ثبت درخواست جدید" });
};

const clickOnTriggerButton = async () => {
  const trigger = findTriggerButton();

  await act(async () => {
    await userEvent.click(trigger);
  });
};

const findTaskTypeItem = (form: Form) => {
  return screen.getByRole("link", { name: form.title });
};

const clickOnTaskTypeItem = async (form: Form) => {
  const item = findTaskTypeItem(form);

  await act(async () => {
    await userEvent.click(item);
  });
};

describe("Render Tests", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("should render dialog trigger in close state", async () => {
    // act
    renderCreateNewTaskDialog();

    // assert
    const trigger = findTriggerButton();
    expect(trigger).toBeInTheDocument();
  });

  it("should not appear dialog before click on trigger", () => {
    // act
    renderCreateNewTaskDialog();

    // assert
    expect(
      screen.queryByText("لطفا نوع درخواست جدید را انتخاب کنید"),
    ).not.toBeInTheDocument();
  });

  it("should appear dialog after click on trigger", async () => {
    // act
    renderCreateNewTaskDialog();
    await clickOnTriggerButton();

    // assert
    await waitFor(() => {
      expect(
        screen.getByText("لطفا نوع درخواست جدید را انتخاب کنید"),
      ).toBeInTheDocument();
    });
  });

  it("should render title", async () => {
    // act
    renderCreateNewTaskDialog();

    // assert
    expect(screen.getByText("ثبت درخواست جدید")).toBeInTheDocument();
  });

  it("should render forms list", async () => {
    // arrange
    (supabaseService.getTriggerForms as any).mockResolvedValue(
      mockTriggerForms,
    );

    // act
    renderCreateNewTaskDialog();
    await clickOnTriggerButton();

    // assert
    mockTriggerForms.forEach(async (form) => {
      const title = screen.getByText(form.title);

      await waitFor(() => {
        expect(title).toBeInTheDocument();
      });
    });
  });

  it("should have correct link with redirect /tasks when redirect param exists", async () => {
    // arrange
    (supabaseService.getTriggerForms as any).mockResolvedValue(
      mockTriggerForms,
    );

    // act
    renderCreateNewTaskDialog({ redirect: "/tasks" });
    await clickOnTriggerButton();

    // Wait for forms to load
    await waitFor(() => {
      expect(screen.getByText(mockTriggerForms[0].title)).toBeInTheDocument();
    });

    // assert
    const targetForm = mockTriggerForms[0];
    const formLink = screen.getByRole("link", { name: targetForm.title });

    expect(formLink).toHaveAttribute(
      "href",
      `/form/submit/${targetForm.id}?redirect=/tasks`,
    );
  });
});

describe("Server Interaction Tests", () => {
  it("should fetch list of forms where belongs to a workflow", () => {
    // act
    renderCreateNewTaskDialog();

    // assert
    expect(supabaseService.getTriggerForms).toHaveBeenCalled();
  });

  it("should not fetch list of all forms that aren't belongs to a workflow", async () => {
    // act
    renderCreateNewTaskDialog();

    // assert
    expect(supabaseService.getForms).not.toHaveBeenCalled();
  });
});
