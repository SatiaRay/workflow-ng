import { FormService } from './form-services';
import { ResponseService } from './response-services';
import { UserService } from './user-services';

// Export individual services
export const formService = new FormService();
export const responseService = new ResponseService();
export const userService = new UserService();

// Export types
export * from './types';

// Main service class for backward compatibility
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
  getFormResponsesWithFilters = responseService.getFormResponsesWithFilters.bind(responseService);
  
  getUsersWithFilters = userService.getUsersWithFilters.bind(userService);
  getUserById = userService.getUserById.bind(userService);
  createUser = userService.createUser.bind(userService);
  updateUser = userService.updateUser.bind(userService);
  deleteUser = userService.deleteUser.bind(userService);
  updateUserStatus = userService.updateUserStatus.bind(userService);
}

// Default export for backward compatibility
export const supabaseService = new SupabaseService();