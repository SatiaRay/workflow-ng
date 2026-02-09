import { BaseSupabaseService } from './base-service';
import type { FormResponse, Filter, PaginatedResponse } from './types';

export class ResponseService extends BaseSupabaseService {
  async getFormResponses(formId: string | number): Promise<FormResponse[]> {
    const { data, error } = await this.supabase
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, 'getFormResponses');
    return data || [];
  }

  async getResponseById(responseId: string | number): Promise<FormResponse | null> {
    const { data, error } = await this.supabase
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
    const { data: response, error } = await this.supabase
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

    if (error) this.handleError(error, 'submitFormResponse');
    return response;
  }

  async updateResponse(responseId: string | number, data: Record<string, any>): Promise<FormResponse | null> {
    const { data: response, error } = await this.supabase
      .from('responses')
      .update({
        data: data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) this.handleError(error, 'updateResponse');
    return response;
  }

  async deleteResponse(responseId: string | number): Promise<void> {
    const { error } = await this.supabase
      .from('responses')
      .delete()
      .eq('id', responseId);

    if (error) this.handleError(error, 'deleteResponse');
  }

  // Get responses with filters and pagination
  async getFormResponsesWithFilters(
    formId: string | number,
    filters: Record<string, Filter>,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<FormResponse>> {
    let query = this.supabase
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
        query = this.buildJsonFilter(query, fieldName, filter);
      }
    });

    // Apply pagination
    query = this.applyPagination(query, page, pageSize);

    const { data, error, count } = await query;

    if (error) this.handleError(error, 'getFormResponsesWithFilters');

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}