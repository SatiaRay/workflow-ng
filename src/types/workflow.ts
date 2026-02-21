import type { Form } from "./form";
import type { Role } from "./role";

export type WorkflowStatus = 'draft' | 'active' | 'inactive';
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  schema: WorkflowSchema;
  trigger_form: Form;
  status: WorkflowStatus;
  active_instances: number;
  completed_instances: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowSchema {
    edges: Edge[];
    nodes: Node[];
}

interface Edge {
    id: string;
    type: string;
    style: {
        stroke: string;
    };
    source: string;
    target: string;
    animated: boolean;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

interface Node {
    id: string;
    type: NodeType;
    data: NodeData;
    width: number;
    height: number;
    dragging: boolean;
    position: Position;
    selected: boolean;
    positionAbsolute: Position;
}

type NodeType = 'start' | 'end' | 'fill-form' | 'condition' | 'change-status' | 'assign-task';

type NodeData = StartNodeData | EndNodeData | FillFormNodeData | ConditionNodeData | ChangeStatusNodeData | AssignTaskNodeData;

interface Position {
    x: number;
    y: number;
}

interface StartNodeData {
    label: string;
    description: string;
}

interface EndNodeData {
    label: string;
    description: string;
}

interface FillFormNodeData {
    label: string;
    description: string;
    form: FormNode | null;
}

interface ConditionNodeData {
    label: string;
    description: string;
    selectedFormNode: FormNode | null;
    conditionRules: ConditionRule[];
    selectedFormNodeId: number | null;
}

interface ChangeStatusNodeData {
    label: string;
    status: string;
    description: string;
    statusColor: string;
    statusLabel: string;
    assignToRole: string | null;
    shouldReassign: boolean;
}

interface AssignTaskNodeData {
    label: string;
    description: string;
    form: FormNode | null;
    role: Role | null;
}

interface FormNode {
    id: number;
    title: string;
    nodeId?: string;
    schema: FormNodeSchema;
    owner_id: number | null;
    created_at: string;
    updated_at: string;
    description: string;
}

interface FormNodeSchema {
    title: string;
    fields: FormNodeField[];
    description: string;
}

interface FormNodeField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
}

type FieldType = 'text' | 'number' | 'date' | 'radio' | 'textarea' | 'checkbox' | 'select';

interface ConditionRule {
    value: string;
    fieldId: string;
    operator: string;
    fieldType: FieldType;
    fieldLabel: string;
}