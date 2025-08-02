import { createClient } from '@supabase/supabase-js';

// Supabase configuration - رایگان و remote قابل دسترسی
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully to crm_system');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');

    // Try to create database if it doesn't exist
    if ((error as any)?.code === 'ER_BAD_DB_ERROR') {
      try {
        const tempConnection = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
        });

        await tempConnection.execute('CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await tempConnection.end();
        console.log('✅ Database crm_system created successfully');
        return true;
      } catch (createError) {
        console.error('❌ Failed to create database:', createError instanceof Error ? createError.message : 'Unknown error');
      }
    }

    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute single query (for inserts, updates, deletes)
export async function executeSingle(
  query: string,
  params: any[] = []
): Promise<any> {
  try {
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}