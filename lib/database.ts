import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'crm_system',
  timezone: '+00:00',
  charset: 'utf8mb4',
};

// Create connection pool for better performance
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove invalid options that cause warnings
  // acquireTimeout: 60000,
  // timeout: 60000,
});

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