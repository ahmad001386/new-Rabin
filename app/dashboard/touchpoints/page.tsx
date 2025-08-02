import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockTouchpointsData } from '@/lib/mock-data';

const channelColors = {
    email: 'bg-blue-50 text-blue-600',
    phone: 'bg-green-50 text-green-600',
    chat: 'bg-purple-50 text-purple-600',
    social: 'bg-pink-50 text-pink-600',
    website: 'bg-orange-50 text-orange-600'
};

const statusColors = {
    resolved: 'bg-green-50 text-green-600',
    in_progress: 'bg-yellow-50 text-yellow-600',
    pending: 'bg-blue-50 text-blue-600'
};

const typeColors = {
    inquiry: 'bg-blue-50 text-blue-600',
    complaint: 'bg-red-50 text-red-600',
    support: 'bg-purple-50 text-purple-600',
    sales: 'bg-green-50 text-green-600',
    feedback: 'bg-yellow-50 text-yellow-600'
};

export default function TouchpointsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">نقاط تماس (Touchpoints)</h1>
                    <p className="text-muted-foreground">مدیریت و پیگیری تمام تعاملات با مشتریان</p>
                </div>
                <Button>ثبت تعامل جدید</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">کل تعاملات</h3>
                    <p className="text-3xl font-bold">{mockTouchpointsData.summary.total}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">ایمیل</h3>
                    <p className="text-3xl font-bold text-blue-600">{mockTouchpointsData.summary.byChannel.email}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">تلفن</h3>
                    <p className="text-3xl font-bold text-green-600">{mockTouchpointsData.summary.byChannel.phone}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">چت</h3>
                    <p className="text-3xl font-bold text-purple-600">{mockTouchpointsData.summary.byChannel.chat}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">نوع تعامل</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2" title="نوع تعامل">
                            <option value="all">همه</option>
                            <option value="support">پشتیبانی</option>
                            <option value="sales">فروش</option>
                            <option value="feedback">بازخورد</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">کانال</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2" title="کانال">
                            <option value="all">همه</option>
                            <option value="email">ایمیل</option>
                            <option value="phone">تلفن</option>
                            <option value="chat">چت</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">وضعیت</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2" title="وضعیت">
                            <option value="all">همه</option>
                            <option value="completed">تکمیل شده</option>
                            <option value="in_progress">در حال انجام</option>
                            <option value="scheduled">برنامه‌ریزی شده</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Touchpoints List */}
            <div className="space-y-4">
                {mockTouchpointsData.touchpoints.map(touchpoint => (
                    <Card key={touchpoint.id} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-medium">{touchpoint.customerName}</h3>
                                    <Badge className={typeColors[touchpoint.type]}>
                                        {touchpoint.type === 'inquiry' ? 'استعلام' :
                                            touchpoint.type === 'complaint' ? 'شکایت' :
                                                touchpoint.type === 'support' ? 'پشتیبانی' :
                                                    touchpoint.type === 'sales' ? 'فروش' : 'بازخورد'}
                                    </Badge>
                                    <Badge className={channelColors[touchpoint.channel]}>
                                        {touchpoint.channel === 'email' ? 'ایمیل' :
                                            touchpoint.channel === 'phone' ? 'تلفن' :
                                                touchpoint.channel === 'chat' ? 'چت' :
                                                    touchpoint.channel === 'social' ? 'شبکه اجتماعی' : 'وبسایت'}
                                    </Badge>
                                    <Badge className={statusColors[touchpoint.status]}>
                                        {touchpoint.status === 'resolved' ? 'حل شده' :
                                            touchpoint.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground">{touchpoint.description}</p>
                            </div>
                            {touchpoint.score && (
                                <div className="text-2xl font-bold text-primary">{touchpoint.score}/5</div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <div className="flex gap-4">
                                <span>تاریخ: {touchpoint.date}</span>
                                <span>کارشناس: {touchpoint.agent}</span>
                            </div>
                            <Button variant="outline" size="sm">جزئیات بیشتر</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}