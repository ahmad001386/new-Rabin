import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET /api/companies - Get all companies
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const industry = searchParams.get('industry');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
            SELECT 
                c.*,
                u.name as assigned_user_name,
                COUNT(contacts.id) as contacts_count
            FROM companies c
            LEFT JOIN users u ON c.assigned_to = u.id
            LEFT JOIN contacts ON c.id = contacts.company_id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }

        if (industry) {
            query += ' AND c.industry = ?';
            params.push(industry);
        }

        query += ' GROUP BY c.id ORDER BY c.name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const companies = await executeQuery(query, params);

        return NextResponse.json({
            success: true,
            data: companies
        });

    } catch (error) {
        console.error('Get companies API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت شرکت‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/companies - Create a new company
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            industry,
            size = 'small',
            website,
            phone,
            email,
            address,
            city,
            country = 'ایران',
            postal_code,
            description,
            status = 'prospect',
            annual_revenue,
            employee_count,
            founded_year
        } = body;

        // Validation
        if (!name) {
            return NextResponse.json(
                { success: false, message: 'نام شرکت الزامی است' },
                { status: 400 }
            );
        }

        // Check if company with same name already exists
        const existingCompany = await executeQuery(
            'SELECT id FROM companies WHERE name = ?',
            [name]
        );

        if (existingCompany.length > 0) {
            return NextResponse.json(
                { success: false, message: 'شرکتی با این نام قبلاً ثبت شده است' },
                { status: 400 }
            );
        }

        const companyId = generateUUID();
        // Format date for MySQL compatibility (YYYY-MM-DD HH:MM:SS)
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // For now, we'll use a default user ID (should be from session)
        const defaultUserId = '1'; // This should come from authentication

        const result = await executeSingle(`
            INSERT INTO companies (
                id, name, industry, size, website, phone, email,
                address, city, country, postal_code, description, status,
                annual_revenue, employee_count, founded_year,
                assigned_to, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            companyId, name, industry || null, size, website || null, phone || null, email || null,
            address || null, city || null, country, postal_code || null, description || null, status,
            annual_revenue || null, employee_count || null, founded_year || null,
            defaultUserId, defaultUserId, now, now
        ]);

        return NextResponse.json({
            success: true,
            message: 'شرکت با موفقیت اضافه شد',
            data: { id: companyId }
        });

    } catch (error) {
        console.error('Create company API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد شرکت' },
            { status: 500 }
        );
    }
}

// PUT /api/companies - Update a company
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'شناسه شرکت الزامی است' },
                { status: 400 }
            );
        }

        // Check if company exists
        const existingCompany = await executeQuery('SELECT id FROM companies WHERE id = ?', [id]);
        if (existingCompany.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شرکت یافت نشد' },
                { status: 404 }
            );
        }

        // Build update query dynamically
        const allowedFields = [
            'name', 'industry', 'size', 'website', 'phone', 'email',
            'address', 'city', 'country', 'postal_code', 'description',
            'status', 'annual_revenue', 'employee_count', 'founded_year',
            'assigned_to', 'rating'
        ];

        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { success: false, message: 'هیچ فیلد قابل به‌روزرسانی ارسال نشده است' },
                { status: 400 }
            );
        }

        updateFields.push('updated_at = ?');
        // Format date for MySQL compatibility
        updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
        updateValues.push(id);

        await executeSingle(
            `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'شرکت با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update company API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی شرکت' },
            { status: 500 }
        );
    }
}

// DELETE /api/companies - Delete a company
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'شناسه شرکت الزامی است' },
                { status: 400 }
            );
        }

        // Check if company exists
        const existingCompany = await executeQuery('SELECT id FROM companies WHERE id = ?', [id]);
        if (existingCompany.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شرکت یافت نشد' },
                { status: 404 }
            );
        }

        // Check if company has contacts
        const companyContacts = await executeQuery(
            'SELECT COUNT(*) as count FROM contacts WHERE company_id = ?',
            [id]
        );

        if (companyContacts[0].count > 0) {
            return NextResponse.json(
                { success: false, message: 'امکان حذف شرکت وجود ندارد. ابتدا مخاطبین مرتبط را حذف کنید.' },
                { status: 400 }
            );
        }

        // Delete the company
        await executeSingle('DELETE FROM companies WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'شرکت با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete company API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف شرکت' },
            { status: 500 }
        );
    }
}