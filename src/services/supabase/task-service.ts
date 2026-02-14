import { BaseSupabaseService } from './base-service';
import type { PaginatedResponse } from './types';

export interface Task {
  id: number;
  step: {
    id: string;
    type: 'start' | 'end' | 'assign-task' | 'fill-form' | 'condition' | 'change-status';
    label: string;
    form_id?: number;
    role_id?: number;
    [key: string]: any;
  };
  assigned_to: string | null;
  created_by: string | null;
  status:
    | {
        label: string;
        status: string;
        description: string;
        statusColor: string;
        statusLabel: string;
        assignToRole: any | null;
        shouldReassign: boolean;
      }
    | string;
  form_id: number | null;
  task_data: any;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  form?: {
    id: number;
    title: string;
    schema?: any;
  };
  responses?: Array<{
    id: number;
    data: any;
    created_at: string;
    created_by: string;
    user?: {
      name?: string;
      email: string;
    };
  }>;
  response?: {
    id: number;
    data: any;
    created_at: string;
    created_by: string;
  };
}

export interface TaskFilters {
  status?: string;
  search?: string;
  formId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class TaskService extends BaseSupabaseService {
  /**
   * Get task with all its responses through task_responses
   */
  async getTaskWithResponses(taskId: number): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from("tasks")
        .select(
          `
          *,
          form:forms!left (
            id,
            title,
            schema
          ),
          task_responses!left (
            response:responses (
              id,
              data,
              created_at,
              created_by
            )
          )
        `
        )
        .eq("id", taskId);

      if (error) {
        console.error("Error fetching task with responses:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const task = data[0];
      
      // Parse step if it's a string
      if (typeof task.step === 'string') {
        try {
          task.step = JSON.parse(task.step);
        } catch (e) {
          console.error("Error parsing step JSON:", e);
        }
      }
      
      // Extract responses from the task_responses join
      const responses = task.task_responses
        ?.map((tr: any) => tr.response)
        .filter((r: any) => r !== null) || [];
      
      // For backward compatibility, set the first response as 'response'
      const transformedData = {
        ...task,
        responses: responses,
        response: responses[0] || null,
        task_responses: undefined
      };
      
      return transformedData;
    } catch (error) {
      console.error("Error in getTaskWithResponses:", error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getTasksByAssignee(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          form:forms!left (
            id,
            title
          ),
          task_responses!left (
            response:responses (
              id,
              data,
              created_at,
              created_by
            )
          )
        `, { count: 'exact' })
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.formId && filters.formId !== 'all') {
        query = query.eq('form_id', filters.formId);
      }

      if (filters?.search) {
        query = query.or(`step->>label.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .range(from, to);

      if (error) {
        console.error('Error fetching tasks by assignee:', error);
        throw error;
      }

      // Transform data to include responses array and parse step JSON
      const transformedData = (data || []).map(task => {
        // Parse step if it's a string
        if (typeof task.step === 'string') {
          try {
            task.step = JSON.parse(task.step);
          } catch (e) {
            console.error("Error parsing step JSON:", e);
          }
        }
        
        const responses = task.task_responses
          ?.map((tr: any) => tr.response)
          .filter((r: any) => r !== null) || [];
        
        return {
          ...task,
          responses: responses,
          response: responses[0] || null,
          task_responses: undefined
        };
      });

      return {
        data: transformedData,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error in getTasksByAssignee:', error);
      throw error;
    }
  }

  /**
   * Get tasks submitted by a user (tasks they created)
   */
  async getTasksBySubmitter(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          form:forms!left (
            id,
            title
          ),
          task_responses!left (
            response:responses (
              id,
              data,
              created_at,
              created_by
            )
          )
        `, { count: 'exact' })
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.formId && filters.formId !== 'all') {
        query = query.eq('form_id', filters.formId);
      }

      if (filters?.search) {
        query = query.or(`step->>label.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .range(from, to);

      if (error) {
        console.error('Error fetching tasks by submitter:', error);
        throw error;
      }

      // Transform data to include responses array and parse step JSON
      const transformedData = (data || []).map(task => {
        // Parse step if it's a string
        if (typeof task.step === 'string') {
          try {
            task.step = JSON.parse(task.step);
          } catch (e) {
            console.error("Error parsing step JSON:", e);
          }
        }
        
        const responses = task.task_responses
          ?.map((tr: any) => tr.response)
          .filter((r: any) => r !== null) || [];
        
        return {
          ...task,
          responses: responses,
          response: responses[0] || null,
          task_responses: undefined
        };
      });

      return {
        data: transformedData,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error in getTasksBySubmitter:', error);
      throw error;
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: number): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          form:forms!left (
            id,
            title,
            schema
          ),
          task_responses!left (
            response:responses (
              id,
              data,
              created_at,
              created_by
            )
          )
        `)
        .eq('id', taskId);

      if (error) {
        console.error('Error fetching task:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const task = data[0];
      
      // Parse step if it's a string
      if (typeof task.step === 'string') {
        try {
          task.step = JSON.parse(task.step);
        } catch (e) {
          console.error("Error parsing step JSON:", e);
        }
      }
      
      const responses = task.task_responses
        ?.map((tr: any) => tr.response)
        .filter((r: any) => r !== null) || [];
      
      return {
        ...task,
        responses: responses,
        response: responses[0] || null,
        task_responses: undefined
      };
    } catch (error) {
      console.error('Error in getTaskById:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: number, status: string): Promise<Task> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      throw error;
    }
  }

  /**
   * Update task details
   */
  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  }

  /**
   * Add note to task
   */
  async addTaskNote(taskId: number, note: string): Promise<Task> {
    return this.updateTask(taskId, { notes: note });
  }

  /**
   * Create a new task
   */
  async createTask(taskData: {
    step: any;
    assigned_to?: string | null;
    created_by: string;
    form_id?: number | null;
    task_data?: any;
    due_date?: string | null;
    status?: string;
  }): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert([{
          step: taskData.step,
          assigned_to: taskData.assigned_to || null,
          created_by: taskData.created_by,
          form_id: taskData.form_id || null,
          task_data: taskData.task_data || {},
          due_date: taskData.due_date || null,
          status: taskData.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  }

  /**
   * Create relation between task and response
   */
  async createTaskResponse(taskId: number, responseId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('task_responses')
        .insert([{
          task_id: taskId,
          response_id: responseId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating task response relation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createTaskResponse:', error);
      throw error;
    }
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStats(userId: string): Promise<{
    assigned: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      on_hold: number;
      cancelled: number;
    };
    submitted: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      on_hold: number;
      cancelled: number;
    };
  }> {
    try {
      // Get assigned tasks stats
      const { data: assignedData, error: assignedError } = await this.supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', userId);
      
      if (assignedError) throw assignedError;

      // Get submitted tasks stats
      const { data: submittedData, error: submittedError } = await this.supabase
        .from('tasks')
        .select('status')
        .eq('created_by', userId);
      
      if (submittedError) throw submittedError;

      const calculateStats = (tasks: any[]) => ({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        on_hold: tasks.filter(t => t.status === 'on_hold').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
      });

      return {
        assigned: calculateStats(assignedData || []),
        submitted: calculateStats(submittedData || [])
      };
    } catch (error) {
      console.error('Error in getTaskStats:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();