import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET /api/customers/[id] - Get customer details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const { id: customerId } = await params;

        // Get customer basic info (simplified)
        const [customer] = await executeQuery(`
      SELECT c.*, u.name as assigned_user_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `, [customerId]);

        if (!customer) {
            return NextResponse.json(
                { success: false, message: 'مشتری یافت نشد' },
                { status: 404 }
            );
        }

        // Check permission
        if (!hasPermission(userRole || '', ['ceo', 'مدیر']) && customer.assigned_to !== userId) {
            return NextResponse.json(
                { success: false, message: 'دسترسی غیرمجاز' },
                { status: 403 }
            );
        }

        // Get additional data separately (simplified)
        let currentDeal = null;
        let activities = [];
        let contacts = [];
        let tags = [];

        try {
            // Get current deal
            const dealResults = await executeQuery(`
                SELECT d.*, ps.name as stage_name, ps.code as stage_code
                FROM deals d
                LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
                WHERE d.customer_id = ?
                ORDER BY d.created_at DESC
                LIMIT 1
            `, [customerId]);
            currentDeal = dealResults.length > 0 ? dealResults[0] : null;
        } catch (error) {
            console.log('Error loading deals:', error instanceof Error ? error.message : 'Unknown error');
        }

        try {
            // Get recent activities
            activities = await executeQuery(`
                SELECT a.*, u.name as performed_by_name
                FROM activities a
                LEFT JOIN users u ON a.performed_by = u.id
                WHERE a.customer_id = ?
                ORDER BY a.created_at DESC
                LIMIT 10
            `, [customerId]);
        } catch (error) {
            console.log('Error loading activities:', error instanceof Error ? error.message : 'Unknown error');
        }

        try {
            // Get contacts
            contacts = await executeQuery(`
                SELECT * FROM contacts 
                WHERE customer_id = ?
                ORDER BY is_primary DESC, created_at DESC
            `, [customerId]);
        } catch (error) {
            console.log('Error loading contacts:', error instanceof Error ? error.message : 'Unknown error');
        }

        try {
            // Get customer tags
            const tagResults = await executeQuery(`
                SELECT tag FROM customer_tags 
                WHERE customer_id = ?
            `, [customerId]);
            tags = tagResults;
        } catch (error) {
            console.log('Error loading tags:', error instanceof Error ? error.message : 'Unknown error');
        }

        // Simple sales pipeline
        let salesPipeline = null;
        if (currentDeal) {
            salesPipeline = {
                id: currentDeal.id,
                currentStage: currentDeal.stage_code,
                currentStageName: currentDeal.stage_name,
                dealValue: currentDeal.total_value,
                successProbability: currentDeal.probability || 0,
                lastContact: activities.length > 0 ? activities[0].created_at : null
            };
        }

        const result = {
            ...customer,
            salesPipeline,
            activities,
            contacts,
            tags: tags.map(t => t.tag)
        };

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get customer details API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت جزئیات مشتری' },
            { status: 500 }
        );
    }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const { id: customerId } = await params;
        const body = await req.json();

        // Check if customer exists and user has permission
        const [customer] = await executeQuery(`
      SELECT * FROM customers WHERE id = ?
    `, [customerId]);

        if (!customer) {
            return NextResponse.json(
                { success: false, message: 'مشتری یافت نشد' },
                { status: 404 }
            );
        }

        if (!hasPermission(userRole || '', ['ceo', 'مدیر']) && customer.assigned_to !== userId) {
            return NextResponse.json(
                { success: false, message: 'دسترسی غیرمجاز' },
                { status: 403 }
            );
        }

        // Update customer
        const allowedFields = [
            'name', 'email', 'phone', 'website', 'address', 'city', 'state', 'country',
            'industry', 'company_size', 'annual_revenue', 'segment', 'priority', 'status', 'assigned_to'
        ];

        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(body)) {
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

        updateFields.push('updated_at = NOW()');
        updateValues.push(customerId);

        await executeSingle(
            `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'مشتری با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update customer API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی مشتری' },
            { status: 500 }
        );
    }
}