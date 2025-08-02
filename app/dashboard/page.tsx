'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import {
  Users,
  TrendingUp,
  Star,
  DollarSign,
  Target,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Bell,
  ArrowUp,
  ArrowDown,
  Eye,
  Plus,
  MessageCircle,
  FileText,
  Settings,
  BarChart3,
  UserPlus,
  Ticket
} from 'lucide-react';

interface DashboardData {
  currentUser: {
    id: string;
    name: string;
    role: string;
    isAdmin: boolean;
  };
  teamActivities: any[];
  todaySchedule: any[];
  recentCustomers: any[];
  quickStats: {
    active_customers: number;
    pending_tasks: number;
    active_deals: number;
    open_tickets: number;
  };
  userActivityReport: any[];
  alerts: any[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch('/api/dashboard/admin', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        toast({
          title: "خوش آمدید",
          description: `سلام ${data.data.currentUser.name} عزیز`,
        });
      } else {
        throw new Error(data.message || 'خطا در دریافت اطلاعات');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات داشبورد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground font-vazir">خطا در بارگذاری اطلاعات</p>
      </div>
    );
  }

  return (
    <PageWrapper
      title="داشبورد مدیریت CRM"
      description={`خوش آمدید ${dashboardData.currentUser.name} - نمای کلی از عملکرد و فعالیت‌های امروز`}
      showBreadcrumb={false}
      actions={
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            className="font-vazir"
            onClick={() => router.push('/dashboard/calendar')}
          >
            <Calendar className="h-4 w-4 ml-2" />
            تقویم
          </Button>
          <Button
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir"
            onClick={() => router.push('/dashboard/activities')}
          >
            <Plus className="h-4 w-4 ml-2" />
            فعالیت جدید
          </Button>
        </div>
      }
    >

      {/* هشدارهای مهم */}
      {dashboardData.alerts.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-destructive font-vazir">
              <AlertTriangle className="h-5 w-5" />
              <span>هشدارهای مهم</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-medium font-vazir">{alert.title}</p>
                    <p className="text-sm text-muted-foreground font-vazir">{alert.message}</p>
                  </div>
                  <Badge
                    variant={alert.priority === 'high' ? 'destructive' : 'secondary'}
                    className="font-vazir"
                  >
                    {alert.priority === 'high' ? 'فوری' : 'متوسط'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* آمار کلی */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">مشتریان فعال</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {dashboardData.quickStats.active_customers.toLocaleString('fa-IR')}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              مشتریان با وضعیت فعال
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">وظایف در انتظار</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {dashboardData.quickStats.pending_tasks.toLocaleString('fa-IR')}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              وظایف نیاز به انجام
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">معاملات فعال</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {dashboardData.quickStats.active_deals.toLocaleString('fa-IR')}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              معاملات در حال پیگیری
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 hover:border-orange-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">تیکت‌های باز</CardTitle>
            <Ticket className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {dashboardData.quickStats.open_tickets.toLocaleString('fa-IR')}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              تیکت‌های نیاز به بررسی
            </p>
          </CardContent>
        </Card>
      </div>

      {/* فعالیت‌های تیم و مشتریان اخیر */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Activity className="h-5 w-5 text-primary" />
              <span>فعالیت‌های انجام شده همکاران</span>
            </CardTitle>
            <CardDescription className="font-vazir">آخرین فعالیت‌های تیم امروز</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.teamActivities.length > 0 ? (
                dashboardData.teamActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                    <div className={`p-2 rounded-full ${activity.type === 'call' ? 'bg-primary/10 text-primary' :
                      activity.type === 'meeting' ? 'bg-secondary/10 text-secondary' :
                        'bg-accent/10 text-accent'
                      }`}>
                      {activity.type === 'call' ? <Phone className="h-4 w-4" /> :
                        activity.type === 'meeting' ? <Calendar className="h-4 w-4" /> :
                          <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium font-vazir text-sm">{activity.title}</h4>
                        <span className="text-xs text-muted-foreground font-vazir">
                          {new Date(activity.start_time).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-vazir">
                        {activity.performed_by_name} - {activity.customer_name}
                      </p>
                      {activity.outcome && (
                        <Badge
                          variant={activity.outcome === 'successful' ? 'default' : 'secondary'}
                          className="text-xs mt-1 font-vazir"
                        >
                          {activity.outcome === 'successful' ? 'موفق' :
                            activity.outcome === 'follow_up_needed' ? 'نیاز به پیگیری' : 'بدون پاسخ'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground font-vazir py-4">
                  فعالیتی برای امروز ثبت نشده است
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Users className="h-5 w-5 text-secondary" />
              <span>مشتریان اخیر</span>
            </CardTitle>
            <CardDescription className="font-vazir">آخرین مشتریان اضافه شده</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentCustomers.length > 0 ? (
                dashboardData.recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-secondary/30 transition-all duration-300">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-secondary via-accent to-primary text-white font-vazir text-xs">
                          {customer.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium font-vazir text-sm">{customer.name}</p>
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          <Badge
                            variant={customer.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs font-vazir"
                          >
                            {customer.status === 'active' ? 'فعال' :
                              customer.status === 'prospect' ? 'احتمالی' : 'غیرفعال'}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-vazir">
                            {new Date(customer.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-vazir text-xs"
                      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                    >
                      مشاهده
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground font-vazir py-4">
                  مشتری جدیدی اضافه نشده است
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* برنامه امروز و گزارش کاربران */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 hover:border-accent/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Calendar className="h-5 w-5 text-accent" />
              <span>برنامه امروز</span>
            </CardTitle>
            <CardDescription className="font-vazir">وظایف و برنامه‌های امروز</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.todaySchedule.length > 0 ? (
                dashboardData.todaySchedule.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-accent/30 transition-all duration-300">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`h-3 w-3 rounded-full ${task.priority === 'high' ? 'bg-destructive' :
                        task.priority === 'medium' ? 'bg-accent' : 'bg-secondary'
                        }`} />
                      <div>
                        <p className="font-medium font-vazir text-sm">{task.title}</p>
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          <span className="text-xs text-muted-foreground font-vazir">
                            {task.customer_name || 'عمومی'}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground font-vazir">
                              {new Date(task.due_date).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      task.status === 'pending' ? 'destructive' :
                        task.status === 'in_progress' ? 'default' : 'secondary'
                    } className="font-vazir text-xs">
                      {task.status === 'pending' ? 'در انتظار' :
                        task.status === 'in_progress' ? 'در حال انجام' : 'تکمیل'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground font-vazir py-4">
                  برنامه‌ای برای امروز وجود ندارد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {dashboardData.currentUser.isAdmin && (
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>گزارش کاربران</span>
              </CardTitle>
              <CardDescription className="font-vazir">عملکرد تیم امروز</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.userActivityReport.length > 0 ? (
                  dashboardData.userActivityReport.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir text-xs">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium font-vazir text-sm">{user.name}</p>
                          <div className="flex items-center space-x-3 space-x-reverse text-xs text-muted-foreground">
                            <span className="font-vazir">
                              {user.activities_today} فعالیت
                            </span>
                            <span className="font-vazir">
                              {user.tasks_completed}/{user.tasks_assigned} وظیفه
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge
                          variant={user.activities_today > 0 ? 'default' : 'secondary'}
                          className="text-xs font-vazir"
                        >
                          {user.activities_today > 0 ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground font-vazir py-4">
                    گزارشی موجود نیست
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* گزینه‌های دسترسی سریع */}
      <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-vazir">دسترسی سریع</CardTitle>
          <CardDescription className="font-vazir">عملیات پرکاربرد سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 flex-col border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 font-vazir"
              onClick={() => router.push('/dashboard/customers/new')}
            >
              <UserPlus className="h-6 w-6 mb-2 text-primary" />
              افزودن مشتری
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col border-secondary/20 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 font-vazir"
              onClick={() => router.push('/dashboard/activities')}
            >
              <Phone className="h-6 w-6 mb-2 text-secondary" />
              ثبت فعالیت
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col border-accent/20 hover:border-accent hover:bg-accent/5 transition-all duration-300 font-vazir"
              onClick={() => router.push('/dashboard/tasks')}
            >
              <CheckCircle className="h-6 w-6 mb-2 text-accent" />
              مدیریت وظایف
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 font-vazir"
              onClick={() => router.push('/dashboard/reports')}
            >
              <BarChart3 className="h-6 w-6 mb-2 text-orange-500" />
              گزارش‌گیری
            </Button>

            {dashboardData.currentUser.isAdmin && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex-col border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 font-vazir"
                  onClick={() => router.push('/dashboard/coworkers')}
                >
                  <Users className="h-6 w-6 mb-2 text-purple-500" />
                  مدیریت کاربران
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 font-vazir"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <Settings className="h-6 w-6 mb-2 text-green-500" />
                  تنظیمات سیستم
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 font-vazir"
                  onClick={() => router.push('/dashboard/interactions')}
                >
                  <MessageCircle className="h-6 w-6 mb-2 text-blue-500" />
                  پیام‌رسانی
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-300 font-vazir"
                  onClick={() => router.push('/dashboard/tickets')}
                >
                  <Ticket className="h-6 w-6 mb-2 text-red-500" />
                  مدیریت تیکت
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}