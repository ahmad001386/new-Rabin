import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockInsightsData } from '@/lib/mock-data';

const impactColors = {
    high: "text-red-500 bg-red-50",
    medium: "text-yellow-500 bg-yellow-50",
    low: "text-green-500 bg-green-50"
};

const statusColors = {
    new: "bg-blue-50 text-blue-500",
    in_progress: "bg-yellow-50 text-yellow-500",
    completed: "bg-green-50 text-green-500"
};

export default function InsightsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">بینش‌های تجربه مشتری</h1>
                    <p className="text-muted-foreground">
                        پیشنهادات و بینش‌های استخراج شده از تحلیل داده‌های مشتریان
                    </p>
                </div>
                <Button>فیلتر نتایج</Button>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {mockInsightsData.map(insight => (
                    <Card key={insight.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium">{insight.title}</h3>
                                    <Badge
                                        className={impactColors[insight.impact as keyof typeof impactColors]}
                                    >
                                        {insight.impact === 'high' ? 'تاثیر بالا' :
                                            insight.impact === 'medium' ? 'تاثیر متوسط' : 'تاثیر کم'}
                                    </Badge>
                                    <Badge
                                        className={statusColors[insight.status as keyof typeof statusColors]}
                                    >
                                        {insight.status === 'new' ? 'جدید' :
                                            insight.status === 'in_progress' ? 'در حال بررسی' : 'تکمیل شده'}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground">{insight.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">ایجاد فعالیت</Button>
                                <Button variant="outline" size="sm">ارجاع</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">دسته‌بندی:</span>
                                <span className="mr-2">{insight.category}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">منبع:</span>
                                <span className="mr-2">{insight.source}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">تاریخ:</span>
                                <span className="mr-2">{insight.date}</span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">پیشنهاد اقدام:</h4>
                            <p className="text-muted-foreground">{insight.suggestion}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}