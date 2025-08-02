'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className 
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-vazir">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-vazir mb-1">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground font-vazir mb-2">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge 
              variant={isPositiveTrend ? 'default' : isNegativeTrend ? 'destructive' : 'secondary'}
              className="flex items-center space-x-1 space-x-reverse font-vazir"
            >
              {isPositiveTrend && <TrendingUp className="h-3 w-3" />}
              {isNegativeTrend && <TrendingDown className="h-3 w-3" />}
              <span>
                {isPositiveTrend ? '+' : ''}{trend.value.toLocaleString('fa-IR')}%
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground font-vazir">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}