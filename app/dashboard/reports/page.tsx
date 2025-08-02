'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { PageWrapper } from '@/components/layout/page-wrapper';
import {
  Filter,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Download,
  Search,
  Loader2,
  AlertCircle,
  User,
  BarChart3
} from 'lucide-react';

interface DailyReport {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  report_date: string;
  persian_date: string;
  work_description: string;
  working_hours?: number;
  challenges?: string;
  achievements?: string;
  completed_tasks?: string;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedDate, selectedUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
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
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.users) {
        // Filter out CEOs from the list
        const filteredUsers = data.users.filter((user: User) =>
          user.role !== 'ceo' && user.role !== 'مدیر'
        );
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedUser && selectedUser !== 'all') params.append('user_id', selectedUser);

      console.log('fetchReports called with:', { selectedDate, selectedUser });
      console.log('API URL:', `/api/reports?${params.toString()}`);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch(`/api/reports?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setReports(data.data || []);
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در دریافت گزارش‌ها",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReports = () => {
    // Implementation for exporting reports
    toast({
      title: "در حال توسعه",
      description: "قابلیت خروجی گرفتن در نسخه بعدی اضافه خواهد شد"
    });
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    return (
      report.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.work_description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const isManager = currentUser && ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(currentUser.role);

  if (!isManager) {
    return (
      <PageWrapper
        title="دسترسی محدود"
        showBreadcrumb={false}
      >
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-vazir">
                شما مجوز مشاهده گزارش‌های سایر کاربران را ندارید
              </p>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="گزارش‌های روزانه"
      description="مشاهده و مدیریت گزارش‌های روزانه کارکنان"
      actions={
        <Button onClick={handleExportReports} variant="outline" className="font-vazir">
          <Download className="h-4 w-4 ml-2" />
          خروجی Excel
        </Button>
      }
    >

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-vazir">فیلترها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium font-vazir mb-2 block">تاریخ</label>
              <PersianDatePicker
                value={selectedDate}
                onChange={(value) => {
                  console.log('PersianDatePicker onChange:', value);
                  setSelectedDate(value);
                }}
                placeholder="انتخاب تاریخ"
                className="font-vazir"
              />
            </div>
            <div>
              <label className="text-sm font-medium font-vazir mb-2 block">کارمند</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="font-vazir">
                  <SelectValue placeholder="انتخاب کارمند" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-vazir">همه کارمندان</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="font-vazir">
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium font-vazir mb-2 block">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در گزارش‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 font-vazir"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedDate('');
                  setSelectedUser('all');
                  setSearchTerm('');
                }}
                variant="outline"
                className="font-vazir"
              >
                <Filter className="h-4 w-4 ml-2" />
                پاک کردن فیلترها
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کل گزارش‌ها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{filteredReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کارمندان فعال</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {new Set(filteredReports.map(r => r.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">میانگین ساعات کاری</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {filteredReports.length > 0
                ? (filteredReports.reduce((sum, r) => sum + (r.working_hours || 0), 0) / filteredReports.length).toFixed(1)
                : '0'
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">گزارش‌های امروز</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {filteredReports.filter(r => r.report_date === new Date().toISOString().split('T')[0]).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-vazir">گزارش‌های روزانه</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="mr-2 font-vazir">در حال بارگذاری...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-vazir">هیچ گزارشی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map(report => (
                <Card key={report.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium font-vazir">{report.user_name}</h3>
                          <p className="text-sm text-muted-foreground font-vazir">
                            {report.persian_date} ({report.report_date})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-vazir">
                          {report.user_role}
                        </Badge>
                        {report.working_hours && (
                          <Badge variant="secondary" className="font-vazir">
                            {report.working_hours} ساعت
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium font-vazir mb-2">شرح کار انجام شده:</h4>
                      <p className="text-sm text-muted-foreground font-vazir leading-relaxed">
                        {report.work_description}
                      </p>
                    </div>

                    {report.achievements && (
                      <div>
                        <h4 className="font-medium font-vazir mb-2 text-green-700">دستاورد‌ها:</h4>
                        <p className="text-sm text-muted-foreground font-vazir leading-relaxed">
                          {report.achievements}
                        </p>
                      </div>
                    )}

                    {report.challenges && (
                      <div>
                        <h4 className="font-medium font-vazir mb-2 text-orange-700">چالش‌ها:</h4>
                        <p className="text-sm text-muted-foreground font-vazir leading-relaxed">
                          {report.challenges}
                        </p>
                      </div>
                    )}

                    {report.tasks && report.tasks.length > 0 && (
                      <div>
                        <h4 className="font-medium font-vazir mb-2">وظایف تکمیل شده:</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.tasks.map(task => (
                            <Badge key={task.id} variant="outline" className="font-vazir text-xs">
                              {task.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground font-vazir pt-2 border-t">
                      ثبت شده در: {new Date(report.created_at).toLocaleString('fa-IR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
