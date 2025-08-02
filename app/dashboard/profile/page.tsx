"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toPersianDate } from "@/lib/utils/date";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Edit,
    FileText,
    Upload,
    CheckCircle2,
    Loader2,
    Save,
    AlertCircle,
    Target
} from "lucide-react";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    avatar?: string;
}

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
    customer_name?: string;
}

interface DailyReport {
    id?: string;
    work_description: string;
    completed_tasks?: string[];
    working_hours?: number;
    challenges?: string;
    achievements?: string;
    report_date?: string;
    persian_date?: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: ''
    });

    // Tasks state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);

    // Daily report state
    const [dailyReport, setDailyReport] = useState<DailyReport>({
        work_description: '',
        completed_tasks: [],
        working_hours: 0,
        challenges: '',
        achievements: ''
    });
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSaving, setReportSaving] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
        fetchTasks();
        fetchTodayReport();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/profile');
            const data = await response.json();

            if (data.success) {
                setUser(data.data);
                setEditForm({
                    name: data.data.name,
                    phone: data.data.phone || ''
                });
            } else {
                toast({
                    title: "خطا",
                    description: "خطا در دریافت اطلاعات پروفایل",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            setTasksLoading(true);
            const response = await fetch('/api/tasks');
            const data = await response.json();

            if (data.success) {
                setTasks(data.data || []);
            } else {
                console.error('Error fetching tasks:', data.message);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setTasksLoading(false);
        }
    };

    const fetchTodayReport = async () => {
        try {
            setReportLoading(true);
            const response = await fetch('/api/reports/today');
            const data = await response.json();

            if (data.success && data.data) {
                const report = data.data;
                setDailyReport({
                    work_description: report.work_description || '',
                    completed_tasks: report.completed_tasks ? JSON.parse(report.completed_tasks) : [],
                    working_hours: report.working_hours || 0,
                    challenges: report.challenges || '',
                    achievements: report.achievements || ''
                });
            }
        } catch (error) {
            console.error('Error fetching today report:', error);
        } finally {
            setReportLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "اطلاعات پروفایل به‌روزرسانی شد"
                });
                setEditMode(false);
                fetchProfile(); // refresh profile data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی پروفایل",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const handleUploadImage = () => {
        // در اینجا منطق آپلود تصویر قرار می‌گیرد
        alert('این قابلیت در نسخه بعدی اضافه خواهد شد');
    };

    const handleSaveReport = async () => {
        if (!dailyReport.work_description.trim()) {
            toast({
                title: "خطا",
                description: "لطفاً توضیحات کار انجام شده را وارد کنید",
                variant: "destructive"
            });
            return;
        }

        try {
            setReportSaving(true);
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dailyReport),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: data.message
                });
                fetchTodayReport(); // Refresh the report
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ثبت گزارش",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error saving report:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setReportSaving(false);
        }
    };

    const handleTaskComplete = async (taskId: string) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId,
                    status: 'completed'
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "وظیفه با موفقیت تکمیل شد"
                });
                fetchTasks(); // Refresh tasks
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در تکمیل وظیفه",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error completing task:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
            'pending': { label: 'در انتظار', variant: 'outline' },
            'in_progress': { label: 'در حال انجام', variant: 'default' },
            'completed': { label: 'تکمیل شده', variant: 'secondary' },
            'cancelled': { label: 'لغو شده', variant: 'destructive' }
        };

        return statusMap[status] || { label: status, variant: 'outline' };
    };

    const getPriorityBadge = (priority: string) => {
        const priorityMap: { [key: string]: { label: string; className: string } } = {
            'high': { label: 'بالا', className: 'bg-red-100 text-red-800' },
            'medium': { label: 'متوسط', className: 'bg-yellow-100 text-yellow-800' },
            'low': { label: 'پایین', className: 'bg-green-100 text-green-800' }
        };

        return priorityMap[priority] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground font-vazir">در حال بارگذاری...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto py-6 px-4">
                <div className="text-center">
                    <p className="text-muted-foreground font-vazir">خطا در بارگذاری اطلاعات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="relative">
                        <Image
                            src={user.avatar || '/images/avatar-default.png'}
                            alt="avatar"
                            width={100}
                            height={100}
                            className="rounded-full border-4 border-primary/20"
                        />
                        <Button
                            size="icon"
                            variant="outline"
                            className="absolute bottom-0 right-0 rounded-full"
                            onClick={handleUploadImage}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 font-vazir">{user.name}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="font-vazir">{user.role}</Badge>
                            <Badge variant="outline" className="bg-green-50 font-vazir">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    آنلاین
                                </div>
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="info">اطلاعات شخصی</TabsTrigger>
                    <TabsTrigger value="tasks">وظایف من</TabsTrigger>
                    <TabsTrigger value="daily-report">گزارش روزانه</TabsTrigger>
                    <TabsTrigger value="settings">تنظیمات</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">اطلاعات شخصی</CardTitle>
                            <CardDescription className="font-vazir">اطلاعات پایه و تماس شما</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-vazir">ایمیل</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-vazir">تلفن</p>
                                        {editMode ? (
                                            <Input
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                placeholder="شماره تلفن"
                                                className="font-vazir"
                                            />
                                        ) : (
                                            <p className="font-medium">{user.phone || 'تعریف نشده'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-vazir">نام کامل</p>
                                        {editMode ? (
                                            <Input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="نام کامل"
                                                className="font-vazir"
                                            />
                                        ) : (
                                            <p className="font-medium font-vazir">{user.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-vazir">نقش</p>
                                        <p className="font-medium font-vazir">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-vazir">شناسه کاربر</p>
                                        <p className="font-medium text-xs text-muted-foreground">{user.id}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button onClick={handleUpdateProfile} className="font-vazir">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        ذخیره تغییرات
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditMode(false)} className="font-vazir">
                                        لغو
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={() => setEditMode(true)} className="font-vazir">
                                    <Edit className="w-4 h-4 mr-2" />
                                    ویرایش اطلاعات
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">وظایف من</CardTitle>
                            <CardDescription className="font-vazir">لیست وظایف و کارهای در دست اقدام</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tasksLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="mr-2 font-vazir">در حال بارگذاری...</span>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground font-vazir">هیچ وظیفه‌ای یافت نشد</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tasks.map(task => {
                                        const statusBadge = getStatusBadge(task.status);
                                        const priorityBadge = getPriorityBadge(task.priority);

                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <div className="flex-1">
                                                        <p className="font-medium font-vazir">{task.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant={statusBadge.variant} className="font-vazir text-xs">
                                                                {statusBadge.label}
                                                            </Badge>
                                                            <Badge className={`font-vazir text-xs ${priorityBadge.className}`}>
                                                                {priorityBadge.label}
                                                            </Badge>
                                                            {task.customer_name && (
                                                                <span className="text-xs text-muted-foreground font-vazir">
                                                                    {task.customer_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {task.due_date && (
                                                            <p className="text-xs text-muted-foreground mt-1 font-vazir">
                                                                <Clock className="h-3 w-3 inline ml-1" />
                                                                مهلت: {new Date(task.due_date).toLocaleDateString('fa-IR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {task.status !== 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleTaskComplete(task.id)}
                                                        className="font-vazir"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 ml-2" />
                                                        تکمیل
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="daily-report">
                    {user?.role === 'ceo' || user?.role === 'مدیر' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-vazir">گزارش روزانه</CardTitle>
                                <CardDescription className="font-vazir">مدیران عامل نیازی به ثبت گزارش روزانه ندارند</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground font-vazir">شما به عنوان مدیر عامل نیازی به ثبت گزارش روزانه ندارید</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-vazir">گزارش روزانه</CardTitle>
                                <CardDescription className="font-vazir">
                                    گزارش کار امروز خود را ثبت کنید - {toPersianDate(new Date())}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {reportLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="mr-2 font-vazir">در حال بارگذاری...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium font-vazir mb-2 block">
                                                توضیحات کار انجام شده *
                                            </label>
                                            <Textarea
                                                placeholder="توضیح دهید که امروز چه کارهایی انجام داده‌اید..."
                                                value={dailyReport.work_description}
                                                onChange={e => setDailyReport({
                                                    ...dailyReport,
                                                    work_description: e.target.value
                                                })}
                                                className="min-h-[120px] font-vazir"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium font-vazir mb-2 block">
                                                    ساعات کاری
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max="24"
                                                    placeholder="8"
                                                    value={dailyReport.working_hours || ''}
                                                    onChange={e => setDailyReport({
                                                        ...dailyReport,
                                                        working_hours: parseFloat(e.target.value) || 0
                                                    })}
                                                    className="font-vazir"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium font-vazir mb-2 block">
                                                دستاورد‌ها
                                            </label>
                                            <Textarea
                                                placeholder="دستاورد‌ها و موفقیت‌های امروز..."
                                                value={dailyReport.achievements || ''}
                                                onChange={e => setDailyReport({
                                                    ...dailyReport,
                                                    achievements: e.target.value
                                                })}
                                                className="min-h-[80px] font-vazir"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium font-vazir mb-2 block">
                                                چالش‌ها و مشکلات
                                            </label>
                                            <Textarea
                                                placeholder="چالش‌ها و مشکلات پیش آمده..."
                                                value={dailyReport.challenges || ''}
                                                onChange={e => setDailyReport({
                                                    ...dailyReport,
                                                    challenges: e.target.value
                                                })}
                                                className="min-h-[80px] font-vazir"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                onClick={handleSaveReport}
                                                disabled={reportSaving}
                                                className="font-vazir"
                                            >
                                                {reportSaving ? (
                                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4 ml-2" />
                                                )}
                                                ثبت گزارش
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>تنظیمات حساب کاربری</CardTitle>
                            <CardDescription>تنظیمات و ترجیحات شخصی خود را مدیریت کنید</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">تصویر پروفایل</h4>
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={user.avatar || '/default-avatar.png'}
                                        alt="avatar preview"
                                        width={60}
                                        height={60}
                                        className="rounded-full border"
                                    />
                                    <Button variant="outline" onClick={handleUploadImage}>
                                        <Upload className="w-4 h-4 ml-2" />
                                        آپلود تصویر جدید
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">تغییر رمز عبور</h4>
                                <div className="grid gap-2">
                                    <Input type="password" placeholder="رمز عبور فعلی" />
                                    <Input type="password" placeholder="رمز عبور جدید" />
                                    <Input type="password" placeholder="تکرار رمز عبور جدید" />
                                    <Button variant="outline" className="w-full sm:w-auto mt-2">
                                        تغییر رمز عبور
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
