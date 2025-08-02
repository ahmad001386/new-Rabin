export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    phone?: string | null;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    read: boolean;
    timestamp: string;
}

export interface Activity {
    id: string;
    customer_id: string;
    deal_id?: string;
    type: 'call' | 'meeting' | 'email' | 'sms' | 'whatsapp' | 'follow_up' | 'system_task';
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    duration?: number;
    performed_by: string;
    outcome: 'successful' | 'follow_up_needed' | 'no_response' | 'completed' | 'cancelled';
    location?: string;
    attendees?: string[];
    attachments?: string[];
    created_at: string;
    updated_at: string;

    // Joined fields from customers table
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;

    // Joined fields from users table
    performed_by_name?: string;
    performed_by_email?: string;
}
