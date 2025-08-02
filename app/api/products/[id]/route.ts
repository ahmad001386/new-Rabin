import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET /api/products/[id] - Get product details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        const [product] = await executeQuery(`
            SELECT * FROM products WHERE id = ?
        `, [productId]);

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'محصول یافت نشد' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Get product details API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت جزئیات محصول' },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = req.headers.get('x-user-role');
        const { id: productId } = await params;
        const body = await req.json();

        // Only CEO and managers can update products
        if (!hasPermission(userRole || '', ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        // Check if product exists
        const [product] = await executeQuery(`
            SELECT * FROM products WHERE id = ?
        `, [productId]);

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'محصول یافت نشد' },
                { status: 404 }
            );
        }

        // Update product
        const allowedFields = [
            'name', 'category', 'description', 'specifications',
            'base_price', 'currency', 'is_active', 'inventory'
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
        updateValues.push(productId);

        await executeSingle(
            `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'محصول با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update product API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی محصول' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userRole = req.headers.get('x-user-role');
        const { id: productId } = await params;

        // Only CEO can delete products
        if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        // Check if product exists
        const [product] = await executeQuery(`
            SELECT * FROM products WHERE id = ?
        `, [productId]);

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'محصول یافت نشد' },
                { status: 404 }
            );
        }

        // Check if product is used in any deals
        const [dealCount] = await executeQuery(`
            SELECT COUNT(*) as count FROM deal_products WHERE product_id = ?
        `, [productId]);

        if (dealCount.count > 0) {
            return NextResponse.json(
                { success: false, message: 'این محصول در معاملات استفاده شده و قابل حذف نیست' },
                { status: 400 }
            );
        }

        // Delete product
        await executeSingle(`
            DELETE FROM products WHERE id = ?
        `, [productId]);

        return NextResponse.json({
            success: true,
            message: 'محصول با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete product API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف محصول' },
            { status: 500 }
        );
    }
}