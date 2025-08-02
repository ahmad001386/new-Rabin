import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockAlerts } from '@/lib/mock-data';

const typeColors = {
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-blue-50 text-blue-600',
    error: 'bg-red-50 text-red-600',
    success: 'bg-green-50 text-green-600'
};

const priorityColors = {
    high: 'bg-red-50 text-red-600',
    medium: 'bg-yellow-50 text-yellow-600',
    low: 'bg-blue-50 text-blue-600'
};

export default function AlertsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">هشدارهای سیستم</h1>
                    <p className="text-muted-foreground">مدیریت و پیگیری هشدارها و اطلاعیه‌های سیستم</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">فیلتر</Button>
                    <Button variant="outline">نمایش همه</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">کل هشدارها</h3>
                    <p className="text-3xl font-bold">{mockAlerts.length}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">خوانده نشده</h3>
                    <p className="text-3xl font-bold text-red-600">
                        {mockAlerts.filter(alert => !alert.isRead).length}
                    </p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">اولویت بالا</h3>
                    <p className="text-3xl font-bold text-yellow-600">
                        {mockAlerts.filter(alert => alert.priority === 'high').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">امروز</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {mockAlerts.filter(alert => {
                            const today = new Date().toDateString();
                            return new Date(alert.createdAt).toDateString() === today;
                        }).length}
                    </p>
                </Card>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {mockAlerts.map(alert => (
                    <Card key={alert.id} className={`p-6 ${!alert.isRead ? 'border-primary/50' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium">{alert.title}</h3>
                                    <Badge className={typeColors[alert.type]}>
                                        {alert.type === 'warning' ? 'هشدار' :
                                            alert.type === 'info' ? 'اطلاعیه' : 'خطا'}
                                    </Badge>
                                    <Badge className={priorityColors[alert.priority]}>
                                        {alert.priority === 'high' ? 'اولویت بالا' :
                                            alert.priority === 'medium' ? 'اولویت متوسط' : 'اولویت کم'}
                                    </Badge>
                                    {!alert.isRead && (
                                        <Badge variant="outline" className="bg-primary/10 text-primary">
                                            جدید
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">{alert.message}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {new Date(alert.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                                <Button variant="outline" size="sm">
                                    مشاهده جزئیات
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}