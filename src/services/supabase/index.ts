import { FormService } from "./form-services";
import { ResponseService } from "./response-services";
import { RoleService } from "./role-service";
import { TaskService } from "./task-service";
import { UserService } from "./user-services";
import { WorkflowService } from "./workflow-service";

export const formService = new FormService();
export const responseService = new ResponseService();
export const userService = new UserService();
export const roleService = new RoleService();
export const workflowService = new WorkflowService();
export const taskService = new TaskService();

export * from "./types";

export class SupabaseService {
  forms = formService;
  responses = responseService;
  users = userService;
  tasks = taskService;

  // You can also keep the old method names as aliases
  getForms = formService.getForms.bind(formService);
  getFormById = formService.getFormById.bind(formService);
  createForm = formService.createForm.bind(formService);
  updateForm = formService.updateForm.bind(formService);
  deleteForm = formService.deleteForm.bind(formService);

  getFormResponses = responseService.getFormResponses.bind(responseService);
  getResponseById = responseService.getResponseById.bind(responseService);
  submitFormResponse = responseService.submitFormResponse.bind(responseService);
  updateResponse = responseService.updateResponse.bind(responseService);
  deleteResponse = responseService.deleteResponse.bind(responseService);
  getFormResponsesWithFilters =
    responseService.getFormResponsesWithFilters.bind(responseService);

  getProfiles = userService.getProfiles.bind(userService);

  getRoles = roleService.getRoles.bind(roleService);
  deleteRole = roleService.deleteRole.bind(roleService);
  createRole = roleService.createRole.bind(roleService);
  updateRole = roleService.updateRole.bind(roleService);

  getWorkflows = workflowService.getWorkflows.bind(workflowService);
  getWorkflow = workflowService.getWorkflow.bind(workflowService);
  getWorkflowStats = workflowService.getWorkflowStats.bind(workflowService);
  getWorkflowForms = workflowService.getWorkflowForms.bind(workflowService);
  createWorkflow = workflowService.createWorkflow.bind(workflowService);
  updateWorkflow = workflowService.updateWorkflow.bind(workflowService);
  deleteWorkflow = workflowService.deleteWorkflow.bind(workflowService);
  toggleWorkflowStatus =
    workflowService.toggleWorkflowStatus.bind(workflowService);

  // Task methods
  getTaskWithResponses = taskService.getTaskWithResponses.bind(taskService);
  getTasksByAssignee = taskService.getTasksByAssignee.bind(taskService);
  getTasksBySubmitter = taskService.getTasksBySubmitter.bind(taskService);
  getTaskById = taskService.getTaskById.bind(taskService);
  updateTaskStatus = taskService.updateTaskStatus.bind(taskService);
  addTaskNote = taskService.addTaskNote.bind(taskService);
  createTask = taskService.createTask.bind(taskService);
  createTaskResponse = taskService.createTaskResponse.bind(taskService);
}

// Default export for backward compatibility
export const supabaseService = new SupabaseService();