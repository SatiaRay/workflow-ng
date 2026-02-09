// services/user-service.ts
import { BaseSupabaseService } from './base-service';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  role_id?: number;
  role?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at?: string;
}

export class UserService extends BaseSupabaseService {
  async getProfiles(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch users with role data using a join
      const { data, error, count } = await this.supabase
        .from('profiles')
        .select(`
          *,
          role:roles (
            id,
            name
          )
        `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error in getProfiles:', error);
      throw error;
    }
  }
}