// services/workflow-service.ts
import { BaseSupabaseService } from './base-service';

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  schema: any; // JSONB field for workflow schema
  trigger_form_id: number;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  active_instances: number;
  completed_instances: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  form?: {
    id: number;
    title: string;
  };
}

export interface WorkflowStats {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  archived: number;
  total_instances: number;
  active_instances: number;
}

export class WorkflowService extends BaseSupabaseService {
  async getWorkflows(
    page: number = 1,
    pageSize: number = 10,
    status?: string
  ): Promise<{ data: Workflow[]; total: number; page: number; pageSize: number }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = this.supabase
        .from('workflows')
        .select(`
          *,
          form:forms!inner (
            id,
            title
          )
        `, { count: 'exact' });

      // Add status filter if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Add pagination and ordering
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workflows:', error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error in getWorkflows:', error);
      throw error;
    }
  }

  async getWorkflowStats(): Promise<WorkflowStats> {
    try {
      // Get total counts
      const { data, error } = await this.supabase
        .from('workflows')
        .select('status, active_instances, completed_instances');

      if (error) {
        console.error('Error fetching workflow stats:', error);
        throw error;
      }

      const stats: WorkflowStats = {
        total: data?.length || 0,
        active: 0,
        draft: 0,
        inactive: 0,
        archived: 0,
        total_instances: 0,
        active_instances: 0,
      };

      // Calculate counts by status
      data?.forEach(workflow => {
        switch (workflow.status) {
          case 'active':
            stats.active++;
            break;
          case 'draft':
            stats.draft++;
            break;
          case 'inactive':
            stats.inactive++;
            break;
          case 'archived':
            stats.archived++;
            break;
        }

        stats.total_instances += (workflow.active_instances || 0) + (workflow.completed_instances || 0);
        stats.active_instances += workflow.active_instances || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error in getWorkflowStats:', error);
      throw error;
    }
  }

  async createWorkflow(workflowData: {
    name: string;
    description?: string;
    trigger_form_id: number;
    schema?: any;
  }): Promise<Workflow> {
    try {
      const { data, error } = await this.supabase
        .from('workflows')
        .insert([{
          name: workflowData.name,
          description: workflowData.description,
          trigger_form_id: workflowData.trigger_form_id,
          schema: workflowData.schema || { nodes: [], connections: [], settings: {} },
          status: 'draft'
        }])
        .select(`
          *,
          form:forms!inner (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Error creating workflow:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createWorkflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: number, updates: Partial<Workflow>): Promise<Workflow> {
    try {
      const { data, error } = await this.supabase
        .from('workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          form:forms!inner (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Error updating workflow:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateWorkflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting workflow:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteWorkflow:', error);
      throw error;
    }
  }

  async toggleWorkflowStatus(id: number, currentStatus: string): Promise<Workflow> {
    let newStatus: string;
    
    switch (currentStatus) {
      case 'draft':
        newStatus = 'active';
        break;
      case 'active':
        newStatus = 'inactive';
        break;
      case 'inactive':
        newStatus = 'active';
        break;
      default:
        newStatus = currentStatus;
    }

    return this.updateWorkflow(id, { status: newStatus as any });
  }
}