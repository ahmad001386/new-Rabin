import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockVoiceOfCustomerData } from '@/lib/mock-data';

const statusColors = {
    open: "bg-green-50 text-green-600",
    in_review: "bg-yellow-50 text-yellow-600",
    closed: "bg-gray-50 text-gray-600"
};

const priorityColors = {
    high: "bg-red-50 text-red-600",
    medium: "bg-yellow-50 text-yellow-600",
    low: "bg-blue-50 text-blue-600"
};

const typeColors = {
    request: "bg-purple-50 text-purple-600",
    complaint: "bg-orange-50 text-orange-600",
    suggestion: "bg-blue-50 text-blue-600"
};

export default function VoiceOfCustomerPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">صدای مشتری (VOC)</h1>
                    <p className="text-muted-foreground">مدیریت و پیگیری بازخوردهای کیفی مشتریان</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">فیلتر</Button>
                    <Button>موضوع جدید</Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">نوع</label>
                        <select
                            className="w-full mt-1 rounded-md border border-input px-3 py-2"
                            title="نوع"
                        >
                            <option value="all">همه</option>
                            <option value="request">درخواست</option>
                            <option value="complaint">شکایت</option>
                            <option value="suggestion">پیشنهاد</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">وضعیت</label>
                        <select
                            className="w-full mt-1 rounded-md border border-input px-3 py-2"
                            title="وضعیت"
                        >
                            <option value="all">همه</option>
                            <option value="open">باز</option>
                            <option value="in_review">در حال بررسی</option>
                            <option value="closed">بسته شده</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">اولویت</label>
                        <select
                            className="w-full mt-1 rounded-md border border-input px-3 py-2"
                            title="اولویت"
                        >
                            <option value="all">همه</option>
                            <option value="high">بالا</option>
                            <option value="medium">متوسط</option>
                            <option value="low">پایین</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* VOC Items List */}
            <div className="space-y-4">
                {mockVoiceOfCustomerData.recentFeedback.map(item => (
                    <Card key={item.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={item.sentiment === 'positive' ? 'bg-green-50 text-green-600' :
                                        item.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                                            'bg-yellow-50 text-yellow-600'}>
                                        {item.sentiment === 'positive' ? 'مثبت' :
                                            item.sentiment === 'negative' ? 'منفی' : 'خنثی'}
                                    </Badge>
                                    <Badge variant="outline">
                                        {item.category}
                                    </Badge>
                                </div>
                                <h3 className="text-lg font-medium">بازخورد از {item.customerName}</h3>
                                <p className="text-muted-foreground">{item.feedback}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {item.date}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">دسته‌بندی:</span>
                                <span className="mr-2">{item.category}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">تاریخ:</span>
                                <span className="mr-2">{item.date}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">تکرار:</span>
                                <span className="mr-2">1 بار</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">واحد مسئول:</span>
                                <span className="mr-2">{item.category}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}