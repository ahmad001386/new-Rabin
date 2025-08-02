import { supabase } from '../lib/database';

// نوع داده‌های مهم
interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: string;
  status: string;
  created_at?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  segment: string;
  priority: string;
  assigned_to?: string;
  created_at?: string;
}

// تابع آپلود کاربران
export async function migrateUsers(users: User[]) {
  console.log('Starting users migration...');
  
  for (const user of users) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      } else {
        console.log(`✅ User ${user.email} migrated successfully`);
      }
    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error);
    }
  }
  
  console.log('Users migration completed!');
}

// تابع آپلود مشتریان
export async function migrateCustomers(customers: Customer[]) {
  console.log('Starting customers migration...');
  
  for (const customer of customers) {
    try {
      const { error } = await supabase
        .from('customers')
        .upsert(customer, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error migrating customer ${customer.name}:`, error);
      } else {
        console.log(`✅ Customer ${customer.name} migrated successfully`);
      }
    } catch (error) {
      console.error(`Error migrating customer ${customer.name}:`, error);
    }
  }
  
  console.log('Customers migration completed!');
}

// تابع تست اتصال
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// تابع آپلود داده‌های نمونه
export async function uploadSampleData() {
  console.log('Uploading sample data...');
  
  // داده‌های نمونه کاربران
  const sampleUsers: User[] = [
    {
      id: 'ceo-001',
      name: 'مدیر عامل سیستم',
      email: 'ceo@company.com',
      password_hash: '$2b$10$defaulthashedpassword',
      role: 'ceo',
      status: 'active'
    }
  ];
  
  // داده‌های نمونه مشتریان
  const sampleCustomers: Customer[] = [
    {
      id: 'cust-001',
      name: 'شرکت آکمه',
      email: 'contact@acme.com',
      phone: '۰۲۱-۱۲۳۴۵۶۷۸',
      status: 'active',
      segment: 'enterprise',
      priority: 'high',
      assigned_to: 'ceo-001'
    }
  ];
  
  await migrateUsers(sampleUsers);
  await migrateCustomers(sampleCustomers);
  
  console.log('Sample data upload completed!');
}

// اجرای migration
if (require.main === module) {
  testSupabaseConnection()
    .then(connected => {
      if (connected) {
        return uploadSampleData();
      } else {
        console.error('Cannot proceed with migration - connection failed');
      }
    })
    .catch(error => {
      console.error('Migration failed:', error);
    });
}