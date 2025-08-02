'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    Plus,
    Package,
    DollarSign,
    Edit,
    Trash2,
    Eye,
    Filter,
    MoreHorizontal,
    ShoppingCart,
    Tag,
    TrendingUp,
    Archive
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    specifications?: string;
    base_price: number;
    currency: string;
    is_active: boolean;
    inventory: number;
    created_at: string;
    updated_at: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        description: '',
        specifications: '',
        base_price: '',
        currency: 'IRR',
        inventory: '999'
    });
    const [editProduct, setEditProduct] = useState({
        id: '',
        name: '',
        category: '',
        description: '',
        specifications: '',
        base_price: '',
        currency: 'IRR',
        inventory: ''
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
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success && data.products) {
                setProducts(data.products);
                console.log('✅ Products loaded successfully:', data.products.length);
            } else {
                console.log('❌ API failed. Error:', data.message);
                toast({
                    title: "خطا در بارگذاری",
                    description: data.message || "خطا در دریافت اطلاعات محصولات",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        // Validation
        if (!newProduct.name?.trim()) {
            toast({
                title: "خطا",
                description: "نام محصول الزامی است",
                variant: "destructive"
            });
            return;
        }

        if (!newProduct.category?.trim()) {
            toast({
                title: "خطا",
                description: "دسته‌بندی محصول الزامی است",
                variant: "destructive"
            });
            return;
        }

        if (!newProduct.base_price || parseFloat(newProduct.base_price) <= 0) {
            toast({
                title: "خطا",
                description: "قیمت محصول باید بیشتر از صفر باشد",
                variant: "destructive"
            });
            return;
        }

        try {
            setSaving(true);
            const token = getAuthToken();

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    ...newProduct,
                    base_price: parseFloat(newProduct.base_price),
                    inventory: parseInt(newProduct.inventory) || 999
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "محصول جدید با موفقیت اضافه شد"
                });
                setOpen(false);
                setNewProduct({
                    name: '',
                    category: '',
                    description: '',
                    specifications: '',
                    base_price: '',
                    currency: 'IRR',
                    inventory: '999'
                });
                fetchProducts();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در اضافه کردن محصول",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditProduct({
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            specifications: product.specifications || '',
            base_price: product.base_price.toString(),
            currency: product.currency,
            inventory: product.inventory.toString()
        });
        setSelectedProduct(product);
        setEditOpen(true);
    };

    const handleUpdateProduct = async () => {
        if (!editProduct.name || !editProduct.category || !editProduct.base_price) {
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

            const response = await fetch(`/api/products/${editProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    name: editProduct.name,
                    category: editProduct.category,
                    description: editProduct.description,
                    specifications: editProduct.specifications,
                    base_price: parseFloat(editProduct.base_price),
                    currency: editProduct.currency,
                    inventory: parseInt(editProduct.inventory)
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "اطلاعات محصول با موفقیت به‌روزرسانی شد"
                });
                setEditOpen(false);
                fetchProducts();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در به‌روزرسانی محصول",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            setSaving(true);
            const token = getAuthToken();

            const response = await fetch(`/api/products/${selectedProduct.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "محصول با موفقیت حذف شد"
                });
                setDeleteOpen(false);
                setSelectedProduct(null);
                fetchProducts();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در حذف محصول",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'IRR') => {
        if (currency === 'IRR') {
            return `${(amount / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
        }
        return `${amount.toLocaleString('fa-IR')} ${currency}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR');
    };

    const getUniqueCategories = () => {
        const categories = products.map(p => p.category).filter(Boolean);
        return Array.from(new Set(categories));
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground font-vazir mt-4">در حال بارگذاری محصولات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-vazir">مدیریت محصولات</h1>
                    <p className="text-muted-foreground font-vazir">
                        مدیریت کامل محصولات و خدمات شرکت
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
                            <Plus className="h-4 w-4 ml-2" />
                            افزودن محصول
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-vazir">افزودن محصول جدید</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-vazir">نام محصول *</Label>
                                    <Input
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="نام محصول را وارد کنید"
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">دسته‌بندی *</Label>
                                    <Input
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        placeholder="دسته‌بندی محصول"
                                        className="font-vazir"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">توضیحات</Label>
                                <Textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="توضیحات محصول"
                                    className="font-vazir"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">مشخصات فنی</Label>
                                <Textarea
                                    value={newProduct.specifications}
                                    onChange={(e) => setNewProduct({ ...newProduct, specifications: e.target.value })}
                                    placeholder="مشخصات فنی محصول"
                                    className="font-vazir"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-vazir">قیمت پایه *</Label>
                                    <Input
                                        type="number"
                                        value={newProduct.base_price}
                                        onChange={(e) => setNewProduct({ ...newProduct, base_price: e.target.value })}
                                        placeholder="قیمت به تومان"
                                        className="font-vazir"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">واحد پول</Label>
                                    <Select value={newProduct.currency} onValueChange={(value) => setNewProduct({ ...newProduct, currency: value })}>
                                        <SelectTrigger className="font-vazir">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IRR" className="font-vazir">تومان</SelectItem>
                                            <SelectItem value="USD" className="font-vazir">دلار</SelectItem>
                                            <SelectItem value="EUR" className="font-vazir">یورو</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-vazir">موجودی</Label>
                                    <Input
                                        type="number"
                                        value={newProduct.inventory}
                                        onChange={(e) => setNewProduct({ ...newProduct, inventory: e.target.value })}
                                        placeholder="تعداد موجودی"
                                        className="font-vazir"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 space-x-reverse">
                            <Button variant="outline" onClick={() => setOpen(false)} className="font-vazir">
                                انصراف
                            </Button>
                            <Button onClick={handleAddProduct} disabled={saving} className="font-vazir">
                                {saving ? 'در حال ذخیره...' : 'ذخیره محصول'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* آمار کلی */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">کل محصولات</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-vazir">{products.length.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>

                <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">محصولات فعال</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 font-vazir">
                            {products.filter(p => p.is_active).length.toLocaleString('fa-IR')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">دسته‌بندی‌ها</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-vazir">{getUniqueCategories().length.toLocaleString('fa-IR')}</div>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-vazir">میانگین قیمت</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold font-vazir">
                            {products.length > 0 ?
                                formatCurrency(products.reduce((sum, p) => sum + p.base_price, 0) / products.length) :
                                '۰ تومان'
                            }
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
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="جستجو در محصولات..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 font-vazir"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="font-vazir">
                                    <SelectValue placeholder="دسته‌بندی" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-vazir">همه دسته‌ها</SelectItem>
                                    {getUniqueCategories().map(category => (
                                        <SelectItem key={category} value={category} className="font-vazir">
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* لیست محصولات */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                    <Card key={product.id} className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-vazir">{product.name}</CardTitle>
                                    <Badge variant="outline" className="font-vazir">
                                        {product.category}
                                    </Badge>
                                </div>
                                <div className="flex space-x-1 space-x-reverse">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setDeleteOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground font-vazir line-clamp-2">
                                    {product.description || 'توضیحاتی ارائه نشده است'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="text-lg font-bold text-primary font-vazir">
                                        {formatCurrency(product.base_price, product.currency)}
                                    </div>
                                    <Badge variant={product.is_active ? "default" : "secondary"} className="font-vazir">
                                        {product.is_active ? 'فعال' : 'غیرفعال'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span className="font-vazir">موجودی: {product.inventory.toLocaleString('fa-IR')}</span>
                                    <span className="font-vazir">ایجاد: {formatDate(product.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium font-vazir mb-2">محصولی یافت نشد</h3>
                        <p className="text-muted-foreground font-vazir mb-4">
                            {searchTerm || categoryFilter !== 'all'
                                ? 'محصولی با این فیلترها یافت نشد'
                                : 'هنوز محصولی اضافه نشده است'
                            }
                        </p>
                        <Button onClick={() => setOpen(true)} className="font-vazir">
                            <Plus className="h-4 w-4 ml-2" />
                            افزودن اولین محصول
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Dialog ویرایش محصول */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-vazir">ویرایش محصول</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-vazir">نام محصول *</Label>
                                <Input
                                    value={editProduct.name}
                                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                                    className="font-vazir"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">دسته‌بندی *</Label>
                                <Input
                                    value={editProduct.category}
                                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                                    className="font-vazir"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">توضیحات</Label>
                            <Textarea
                                value={editProduct.description}
                                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                                className="font-vazir"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-vazir">مشخصات فنی</Label>
                            <Textarea
                                value={editProduct.specifications}
                                onChange={(e) => setEditProduct({ ...editProduct, specifications: e.target.value })}
                                className="font-vazir"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="font-vazir">قیمت پایه *</Label>
                                <Input
                                    type="number"
                                    value={editProduct.base_price}
                                    onChange={(e) => setEditProduct({ ...editProduct, base_price: e.target.value })}
                                    className="font-vazir"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">واحد پول</Label>
                                <Select value={editProduct.currency} onValueChange={(value) => setEditProduct({ ...editProduct, currency: value })}>
                                    <SelectTrigger className="font-vazir">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IRR" className="font-vazir">تومان</SelectItem>
                                        <SelectItem value="USD" className="font-vazir">دلار</SelectItem>
                                        <SelectItem value="EUR" className="font-vazir">یورو</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">موجودی</Label>
                                <Input
                                    type="number"
                                    value={editProduct.inventory}
                                    onChange={(e) => setEditProduct({ ...editProduct, inventory: e.target.value })}
                                    className="font-vazir"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button variant="outline" onClick={() => setEditOpen(false)} className="font-vazir">
                            انصراف
                        </Button>
                        <Button onClick={handleUpdateProduct} disabled={saving} className="font-vazir">
                            {saving ? 'در حال ذخیره...' : 'به‌روزرسانی'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog حذف محصول */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-vazir">حذف محصول</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="font-vazir">
                            آیا از حذف محصول "{selectedProduct?.name}" اطمینان دارید؟
                        </p>
                        <p className="text-sm text-muted-foreground font-vazir mt-2">
                            این عمل قابل بازگشت نیست.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="font-vazir">
                            انصراف
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct} disabled={saving} className="font-vazir">
                            {saving ? 'در حال حذف...' : 'حذف محصول'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}