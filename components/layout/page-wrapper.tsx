'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from './breadcrumb';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
    children: ReactNode;
    title?: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
    showBreadcrumb?: boolean;
}

export function PageWrapper({
    children,
    title,
    description,
    actions,
    className,
    showBreadcrumb = true,
}: PageWrapperProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {showBreadcrumb && <Breadcrumb />}

            {(title || description || actions) && (
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        {title && (
                            <h1 className="text-3xl font-bold tracking-tight font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-muted-foreground font-vazir">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}