import { BaseSupabaseService } from './base-service';
import type { User } from './types';

export class UserService extends BaseSupabaseService {
  async getProfiles(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false }); // Optional: order by creation date

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