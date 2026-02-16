export interface Workflow {
  id: number;
  name: string;
  description?: string;
  schema: any;
  trigger_form_id: number;
  status: 'draft' | 'active' | 'inactive' | 'archived';
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