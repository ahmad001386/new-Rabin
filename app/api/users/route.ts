import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken, hasPermission } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users - Get all users (for chat and other features)
export async function GET(req: NextRequest) {
    try {
        // Get user from token for authorization
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

        // Get current user's role
        const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [userId]);

        if (currentUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const userRole = currentUsers[0].role;

        // Check permissions - only managers/CEO can view all users
        if (!hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const role = searchParams.get('role');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
      SELECT 
        id, name, email, role, avatar_url, phone, team,
        status, created_at, updated_at, last_active
      FROM users
      WHERE status != 'inactive'
    `;

        const params: any[] = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (role) {
            const roles = role.split(',');
            query += ` AND role IN (${roles.map(() => '?').join(',')})`;
            params.push(...roles);
        }

        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const users = await executeQuery(query, params);

        // Add random online status for demo (in real app, this would come from session tracking)
        const usersWithStatus = users.map(user => ({
            ...user,
            avatar: user.avatar_url, // Map avatar_url to avatar for frontend compatibility
            status: Math.random() > 0.3 ? 'online' : (Math.random() > 0.5 ? 'away' : 'offline')
        }));

        return NextResponse.json({
            success: true,
            users: usersWithStatus
        });

    } catch (error) {
        console.error('Get users API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت کاربران' },
            { status: 500 }
        );
    }
}

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
    console.log('🔄 POST /api/users - Starting user creation');

    try {
        // Get user from token for authorization
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        console.log('🔑 Token present:', !!token);

        if (!token) {
            console.log('❌ No token provided');
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        // Verify token and get user ID
        const userId = await getUserFromToken(token);
        console.log('👤 User ID from token:', userId);

        if (!userId) {
            console.log('❌ Invalid token');
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        // Get current user's role for permission check
        console.log('🔍 Checking current user permissions...');
        const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [userId]);

        if (currentUsers.length === 0) {
            console.log('❌ Current user not found in database');
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const userRole = currentUsers[0].role;
        console.log('🎭 Current user role:', userRole);

        // Check permissions - only managers/CEO can create users
        const allowedRoles = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'];
        if (!hasPermission(userRole, allowedRoles)) {
            console.log('❌ Permission denied for role:', userRole, 'Allowed roles:', allowedRoles);
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی - فقط مدیران می‌توانند همکار جدید اضافه کنند' },
                { status: 403 }
            );
        }

        // Parse request body
        console.log('📥 Parsing request body...');
        const body = await req.json();
        const { name, email, password, role, team, phone } = body;

        console.log('📝 Request data:', {
            name: name?.substring(0, 20) + '...',
            email,
            role,
            team,
            phone,
            hasPassword: !!password
        });

        // Basic validation
        if (!name?.trim()) {
            console.log('❌ Name is missing or empty');
            return NextResponse.json(
                { success: false, message: 'نام الزامی است' },
                { status: 400 }
            );
        }

        if (!email?.trim()) {
            console.log('❌ Email is missing or empty');
            return NextResponse.json(
                { success: false, message: 'ایمیل الزامی است' },
                { status: 400 }
            );
        }

        if (!password?.trim()) {
            console.log('❌ Password is missing or empty');
            return NextResponse.json(
                { success: false, message: 'رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        if (!role?.trim()) {
            console.log('❌ Role is missing or empty');
            return NextResponse.json(
                { success: false, message: 'نقش الزامی است' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            console.log('❌ Invalid email format:', email);
            return NextResponse.json(
                { success: false, message: 'فرمت ایمیل نامعتبر است' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.trim().length < 6) {
            console.log('❌ Password too short:', password.length);
            return NextResponse.json(
                { success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['ceo', 'sales_manager', 'sales_agent', 'agent'];
        if (!validRoles.includes(role.trim())) {
            console.log('❌ Invalid role:', role);
            return NextResponse.json(
                { success: false, message: 'نقش انتخاب شده نامعتبر است' },
                { status: 400 }
            );
        }

        // Check if email already exists
        console.log('🔍 Checking if email already exists...');
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        if (existingUser.length > 0) {
            console.log('❌ Email already exists:', email);
            return NextResponse.json(
                { success: false, message: 'کاربری با این ایمیل قبلاً ثبت شده است' },
                { status: 400 }
            );
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password.trim(), 12);

        // Generate new user ID
        const newUserId = generateUUID();
        console.log('🆔 Generated new user ID:', newUserId);

        // Prepare data for insertion
        const userData = {
            id: newUserId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password_hash: hashedPassword,
            password: hashedPassword, // Some systems store both
            role: role.trim(),
            team: team?.trim() || null,
            phone: phone?.trim() || null,
            status: 'active',
            created_by: userId
        };

        console.log('💾 Inserting new user into database...');

        // Insert new user
        const insertResult = await executeSingle(`
      INSERT INTO users (
        id, name, email, password_hash, password, role, team, phone, 
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
            userData.id,
            userData.name,
            userData.email,
            userData.password_hash,
            userData.password,
            userData.role,
            userData.team,
            userData.phone,
            userData.status,
            userData.created_by
        ]);

        console.log('✅ User inserted successfully. Insert result:', insertResult);

        // Verify the user was created
        const createdUser = await executeQuery(
            'SELECT id, name, email, role, team, phone, created_at FROM users WHERE id = ?',
            [newUserId]
        );

        if (createdUser.length === 0) {
            console.log('❌ User creation verification failed');
            return NextResponse.json(
                { success: false, message: 'خطا در تأیید ایجاد کاربر' },
                { status: 500 }
            );
        }

        console.log('🎉 User created and verified successfully:', createdUser[0]);

        return NextResponse.json({
            success: true,
            message: 'همکار جدید با موفقیت اضافه شد',
            data: {
                id: createdUser[0].id,
                name: createdUser[0].name,
                email: createdUser[0].email,
                role: createdUser[0].role,
                team: createdUser[0].team,
                phone: createdUser[0].phone,
                created_at: createdUser[0].created_at
            }
        });

    } catch (error) {
        console.error('❌ Create user API error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        return NextResponse.json(
            {
                success: false,
                message: `خطا در ایجاد کاربر: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack trace') : undefined
            },
            { status: 500 }
        );
    }
}