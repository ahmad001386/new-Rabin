import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeSingle } from '@/lib/database';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('avatar') as File;
        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file uploaded' },
                { status: 400 }
            );
        }

        // بررسی نوع فایل
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, message: 'File must be an image' },
                { status: 400 }
            );
        }

        // ایجاد نام فایل یکتا
        const ext = path.extname(file.name);
        const fileName = `${userId}-${Date.now()}${ext}`;
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', fileName);

        // ذخیره فایل
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // به‌روزرسانی مسیر عکس در دیتابیس
        const avatarUrl = `/uploads/avatars/${fileName}`;
        await executeSingle(`
      UPDATE users
      SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [avatarUrl, userId]);

        return NextResponse.json({
            success: true,
            data: { avatarUrl }
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json(
            { success: false, message: 'Error uploading avatar' },
            { status: 500 }
        );
    }
}
