-- =====================================================
-- CRM System Migration to Supabase
-- تبدیل دیتابیس MySQL به Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. جدول کاربران (Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ایجاد indexes برای users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =====================================================
-- 2. جدول مشتریان (Customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Iran',
    postal_code VARCHAR(20),
    industry VARCHAR(100),
    company_size VARCHAR(20),
    annual_revenue DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'prospect',
    segment VARCHAR(20) DEFAULT 'small_business',
    priority VARCHAR(10) DEFAULT 'medium',
    assigned_to UUID,
    total_tickets INTEGER DEFAULT 0,
    satisfaction_score DECIMAL(3,2),
    potential_value DECIMAL(15,2),
    actual_value DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP,
    last_contact_date TIMESTAMP,
    contact_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ایجاد indexes برای customers
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- =====================================================
-- 3. جدول فعالیت‌ها (Activities)  
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    deal_id UUID,
    type VARCHAR(50) DEFAULT 'call',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,
    performed_by UUID NOT NULL,
    outcome VARCHAR(50) DEFAULT 'completed',
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- =====================================================
-- 4. جدول معاملات (Deals)
-- =====================================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'IRR',
    stage_id UUID NOT NULL,
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    actual_close_date DATE,
    assigned_to UUID NOT NULL,
    loss_reason TEXT,
    won_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_stage_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    sales_notes TEXT,
    customer_budget DECIMAL(15,2),
    decision_maker VARCHAR(255),
    competition_info TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- =====================================================
-- 5. جدول مراحل فروش (Pipeline Stages)
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    stage_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    color VARCHAR(7) DEFAULT '#3B82F6'
);

-- =====================================================
-- 6. جدول محصولات (Products)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    specifications TEXT,
    base_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IRR',
    is_active BOOLEAN DEFAULT true,
    inventory INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. جدول فروش (Sales)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IRR',
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(100),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP,
    payment_due_date TIMESTAMP,
    notes TEXT,
    invoice_number VARCHAR(100),
    sales_person_id UUID NOT NULL,
    sales_person_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sales_person_id) REFERENCES users(id)
);

-- =====================================================
-- 8. جدول آیتم‌های فروش (Sale Items)
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- 9. جدول وظایف (Tasks)
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID,
    deal_id UUID,
    assigned_to UUID NOT NULL,
    assigned_by UUID NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    category VARCHAR(20) DEFAULT 'follow_up',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    completion_notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- =====================================================
