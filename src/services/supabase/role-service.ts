// services/role-service.ts
import { BaseSupabaseService } from './base-service';

export interface Role {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export class RoleService extends BaseSupabaseService {
  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRoles:', error);
      throw error;
    }
  }

  async createRole(name: string): Promise<Role> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .insert([{ name }])
        .select()
        .single();

      if (error) {
        console.error('Error creating role:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createRole:', error);
      throw error;
    }
  }

  async updateRole(id: number, name: string): Promise<Role> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateRole:', error);
      throw error;
    }
  }

  async deleteRole(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting role:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteRole:', error);
      throw error;
    }
  }
}