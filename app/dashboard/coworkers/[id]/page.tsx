'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowRight,
    Edit,
    Save,
    X,
    Calendar,
    Activity
} from 'lucide-react';
import { User } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface CoworkerDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function CoworkerDetailPage({ params }: CoworkerDetailPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        team: '',
        phone: '',
        status: ''
    });

    useEffect(() => {
        const initializeParams = async () => {
            const resolvedParams = await params;
            setUserId(resolvedParams.id);
        };
        initializeParams();
    }, [params]);

    useEffect(() => {
        if (userId) {
            fetchUserDetail();
        }
    }, [userId]);

    const fetchUserDetail = async () => {
        try {
            setLoading(true);

            // Try to fetch from API first
            try {
                const response = await fetch(`/api/users/${userId}`);
                const data = await response.json();

                if (data.success) {
                    setUser(data.data);
                    setFormData({
                        name: data.data.name,
                        email: data.data.email,
                        role: data.data.role,
                        team: data.data.team || '',
                        phone: data.data.phone || '',
                        status: data.data.status
                    });
                    return;
                }
            } catch (error) {
                console.log('API failed, using mock data');
            }

            // Fallback to mock data
            const mockUser = mockUsers.find(u => u.id === userId);
            if (mockUser) {
                setUser(mockUser);
                setFormData({
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                    team: mockUser.team || '',
                    phone: mockUser.phone || '',
                    status: mockUser.status || 'active'
                });
            } else {
                toast({
                    title: "خطا",
                    description: "کاربر یافت نشد",
                    variant: "destructive"
                });
                router.push('/dashboard/coworkers');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            toast({
                title: "خطا",
                description: "خطا در دریافت اطلاعات کاربر",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "اطلاعات همکار به‌روزرسانی شد"
                });
                setEditing(false);
                fetchUserDetail(); // Refresh data
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی اطلاعات",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'inactive':
                return 'bg-yellow-500';
            case 'suspended':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'فعال';
            case 'inactive':
                return 'غیرفعال';
            case 'suspended':
                return 'تعلیق شده';
            default:
                return 'نامشخص';
        }
    };

    const getRoleText = (role: string) => {
        switch (role) {
            case 'ceo':
                return 'مدیر عامل';
            case 'sales_manager':
                return 'مدیر فروش';
            case 'sales_agent':
                return 'کارشناس فروش';
            case 'agent':
                return 'پشتیبان';
            default:
                return role;
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-muted-foreground font-vazir">کاربر یافت نشد.</p>
                    <Button
                        onClick={() => router.push('/dashboard/coworkers')}
                        className="mt-4 font-vazir"
                    >
                        بازگشت به لیست همکاران
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/coworkers')}
                        className="font-vazir"
                    >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        بازگشت
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-vazir">جزئیات همکار</h1>
                        <p className="text-muted-foreground font-vazir mt-1">
                            مشاهده و ویرایش اطلاعات همکار
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <Button variant="outline" onClick={() => setEditing(false)} className="font-vazir">
                                <X className="w-4 h-4 mr-2" />
                                لغو
                            </Button>
                            <Button onClick={handleSave} className="font-vazir">
                                <Save className="w-4 h-4 mr-2" />
                                ذخیره
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setEditing(true)} className="font-vazir">
                            <Edit className="w-4 h-4 mr-2" />
                            ویرایش
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">اطلاعات شخصی</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="font-vazir text-lg">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label className="font-vazir">نام و نام خانوادگی</Label>
                                            {editing ? (
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="font-vazir"
                                                />
                                            ) : (
                                                <p className="font-vazir">{user.name}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="font-vazir">ایمیل</Label>
                                            {editing ? (
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="font-vazir"
                                                />
                                            ) : (
                                                <p className="font-vazir">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">اطلاعات شغلی</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="font-vazir">نقش</Label>
                                    {editing ? (
                                        <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                            <SelectTrigger className="font-vazir">
                                                <SelectValue placeholder={getRoleText(formData.role)} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ceo" className="font-vazir">مدیر عامل</SelectItem>
                                                <SelectItem value="sales_manager" className="font-vazir">مدیر فروش</SelectItem>
                                                <SelectItem value="sales_agent" className="font-vazir">کارشناس فروش</SelectItem>
                                                <SelectItem value="agent" className="font-vazir">پشتیبان</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="font-vazir">{getRoleText(user.role)}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-vazir">تیم</Label>
                                    {editing ? (
                                        <Input
                                            value={formData.team}
                                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                            placeholder="نام تیم"
                                            className="font-vazir"
                                        />
                                    ) : (
                                        <p className="font-vazir">{user.team || 'تعیین نشده'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-vazir">تلفن</Label>
                                {editing ? (
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="09123456789"
                                        className="font-vazir"
                                    />
                                ) : (
                                    <p className="font-vazir">{user.phone || 'ثبت نشده'}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">وضعیت</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {editing ? (
                                <Select onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger className="font-vazir">
                                        <SelectValue placeholder={getStatusText(formData.status)} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active" className="font-vazir">فعال</SelectItem>
                                        <SelectItem value="inactive" className="font-vazir">غیرفعال</SelectItem>
                                        <SelectItem value="suspended" className="font-vazir">تعلیق شده</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status || 'active')}`}></div>
                                    <span className="font-vazir">{getStatusText(user.status || 'active')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-vazir">آخرین فعالیت‌ها</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                {user.lastLogin && (
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        <span className="font-vazir">
                                            آخرین ورود: {new Date(user.lastLogin).toLocaleDateString('fa-IR')}
                                        </span>
                                    </div>
                                )}

                                {user.lastActive && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-vazir">
                                            آخرین فعالیت: {new Date(user.lastActive).toLocaleDateString('fa-IR')}
                                        </span>
                                    </div>
                                )}

                                {user.createdAt && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-vazir">
                                            عضویت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}