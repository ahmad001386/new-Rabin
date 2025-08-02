import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/database';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting Supabase migration...');
    
    // تست اتصال
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${testError.message}`);
    }
    
    console.log('✅ Supabase connection successful');
    
    // ایجاد جدول کاربران (اگر وجود ندارد)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'sales_agent',
        status VARCHAR(20) DEFAULT 'active',
        avatar VARCHAR(500),
        phone VARCHAR(50),
        team VARCHAR(100),
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID
      );
    `;
    
    // اجرای query با استفاده از Supabase RPC (اگر امکان دارد)
    const { data: createResult, error: createError } = await supabaseAdmin
      .rpc('exec_sql', { sql: createUsersTable });
    
    if (createError) {
      console.log('Note: Could not create table via RPC, this is normal for hosted Supabase');
      console.log('Please run the migration SQL manually in Supabase dashboard');
    }
    
    // تست ایجاد یک کاربر نمونه
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: 'ceo-001',
        name: 'مدیر عامل سیستم',
        email: 'ceo@company.com',
        password_hash: '$2b$10$defaulthashedpassword',
        role: 'ceo',
        status: 'active'
      }, { onConflict: 'id' });
    
    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert sample data: ${insertError.message}`);
    }
    
    console.log('✅ Sample user created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data: {
        connection: 'success',
        sampleDataCreated: true
      }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // بررسی وضعیت اتصال و جداول
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('count')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Migration status checked',
      data: {
        usersTable: usersError ? 'not exists' : 'exists',
        customersTable: customersError ? 'not exists' : 'exists',
        connection: 'success'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}