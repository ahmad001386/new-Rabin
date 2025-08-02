'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { mockCustomers, mockActivities, mockNotes, mockTasks, mockContacts } from '@/lib/mock-data';
import { Customer, Activity, Note, Task, Contact } from '@/lib/types';
import {
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Plus,
  Edit,
  Star,
  Target,
  DollarSign,
  Users,
  Ticket,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  MapPin,
  Tag,
  FileText,
  Activity as ActivityIcon,
  TrendingUp,
  Eye,
  Save,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const customer = mockCustomers.find(c => c.id === customerId);

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-vazir">مشتری یافت نشد</h2>
          <p className="text-muted-foreground font-vazir mt-2">مشتری مورد نظر وجود ندارد</p>
          <Button onClick={() => router.push('/dashboard/customers')} className="mt-4 font-vazir">
            بازگشت به لیست مشتریان
          </Button>
        </div>
      </div>
    );
  }

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    title: '',
    description: '',
    outcome: 'successful',
  });
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
  });

  // فیلتر کردن داده‌ها برای این مشتری
  const customerActivities = mockActivities.filter(a => a.customerId === customerId);
  const customerNotes = mockNotes.filter(n => n.customerId === customerId);
  const customerTasks = mockTasks.filter(t => t.customerId === customerId);
  const customerContacts = mockContacts.filter((c: any) => c.customerId === customerId);

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

  const getStageIcon = (stage: string, isActive: boolean = false) => {
    const iconClass = `h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
    switch (stage) {
      case 'new_lead': return <User className={iconClass} />;
      case 'contacted': return <Phone className={iconClass} />;
      case 'needs_analysis': return <Eye className={iconClass} />;
      case 'proposal_sent': return <FileText className={iconClass} />;
      case 'negotiation': return <MessageCircle className={iconClass} />;
      case 'closed_won': return <CheckCircle className={iconClass} />;
      case 'closed_lost': return <AlertTriangle className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  const handleAddActivity = () => {
    console.log('افزودن فعالیت:', newActivity);
    setShowAddActivity(false);
    setNewActivity({ type: 'call', title: '', description: '', outcome: 'successful' });
  };

  const handleAddNote = () => {
    console.log('افزودن یادداشت:', newNote);
    setShowAddNote(false);
    setNewNote({ title: '', content: '', category: 'general', tags: '' });
  };

  const salesPipeline = customer.salesPipeline;
  const stages = ['new_lead', 'contacted', 'needs_analysis', 'proposal_sent', 'negotiation', 'closed_won'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/customers')}
            className="hover:bg-primary/10"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-4 space-x-reverse">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir text-lg">
                {customer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-vazir">{customer.name}</h1>
              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                <Badge variant={getStatusColor(customer.status)} className="font-vazir">
                  {getStatusLabel(customer.status)}
                </Badge>
                <span className="text-muted-foreground font-vazir">{getSegmentLabel(customer.segment)}</span>
                {customer.priority && (
                  <span className={`text-sm font-medium ${getPriorityColor(customer.priority)} font-vazir`}>
                    اولویت {getPriorityLabel(customer.priority)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" className="font-vazir">
            <Phone className="h-4 w-4 ml-2" />
            تماس
          </Button>
          <Button variant="outline" className="font-vazir">
            <Mail className="h-4 w-4 ml-2" />
            ایمیل
          </Button>
          <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
            <Edit className="h-4 w-4 ml-2" />
            ویرایش
          </Button>
        </div>
      </div>

      {/* اطلاعات کلی و آمار */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">ارزش بالقوه</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {customer.potentialValue ? `${(customer.potentialValue / 1000000).toLocaleString('fa-IR')}M تومان` : 'تعریف نشده'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">امتیاز رضایت</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 font-vazir">
              {customer.satisfactionScore ? customer.satisfactionScore.toLocaleString('fa-IR') : 'ندارد'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">تعداد تیکت‌ها</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{customer.totalTickets.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">مسئول</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium font-vazir">{customer.assignedTo || 'تخصیص نیافته'}</div>
          </CardContent>
        </Card>
      </div>

      {/* فرایند فروش */}
      {salesPipeline && (
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>فرایند فروش</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* اطلاعات کلی معامله */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-vazir">مرحله فعلی</p>
                  <p className="text-lg font-bold font-vazir">{getStageName(salesPipeline.currentStage)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-vazir">احتمال موفقیت</p>
                  <p className="text-lg font-bold text-primary font-vazir">
                    %{salesPipeline.successProbability?.toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-vazir">ارزش معامله</p>
                  <p className="text-lg font-bold text-secondary font-vazir">
                    {salesPipeline.dealValue ? `${(salesPipeline.dealValue / 1000000).toLocaleString('fa-IR')}M تومان` : 'تعریف نشده'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-vazir">مسئول فروش</p>
                  <p className="text-lg font-bold font-vazir">{salesPipeline.owner}</p>
                </div>
              </div>

              <Separator />

              {/* نمودار پیشرفت */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium font-vazir">پیشرفت کلی</span>
                  <span className="text-sm text-muted-foreground font-vazir">
                    %{getStageProgress(salesPipeline.currentStage).toFixed(0)}
                  </span>
                </div>
                <Progress value={getStageProgress(salesPipeline.currentStage)} className="h-3" />
              </div>

              {/* مراحل فروش */}
              <div className="space-y-4">
                <h4 className="font-medium font-vazir">مراحل فرایند فروش</h4>
                <div className="grid gap-4 md:grid-cols-6">
                  {stages.map((stage, index) => {
                    const isActive = stage === salesPipeline.currentStage;
                    const isCompleted = stages.indexOf(salesPipeline.currentStage) > index;

                    return (
                      <div
                        key={stage}
                        className={`p-4 rounded-lg border text-center transition-all duration-300 ${isActive
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : isCompleted
                              ? 'border-secondary bg-secondary/10'
                              : 'border-border bg-muted/50'
                          }`}
                      >
                        <div className="flex justify-center mb-2">
                          {getStageIcon(stage, isActive || isCompleted)}
                        </div>
                        <p className={`text-sm font-medium font-vazir ${isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-muted-foreground'
                          }`}>
                          {getStageName(stage)}
                        </p>
                        {isActive && (
                          <Badge variant="default" className="mt-2 font-vazir">فعلی</Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-secondary mx-auto mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* اطلاعات اضافی */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium font-vazir">آخرین تماس</p>
                  <p className="text-sm text-muted-foreground font-vazir">
                    {salesPipeline.lastContactDate
                      ? new Date(salesPipeline.lastContactDate).toLocaleDateString('fa-IR')
                      : 'ثبت نشده'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium font-vazir">تعداد تلاش‌ها</p>
                  <p className="text-sm text-muted-foreground font-vazir">
                    {salesPipeline.contactAttempts?.toLocaleString('fa-IR') || '۰'} بار
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium font-vazir">اقدام بعدی</p>
                  <p className="text-sm text-muted-foreground font-vazir">
                    {salesPipeline.nextAction || 'تعریف نشده'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* اطلاعات تماس */}
      <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
            <Building className="h-5 w-5 text-secondary" />
            <span>اطلاعات تماس</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-vazir">{customer.email}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-vazir">{customer.phone}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-vazir">
                عضویت: {new Date(customer.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
          {customer.tags && customer.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 font-vazir">برچسب‌ها:</p>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="font-vazir">
                    <Tag className="h-3 w-3 ml-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تب‌های جزئیات */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities" className="font-vazir">فعالیت‌ها</TabsTrigger>
          <TabsTrigger value="notes" className="font-vazir">یادداشت‌ها</TabsTrigger>
          <TabsTrigger value="tasks" className="font-vazir">تسک‌ها</TabsTrigger>
          <TabsTrigger value="contacts" className="font-vazir">مخاطبین</TabsTrigger>
        </TabsList>

        {/* فعالیت‌ها */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-vazir">فعالیت‌ها ({customerActivities.length.toLocaleString('fa-IR')})</CardTitle>
                <Button
                  onClick={() => setShowAddActivity(true)}
                  size="sm"
                  className="font-vazir"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن فعالیت
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddActivity && (
                <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                  <h4 className="font-medium mb-4 font-vazir">افزودن فعالیت جدید</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="font-vazir">نوع فعالیت</Label>
                      <Select value={newActivity.type} onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}>
                        <SelectTrigger className="font-vazir">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call" className="font-vazir">تماس تلفنی</SelectItem>
                          <SelectItem value="meeting" className="font-vazir">جلسه</SelectItem>
                          <SelectItem value="email" className="font-vazir">ایمیل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">نتیجه</Label>
                      <Select value={newActivity.outcome} onValueChange={(value) => setNewActivity({ ...newActivity, outcome: value })}>
                        <SelectTrigger className="font-vazir">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="successful" className="font-vazir">موفق</SelectItem>
                          <SelectItem value="follow_up_needed" className="font-vazir">نیاز به پیگیری</SelectItem>
                          <SelectItem value="no_response" className="font-vazir">بدون پاسخ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">عنوان</Label>
                      <Input
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        placeholder="عنوان فعالیت"
                        className="font-vazir"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">توضیحات</Label>
                      <Textarea
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        placeholder="توضیحات فعالیت"
                        className="font-vazir"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse mt-4">
                    <Button onClick={handleAddActivity} size="sm" className="font-vazir">
                      <Save className="h-4 w-4 ml-2" />
                      ذخیره
                    </Button>
                    <Button onClick={() => setShowAddActivity(false)} variant="outline" size="sm" className="font-vazir">
                      انصراف
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {customerActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                    <div className={`p-2 rounded-full ${activity.type === 'call' ? 'bg-primary/10 text-primary' :
                        activity.type === 'meeting' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                      }`}>
                      {activity.type === 'call' ? <Phone className="h-4 w-4" /> :
                        activity.type === 'meeting' ? <Calendar className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium font-vazir">{activity.title}</h4>
                        <span className="text-sm text-muted-foreground font-vazir">
                          {new Date(activity.startTime).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <p className="text-sm mt-2 font-vazir">{activity.description}</p>
                      <div className="flex items-center space-x-4 space-x-reverse mt-2">
                        <span className="text-xs text-muted-foreground font-vazir">
                          توسط: {activity.performedBy}
                        </span>
                        <Badge variant={activity.outcome === 'successful' ? 'default' : 'secondary'} className="text-xs font-vazir">
                          {activity.outcome === 'successful' ? 'موفق' :
                            activity.outcome === 'follow_up_needed' ? 'نیاز به پیگیری' : 'بدون پاسخ'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {customerActivities.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    فعالیتی ثبت نشده است
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* یادداشت‌ها */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-vazir">یادداشت‌ها ({customerNotes.length.toLocaleString('fa-IR')})</CardTitle>
                <Button
                  onClick={() => setShowAddNote(true)}
                  size="sm"
                  className="font-vazir"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن یادداشت
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddNote && (
                <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                  <h4 className="font-medium mb-4 font-vazir">افزودن یادداشت جدید</h4>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-vazir">عنوان</Label>
                        <Input
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          placeholder="عنوان یادداشت"
                          className="font-vazir"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-vazir">دسته‌بندی</Label>
                        <Select value={newNote.category} onValueChange={(value) => setNewNote({ ...newNote, category: value })}>
                          <SelectTrigger className="font-vazir">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer_need" className="font-vazir">نیاز مشتری</SelectItem>
                            <SelectItem value="sales_tip" className="font-vazir">نکته فروش</SelectItem>
                            <SelectItem value="objection" className="font-vazir">اعتراض</SelectItem>
                            <SelectItem value="general" className="font-vazir">عمومی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">محتوا</Label>
                      <Textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        placeholder="محتوای یادداشت..."
                        rows={4}
                        className="font-vazir"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">برچسب‌ها (با کاما جدا کنید)</Label>
                      <Input
                        value={newNote.tags}
                        onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                        placeholder="برچسب۱، برچسب۲، ..."
                        className="font-vazir"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse mt-4">
                    <Button onClick={handleAddNote} size="sm" className="font-vazir">
                      <Save className="h-4 w-4 ml-2" />
                      ذخیره
                    </Button>
                    <Button onClick={() => setShowAddNote(false)} variant="outline" size="sm" className="font-vazir">
                      انصراف
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {customerNotes.map((note) => (
                  <div key={note.id} className="p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium font-vazir">{note.title}</h4>
                      <span className="text-sm text-muted-foreground font-vazir">
                        {new Date(note.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-sm mb-3 font-vazir">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-vazir">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground font-vazir">
                        توسط: {note.createdBy}
                      </span>
                    </div>
                  </div>
                ))}
                {customerNotes.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    یادداشتی ثبت نشده است
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تسک‌ها */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">تسک‌ها ({customerTasks.length.toLocaleString('fa-IR')})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`h-3 w-3 rounded-full ${task.priority === 'high' ? 'bg-destructive' :
                          task.priority === 'medium' ? 'bg-accent' : 'bg-secondary'
                        }`} />
                      <div>
                        <p className="font-medium font-vazir">{task.title}</p>
                        <p className="text-sm text-muted-foreground font-vazir">{task.description}</p>
                        <p className="text-xs text-muted-foreground font-vazir">
                          سررسید: {new Date(task.dueDate).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      task.status === 'pending' ? 'destructive' :
                        task.status === 'in_progress' ? 'default' : 'secondary'
                    } className="font-vazir">
                      {task.status === 'pending' ? 'در انتظار' :
                        task.status === 'in_progress' ? 'در حال انجام' : 'تکمیل'}
                    </Badge>
                  </div>
                ))}
                {customerTasks.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    تسکی تعریف نشده است
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* مخاطبین */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="font-vazir">مخاطبین ({customerContacts.length.toLocaleString('fa-IR')})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium font-vazir">{contact.name}</p>
                        <p className="text-sm text-muted-foreground font-vazir">{contact.role}</p>
                        <div className="flex items-center space-x-4 space-x-reverse mt-1">
                          <span className="text-xs text-muted-foreground font-vazir">{contact.email}</span>
                          <span className="text-xs text-muted-foreground font-vazir">{contact.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline" className="font-vazir">
                        <Phone className="h-4 w-4 ml-1" />
                        تماس
                      </Button>
                      <Button size="sm" variant="outline" className="font-vazir">
                        <Mail className="h-4 w-4 ml-1" />
                        ایمیل
                      </Button>
                    </div>
                  </div>
                ))}
                {customerContacts.length === 0 && (
                  <p className="text-center text-muted-foreground font-vazir py-8">
                    مخاطبی ثبت نشده است
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