'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
    customerName: z.string().min(2, 'نام مشتری باید حداقل ۲ کاراکتر باشد'),
    product: z.string().min(1, 'انتخاب محصول الزامی است'),
    feedbackType: z.enum(['complaint', 'suggestion', 'praise'], {
        required_error: 'نوع بازخورد را انتخاب کنید',
    }),
    channel: z.enum(['email', 'phone', 'website', 'app'], {
        required_error: 'کانال دریافت بازخورد را انتخاب کنید',
    }),
    satisfaction: z.enum(['1', '2', '3', '4', '5'], {
        required_error: 'میزان رضایت را انتخاب کنید',
    }),
    title: z.string().min(5, 'عنوان باید حداقل ۵ کاراکتر باشد'),
    description: z.string().min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
    priority: z.enum(['low', 'medium', 'high'], {
        required_error: 'اولویت را انتخاب کنید',
    }),
});

const products = [
    { value: 'product-a', label: 'محصول الف' },
    { value: 'product-b', label: 'محصول ب' },
    { value: 'product-c', label: 'محصول ج' },
];

const feedbackTypes = [
    { value: 'complaint', label: 'شکایت', variant: 'destructive' },
    { value: 'suggestion', label: 'پیشنهاد', variant: 'default' },
    { value: 'praise', label: 'تعریف و تمجید', variant: 'success' },
];

const channels = [
    { value: 'email', label: 'ایمیل' },
    { value: 'phone', label: 'تلفن' },
    { value: 'website', label: 'وب‌سایت' },
    { value: 'app', label: 'اپلیکیشن' },
];

const priorities = [
    { value: 'low', label: 'کم', color: 'bg-green-500' },
    { value: 'medium', label: 'متوسط', color: 'bg-yellow-500' },
    { value: 'high', label: 'زیاد', color: 'bg-red-500' },
];

export default function NewFeedbackPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: '',
            product: '',
            feedbackType: undefined,
            channel: undefined,
            satisfaction: undefined,
            title: '',
            description: '',
            priority: undefined,
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // در اینجا اطلاعات به سرور ارسال می‌شود
            console.log(values);

            // شبیه‌سازی تاخیر در ارسال
            await new Promise(resolve => setTimeout(resolve, 1000));

            // پاک کردن فرم
            form.reset();

            // نمایش پیام موفقیت
            alert('بازخورد با موفقیت ثبت شد');
        } catch (error) {
            console.error(error);
            alert('خطا در ثبت بازخورد');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">ثبت بازخورد جدید</h1>
                <p className="text-muted-foreground">لطفاً فرم زیر را با دقت تکمیل کنید</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* نام مشتری */}
                            <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نام مشتری</FormLabel>
                                        <FormControl>
                                            <Input placeholder="نام مشتری را وارد کنید" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* محصول */}
                            <FormField
                                control={form.control}
                                name="product"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>محصول</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="محصول مورد نظر را انتخاب کنید" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map(product => (
                                                    <SelectItem key={product.value} value={product.value}>
                                                        {product.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* نوع بازخورد */}
                            <FormField
                                control={form.control}
                                name="feedbackType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نوع بازخورد</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="نوع بازخورد را انتخاب کنید" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {feedbackTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* کانال */}
                            <FormField
                                control={form.control}
                                name="channel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>کانال دریافت</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="کانال دریافت را انتخاب کنید" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {channels.map(channel => (
                                                    <SelectItem key={channel.value} value={channel.value}>
                                                        {channel.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* میزان رضایت */}
                            <FormField
                                control={form.control}
                                name="satisfaction"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>میزان رضایت</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="میزان رضایت را انتخاب کنید" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {[5, 4, 3, 2, 1].map(score => (
                                                    <SelectItem key={score} value={score.toString()}>
                                                        {score} ستاره
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* اولویت */}
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اولویت</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اولویت را انتخاب کنید" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {priorities.map(priority => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                                                            {priority.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* عنوان */}
                        <div className="mt-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>عنوان</FormLabel>
                                        <FormControl>
                                            <Input placeholder="عنوان بازخورد را وارد کنید" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* توضیحات */}
                        <div className="mt-6">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>توضیحات</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="توضیحات بازخورد را وارد کنید"
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => form.reset()}
                            disabled={isSubmitting}
                        >
                            پاک کردن
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'در حال ثبت...' : 'ثبت بازخورد'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
