// services/workflow-service.ts
import { BaseSupabaseService } from "./base-service";
import type { Workflow, WorkflowStatus } from "@/types/workflow";

// Keep this interface for stats as it's service-specific
export interface WorkflowStats {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  archived: number;
  total_instances: number;
  active_instances: number;
}

// Database response type (what comes from Supabase)
interface WorkflowDbResponse {
  id: number;
  name: string;
  description?: string;
  schema: any; // Will be parsed into WorkflowSchema
  trigger_form_id: number;
  status: string; // Comes as string from DB
  active_instances: number;
  completed_instances: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  trigger_form?: {
    id: number;
    title: string;
  };
}

export class WorkflowService extends BaseSupabaseService {
  // Helper to transform DB response to domain Workflow type
  private transformToWorkflow(dbWorkflow: WorkflowDbResponse): Workflow {
    // Parse schema if it's stored as JSON string
    const schema = typeof dbWorkflow.schema === 'string' 
      ? JSON.parse(dbWorkflow.schema) 
      : dbWorkflow.schema;

    // Transform trigger_form to match the Form type from @/types/form
    const trigger_form = dbWorkflow.trigger_form ? {
      id: dbWorkflow.trigger_form.id,
      title: dbWorkflow.trigger_form.title,
      // Add other required Form fields with defaults or from related data
      schema: {}, // You might need to fetch this separately
      created_at: dbWorkflow.created_at,
      description: null,
    } : undefined;

    return {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      description: dbWorkflow.description,
      schema: schema,
      trigger_form: trigger_form as any, // Type assertion needed if Form type is complex
      status: dbWorkflow.status as WorkflowStatus,
      active_instances: dbWorkflow.active_instances,
      completed_instances: dbWorkflow.completed_instances,
      created_by: dbWorkflow.created_by,
      created_at: dbWorkflow.created_at,
      updated_at: dbWorkflow.updated_at,
    };
  }

  async getWorkflows(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
  ): Promise<{
    data: Workflow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = this.supabase
        .from("workflows")
        .select(
          `
          *,
          trigger_form:forms!workflows_trigger_form_id_fkey (
            id,
            title
          )
        `,
          { count: "exact" },
        );

      // Add status filter if provided
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      // Add pagination and ordering
      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workflows:", error);
        throw error;
      }

      // Transform each workflow to match the domain type
      const transformedData = (data || []).map(item => 
        this.transformToWorkflow(item as WorkflowDbResponse)
      );

      return {
        data: transformedData,
        total: count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      console.error("Error in getWorkflows:", error);
      throw error;
    }
  }

  async getWorkflow(id: number): Promise<Workflow | null> {
    try {
      const { data, error } = await this.supabase
        .from("workflows")
        .select(
          `
          *,
          trigger_form:forms!workflows_trigger_form_id_fkey (
            id,
            title
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching workflow:", error);
        return null;
      }

      return this.transformToWorkflow(data as WorkflowDbResponse);
    } catch (error) {
      console.error("Error in getWorkflow:", error);
      throw error;
    }
  }

  async getWorkflowStats(): Promise<WorkflowStats> {
    try {
      // Get total counts
      const { data, error } = await this.supabase
        .from("workflows")
        .select("status, active_instances, completed_instances");

      if (error) {
        console.error("Error fetching workflow stats:", error);
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
      data?.forEach((workflow) => {
        switch (workflow.status) {
          case "active":
            stats.active++;
            break;
          case "draft":
            stats.draft++;
            break;
          case "inactive":
            stats.inactive++;
            break;
          case "archived":
            stats.archived++;
            break;
        }

        stats.total_instances +=
          (workflow.active_instances || 0) +
          (workflow.completed_instances || 0);
        stats.active_instances += workflow.active_instances || 0;
      });

      return stats;
    } catch (error) {
      console.error("Error in getWorkflowStats:", error);
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
        .from("workflows")
        .insert([
          {
            name: workflowData.name,
            description: workflowData.description,
            trigger_form_id: workflowData.trigger_form_id,
            schema: workflowData.schema || {
              edges: [],
              nodes: [],
            },
            status: "draft",
          },
        ])
        .select(
          `
          *,
          trigger_form:forms!workflows_trigger_form_id_fkey (
            id,
            title
          )
        `,
        )
        .single();

      if (error) {
        console.error("Error creating workflow:", error);
        throw error;
      }

      return this.transformToWorkflow(data as WorkflowDbResponse);
    } catch (error) {
      console.error("Error in createWorkflow:", error);
      throw error;
    }
  }

  async updateWorkflow(
    id: number,
    updates: Partial<Workflow>,
  ): Promise<Workflow> {
    try {
      // Extract only the fields that exist in the database
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.schema !== undefined) dbUpdates.schema = updates.schema;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.active_instances !== undefined) dbUpdates.active_instances = updates.active_instances;
      if (updates.completed_instances !== undefined) dbUpdates.completed_instances = updates.completed_instances;

      const { data, error } = await this.supabase
        .from("workflows")
        .update(dbUpdates)
        .eq("id", id)
        .select(
          `
          *,
          trigger_form:forms!workflows_trigger_form_id_fkey (
            id,
            title
          )
        `,
        )
        .single();

      if (error) {
        console.error("Error updating workflow:", error);
        throw error;
      }

      return this.transformToWorkflow(data as WorkflowDbResponse);
    } catch (error) {
      console.error("Error in updateWorkflow:", error);
      throw error;
    }
  }

  async deleteWorkflow(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("workflows")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting workflow:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteWorkflow:", error);
      throw error;
    }
  }

  async toggleWorkflowStatus(workflow: Workflow): Promise<Workflow> {
    let newStatus: WorkflowStatus;

    switch (workflow.status) {
      case "draft":
        newStatus = "active";
        break;
      case "active":
        newStatus = "inactive";
        break;
      case "inactive":
        newStatus = "active";
        break;
      default:
        newStatus = workflow.status;
    }

    return this.updateWorkflow(workflow.id, { status: newStatus });
  }
}