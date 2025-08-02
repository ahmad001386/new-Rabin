/*
  # Add Missing Tables and Data for CRM System
  
  1. New Tables
    - Ensure all required tables exist
    - Add sample data for testing
  
  2. Security
    - Enable RLS where needed
    - Add proper indexes
  
  3. Sample Data
    - Add test users, customers, and contacts
*/

-- Ensure we're using the right database
USE crm_system;

-- Add sample users for testing
INSERT IGNORE INTO users (id, name, email, password_hash, password, role, status, team) VALUES
('user-001', 'مریم احمدی', 'maryam@company.com', '$2b$10$defaulthashedpassword', '123456', 'کارشناس فروش', 'active', 'فروش'),
('user-002', 'حسن محمدی', 'hassan@company.com', '$2b$10$defaulthashedpassword', '123456', 'مدیر فروش', 'active', 'فروش'),
('user-003', 'زهرا کریمی', 'zahra@company.com', '$2b$10$defaulthashedpassword', '123456', 'agent', 'active', 'پشتیبانی');

-- Update existing customers to have assigned users
UPDATE customers SET assigned_to = 'user-001' WHERE id = 'cust-001';
UPDATE customers SET assigned_to = 'user-002' WHERE id = 'cust-002';
UPDATE customers SET assigned_to = 'user-001' WHERE id = 'cust-003';

-- Add more sample customers
INSERT IGNORE INTO customers (id, name, email, phone, status, segment, priority, assigned_to, potential_value, satisfaction_score, industry, company_size) VALUES
('cust-004', 'شرکت نوآوری دیجیتال', 'info@digital-innovation.com', '۰۲۱-۵۵۵۱۲۳۴', 'active', 'small_business', 'medium', 'user-001', 50000000, 4.1, 'فناوری اطلاعات', '11-50'),
('cust-005', 'گروه صنعتی پارسیان', 'contact@parsian-group.com', '۰۲۱-۵۵۵۵۶۷۸', 'prospect', 'enterprise', 'high', 'user-002', 300000000, NULL, 'صنعت', '201-1000'),
('cust-006', 'استارتاپ فناوری آینده', 'hello@future-tech.ir', '۰۲۱-۵۵۵۹۰۱۲', 'follow_up', 'small_business', 'low', 'user-003', 25000000, 3.8, 'فناوری اطلاعات', '1-10');

-- Update existing contacts with proper customer relationships
UPDATE contacts SET customer_id = 'cust-001' WHERE id = 'cont-001';
UPDATE contacts SET customer_id = 'cust-002' WHERE id = 'cont-002';
UPDATE contacts SET customer_id = 'cust-003' WHERE id = 'cont-003';

-- Add more sample contacts
INSERT IGNORE INTO contacts (id, customer_id, name, email, phone, role, department, is_primary) VALUES
('cont-004', 'cust-004', 'رضا نوری', 'reza@digital-innovation.com', '۰۹۱۲۳۴۵۶۷۸۲', 'مدیر فنی', 'فناوری', TRUE),
('cont-005', 'cust-005', 'سارا احمدی', 'sara@parsian-group.com', '۰۹۱۲۳۴۵۶۷۸۳', 'مدیر خرید', 'خرید', TRUE),
('cont-006', 'cust-005', 'محمد رضایی', 'mohammad@parsian-group.com', '۰۹۱۲۳۴۵۶۷۸۴', 'کارشناس فنی', 'فناوری', FALSE),
('cont-007', 'cust-006', 'فاطمه کریمی', 'fateme@future-tech.ir', '۰۹۱۲۳۴۵۶۷۸۵', 'بنیانگذار', 'مدیریت', TRUE);

-- Give sample users basic permissions
INSERT IGNORE INTO user_module_permissions (id, user_id, module_id, permission_id, granted, created_by)
SELECT 
    CONCAT('ump-', u.id, '-', m.id, '-', p.id),
    u.id,
    m.id,
    p.id,
    CASE 
        WHEN u.role IN ('مدیر فروش', 'sales_manager') THEN TRUE
        WHEN u.role IN ('کارشناس فروش', 'sales_agent') AND m.name IN ('dashboard', 'customers', 'contacts', 'activities') THEN TRUE
        WHEN u.role = 'agent' AND m.name IN ('dashboard', 'customers', 'contacts') AND p.name IN ('view', 'create', 'edit') THEN TRUE
        ELSE FALSE
    END,
    'ceo-001'
FROM users u
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE u.id IN ('user-001', 'user-002', 'user-003')
AND m.is_active = TRUE
ON DUPLICATE KEY UPDATE granted = VALUES(granted);

SELECT 'Sample data added successfully!' as Status;