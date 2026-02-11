import { FormService } from "./form-services";
import { ResponseService } from "./response-services";
import { RoleService } from "./role-service";
import { UserService } from "./user-services";
import { WorkflowService } from "./workflow-service";

export const formService = new FormService();
export const responseService = new ResponseService();
export const userService = new UserService();
export const roleService = new RoleService();
export const workflowService = new WorkflowService();

export * from "./types";

export class SupabaseService {
  forms = formService;
  responses = responseService;
  users = userService;

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
  createWorkflow = workflowService.createWorkflow.bind(workflowService);
  updateWorkflow = workflowService.updateWorkflow.bind(workflowService);
  deleteWorkflow = workflowService.deleteWorkflow.bind(workflowService);
  toggleWorkflowStatus =
    workflowService.toggleWorkflowStatus.bind(workflowService);
}

// Default export for backward compatibility
export const supabaseService = new SupabaseService();
