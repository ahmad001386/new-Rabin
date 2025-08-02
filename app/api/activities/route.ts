import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// GET activities
export async function GET(req: NextRequest) {
  try {
    const activities = await executeQuery(`
      SELECT a.*, c.name as customer_name 
      FROM activities a 
      LEFT JOIN customers c ON a.customer_id = c.id 
      ORDER BY a.created_at DESC 
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت فعالیت‌ها'
    }, { status: 500 });
  }
}

// POST - Create activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customer_id || !body.title) {
      return NextResponse.json({
        success: false,
        message: 'مشتری و عنوان اجباری است'
      }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await executeSingle(`
      INSERT INTO activities (id, customer_id, type, title, description, outcome, performed_by, start_time, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      body.customer_id,
      body.type || 'call',
      body.title,
      body.description || null,
      body.outcome || 'successful',
      req.headers.get('x-user-id') || 'system',
      now,
      now
    ]);

    return NextResponse.json({
      success: true,
      message: 'فعالیت ایجاد شد',
      id: id
    });

  } catch (error) {
    console.error('خطا:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در ایجاد فعالیت'
    }, { status: 500 });
  }
}