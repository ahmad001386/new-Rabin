import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET /api/chat/conversations - Get all conversations for current user
export async function GET(req: NextRequest) {
    try {
        // Get user ID from middleware headers
        const currentUserId = req.headers.get('x-user-id');
        if (!currentUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const conversations = await executeQuery(`
            SELECT 
                c.*,
                lm.message as last_message_content,
                lm.created_at as last_message_sent_at,
                sender.name as last_message_sender_name
            FROM chat_conversations c
            LEFT JOIN chat_messages lm ON c.last_message_id = lm.id
            LEFT JOIN users sender ON lm.sender_id = sender.id
            WHERE c.is_active = 1 AND c.created_by = ?
            ORDER BY c.last_message_at DESC
        `, [currentUserId]);

        // Format conversations
        const formattedConversations = conversations.map(conv => ({
            ...conv,
            last_message: conv.last_message_content ? {
                content: conv.last_message_content,
                sent_at: conv.last_message_sent_at,
                sender_name: conv.last_message_sender_name
            } : null,
            // Remove redundant fields
            last_message_content: undefined,
            last_message_sent_at: undefined,
            last_message_sender_name: undefined
        }));

        return NextResponse.json({
            success: true,
            data: formattedConversations
        });

    } catch (error) {
        console.error('Get conversations API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت مکالمات' },
            { status: 500 }
        );
    }
}

// POST /api/chat/conversations - Create a new conversation
export async function POST(req: NextRequest) {
    try {
        // Get user ID from middleware headers
        const currentUserId = req.headers.get('x-user-id');
        if (!currentUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { type = 'direct', title, description } = body;

        const conversationId = generateUUID();

        // Create conversation
        await executeSingle(`
            INSERT INTO chat_conversations (
                id, title, type, description, is_active, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())
        `, [conversationId, title || 'New Conversation', type, description || null, currentUserId]);

        // Get the created conversation
        const [newConversation] = await executeQuery(`
            SELECT * FROM chat_conversations WHERE id = ?
        `, [conversationId]);

        return NextResponse.json({
            success: true,
            message: 'مکالمه با موفقیت ایجاد شد',
            data: newConversation
        });

    } catch (error) {
        console.error('Create conversation API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد مکالمه' },
            { status: 500 }
        );
    }
}

// PUT /api/chat/conversations - Update a conversation
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, title, is_active } = body;

        // For now, we'll use a default user ID (should come from session)
        const currentUserId = '1';

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'شناسه مکالمه الزامی است' },
                { status: 400 }
            );
        }

        // Check if user is a participant
        const participant = await executeQuery(`
            SELECT id FROM chat_participants 
            WHERE conversation_id = ? AND user_id = ?
        `, [id, currentUserId]);

        if (participant.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شما عضو این مکالمه نیستید' },
                { status: 403 }
            );
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        if (title !== undefined) {
            updateFields.push('title = ?');
            updateValues.push(title);
        }

        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
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
            `UPDATE chat_conversations SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'مکالمه با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update conversation API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی مکالمه' },
            { status: 500 }
        );
    }
}