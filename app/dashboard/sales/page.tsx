'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockOpportunities } from '@/lib/mock-data';
import { Opportunity } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import {
  Plus, DollarSign, TrendingUp, Target, Calendar, Receipt, ShoppingCart,
  Search, Package, User, CheckCircle, Clock, AlertTriangle, Eye, Edit,
  Trash2, Filter
} from 'lucide-react';

interface Sale {
  id: string;
  deal_id: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method?: string;
  sale_date: string;
  delivery_date?: string;
  payment_due_date?: string;
  notes?: string;
  invoice_number?: string;
  sales_person_id: string;
  sales_person_name: string;
  deal_title?: string;
  items?: SaleItem[];
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  currency: string;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Deal {
  id: string;
  title: string;
  customer_id: string;
  customer_name: string;
  total_value: number;
  stage_name: string;
}

export default function SalesPage() {
  const [opportunities] = useState<Opportunity[]>(mockOpportunities);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSale, setNewSale] = useState({
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
    items: [] as any[]
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
    fetchProducts();
    fetchCustomers();
    fetchDeals();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, statusFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (statusFilter && statusFilter !== 'all') params.append('payment_status', statusFilter);

      const response = await fetch(`/api/sales?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSales(data.data.sales || []);
        console.log('✅ Sales loaded successfully:', data.data.sales?.length || 0);
      } else {
        toast({
          title: "خطا در بارگذاری",
          description: data.message || "خطا در دریافت اطلاعات فروش‌ها",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
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
          'Content-Type': 'application/json',
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

  const fetchCustomers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/deals', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleAddSale = async () => {
    // Validation
    if (!newSale.deal_id || !newSale.customer_id || !newSale.total_amount) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای اجباری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    if (newSale.items.length === 0) {
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
          ...newSale,
          total_amount: parseFloat(newSale.total_amount)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "موفق",
          description: "فروش با موفقیت ثبت شد"
        });
        setOpen(false);
        resetNewSale();
        fetchSales();
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در ثبت فروش",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetNewSale = () => {
    setNewSale({
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
      items: []
    });
  };

  const addSaleItem = () => {
    setNewSale({
      ...newSale,
      items: [...newSale.items, {
        product_id: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        total_price: 0
      }]
    });
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newSale.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price for the item
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unit_price;
      const discount = subtotal * (item.discount_percentage / 100);
      item.total_price = subtotal - discount;
    }

    setNewSale({ ...newSale, items: updatedItems });

    // Update total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setNewSale(prev => ({ ...prev, total_amount: totalAmount.toString() }));
  };

  const removeSaleItem = (index: number) => {
    const updatedItems = newSale.items.filter((_, i) => i !== index);
    setNewSale({ ...newSale, items: updatedItems });

    // Update total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setNewSale(prev => ({ ...prev, total_amount: totalAmount.toString() }));
  };

  const formatCurrency = (amount: number, currency: string = 'IRR') => {
    if (currency === 'IRR') {
      if (amount >= 1000000000) {
        // میلیارد تومان
        return `${(amount / 1000000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد تومان`;
      } else if (amount >= 1000000) {
        // میلیون تومان
        return `${(amount / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون تومان`;
      } else if (amount >= 1000) {
        // هزار تومان
        return `${(amount / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} هزار تومان`;
      } else {
        // تومان
        return `${amount.toLocaleString('fa-IR')} تومان`;
      }
    }
    return `${amount.toLocaleString('fa-IR')} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'partial': return 'پرداخت جزئی';
      case 'paid': return 'پرداخت شده';
      case 'refunded': return 'بازگشت داده شده';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'partial': return 'secondary';
      case 'paid': return 'default';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sales_person_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-vazir mt-4">در حال بارگذاری فروش‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-vazir">مدیریت فروش</h1>
          <p className="text-muted-foreground font-vazir">
            ثبت و مدیریت فروش‌های انجام شده
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
              <Plus className="h-4 w-4 ml-2" />
              ثبت فروش جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-vazir">ثبت فروش جدید</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* اطلاعات کلی */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-vazir">معامله *</Label>
                  <Select value={newSale.deal_id} onValueChange={(value) => {
                    setNewSale({ ...newSale, deal_id: value });
                    const selectedDeal = deals.find(d => d.id === value);
                    if (selectedDeal) {
                      setNewSale(prev => ({ ...prev, customer_id: selectedDeal.customer_id }));
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
                  <Select value={newSale.customer_id} onValueChange={(value) => setNewSale({ ...newSale, customer_id: value })}>
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
                  <Select value={newSale.payment_status} onValueChange={(value) => setNewSale({ ...newSale, payment_status: value })}>
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
                    value={newSale.payment_method}
                    onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                    placeholder="نقد، چک، کارت، ..."
                    className="font-vazir"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-vazir">شماره فاکتور</Label>
                  <Input
                    value={newSale.invoice_number}
                    onChange={(e) => setNewSale({ ...newSale, invoice_number: e.target.value })}
                    placeholder="شماره فاکتور"
                    className="font-vazir"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-vazir">تاریخ تحویل</Label>
                  <Input
                    type="date"
                    value={newSale.delivery_date}
                    onChange={(e) => setNewSale({ ...newSale, delivery_date: e.target.value })}
                    className="font-vazir"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-vazir">مهلت پرداخت</Label>
                  <Input
                    type="date"
                    value={newSale.payment_due_date}
                    onChange={(e) => setNewSale({ ...newSale, payment_due_date: e.target.value })}
                    className="font-vazir"
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

                {newSale.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-6 gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="font-vazir">محصول</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => {
                            updateSaleItem(index, 'product_id', value);
                            const product = products.find(p => p.id === value);
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
                                {product.name} - {formatCurrency(product.base_price)}
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
                        <div className="text-lg font-bold font-vazir">
                          {formatCurrency(item.total_price)}
                        </div>
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
              </div>

              {/* مجموع کل */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium font-vazir">مجموع کل:</span>
                  <span className="text-2xl font-bold text-primary font-vazir">
                    {formatCurrency(parseFloat(newSale.total_amount) || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-vazir">یادداشت</Label>
                <Textarea
                  value={newSale.notes}
                  onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                  placeholder="یادداشت‌های اضافی"
                  className="font-vazir"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setOpen(false)} className="font-vazir">
                انصراف
              </Button>
              <Button onClick={handleAddSale} disabled={saving} className="font-vazir">
                {saving ? 'در حال ذخیره...' : 'ثبت فروش'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کل فروش‌ها</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{sales.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">مجموع درآمد</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600 font-vazir">
              {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0))}
            </div>
            {filteredSales.length !== sales.length && (
              <div className="text-xs text-muted-foreground font-vazir mt-1">
                از کل: {formatCurrency(sales.reduce((sum, sale) => sum + sale.total_amount, 0))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">پرداخت شده</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-vazir">
              {sales.filter(s => s.payment_status === 'paid').length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">در انتظار</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 font-vazir">
              {sales.filter(s => s.payment_status === 'pending').length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها و جستجو */}
      <Card>
        <CardHeader>
          <CardTitle className="font-vazir">فیلتر و جستجو</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در فروش‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 font-vazir"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="font-vazir">
                  <SelectValue placeholder="وضعیت پرداخت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-vazir">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="pending" className="font-vazir">در انتظار</SelectItem>
                  <SelectItem value="partial" className="font-vazir">پرداخت جزئی</SelectItem>
                  <SelectItem value="paid" className="font-vazir">پرداخت شده</SelectItem>
                  <SelectItem value="refunded" className="font-vazir">بازگشت داده شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <PersianDatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="از تاریخ"
              />
            </div>
            <div>
              <PersianDatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="تا تاریخ"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
                setSearchTerm('');
                fetchSales();
              }}
              className="font-vazir"
            >
              <Filter className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* لیست فروش‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="font-vazir">لیست فروش‌ها ({filteredSales.length.toLocaleString('fa-IR')})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <h3 className="text-lg font-medium font-vazir">{sale.customer_name}</h3>
                        <Badge variant={getStatusColor(sale.payment_status)} className="font-vazir">
                          {getStatusLabel(sale.payment_status)}
                        </Badge>
                        {sale.invoice_number && (
                          <span className="text-sm text-muted-foreground font-vazir">
                            فاکتور: {sale.invoice_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 space-x-reverse text-sm text-muted-foreground">
                        <span className="font-vazir">فروشنده: {sale.sales_person_name}</span>
                        <span className="font-vazir">تاریخ: {formatDate(sale.sale_date)}</span>
                        {sale.payment_method && (
                          <span className="font-vazir">روش پرداخت: {sale.payment_method}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left space-y-2">
                      <div className="text-2xl font-bold text-primary font-vazir">
                        {formatCurrency(sale.total_amount, sale.currency)}
                      </div>
                      {sale.deal_title && (
                        <div className="text-sm text-muted-foreground font-vazir">
                          معامله: {sale.deal_title}
                        </div>
                      )}
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/sales/edit/${sale.id}`)}
                          className="font-vazir"
                        >
                          <Edit className="h-4 w-4 ml-1" />
                          ویرایش
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/sales/view/${sale.id}`)}
                          className="font-vazir"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          جزئیات
                        </Button>
                      </div>
                    </div>
                  </div>

                  {sale.items && sale.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium font-vazir mb-2">محصولات:</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-vazir">
                              {item.product_name} × {item.quantity.toLocaleString('fa-IR')}
                            </span>
                            <span className="font-vazir">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium font-vazir mb-2">فروشی یافت نشد</h3>
              <p className="text-muted-foreground font-vazir mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'فروشی با این فیلترها یافت نشد'
                  : 'هنوز فروشی ثبت نشده است'
                }
              </p>
              <Button onClick={() => setOpen(true)} className="font-vazir">
                <Plus className="h-4 w-4 ml-2" />
                ثبت اولین فروش
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Opportunities */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="font-vazir">فروش‌ها</TabsTrigger>
          <TabsTrigger value="opportunities" className="font-vazir">فرصت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {/* Sales content is already shown above */}
        </TabsContent>

        <TabsContent value="opportunities">
          <Button
            onClick={() => router.push('/dashboard/sales/opportunities')}
            className="w-full font-vazir"
          >
            مشاهده فرصت‌های فروش
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}