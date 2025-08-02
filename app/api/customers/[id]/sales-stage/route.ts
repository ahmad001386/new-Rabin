import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// PUT /api/customers/[id]/sales-stage - Update sales pipeline stage
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const customerId = params.id;
        const { stageId, notes } = await req.json();

        if (!stageId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مرحله الزامی است' },
                { status: 400 }
            );
        }

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

        // Get current active deal
        const [currentDeal] = await executeQuery(`
      SELECT * FROM deals 
      WHERE customer_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [customerId]);

        if (!currentDeal) {
            return NextResponse.json(
                { success: false, message: 'معامله فعالی برای این مشتری یافت نشد' },
                { status: 404 }
            );
        }

        // Get pipeline stages and find the target stage
        const pipelineStages = await executeQuery(`
      SELECT * FROM pipeline_stages 
      WHERE is_active = 1
      ORDER BY stage_order
    `);

        const targetStage = pipelineStages.find(s => s.stage_order.toString() === stageId);

        if (!targetStage) {
            return NextResponse.json(
                { success: false, message: 'مرحله یافت نشد' },
                { status: 404 }
            );
        }

        // Update deal stage
        await executeSingle(`
      UPDATE deals 
      SET stage_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [targetStage.id, currentDeal.id]);

        // Add activity log
        const activityId = require('uuid').v4();
        await executeSingle(`
      INSERT INTO activities (
        id, customer_id, type, title, description, performed_by, created_at
      ) VALUES (?, ?, 'stage_change', ?, ?, ?, NOW())
    `, [
            activityId,
            customerId,
            'stage_change',
            `تغییر مرحله فروش به ${targetStage.name}`,
            notes || `مرحله فروش از ${currentDeal.stage_name || 'نامشخص'} به ${targetStage.name} تغییر کرد`,
            userId
        ]);

        return NextResponse.json({
            success: true,
            message: 'مرحله فروش با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update sales stage API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی مرحله فروش' },
            { status: 500 }
        );
    }
}