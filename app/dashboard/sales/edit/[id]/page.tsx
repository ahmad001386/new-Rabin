'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    Save,
    Package
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    base_price: number;
    currency: string;
}

interface SaleItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    total_price: number;
}

interface SaleData {
    id: string;
    deal_id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    payment_method: string;
    delivery_date: string;
    payment_due_date: string;
    notes: string;
    invoice_number: string;
    items: SaleItem[];
}

export default function EditSalePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saleData, setSaleData] = useState<SaleData | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const saleId = params.id as string;

    // Utility function to get auth token
    const getAuthToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
    };

    useEffect(() => {
        fetchSaleData();
        fetchProducts();
    }, [saleId]);

    const fetchSaleData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const response = await fetch(`/api/sales?sale_id=${saleId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();
            if (data.success && data.data.sales.length > 0) {
                const sale = data.data.sales[0];
                setSaleData({
                    id: sale.id,
                    deal_id: sale.deal_id,
                    customer_id: sale.customer_id,
                    customer_name: sale.customer_name,
                    total_amount: sale.total_amount,
                    currency: sale.currency,
                    payment_status: sale.payment_status,
                    payment_method: sale.payment_method || '',
                    delivery_date: sale.delivery_date ? sale.delivery_date.split('T')[0] : '',
                    payment_due_date: sale.payment_due_date ? sale.payment_due_date.split('T')[0] : '',
                    notes: sale.notes || '',
                    invoice_number: sale.invoice_number || '',
                    items: sale.items || []
                });
            } else {
                toast({
                    title: "خطا",
                    description: "فروش یافت نشد",
                    variant: "destructive"
                });
                router.push('/dashboard/sales');
            }
        } catch (error) {
            console.error('Error fetching sale:', error);
            toast({
                title: "خطا",
                description: "خطا در بارگذاری اطلاعات فروش",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/products?is_active=true', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSubmit = async () => {
        if (!saleData) return;

        // Validation
        if (!saleData.total_amount || saleData.items.length === 0) {
            toast({
                title: "خطا",
                description: "لطفاً تمام فیلدهای اجباری را پر کنید",
                variant: "destructive"
            });
            return;
        }

        try {
            setSaving(true);
            const token = getAuthToken();

            const response = await fetch('/api/sales', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    sale_id: saleData.id,
                    total_amount: saleData.total_amount,
                    currency: saleData.currency,
                    payment_status: saleData.payment_status,
                    payment_method: saleData.payment_method,
                    delivery_date: saleData.delivery_date,
                    payment_due_date: saleData.payment_due_date,
                    notes: saleData.notes,
                    invoice_number: saleData.invoice_number,
                    items: saleData.items
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "فروش با موفقیت ویرایش شد"
                });
                router.push('/dashboard/sales');
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ویرایش فروش",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating sale:', error);
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
        if (!saleData) return;

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
        if (!saleData) return;

        const updatedItems = [...saleData.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // Calculate total price
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
            const item = updatedItems[index];
            const subtotal = item.quantity * item.unit_price;
            const discount = subtotal * (item.discount_percentage / 100);
            item.total_price = subtotal - discount;
        }

        // Update total amount
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

        setSaleData({
            ...saleData,
            items: updatedItems,
            total_amount: totalAmount
        });
    };

    const removeSaleItem = (index: number) => {
        if (!saleData) return;

        const updatedItems = saleData.items.filter((_, i) => i !== index);
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

        setSaleData({
            ...saleData,
            items: updatedItems,
            total_amount: totalAmount
        });
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

    if (!saleData) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground font-vazir">فروش یافت نشد</p>
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
                        <h1 className="text-3xl font-bold font-vazir">ویرایش فروش</h1>
                        <p className="text-muted-foreground font-vazir">
                            ویرایش فروش {saleData.customer_name}
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
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-vazir">وضعیت پرداخت</Label>
                            <Select
                                value={saleData.payment_status}
                                onValueChange={(value) => setSaleData({ ...saleData, payment_status: value })}
                            >
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
                                    برای ویرایش فروش، حداقل یک محصول انتخاب کنید
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
                                    {formatCurrency(saleData.total_amount, saleData.currency)}
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
                            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            <Save className="h-4 w-4 mr-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}