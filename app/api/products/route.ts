import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/products - Get all products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const is_active = searchParams.get('is_active') || '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (is_active) {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    const products = await executeQuery(`
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY name
    `, params);

    return NextResponse.json({ success: true, products: products });
  } catch (error) {
    console.error('Get products API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت محصولات' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (CEO only)
export async function POST(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');

    // Only CEO can create products
    if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name, category, description, specifications, base_price, currency, inventory
    } = body;

    if (!name || !base_price) {
      return NextResponse.json(
        { success: false, message: 'نام و قیمت محصول الزامی است' },
        { status: 400 }
      );
    }

    const productId = uuidv4();

    await executeSingle(`
      INSERT INTO products (
        id, name, category, description, specifications, base_price,
        currency, is_active, inventory, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, true, ?, NOW())
    `, [
      productId,
      name,
      category || null,
      description || null,
      specifications || null,
      base_price,
      currency || 'IRR',
      inventory || 999
    ]);

    // Get the created product
    const [newProduct] = await executeQuery(`
      SELECT * FROM products WHERE id = ?
    `, [productId]);

    return NextResponse.json({
      success: true,
      message: 'محصول با موفقیت ایجاد شد',
      data: newProduct
    });
  } catch (error) {
    console.error('Create product API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      code: (error as any)?.code
    });
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد محصول', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}