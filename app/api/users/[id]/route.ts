import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hashPassword, hasPermission, getUserFromToken } from '@/lib/auth';

// GET /api/users/[id] - Get specific user
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Get user from token for authorization
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const currentUserId = await getUserFromToken(token);
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user's role
    const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [currentUserId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const userRole = currentUsers[0].role;

    // Users can view their own profile, or managers can view any profile
    if (currentUserId !== params.id && !hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی - فقط مدیران می‌توانند پروفایل سایر کاربران را مشاهده کنند' },
        { status: 403 }
      );
    }

    const users = await executeQuery(`
      SELECT 
        id, name, email, role, status, team, avatar_url as avatar, phone,
        last_active, last_login, created_at, updated_at
      FROM users 
      WHERE id = ? AND status != 'inactive'
    `, [params.id]);

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کاربر' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Get user from token for authorization
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const currentUserId = await getUserFromToken(token);
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user's role
    const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [currentUserId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const userRole = currentUsers[0].role;

    // Users can update their own profile, or CEO/sales managers can update any profile
    if (currentUserId !== params.id && !hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role, status, team, phone } = body;

    // Check if user exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [params.id]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Prepare update query
    let updateQuery = 'UPDATE users SET updated_at = NOW()';
    const updateParams: any[] = [];

    if (name !== undefined) {
      updateQuery += ', name = ?';
      updateParams.push(name);
    }

    if (email !== undefined) {
      updateQuery += ', email = ?';
      updateParams.push(email);
    }

    if (password !== undefined && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      updateQuery += ', password_hash = ?, password = ?';
      updateParams.push(hashedPassword, password);
    }

    // Only CEO and sales managers can change role and status
    if (hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
      if (role !== undefined) {
        updateQuery += ', role = ?';
        updateParams.push(role);
      }

      if (status !== undefined) {
        updateQuery += ', status = ?';
        updateParams.push(status);
      }
    }

    if (team !== undefined) {
      updateQuery += ', team = ?';
      updateParams.push(team);
    }

    if (phone !== undefined) {
      updateQuery += ', phone = ?';
      updateParams.push(phone);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(params.id);

    await executeSingle(updateQuery, updateParams);

    // Get updated user data
    const [updatedUser] = await executeQuery(`
      SELECT id, name, email, role, status, team, phone, updated_at
      FROM users WHERE id = ?
    `, [params.id]);

    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت بروزرسانی شد',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (CEO only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Get user from token for authorization
    const token = req.cookies.get('auth-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن یافت نشد' },
        { status: 401 }
      );
    }

    const currentUserId = await getUserFromToken(token);
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Get current user's role
    const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [currentUserId]);

    if (currentUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const userRole = currentUsers[0].role;

    // Only CEO and sales managers can delete users
    if (!hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی - فقط مدیران می‌توانند کاربران را حذف کنند' },
        { status: 403 }
      );
    }

    // Prevent user from deleting themselves
    if (currentUserId === params.id) {
      return NextResponse.json(
        { success: false, message: 'نمی‌توانید خودتان را حذف کنید' },
        { status: 400 }
      );
    }

    // Check if user exists and get their info
    const existingUsers = await executeQuery(
      'SELECT id, name, role FROM users WHERE id = ?',
      [params.id]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const targetUser = existingUsers[0];

    // Prevent non-CEO from deleting CEO or other managers
    if (userRole !== 'ceo' && userRole !== 'مدیر') {
      if (['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(targetUser.role)) {
        return NextResponse.json(
          { success: false, message: 'نمی‌توانید مدیران را حذف کنید' },
          { status: 403 }
        );
      }
    }

    // Check if user wants hard delete or soft delete
    const url = new URL(req.url);
    const hardDelete = url.searchParams.get('hard') === 'true';

    if (hardDelete) {
      try {
        console.log(`🗑️ Starting hard delete for user: ${targetUser.name} (${params.id})`);

        // Start comprehensive cascade delete
        // 1. Delete user permissions
        await executeSingle('DELETE FROM user_permissions WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted user permissions');

        // 2. Delete user sessions
        await executeSingle('DELETE FROM user_sessions WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted user sessions');

        // 3. Delete daily reports
        await executeSingle('DELETE FROM daily_reports WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted daily reports');

        // 4. Delete user targets and quotas
        await executeSingle('DELETE FROM user_targets WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted user targets');

        // 5. Delete activities performed by this user
        await executeSingle('DELETE FROM activities WHERE performed_by = ?', [params.id]);
        console.log('✅ Deleted activities');

        // 6. Delete interactions performed by this user
        await executeSingle('DELETE FROM interactions WHERE performed_by = ?', [params.id]);
        console.log('✅ Deleted interactions');

        // 7. Delete notes created by this user
        await executeSingle('DELETE FROM notes WHERE created_by = ?', [params.id]);
        console.log('✅ Deleted notes');

        // 8. Delete tasks assigned by this user (but keep tasks assigned to them with NULL assigned_to)
        await executeSingle('DELETE FROM tasks WHERE assigned_by = ?', [params.id]);
        console.log('✅ Deleted tasks created by user');

        // 9. Delete ticket updates by this user
        await executeSingle('DELETE FROM ticket_updates WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted ticket updates');

        // 10. Delete calendar events assigned to this user
        await executeSingle('DELETE FROM calendar_events WHERE assigned_to = ?', [params.id]);
        console.log('✅ Deleted calendar events');

        // 11. Delete event attendees records
        await executeSingle('DELETE FROM event_attendees WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted event attendees');

        // 12. Delete project team memberships
        await executeSingle('DELETE FROM project_team WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted project team memberships');

        // 13. Delete alerts targeted to this user
        await executeSingle('DELETE FROM alerts WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted alerts');

        // 14. Delete activity log entries
        await executeSingle('DELETE FROM activity_log WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted activity log');

        // 15. Delete chat participants
        await executeSingle('DELETE FROM chat_participants WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted chat participants');

        // 16. Delete chat messages
        await executeSingle('DELETE FROM chat_messages WHERE sender_id = ?', [params.id]);
        console.log('✅ Deleted chat messages');

        // 17. Delete task assignees
        await executeSingle('DELETE FROM task_assignees WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted task assignees');

        // 18. Delete task comments
        await executeSingle('DELETE FROM task_comments WHERE user_id = ?', [params.id]);
        console.log('✅ Deleted task comments');

        // Now update references that should be preserved but set to NULL
        // 19. Update customers assigned to this user
        await executeSingle('UPDATE customers SET assigned_to = NULL WHERE assigned_to = ?', [params.id]);
        console.log('✅ Updated customer assignments');

        // 20. Update deals assigned to this user
        await executeSingle('UPDATE deals SET assigned_to = NULL WHERE assigned_to = ?', [params.id]);
        console.log('✅ Updated deal assignments');

        // 21. Update tasks assigned to this user
        await executeSingle('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?', [params.id]);
        console.log('✅ Updated task assignments');

        // 22. Update tickets assigned to this user
        await executeSingle('UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?', [params.id]);
        console.log('✅ Updated ticket assignments');

        // 23. Update tickets created by this user
        await executeSingle('UPDATE tickets SET created_by = NULL WHERE created_by = ?', [params.id]);
        console.log('✅ Updated ticket creators');

        // 24. Update projects managed by this user
        await executeSingle('UPDATE projects SET manager_id = NULL WHERE manager_id = ?', [params.id]);
        console.log('✅ Updated project managers');

        // 25. Update surveys created by this user
        await executeSingle('UPDATE surveys SET created_by = NULL WHERE created_by = ?', [params.id]);
        console.log('✅ Updated survey creators');

        // 26. Update system settings updated by this user
        await executeSingle('UPDATE system_settings SET updated_by = NULL WHERE updated_by = ?', [params.id]);
        console.log('✅ Updated system settings');

        // 27. Update users created by this user
        await executeSingle('UPDATE users SET created_by = NULL WHERE created_by = ?', [params.id]);
        console.log('✅ Updated user creators');

        // 28. Update deal stage history
        await executeSingle('UPDATE deal_stage_history SET changed_by = NULL WHERE changed_by = ?', [params.id]);
        console.log('✅ Updated deal stage history');

        // Finally delete the user
        await executeSingle('DELETE FROM users WHERE id = ?', [params.id]);
        console.log('✅ Deleted user record');

        console.log(`🎉 Successfully completed hard delete for user: ${targetUser.name}`);

        return NextResponse.json({
          success: true,
          message: `کاربر ${targetUser.name} و تمام اطلاعات مربوط به او با موفقیت حذف شد`
        });
      } catch (error) {
        console.error('❌ Error in cascade delete:', error);
        return NextResponse.json(
          { success: false, message: `خطا در حذف کامل کاربر: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    } else {
      // Soft delete - just set status to inactive
      await executeSingle(
        'UPDATE users SET status = "inactive", updated_at = NOW() WHERE id = ?',
        [params.id]
      );

      return NextResponse.json({
        success: true,
        message: `کاربر ${targetUser.name} با موفقیت غیرفعال شد`
      });
    }
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کاربر' },
      { status: 500 }
    );
  }
}