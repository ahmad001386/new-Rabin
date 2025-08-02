import {
    Customer,
    Contact,
    Ticket,
    Interaction,
    Opportunity,
    Feedback,
    User,
    DashboardStats,
    Activity,
    Note,
    Task,
    Target,
    Product,
    Deal,
    Alert,
    UserActivityStat,
    CalendarEvent
} from './types';

// Mock users data for testing
export const mockUsers: User[] = [
    {
        id: '1',
        name: 'علی احمدی',
        email: 'ali.ahmadi@company.com',
        role: 'ceo',
        status: 'active',
        avatar: undefined,
        team: 'مدیریت',
        phone: '09123456789',
        lastLogin: '2024-01-15T10:30:00Z',
        lastActive: '2024-01-15T14:20:00Z',
        createdAt: '2023-06-01T09:00:00Z'
    },
    {
        id: '2',
        name: 'فاطمه محمدی',
        email: 'fateme.mohammadi@company.com',
        role: 'sales_manager',
        status: 'active',
        avatar: undefined,
        team: 'فروش',
        phone: '09123456788',
        lastLogin: '2024-01-15T09:15:00Z',
        lastActive: '2024-01-15T13:45:00Z',
        createdAt: '2023-07-15T10:00:00Z'
    },
    {
        id: '3',
        name: 'محمد رضایی',
        email: 'mohammad.rezaei@company.com',
        role: 'sales_agent',
        status: 'active',
        avatar: undefined,
        team: 'فروش',
        phone: '09123456787',
        lastLogin: '2024-01-15T08:45:00Z',
        lastActive: '2024-01-15T12:30:00Z',
        createdAt: '2023-08-20T11:00:00Z'
    },
    {
        id: '4',
        name: 'زهرا کریمی',
        email: 'zahra.karimi@company.com',
        role: 'agent',
        status: 'inactive',
        avatar: undefined,
        team: 'پشتیبانی',
        phone: '09123456786',
        lastLogin: '2024-01-10T16:20:00Z',
        lastActive: '2024-01-10T17:00:00Z',
        createdAt: '2023-09-10T12:00:00Z'
    }
];
export const mockCustomers: Customer[] = [];
export const mockContacts: Contact[] = [];
export const mockTickets: Ticket[] = [];
export const mockInteractions: Interaction[] = [];
export const mockOpportunities: Opportunity[] = [];
export const mockFeedback: Feedback[] = [];
export const mockActivities: Activity[] = [];
export const mockNotes: Note[] = [];
export const mockTasks: Task[] = [];
export const mockProducts: Product[] = [];
export const mockDeals: Deal[] = [];
export const mockAlerts: Alert[] = [];
export const mockCalendarEvents: CalendarEvent[] = [];

// Dashboard stats
export const mockDashboardStats: DashboardStats = {
    totalCustomers: 0,
    activeCustomers: 0,
    openTickets: 0,
    avgSatisfactionScore: 0,
    npsScore: 0,
    totalOpportunities: 0,
    monthlyRevenue: 0,
    ticketResolutionTime: 0,
    totalSales: 0,
    userActivity: [],
    importantLeads: [],
    alerts: []
};

// Survey interface
interface Survey {
    id: string;
    title: string;
    description: string;
    type: 'nps' | 'csat' | 'ces' | 'custom';
    status: 'active' | 'draft' | 'completed' | 'paused';
    createdAt: string;
    responses: number;
    targetResponses: number;
    questions: number;
}

