import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;
        console.log('=== SIMPLE CUSTOMER DEBUG ===');
        console.log('Customer ID:', customerId);

        // Simple query first
        console.log('Step 1: Basic customer query...');
        const [customer] = await executeQuery(`
            SELECT * FROM customers WHERE id = ?
        `, [customerId]);

        if (!customer) {
            console.log('Customer not found');
            return NextResponse.json(
                { success: false, message: 'مشتری یافت نشد' },
                { status: 404 }
            );
        }

        console.log('Step 1: ✅ Basic customer found:', customer.name);

        // Test JOIN with users
        console.log('Step 2: JOIN with users...');
        const [customerWithUser] = await executeQuery(`
            SELECT c.*, u.name as assigned_user_name
            FROM customers c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE c.id = ?
        `, [customerId]);

        console.log('Step 2: ✅ Customer with user:', customerWithUser ? 'OK' : 'FAILED');

        // Test JOIN with deals
        console.log('Step 3: JOIN with deals...');
        const dealsResult = await executeQuery(`
            SELECT COUNT(*) as deal_count
            FROM deals d
            WHERE d.customer_id = ?
        `, [customerId]);

        console.log('Step 3: ✅ Deals count:', dealsResult[0].deal_count);

        // Test JOIN with activities  
        console.log('Step 4: JOIN with activities...');
        const activitiesResult = await executeQuery(`
            SELECT COUNT(*) as activity_count
            FROM activities a
            WHERE a.customer_id = ?
        `, [customerId]);

        console.log('Step 4: ✅ Activities count:', activitiesResult[0].activity_count);

        return NextResponse.json({
            success: true,
            data: {
                customer: customerWithUser,
                deals: dealsResult[0].deal_count,
                activities: activitiesResult[0].activity_count
            }
        });

    } catch (error) {
        console.error('=== SIMPLE CUSTOMER ERROR ===');
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error code:', (error as any)?.code);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        return NextResponse.json(
            { success: false, message: 'خطا در دریافت مشتری', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}