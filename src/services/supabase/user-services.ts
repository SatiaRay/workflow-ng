import { BaseSupabaseService } from './base-service';
import type { User, CreateUserData, UpdateUserData, UserFilters } from './types';

export class UserService extends BaseSupabaseService {
  // Get users with filters (via edge function)
  async getUsersWithFilters(
    filters: UserFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: User[]; total: number }> {
    try {
      return await this.fetchApi('/api/users', {
        action: 'list',
        filters,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get single user (via edge function)
  async getUserById(userId: string): Promise<User> {
    try {
      return await this.fetchApi('/api/users', {
        action: 'get',
        userId
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create user (via edge function)
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      return await this.fetchApi('/api/users', {
        action: 'create',
        userData
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user (via edge function)
  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      return await this.fetchApi('/api/users', {
        action: 'update',
        userId,
        userData
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (via edge function)
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.fetchApi('/api/users', {
        action: 'delete',
        userId
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    return this.updateUser(userId, { is_active: isActive });
  }

  // Alternative: Direct Supabase auth operations (if you have service role)
  // Note: These require service role key and should only be used in edge functions
  async getUsersDirect(): Promise<User[]> {
    const { data, error } = await this.supabase.auth.admin.listUsers();
    
    if (error) this.handleError(error, 'getUsersDirect');
    
    return data.users.map(user => ({
      id: user.id,
      email: user.email!,
      phone: user.phone,
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role || 'user',
      is_active: !user.banned,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
  }
}