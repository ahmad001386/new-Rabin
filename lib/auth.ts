import { supabase, supabaseAdmin } from './database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Get user ID from token
export async function getUserFromToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Login user with Supabase
export async function loginUser(email: string, password: string) {
  try {
    // Find user by email using Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role, status')
      .eq('email', email)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return {
        success: false,
        message: 'خطای سرور داخلی'
      };
    }

    if (!users || users.length === 0) {
      return {
        success: false,
        message: 'کاربر یافت نشد یا غیرفعال است'
      };
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        message: 'رمز عبور اشتباه است'
      };
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Update last login using Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update last login:', updateError);
    }

    return {
      success: true,
      message: 'ورود با موفقیت انجام شد',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'خطای سرور داخلی'
    };
  }
}

// Check permissions
export function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// Sign up user with Supabase Auth (optional - if you want to use Supabase Auth)
export async function signUpWithSupabase(email: string, password: string, userData: any) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد',
      user: data.user
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: 'خطای سرور داخلی'
    };
  }
}

// Sign in with Supabase Auth (optional)
export async function signInWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: 'ورود با موفقیت انجام شد',
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Signin error:', error);
    return {
      success: false,
      message: 'خطای سرور داخلی'
    };
  }
}