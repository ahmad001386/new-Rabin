import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET /api/chat/conversations/[id]/messages - Get messages for a conversation
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const conversationId = params.id;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // For now, we'll use a default user ID (should come from session)
        const currentUserId = '1';

        if (!conversationId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مکالمه الزامی است' },
                { status: 400 }
            );
        }

        // Check if user is a participant
        const participant = await executeQuery(`
            SELECT id FROM chat_participants 
            WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, currentUserId]);

        if (participant.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شما عضو این مکالمه نیستید' },
                { status: 403 }
            );
        }

        // Get messages with sender information
        const messages = await executeQuery(`
            SELECT 
                m.*,
                u.name as sender_name,
                u.email as sender_email,
                u.avatar_url as sender_avatar_url,
                reply_msg.content as reply_content,
                reply_sender.name as reply_sender_name
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN chat_messages reply_msg ON m.reply_to_id = reply_msg.id
            LEFT JOIN users reply_sender ON reply_msg.sender_id = reply_sender.id
            WHERE m.conversation_id = ? AND m.is_deleted = false
            ORDER BY m.sent_at ASC
            LIMIT ? OFFSET ?
        `, [conversationId, limit, offset]);

        // Transform the data to include sender object
        const transformedMessages = messages.map(message => ({
            ...message,
            sender: {
                id: message.sender_id,
                name: message.sender_name,
                email: message.sender_email,
                avatar_url: message.sender_avatar_url,
                status: 'online' // Default status
            },
            reply_to: message.reply_content ? {
                id: message.reply_to_id,
                content: message.reply_content,
                sender_name: message.reply_sender_name
            } : null,
            // Remove flattened fields
            sender_name: undefined,
            sender_email: undefined,
            sender_avatar_url: undefined,
            reply_content: undefined,
            reply_sender_name: undefined
        }));

        // Update last seen for current user
        await executeSingle(`
            UPDATE chat_participants 
            SET last_seen_at = ?, last_seen_message_id = ?
            WHERE conversation_id = ? AND user_id = ?
        `, [
            new Date().toISOString(),
            messages.length > 0 ? messages[messages.length - 1].id : null,
            conversationId,
            currentUserId
        ]);

        return NextResponse.json({
            success: true,
            data: transformedMessages
        });

    } catch (error) {
        console.error('Get messages API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/chat/conversations/[id]/messages - Send a new message
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const conversationId = params.id;
        const body = await req.json();
        const {
            content,
            message_type = 'text',
            file_url,
            file_name,
            file_size,
            reply_to_id
        } = body;

        // For now, we'll use a default user ID (should come from session)
        const currentUserId = '1';

        // Validation
        if (!conversationId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مکالمه الزامی است' },
                { status: 400 }
            );
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, message: 'محتوای پیام الزامی است' },
                { status: 400 }
            );
        }

        // Check if user is a participant
        const participant = await executeQuery(`
            SELECT id FROM chat_participants 
            WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, currentUserId]);

        if (participant.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شما عضو این مکالمه نیستید' },
                { status: 403 }
            );
        }

        // Check if conversation exists and is active
        const conversation = await executeQuery(`
            SELECT id, is_active FROM chat_conversations WHERE id = ?
        `, [conversationId]);

        if (conversation.length === 0) {
            return NextResponse.json(
                { success: false, message: 'مکالمه یافت نشد' },
                { status: 404 }
            );
        }

        if (!conversation[0].is_active) {
            return NextResponse.json(
                { success: false, message: 'این مکالمه غیرفعال است' },
                { status: 400 }
            );
        }

        const messageId = generateUUID();
        const now = new Date().toISOString();

        // Create the message
        await executeSingle(`
            INSERT INTO chat_messages (
                id, conversation_id, sender_id, message_type, content,
                file_url, file_name, file_size, reply_to_id, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            messageId, conversationId, currentUserId, message_type, content.trim(),
            file_url || null, file_name || null, file_size || null, reply_to_id || null, now
        ]);

        // Update conversation's last message
        await executeSingle(`
            UPDATE chat_conversations 
            SET last_message_id = ?, last_message_at = ?, updated_at = ?
            WHERE id = ?
        `, [messageId, now, now, conversationId]);

        // Update sender's last seen
        await executeSingle(`
            UPDATE chat_participants 
            SET last_seen_at = ?, last_seen_message_id = ?
            WHERE conversation_id = ? AND user_id = ?
        `, [now, messageId, conversationId, currentUserId]);

        return NextResponse.json({
            success: true,
            message: 'پیام با موفقیت ارسال شد',
            data: { id: messageId }
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}

// PUT /api/chat/conversations/[id]/messages - Edit a message
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const conversationId = params.id;
        const body = await req.json();
        const { messageId, content } = body;

        // For now, we'll use a default user ID (should come from session)
        const currentUserId = '1';

        if (!conversationId || !messageId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مکالمه و پیام الزامی است' },
                { status: 400 }
            );
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, message: 'محتوای پیام الزامی است' },
                { status: 400 }
            );
        }

        // Check if message exists and belongs to current user
        const message = await executeQuery(`
            SELECT id FROM chat_messages 
            WHERE id = ? AND conversation_id = ? AND sender_id = ? AND is_deleted = false
        `, [messageId, conversationId, currentUserId]);

        if (message.length === 0) {
            return NextResponse.json(
                { success: false, message: 'پیام یافت نشد یا شما مجاز به ویرایش آن نیستید' },
                { status: 404 }
            );
        }

        // Update the message
        await executeSingle(`
            UPDATE chat_messages 
            SET content = ?, is_edited = true, edited_at = ?
            WHERE id = ?
        `, [content.trim(), new Date().toISOString(), messageId]);

        return NextResponse.json({
            success: true,
            message: 'پیام با موفقیت ویرایش شد'
        });

    } catch (error) {
        console.error('Edit message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ویرایش پیام' },
            { status: 500 }
        );
    }
}

// DELETE /api/chat/conversations/[id]/messages - Delete a message
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const conversationId = params.id;
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get('messageId');

        // For now, we'll use a default user ID (should come from session)
        const currentUserId = '1';

        if (!conversationId || !messageId) {
            return NextResponse.json(
                { success: false, message: 'شناسه مکالمه و پیام الزامی است' },
                { status: 400 }
            );
        }

        // Check if message exists and belongs to current user
        const message = await executeQuery(`
            SELECT id FROM chat_messages 
            WHERE id = ? AND conversation_id = ? AND sender_id = ? AND is_deleted = false
        `, [messageId, conversationId, currentUserId]);

        if (message.length === 0) {
            return NextResponse.json(
                { success: false, message: 'پیام یافت نشد یا شما مجاز به حذف آن نیستید' },
                { status: 404 }
            );
        }

        // Soft delete the message
        await executeSingle(`
            UPDATE chat_messages 
            SET is_deleted = true, content = 'این پیام حذف شده است'
            WHERE id = ?
        `, [messageId]);

        return NextResponse.json({
            success: true,
            message: 'پیام با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف پیام' },
            { status: 500 }
        );
    }
}