'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeNames: { [key: string]: string } = {
    '/dashboard': 'داشبورد',
    '/dashboard/customers': 'مشتریان',
    '/dashboard/contacts': 'مخاطبین',
    '/dashboard/coworkers': 'همکاران',
    '/dashboard/activities': 'فعالیت‌ها',
    '/dashboard/interactions': 'تعاملات',
    '/dashboard/interactions/chat': 'چت',
    '/dashboard/deals': 'معاملات',
    '/dashboard/feedback': 'بازخوردها',
    '/dashboard/reports': 'گزارش‌ها',
    '/dashboard/daily-reports': 'گزارش‌های روزانه',
    '/dashboard/calendar': 'تقویم',
    '/dashboard/profile': 'پروفایل',
    '/dashboard/settings': 'تنظیمات',
    '/dashboard/projects': 'پروژه‌ها و محصولات',
    '/dashboard/projects/products': 'محصولات',
};

export function Breadcrumb() {
    const pathname = usePathname();

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        return {
            name: routeNames[path] || segment,
            path,
            isLast: index === pathSegments.length - 1,
        };
    });

    if (pathname === '/dashboard') {
        return null; // Don't show breadcrumb on dashboard home
    }

    return (
        <nav className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground mb-6">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-primary transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.path} className="flex items-center space-x-2 space-x-reverse">
                    <ChevronLeft className="h-4 w-4" />
                    {breadcrumb.isLast ? (
                        <span className="font-medium text-foreground font-vazir">
                            {breadcrumb.name}
                        </span>
                    ) : (
                        <Link
                            href={breadcrumb.path}
                            className="hover:text-primary transition-colors font-vazir"
                        >
                            {breadcrumb.name}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}