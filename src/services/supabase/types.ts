// Form types
export interface Form {
  id: number;
  title: string;
  description?: string | null;
  schema: any;
  created_at: string;
  updated_at?: string;
  nodeId?: string;
}

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

// User types
export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  is_active: boolean;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  is_active?: boolean;
}

// User filter types
export interface UserFilters {
  search: string;
  role: string;
  status: string;
}