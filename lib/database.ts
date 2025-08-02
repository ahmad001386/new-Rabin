import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Execute query with error handling (Supabase style)
export async function executeQuery<T = any>(
  tableName: string,
  options: {
    select?: string;
    filter?: any;
    order?: any;
    limit?: number;
  } = {}
): Promise<T[]> {
  try {
    let query = supabase.from(tableName);
    
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }
    
    if (options.filter) {
      Object.keys(options.filter).forEach(key => {
        query = query.eq(key, options.filter[key]);
      });
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending || false });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute single operation (for inserts, updates, deletes)
export async function executeSingle(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  data?: any,
  filter?: any
): Promise<any> {
  try {
    let query;
    
    switch (operation) {
      case 'insert':
        query = supabase.from(tableName).insert(data);
        break;
      case 'update':
        query = supabase.from(tableName).update(data);
        if (filter) {
          Object.keys(filter).forEach(key => {
            query = query.eq(key, filter[key]);
          });
        }
        break;
      case 'delete':
        query = supabase.from(tableName);
        if (filter) {
          Object.keys(filter).forEach(key => {
            query = query.eq(key, filter[key]);
          });
        }
        query = query.delete();
        break;
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      console.error('Supabase operation error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Database operation error:', error);
    throw new Error('Database operation failed');
  }
}