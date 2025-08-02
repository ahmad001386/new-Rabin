'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Avatar,
    AvatarFallback,
} from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    ArrowRight,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    Eye,
    FileText,
    Mail,
    MessageCircle,
    Phone,
    Star,
    Ticket,
    TrendingUp,
    User,
    AlertTriangle,
    Plus,
    MapPin,
    Activity as ActivityIcon,
    ExternalLink,
    Save,
    Tag,
    Target,
    Users
} from 'lucide-react';

interface CustomerData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    industry?: string;
    segment?: string;
    status: string;
    priority?: string;
    assigned_user_name?: string;
    total_deals: number;
    total_tickets: number;
    total_contacts: number;
    won_value?: number;
    satisfaction_score?: number;
    created_at: string;
    salesPipeline?: {
        id: string;
        currentStage: string;
        currentStageName: string;
        dealValue?: number;
        successProbability: number;
        owner?: string;
        progress: number;
        stages: Array<{
            code: string;
            name: string;
            order: number;
            isActive: boolean;
            isCompleted: boolean;
        }>;
        lastContact?: string;
        nextAction?: string;
    };
    activities: Array<{
        id: string;
        type: string;
        title: string;
        description?: string;
        performed_by_name?: string;
        created_at: string;
        outcome?: string;
    }>;
    contacts: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        job_title?: string;
        is_primary: boolean;
    }>;
    notes?: Array<{
        id: string;
        title: string;
        content: string;
        category: string;
        created_at: string;
        created_by_name?: string;
        tags?: string[];
    }>;
    tasks?: Array<{
        id: string;
        title: string;
        description?: string;
        due_date?: string;
        priority: string;
        status: string;
        assigned_to?: string;
        created_at: string;
    }>;
    tags: string[];
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [showAddNote, setShowAddNote] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newActivity, setNewActivity] = useState({
        type: 'call',
        title: '',
        description: '',
        outcome: 'successful'
    });
    const [newNote, setNewNote] = useState({
        title: '',
        content: '',
        category: 'general',
        tags: ''
    });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'pending'
    });

    useEffect(() => {
        fetchCustomerData();
    }, [customerId]);

    // Utility function to get auth token
    const getAuthToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
    };

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const response = await fetch(`/api/customers/${customerId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (data.success) {
                setCustomer(data.data);
                console.log('✅ Customer data loaded:', data.data);
            } else {
                console.log('❌ Failed to fetch customer:', data.message);
                toast({
                    title: "خطا",
                    description: data.message || "خطا در دریافت اطلاعات مشتری",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (stageId: string) => {
        try {
            setUpdating(true);
            const token = getAuthToken();

            const response = await fetch(`/api/customers/${customerId}/sales-stage`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({ stageId }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "مرحله فروش با موفقیت به‌روزرسانی شد"
                });
                fetchCustomerData(); // Refresh data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی مرحله فروش",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating stage:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleAddActivity = async () => {
        if (!newActivity.title.trim()) {
            toast({
                title: "خطا",
                description: "عنوان فعالیت الزامی است",
                variant: "destructive"
            });
            return;
        }

        try {
            const token = getAuthToken();

            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    type: newActivity.type,
                    title: newActivity.title,
                    description: newActivity.description,
                    outcome: newActivity.outcome
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "فعالیت با موفقیت اضافه شد"
                });
                setShowAddActivity(false);
                setNewActivity({
                    type: 'call',
                    title: '',
                    description: '',
                    outcome: 'successful'
                });
                fetchCustomerData(); // Refresh data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در افزودن فعالیت",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error adding activity:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const handleAddNote = async () => {
        if (!newNote.title.trim() || !newNote.content.trim()) {
            toast({
                title: "خطا",
                description: "عنوان و محتوای یادداشت الزامی است",
                variant: "destructive"
            });
            return;
        }

        try {
            const token = getAuthToken();

            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    title: newNote.title,
                    content: newNote.content,
                    category: newNote.category,
                    tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "یادداشت با موفقیت اضافه شد"
                });
                setShowAddNote(false);
                setNewNote({
                    title: '',
                    content: '',
                    category: 'general',
                    tags: ''
                });
                fetchCustomerData(); // Refresh data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در افزودن یادداشت",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error adding note:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            toast({
                title: "خطا",
                description: "عنوان تسک الزامی است",
                variant: "destructive"
            });
            return;
        }

        try {
            const token = getAuthToken();

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    title: newTask.title,
                    description: newTask.description,
                    due_date: newTask.due_date,
                    priority: newTask.priority,
                    status: newTask.status
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "تسک با موفقیت اضافه شد"
                });
                setShowAddTask(false);
                setNewTask({
                    title: '',
                    description: '',
                    due_date: '',
                    priority: 'medium',
                    status: 'pending'
                });
                fetchCustomerData(); // Refresh data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در افزودن تسک",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error adding task:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'فعال';
            case 'inactive': return 'غیرفعال';
            case 'prospect': return 'نیاز به پیگیری';
            case 'customer': return 'مشتری';
            case 'partner': return 'شریک';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'inactive': return 'secondary';
            case 'prospect': return 'destructive';
            case 'customer': return 'default';
            case 'partner': return 'secondary';
            default: return 'secondary';
        }
    };

    const getSegmentLabel = (segment?: string) => {
        if (!segment) return 'نامشخص';
        switch (segment) {
            case 'enterprise': return 'سازمانی';
            case 'small_business': return 'کسب‌وکار کوچک';
            case 'individual': return 'فردی';
            default: return segment;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high': return 'بالا';
            case 'medium': return 'متوسط';
            case 'low': return 'پایین';
            default: return priority || 'متوسط';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'تعریف نشده';
        return `${(amount / 1000000).toLocaleString('fa-IR')}M تومان`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'نامشخص';
        return new Date(dateString).toLocaleDateString('fa-IR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground font-vazir mt-4">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-vazir">مشتری یافت نشد</h2>
                    <p className="text-muted-foreground font-vazir mt-2">مشتری مورد نظر وجود ندارد</p>
                    <Button onClick={() => router.push('/dashboard/customers')} className="mt-4 font-vazir">
                        بازگشت به لیست مشتریان
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/customers')}
                        className="hover:bg-primary/10"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir text-lg">
                                {customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold font-vazir">{customer.name}</h1>
                            <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                <Badge variant={getStatusColor(customer.status)} className="font-vazir">
                                    {getStatusLabel(customer.status)}
                                </Badge>
                                <span className="text-muted-foreground font-vazir">{getSegmentLabel(customer.segment)}</span>
                                {customer.priority && (
                                    <span className={`text-sm font-medium ${getPriorityColor(customer.priority)} font-vazir`}>
                                        اولویت {getPriorityLabel(customer.priority)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                    <Button variant="outline" className="font-vazir" disabled={!customer.phone}>
                        <Phone className="h-4 w-4 ml-2" />
                        تماس
                    </Button>
                    <Button variant="outline" className="font-vazir" disabled={!customer.email}>
                        <Mail className="h-4 w-4 ml-2" />
                        ایمیل
                    </Button>
                    <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                    </Button>
                </div>
            </div>

            {/* اطلاعات کلی و آمار */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">ارزش بالقوه</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-vazir">
                            {formatCurrency(customer.salesPipeline?.dealValue)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">امتیاز رضایت</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 font-vazir">
                            {customer.satisfaction_score ? customer.satisfaction_score.toFixed(1) : 'ندارد'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">تعداد تیکت‌ها</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-vazir">{customer.total_tickets.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">مسئول</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium font-vazir">{customer.assigned_user_name || 'تخصیص نیافته'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* فرایند فروش */}
            {customer.salesPipeline && (
                <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span>فرایند فروش</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* اطلاعات کلی معامله */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground font-vazir">مرحله فعلی</p>
                                    <p className="text-lg font-bold font-vazir">{customer.salesPipeline.currentStageName}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground font-vazir">احتمال موفقیت</p>
                                    <p className="text-lg font-bold text-primary font-vazir">
                                        %{customer.salesPipeline.successProbability?.toLocaleString('fa-IR')}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground font-vazir">ارزش معامله</p>
                                    <p className="text-lg font-bold text-secondary font-vazir">
                                        {formatCurrency(customer.salesPipeline.dealValue)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground font-vazir">مسئول فروش</p>
                                    <p className="text-lg font-bold font-vazir">{customer.salesPipeline.owner || 'تخصیص نیافته'}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* نمودار پیشرفت */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium font-vazir">پیشرفت کلی</span>
                                    <span className="text-sm text-muted-foreground font-vazir">
                                        %{customer.salesPipeline.progress}
                                    </span>
                                </div>
                                <Progress value={customer.salesPipeline.progress} className="h-3" />
                            </div>

                            {/* مراحل فروش */}
                            <div className="space-y-4">
                                <h4 className="font-medium font-vazir">مراحل فرایند فروش</h4>
                                <div className="grid gap-4 md:grid-cols-6">
                                    {customer?.salesPipeline?.stages?.map((stage, index) => {
                                        const getStageIcon = (stage: any, isActive: boolean) => {
                                            const iconClass = `h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
                                            switch (stage.code) {
                                                case 'new_lead': return <User className={iconClass} />;
                                                case 'contacted': return <Phone className={iconClass} />;
                                                case 'needs_analysis': return <Eye className={iconClass} />;
                                                case 'proposal_sent': return <FileText className={iconClass} />;
                                                case 'negotiation': return <MessageCircle className={iconClass} />;
                                                case 'closed_won': return <CheckCircle className={iconClass} />;
                                                case 'closed_lost': return <AlertTriangle className={iconClass} />;
                                                default: return <Clock className={iconClass} />;
                                            }
                                        };

                                        return (
                                            <div
                                                key={stage.code}
                                                className={`p-4 rounded-lg border text-center transition-all duration-300 ${stage.isActive
                                                    ? 'border-primary bg-primary/10 shadow-lg'
                                                    : stage.isCompleted
                                                        ? 'border-secondary bg-secondary/10'
                                                        : 'border-border bg-muted/50'
                                                    }`}
                                                onClick={() => !updating && handleStageChange(stage.order.toString())}
                                            >
                                                <div className="flex justify-center mb-2">
                                                    {getStageIcon(stage, stage.isActive || stage.isCompleted)}
                                                </div>
                                                <p className={`text-sm font-medium font-vazir ${stage.isActive ? 'text-primary' : stage.isCompleted ? 'text-secondary' : 'text-muted-foreground'
                                                    }`}>
                                                    {stage.name}
                                                </p>
                                                {stage.isActive && (
                                                    <Badge variant="default" className="mt-2 font-vazir">فعلی</Badge>
                                                )}
                                                {stage.isCompleted && (
                                                    <CheckCircle className="h-4 w-4 text-secondary mx-auto mt-2" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* اطلاعات اضافی */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium font-vazir">آخرین تماس</p>
                                    <p className="text-sm text-muted-foreground font-vazir">
                                        {formatDate(customer.salesPipeline.lastContact)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium font-vazir">تعداد تلاش‌ها</p>
                                    <p className="text-sm text-muted-foreground font-vazir">
                                        {customer.activities.length} بار
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium font-vazir">اقدام بعدی</p>
                                    <p className="text-sm text-muted-foreground font-vazir">
                                        {customer.salesPipeline.nextAction || 'تعریف نشده'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* اطلاعات تماس */}
            <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
                        <Building className="h-5 w-5 text-secondary" />
                        <span>اطلاعات تماس</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {customer.email && (
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="font-vazir">{customer.email}</span>
                            </div>
                        )}
                        {customer.phone && (
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-vazir">{customer.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-vazir">
                                عضویت: {formatDate(customer.created_at)}
                            </span>
                        </div>
                    </div>
                    {customer.tags && customer.tags.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2 font-vazir">برچسب‌ها:</p>
                            <div className="flex flex-wrap gap-2">
                                {customer.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="font-vazir">
                                        <Tag className="h-3 w-3 ml-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* تب‌های جزئیات */}
            <Tabs defaultValue="activities" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activities" className="font-vazir">فعالیت‌ها</TabsTrigger>
                    <TabsTrigger value="notes" className="font-vazir">یادداشت‌ها</TabsTrigger>
                    <TabsTrigger value="tasks" className="font-vazir">تسک‌ها</TabsTrigger>
                    <TabsTrigger value="contacts" className="font-vazir">مخاطبین</TabsTrigger>
                </TabsList>

                {/* فعالیت‌ها */}
                <TabsContent value="activities">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-vazir">فعالیت‌ها ({customer.activities.length.toLocaleString('fa-IR')})</CardTitle>
                                <Button
                                    onClick={() => setShowAddActivity(true)}
                                    size="sm"
                                    className="font-vazir"
                                >
                                    <Plus className="h-4 w-4 ml-2" />
                                    افزودن فعالیت
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddActivity && (
                                <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                                    <h4 className="font-medium mb-4 font-vazir">افزودن فعالیت جدید</h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="font-vazir">نوع فعالیت</Label>
                                            <Select value={newActivity.type} onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}>
                                                <SelectTrigger className="font-vazir">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="call" className="font-vazir">تماس تلفنی</SelectItem>
                                                    <SelectItem value="meeting" className="font-vazir">جلسه</SelectItem>
                                                    <SelectItem value="email" className="font-vazir">ایمیل</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">نتیجه</Label>
                                            <Select value={newActivity.outcome} onValueChange={(value) => setNewActivity({ ...newActivity, outcome: value })}>
                                                <SelectTrigger className="font-vazir">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="successful" className="font-vazir">موفق</SelectItem>
                                                    <SelectItem value="follow_up_needed" className="font-vazir">نیاز به پیگیری</SelectItem>
                                                    <SelectItem value="no_response" className="font-vazir">بدون پاسخ</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">عنوان</Label>
                                            <Input
                                                value={newActivity.title}
                                                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                                placeholder="عنوان فعالیت"
                                                className="font-vazir"
                                                dir="rtl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">توضیحات</Label>
                                            <Textarea
                                                value={newActivity.description}
                                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                                placeholder="توضیحات فعالیت"
                                                className="font-vazir"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse mt-4">
                                        <Button onClick={handleAddActivity} size="sm" className="font-vazir">
                                            <Save className="h-4 w-4 ml-2" />
                                            ذخیره
                                        </Button>
                                        <Button onClick={() => setShowAddActivity(false)} variant="outline" size="sm" className="font-vazir">
                                            انصراف
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {customer.activities.length > 0 ? (
                                    customer.activities.map((activity) => (
                                        <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                {activity.type === 'call' ? <Phone className="h-4 w-4" /> :
                                                    activity.type === 'meeting' ? <Calendar className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium font-vazir">{activity.title}</h4>
                                                    <span className="text-sm text-muted-foreground font-vazir">
                                                        {formatDate(activity.created_at)}
                                                    </span>
                                                </div>
                                                {activity.description && (
                                                    <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                                                )}
                                                <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                                    <span className="text-xs text-muted-foreground font-vazir">
                                                        توسط: {activity.performed_by_name || 'نامشخص'}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs font-vazir">
                                                        {activity.outcome === 'successful' ? 'موفق' :
                                                            activity.outcome === 'follow_up_needed' ? 'نیاز به پیگیری' : 'بدون پاسخ'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground font-vazir py-8">
                                        فعالیتی ثبت نشده است
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* یادداشت‌ها */}
                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-vazir">یادداشت‌ها ({customer.notes?.length || 0})</CardTitle>
                                <Button
                                    onClick={() => setShowAddNote(true)}
                                    size="sm"
                                    className="font-vazir"
                                >
                                    <Plus className="h-4 w-4 ml-2" />
                                    افزودن یادداشت
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddNote && (
                                <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                                    <h4 className="font-medium mb-4 font-vazir">افزودن یادداشت جدید</h4>
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="font-vazir">عنوان</Label>
                                                <Input
                                                    value={newNote.title}
                                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                                    placeholder="عنوان یادداشت"
                                                    className="font-vazir"
                                                    dir="rtl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-vazir">دسته‌بندی</Label>
                                                <Select value={newNote.category} onValueChange={(value) => setNewNote({ ...newNote, category: value })}>
                                                    <SelectTrigger className="font-vazir">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="customer_need" className="font-vazir">نیاز مشتری</SelectItem>
                                                        <SelectItem value="sales_tip" className="font-vazir">نکته فروش</SelectItem>
                                                        <SelectItem value="objection" className="font-vazir">اعتراض</SelectItem>
                                                        <SelectItem value="general" className="font-vazir">عمومی</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">محتوا</Label>
                                            <Textarea
                                                value={newNote.content}
                                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                                placeholder="محتوای یادداشت..."
                                                rows={4}
                                                className="font-vazir"
                                                dir="rtl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">برچسب‌ها (با کاما جدا کنید)</Label>
                                            <Input
                                                value={newNote.tags}
                                                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                                                placeholder="برچسب۱، برچسب۲، ..."
                                                className="font-vazir"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse mt-4">
                                        <Button onClick={handleAddNote} size="sm" className="font-vazir">
                                            <Save className="h-4 w-4 ml-2" />
                                            ذخیره
                                        </Button>
                                        <Button onClick={() => setShowAddNote(false)} variant="outline" size="sm" className="font-vazir">
                                            انصراف
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {customer.notes && customer.notes.length > 0 ? (
                                    customer.notes.map((note) => (
                                        <div key={note.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-secondary/30 transition-all duration-300">
                                            <div className="p-2 rounded-full bg-secondary/10 text-secondary">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium font-vazir">{note.title}</h4>
                                                    <span className="text-sm text-muted-foreground font-vazir">
                                                        {formatDate(note.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm mt-2 font-vazir">{note.content}</p>
                                                <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                                    <span className="text-xs text-muted-foreground font-vazir">
                                                        توسط: {note.created_by_name || 'نامشخص'}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs font-vazir">
                                                        {note.category === 'customer_need' ? 'نیاز مشتری' :
                                                            note.category === 'sales_tip' ? 'نکته فروش' :
                                                                note.category === 'objection' ? 'اعتراض' : 'عمومی'}
                                                    </Badge>
                                                </div>
                                                {note.tags && note.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {note.tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs font-vazir">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground font-vazir py-8">
                                        یادداشتی ثبت نشده است
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* تسک‌ها */}
                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-vazir">تسک‌ها ({customer.tasks?.length || 0})</CardTitle>
                                <Button
                                    onClick={() => setShowAddTask(true)}
                                    size="sm"
                                    className="font-vazir"
                                >
                                    <Plus className="h-4 w-4 ml-2" />
                                    افزودن تسک
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showAddTask && (
                                <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                                    <h4 className="font-medium mb-4 font-vazir">افزودن تسک جدید</h4>
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="font-vazir">عنوان</Label>
                                                <Input
                                                    value={newTask.title}
                                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                    placeholder="عنوان تسک"
                                                    className="font-vazir"
                                                    dir="rtl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-vazir">تاریخ سررسید</Label>
                                                <Input
                                                    type="date"
                                                    value={newTask.due_date}
                                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                                    className="font-vazir"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="font-vazir">اولویت</Label>
                                                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                                                    <SelectTrigger className="font-vazir">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="high" className="font-vazir">بالا</SelectItem>
                                                        <SelectItem value="medium" className="font-vazir">متوسط</SelectItem>
                                                        <SelectItem value="low" className="font-vazir">پایین</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-vazir">وضعیت</Label>
                                                <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                                                    <SelectTrigger className="font-vazir">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending" className="font-vazir">در انتظار</SelectItem>
                                                        <SelectItem value="in_progress" className="font-vazir">در حال انجام</SelectItem>
                                                        <SelectItem value="completed" className="font-vazir">تکمیل شده</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-vazir">توضیحات</Label>
                                            <Textarea
                                                value={newTask.description}
                                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                placeholder="توضیحات تسک..."
                                                rows={3}
                                                className="font-vazir"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse mt-4">
                                        <Button onClick={handleAddTask} size="sm" className="font-vazir">
                                            <Save className="h-4 w-4 ml-2" />
                                            ذخیره
                                        </Button>
                                        <Button onClick={() => setShowAddTask(false)} variant="outline" size="sm" className="font-vazir">
                                            انصراف
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {customer.tasks && customer.tasks.length > 0 ? (
                                    customer.tasks.map((task) => (
                                        <div key={task.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-accent/30 transition-all duration-300">
                                            <div className="p-2 rounded-full bg-accent/10 text-accent">
                                                {task.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                                                    task.status === 'in_progress' ? <Clock className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium font-vazir">{task.title}</h4>
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        {task.due_date && (
                                                            <span className="text-sm text-muted-foreground font-vazir">
                                                                سررسید: {formatDate(task.due_date)}
                                                            </span>
                                                        )}
                                                        <Badge variant={task.priority === 'high' ? 'destructive' :
                                                            task.priority === 'medium' ? 'default' : 'outline'}
                                                            className="text-xs font-vazir">
                                                            {getPriorityLabel(task.priority)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm mt-2 font-vazir">{task.description}</p>
                                                )}
                                                <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                                    <span className="text-xs text-muted-foreground font-vazir">
                                                        مسئول: {task.assigned_to || 'تخصیص نیافته'}
                                                    </span>
                                                    <Badge variant={task.status === 'completed' ? 'secondary' :
                                                        task.status === 'in_progress' ? 'default' : 'outline'}
                                                        className="text-xs font-vazir">
                                                        {task.status === 'completed' ? 'تکمیل شده' :
                                                            task.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground font-vazir py-8">
                                        تسکی تعریف نشده است
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* مخاطبین */}
                <TabsContent value="contacts">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">مخاطبین ({customer.contacts.length.toLocaleString('fa-IR')})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {customer.contacts.length > 0 ? (
                                    customer.contacts.map((contact) => (
                                        <div key={contact.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                                            <div className="flex items-center space-x-3 space-x-reverse">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir">
                                                        {`${contact.first_name[0]}${contact.last_name[0]}`}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium font-vazir">{`${contact.first_name} ${contact.last_name}`}</p>
                                                    <p className="text-sm text-muted-foreground font-vazir">{contact.job_title || 'بدون عنوان'}</p>
                                                    <div className="flex items-center space-x-4 space-x-reverse mt-1">
                                                        <span className="text-xs text-muted-foreground font-vazir">{contact.email || 'بدون ایمیل'}</span>
                                                        <span className="text-xs text-muted-foreground font-vazir">{contact.phone || 'بدون تلفن'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 space-x-reverse">
                                                <Button size="sm" variant="outline" className="font-vazir" disabled={!contact.phone}>
                                                    <Phone className="h-4 w-4 ml-1" />
                                                    تماس
                                                </Button>
                                                <Button size="sm" variant="outline" className="font-vazir" disabled={!contact.email}>
                                                    <Mail className="h-4 w-4 ml-1" />
                                                    ایمیل
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground font-vazir py-8">
                                        مخاطبی ثبت نشده است
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}