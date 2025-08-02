'use client';

import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

const mockData = {
    scores: {
        csat: 4.2,
        nps: 45,
        sentimentPositive: 72,
    },
    trendData: [
        { month: 'فروردین', csat: 4.0, nps: 40 },
        { month: 'اردیبهشت', csat: 4.1, nps: 42 },
        { month: 'خرداد', csat: 4.2, nps: 45 },
    ],
    quickStats: {
        newFeedbacks: 156,
        activeSurveys: 8,
        recentAlerts: 3,
    }
};

export default function CEMOverviewPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">CEM Overview</h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">میانگین CSAT</h3>
                    <p className="text-3xl font-bold text-primary">{mockData.scores.csat}/5</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">NPS فعلی</h3>
                    <p className="text-3xl font-bold text-primary">{mockData.scores.nps}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-2">احساسات مثبت</h3>
                    <p className="text-3xl font-bold text-primary">{mockData.scores.sentimentPositive}%</p>
                </Card>
            </div>

            {/* Trend Chart - Placeholder */}
            <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">روند شاخص‌های کلیدی</h3>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">نمودار روند</p>
                        <div className="space-y-2">
                            {mockData.trendData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                    <span className="font-medium">{item.month}</span>
                                    <div className="flex gap-4">
                                        <span className="text-blue-600">CSAT: {item.csat}</span>
                                        <span className="text-green-600">NPS: {item.nps}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">بازخوردهای جدید</h3>
                    <p className="text-2xl font-bold">{mockData.quickStats.newFeedbacks}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">نظرسنجی‌های فعال</h3>
                    <p className="text-2xl font-bold">{mockData.quickStats.activeSurveys}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">هشدارهای اخیر</h3>
                    <p className="text-2xl font-bold text-destructive">{mockData.quickStats.recentAlerts}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">بازه زمانی</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2">
                            <option>30 روز گذشته</option>
                            <option>3 ماه گذشته</option>
                            <option>6 ماه گذشته</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">محصول/خدمت</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2">
                            <option>همه محصولات</option>
                            <option>محصول A</option>
                            <option>محصول B</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">کانال</label>
                        <select className="w-full mt-1 rounded-md border border-input px-3 py-2">
                            <option>همه کانال‌ها</option>
                            <option>ایمیل</option>
                            <option>تلفن</option>
                            <option>چت</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
}
