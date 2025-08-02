'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import {
    ArrowRight,
    Plus,
    Trash2,
    Receipt,
    ShoppingCart,
    Package,
    DollarSign
} from 'lucide-react';

interface Customer {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    base_price: number;
    currency: string;
}

interface Deal {
    id: string;
    title: string;
    customer_id: string;
    customer_name: string;
    total_value: number;
}

interface SaleItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    total_price: number;
}

export default function RecordSalePage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saleData, setSaleData] = useState({
        deal_id: '',
        customer_id: '',
        total_amount: '',
        currency: 'IRR',
        payment_status: 'pending',
        payment_method: '',
        delivery_date: '',
        payment_due_date: '',
        notes: '',
        invoice_number: '',
        items: [] as SaleItem[]
    });
    const { toast } = useToast();
    const router = useRouter();

    // Utility function to get auth token
    const getAuthToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            // Fetch customers
            const customersResponse = await fetch('/api/customers', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });
            const customersData = await customersResponse.json();
            if (customersData.success) {
                setCustomers(customersData.customers || []);
            }

            // Fetch products
            const productsResponse = await fetch('/api/products', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });
            const productsData = await productsResponse.json();
            if (productsData.success) {
                setProducts(productsData.products || []);
            }

            // Fetch deals
            const dealsResponse = await fetch('/api/deals', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });
            const dealsData = await dealsResponse.json();
            if (dealsData.success) {
                setDeals(dealsData.deals || []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "خطا",
                description: "خطا در بارگذاری اطلاعات",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!saleData.deal_id || !saleData.customer_id || !saleData.total_amount) {
            toast({
                title: "خطا",
                description: "لطفاً تمام فیلدهای اجباری را پر کنید",
                variant: "destructive"
            });
            return;
        }

        if (saleData.items.length === 0) {
            toast({
                title: "خطا",
                description: "حداقل یک محصول باید انتخاب شود",
                variant: "destructive"
            });
            return;
        }

        try {
            setSaving(true);
            const token = getAuthToken();

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    ...saleData,
                    total_amount: parseFloat(saleData.total_amount)
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "فروش با موفقیت ثبت شد"
                });
                router.push('/dashboard/sales');
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ثبت فروش",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error recording sale:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const addSaleItem = () => {
        setSaleData({
            ...saleData,
            items: [...saleData.items, {
                product_id: '',
                quantity: 1,
                unit_price: 0,
                discount_percentage: 0,
                total_price: 0
            }]
        });
    };

    const updateSaleItem = (index: number, field: string, value: any) => {
        const updatedItems = [...saleData.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // Calculate total price
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
            const item = updatedItems[index];
            const subtotal = item.quantity * item.unit_price;
            const discount = subtotal * (item.discount_percentage / 100);
            item.total_price = subtotal - discount;
        }

        setSaleData({ ...saleData, items: updatedItems });

        // Update total amount
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
        setSaleData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
    };

    const removeSaleItem = (index: number) => {
        const updatedItems = saleData.items.filter((_, i) => i !== index);
        setSaleData({ ...saleData, items: updatedItems });

        // Update total amount
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
        setSaleData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
    };

    const formatCurrency = (amount: number, currency: string = 'IRR') => {
        if (currency === 'IRR') {
            return `${(amount / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
        }
        return `${amount.toLocaleString('fa-IR')} ${currency}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground font-vazir mt-4">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/sales')}
                        className="hover:bg-primary/10"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-vazir">ثبت فروش جدید</h1>
                        <p className="text-muted-foreground font-vazir">
                            ثبت فروش محصولات و خدمات
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-vazir">اطلاعات فروش</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* اطلاعات کلی */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-vazir">معامله *</Label>
                            <Select value={saleData.deal_id} onValueChange={(value) => {
                                setSaleData({ ...saleData, deal_id: value });
                                const selectedDeal = deals.find(d => d.id === value);
                                if (selectedDeal) {
                                    setSaleData(prev => ({
                                        ...prev,
                                        customer_id: selectedDeal.customer_id,
                                        total_amount: selectedDeal.total_value.toString()
                                    }));
                                }
                            }}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue placeholder="انتخاب معامله" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deals.map(deal => (
                                        <SelectItem key={deal.id} value={deal.id} className="font-vazir">
                                            {deal.title} - {deal.customer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">مشتری *</Label>
                            <Select value={saleData.customer_id} onValueChange={(value) => setSaleData({ ...saleData, customer_id: value })}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue placeholder="انتخاب مشتری" />
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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-vazir">وضعیت پرداخت</Label>
                            <Select value={saleData.payment_status} onValueChange={(value) => setSaleData({ ...saleData, payment_status: value })}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending" className="font-vazir">در انتظار</SelectItem>
                                    <SelectItem value="partial" className="font-vazir">پرداخت جزئی</SelectItem>
                                    <SelectItem value="paid" className="font-vazir">پرداخت شده</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">روش پرداخت</Label>
                            <Input
                                value={saleData.payment_method}
                                onChange={(e) => setSaleData({ ...saleData, payment_method: e.target.value })}
                                placeholder="نقد، چک، کارت، ..."
                                className="font-vazir"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">شماره فاکتور</Label>
                            <Input
                                value={saleData.invoice_number}
                                onChange={(e) => setSaleData({ ...saleData, invoice_number: e.target.value })}
                                placeholder="شماره فاکتور"
                                className="font-vazir"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-vazir">تاریخ تحویل</Label>
                            <PersianDatePicker
                                value={saleData.delivery_date}
                                onChange={(date) => setSaleData({ ...saleData, delivery_date: date })}
                                placeholder="انتخاب تاریخ تحویل"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">مهلت پرداخت</Label>
                            <PersianDatePicker
                                value={saleData.payment_due_date}
                                onChange={(date) => setSaleData({ ...saleData, payment_due_date: date })}
                                placeholder="انتخاب مهلت پرداخت"
                            />
                        </div>
                    </div>

                    {/* آیتم‌های فروش */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="font-vazir text-lg">آیتم‌های فروش</Label>
                            <Button type="button" onClick={addSaleItem} size="sm" className="font-vazir">
                                <Plus className="h-4 w-4 ml-2" />
                                افزودن محصول
                            </Button>
                        </div>

                        {saleData.items.map((item, index) => (
                            <Card key={index} className="p-4">
                                <div className="grid grid-cols-6 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label className="font-vazir">محصول</Label>
                                        <Select
                                            value={item.product_id}
                                            onValueChange={(value) => {
                                                const product = products.find(p => p.id === value);
                                                updateSaleItem(index, 'product_id', value);
                                                if (product) {
                                                    updateSaleItem(index, 'unit_price', product.base_price);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="font-vazir">
                                                <SelectValue placeholder="انتخاب محصول" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(product => (
                                                    <SelectItem key={product.id} value={product.id} className="font-vazir">
                                                        {product.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-vazir">تعداد</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            className="font-vazir"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-vazir">قیمت واحد</Label>
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="font-vazir"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-vazir">تخفیف (%)</Label>
                                        <Input
                                            type="number"
                                            value={item.discount_percentage}
                                            onChange={(e) => updateSaleItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                                            className="font-vazir"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-vazir">مجموع</Label>
                                        <Input
                                            value={item.total_price.toLocaleString('fa-IR')}
                                            readOnly
                                            className="font-vazir bg-muted"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeSaleItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {saleData.items.length === 0 && (
                            <Card className="p-8 text-center border-dashed">
                                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium font-vazir mb-2">محصولی انتخاب نشده</h3>
                                <p className="text-muted-foreground font-vazir mb-4">
                                    برای ثبت فروش، حداقل یک محصول انتخاب کنید
                                </p>
                                <Button onClick={addSaleItem} className="font-vazir">
                                    <Plus className="h-4 w-4 ml-2" />
                                    افزودن محصول
                                </Button>
                            </Card>
                        )}
                    </div>

                    {/* مجموع کل */}
                    {saleData.items.length > 0 && (
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium font-vazir">مجموع کل:</span>
                                <span className="text-2xl font-bold text-primary font-vazir">
                                    {formatCurrency(parseFloat(saleData.total_amount) || 0, saleData.currency)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="font-vazir">یادداشت</Label>
                        <Textarea
                            value={saleData.notes}
                            onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                            placeholder="یادداشت‌های اضافی"
                            className="font-vazir"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/sales')}
                            className="font-vazir"
                        >
                            انصراف
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || saleData.items.length === 0}
                            className="font-vazir"
                        >
                            {saving ? 'در حال ذخیره...' : 'ثبت فروش'}
                            <Receipt className="h-4 w-4 mr-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}