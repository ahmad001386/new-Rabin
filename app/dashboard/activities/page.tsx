'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { Activity } from '@/app/types';
import moment from 'moment-jalaali';
import {
  Plus,
  Phone,
  Calendar,
  Mail,
  MessageCircle,
  Clock,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity as ActivityIcon,
} from 'lucide-react';

// Configure moment-jalaali
moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    successful: 0,
    followUp: 0
  });

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [newActivity, setNewActivity] = useState({
    type: 'call',
    customer_id: '',
    title: '',
    description: '',
    start_time: '',
    outcome: 'successful',
  });

  useEffect(() => {
    fetchActivities();
    loadCustomers();
  }, [filterType, filterOutcome, searchTerm, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: page.toString(),
        type: filterType !== 'all' ? filterType : '',
        outcome: filterOutcome !== 'all' ? filterOutcome : '',
        search: searchTerm,
      });

      const response = await fetch(`/api/activities?${searchParams}`);
      const data = await response.json();

      setActivities(data.data);
      setTotalPages(data.pagination.total_pages);

      // آمار فعالیت‌ها
      const todayDate = new Date().toISOString().split('T')[0];
      const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      setStats({
        total: data.pagination.total,
        today: data.data.filter((a: Activity) => a.start_time && a.start_time.startsWith(todayDate)).length,
        thisWeek: data.data.filter((a: Activity) => a.start_time && a.start_time >= weekAgoDate).length,
        successful: data.data.filter((a: Activity) => a.outcome === 'successful').length,
        followUp: data.data.filter((a: Activity) => a.outcome === 'follow_up_needed').length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };


  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const persianDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  const filteredActivities = activities ? activities.filter(activity => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesOutcome = filterOutcome === 'all' || activity.outcome === filterOutcome;

    return matchesSearch && matchesType && matchesOutcome;
  }) : [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'meeting': return Calendar;
      case 'email': return Mail;
      case 'sms': return MessageCircle;
      case 'whatsapp': return MessageCircle;
      default: return ActivityIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-primary/10 text-primary';
      case 'meeting': return 'bg-secondary/10 text-secondary';
      case 'email': return 'bg-accent/10 text-accent';
      case 'sms': return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200';
      case 'whatsapp': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'successful': return CheckCircle;
      case 'follow_up_needed': return AlertCircle;
      case 'no_response': return XCircle;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'successful': return 'text-green-600';
      case 'follow_up_needed': return 'text-yellow-600';
      case 'no_response': return 'text-red-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'successful': return 'موفق';
      case 'follow_up_needed': return 'نیاز به پیگیری';
      case 'no_response': return 'بدون پاسخ';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return outcome;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'call': return 'تماس تلفنی';
      case 'meeting': return 'جلسه';
      case 'email': return 'ایمیل';
      case 'sms': return 'پیامک';
      case 'whatsapp': return 'واتساپ';
      case 'follow_up': return 'پیگیری';
      case 'system_task': return 'تسک سیستمی';
      default: return type;
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAddActivity = async () => {
    try {
      // Client-side validation for required fields
      if (!newActivity.customer_id) {
        setError('لطفا مشتری را انتخاب کنید');
        return;
      }

      if (!newActivity.title) {
        setError('لطفا عنوان فعالیت را وارد کنید');
        return;
      }

      if (!newActivity.start_time) {
        setError('لطفا زمان شروع را وارد کنید');
        return;
      }

      // Clear any previous errors
      setError(null);

      // Format dates properly for MySQL TIMESTAMP
      const formattedActivity = {
        ...newActivity,
        id: undefined, // Remove any client-side ID
        start_time: newActivity.start_time ? new Date(newActivity.start_time).toISOString() : '',
      };

      // Debug: Log the data being sent to the API
      console.log('Sending activity data:', formattedActivity);

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedActivity)
      });

      const data = await response.json();

      // Debug: Log the API response
      console.log('API response:', data);

      if (data.success) {
        setShowAddForm(false);
        setNewActivity({
          type: 'call',
          customer_id: '',
          title: '',
          description: '',
          start_time: '',
          outcome: 'successful',
        });
        fetchActivities(); // Refresh activities list
      } else {
        throw new Error(data.message || 'خطا در ثبت فعالیت');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت فعالیت');
    }
  };

  const todayActivities = activities ? activities.filter(activity =>
    new Date(activity.start_time).toDateString() === new Date().toDateString()
  ) : [];

  const thisWeekActivities = activities ? activities.filter(activity => {
    const activityDate = new Date(activity.start_time);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo && activityDate <= today;
  }) : [];

  const activityStats = {
    total: activities ? activities.length : 0,
    today: todayActivities.length,
    thisWeek: thisWeekActivities.length,
    successful: activities ? activities.filter(a => a.outcome === 'successful').length : 0,
    followUp: activities ? activities.filter(a => a.outcome === 'follow_up_needed').length : 0,
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getActivitiesForDate = (date: Date) => {
    return activities ? activities.filter(activity => {
      const activityDate = new Date(activity.start_time);
      return activityDate.toDateString() === date.toDateString();
    }) : [];
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // روزهای خالی ابتدای ماه
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-border/20"></div>);
    }

    // روزهای ماه
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayActivities = getActivitiesForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`h-32 border border-border/20 p-2 ${isToday ? 'bg-primary/5 border-primary/30' : ''} cursor-pointer hover:border-primary/50`}
          onClick={() => {
            setSelectedDate(date);
            setShowAddForm(true);
            setNewActivity(prev => ({
              ...prev,
              start_time: date.toISOString(),
            }));
          }}
        >
          <div className={`text-sm font-medium mb-2 font-vazir ${isToday ? 'text-primary' : ''}`}>
            {day.toLocaleString('fa-IR')}
          </div>
          <div className="space-y-1">
            {dayActivities.slice(0, 2).map(activity => (
              <div key={activity.id} className={`text-xs p-1 rounded truncate font-vazir ${getActivityColor(activity.type)}`}>
                {activity.title}
              </div>
            ))}
            {dayActivities.length > 2 && (
              <div className="text-xs text-muted-foreground font-vazir">
                +{(dayActivities.length - 2).toLocaleString('fa-IR')} مورد دیگر
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-border/20 rounded-lg overflow-hidden">
        {persianDays.map(day => (
          <div key={day} className="bg-muted p-3 text-center font-medium font-vazir border-b border-border/20">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            مدیریت فعالیت‌ها
          </h1>
          <p className="text-muted-foreground font-vazir mt-2">پیگیری و ثبت تمام تعاملات با مشتریان</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir"
        >
          <Plus className="h-4 w-4 ml-2" />
          فعالیت جدید
        </Button>
      </div>

      {/* آمار فعالیت‌ها */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کل فعالیت‌ها</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{activityStats.total.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">امروز</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{activityStats.today.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">این هفته</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{activityStats.thisWeek.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">موفق</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-vazir">{activityStats.successful.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 hover:border-yellow-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">نیاز به پیگیری</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 font-vazir">{activityStats.followUp.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* فرم افزودن فعالیت */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-vazir">ثبت فعالیت جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activity-type" className="font-vazir">نوع فعالیت</Label>
                <Select value={newActivity.type} onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}>
                  <SelectTrigger className="font-vazir">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call" className="font-vazir">تماس تلفنی</SelectItem>
                    <SelectItem value="meeting" className="font-vazir">جلسه</SelectItem>
                    <SelectItem value="email" className="font-vazir">ایمیل</SelectItem>
                    <SelectItem value="sms" className="font-vazir">پیامک</SelectItem>
                    <SelectItem value="whatsapp" className="font-vazir">واتساپ</SelectItem>
                    <SelectItem value="follow_up" className="font-vazir">پیگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer" className="font-vazir">مشتری</Label>
                <Select
                  value={newActivity.customer_id}
                  onValueChange={(value) => setNewActivity({ ...newActivity, customer_id: value })}
                  disabled={loadingCustomers}
                >
                  <SelectTrigger className="font-vazir">
                    <SelectValue placeholder={loadingCustomers ? "در حال بارگذاری..." : "انتخاب مشتری"} />
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
                <Label htmlFor="title" className="font-vazir">عنوان</Label>
                <Input
                  id="title"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="عنوان فعالیت"
                  className="font-vazir"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time" className="font-vazir">زمان شروع</Label>
                <PersianDatePicker
                  value={newActivity.start_time}
                  onChange={(value) => setNewActivity({ ...newActivity, start_time: value })}
                  placeholder="انتخاب تاریخ و زمان"
                  className="font-vazir"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome" className="font-vazir">نتیجه</Label>
                <Select value={newActivity.outcome} onValueChange={(value) => setNewActivity({ ...newActivity, outcome: value })}>
                  <SelectTrigger className="font-vazir">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful" className="font-vazir">موفق</SelectItem>
                    <SelectItem value="follow_up_needed" className="font-vazir">نیاز به پیگیری</SelectItem>
                    <SelectItem value="no_response" className="font-vazir">بدون پاسخ</SelectItem>
                    <SelectItem value="completed" className="font-vazir">تکمیل شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="font-vazir">توضیحات</Label>
                <Textarea
                  id="description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="توضیحات تفصیلی فعالیت..."
                  rows={3}
                  className="font-vazir"
                  dir="rtl"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md mt-4 font-vazir">
                {error}
              </div>
            )}

            <div className="flex items-center space-x-4 space-x-reverse mt-6">
              <Button onClick={handleAddActivity} className="font-vazir">
                ثبت فعالیت
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="font-vazir">
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* فیلترها */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
            <Filter className="h-5 w-5" />
            <span>فیلتر فعالیت‌ها</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی عنوان یا مشتری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-vazir"
                dir="rtl"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="font-vazir">
                <SelectValue placeholder="نوع فعالیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-vazir">همه انواع</SelectItem>
                <SelectItem value="call" className="font-vazir">تماس تلفنی</SelectItem>
                <SelectItem value="meeting" className="font-vazir">جلسه</SelectItem>
                <SelectItem value="email" className="font-vazir">ایمیل</SelectItem>
                <SelectItem value="sms" className="font-vazir">پیامک</SelectItem>
                <SelectItem value="whatsapp" className="font-vazir">واتساپ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="font-vazir">
                <SelectValue placeholder="نتیجه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-vazir">همه نتایج</SelectItem>
                <SelectItem value="successful" className="font-vazir">موفق</SelectItem>
                <SelectItem value="follow_up_needed" className="font-vazir">نیاز به پیگیری</SelectItem>
                <SelectItem value="no_response" className="font-vazir">بدون پاسخ</SelectItem>
                <SelectItem value="completed" className="font-vazir">تکمیل شده</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterOutcome('all');
              }}
              className="font-vazir"
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تب‌های فعالیت‌ها */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="font-vazir">همه فعالیت‌ها</TabsTrigger>
          <TabsTrigger value="today" className="font-vazir">امروز</TabsTrigger>
          <TabsTrigger value="week" className="font-vazir">این هفته</TabsTrigger>
          <TabsTrigger value="follow-up" className="font-vazir">نیاز به پیگیری</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">
                همه فعالیت‌ها ({filteredActivities.length.toLocaleString('fa-IR')} مورد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const OutcomeIcon = getOutcomeIcon(activity.outcome);

                  return (
                    <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium font-vazir">{activity.title}</h4>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <OutcomeIcon className={`h-4 w-4 ${getOutcomeColor(activity.outcome)}`} />
                            <Badge variant="outline" className="font-vazir">
                              {getOutcomeLabel(activity.outcome)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-vazir">{activity.customer_name}</p>
                        <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                        <div className="flex items-center space-x-4 space-x-reverse mt-3">
                          <span className="text-xs text-muted-foreground font-vazir">
                            {getTypeLabel(activity.type)}
                          </span>
                          <span className="text-xs text-muted-foreground font-vazir">
                            {new Date(activity.start_time).toLocaleDateString('fa-IR')} -
                            {new Date(activity.start_time).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground font-vazir">
                            توسط: {activity.performed_by_name || activity.performed_by}
                          </span>
                          {activity.duration && (
                            <span className="text-xs text-muted-foreground font-vazir">
                              مدت زمان: {activity.duration.toLocaleString('fa-IR')} دقیقه
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredActivities.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    فعالیتی یافت نشد
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">
                فعالیت‌های امروز ({todayActivities.length.toLocaleString('fa-IR')} مورد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const OutcomeIcon = getOutcomeIcon(activity.outcome);

                  return (
                    <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium font-vazir">{activity.title}</h4>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <OutcomeIcon className={`h-4 w-4 ${getOutcomeColor(activity.outcome)}`} />
                            <Badge variant="outline" className="font-vazir">
                              {getOutcomeLabel(activity.outcome)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-vazir">{activity.customer_name}</p>
                        <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
                {todayActivities.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    امروز فعالیتی ثبت نشده است
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">
                فعالیت‌های این هفته ({thisWeekActivities.length.toLocaleString('fa-IR')} مورد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {thisWeekActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const OutcomeIcon = getOutcomeIcon(activity.outcome);

                  return (
                    <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium font-vazir">{activity.title}</h4>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <OutcomeIcon className={`h-4 w-4 ${getOutcomeColor(activity.outcome)}`} />
                            <Badge variant="outline" className="font-vazir">
                              {getOutcomeLabel(activity.outcome)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-vazir">{activity.customer_name}</p>
                        <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                        <div className="flex items-center space-x-4 space-x-reverse mt-3">
                          <span className="text-xs text-muted-foreground font-vazir">
                            {new Date(activity.start_time).toLocaleDateString('fa-IR')}
                          </span>
                          <span className="text-xs text-muted-foreground font-vazir">
                            توسط: {activity.performed_by_name || activity.performed_by}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-up">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">
                فعالیت‌های نیاز به پیگیری ({activities ? activities.filter(a => a.outcome === 'follow_up_needed').length.toLocaleString('fa-IR') : '0'} مورد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities ? activities.filter(a => a.outcome === 'follow_up_needed').map((activity) => {
                  const Icon = getActivityIcon(activity.type);

                  return (
                    <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 rounded-lg">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium font-vazir">{activity.title}</h4>
                          <Badge variant="destructive" className="font-vazir">
                            نیاز به پیگیری
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-vazir">{activity.customer_name}</p>
                        <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground font-vazir">
                            {new Date(activity.start_time).toLocaleDateString('fa-IR')} - {activity.performed_by_name || activity.performed_by}
                          </span>
                          <Button size="sm" className="font-vazir">
                            پیگیری کن
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    فعالیتی نیاز به پیگیری یافت نشد
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}