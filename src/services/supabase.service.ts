// Re-export everything from the new modular structure
export * from './supabase';
export { supabaseService } from './supabase';

// For backward compatibility
import { supabaseService } from './supabase';
export default supabaseService;