'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Brain,
    Calendar,
    User,
    FileText,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import moment from 'moment-jalaali';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AnalysisResult {
    user_info: {
        name: string;
        role: string;
    };
    period: {
        start_date: string;
        end_date: string;
        total_days: number;
    };
    reports_count: number;
    analysis: string;
    raw_reports: any[];
    ai_error?: boolean;
}

export default function ReportsAnalysisPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(true);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        fetchUsers();

        // Set default dates (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await fetch('/api/users?status=active');
            const data = await response.json();

            if (data.success) {
                setUsers(data.users || []);
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در دریافت لیست همکاران",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "خطا",
                description: "خطا در دریافت لیست همکاران",
                variant: "destructive",
            });
        } finally {
            setUsersLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedUserId || !startDate || !endDate) {
            toast({
                title: "خطا",
                description: "لطفاً همه فیلدها را پر کنید",
                variant: "destructive",
            });
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast({
                title: "خطا",
                description: "تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            setAnalysisResult(null);

            const response = await fetch('/api/reports/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: selectedUserId,
                    start_date: startDate,
                    end_date: endDate,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setAnalysisResult(data.data);
                toast({
                    title: "موفق",
                    description: "تحلیل گزارشات با موفقیت انجام شد",
                });
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در تحلیل گزارشات",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error analyzing reports:', error);
            toast({
                title: "خطا",
                description: "خطا در تحلیل گزارشات",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPersianDate = (dateString: string) => {
        return moment(dateString).format('jYYYY/jMM/jDD');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">تحلیل گزارشات</h1>
                    <p className="text-muted-foreground">
                        تحلیل و بررسی گزارشات روزانه همکاران با استفاده از هوش مصنوعی
                    </p>
                </div>
            </div>

            {/* Analysis Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        انتخاب پارامترهای تحلیل
                    </CardTitle>
                    <CardDescription>
                        همکار و بازه زمانی مورد نظر برای تحلیل را انتخاب کنید
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* User Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="user-select" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                انتخاب همکار
                            </Label>
                            {usersLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="انتخاب همکار..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{user.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                تاریخ شروع
                            </Label>
                            <PersianDatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="انتخاب تاریخ شروع"
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                تاریخ پایان
                            </Label>
                            <PersianDatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="انتخاب تاریخ پایان"
                            />
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || !selectedUserId || !startDate || !endDate}
                            className="min-w-[200px]"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    در حال تحلیل...
                                </>
                            ) : (
                                <>
                                    <Brain className="h-4 w-4 mr-2" />
                                    ارسال به هوش مصنوعی
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
                <div className="space-y-6">
                    {/* Analysis Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                اطلاعات تحلیل
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <User className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">همکار</p>
                                        <p className="font-medium">{analysisResult.user_info.name}</p>
                                        <Badge variant="outline" className="text-xs mt-1">
                                            {analysisResult.user_info.role}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">بازه زمانی</p>
                                        <p className="font-medium text-sm">
                                            {formatPersianDate(analysisResult.period.start_date)} تا {formatPersianDate(analysisResult.period.end_date)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">تعداد گزارشات</p>
                                        <p className="font-medium">{analysisResult.reports_count} گزارش</p>
                                    </div>
                                </div>


                            </div>

                            {analysisResult.ai_error && (
                                <Alert className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        سرویس هوش مصنوعی در دسترس نیست. تحلیل بر اساس داده‌های خام ارائه شده است.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                نتایج تحلیل هوش مصنوعی
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none">
                                <Textarea
                                    value={analysisResult.analysis}
                                    readOnly
                                    className="min-h-[400px] resize-none font-vazir leading-relaxed"
                                />
                            </div>
                        </CardContent>
                    </Card>


                </div>
            )}
        </div>
    );
}