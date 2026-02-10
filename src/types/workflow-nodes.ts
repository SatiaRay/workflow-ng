export interface BaseNodeData {
  id: string;
  label: string;
  description: string;
  type: string;
}

export interface AssignTaskNodeData extends BaseNodeData {
  type: 'assign-task';
  role: {
    id: number;
    name: string;
  } | null;
  form: {
    id: number;
    title: string;
    fields?: any[];
  } | null;
}

export interface FillFormNodeData extends BaseNodeData {
  type: 'fill-form';
  form: {
    id: number;
    title: string;
    fields: any[];
    description?: string;
  } | null;
}

export interface ConditionNodeData extends BaseNodeData {
  type: 'condition';
  conditionRules: ConditionRule[];
}

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
            'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  formId: number | null;
}

export interface DecisionNodeData extends BaseNodeData {
  type: 'decision';
  conditions: string[];
}

export interface ProcessNodeData extends BaseNodeData {
  type: 'process';
}

export interface StartNodeData extends BaseNodeData {
  type: 'start';
}

export interface EndNodeData extends BaseNodeData {
  type: 'end';
}

export type NodeData = 
  | AssignTaskNodeData
  | FillFormNodeData
  | ConditionNodeData
  | DecisionNodeData
  | ProcessNodeData
  | StartNodeData
  | EndNodeData;