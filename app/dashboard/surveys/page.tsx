'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { mockSurveysData } from '@/lib/mock-data';

export default function SurveysPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredSurveys = mockSurveysData.filter(survey => {
        const matchesSearch = survey.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
        const matchesType = typeFilter === 'all' || survey.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">نظرسنجی‌ها</h1>
                <Link href="/dashboard/surveys/new">
                    <Button>ایجاد نظرسنجی جدید</Button>
                </Link>
            </div>

            <div className="flex gap-4 mb-6">
                <Input
                    placeholder="جستجو در نظرسنجی‌ها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="draft">پیش‌نویس</SelectItem>
                        <SelectItem value="completed">تکمیل شده</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="فیلتر بر اساس نوع" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">همه انواع</SelectItem>
                        <SelectItem value="CSAT">CSAT</SelectItem>
                        <SelectItem value="Product">محصول</SelectItem>
                        <SelectItem value="Employee">کارکنان</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4">
                {filteredSurveys.map((survey) => (
                    <Card key={survey.id} className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">{survey.title}</h2>
                                <div className="flex gap-2 mb-4">
                                    <Badge variant="secondary">{survey.type}</Badge>
                                    <Badge
                                        variant={
                                            survey.status === 'active'
                                                ? 'default'
                                                : survey.status === 'draft'
                                                    ? 'secondary'
                                                    : 'outline'
                                        }
                                    >
                                        {survey.status === 'active' ? 'فعال' :
                                            survey.status === 'draft' ? 'پیش‌نویس' : 'تکمیل شده'}
                                    </Badge>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>تاریخ ایجاد: {survey.createdAt}</p>
                                    <p>تعداد پاسخ‌ها: {survey.responses}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/dashboard/surveys/${survey.id}`}>
                                    <Button variant="outline">مشاهده نتایج</Button>
                                </Link>
                                <Link href={`/dashboard/surveys/${survey.id}/edit`}>
                                    <Button>ویرایش</Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}