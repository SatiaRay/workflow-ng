export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  schema: any;
  trigger_form_id: number;
  status: WorkflowStatus;
  active_instances: number;
  completed_instances: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  form?: {
    id: number;
    title: string;
  };
}