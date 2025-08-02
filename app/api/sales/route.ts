import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/sales - Get all sales records
export async function GET(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        const customer_id = searchParams.get('customer_id') || '';
        const sales_person_id = searchParams.get('sales_person_id') || '';
        const payment_status = searchParams.get('payment_status') || '';
        const start_date = searchParams.get('start_date') || '';
        const end_date = searchParams.get('end_date') || '';

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // Permission check - agents can only see their own sales
        if (!hasPermission(userRole || '', ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
            whereClause += ' AND s.sales_person_id = ?';
            params.push(userId);
        }

        if (customer_id) {
            whereClause += ' AND s.customer_id = ?';
            params.push(customer_id);
        }

        if (sales_person_id) {
            whereClause += ' AND s.sales_person_id = ?';
            params.push(sales_person_id);
        }

        if (payment_status) {
            whereClause += ' AND s.payment_status = ?';
            params.push(payment_status);
        }

        if (start_date) {
            whereClause += ' AND DATE(s.sale_date) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(s.sale_date) <= ?';
            params.push(end_date);
        }

        // Get total count
        const [countResult] = await executeQuery(`
            SELECT COUNT(*) as total
            FROM sales s
            ${whereClause}
        `, params);

        // Get sales records
        const sales = await executeQuery(`
            SELECT 
                s.*,
                c.name as customer_name,
                u.name as sales_person_name,
                d.title as deal_title
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.sales_person_id = u.id
            LEFT JOIN deals d ON s.deal_id = d.id
            ${whereClause}
            ORDER BY s.sale_date DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get sale items for each sale
        for (let sale of sales) {
            const items = await executeQuery(`
                SELECT 
                    si.*,
                    p.name as product_name
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?
            `, [sale.id]);
            sale.items = items;
        }

        return NextResponse.json({
            success: true,
            data: {
                sales,
                pagination: {
                    page,
                    limit,
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get sales API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت فروش‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/sales - Create new sale record
export async function POST(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const userName = req.headers.get('x-user-name') || 'نامشخص';

        // Check permission
        if (!hasPermission(userRole || '', ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'sales_agent', 'کارشناس فروش'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            deal_id,
            customer_id,
            total_amount,
            currency = 'IRR',
            payment_status = 'pending',
            payment_method,
            delivery_date,
            payment_due_date,
            notes,
            invoice_number,
            items = []
        } = body;

        // Validation
        if (!deal_id || !customer_id || !total_amount || total_amount <= 0) {
            return NextResponse.json(
                { success: false, message: 'اطلاعات فروش ناقص است' },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'حداقل یک محصول باید انتخاب شود' },
                { status: 400 }
            );
        }

        // Get customer name
        const [customer] = await executeQuery(`
            SELECT name FROM customers WHERE id = ?
        `, [customer_id]);

        if (!customer) {
            return NextResponse.json(
                { success: false, message: 'مشتری یافت نشد' },
                { status: 404 }
            );
        }

        // Create sale record
        const saleId = uuidv4();

        await executeSingle(`
            INSERT INTO sales (
                id, deal_id, customer_id, customer_name, total_amount, currency,
                payment_status, payment_method, delivery_date, payment_due_date,
                notes, invoice_number, sales_person_id, sales_person_name,
                sale_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            saleId, deal_id, customer_id, customer.name, total_amount, currency,
            payment_status, payment_method, delivery_date, payment_due_date,
            notes, invoice_number, userId, userName
        ]);

        // Create sale items
        for (const item of items) {
            const itemId = uuidv4();

            // Validate product exists
            const [product] = await executeQuery(`
                SELECT id, name FROM products WHERE id = ?
            `, [item.product_id]);

            if (!product) {
                return NextResponse.json(
                    { success: false, message: `محصول با شناسه ${item.product_id} یافت نشد` },
                    { status: 400 }
                );
            }

            await executeSingle(`
                INSERT INTO sale_items (
                    id, sale_id, product_id, product_name, quantity,
                    unit_price, discount_percentage, total_price, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                itemId, saleId, item.product_id, product.name,
                item.quantity, item.unit_price, item.discount_percentage || 0,
                item.total_price
            ]);
        }

        // Update deal status to closed_won if payment is completed
        if (payment_status === 'paid') {
            // Get closed_won stage
            const [closedWonStage] = await executeQuery(`
                SELECT id FROM pipeline_stages WHERE code = 'closed_won' LIMIT 1
            `);

            if (closedWonStage) {
                await executeSingle(`
                    UPDATE deals 
                    SET stage_id = ?, actual_close_date = NOW(), updated_at = NOW()
                    WHERE id = ?
                `, [closedWonStage.id, deal_id]);
            }
        }

        // Add activity log
        const activityId = uuidv4();
        await executeSingle(`
            INSERT INTO activities (
                id, customer_id, deal_id, type, title, description, 
                performed_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            activityId, customer_id, deal_id, 'sale',
            `ثبت فروش ${formatCurrency(total_amount, currency)}`,
            `فروش با شماره فاکتور ${invoice_number || 'نامشخص'} ثبت شد`,
            userId
        ]);

        return NextResponse.json({
            success: true,
            message: 'فروش با موفقیت ثبت شد',
            data: { saleId }
        });

    } catch (error) {
        console.error('Create sale API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ثبت فروش' },
            { status: 500 }
        );
    }
}

