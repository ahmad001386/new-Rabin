'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import {
    Plus, DollarSign, TrendingUp, Target, Calendar, Handshake,
    Search, User, CheckCircle, Clock, AlertTriangle, Eye, Edit,
    Trash2, Filter
} from 'lucide-react';

interface Deal {
    id: string;
    customer_id: string;
    customer_name: string;
    title: string;
    description: string;
    total_value: number;
    currency: string;
    stage_name: string;
    stage_code: string;
    probability: number;
    expected_close_date: string;
    assigned_user_name: string;
    days_in_pipeline: number;
    created_at: string;
}

interface Customer {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
}

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [newDeal, setNewDeal] = useState({
        customer_id: '',
        title: '',
        description: '',
        total_value: '',
        currency: 'IRR',
        probability: '50',
        expected_close_date: '',
        assigned_to: ''
    });

    const { toast } = useToast();
    const router = useRouter();

    // Utility function to get auth token
    const getAuthToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
    };

    useEffect(() => {
        fetchDeals();
        fetchCustomers();
        fetchUsers();
    }, []);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const params = new URLSearchParams();
            if (stageFilter && stageFilter !== 'all') params.append('stage', stageFilter);

            const response = await fetch(`/api/deals?${params.toString()}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setDeals(data.deals || []);
                console.log('✅ Deals loaded successfully:', data.deals?.length || 0);
            } else {
                toast({
                    title: "خطا در بارگذاری",
                    description: data.message || "خطا در دریافت اطلاعات معاملات",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching deals:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreateDeal = async () => {
        // Validation
        if (!newDeal.customer_id || !newDeal.title || !newDeal.total_value) {
            toast({
                title: "خطا",
                description: "لطفاً تمام فیلدهای اجباری را پر کنید",
                variant: "destructive"
            });
            return;
        }

        try {
            const token = getAuthToken();

            const response = await fetch('/api/deals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    ...newDeal,
                    total_value: parseFloat(newDeal.total_value),
                    probability: parseInt(newDeal.probability)
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "معامله با موفقیت ایجاد شد"
                });
                setOpen(false);
                resetNewDeal();
                fetchDeals();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ایجاد معامله",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error creating deal:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const resetNewDeal = () => {
        setNewDeal({
            customer_id: '',
            title: '',
            description: '',
            total_value: '',
            currency: 'IRR',
            probability: '50',
            expected_close_date: '',
            assigned_to: ''
        });
    };

    const formatCurrency = (amount: number, currency: string = 'IRR') => {
        if (currency === 'IRR') {
            return `${(amount / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
        }
        return `${amount.toLocaleString('fa-IR')} ${currency}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    const getStageColor = (stageCode: string) => {
        switch (stageCode) {
            case 'lead': return 'secondary';
            case 'qualified': return 'default';
            case 'proposal': return 'outline';
            case 'negotiation': return 'destructive';
            case 'closed_won': return 'default';
            case 'closed_lost': return 'secondary';
            default: return 'outline';
        }
    };

    const getProbabilityColor = (probability: number) => {
        if (probability >= 80) return 'text-green-600';
        if (probability >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Filter deals
    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.assigned_user_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = stageFilter === 'all' || deal.stage_code === stageFilter;

        return matchesSearch && matchesStage;
    });

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

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        مدیریت معاملات
                    </h1>
                    <p className="text-muted-foreground font-vazir mt-2">مدیریت و پیگیری همه معاملات فروش</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
                            <Plus className="h-4 w-4 ml-2" />
                            معامله جدید
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-vazir">ایجاد معامله جدید</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-vazir">مشتری *</Label>
                                    <Select value={newDeal.customer_id} onValueChange={(value) => setNewDeal({ ...newDeal, customer_id: value })}>
                                        <SelectTrigger className="font-vazir">
                                            <SelectValue placeholder="انتخاب مشتری" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(customer => (
                                                <SelectItem key={customer.id} value={customer.id} className="font-vazir">
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">عنوان معامله *</Label>
                                    <Input
                                        value={newDeal.title}
                                        onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                                        placeholder="عنوان معامله"
                                        className="font-vazir"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-vazir">توضیحات</Label>
                                <Textarea
                                    value={newDeal.description}
                                    onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                                    placeholder="توضیحات معامله"
                                    className="font-vazir"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-vazir">ارزش معامله *</Label>
                                    <Input
                                        type="number"
                                        value={newDeal.total_value}
                                        onChange={(e) => setNewDeal({ ...newDeal, total_value: e.target.value })}
                                        placeholder="ارزش به تومان"
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">احتمال موفقیت (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newDeal.probability}
                                        onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">مسئول معامله</Label>
                                    <Select value={newDeal.assigned_to} onValueChange={(value) => setNewDeal({ ...newDeal, assigned_to: value })}>
                                        <SelectTrigger className="font-vazir">
                                            <SelectValue placeholder="انتخاب مسئول" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id} className="font-vazir">
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-vazir">تاریخ پیش‌بینی بسته شدن</Label>
                                <PersianDatePicker
                                    value={newDeal.expected_close_date}
                                    onChange={(date) => setNewDeal({ ...newDeal, expected_close_date: date })}
                                    placeholder="انتخاب تاریخ"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 space-x-reverse">
                                <Button variant="outline" onClick={() => setOpen(false)} className="font-vazir">
                                    انصراف
                                </Button>
                                <Button onClick={handleCreateDeal} className="font-vazir">
                                    ایجاد معامله
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Handshake className="h-8 w-8 text-primary" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">کل معاملات</p>
                                <p className="text-2xl font-bold font-vazir">{deals.length.toLocaleString('fa-IR')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">ارزش کل</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {formatCurrency(deals.reduce((sum, deal) => sum + deal.total_value, 0))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">بسته شده</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {deals.filter(d => d.stage_code === 'closed_won').length.toLocaleString('fa-IR')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">نرخ تبدیل</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {deals.length > 0 ? Math.round((deals.filter(d => d.stage_code === 'closed_won').length / deals.length) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* فیلترها و جستجو */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-vazir">فیلتر و جستجو</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="جستجو در معاملات..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 font-vazir"
                                />
                            </div>
                        </div>
                        <div>
                            <Select value={stageFilter} onValueChange={(value) => {
                                setStageFilter(value);
                                fetchDeals();
                            }}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue placeholder="مرحله معامله" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-vazir">همه مراحل</SelectItem>
                                    <SelectItem value="lead" className="font-vazir">سرنخ</SelectItem>
                                    <SelectItem value="qualified" className="font-vazir">واجد شرایط</SelectItem>
                                    <SelectItem value="proposal" className="font-vazir">پیشنهاد</SelectItem>
                                    <SelectItem value="negotiation" className="font-vazir">مذاکره</SelectItem>
                                    <SelectItem value="closed_won" className="font-vazir">بسته شده - موفق</SelectItem>
                                    <SelectItem value="closed_lost" className="font-vazir">بسته شده - ناموفق</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Deals List */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-vazir">لیست معاملات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredDeals.map((deal) => (
                            <Card key={deal.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-4 space-x-reverse">
                                                <h3 className="text-lg font-medium font-vazir">{deal.title}</h3>
                                                <Badge variant={getStageColor(deal.stage_code)} className="font-vazir">
                                                    {deal.stage_name}
                                                </Badge>
                                                <span className={`text-sm font-medium font-vazir ${getProbabilityColor(deal.probability)}`}>
                                                    {deal.probability}% احتمال موفقیت
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-6 space-x-reverse text-sm text-muted-foreground">
                                                <span className="font-vazir">مشتری: {deal.customer_name}</span>
                                                <span className="font-vazir">مسئول: {deal.assigned_user_name}</span>
                                                <span className="font-vazir">{deal.days_in_pipeline} روز در پایپ‌لاین</span>
                                                {deal.expected_close_date && (
                                                    <span className="font-vazir">تاریخ پیش‌بینی: {formatDate(deal.expected_close_date)}</span>
                                                )}
                                            </div>
                                            {deal.description && (
                                                <p className="text-sm text-muted-foreground font-vazir">{deal.description}</p>
                                            )}
                                        </div>
                                        <div className="text-left space-y-2">
                                            <div className="text-2xl font-bold text-primary font-vazir">
                                                {formatCurrency(deal.total_value, deal.currency)}
                                            </div>
                                            <div className="flex space-x-2 space-x-reverse">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/sales/record?deal_id=${deal.id}`)}
                                                    className="font-vazir"
                                                >
                                                    <Plus className="h-4 w-4 ml-1" />
                                                    ثبت فروش
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/deals/edit/${deal.id}`)}
                                                    className="font-vazir"
                                                >
                                                    <Edit className="h-4 w-4 ml-1" />
                                                    ویرایش
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredDeals.length === 0 && (
                        <div className="text-center py-12">
                            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium font-vazir mb-2">معامله‌ای یافت نشد</h3>
                            <p className="text-muted-foreground font-vazir mb-4">
                                {searchTerm || stageFilter !== 'all'
                                    ? 'معامله‌ای با این فیلترها یافت نشد'
                                    : 'هنوز معامله‌ای ایجاد نشده است'
                                }
                            </p>
                            <Button onClick={() => setOpen(true)} className="font-vazir">
                                <Plus className="h-4 w-4 ml-2" />
                                ایجاد اولین معامله
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}