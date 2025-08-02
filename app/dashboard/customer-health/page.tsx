import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockCustomerHealthData } from '@/lib/mock-data';

const statusColors = {
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
};

export default function CustomerHealthPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">سلامت مشتری</h1>

            {/* Overall Health Score */}
            <Card className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-lg font-medium mb-4">امتیاز کلی سلامت</h2>
                        <div className="flex items-end gap-4">
                            <div className="text-5xl font-bold text-primary">{mockCustomerHealthData.overallHealth.score}</div>
                            <div className="text-green-600 mb-2">
                                {mockCustomerHealthData.overallHealth.trend}↑
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">استفاده از محصول</h3>
                            <div className="text-2xl font-bold">{mockCustomerHealthData.overallHealth.components.usage}%</div>
                        </Card>
                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">رضایت (CSAT)</h3>
                            <div className="text-2xl font-bold">{mockCustomerHealthData.overallHealth.components.csat}%</div>
                        </Card>
                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">NPS</h3>
                            <div className="text-2xl font-bold">{mockCustomerHealthData.overallHealth.components.nps}</div>
                        </Card>
                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">تیکت‌های باز</h3>
                            <div className="text-2xl font-bold">{mockCustomerHealthData.overallHealth.components.tickets}%</div>
                        </Card>
                    </div>
                </div>
            </Card>

            {/* Customer List */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium">لیست مشتریان</h2>
                    <Button variant="outline">فیلتر</Button>
                </div>

                <div className="space-y-4">
                    {mockCustomerHealthData.customers.map(customer => (
                        <Card key={customer.id} className="p-4">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-medium">{customer.name}</h3>
                                        <Badge className={statusColors[customer.status]}>
                                            {customer.status === 'green' ? 'سلامت خوب' :
                                                customer.status === 'yellow' ? 'نیاز به توجه' : 'در خطر'}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        {customer.segments.map(segment => (
                                            <Badge key={segment} variant="outline">{segment}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-primary">{customer.healthScore}</div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground mb-1">استفاده</div>
                                    <div className="font-medium">{customer.metrics.usage}%</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">CSAT</div>
                                    <div className="font-medium">{customer.metrics.csat}%</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">NPS</div>
                                    <div className="font-medium">{customer.metrics.nps}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">تیکت‌ها</div>
                                    <div className="font-medium">{customer.metrics.tickets}%</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    آخرین تعامل: {customer.lastInteraction}
                                </div>
                                <Button variant="outline" size="sm">مشاهده جزئیات</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}