import type { Form } from '@/types/form';
import { BaseSupabaseService } from './base-service';

export class FormService extends BaseSupabaseService {
  async getForms(): Promise<Form[]> {
    const { data, error } = await this.supabase
      .from("forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) this.handleError(error, "getForms");

    return (data || []).map((form: any) => ({
      ...form,
      nodeId: `form_${form.id}`,
    }));
  }

  async getNotUsedInWorkflowForms(): Promise<Form[]> {
    // Get all form IDs that are used in any workflow
    const { data: usedFormIds, error: usedFormsError } = await this.supabase
      .from("workflow_forms")
      .select("form_id");

    if (usedFormsError)
      this.handleError(
        usedFormsError,
        "getNotUsedInWorkflowForms - getting used forms",
      );

    const usedIds = usedFormIds?.map((item) => item.form_id) || [];

    // If there are used forms, exclude them; otherwise, get all forms
    let query = this.supabase
      .from("forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (usedIds.length > 0) {
      query = query.not("id", "in", `(${usedIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) this.handleError(error, "getNotUsedInWorkflowForms");

    return (data || []).map((form: any) => ({
      ...form,
      nodeId: `form_${form.id}`,
    }));
  }

  async getFormById(id: string | number): Promise<Form | null> {
    const { data, error } = await this.supabase
      .from("forms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching form:", error);
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
    const { data, error } = await this.supabase
      .from("forms")
      .insert([
        {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) this.handleError(error, "createForm");

    if (!data) return null;

    return {
      ...data,
      nodeId: `form_${data.id}`,
    };
  }

  async updateForm(
    id: string | number,
    formData: {
      title?: string;
      description?: string | null;
      schema?: any;
    },
  ): Promise<Form | null> {
    const { data, error } = await this.supabase
      .from("forms")
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error, "updateForm");

    if (!data) return null;

    return {
      ...data,
      nodeId: `form_${data.id}`,
    };
  }

  async deleteForm(id: string | number): Promise<void> {
    const { error } = await this.supabase.from("forms").delete().eq("id", id);

    if (error) this.handleError(error, "deleteForm");
  }

  // Helper method to parse form schema
  parseFormSchema(schema: any): any {
    if (!schema) {
      return { title: "", description: "", fields: [] };
    }

    try {
      if (typeof schema === "string") {
        return JSON.parse(schema);
      }
      return schema;
    } catch (error) {
      console.error("Error parsing form schema:", error);
      return { title: "", description: "", fields: [] };
    }
  }

  // Helper to get form fields from schema
  getFormFields(form: Form): any[] {
    try {
      const schema = this.parseFormSchema(form.schema);
      return schema?.fields || [];
    } catch (error) {
      console.error("Error getting form fields:", error);
      return [];
    }
  }
}
