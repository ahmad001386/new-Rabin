'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/lib/types';
import {
  Plus,
  Users,
  TrendingUp,
  Star,
  Search,
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  Calendar,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Tag,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { toast } = useToast();

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data || []);
      } else {
        setError(data.message || 'خطا در دریافت مشتریان');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
    const matchesPriority = priorityFilter === 'all' || customer.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesSegment && matchesPriority;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'inactive': return 'غیرفعال';
      case 'follow_up': return 'نیاز به پیگیری';
      case 'rejected': return 'رد شده';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'follow_up': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'enterprise': return 'سازمانی';
      case 'small_business': return 'کسب‌وکار کوچک';
      case 'individual': return 'فردی';
      default: return segment;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return priority || 'متوسط';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new_lead': return 'لید جدید';
      case 'contacted': return 'تماس برقرار شده';
      case 'needs_analysis': return 'نیازسنجی';
      case 'proposal_sent': return 'ارسال پیشنهاد';
      case 'negotiation': return 'مذاکره';
      case 'closed_won': return 'بسته شده - برنده';
      case 'closed_lost': return 'بسته شده - بازنده';
      default: return stage;
    }
  };

  const getStageProgress = (stage: string) => {
    const stages = ['new_lead', 'contacted', 'needs_analysis', 'proposal_sent', 'negotiation', 'closed_won'];
    const currentIndex = stages.indexOf(stage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const columns = [
    {
      key: 'name',
      label: 'مشتری',
      sortable: true,
      render: (value: string, row: Customer) => (
        <div className="flex items-center space-x-3 space-x-reverse">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir">
              {value.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/dashboard/customers/${row.id}`}
              className="font-medium font-vazir hover:text-primary transition-colors"
            >
              {value}
            </Link>
            <div className="flex items-center space-x-2 space-x-reverse mt-1">
              <span className="text-sm text-muted-foreground font-vazir">{row.email}</span>
              {row.priority === 'high' && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'وضعیت',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)} className="font-vazir">
          {getStatusLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'segment',
      label: 'بخش',
      sortable: true,
      render: (value: string) => (
        <span className="font-vazir">{getSegmentLabel(value)}</span>
      ),
    },
    {
      key: 'salesPipeline',
      label: 'مسیر فروش',
      render: (value: any, row: Customer) => {
        if (!value) return <span className="text-muted-foreground font-vazir">تعریف نشده</span>;

        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-vazir">{getStageName(value.currentStage)}</span>
              <span className="text-xs text-muted-foreground font-vazir">
                %{value.successProbability?.toLocaleString('fa-IR')}
              </span>
            </div>
            <Progress value={getStageProgress(value.currentStage)} className="h-1" />
          </div>
        );
      },
    },
    {
      key: 'potentialValue',
      label: 'ارزش بالقوه',
      sortable: true,
      render: (value: number) => (
        <span className="font-vazir font-medium">
          {value ? `${(value / 1000000).toLocaleString('fa-IR')}M تومان` : 'تعریف نشده'}
        </span>
      ),
    },
    {
      key: 'satisfactionScore',
      label: 'رضایت',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1 space-x-reverse">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-vazir">{value?.toLocaleString('fa-IR') || 'ندارد'}</span>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: 'مسئول',
      sortable: true,
      render: (value: string) => (
        <span className="font-vazir">{value || 'تخصیص نیافته'}</span>
      ),
    },
    {
      key: 'lastInteraction',
      label: 'آخرین تعامل',
      sortable: true,
      render: (value: string) => (
        <span className="font-vazir">
          {value ? new Date(value).toLocaleDateString('fa-IR') : 'ندارد'}
        </span>
      ),
    },
  ];

  const handleEditCustomer = (customer: Customer) => {
    console.log('ویرایش مشتری:', customer);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    console.log('حذف مشتری:', customer);
  };

  // آمار مشتریان
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const followUpCustomers = customers.filter(c => c.status === 'follow_up').length;
  const enterpriseCustomers = customers.filter(c => c.segment === 'enterprise').length;
  const avgSatisfaction = customers.length > 0 ? customers.reduce((sum, c) => sum + (c.satisfactionScore || 0), 0) / customers.length : 0;
  const totalPotentialValue = customers.reduce((sum, c) => sum + (c.potentialValue || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-vazir">در حال بارگذاری مشتریان...</p>
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
            مدیریت مشتریان
          </h1>
          <p className="text-muted-foreground font-vazir mt-2">مدیریت کامل مشتریان و فرآیند فروش</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={loadCustomers} disabled={loading} className="font-vazir">
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button variant="outline" className="font-vazir">
            <Download className="h-4 w-4 ml-2" />
            خروجی CSV
          </Button>
          <Link href="/dashboard/customers/new">
            <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
              <Plus className="h-4 w-4 ml-2" />
              افزودن مشتری
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 space-x-reverse text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-vazir">{error}</span>
              <Button variant="outline" size="sm" onClick={loadCustomers} className="mr-auto font-vazir">
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کل مشتریان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{totalCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">فعال</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-vazir">{activeCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">نیاز به پیگیری</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 font-vazir">{followUpCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">سازمانی</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{enterpriseCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">میانگین رضایت</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 font-vazir">{avgSatisfaction.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}</div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">ارزش کل</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {totalPotentialValue > 0 ? `${(totalPotentialValue / 1000000000).toFixed(1)}B تومان` : '۰ تومان'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
            <Filter className="h-5 w-5" />
            <span>فیلتر مشتریان</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی نام یا ایمیل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-vazir"
                dir="rtl"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="font-vazir">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-vazir">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active" className="font-vazir">فعال</SelectItem>
                <SelectItem value="inactive" className="font-vazir">غیرفعال</SelectItem>
                <SelectItem value="follow_up" className="font-vazir">نیاز به پیگیری</SelectItem>
                <SelectItem value="rejected" className="font-vazir">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="font-vazir">
                <SelectValue placeholder="بخش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-vazir">همه بخش‌ها</SelectItem>
                <SelectItem value="enterprise" className="font-vazir">سازمانی</SelectItem>
                <SelectItem value="small_business" className="font-vazir">کسب‌وکار کوچک</SelectItem>
                <SelectItem value="individual" className="font-vazir">فردی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="font-vazir">
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-vazir">همه اولویت‌ها</SelectItem>
                <SelectItem value="high" className="font-vazir">بالا</SelectItem>
                <SelectItem value="medium" className="font-vazir">متوسط</SelectItem>
                <SelectItem value="low" className="font-vazir">پایین</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSegmentFilter('all');
                setPriorityFilter('all');
              }}
              className="font-vazir"
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* مشتریان اولویت بالا */}
      {customers.filter(c => c.priority === 'high').length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-red-700 dark:text-red-300 font-vazir">
              <AlertTriangle className="h-5 w-5" />
              <span>مشتریان اولویت بالا</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {customers.filter(c => c.priority === 'high').map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-vazir">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium font-vazir">{customer.name}</p>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge variant={getStatusColor(customer.status)} className="font-vazir">
                          {getStatusLabel(customer.status)}
                        </Badge>
                        {customer.potentialValue && (
                          <span className="text-sm text-muted-foreground font-vazir">
                            {(customer.potentialValue / 1000000).toLocaleString('fa-IR')}M تومان
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button size="sm" variant="outline" className="font-vazir">
                      <Phone className="h-4 w-4 ml-1" />
                      تماس
                    </Button>
                    <Link href={`/dashboard/customers/${customer.id}`}>
                      <Button size="sm" className="font-vazir">
                        <Eye className="h-4 w-4 ml-1" />
                        مشاهده
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول مشتریان */}
      <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-vazir">
            همه مشتریان ({filteredCustomers.length.toLocaleString('fa-IR')} مورد)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-vazir">مشتری‌ای یافت نشد</p>
              <Link href="/dashboard/customers/new">
                <Button className="mt-4 font-vazir">
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن اولین مشتری
                </Button>
              </Link>
            </div>
          ) : (
            <DataTable
              data={filteredCustomers}
              columns={columns}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}