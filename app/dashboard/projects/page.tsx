import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ChevronLeft, Tags, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Sample product data - replace with your actual data source
const products = [
  {
    id: 1,
    name: 'CRM Pro Suite',
    version: '2.1.0',
    description: 'سیستم مدیریت ارتباط با مشتری حرفه‌ای با قابلیت‌های پیشرفته',
    company: 'Tech Solutions',
    imageUrl: '/images/products/crm-pro.jpg',
    customers: 45,
    category: 'نرم‌افزار سازمانی',
    price: '۱۲,۰۰۰,۰۰۰ تومان',
  },
  {
    id: 2,
    name: 'Analytics Plus',
    version: '3.0',
    description: 'پلتفرم تحلیل داده و گزارش‌گیری هوشمند برای کسب و کار',
    company: 'Data Insight Co',
    imageUrl: '/images/products/analytics.jpg',
    customers: 32,
    category: 'تحلیل داده',
    price: '۸,۵۰۰,۰۰۰ تومان',
  },
  {
    id: 3,
    name: 'Cloud Storage Enterprise',
    version: '2023.2',
    description: 'راهکار ذخیره‌سازی ابری امن با قابلیت مقیاس‌پذیری',
    company: 'Cloud Systems',
    imageUrl: '/images/products/cloud-storage.jpg',
    customers: 28,
    category: 'زیرساخت',
    price: '۱۵,۰۰۰,۰۰۰ تومان',
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-vazir text-foreground">محصولات</h1>
        <Button variant="default" size="sm" className="font-vazir">
          <Package className="h-4 w-4 ml-2" />
          افزودن محصول جدید
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map(product => (
          <Link href={`/dashboard/products/${product.id}`} key={product.id}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border/50 hover:border-primary/50 h-full">
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                {product.imageUrl ? (
                  <div className="relative w-full h-full bg-accent/5">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-accent/5 flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-background/95 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm border border-border/50">
                  {product.version}
                </div>
              </div>

              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-vazir text-lg group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
                  <Tags className="h-3 w-3" />
                  <span>{product.category}</span>
                  <span className="mx-1">•</span>
                  <Users className="h-3 w-3" />
                  <span>{product.customers} مشتری</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-sm text-muted-foreground line-clamp-2 font-vazir">
                  {product.description}
                </CardDescription>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center text-xs text-accent">
                    <ShoppingCart className="h-3 w-3 ml-1" />
                    {product.price}
                  </div>
                  <div className="text-xs text-muted-foreground font-vazir">
                    {product.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}