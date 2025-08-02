import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = searchParams.get('userId');
        const conversationId = searchParams.get('conversation_id');
        const currentUserId = req.headers.get('x-user-id');

        if (!currentUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // If conversation_id is provided, get messages from that conversation
        if (conversationId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    receiver.name as receiver_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                JOIN users receiver ON m.receiver_id = receiver.id
                WHERE m.id IN (
                    SELECT cm.id FROM chat_messages cm
                    JOIN chat_conversations cc ON cc.last_message_id = cm.id
                    WHERE cc.id = ?
                )
                ORDER BY m.created_at ASC
                LIMIT 100
            `, [conversationId]);

            return NextResponse.json({ success: true, data: messages });
        }

        // If userId is provided, get direct messages between users
        if (userId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    receiver.name as receiver_name
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                JOIN users receiver ON m.receiver_id = receiver.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?)
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.created_at ASC
                LIMIT 100
            `, [currentUserId, userId, userId, currentUserId]);

            // به‌روزرسانی وضعیت خوانده شدن پیام‌ها
            await executeSingle(`
                UPDATE chat_messages
                SET read_at = CURRENT_TIMESTAMP
                WHERE receiver_id = ?
                  AND sender_id = ?
                  AND read_at IS NULL
            `, [currentUserId, userId]);

            return NextResponse.json({ success: true, data: messages });
        }

        // If no specific parameters, return recent messages for current user
        const messages = await executeQuery(`
            SELECT 
                m.*,
                sender.name as sender_name,
                receiver.name as receiver_name
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [currentUserId, currentUserId]);

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error in chat messages API:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUserId = req.headers.get('x-user-id');
        const { receiverId, message } = await req.json();

        if (!currentUserId || !receiverId || !message) {
            return NextResponse.json(
                { success: false, message: 'پارامترهای ناقص' },
                { status: 400 }
            );
        }

        await executeSingle(`
      INSERT INTO chat_messages (sender_id, receiver_id, message)
      VALUES (?, ?, ?)
    `, [currentUserId, receiverId, message]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in chat messages API:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}
