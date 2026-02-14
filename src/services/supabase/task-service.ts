import { BaseSupabaseService } from './base-service';
import type { PaginatedResponse } from './types';

export interface Task {
  id: number;
  step: {
    step_id: string;
    step_name: string;
    form_id?: number;
    [key: string]: any;
  };
  assigned_to: string | null;
  status: any;
  task_data: any;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields through task_responses
  responses?: Array<{
    id: number;
    data: any;
    created_at: string;
    created_by: string;
    form_id?: number;
  }>;
}

export interface TaskFilters {
  status?: string;
  search?: string;
  formId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: 'all' | 'assigned' | 'submitted';
}

export class TaskService extends BaseSupabaseService {
  /**
   * Get task with all its responses through task_responses
   */
  async getTaskWithResponses(taskId: number): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from("tasks")
        .select(`
          *,
          task_responses!left (
            response:responses!inner (
              id,
              data,
              created_at,
              created_by,
              form_id
            )
          )
        `)
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("Error fetching task with responses:", error);
        return null;
      }

      if (!data) return null;

      // Parse JSON fields if they're strings
      if (typeof data.step === 'string') {
        try { data.step = JSON.parse(data.step); } catch (e) {}
      }
      if (typeof data.status === 'string') {
        try { data.status = JSON.parse(data.status); } catch (e) {}
      }
      if (typeof data.task_data === 'string') {
        try { data.task_data = JSON.parse(data.task_data); } catch (e) {}
      }

      // Extract responses
      const responses = data.task_responses
        ?.map((tr: any) => tr.response)
        .filter((r: any) => r !== null) || [];

      // Sort responses by created_at to ensure first response is the trigger
      const sortedResponses = [...responses].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return {
        ...data,
        responses: sortedResponses,
        task_responses: undefined
      };
    } catch (error) {
      console.error("Error in getTaskWithResponses:", error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to a specific user with their responses
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
          task_responses!left (
            response:responses!inner (
              id,
              data,
              created_at,
              created_by,
              form_id
            )
          )
        `, { count: 'exact' })
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.filter('status->>status', 'eq', filters.status);
      }

      if (filters?.search) {
        query = query.or(`step->>step_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
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

      // Transform data
      const transformedData = (data || []).map(task => {
        // Parse JSON fields
        if (typeof task.step === 'string') {
          try { task.step = JSON.parse(task.step); } catch (e) {}
        }
        if (typeof task.status === 'string') {
          try { task.status = JSON.parse(task.status); } catch (e) {}
        }
        if (typeof task.task_data === 'string') {
          try { task.task_data = JSON.parse(task.task_data); } catch (e) {}
        }

        const responses = task.task_responses
          ?.map((tr: any) => tr.response)
          .filter((r: any) => r !== null) || [];

        // Sort responses by created_at
        const sortedResponses = [...responses].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return {
          ...task,
          responses: sortedResponses,
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
   * Get tasks where user has submitted responses
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

      // First get task_ids from task_responses where response.created_by = userId
      const { data: taskResponseData, error: taskResponseError } = await this.supabase
        .from('task_responses')
        .select(`
          task_id,
          response:responses!inner (
            id,
            data,
            created_at,
            created_by,
            form_id
          )
        `)
        .eq('response.created_by', userId);

      if (taskResponseError) {
        console.error('Error fetching task responses:', taskResponseError);
        throw taskResponseError;
      }

      const taskIds = taskResponseData?.map(tr => tr.task_id) || [];

      if (taskIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // Now fetch the tasks with these IDs and their responses
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          task_responses!left (
            response:responses!inner (
              id,
              data,
              created_at,
              created_by,
              form_id
            )
          )
        `, { count: 'exact' })
        .in('id', taskIds)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.filter('status->>status', 'eq', filters.status);
      }

      if (filters?.search) {
        query = query.or(`step->>step_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
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

      // Transform data
      const transformedData = (data || []).map(task => {
        // Parse JSON fields
        if (typeof task.step === 'string') {
          try { task.step = JSON.parse(task.step); } catch (e) {}
        }
        if (typeof task.status === 'string') {
          try { task.status = JSON.parse(task.status); } catch (e) {}
        }
        if (typeof task.task_data === 'string') {
          try { task.task_data = JSON.parse(task.task_data); } catch (e) {}
        }

        const responses = task.task_responses
          ?.map((tr: any) => tr.response)
          .filter((r: any) => r !== null) || [];

        // Sort responses by created_at
        const sortedResponses = [...responses].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return {
          ...task,
          responses: sortedResponses,
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
   * Update task status
   */
  async updateTaskStatus(taskId: number, newStatus: string): Promise<Task> {
    try {
      // First get current task to merge with new status
      const currentTask = await this.getTaskById(taskId);
      
      let statusUpdate: any = { status: newStatus };
      
      if (currentTask?.status && typeof currentTask.status === 'object') {
        // Preserve existing status object properties and update status field
        statusUpdate = {
          ...currentTask.status,
          status: newStatus
        };
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          status: statusUpdate,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
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
   * Get a single task by ID
   */
  async getTaskById(taskId: number): Promise<Task | null> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          task_responses!left (
            response:responses!inner (
              id,
              data,
              created_at,
              created_by,
              form_id
            )
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task:', error);
        return null;
      }

      if (!data) return null;

      // Parse JSON fields
      if (typeof data.step === 'string') {
        try { data.step = JSON.parse(data.step); } catch (e) {}
      }
      if (typeof data.status === 'string') {
        try { data.status = JSON.parse(data.status); } catch (e) {}
      }
      if (typeof data.task_data === 'string') {
        try { data.task_data = JSON.parse(data.task_data); } catch (e) {}
      }

      const responses = data.task_responses
        ?.map((tr: any) => tr.response)
        .filter((r: any) => r !== null) || [];

      // Sort responses by created_at
      const sortedResponses = [...responses].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return {
        ...data,
        responses: sortedResponses,
        task_responses: undefined
      };
    } catch (error) {
      console.error('Error in getTaskById:', error);
      throw error;
    }
  }

  /**
   * Add note to task
   */
  async addTaskNote(taskId: number, note: string): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          notes: note,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error adding task note:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addTaskNote:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: {
    step: any;
    assigned_to?: string | null;
    status?: any;
    task_data?: any;
    due_date?: string | null;
  }): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert([{
          step: taskData.step,
          assigned_to: taskData.assigned_to || null,
          status: taskData.status || { status: 'pending', label: 'در انتظار' },
          task_data: taskData.task_data || {},
          due_date: taskData.due_date || null,
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
   * Get all tasks for a user (both assigned and submitted)
   */
  async getAllUserTasks(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    try {
      // Get assigned tasks
      const assignedResponse = await this.getTasksByAssignee(
        userId,
        1,
        1000,
        filters
      );

      // Get submitted tasks
      const submittedResponse = await this.getTasksBySubmitter(
        userId,
        1,
        1000,
        filters
      );

      // Merge and deduplicate
      const allTasks = [...assignedResponse.data, ...submittedResponse.data];
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      // Sort by created_at descending
      const sortedTasks = uniqueTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedTasks = sortedTasks.slice(from, to);

      return {
        data: paginatedTasks,
        total: sortedTasks.length,
        page,
        pageSize,
        totalPages: Math.ceil(sortedTasks.length / pageSize)
      };
    } catch (error) {
      console.error('Error in getAllUserTasks:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();