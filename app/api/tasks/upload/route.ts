import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/tasks/upload - Upload file for task
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
        const formData = await req.formData();

        const taskId = formData.get('taskId') as string;
        const file = formData.get('file') as File;

        if (!taskId || !file) {
            return NextResponse.json(
                { success: false, message: 'شناسه وظیفه و فایل الزامی است' },
                { status: 400 }
            );
        }

        // Check if user has access to this task
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);

        if (!isManager) {
            const assignedTask = await executeSingle(`
        SELECT ta.user_id FROM task_assignees ta WHERE ta.task_id = ? AND ta.user_id = ?
      `, [taskId, user.id]);

            if (!assignedTask) {
                return NextResponse.json(
                    { success: false, message: 'شما مجوز آپلود فایل برای این وظیفه را ندارید' },
                    { status: 403 }
                );
            }
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tasks');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        const relativePath = `/uploads/tasks/${fileName}`;

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Save file info to database
        const fileId = uuidv4();
        await executeSingle(`
      INSERT INTO task_files (
        id, task_id, filename, original_name, file_path, 
        file_size, mime_type, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            fileId, taskId, fileName, file.name, relativePath,
            file.size, file.type, user.id
        ]);

        return NextResponse.json({
            success: true,
            message: 'فایل با موفقیت آپلود شد',
            data: {
                id: fileId,
                filename: fileName,
                original_name: file.name,
                file_path: relativePath,
                file_size: file.size,
                mime_type: file.type
            }
        });
    } catch (error) {
        console.error('Upload file API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در آپلود فایل' },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/upload - Delete uploaded file
export async function DELETE(req: NextRequest) {
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
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json(
                { success: false, message: 'شناسه فایل الزامی است' },
                { status: 400 }
            );
        }

        // Get file info
        const fileInfo = await executeSingle(`
      SELECT tf.*, t.assigned_by 
      FROM task_files tf
      LEFT JOIN tasks t ON tf.task_id = t.id
      WHERE tf.id = ?
    `, [fileId]);

        if (!fileInfo) {
            return NextResponse.json(
                { success: false, message: 'فایل یافت نشد' },
                { status: 404 }
            );
        }

        // Check permissions
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);
        const isUploader = fileInfo.uploaded_by === user.id;
        const isTaskCreator = fileInfo.assigned_by === user.id;

        if (!isManager && !isUploader && !isTaskCreator) {
            return NextResponse.json(
                { success: false, message: 'شما مجوز حذف این فایل را ندارید' },
                { status: 403 }
            );
        }

        // Delete from database
        await executeSingle(`DELETE FROM task_files WHERE id = ?`, [fileId]);

        // Try to delete physical file (don't fail if it doesn't exist)
        try {
            const fs = require('fs').promises;
            const fullPath = path.join(process.cwd(), 'public', fileInfo.file_path);
            await fs.unlink(fullPath);
        } catch (error) {
            console.warn('Could not delete physical file:', error);
        }

        return NextResponse.json({
            success: true,
            message: 'فایل با موفقیت حذف شد'
        });
    } catch (error) {
        console.error('Delete file API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف فایل' },
            { status: 500 }
        );
    }
}