import { render, screen } from "@testing-library/react";
import type { Workflow, WorkflowStatus } from "../../../../src/types/workflow";
import type { Form } from "../../../../src/types/form";
import { InformationTab } from "../../../../src/components/workflow/detail-tabs/information-tab";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { it, expect } from 'vitest';
import '@testing-library/jest-dom';

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
  render(<InformationTab workflow={workflow} />);
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
  expect(screen.getByText(workflow.trigger_form.title)).toBeInTheDocument();
});
