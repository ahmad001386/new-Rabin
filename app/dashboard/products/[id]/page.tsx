import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import Link from 'next/link';

const products = [
    {
        id: '1',
        name: 'نرم‌افزار مدیریت ارتباط با مشتری',
        description: 'سیستم جامع مدیریت ارتباط با مشتریان و فروش.',
        version: 'v2.1',
        company: 'شرکت هوشمند افزار',
    },
    {
        id: '2',
        name: 'پلتفرم نظرسنجی مشتریان',
        description: 'ابزار جمع‌آوری و تحلیل بازخورد مشتریان.',
        version: 'v1.5',
        company: 'شرکت هوشمند افزار',
    },
    {
        id: '3',
        name: 'سیستم مدیریت پروژه',
        description: 'مدیریت وظایف و پروژه‌های تیمی با امکانات پیشرفته.',
        version: 'v3.0',
        company: 'شرکت هوشمند افزار',
    },
];

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = products.find(p => p.id === id);

    if (!product) {
        return (
            <div className="max-w-xl mx-auto mt-10 animate-fade-in-up">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-vazir text-xl text-red-500">محصول یافت نشد</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/projects">
                            <Button variant="outline" className="font-vazir">بازگشت به لیست محصولات</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto mt-10 animate-fade-in-up">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-vazir text-xl flex items-center">
                        <Package className="h-5 w-5 ml-2" /> {product.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 text-muted-foreground font-vazir">{product.description}</div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-accent font-vazir">شرکت: {product.company}</span>
                        <span className="text-xs text-muted-foreground">نسخه: {product.version}</span>
                    </div>
                    <Link href="/dashboard/projects">
                        <Button variant="outline" className="font-vazir mt-6">بازگشت به لیست محصولات</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
