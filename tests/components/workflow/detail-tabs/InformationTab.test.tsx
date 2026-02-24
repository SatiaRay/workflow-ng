import { render, screen, waitFor } from "@testing-library/react";
import type { Workflow, WorkflowStatus } from "../../../../src/types/workflow";
import type { Form } from "../../../../src/types/form";
import { InformationTab } from "../../../../src/components/workflow/detail-tabs/information-tab";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { supabaseService } from "../../../../src/services/supabase.service";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    updateWorkflow: vi.fn(),
    getWorkflowForms: vi.fn()
  },
}));

(supabaseService.getWorkflowForms as any).mockResolvedValue([
  {
    id: "1",
    title: "Form 1", // This is what the component expects
    name: "Form 1", // Include both if needed
    fields: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Form 2",
    name: "Form 2",
    fields: [],
    created_at: new Date().toISOString(),
  },
]);

const mockTriggerForm: Form = {
  id: 12,
  title: "Trigger Form",
  description: "Form for triggering workflow",
  schema: {},
  created_at: "2026-02-20T10:00:00.000Z",
  updated_at: "2026-02-20T10:00:00.000Z",
  nodeId: "trigger-node-1",
};

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

const renderInformationTab = (workflow: Workflow): void => {
  render(
    <MemoryRouter>
      <InformationTab workflow={workflow} />
    </MemoryRouter>,
  );
};

const findEditButton = (): HTMLElement | null => {
  return screen.getByRole("button", { name: "ویرایش" });
};

const clickEditButton = async () => {
  const button = findEditButton();

  if (button)
    await act(async () => {
      await userEvent.click(button);
    });
  else throw new Error("Edit button not in the document");
};

const findCancelEditButton = (): HTMLElement | null => {
  return screen.getByRole("button", { name: "انصراف" });
};

const clickCancelEditButton = async () => {
  const button = findCancelEditButton();

  if (button)
    await act(async () => {
      await userEvent.click(button);
    });
  else throw new Error("Cancel edit button not in the document");
};

const findSaveButton = (): HTMLElement | null => {
  return screen.getByRole("button", { name: "ذخیره" });
};

const clickSaveButton = async () => {
  const button = findSaveButton();

  if (button)
    await act(async () => {
      await userEvent.click(button);
    });
  else throw new Error("Save button not in the document");
};

const findLinkByName = (name: string) => {
  return screen.getByRole("link", { name: name });
};

const findLinkByHref = (href: string) => {
  const links = screen.getAllByRole("link");
  return links.find((link) => link.getAttribute("href") === href);
};

it("should render workflow name", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);

  // assert
  expect(screen.getByText(workflow.name)).toBeInTheDocument();
});

it("should render workflow description", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);

  // assert
  expect(workflow.description).toBeTruthy();
  expect(screen.getByText(workflow.description ?? "")).toBeInTheDocument();
});

it("should render workflow active status", () => {
  // arrange
  const workflow = workflowFactory("active");

  // act
  renderInformationTab(workflow);

  // assert
  expect(screen.getByText("فعال")).toBeInTheDocument();
});

it("should render workflow inactive status", () => {
  // arrange
  const workflow = workflowFactory("inactive");

  // act
  renderInformationTab(workflow);

  // assert
  expect(screen.getByText("غیرفعال")).toBeInTheDocument();
});

it("should render workflow draft status", () => {
  // arrange
  const workflow = workflowFactory("draft");

  // act
  renderInformationTab(workflow);

  // assert
  expect(screen.getByText("پیش نویس")).toBeInTheDocument();
});

it("should render edit button", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);

  // assert
  expect(findEditButton()).toBeInTheDocument();
});

it("should render edit form when click on edit button", async () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);
  await clickEditButton();

  // assert
  expect(screen.getByText("ویرایش مشخصات گردش کار")).toBeInTheDocument();
});

it("should render workflow trigger form name", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);

  // assert
  expect(
    screen.getByText(workflow.trigger_form?.title ?? ""),
  ).toBeInTheDocument();
});

it("should render warning message when workflow trigger form is null", () => {
  // arrange
  let workflow = workflowFactory();
  workflow = { ...workflow, trigger_form: null };

  // act
  renderInformationTab(workflow);

  // assert
  expect(
    screen.getByText("این گردش کار فرم ماشه ندارد"),
  ).toBeInTheDocument();
});

it("should render create new form link for the workflow as trigger form", () => {
  // arrange
  let workflow = workflowFactory();
  workflow = { ...workflow, trigger_form: null };

  // act
  renderInformationTab(workflow);

  // assert
  expect(findLinkByName("ایجاد فرم ماشه")).toBeInTheDocument();
});

it("should render create new form link with correct href for the workflow as trigger form", () => {
  // arrange
  let workflow = workflowFactory();
  workflow = { ...workflow, trigger_form: null };

  // act
  renderInformationTab(workflow);

  // assert
  const createTriggerFormLink = findLinkByName("ایجاد فرم ماشه");
  expect(createTriggerFormLink).toHaveAttribute(
    "href",
    `/form/generator?workflow=${workflow.id}&type_trigger_form=true`,
  );
});

it("should hide edit workflow form after click on cancel button", async () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);
  await clickEditButton();
  const formTitle = screen.getByText("ویرایش مشخصات گردش کار");
  await clickCancelEditButton();

  // assert
  expect(formTitle).not.toBeInTheDocument();
});

it("should hid edit workflow form on click save button", async () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderInformationTab(workflow);
  await clickEditButton();
  const formTitle = screen.getByText("ویرایش مشخصات گردش کار");
  await clickSaveButton();

  // assert
  expect(formTitle).not.toBeInTheDocument();
});
