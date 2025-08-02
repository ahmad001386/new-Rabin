'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, FileText, Award, AlertTriangle, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';

interface DailyReport {
    id: string;
    user_id: string;
    user_name: string;
    report_date: string;
    persian_date: string;
    work_description: string;
    working_hours: number;
    achievements: string;
    challenges: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function DailyReportsPage() {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReport, setEditingReport] = useState<DailyReport | null>(null);

    // فیلترها
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');

    // فرم گزارش
    const [formData, setFormData] = useState({
        work_description: '',
        working_hours: '',
        achievements: '',
        challenges: ''
    });

    // دریافت اطلاعات کاربر فعلی
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // دریافت گزارش‌ها
    useEffect(() => {
        if (currentUser) {
            fetchReports();
            if (isManager()) {
                fetchUsers();
            }
        }
    }, [currentUser, selectedUser, selectedDate]);

    const fetchCurrentUser = async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];

            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.data);
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            window.location.href = '/login';
        }
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];

            let url = '/api/reports';
            const params = new URLSearchParams();

            if (selectedUser) params.append('user_id', selectedUser);
            if (selectedDate) params.append('date', selectedDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data.data || []);
            } else {
                toast.error('خطا در دریافت گزارش‌ها');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('خطا در دریافت گزارش‌ها');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];

            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const isManager = () => {
        return currentUser && ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(currentUser.role);
    };

    const isCEO = () => {
        return currentUser && ['ceo', 'مدیر'].includes(currentUser.role);
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.work_description.trim()) {
            toast.error('توضیحات کار الزامی است');
            return;
        }

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    working_hours: formData.working_hours ? parseFloat(formData.working_hours) : null
                })
            });

            if (response.ok) {
                toast.success(editingReport ? 'گزارش با موفقیت به‌روزرسانی شد' : 'گزارش با موفقیت ثبت شد');
                setShowForm(false);
                setEditingReport(null);
                setFormData({
                    work_description: '',
                    working_hours: '',
                    achievements: '',
                    challenges: ''
                });
                fetchReports();
            } else {
                const error = await response.json();
                toast.error(error.message || 'خطا در ثبت گزارش');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('خطا در ثبت گزارش');
        }
    };

    const handleEditReport = (report: DailyReport) => {
        setEditingReport(report);
        setFormData({
            work_description: report.work_description,
            working_hours: report.working_hours?.toString() || '',
            achievements: report.achievements || '',
            challenges: report.challenges || ''
        });
        setShowForm(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    const canEditReport = (report: DailyReport) => {
        if (!currentUser) return false;

        // مدیران می‌تونن همه رو ویرایش کنن
        if (isManager()) return true;

        // کاربران عادی فقط گزارش خودشون رو و فقط همون روز
        if (report.user_id !== currentUser.id) return false;

        const today = new Date().toISOString().split('T')[0];
        return report.report_date === today;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6" dir="rtl">
            {/* هدر صفحه */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">گزارش‌های روزانه</h1>
                    <p className="text-gray-600 mt-2">
                        {isManager() ? 'مدیریت و مشاهده گزارش‌های روزانه تیم' : 'گزارش‌های روزانه شما'}
                    </p>
                </div>

                {!isCEO() && (
                    <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        گزارش جدید
                    </Button>
                )}
            </div>

            {/* فیلترها (فقط برای مدیران) */}
            {isManager() && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            فیلترها
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="user-filter">کاربر</Label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="همه کاربران" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">همه کاربران</SelectItem>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="date-filter">تاریخ</Label>
                                <PersianDatePicker
                                    value={selectedDate}
                                    onChange={(value) => setSelectedDate(value)}
                                    placeholder="انتخاب تاریخ"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* فرم ثبت/ویرایش گزارش */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingReport ? 'ویرایش گزارش روزانه' : 'ثبت گزارش روزانه'}
                        </CardTitle>
                        <CardDescription>
                            گزارش کارهای انجام شده در روز را ثبت کنید
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <Label htmlFor="work_description">توضیحات کار انجام شده *</Label>
                                <Textarea
                                    id="work_description"
                                    value={formData.work_description}
                                    onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                                    placeholder="شرح کارهای انجام شده در روز..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="working_hours">ساعات کاری</Label>
                                <Input
                                    id="working_hours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    value={formData.working_hours}
                                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                    placeholder="8"
                                />
                            </div>

                            <div>
                                <Label htmlFor="achievements">دستاورد‌ها</Label>
                                <Textarea
                                    id="achievements"
                                    value={formData.achievements}
                                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                                    placeholder="دستاورد‌ها و موفقیت‌های امروز..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="challenges">چالش‌ها و مشکلات</Label>
                                <Textarea
                                    id="challenges"
                                    value={formData.challenges}
                                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                                    placeholder="مشکلات و چالش‌های پیش آمده..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit">
                                    {editingReport ? 'به‌روزرسانی گزارش' : 'ثبت گزارش'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingReport(null);
                                        setFormData({
                                            work_description: '',
                                            working_hours: '',
                                            achievements: '',
                                            challenges: ''
                                        });
                                    }}
                                >
                                    انصراف
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* لیست گزارش‌ها */}
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">هیچ گزارشی یافت نشد</p>
                        </CardContent>
                    </Card>
                ) : (
                    reports.map((report) => (
                        <Card key={report.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            {report.user_name}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {report.persian_date}
                                            </span>
                                            {report.working_hours && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {report.working_hours} ساعت
                                                </span>
                                            )}
                                            <Badge variant={report.status === 'submitted' ? 'default' : 'secondary'}>
                                                {report.status === 'submitted' ? 'ثبت شده' : 'پیش‌نویس'}
                                            </Badge>
                                        </CardDescription>
                                    </div>

                                    {canEditReport(report) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditReport(report)}
                                        >
                                            ویرایش
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" />
                                        شرح کار انجام شده
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {report.work_description}
                                    </p>
                                </div>

                                {report.achievements && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-700">
                                                <Award className="h-4 w-4" />
                                                دستاورد‌ها
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                {report.achievements}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {report.challenges && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-orange-700">
                                                <AlertTriangle className="h-4 w-4" />
                                                چالش‌ها و مشکلات
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                {report.challenges}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Separator />
                                <div className="text-sm text-gray-500">
                                    آخرین به‌روزرسانی: {formatDate(report.updated_at)}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}