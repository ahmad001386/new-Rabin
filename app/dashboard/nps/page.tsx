import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import './nps.css';
import { mockNPSData } from '@/lib/mock-data';

function NPSScoreBox({ score, type }: { score: number; type: 'current' | 'target' | 'previous' }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${type === 'current' ? 'bg-primary' :
                type === 'target' ? 'bg-accent' :
                    'bg-muted'
                }`} />
            <span className="font-medium">{score}</span>
        </div>
    );
}

export default function NPSPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">امتیاز خالص مروج (NPS)</h1>
                    <p className="text-muted-foreground">معیار اندازه‌گیری وفاداری مشتریان</p>
                </div>
                <Button variant="outline">دانلود گزارش</Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">NPS فعلی</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">{mockNPSData.overview.current}</p>
                        <span className="text-sm text-green-600">
                            +{((mockNPSData.overview.current - mockNPSData.overview.previous)).toFixed(0)}
                        </span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <NPSScoreBox score={mockNPSData.overview.current} type="current" />
                        <NPSScoreBox score={mockNPSData.overview.target} type="target" />
                        <NPSScoreBox score={mockNPSData.overview.previous} type="previous" />
                    </div>
                </Card>

                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">تعداد پاسخ‌ها</h3>
                    <p className="text-3xl font-bold">{mockNPSData.overview.responses}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        <div>مروجین: {mockNPSData.overview.distribution.promoters}</div>
                        <div>خنثی: {mockNPSData.overview.distribution.passives}</div>
                        <div>منتقدین: {mockNPSData.overview.distribution.detractors}</div>
                    </div>
                </Card>

                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">بهترین محصول</h3>
                    <p className="text-3xl font-bold">
                        {Math.max(...mockNPSData.byProduct.map(p => p.score))}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mockNPSData.byProduct.find(p =>
                            p.score === Math.max(...mockNPSData.byProduct.map(p => p.score))
                        )?.product}
                    </p>
                </Card>

                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">بهترین کانال</h3>
                    <p className="text-3xl font-bold">
                        {Math.max(...mockNPSData.byChannel.map(c => c.score))}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mockNPSData.byChannel.find(c =>
                            c.score === Math.max(...mockNPSData.byChannel.map(c => c.score))
                        )?.channel}
                    </p>
                </Card>
            </div>

            {/* Distribution Chart */}
            <Card className="p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">توزیع امتیازات</h2>
                <div className="h-8 rounded-full overflow-hidden flex">
                    <div
                        className="nps-distribution-bar nps-promoters"
                        style={{ '--promoters-width': `${(mockNPSData.overview.distribution.promoters / mockNPSData.overview.responses) * 100}%` } as React.CSSProperties}
                    />
                    <div
                        className="nps-distribution-bar nps-passives"
                        style={{ '--passives-width': `${(mockNPSData.overview.distribution.passives / mockNPSData.overview.responses) * 100}%` } as React.CSSProperties}
                    />
                    <div
                        className="nps-distribution-bar nps-detractors"
                        style={{ '--detractors-width': `${(mockNPSData.overview.distribution.detractors / mockNPSData.overview.responses) * 100}%` } as React.CSSProperties}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <div className="text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>مروجین ({Math.round((mockNPSData.overview.distribution.promoters / mockNPSData.overview.responses) * 100)}%)</span>
                        </div>
                    </div>
                    <div className="text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span>خنثی ({Math.round((mockNPSData.overview.distribution.passives / mockNPSData.overview.responses) * 100)}%)</span>
                        </div>
                    </div>
                    <div className="text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>منتقدین ({Math.round((mockNPSData.overview.distribution.detractors / mockNPSData.overview.responses) * 100)}%)</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Product & Channel Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                    <h2 className="text-lg font-medium mb-4">NPS بر اساس محصول</h2>
                    <div className="space-y-4">
                        {mockNPSData.byProduct.map(item => (
                            <div key={item.product} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{item.product}</p>
                                    <p className="text-sm text-muted-foreground">{item.responses} پاسخ</p>
                                </div>
                                <div className="text-2xl font-bold">{item.score}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-medium mb-4">NPS بر اساس کانال</h2>
                    <div className="space-y-4">
                        {mockNPSData.byChannel.map(item => (
                            <div key={item.channel} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{item.channel}</p>
                                    <p className="text-sm text-muted-foreground">{item.responses} پاسخ</p>
                                </div>
                                <div className="text-2xl font-bold">{item.score}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recent Feedback */}
            <Card className="p-6">
                <h2 className="text-lg font-medium mb-4">بازخوردهای اخیر</h2>
                <div className="space-y-4">
                    {mockNPSData.recentFeedback.map(feedback => (
                        <Card key={feedback.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-medium">{feedback.customerName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feedback.date} - {feedback.channel}
                                    </p>
                                </div>
                                <Badge className={
                                    feedback.score >= 9 ? 'bg-green-50 text-green-600' :
                                        feedback.score >= 7 ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-red-50 text-red-600'
                                }>
                                    {feedback.score}/10
                                </Badge>
                            </div>
                            {feedback.comment && (
                                <p className="text-sm mt-2">{feedback.comment}</p>
                            )}
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}
