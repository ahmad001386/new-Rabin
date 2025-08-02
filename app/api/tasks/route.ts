import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken, verifyToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tasks - Get all tasks
export async function GET(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user info
    const currentUsers = await executeQuery(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const user = currentUsers[0];
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assigned_to = searchParams.get('assigned_to') || '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assigned_to) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    // If not manager/CEO, only show assigned tasks or created tasks
    const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);
    if (!isManager) {
      whereClause += ' AND (ta.user_id = ? OR t.assigned_by = ?)';
      params.push(user.id, user.id);
    }

    const tasks = await executeQuery(`
      SELECT DISTINCT
        t.*,
        c.name as customer_name,
        u2.name as assigned_by_name,
        GROUP_CONCAT(DISTINCT u1.name SEPARATOR ', ') as assigned_to_names,
        GROUP_CONCAT(DISTINCT ta.user_id SEPARATOR ',') as assigned_user_ids
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN users u1 ON ta.user_id = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC
    `, params);

    // Get files for each task
    for (let task of tasks) {
      const files = await executeQuery(`
        SELECT tf.*, u.name as uploaded_by_name
        FROM task_files tf
        LEFT JOIN users u ON tf.uploaded_by = u.id
        WHERE tf.task_id = ?
        ORDER BY tf.uploaded_at DESC
      `, [task.id]);
      task.files = files;
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت وظایف' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user info
    const currentUsers = await executeQuery(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const user = currentUsers[0];
    const body = await req.json();
    const {
      title, description, customer_id, deal_id, assigned_to,
      priority, category, due_date
    } = body;

    if (!title || !assigned_to || assigned_to.length === 0) {
      return NextResponse.json(
        { success: false, message: 'عنوان و حداقل یک فرد مسئول الزامی است' },
        { status: 400 }
      );
    }

    // Check if user has permission to create tasks
    const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);
    if (!isManager) {
      return NextResponse.json(
        { success: false, message: 'شما مجوز ایجاد وظیفه ندارید' },
        { status: 403 }
      );
    }

    const taskId = uuidv4();

    // Convert due_date to MySQL format if provided
    let formattedDueDate = null;
    if (due_date) {
      const date = new Date(due_date);
      formattedDueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Create the task
    await executeSingle(`
      INSERT INTO tasks (
        id, title, description, customer_id, deal_id, assigned_to,
        assigned_by, priority, category, status, due_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    `, [
      taskId,
      title,
      description || null,
      customer_id || null,
      deal_id || null,
      assigned_to[0],
      user.id,
      priority || 'medium',
      category || 'follow_up',
      formattedDueDate
    ]);

    // Add all assignees
    for (const userId of assigned_to) {
      await executeSingle(`
        INSERT INTO task_assignees (id, task_id, user_id, assigned_by)
        VALUES (?, ?, ?, ?)
      `, [uuidv4(), taskId, userId, user.id]);
    }

    return NextResponse.json({
      success: true,
      message: 'وظیفه با موفقیت ایجاد شد',
      data: { id: taskId }
    });
  } catch (error) {
    console.error('Create task API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد وظیفه' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update task status or completion
export async function PUT(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user info
    const currentUsers = await executeQuery(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const user = currentUsers[0];
    const body = await req.json();
    const { taskId, status, completion_notes } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه وظیفه و وضعیت الزامی است' },
        { status: 400 }
      );
    }

    // Check if user is assigned to this task or is a manager
    const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);

    if (!isManager) {
      const assignedTask = await executeSingle(`
        SELECT ta.user_id FROM task_assignees ta WHERE ta.task_id = ? AND ta.user_id = ?
      `, [taskId, user.id]);

      if (!assignedTask) {
        return NextResponse.json(
          { success: false, message: 'شما مجوز تغییر این وظیفه را ندارید' },
          { status: 403 }
        );
      }
    }

    // Update task status
    const updateFields = ['status = ?'];
    const updateParams = [status];

    if (status === 'completed') {
      updateFields.push('completed_at = NOW()');
      if (completion_notes) {
        updateFields.push('completion_notes = ?');
        updateParams.push(completion_notes);
      }
    }

    updateParams.push(taskId);

    await executeSingle(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    return NextResponse.json({
      success: true,
      message: status === 'completed' ? 'وظیفه با موفقیت تکمیل شد' : 'وضعیت وظیفه به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update task API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی وظیفه' },
      { status: 500 }
    );
  }
}