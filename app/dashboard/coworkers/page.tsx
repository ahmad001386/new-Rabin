'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PermissionManager } from '@/components/permissions/permission-manager';
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    Building,
    Calendar,
    Activity,
    MoreHorizontal,
    MessageCircle,
    Eye,
    Settings,
    Shield,
    Trash2,
    Edit,
    AlertTriangle
} from 'lucide-react';
import { User } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

export default function CoworkersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [userPermissions, setUserPermissions] = useState<any[]>([]);
    const [pendingChanges, setPendingChanges] = useState<{ [key: string]: boolean }>({});
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [canManagePermissions, setCanManagePermissions] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        team: '',
        phone: ''
    });
    const [editUser, setEditUser] = useState({
        id: '',
        name: '',
        email: '',
        role: '',
        team: '',
        phone: ''
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
        fetchCurrentUser();
        fetchUsers();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const token = getAuthToken();

            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (data.success && data.data) {
                setCurrentUser(data.data);
                // Only CEO and managers can manage permissions
                const canManage = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(data.data.role);
                setCanManagePermissions(canManage);
                console.log('✅ Current user loaded:', data.data.name, '- Can manage:', canManage);
            } else {
                console.log('❌ Failed to get current user:', data.message);
                toast({
                    title: "خطا در احراز هویت",
                    description: "لطفاً دوباره وارد شوید",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success && data.users) {
                setUsers(data.users);
                console.log('✅ Users loaded successfully:', data.users.length);
            } else {
                console.log('❌ API failed, using mock data. Error:', data.message);
                toast({
                    title: "خطا در بارگذاری",
                    description: data.message || "خطا در دریافت اطلاعات همکاران",
                    variant: "destructive"
                });
                setUsers(mockUsers);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback to mock data
            setUsers(mockUsers);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        // Comprehensive validation
        if (!newUser.name?.trim()) {
            toast({
                title: "خطا",
                description: "نام همکار الزامی است",
                variant: "destructive"
            });
            return;
        }

        if (!newUser.email?.trim()) {
            toast({
                title: "خطا",
                description: "ایمیل الزامی است",
                variant: "destructive"
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUser.email.trim())) {
            toast({
                title: "خطا",
                description: "فرمت ایمیل نامعتبر است",
                variant: "destructive"
            });
            return;
        }

        if (!newUser.password?.trim()) {
            toast({
                title: "خطا",
                description: "رمز عبور الزامی است",
                variant: "destructive"
            });
            return;
        }

        if (newUser.password.trim().length < 6) {
            toast({
                title: "خطا",
                description: "رمز عبور باید حداقل ۶ کاراکتر باشد",
                variant: "destructive"
            });
            return;
        }

        if (!newUser.role?.trim()) {
            toast({
                title: "خطا",
                description: "انتخاب نقش الزامی است",
                variant: "destructive"
            });
            return;
        }

        try {
            setSaving(true);
            const token = getAuthToken();
            console.log('🔄 Adding new user:', {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                team: newUser.team,
                phone: newUser.phone,
                hasToken: !!token
            });

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(newUser),
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ API Response:', data);

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "همکار جدید با موفقیت اضافه شد"
                });
                setOpen(false);
                setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    role: '',
                    team: '',
                    phone: ''
                });
                fetchUsers(); // Refresh users list
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در اضافه کردن همکار",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error adding user:', error);
            toast({
                title: "خطا",
                description: error instanceof Error ? error.message : "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleViewProfile = (user: User) => {
        setSelectedUser(user);
        setProfileOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            team: user.team || '',
            phone: user.phone || ''
        });
        setSelectedUser(user);
        setEditOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editUser.name || !editUser.email || !editUser.role) {
            toast({
                title: "خطا",
                description: "لطفاً تمام فیلدهای اجباری را پر کنید",
                variant: "destructive"
            });
            return;
        }

        try {
            setSaving(true);
            const token = getAuthToken();

            console.log('🔄 Updating user:', editUser);

            const response = await fetch(`/api/users/${editUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    name: editUser.name,
                    email: editUser.email,
                    role: editUser.role,
                    team: editUser.team,
                    phone: editUser.phone
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Update API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ Update response:', data);

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "اطلاعات همکار با موفقیت به‌روزرسانی شد"
                });
                setEditOpen(false);
                setEditUser({
                    id: '',
                    name: '',
                    email: '',
                    role: '',
                    team: '',
                    phone: ''
                });
                fetchUsers(); // Refresh users list
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی اطلاعات همکار",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: "خطا",
                description: error instanceof Error ? error.message : "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleManagePermissions = async (user: User) => {
        setSelectedUser(user);
        await fetchModulesAndPermissions(user.id);
        setPermissionsOpen(true);
    };

    const handleStartChat = (user: User) => {
        router.push(`/dashboard/interactions/chat?userId=${user.id}&userName=${encodeURIComponent(user.name)}`);
    };

    const fetchModulesAndPermissions = async (userId: string) => {
        try {
            // Fetch all modules
            const modulesResponse = await fetch('/api/permissions/modules');
            const modulesData = await modulesResponse.json();

            // Fetch user permissions
            const permissionsResponse = await fetch(`/api/permissions/user-modules?userId=${userId}`);
            const permissionsData = await permissionsResponse.json();

            if (modulesData.success) setModules(modulesData.data || []);
            if (permissionsData.success) setUserPermissions(permissionsData.data || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const handlePermissionChange = async (moduleId: string, granted: boolean) => {
        if (!selectedUser) return;

        console.log('🔄 Updating permission:', {
            user: selectedUser.name,
            userId: selectedUser.id,
            moduleId,
            granted,
            timestamp: new Date().toLocaleString()
        });

        try {
            // First try the test endpoint to debug
            const testResponse = await fetch('/api/permissions/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    moduleId,
                    granted,
                    testMode: true
                }),
            });

            const testData = await testResponse.json();
            console.log('🔍 Test API response:', testData);

            // Then use the normal endpoint
            const response = await fetch('/api/permissions/user-modules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    moduleId,
                    granted
                }),
            });

            const data = await response.json();
            console.log('📡 Main API response:', data);

            if (data.success) {
                toast({
                    title: "موفق",
                    description: `دسترسی ${granted ? 'اضافه' : 'حذف'} شد`
                });

                // Update local state immediately for better UX
                const updatedPermissions = userPermissions.map(perm =>
                    perm.module_id === moduleId
                        ? { ...perm, granted }
                        : perm
                );

                // If permission didn't exist and granted=true, add it
                if (granted && !userPermissions.find(p => p.module_id === moduleId)) {
                    updatedPermissions.push({
                        module_id: moduleId,
                        granted: true,
                        name: modules.find(m => m.id === moduleId)?.name || ''
                    });
                }

                setUserPermissions(updatedPermissions);

                // Also refresh from server
                setTimeout(() => {
                    fetchModulesAndPermissions(selectedUser.id);

                    // Refresh sidebar if the current user is the one being updated
                    window.dispatchEvent(new CustomEvent('refreshSidebar'));
                }, 500);
            } else {
                console.error('❌ Permission update failed:', data);
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی دسترسی‌ها",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('❌ Error updating permissions:', error);
            toast({
                title: "خطا",
                description: `خطا در اتصال به سرور: ${error}`,
                variant: "destructive"
            });
        }
    };

    const saveAllPermissions = async () => {
        if (!selectedUser || Object.keys(pendingChanges).length === 0) return;

        setSaving(true);
        console.log('💾 Saving all permission changes:', pendingChanges);

        try {
            const promises = Object.entries(pendingChanges).map(async ([moduleId, granted]) => {
                const response = await fetch('/api/permissions/user-modules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: selectedUser.id,
                        moduleId,
                        granted
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(`Failed to update ${moduleId}: ${data.message}`);
                }
                return data;
            });

            await Promise.all(promises);

            toast({
                title: "موفق",
                description: `${Object.keys(pendingChanges).length} تغییر با موفقیت ذخیره شد`
            });

            // Clear pending changes
            setPendingChanges({});

            // Refresh permissions
            fetchModulesAndPermissions(selectedUser.id);

            // Refresh sidebar
            window.dispatchEvent(new CustomEvent('refreshSidebar'));

        } catch (error) {
            console.error('❌ Error saving permissions:', error);
            toast({
                title: "خطا",
                description: `خطا در ذخیره تغییرات: ${error}`,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const cancelChanges = () => {
        setPendingChanges({});
        toast({
            title: "لغو شد",
            description: "تغییرات لغو شد"
        });
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setDeleteOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true); // Show loading state
            const token = getAuthToken();

            console.log('🗑️ Deleting user:', selectedUser.name);

            // Show immediate feedback
            toast({
                title: "در حال حذف...",
                description: `حذف ${selectedUser.name} در حال انجام است. لطفاً صبر کنید...`
            });

            const response = await fetch(`/api/users/${selectedUser.id}?hard=true`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();
            console.log('🗑️ Delete response:', data);

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "همکار با موفقیت حذف شد"
                });

                setDeleteOpen(false);
                setSelectedUser(null);
                // Refresh users list
                fetchUsers();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در حذف همکار",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = (users ?? []).filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'away':
                return 'bg-yellow-500';
            case 'offline':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online':
                return 'آنلاین';
            case 'away':
                return 'دور';
            case 'offline':
                return 'آفلاین';
            default:
                return 'نامشخص';
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-vazir">همکاران</h1>
                    <p className="text-muted-foreground font-vazir mt-1">
                        مدیریت و نظارت بر همکاران تیم
                    </p>
                </div>
                {canManagePermissions && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-vazir">
                                <UserPlus className="w-4 h-4 mr-2" />
                                افزودن همکار جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="font-vazir">افزودن همکار جدید</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-vazir">نام و نام خانوادگی *</Label>
                                    <Input
                                        id="name"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="نام کامل همکار"
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="font-vazir">ایمیل *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="example@company.com"
                                        className="font-vazir"
                                    />
                                    {newUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email) && (
                                        <p className="text-sm text-red-500 font-vazir">
                                            فرمت ایمیل نامعتبر است
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="font-vazir">رمز عبور * (حداقل ۶ کاراکتر)</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="رمز عبور قوی (حداقل ۶ کاراکتر)"
                                        className="font-vazir"
                                        minLength={6}
                                    />
                                    {newUser.password && newUser.password.length < 6 && (
                                        <p className="text-sm text-red-500 font-vazir">
                                            رمز عبور باید حداقل ۶ کاراکتر باشد
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role" className="font-vazir">نقش *</Label>
                                    <Select onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                        <SelectTrigger className="font-vazir">
                                            <SelectValue placeholder="انتخاب نقش" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ceo" className="font-vazir">مدیر عامل</SelectItem>
                                            <SelectItem value="sales_manager" className="font-vazir">مدیر فروش</SelectItem>
                                            <SelectItem value="sales_agent" className="font-vazir">کارشناس فروش</SelectItem>
                                            <SelectItem value="agent" className="font-vazir">پشتیبان</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="team" className="font-vazir">تیم</Label>
                                    <Input
                                        id="team"
                                        value={newUser.team}
                                        onChange={(e) => setNewUser({ ...newUser, team: e.target.value })}
                                        placeholder="نام تیم (اختیاری)"
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="font-vazir">تلفن</Label>
                                    <Input
                                        id="phone"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder="09123456789"
                                        className="font-vazir"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)} className="font-vazir">
                                    لغو
                                </Button>
                                <Button onClick={handleAddUser} disabled={saving} className="font-vazir">
                                    {saving ? 'در حال افزودن...' : 'افزودن همکار'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="جستجو در همکاران..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 font-vazir"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">کل همکاران</p>
                                <p className="text-2xl font-bold font-vazir">{(users ?? []).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">آنلاین</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {(users ?? []).filter(u => u.status === 'online').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            </div>
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">دور</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {(users ?? []).filter(u => u.status === 'away').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                            </div>
                            <div className="mr-4">
                                <p className="text-sm font-medium text-muted-foreground font-vazir">آفلاین</p>
                                <p className="text-2xl font-bold font-vazir">
                                    {(users ?? []).filter(u => u.status === 'offline' || !u.status).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback className="font-vazir">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(user.status || 'offline')} rounded-full border-2 border-white`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold font-vazir">{user.name}</h3>
                                        <p className="text-sm text-muted-foreground font-vazir">{user.role}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 mr-2" />
                                <span className="font-vazir">{user.email}</span>
                            </div>

                            {user.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4 mr-2" />
                                    <span className="font-vazir">{user.phone}</span>
                                </div>
                            )}

                            {user.team && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Building className="w-4 h-4 mr-2" />
                                    <span className="font-vazir">{user.team}</span>
                                </div>
                            )}

                            {user.lastActive && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span className="font-vazir">
                                        آخرین فعالیت: {new Date(user.lastActive).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <Badge variant={user.status === 'online' ? 'default' : 'secondary'} className="font-vazir">
                                    {getStatusText(user.status || 'offline')}
                                </Badge>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-1 pt-3 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-vazir flex-1"
                                    onClick={() => handleStartChat(user)}
                                >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    چت
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-vazir flex-1"
                                    onClick={() => handleViewProfile(user)}
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    پروفایل
                                </Button>
                                {canManagePermissions && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="font-vazir flex-1"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            <Edit className="w-3 h-3 mr-1" />
                                            ویرایش
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="font-vazir flex-1"
                                            onClick={() => handleManagePermissions(user)}
                                        >
                                            <Shield className="w-3 h-3 mr-1" />
                                            دسترسی
                                        </Button>
                                        {user.id !== currentUser?.id && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-vazir flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                                onClick={() => handleDeleteUser(user)}
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                حذف
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground font-vazir">هیچ همکاری یافت نشد.</p>
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-vazir">ویرایش همکار</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="font-vazir">نام و نام خانوادگی *</Label>
                            <Input
                                id="edit-name"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                placeholder="نام کامل همکار"
                                className="font-vazir"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email" className="font-vazir">ایمیل *</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                placeholder="example@company.com"
                                className="font-vazir"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role" className="font-vazir">نقش *</Label>
                            <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue placeholder="انتخاب نقش" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ceo" className="font-vazir">مدیر عامل</SelectItem>
                                    <SelectItem value="sales_manager" className="font-vazir">مدیر فروش</SelectItem>
                                    <SelectItem value="sales_agent" className="font-vazir">کارشناس فروش</SelectItem>
                                    <SelectItem value="agent" className="font-vazir">پشتیبان</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-team" className="font-vazir">تیم</Label>
                            <Input
                                id="edit-team"
                                value={editUser.team}
                                onChange={(e) => setEditUser({ ...editUser, team: e.target.value })}
                                placeholder="نام تیم (اختیاری)"
                                className="font-vazir"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-phone" className="font-vazir">تلفن</Label>
                            <Input
                                id="edit-phone"
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                placeholder="09123456789"
                                className="font-vazir"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(false)} className="font-vazir">
                            لغو
                        </Button>
                        <Button onClick={handleUpdateUser} disabled={saving} className="font-vazir">
                            {saving ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-vazir flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            تأیید حذف همکار
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground font-vazir mb-4">
                            آیا مطمئن هستید که می‌خواهید <strong>{selectedUser?.name}</strong> را حذف کنید؟
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-red-700 font-vazir">
                                    <p className="font-semibold mb-1">هشدار:</p>
                                    <p>تمام اطلاعات مربوط به این کاربر شامل:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>گزارش‌های روزانه</li>
                                        <li>فعالیت‌ها و تعاملات</li>
                                        <li>تیکت‌ها و پروژه‌ها</li>
                                        <li>یادداشت‌ها و وظایف</li>
                                        <li>تمام داده‌های مرتبط</li>
                                    </ul>
                                    <p className="mt-2 font-semibold">به طور کامل و غیرقابل بازگشت حذف خواهد شد.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="font-vazir">
                            لغو
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteUser}
                            disabled={saving}
                            className="font-vazir"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {saving ? 'در حال حذف...' : 'حذف کامل'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Profile Dialog */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-vazir">پروفایل همکار</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                    <AvatarFallback className="font-vazir text-lg">
                                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-2xl font-semibold font-vazir">{selectedUser.name}</h3>
                                    <p className="text-muted-foreground font-vazir">{selectedUser.role}</p>
                                    <Badge variant={selectedUser.status === 'online' ? 'default' : 'secondary'} className="font-vazir mt-2">
                                        {getStatusText(selectedUser.status || 'offline')}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-vazir">{selectedUser.email}</span>
                                </div>
                                {selectedUser.phone && (
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-vazir">{selectedUser.phone}</span>
                                    </div>
                                )}
                                {selectedUser.team && (
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <Building className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-vazir">{selectedUser.team}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle className="font-vazir">
                            مدیریت دسترسی‌های {selectedUser?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <PermissionManager
                            user={selectedUser}
                            onClose={() => setPermissionsOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}