// PUT /api/sales - Update sale record
export async function PUT(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');
        const userName = req.headers.get('x-user-name') || 'نامشخص';

        // Check permission
        if (!hasPermission(userRole || '', ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'sales_agent', 'کارشناس فروش'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            sale_id,
            total_amount,
            currency = 'IRR',
            payment_status = 'pending',
            payment_method,
            delivery_date,
            payment_due_date,
            notes,
            invoice_number,
            items = []
        } = body;

        // Validation
        if (!sale_id || !total_amount || total_amount <= 0) {
            return NextResponse.json(
                { success: false, message: 'اطلاعات فروش ناقص است' },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'حداقل یک محصول باید انتخاب شود' },
                { status: 400 }
            );
        }

        // Check if sale exists
        const [existingSale] = await executeQuery(`
            SELECT id, deal_id, customer_id FROM sales WHERE id = ?
        `, [sale_id]);

        if (!existingSale) {
            return NextResponse.json(
                { success: false, message: 'فروش یافت نشد' },
                { status: 404 }
            );
        }

        // Update sale record
        await executeSingle(`
            UPDATE sales SET
                total_amount = ?, currency = ?, payment_status = ?, payment_method = ?,
                delivery_date = ?, payment_due_date = ?, notes = ?, invoice_number = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            total_amount, currency, payment_status, payment_method,
            delivery_date, payment_due_date, notes, invoice_number, sale_id
        ]);

        // Delete existing sale items
        await executeSingle(`DELETE FROM sale_items WHERE sale_id = ?`, [sale_id]);

        // Create new sale items
        for (const item of items) {
            const itemId = uuidv4();

            // Validate product exists
            const [product] = await executeQuery(`
                SELECT id, name FROM products WHERE id = ?
            `, [item.product_id]);

            if (!product) {
                return NextResponse.json(
                    { success: false, message: `محصول با شناسه ${item.product_id} یافت نشد` },
                    { status: 400 }
                );
            }

            await executeSingle(`
                INSERT INTO sale_items (
                    id, sale_id, product_id, product_name, quantity,
                    unit_price, discount_percentage, total_price, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                itemId, sale_id, item.product_id, product.name,
                item.quantity, item.unit_price, item.discount_percentage || 0,
                item.total_price
            ]);
        }

        // Update deal status if payment is completed
        if (payment_status === 'paid') {
            const [closedWonStage] = await executeQuery(`
                SELECT id FROM pipeline_stages WHERE code = 'closed_won' LIMIT 1
            `);

            if (closedWonStage) {
                await executeSingle(`
                    UPDATE deals 
                    SET stage_id = ?, actual_close_date = NOW(), updated_at = NOW()
                    WHERE id = ?
                `, [closedWonStage.id, existingSale.deal_id]);
            }
        }

        // Add activity log
        const activityId = uuidv4();
        await executeSingle(`
            INSERT INTO activities (
                id, customer_id, deal_id, type, title, description, 
                performed_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            activityId, existingSale.customer_id, existingSale.deal_id, 'sale_update',
            `ویرایش فروش ${formatCurrency(total_amount, currency)}`,
            `فروش با شماره فاکتور ${invoice_number || 'نامشخص'} ویرایش شد`,
            userId
        ]);

        return NextResponse.json({
            success: true,
            message: 'فروش با موفقیت ویرایش شد',
            data: { saleId: sale_id }
        });

    } catch (error) {
        console.error('Update sale API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ویرایش فروش' },
            { status: 500 }
        );
    }
}

function formatCurrency(amount: number, currency: string = 'IRR') {
    if (currency === 'IRR') {
        return `${(amount / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
    }
    return `${amount.toLocaleString('fa-IR')} ${currency}`;
}