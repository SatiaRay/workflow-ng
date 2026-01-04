// src/services/supabase.service.ts
import { supabase } from "@/lib/supabase-client";
import type { Form } from "@/types/form";

export interface FormResponse {
  id: number;
  form_id: number;
  data: any;
  created_at: string;
  updated_at?: string;
}

export interface Filter {
  operator: string;
  value: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class SupabaseService {
  // Form operations
  async getForms(): Promise<Form[]> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to include nodeId
    return (data || []).map((form: any) => ({
      ...form,
      nodeId: `form_${form.id}`,
    }));
  }

  async getFormById(id: string | number): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching form:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      ...data,
      nodeId: `form_${data.id}`,
    };
  }

  async createForm(formData: {
    title: string;
    description?: string | null;
    schema: any;
  }): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .insert([
        {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      nodeId: `form_${data.id}`,
    };
  }

  async updateForm(id: string | number, formData: {
    title?: string;
    description?: string | null;
    schema?: any;
  }): Promise<Form | null> {
    const { data, error } = await supabase
      .from('forms')
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      nodeId: `form_${data.id}`,
    };
  }

  async deleteForm(id: string | number): Promise<void> {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Form responses operations
  async getFormResponses(formId: string | number): Promise<FormResponse[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getResponseById(responseId: string | number): Promise<FormResponse | null> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (error) {
      console.error('Error fetching response:', error);
      return null;
    }
    return data;
  }

  async submitFormResponse(formId: string | number, data: Record<string, any>): Promise<FormResponse | null> {
    const { data: response, error } = await supabase
      .from('responses')
      .insert([
        {
          form_id: formId,
          data: data,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return response;
  }

  async updateResponse(responseId: string | number, data: Record<string, any>): Promise<FormResponse | null> {
    const { data: response, error } = await supabase
      .from('responses')
      .update({
        data: data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) throw error;
    return response;
  }

  async deleteResponse(responseId: string | number): Promise<void> {
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('id', responseId);

    if (error) throw error;
  }

  // Get responses with filters and pagination
  async getFormResponsesWithFilters(
    formId: string | number,
    filters: Record<string, Filter>,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<FormResponse>> {
    let query = supabase
      .from('responses')
      .select('*', { count: 'exact' })
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    // Apply JSON filters
    Object.entries(filters).forEach(([fieldName, filter]) => {
      if (
        filter.value !== '' &&
        filter.value !== null &&
        filter.value !== undefined &&
        filter.value !== false
      ) {
        const isTextSearch = filter.operator === 'contains' ||
          filter.operator === 'startsWith' ||
          filter.operator === 'endsWith' ||
          (filter.operator === 'equals' && typeof filter.value === 'string');

        const jsonPath = isTextSearch
          ? `data->>${fieldName}`
          : `data->${fieldName}`;

        switch (filter.operator) {
          case 'contains':
            query = query.filter(jsonPath, 'ilike', `%${filter.value}%`);
            break;
          case 'equals':
            query = query.filter(jsonPath, 'eq', filter.value);
            break;
          case 'isTrue':
            query = query.filter(jsonPath, 'eq', true);
            break;
          case 'isFalse':
            query = query.filter(jsonPath, 'eq', false);
            break;
          case 'greaterThan':
            query = query.filter(jsonPath, 'gt', filter.value);
            break;
          case 'lessThan':
            query = query.filter(jsonPath, 'lt', filter.value);
            break;
          case 'startsWith':
            query = query.filter(jsonPath, 'ilike', `${filter.value}%`);
            break;
          case 'endsWith':
            query = query.filter(jsonPath, 'ilike', `%${filter.value}`);
            break;
        }
      }
    });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  // Helper method to parse form schema
  parseFormSchema(schema: any): any {
    if (!schema) {
      return { title: '', description: '', fields: [] };
    }

    try {
      if (typeof schema === 'string') {
        return JSON.parse(schema);
      }
      return schema;
    } catch (error) {
      console.error('Error parsing form schema:', error);
      return { title: '', description: '', fields: [] };
    }
  }

  // Helper to get form fields from schema
  getFormFields(form: Form): any[] {
    try {
      const schema = this.parseFormSchema(form.schema);
      return schema?.fields || [];
    } catch (error) {
      console.error('Error getting form fields:', error);
      return [];
    }
  }
}

export const supabaseService = new SupabaseService();