// Mock surveys data
export const mockSurveysData: Survey[] = [
    {
        id: '1',
        title: 'نظرسنجی رضایت مشتریان',
        description: 'بررسی میزان رضایت مشتریان از خدمات ارائه شده',
        type: 'csat',
        status: 'active',
        createdAt: '2024-01-10T09:00:00Z',
        responses: 45,
        targetResponses: 100,
        questions: 8
    },
    {
        id: '2',
        title: 'NPS محصولات جدید',
        description: 'سنجش احتمال توصیه محصولات جدید به دیگران',
        type: 'nps',
        status: 'active',
        createdAt: '2024-01-08T10:30:00Z',
        responses: 32,
        targetResponses: 150,
        questions: 5
    },
    {
        id: '3',
        title: 'سهولت استفاده از سیستم',
        description: 'بررسی میزان سهولت استفاده از پلتفرم',
        type: 'ces',
        status: 'draft',
        createdAt: '2024-01-05T14:15:00Z',
        responses: 0,
        targetResponses: 80,
        questions: 6
    }
];
// Voice of Customer interface
interface VoiceOfCustomerItem {
    id: string;
    customerName: string;
    feedback: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    date: string;
    channel: string;
    priority: 'low' | 'medium' | 'high';
}

// Mock voice of customer data
export const mockVoiceOfCustomerData = {
    recentFeedback: [
        {
            id: '1',
            customerName: 'محمد احمدی',
            feedback: 'خدمات شما بسیار عالی است و کیفیت محصولات فوق‌العاده',
            sentiment: 'positive' as const,
            category: 'کیفیت محصول',
            date: '2024-01-15T10:30:00Z',
            channel: 'ایمیل',
            priority: 'medium' as const
        },
        {
            id: '2',
            customerName: 'فاطمه کریمی',
            feedback: 'زمان تحویل بیش از حد طولانی است و باید بهبود یابد',
            sentiment: 'negative' as const,
            category: 'زمان تحویل',
            date: '2024-01-15T09:15:00Z',
            channel: 'تلفن',
            priority: 'high' as const
        },
        {
            id: '3',
            customerName: 'علی رضایی',
            feedback: 'قیمت‌ها مناسب است اما می‌تواند بهتر باشد',
            sentiment: 'neutral' as const,
            category: 'قیمت‌گذاری',
            date: '2024-01-15T08:45:00Z',
            channel: 'چت',
            priority: 'low' as const
        }
    ] as VoiceOfCustomerItem[]
};

// Touchpoints interface
interface Touchpoint {
    id: string;
    customerName: string;
    channel: 'email' | 'phone' | 'chat' | 'social' | 'website';
    type: 'inquiry' | 'complaint' | 'support' | 'sales' | 'feedback';
    subject: string;
    description?: string;
    date: string;
    status: 'resolved' | 'pending' | 'in_progress';
    sentiment: 'positive' | 'neutral' | 'negative';
    priority: 'low' | 'medium' | 'high';
    score?: number;
    agent?: string;
}

