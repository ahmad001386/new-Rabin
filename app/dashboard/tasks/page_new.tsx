'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Calendar,
    Filter,
    Users,
    FileText,
    Upload,
    Download,
    Trash2,
    Eye,
    Edit,
    MessageSquare,
    X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    due_date?: string;
    created_at: string;
    completed_at?: string;
    completion_notes?: string;
    assigned_to_names?: string;
    assigned_user_ids?: string;
    assigned_by_name?: string;
    customer_name?: string;
    files?: TaskFile[];
}

interface TaskFile {
    id: string;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by_name: string;
    uploaded_at: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    status: string;
}

export default function TasksPage() {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: [] as string[],
        priority: 'medium',
        due_date: '',
    });

    // Fetch current user info
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // Fetch tasks and users
    useEffect(() => {
        if (currentUser) {
            fetchTasks();
            if (isManager()) {
                fetchUsers();
            }
        }
    }, [currentUser]);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (data.success) {
                setCurrentUser(data.user);
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tasks');
            const data = await response.json();

            if (data.success) {
                setTasks(data.data);
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در دریافت وظایف",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast({
                title: "خطا",
                description: "خطا در دریافت وظایف",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/tasks/users');
            const data = await response.json();

            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const isManager = () => {
        return currentUser && ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(currentUser.role);
    };

    const handleAddTask = async () => {
        if (!newTask.title || newTask.assigned_to.length === 0 || !newTask.due_date) {
            toast({
                title: "خطا",
                description: "لطفاً تمام فیلدهای الزامی را پر کنید",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفقیت",
                    description: "وظیفه با موفقیت ایجاد شد",
                });
                setShowAddTask(false);
                setNewTask({
                    title: '',
                    description: '',
                    assigned_to: [],
                    priority: 'medium',
                    due_date: '',
                });
                fetchTasks();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ایجاد وظیفه",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error creating task:', error);
            toast({
                title: "خطا",
                description: "خطا در ایجاد وظیفه",
                variant: "destructive",
            });
        }
    };

    const handleTaskStatusChange = async (taskId: string, status: string, notes?: string) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId,
                    status,
                    completion_notes: notes,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفقیت",
                    description: data.message,
                });
                fetchTasks();
                setShowCompleteDialog(false);
                setCompletionNotes('');
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی وظیفه",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast({
                title: "خطا",
                description: "خطا در به‌روزرسانی وظیفه",
                variant: "destructive",
            });
        }
    };

    const handleFileUpload = async (taskId: string, file: File) => {
        try {
            setUploadingFile(true);
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('file', file);

            const response = await fetch('/api/tasks/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفقیت",
                    description: "فایل با موفقیت آپلود شد",
                });
                fetchTasks();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در آپلود فایل",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: "خطا",
                description: "خطا در آپلود فایل",
                variant: "destructive",
            });
        } finally {
            setUploadingFile(false);
        }
    };

    const handleFileDelete = async (fileId: string) => {
        try {
            const response = await fetch(`/api/tasks/upload?fileId=${fileId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفقیت",
                    description: "فایل با موفقیت حذف شد",
                });
                fetchTasks();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در حذف فایل",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            toast({
                title: "خطا",
                description: "خطا در حذف فایل",
                variant: "destructive",
            });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950';
            case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
            case 'low': return 'text-green-500 bg-green-50 dark:bg-green-950';
            default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high': return 'ضروری';
            case 'medium': return 'متوسط';
            case 'low': return 'عادی';
            default: return priority;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'در انتظار';
            case 'in_progress': return 'در حال انجام';
            case 'completed': return 'تکمیل شده';
            case 'cancelled': return 'لغو شده';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
            case 'in_progress': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
            case 'completed': return 'text-green-500 bg-green-50 dark:bg-green-950';
            case 'cancelled': return 'text-red-500 bg-red-50 dark:bg-red-950';
            default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 بایت';
        const k = 1024;
        const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredTasks = tasks.filter(task => {
        switch (activeTab) {
            case 'pending':
                return task.status === 'pending';
            case 'in_progress':
                return task.status === 'in_progress';
            case 'completed':
                return task.status === 'completed';
            default:
                return true;
        }
    });

    const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        high_priority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground font-vazir">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* هدر */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        مدیریت وظایف
                    </h1>
                    <p className="text-muted-foreground font-vazir mt-2">مدیریت و پیگیری وظایف تیم</p>
                </div>
                {isManager() && (
                    <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
                                <Plus className="h-4 w-4 ml-2" />
                                وظیفه جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="font-vazir text-lg">ایجاد وظیفه جدید</DialogTitle>
                                <DialogDescription className="font-vazir text-sm text-muted-foreground">
                                    مشخصات وظیفه جدید را وارد کنید
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium font-vazir">عنوان وظیفه *</label>
                                    <Input
                                        placeholder="عنوان وظیفه را وارد کنید"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="font-vazir"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium font-vazir">توضیحات</label>
                                    <Textarea
                                        placeholder="توضیحات وظیفه را وارد کنید"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="font-vazir"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium font-vazir">اولویت</label>
                                        <Select
                                            value={newTask.priority}
                                            onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                                        >
                                            <SelectTrigger className="font-vazir">
                                                <SelectValue placeholder="انتخاب اولویت" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high" className="font-vazir">ضروری</SelectItem>
                                                <SelectItem value="medium" className="font-vazir">متوسط</SelectItem>
                                                <SelectItem value="low" className="font-vazir">عادی</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium font-vazir">تاریخ سررسید *</label>
                                        <PersianDatePicker
                                            value={newTask.due_date}
                                            onChange={(value) => setNewTask({ ...newTask, due_date: value })}
                                            placeholder="انتخاب تاریخ"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium font-vazir">محول به *</label>
                                    <Select
                                        value={newTask.assigned_to.length > 0 ? newTask.assigned_to[0] : ''}
                                        onValueChange={(value) => {
                                            if (value && !newTask.assigned_to.includes(value)) {
                                                setNewTask({ ...newTask, assigned_to: [...newTask.assigned_to, value] });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="font-vazir">
                                            <SelectValue placeholder="انتخاب همکار" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id} className="font-vazir">
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback className="font-vazir bg-primary/10 text-primary text-xs">
                                                                {user.name.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{user.role}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* نمایش کاربران انتخاب شده */}
                                    {newTask.assigned_to.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newTask.assigned_to.map(userId => {
                                                const user = users.find(u => u.id === userId);
                                                return user ? (
                                                    <Badge key={userId} variant="secondary" className="font-vazir">
                                                        {user.name}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 mr-1"
                                                            onClick={() => setNewTask({
                                                                ...newTask,
                                                                assigned_to: newTask.assigned_to.filter(id => id !== userId)
                                                            })}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddTask(false)}
                                        className="font-vazir"
                                    >
                                        انصراف
                                    </Button>
                                    <Button
                                        onClick={handleAddTask}
                                        disabled={!newTask.title || newTask.assigned_to.length === 0 || !newTask.due_date}
                                        className="font-vazir bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        ایجاد وظیفه
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* آمار سریع */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">کل وظایف</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-vazir">{taskStats.total.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 hover:border-blue-400 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">در انتظار</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 font-vazir">
                            {taskStats.pending.toLocaleString('fa-IR')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 hover:border-yellow-400 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">در حال انجام</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 font-vazir">
                            {taskStats.in_progress.toLocaleString('fa-IR')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 hover:border-green-400 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">تکمیل شده</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 font-vazir">
                            {taskStats.completed.toLocaleString('fa-IR')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 hover:border-red-400 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">ضروری</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 font-vazir">
                            {taskStats.high_priority.toLocaleString('fa-IR')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* تب‌های فیلتر */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="font-vazir">همه</TabsTrigger>
                    <TabsTrigger value="pending" className="font-vazir">در انتظار</TabsTrigger>
                    <TabsTrigger value="in_progress" className="font-vazir">در حال انجام</TabsTrigger>
                    <TabsTrigger value="completed" className="font-vazir">تکمیل شده</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span>لیست وظایف</span>
                                </CardTitle>
                                <Button variant="outline" size="sm" className="font-vazir">
                                    <Filter className="h-4 w-4 ml-2" />
                                    فیلتر
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground font-vazir">هیچ وظیفه‌ای یافت نشد</p>
                                    </div>
                                ) : (
                                    filteredTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex items-start space-x-4 space-x-reverse p-4 border rounded-lg transition-all duration-300 ${task.status === 'completed'
                                                ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/20'
                                                : 'border-border/50 hover:border-primary/30'
                                                }`}
                                        >
                                            <Checkbox
                                                checked={task.status === 'completed'}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedTask(task);
                                                        setShowCompleteDialog(true);
                                                    } else {
                                                        handleTaskStatusChange(task.id, 'pending');
                                                    }
                                                }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className={`font-medium font-vazir ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                                                            }`}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className="text-sm text-muted-foreground font-vazir mt-1">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                                            <Badge className={`${getPriorityColor(task.priority)} font-vazir`}>
                                                                {getPriorityLabel(task.priority)}
                                                            </Badge>
                                                            <Badge className={`${getStatusColor(task.status)} font-vazir`}>
                                                                {getStatusLabel(task.status)}
                                                            </Badge>
                                                            {task.due_date && (
                                                                <div className="flex items-center text-sm text-muted-foreground">
                                                                    <Calendar className="h-4 w-4 ml-1" />
                                                                    <span className="font-vazir">
                                                                        {moment(task.due_date).format('jYYYY/jMM/jDD')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {task.assigned_to_names && (
                                                                <div className="flex items-center text-sm text-muted-foreground">
                                                                    <Users className="h-4 w-4 ml-1" />
                                                                    <span className="font-vazir">{task.assigned_to_names}</span>
                                                                </div>
                                                            )}
                                                            {task.files && task.files.length > 0 && (
                                                                <div className="flex items-center text-sm text-muted-foreground">
                                                                    <FileText className="h-4 w-4 ml-1" />
                                                                    <span className="font-vazir">{task.files.length} فایل</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedTask(task);
                                                                setShowTaskDetail(true);
                                                            }}
                                                            className="font-vazir"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {task.status !== 'completed' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleTaskStatusChange(
                                                                        task.id,
                                                                        task.status === 'in_progress' ? 'pending' : 'in_progress'
                                                                    )}
                                                                    className="font-vazir"
                                                                >
                                                                    {task.status === 'in_progress' ? 'توقف' : 'شروع'}
                                                                </Button>
                                                                <input
                                                                    type="file"
                                                                    id={`file-${task.id}`}
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            handleFileUpload(task.id, file);
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => document.getElementById(`file-${task.id}`)?.click()}
                                                                    disabled={uploadingFile}
                                                                    className="font-vazir"
                                                                >
                                                                    <Upload className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* دیالوگ تکمیل وظیفه */}
            <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-vazir">تکمیل وظیفه</AlertDialogTitle>
                        <AlertDialogDescription className="font-vazir">
                            آیا مطمئن هستید که این وظیفه تکمیل شده است؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 my-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium font-vazir">توضیحات تکمیل (اختیاری)</label>
                            <Textarea
                                placeholder="توضیحات مربوط به تکمیل وظیفه را وارد کنید"
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                className="font-vazir"
                                rows={3}
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-vazir">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedTask) {
                                    handleTaskStatusChange(selectedTask.id, 'completed', completionNotes);
                                }
                            }}
                            className="font-vazir"
                        >
                            تکمیل وظیفه
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* دیالوگ جزئیات وظیفه */}
            <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-vazir text-lg">جزئیات وظیفه</DialogTitle>
                    </DialogHeader>
                    {selectedTask && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <h3 className="font-medium font-vazir text-lg">{selectedTask.title}</h3>
                                {selectedTask.description && (
                                    <p className="text-muted-foreground font-vazir mt-2">{selectedTask.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">وضعیت</label>
                                    <Badge className={`${getStatusColor(selectedTask.status)} font-vazir mt-1`}>
                                        {getStatusLabel(selectedTask.status)}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">اولویت</label>
                                    <Badge className={`${getPriorityColor(selectedTask.priority)} font-vazir mt-1`}>
                                        {getPriorityLabel(selectedTask.priority)}
                                    </Badge>
                                </div>
                            </div>

                            {selectedTask.due_date && (
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">تاریخ سررسید</label>
                                    <p className="font-vazir mt-1">
                                        {moment(selectedTask.due_date).format('jYYYY/jMM/jDD - HH:mm')}
                                    </p>
                                </div>
                            )}

                            {selectedTask.assigned_to_names && (
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">محول به</label>
                                    <p className="font-vazir mt-1">{selectedTask.assigned_to_names}</p>
                                </div>
                            )}

                            {selectedTask.assigned_by_name && (
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">ایجاد شده توسط</label>
                                    <p className="font-vazir mt-1">{selectedTask.assigned_by_name}</p>
                                </div>
                            )}

                            {selectedTask.completion_notes && (
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">توضیحات تکمیل</label>
                                    <p className="font-vazir mt-1">{selectedTask.completion_notes}</p>
                                </div>
                            )}

                            {selectedTask.files && selectedTask.files.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium font-vazir text-muted-foreground">فایل‌های پیوست</label>
                                    <div className="space-y-2 mt-2">
                                        {selectedTask.files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-vazir">{file.original_name}</p>
                                                        <p className="text-xs text-muted-foreground font-vazir">
                                                            {formatFileSize(file.file_size)} • {file.uploaded_by_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(file.file_path, '_blank')}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFileDelete(file.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTaskDetail(false)}
                                    className="font-vazir"
                                >
                                    بستن
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}