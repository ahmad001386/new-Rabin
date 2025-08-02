'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, X, RefreshCw } from 'lucide-react';

interface Module {
    id: string;
    name: string;
    display_name: string;
    route: string;
    icon: string;
    sort_order: number;
}

interface Permission {
    module_id: string;
    granted: boolean;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface PermissionManagerProps {
    user: User;
    onClose: () => void;
}

export function PermissionManager({ user, onClose }: PermissionManagerProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
    const [pendingChanges, setPendingChanges] = useState<{ [key: string]: boolean }>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchModulesAndPermissions();
    }, [user.id]);

    const fetchModulesAndPermissions = async () => {
        try {
            setLoading(true);

            // Fetch modules
            const modulesResponse = await fetch('/api/permissions/modules');
            const modulesData = await modulesResponse.json();

            // Fetch user permissions
            const permissionsResponse = await fetch(`/api/permissions/user-modules?userId=${user.id}`);
            const permissionsData = await permissionsResponse.json();

            if (modulesData.success) {
                setModules(modulesData.data);
            }

            if (permissionsData.success) {
                setUserPermissions(permissionsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "خطا",
                description: "خطا در بارگذاری اطلاعات",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (moduleId: string, granted: boolean) => {
        setPendingChanges(prev => ({
            ...prev,
            [moduleId]: granted
        }));

        console.log('📝 Permission change queued:', { moduleId, granted });
    };

    const saveAllPermissions = async () => {
        if (Object.keys(pendingChanges).length === 0) {
            toast({
                title: "هیچ تغییری",
                description: "هیچ تغییری برای ذخیره وجود ندارد"
            });
            return;
        }

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
                        userId: user.id,
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
            await fetchModulesAndPermissions();

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

    const getCurrentPermissionState = (moduleId: string): boolean => {
        // Check if there's a pending change
        if (pendingChanges.hasOwnProperty(moduleId)) {
            return pendingChanges[moduleId];
        }

        // Otherwise use the current permission
        const permission = userPermissions.find(p => p.module_id === moduleId);
        return permission ? permission.granted : false;
    };

    const groupModules = (modules: Module[]) => {
        const groups = [
            {
                title: 'هسته اصلی CRM',
                modules: modules.filter(m => ['dashboard', 'customers', 'contacts', 'coworkers', 'activities', 'interactions', 'chat'].includes(m.name))
            },
            {
                title: 'مدیریت فروش',
                modules: modules.filter(m => ['sales', 'sales_opportunities'].includes(m.name))
            },
            {
                title: 'بازخورد & امتیازدهی',
                modules: modules.filter(m => ['feedback', 'feedback_new', 'surveys', 'csat', 'nps'].includes(m.name))
            },
            {
                title: 'تحلیل & بینش',
                modules: modules.filter(m => ['emotions', 'insights', 'touchpoints', 'customer_health', 'alerts', 'voice_of_customer'].includes(m.name))
            },
            {
                title: 'سایر',
                modules: modules.filter(m => ['projects', 'calendar', 'reports', 'settings', 'cem_settings'].includes(m.name))
            }
        ];

        return groups.filter(group => group.modules.length > 0);
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground font-vazir">در حال بارگذاری...</p>
            </div>
        );
    }

    const pendingCount = Object.keys(pendingChanges).length;
    const moduleGroups = groupModules(modules);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-lg font-semibold font-vazir">مدیریت دسترسی‌ها</h3>
                    <p className="text-sm text-muted-foreground font-vazir">
                        دسترسی‌های {user.name}
                    </p>
                </div>
                {pendingCount > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {pendingCount} تغییر در انتظار
                    </Badge>
                )}
            </div>

            {/* Permission Groups */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
                {moduleGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                        <h4 className="font-medium text-primary font-vazir">{group.title}</h4>
                        <div className="space-y-2">
                            {group.modules.map((module) => {
                                const isGranted = getCurrentPermissionState(module.id);
                                const hasPendingChange = pendingChanges.hasOwnProperty(module.id);

                                return (
                                    <div key={module.id} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${hasPendingChange ? 'border-blue-300 bg-blue-50' : ''}`}>
                                        <div className="flex-1">
                                            <h5 className="font-medium font-vazir">{module.display_name}</h5>
                                            <p className="text-sm text-muted-foreground font-vazir">{module.route}</p>
                                            {isGranted && (
                                                <div className="flex items-center mt-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                    <span className="text-xs text-green-600 font-vazir">دسترسی فعال</span>
                                                </div>
                                            )}
                                            {hasPendingChange && (
                                                <div className="flex items-center mt-1">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                    <span className="text-xs text-blue-600 font-vazir">
                                                        {pendingChanges[module.id] ? 'فعال خواهد شد' : 'غیرفعال خواهد شد'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-vazir">
                                                {isGranted ? 'فعال' : 'غیرفعال'}
                                            </span>
                                            <Checkbox
                                                checked={isGranted}
                                                onCheckedChange={(checked) => {
                                                    handlePermissionToggle(module.id, checked as boolean);
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground font-vazir">
                    تعداد ماژول‌ها: {modules.length} |
                    دسترسی‌های فعال: {userPermissions.filter(p => p.granted).length +
                        Object.values(pendingChanges).filter(Boolean).length -
                        Object.entries(pendingChanges).filter(([id, granted]) =>
                            !granted && userPermissions.some(p => p.module_id === id && p.granted)
                        ).length}
                </div>
                <div className="flex space-x-2 space-x-reverse">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <X className="w-4 h-4 ml-2" />
                        بستن
                    </Button>
                    {pendingCount > 0 && (
                        <>
                            <Button
                                variant="outline"
                                onClick={cancelChanges}
                                disabled={saving}
                            >
                                لغو تغییرات
                            </Button>
                            <Button
                                onClick={saveAllPermissions}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? (
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 ml-2" />
                                )}
                                ذخیره {pendingCount} تغییر
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}