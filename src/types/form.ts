// @/types/form.ts

// First, export the FieldType from form-generator types or define it here
export type FieldType = 'text' | 'email' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select' | 'radio' | 'dropdown' | 'relation';

export interface Form {
  nodeId?: string; // Make this optional with ?
  id: string;
  title: string;
  description: string | null;
  schema: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FormEdge {
  node: Form;
}

export interface FormsCollection {
  edges: FormEdge[];
}

export interface FormListResponse {
  formsCollection: FormsCollection;
}

// Update this interface to use FieldType instead of string
export interface FormField {
  id: string;
  type: FieldType;  // Change from 'string' to 'FieldType'
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  relationConfig?: {
    formId?: string;
    formTitle?: string;
    displayField?: string;
  };
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}