-- 10. جدول پیام‌های چت (Chat Messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- =====================================================
-- 11. جدول ماژول‌ها (Modules)
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    route VARCHAR(200),
    icon VARCHAR(50) DEFAULT 'LayoutDashboard',
    sort_order INTEGER DEFAULT 0,
    parent_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. جدول مجوزها (Permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. جدول مجوزهای ماژول کاربران (User Module Permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_module_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    module_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    UNIQUE(user_id, module_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- =====================================================
-- 14. جدول گزارش‌های روزانه (Daily Reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    report_date DATE NOT NULL,
    persian_date VARCHAR(20) NOT NULL,
    work_description TEXT NOT NULL,
    completed_tasks TEXT,
    working_hours DECIMAL(4,2),
    challenges TEXT,
    achievements TEXT,
    status VARCHAR(20) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- 15. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 16. ایجاد داده‌های اولیه (Initial Data)
-- =====================================================

-- افزودن کاربر پیش‌فرض CEO
INSERT INTO users (id, name, email, password_hash, role, status) 
VALUES (
    'ceo-001'::uuid, 
    'مدیر عامل سیستم', 
    'ceo@company.com', 
    '$2b$10$defaulthashedpassword', 
    'ceo', 
    'active'
) ON CONFLICT (id) DO NOTHING;

-- افزودن مجوزهای پیش‌فرض
INSERT INTO permissions (id, name, display_name, description) VALUES
('50d56977-653a-11f0-92b6-e251efb8cddb'::uuid, 'read', 'مشاهده', NULL),
('50d56c82-653a-11f0-92b6-e251efb8cddb'::uuid, 'create', 'ایجاد', NULL),
('50d56ce8-653a-11f0-92b6-e251efb8cddb'::uuid, 'update', 'ویرایش', NULL),
('50d56e9a-653a-11f0-92b6-e251efb8cddb'::uuid, 'delete', 'حذف', NULL),
('50d56ef8-653a-11f0-92b6-e251efb8cddb'::uuid, 'manage', 'مدیریت', NULL)
ON CONFLICT (id) DO NOTHING;

-- افزودن مراحل فروش پیش‌فرض
INSERT INTO pipeline_stages (id, name, code, description, stage_order, is_active, color) VALUES
('252c6e8d-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'New Lead', 'new_lead', 'تماس اولیه', 1, true, '#10B981'),
('252c71b5-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Needs Assessment', 'needs_assessment', 'تشخیص نیاز', 2, true, '#3B82F6'),
('252c7309-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Product Presentation', 'product_presentation', 'معرفی محصول', 3, true, '#8B5CF6'),
('252c7408-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Proposal Sent', 'proposal_sent', 'ارسال پیشنهاد', 4, true, '#F59E0B'),
('252c7507-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Negotiation', 'negotiation', 'مذاکره', 5, true, '#EF4444'),
('252c75dd-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Closed Won', 'closed_won', 'فروش موفق', 6, true, '#059669'),
('252c76ae-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Closed Lost', 'closed_lost', 'فروش رد شده', 7, true, '#DC2626'),
('252c7783-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'Delivery', 'delivery', 'تحویل محصول', 8, true, '#7C3AED'),
('252c78c2-69f8-11f0-92a7-e251ebaa91d8'::uuid, 'After Sales', 'after_sales', 'پشتیبانی', 9, true, '#0891B2')
ON CONFLICT (id) DO NOTHING;

-- افزودن ماژول‌های پیش‌فرض
INSERT INTO modules (id, name, display_name, description, route, icon, sort_order, is_active) VALUES
('2f9bd793-6678-11f0-9334-e4580a2bbc2b'::uuid, 'dashboard', 'داشبورد', 'صفحه اصلی سیستم', '/dashboard', 'LayoutDashboard', 1, true),
('2f9bdb02-6678-11f0-9334-e4580a2bbc2b'::uuid, 'customers', 'مشتریان', 'مدیریت مشتریان', '/dashboard/customers', 'Users', 2, true),
('2f9bdbbe-6678-11f0-9334-e4580a2bbc2b'::uuid, 'contacts', 'مخاطبین', 'مدیریت مخاطبین', '/dashboard/contacts', 'UserCheck', 3, true),
('2f9bdc15-6678-11f0-9334-e4580a2bbc2b'::uuid, 'coworkers', 'همکاران', 'مدیریت همکاران', '/dashboard/coworkers', 'Users2', 4, true),
('2f9bdc68-6678-11f0-9334-e4580a2bbc2b'::uuid, 'activities', 'فعالیت‌ها', 'مدیریت فعالیت‌ها', '/dashboard/activities', 'Activity', 5, true),
('2f9bde49-6678-11f0-9334-e4580a2bbc2b'::uuid, 'sales', 'ثبت فروش', 'ثبت و مدیریت فروش', '/dashboard/sales', 'TrendingUp', 8, true),
('2f9bde98-6678-11f0-9334-e4580a2bbc2b'::uuid, 'products', 'محصولات', 'مدیریت محصولات', '/dashboard/products', 'Package', 9, true),
('2f9bdd4b-6678-11f0-9334-e4580a2bbc2b'::uuid, 'tasks', 'وظایف', 'مدیریت وظایف', '/dashboard/tasks', 'CheckSquare', 7, true),
('2f9be1e2-6678-11f0-9334-e4580a2bbc2b'::uuid, 'reports', 'گزارش‌ها', 'گزارش‌های سیستم', '/dashboard/reports', 'FileText', 22, true),
('2f9be23b-6678-11f0-9334-e4580a2bbc2b'::uuid, 'settings', 'تنظیمات عمومی', 'تنظیمات سیستم', '/dashboard/settings', 'Settings', 24, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 17. Functions & Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- اعمال trigger برای جداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();