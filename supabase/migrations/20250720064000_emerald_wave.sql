-- =====================================================
-- Initialize CRM Database with Required Tables and Data
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS crm_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE crm_system;

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    password VARCHAR(255), -- For development only
    role ENUM('ceo', 'sales_manager', 'sales_agent', 'agent', 'مدیر', 'کارشناس فروش', 'مدیر فروش') DEFAULT 'sales_agent',
    status ENUM('active', 'inactive', 'away', 'online', 'offline') DEFAULT 'active',
    avatar VARCHAR(500),
    phone VARCHAR(50),
    team VARCHAR(100),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Modules table (for permissions)
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id VARCHAR(36),
    route VARCHAR(255),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- User module permissions
CREATE TABLE IF NOT EXISTS user_module_permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    module_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    UNIQUE KEY unique_user_module_permission (user_id, module_id, permission_id),
    INDEX idx_user_id (user_id),
    INDEX idx_module_id (module_id),
    INDEX idx_permission_id (permission_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Iran',
    
    -- Business Info
    industry VARCHAR(100),
    company_size ENUM('1-10', '11-50', '51-200', '201-1000', '1000+'),
    annual_revenue DECIMAL(15,2),
    
    -- CRM Specific
    status ENUM('active', 'inactive', 'follow_up', 'rejected', 'prospect', 'customer') DEFAULT 'prospect',
    segment ENUM('enterprise', 'small_business', 'individual') DEFAULT 'small_business',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assigned_to VARCHAR(36),
    
    -- Metrics
    total_tickets INT DEFAULT 0,
    satisfaction_score DECIMAL(3,2),
    potential_value DECIMAL(15,2),
    actual_value DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_segment (segment),
    INDEX idx_priority (priority),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_email (email),
    INDEX idx_is_primary (is_primary),
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 2. INSERT DEFAULT DATA
-- =====================================================

-- Insert default CEO user
INSERT IGNORE INTO users (id, name, email, password_hash, password, role, status) VALUES
('ceo-001', 'مدیر عامل سیستم', 'ceo@company.com', '$2b$10$defaulthashedpassword', 'admin123', 'ceo', 'active');

-- Insert default permissions
INSERT IGNORE INTO permissions (id, name, display_name, description) VALUES
('perm-001', 'view', 'مشاهده', 'مشاهده اطلاعات'),
('perm-002', 'create', 'ایجاد', 'ایجاد رکورد جدید'),
('perm-003', 'edit', 'ویرایش', 'ویرایش اطلاعات موجود'),
('perm-004', 'delete', 'حذف', 'حذف اطلاعات'),
('perm-005', 'manage', 'مدیریت کامل', 'دسترسی کامل به ماژول');

-- Insert default modules
INSERT IGNORE INTO modules (id, name, display_name, description, route, icon, sort_order) VALUES
('mod-001', 'dashboard', 'داشبورد', 'صفحه اصلی سیستم', '/dashboard', 'LayoutDashboard', 1),
('mod-002', 'customers', 'مشتریان', 'مدیریت مشتریان', '/dashboard/customers', 'Users', 2),
('mod-003', 'contacts', 'مخاطبین', 'مدیریت مخاطبین', '/dashboard/contacts', 'Contact', 3),
('mod-004', 'users', 'کاربران', 'مدیریت کاربران سیستم', '/dashboard/coworkers', 'User', 4),
('mod-005', 'activities', 'فعالیت‌ها', 'مدیریت فعالیت‌ها', '/dashboard/activities', 'Activity', 5),
('mod-006', 'tasks', 'وظایف', 'مدیریت وظایف', '/dashboard/tasks', 'CheckCircle', 6),
('mod-007', 'projects', 'پروژه‌ها', 'مدیریت پروژه‌ها', '/dashboard/projects', 'Briefcase', 7),
('mod-008', 'reports', 'گزارش‌ها', 'مشاهده گزارش‌ها', '/dashboard/reports', 'BarChart3', 8),
('mod-009', 'settings', 'تنظیمات', 'تنظیمات سیستم', '/dashboard/settings', 'Settings', 9);

-- Give CEO full access to all modules
INSERT IGNORE INTO user_module_permissions (id, user_id, module_id, permission_id, granted, created_by)
SELECT 
    CONCAT('ump-', m.id, '-', p.id),
    'ceo-001',
    m.id,
    p.id,
    TRUE,
    'ceo-001'
FROM modules m
CROSS JOIN permissions p
WHERE m.is_active = TRUE;

-- Insert sample customers
INSERT IGNORE INTO customers (id, name, email, phone, status, segment, priority, assigned_to, potential_value, satisfaction_score) VALUES
('cust-001', 'شرکت آکمه', 'contact@acme.com', '۰۲۱-۱۲۳۴۵۶۷۸', 'follow_up', 'enterprise', 'high', 'ceo-001', 135000000, 4.5),
('cust-002', 'راه‌حل‌های فناوری پارس', 'info@parstech.com', '۰۲۱-۹۸۷۶۵۴۳۲', 'active', 'small_business', 'medium', 'ceo-001', 75000000, 4.2),
('cust-003', 'شرکت جهانی سپهر', 'support@sepehr.com', '۰۲۱-۴۵۶۷۸۹۰۱', 'active', 'enterprise', 'high', 'ceo-001', 200000000, 4.8);

-- Insert sample contacts
INSERT IGNORE INTO contacts (id, customer_id, name, email, phone, role, is_primary) VALUES
('cont-001', 'cust-001', 'احمد محمدی', 'ahmad@acme.com', '۰۹۱۲۳۴۵۶۷۸۹', 'مدیر فنی', TRUE),
('cont-002', 'cust-002', 'فاطمه رضایی', 'fateme@parstech.com', '۰۹۱۲۳۴۵۶۷۸۰', 'مدیر خرید', TRUE),
('cont-003', 'cust-003', 'علی کریمی', 'ali@sepehr.com', '۰۹۱۲۳۴۵۶۷۸۱', 'مدیرعامل', TRUE);

SELECT 'Database initialized successfully!' as Status;