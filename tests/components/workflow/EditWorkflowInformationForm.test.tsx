import { render, screen } from "@testing-library/react";
import type { Workflow, WorkflowStatus } from "../../../src/types/workflow";
import type { Form } from "../../../src/types/form";
import EditWorkflowInformationForm from "../../../src/components/workflow/edit-workflow-information-form";
import { it, expect } from "vitest";
import "@testing-library/jest-dom";

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

const renderEditForm = (workflow: Workflow): void => {
  render(<EditWorkflowInformationForm workflow={workflow} />);
};

const findTextInputWithValue = (value?: string): HTMLElement | null => {
  return screen.getByRole("textbox", { name: value });
};

const findSelectionWithValue = (
  value?: string | number,
): HTMLElement | null => {
  return screen.getByRole("combobox", { name: `${value}` });
};

it("should render input for edit workflow name", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderEditForm(workflow);

  // assert
  expect(findTextInputWithValue(workflow.name)).toBeInTheDocument();
});

it("should render input for edit workflow description", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderEditForm(workflow);

  // assert
  expect(findTextInputWithValue(workflow.description)).toBeInTheDocument();
});

it("should render selection for edit workflow trigger form", () => {
  // arrange
  const workflow = workflowFactory();

  // act
  renderEditForm(workflow);

  // assert
  expect(findSelectionWithValue(workflow.trigger_form.id)).toBeInTheDocument();
});