// Mock touchpoints data
export const mockTouchpointsData = {
    summary: {
        total: 1247,
        byChannel: {
            email: 456,
            phone: 321,
            chat: 289,
            social: 181
        }
    },
    touchpoints: [
        {
            id: '1',
            customerName: 'محمد احمدی',
            channel: 'email' as const,
            type: 'inquiry' as const,
            subject: 'سوال در مورد قیمت محصولات',
            description: 'مشتری در مورد قیمت‌گذاری محصولات جدید سوال کرده است',
            date: '2024-01-15T10:30:00Z',
            status: 'resolved' as const,
            sentiment: 'positive' as const,
            priority: 'medium' as const,
            score: 4,
            agent: 'علی احمدی'
        },
        {
            id: '2',
            customerName: 'فاطمه کریمی',
            channel: 'phone' as const,
            type: 'complaint' as const,
            subject: 'مشکل در تحویل سفارش',
            description: 'سفارش مشتری با تاخیر تحویل داده شده و کیفیت مطلوب نداشته',
            date: '2024-01-15T09:15:00Z',
            status: 'in_progress' as const,
            sentiment: 'negative' as const,
            priority: 'high' as const,
            score: 2,
            agent: 'فاطمه محمدی'
        },
        {
            id: '3',
            customerName: 'علی رضایی',
            channel: 'chat' as const,
            type: 'support' as const,
            subject: 'راهنمایی نحوه استفاده',
            description: 'مشتری نیاز به راهنمایی برای استفاده از ویژگی‌های جدید داشته',
            date: '2024-01-15T08:45:00Z',
            status: 'resolved' as const,
            sentiment: 'neutral' as const,
            priority: 'low' as const,
            score: 3,
            agent: 'محمد رضایی'
        }
    ] as Touchpoint[]
};
export const mockInsightsData = [
    {
        id: '1',
        title: 'کاهش رضایت در کانال تلفنی',
        description: 'امتیاز CSAT در کانال تلفنی در ماه گذشته 15% کاهش یافته است',
        impact: 'high',
        status: 'new',
        category: 'رضایت مشتری',
        source: 'تحلیل CSAT',
        date: '1403/05/15',
        suggestion: 'بررسی فرآیند پاسخگویی تلفنی و آموزش مجدد تیم پشتیبانی'
    },
    {
        id: '2',
        title: 'افزایش زمان انتظار در چت',
        description: 'میانگین زمان انتظار در چت آنلاین به 5 دقیقه رسیده است',
        impact: 'medium',
        status: 'in_progress',
        category: 'عملکرد',
        source: 'آمار چت',
        date: '1403/05/14',
        suggestion: 'افزایش تعداد اپراتورهای چت در ساعات پیک'
    },
    {
        id: '3',
        title: 'بازخورد مثبت از ویژگی جدید',
        description: 'ویژگی جدید محصول بازخورد بسیار مثبتی از مشتریان دریافت کرده',
        impact: 'low',
        status: 'completed',
        category: 'محصول',
        source: 'نظرسنجی',
        date: '1403/05/13',
        suggestion: 'تبلیغ بیشتر این ویژگی و آموزش استفاده از آن'
    }
];
export const mockNPSData = {
    overview: {
        current: 7.5,
        previous: 7.2,
        target: 8.0,
        responses: 200,
        distribution: {
            promoters: 120,
            passives: 50,
            detractors: 30
        }
    },
    byChannel: [
        { channel: 'تلفن', score: 7.8, responses: 80 },
        { channel: 'ایمیل', score: 7.3, responses: 70 },
        { channel: 'چت', score: 7.6, responses: 50 }
    ],
    byDepartment: [
        { department: 'فروش', score: 7.5, responses: 65 },
        { department: 'پشتیبانی', score: 7.7, responses: 75 },
        { department: 'فنی', score: 7.2, responses: 60 }
    ],
    byProduct: [
        { product: 'محصول A', score: 8.1, responses: 45 },
        { product: 'محصول B', score: 7.8, responses: 55 },
        { product: 'محصول C', score: 7.2, responses: 40 }
    ],
    recentFeedback: [
        {
            id: '1',
            customerName: 'محمد احمدی',
            score: 9,
            date: '1403/05/15',
            channel: 'تلفن',
            comment: 'حتماً به دوستانم پیشنهاد می‌دهم'
        },
        {
            id: '2',
            customerName: 'سارا محمدی',
            score: 8,
            date: '1403/05/14',
            channel: 'چت',
            comment: 'خدمات خوبی ارائه می‌دهید'
        },
        {
            id: '3',
            customerName: 'علی رضایی',
            score: 6,
            date: '1403/05/13',
            channel: 'ایمیل',
            comment: 'خوب است ولی جای بهبود دارد'
        }
    ]
};
export const mockEmotionsData = {
    summary: {
        positive: 65,
        neutral: 25,
        negative: 10
    },
    wordCloud: [
        { word: 'عالی', count: 45, sentiment: 'positive' as const },
        { word: 'راضی', count: 38, sentiment: 'positive' as const },
        { word: 'خوب', count: 32, sentiment: 'positive' as const },
        { word: 'سریع', count: 28, sentiment: 'positive' as const },
        { word: 'مفید', count: 25, sentiment: 'positive' as const },
        { word: 'متوسط', count: 20, sentiment: 'neutral' as const },
        { word: 'معمولی', count: 18, sentiment: 'neutral' as const },
        { word: 'کند', count: 15, sentiment: 'negative' as const },
        { word: 'مشکل', count: 12, sentiment: 'negative' as const },
        { word: 'ضعیف', count: 8, sentiment: 'negative' as const }
    ],
    feedbacks: [
        {
            id: '1',
            text: 'خدمات شما واقعاً عالی است و من کاملاً راضی هستم',
            sentiment: 'positive' as const,
            score: 0.92,
            date: '1403/05/15',
            channel: 'تلفن'
        },
        {
            id: '2',
            text: 'خدمات خوبی ارائه می‌دهید ولی می‌تونه بهتر باشه',
            sentiment: 'neutral' as const,
            score: 0.65,
            date: '1403/05/14',
            channel: 'ایمیل'
        },
        {
            id: '3',
            text: 'پاسخگویی کند بود و مشکل من حل نشد',
            sentiment: 'negative' as const,
            score: 0.15,
            date: '1403/05/13',
            channel: 'چت'
        }
    ]
};
export const mockCustomerHealthData = {
    overallHealth: {
        score: 85,
        trend: '+5',
        components: {
            usage: 78,
            csat: 92,
            nps: 7.5,
            tickets: 15
        }
    },
    customers: [
        {
            id: '1',
            name: 'شرکت تکنولوژی پارس',
            healthScore: 92,
            status: 'green' as const,
            segments: ['Enterprise', 'Tech'],
            metrics: {
                usage: 85,
                csat: 95,
                nps: 8.2,
                tickets: 5
            },
            lastInteraction: '1403/05/15'
        },
        {
            id: '2',
            name: 'گروه صنعتی آریا',
            healthScore: 68,
            status: 'yellow' as const,
            segments: ['Mid-Market', 'Manufacturing'],
            metrics: {
                usage: 65,
                csat: 78,
                nps: 6.1,
                tickets: 25
            },
            lastInteraction: '1403/05/12'
        },
        {
            id: '3',
            name: 'شرکت بازرگانی سپهر',
            healthScore: 45,
            status: 'red' as const,
            segments: ['SMB', 'Retail'],
            metrics: {
                usage: 35,
                csat: 65,
                nps: 4.2,
                tickets: 45
            },
            lastInteraction: '1403/05/08'
        }
    ]
};
export const mockCSATData = {
    overview: {
        current: 4.2,
        previous: 4.0,
        target: 4.5,
        responses: 150,
        distribution: {
            5: 45,
            4: 60,
            3: 30,
            2: 10,
            1: 5
        }
    },
    byChannel: [
        { channel: 'تلفن', score: 4.3, responses: 50 },
        { channel: 'ایمیل', score: 4.1, responses: 60 },
        { channel: 'چت', score: 4.4, responses: 40 }
    ],
    byDepartment: [
        { department: 'فروش', score: 4.2, responses: 45 },
        { department: 'پشتیبانی', score: 4.3, responses: 55 },
        { department: 'فنی', score: 4.1, responses: 50 }
    ],
    recentResponses: [
        {
            id: '1',
            customerName: 'احمد محمدی',
            score: 5,
            date: '1403/05/15',
            channel: 'تلفن',
            comment: 'خدمات عالی بود، کاملاً راضی هستم'
        },
        {
            id: '2',
            customerName: 'فاطمه احمدی',
            score: 4,
            date: '1403/05/14',
            channel: 'چت',
            comment: 'خوب بود ولی می‌تونست بهتر باشه'
        },
        {
            id: '3',
            customerName: 'علی رضایی',
            score: 3,
            date: '1403/05/13',
            channel: 'ایمیل',
            comment: 'متوسط بود'
        }
    ]
};