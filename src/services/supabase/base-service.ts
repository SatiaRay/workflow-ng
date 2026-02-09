import { supabase } from "@/lib/supabase-client";

export abstract class BaseSupabaseService {
  protected supabase = supabase;

  // Common error handler
  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);
    throw new Error(`${context}: ${error.message || 'Unknown error'}`);
  }

  // Common pagination helper
  protected applyPagination(
    query: any,
    page: number = 1,
    pageSize: number = 10
  ) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return query.range(from, to);
  }

  // JSON helper methods
  protected parseJsonField<T>(data: any, fieldName: string): T {
    if (!data || !data[fieldName]) return {} as T;
    
    try {
      if (typeof data[fieldName] === 'string') {
        return JSON.parse(data[fieldName]) as T;
      }
      return data[fieldName] as T;
    } catch (error) {
      console.error(`Error parsing ${fieldName}:`, error);
      return {} as T;
    }
  }

  // Build JSON query filter
  protected buildJsonFilter(
    query: any,
    fieldName: string,
    filter: Filter,
    fieldType?: string
  ) {
    const isTextType = fieldType === 'text' || 
                      fieldType === 'email' || 
                      fieldType === 'textarea' ||
                      (fieldType === undefined && typeof filter.value === 'string');
    
    const jsonPath = isTextType
      ? `data->>${fieldName}`
      : `data->${fieldName}`;

    if (!filter.value || filter.value === '' || filter.value === null || filter.value === undefined) {
      return query;
    }

    switch (filter.operator) {
      case 'contains':
        return query.filter(jsonPath, 'ilike', `%${filter.value}%`);
      case 'equals':
        return query.filter(jsonPath, 'eq', filter.value);
      case 'isTrue':
        return query.filter(jsonPath, 'eq', true);
      case 'isFalse':
        return query.filter(jsonPath, 'eq', false);
      case 'greaterThan':
        return query.filter(jsonPath, 'gt', filter.value);
      case 'lessThan':
        return query.filter(jsonPath, 'lt', filter.value);
      case 'startsWith':
        return query.filter(jsonPath, 'ilike', `${filter.value}%`);
      case 'endsWith':
        return query.filter(jsonPath, 'ilike', `%${filter.value}`);
      default:
        return query.filter(jsonPath, 'eq', filter.value);
    }
  }

  // Fetch helper for API calls (for user services that need edge functions)
  protected async fetchApi<T>(
    endpoint: string,
    body: any
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Re-export Filter type for backward compatibility
export interface Filter {
  operator: string;
  value: any;
}