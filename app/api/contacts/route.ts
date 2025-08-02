import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// GET /api/contacts - Get all contacts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
            SELECT
                c.*,
                cust.name as company_name,
                cust.industry as company_industry,
                cust.segment as company_size,
                cust.status as company_status,
                u.name as assigned_user_name
            FROM contacts c
            LEFT JOIN customers cust ON c.company_id = cust.id
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE 1=1
        `;

    const params: any[] = [];

    if (companyId) {
      if (companyId === 'individual') {
        query += ' AND (c.company_id IS NULL OR c.company_id = "")';
      } else {
        query += ' AND c.company_id = ?';
        params.push(companyId);
      }
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.first_name ASC, c.last_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const contacts = await executeQuery(query, params);

    // Transform the data to include company object
    const transformedContacts = contacts.map(contact => ({
      ...contact,
      company: contact.company_name ? {
        id: contact.company_id,
        name: contact.company_name,
        industry: contact.company_industry,
        size: contact.company_size,
        status: contact.company_status
      } : null,
      // Remove the flattened company fields
      company_name: undefined,
      company_industry: undefined,
      company_size: undefined,
      company_status: undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedContacts
    });

  } catch (error) {
    console.error('Get contacts API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مخاطبین' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_id: rawCustomerId,
      company_id: rawCompanyId, // Support both names for backward compatibility
      first_name,
      last_name,
      job_title,
      department,
      email,
      phone,
      mobile,
      linkedin_url,
      twitter_url,
      address,
      city,
      country = 'ایران',
      source = 'other',
      notes
    } = body;

    // Handle individual contacts - support both customer_id and company_id
    const finalCompanyId = rawCustomerId || rawCompanyId;
    const company_id = (finalCompanyId === 'individual' || !finalCompanyId) ? null : finalCompanyId;

    // Validation
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, message: 'نام و نام خانوادگی الزامی است' },
        { status: 400 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingContact = await executeQuery(
        'SELECT id FROM contacts WHERE email = ?',
        [email]
      );

      if (existingContact.length > 0) {
        return NextResponse.json(
          { success: false, message: 'مخاطبی با این ایمیل قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    const contactId = generateUUID();
    // Format date for MySQL compatibility (YYYY-MM-DD HH:MM:SS)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Get current user from headers (if available)
    const currentUserId = req.headers.get('x-user-id');

    // If no current user, use the first available user as fallback
    let createdBy = currentUserId;
    if (!createdBy) {
      const firstUsers = await executeQuery('SELECT id FROM users LIMIT 1');
      if (firstUsers && firstUsers.length > 0) {
        createdBy = firstUsers[0].id;
      } else {
        // If no users exist, create a system user
        createdBy = 'system-user';
      }
    }

    const result = await executeSingle(`
            INSERT INTO contacts (
                id, company_id, first_name, last_name, job_title, department,
                email, phone, mobile, linkedin_url, twitter_url,
                address, city, country, source, status, is_primary,
                assigned_to, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', false, ?, ?, ?, ?)
        `, [
      contactId, company_id, first_name, last_name, job_title || null, department || null,
      email || null, phone || null, mobile || null, linkedin_url || null, twitter_url || null,
      address || null, city || null, country, source, currentUserId || null, createdBy, now, now
    ]);

    // If notes provided, create an activity record
    if (notes) {
      const activityId = generateUUID();
      await executeSingle(`
                INSERT INTO contact_activities (
                    id, contact_id, company_id, activity_type, title, description,
                    status, priority, assigned_to, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, 'note', 'یادداشت اولیه', ?, 'completed', 'low', ?, ?, ?, ?)
            `, [
        activityId, contactId, company_id, notes,
        currentUserId || null, createdBy, now, now
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت اضافه شد',
      data: { id: contactId }
    });

  } catch (error) {
    console.error('Create contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مخاطب' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts - Update a contact
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب الزامی است' },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await executeQuery('SELECT id FROM contacts WHERE id = ?', [id]);
    if (existingContact.length === 0) {
      return NextResponse.json(
        { success: false, message: 'مخاطب یافت نشد' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const allowedFields = [
      'company_id', 'first_name', 'last_name', 'job_title', 'department',
      'email', 'phone', 'mobile', 'linkedin_url', 'twitter_url',
      'address', 'city', 'country', 'status', 'is_primary', 'source'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
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

    updateFields.push('updated_at = ?');
    // Format date for MySQL compatibility
    updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    updateValues.push(id);

    await executeSingle(
      `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('Update contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی مخاطب' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts - Delete a contact
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب الزامی است' },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await executeQuery('SELECT id FROM contacts WHERE id = ?', [id]);
    if (existingContact.length === 0) {
      return NextResponse.json(
        { success: false, message: 'مخاطب یافت نشد' },
        { status: 404 }
      );
    }

    // Delete the contact (this will cascade delete activities due to foreign key)
    await executeSingle('DELETE FROM contacts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Delete contact API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مخاطب' },
      { status: 500 }
    );
  }
}