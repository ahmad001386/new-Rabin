import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET /api/contacts/[id]/activities - Get activities for a specific contact
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const contactId = params.id;

        if (!contactId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مخاطب الزامی است' },
                { status: 400 }
            );
        }

        // Check if contact exists
        const contact = await executeQuery('SELECT id FROM contacts WHERE id = ?', [contactId]);
        if (contact.length === 0) {
            return NextResponse.json(
                { success: false, message: 'مخاطب یافت نشد' },
                { status: 404 }
            );
        }

        const activities = await executeQuery(`
            SELECT 
                ca.*,
                u.name as assigned_user_name,
                creator.name as created_by_name
            FROM contact_activities ca
            LEFT JOIN users u ON ca.assigned_to = u.id
            LEFT JOIN users creator ON ca.created_by = creator.id
            WHERE ca.contact_id = ?
            ORDER BY ca.created_at DESC
        `, [contactId]);

        return NextResponse.json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error('Get contact activities API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت فعالیت‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/contacts/[id]/activities - Create a new activity for a contact
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const contactId = params.id;
        const body = await req.json();
        const {
            activity_type,
            title,
            description,
            status = 'completed',
            priority = 'medium',
            due_date,
            duration_minutes,
            outcome,
            next_action
        } = body;

        // Validation
        if (!contactId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مخاطب الزامی است' },
                { status: 400 }
            );
        }

        if (!activity_type || !title) {
            return NextResponse.json(
                { success: false, message: 'نوع فعالیت و عنوان الزامی است' },
                { status: 400 }
            );
        }

        // Check if contact exists
        const contact = await executeQuery(
            'SELECT id, company_id FROM contacts WHERE id = ?',
            [contactId]
        );

        if (contact.length === 0) {
            return NextResponse.json(
                { success: false, message: 'مخاطب یافت نشد' },
                { status: 404 }
            );
        }

        const activityId = generateUUID();
        // Format date for MySQL compatibility (YYYY-MM-DD HH:MM:SS)
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // For now, we'll use a default user ID (should be from session)
        const defaultUserId = '1'; // This should come from authentication

        const completedAt = status === 'completed' ? now : null;

        const result = await executeSingle(`
            INSERT INTO contact_activities (
                id, contact_id, company_id, activity_type, title, description,
                status, priority, due_date, completed_at, duration_minutes,
                outcome, next_action, assigned_to, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            activityId, contactId, contact[0].company_id, activity_type, title, description || null,
            status, priority, due_date || null, completedAt, duration_minutes || null,
            outcome || null, next_action || null, defaultUserId, defaultUserId, now, now
        ]);

        // Update contact's last_contact_date if this is a completed interaction
        if (status === 'completed' && ['call', 'email', 'meeting'].includes(activity_type)) {
            await executeSingle(
                'UPDATE contacts SET last_contact_date = ?, updated_at = ? WHERE id = ?',
                [now.split('T')[0], now, contactId]
            );
        }

        return NextResponse.json({
            success: true,
            message: 'فعالیت با موفقیت اضافه شد',
            data: { id: activityId }
        });

    } catch (error) {
        console.error('Create contact activity API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد فعالیت' },
            { status: 500 }
        );
    }
}

// PUT /api/contacts/[id]/activities - Update an activity
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const contactId = params.id;
        const body = await req.json();
        const { activityId, ...updateData } = body;

        if (!contactId || !activityId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مخاطب و فعالیت الزامی است' },
                { status: 400 }
            );
        }

        // Check if activity exists and belongs to this contact
        const existingActivity = await executeQuery(
            'SELECT id FROM contact_activities WHERE id = ? AND contact_id = ?',
            [activityId, contactId]
        );

        if (existingActivity.length === 0) {
            return NextResponse.json(
                { success: false, message: 'فعالیت یافت نشد' },
                { status: 404 }
            );
        }

        // Build update query dynamically
        const allowedFields = [
            'activity_type', 'title', 'description', 'status', 'priority',
            'due_date', 'completed_at', 'duration_minutes', 'outcome', 'next_action'
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

        // If status is being changed to completed and wasn't completed before, set completed_at
        if (updateData.status === 'completed' && !updateFields.find(f => f.includes('completed_at'))) {
            updateFields.push('completed_at = ?');
            // Format date for MySQL compatibility
            updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
        }

        updateFields.push('updated_at = ?');
        // Format date for MySQL compatibility
        updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
        updateValues.push(activityId);

        await executeSingle(
            `UPDATE contact_activities SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'فعالیت با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update contact activity API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی فعالیت' },
            { status: 500 }
        );
    }
}

// DELETE /api/contacts/[id]/activities - Delete an activity
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const contactId = params.id;
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('activityId');

        if (!contactId || !activityId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مخاطب و فعالیت الزامی است' },
                { status: 400 }
            );
        }

        // Check if activity exists and belongs to this contact
        const existingActivity = await executeQuery(
            'SELECT id FROM contact_activities WHERE id = ? AND contact_id = ?',
            [activityId, contactId]
        );

        if (existingActivity.length === 0) {
            return NextResponse.json(
                { success: false, message: 'فعالیت یافت نشد' },
                { status: 404 }
            );
        }

        // Delete the activity
        await executeSingle('DELETE FROM contact_activities WHERE id = ?', [activityId]);

        return NextResponse.json({
            success: true,
            message: 'فعالیت با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete contact activity API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف فعالیت' },
            { status: 500 }
        );
    }
}