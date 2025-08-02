import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        console.log('🚀 Setting up extended database schema...');

        // Read the SQL file
        const sqlFilePath = path.join(process.cwd(), 'database_schema_contacts_customers_chat.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split the SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));

        const results = [];

        // Execute each statement
        for (const statement of statements) {
            try {
                if (statement.toLowerCase().startsWith('insert') ||
                    statement.toLowerCase().startsWith('update')) {
                    const result = await executeSingle(statement);
                    results.push({ type: 'insert/update', success: true, affected: result.affectedRows });
                } else if (statement.toLowerCase().startsWith('create')) {
                    await executeSingle(statement);
                    results.push({ type: 'create', success: true });
                } else {
                    await executeSingle(statement);
                    results.push({ type: 'other', success: true });
                }
            } catch (error) {
                console.error('Error executing statement:', statement.substring(0, 100), error);
                results.push({
                    type: 'error',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    statement: statement.substring(0, 100) + '...'
                });
            }
        }

        // Verify the setup by checking tables
        const tables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('companies', 'contacts', 'chat_conversations', 'chat_messages', 'chat_participants', 'contact_activities')
    `);

        // Check sample data
        const companiesCount = await executeQuery('SELECT COUNT(*) as count FROM companies');
        const contactsCount = await executeQuery('SELECT COUNT(*) as count FROM contacts');
        const conversationsCount = await executeQuery('SELECT COUNT(*) as count FROM chat_conversations');
        const messagesCount = await executeQuery('SELECT COUNT(*) as count FROM chat_messages');

        console.log('✅ Extended database setup completed!');

        return NextResponse.json({
            success: true,
            message: 'Extended database schema setup completed successfully',
            data: {
                tablesCreated: tables.map(t => t.TABLE_NAME),
                sampleData: {
                    companies: companiesCount[0].count,
                    contacts: contactsCount[0].count,
                    conversations: conversationsCount[0].count,
                    messages: messagesCount[0].count
                },
                executionResults: results
            }
        });

    } catch (error) {
        console.error('❌ Database setup error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Database setup failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}