'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    MessageCircle,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Search,
    FileDown,
    Plus
} from 'lucide-react';
import { mockFeedback } from '@/lib/mock-data';

const statusMap = {
    pending: { label: 'در انتظار بررسی', color: 'bg-yellow-500' },
    inProgress: { label: 'در حال بررسی', color: 'bg-blue-500' },
    completed: { label: 'تکمیل شده', color: 'bg-green-500' },
    canceled: { label: 'لغو شده', color: 'bg-red-500' },
};

const typeMap = {
    complaint: { label: 'شکایت', color: 'bg-red-100 text-red-800' },
    suggestion: { label: 'پیشنهاد', color: 'bg-blue-100 text-blue-800' },
    praise: { label: 'تعریف و تمجید', color: 'bg-green-100 text-green-800' },
    csat: { label: 'رضایت مشتری', color: 'bg-purple-100 text-purple-800' },
    nps: { label: 'NPS', color: 'bg-orange-100 text-orange-800' },
    ces: { label: 'CES', color: 'bg-teal-100 text-teal-800' },
};

const priorityMap = {
    low: { label: 'کم', color: 'bg-green-500' },
    medium: { label: 'متوسط', color: 'bg-yellow-500' },
    high: { label: 'زیاد', color: 'bg-red-500' },
};

export default function FeedbackListPage() {
    const router = useRouter();
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredFeedbacks = mockFeedback.filter(feedback => {
        const matchesSearch =
            feedback.customerName.includes(searchTerm) ||
            feedback.title?.includes(searchTerm) ||
            feedback.description?.includes(searchTerm);

        const matchesStatus = selectedStatus === 'all' || feedback.status === selectedStatus;
        const matchesType = selectedType === 'all' || feedback.type === selectedType;
        const matchesPriority = selectedPriority === 'all' || feedback.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    const pageCount = Math.ceil(filteredFeedbacks.length / itemsPerPage);
    const paginatedFeedbacks = filteredFeedbacks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">لیست بازخوردها</h1>
                    <p className="text-muted-foreground">مدیریت و پیگیری بازخوردهای دریافتی</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/feedback/new')}>
                        <Plus className="ml-2 h-4 w-4" />
                        بازخورد جدید
                    </Button>
                    <Button variant="outline">
                        <FileDown className="ml-2 h-4 w-4" />
                        خروجی اکسل
                    </Button>
                </div>
            </div>

            {/* فیلترها */}
            <Card className="p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Input
                            placeholder="جستجو..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه</SelectItem>
                            {Object.entries(statusMap).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="نوع بازخورد" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه</SelectItem>
                            {Object.entries(typeMap).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                        <SelectTrigger>
                            <SelectValue placeholder="اولویت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه</SelectItem>
                            {Object.entries(priorityMap).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* لیست بازخوردها */}
            <div className="space-y-4">
                {paginatedFeedbacks.map(feedback => (
                    <Card key={feedback.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium">{feedback.title || 'بازخورد'}</h3>
                                    <Badge variant="outline" className={typeMap[feedback.type]?.color || 'bg-gray-100 text-gray-800'}>
                                        {typeMap[feedback.type]?.label || feedback.type}
                                    </Badge>
                                    {feedback.priority && (
                                        <div className={`w-2 h-2 rounded-full ${priorityMap[feedback.priority]?.color || 'bg-gray-500'}`} />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {feedback.customerName} {feedback.product && `- ${feedback.product}`}
                                </p>
                                <p className="text-sm">{feedback.description || feedback.comment}</p>
                                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                    <span>{feedback.createdAt}</span>
                                    {feedback.channel && <span>از طریق: {feedback.channel}</span>}
                                    <div className="flex items-center">
                                        <span>امتیاز: </span>
                                        <div className="flex items-center gap-0.5 mr-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${i < feedback.score ? 'bg-yellow-400' : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="mr-1">({feedback.score}/5)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {feedback.status && (
                                    <Badge variant="outline" className={`${statusMap[feedback.status]?.color || 'bg-gray-500'} bg-opacity-10`}>
                                        {statusMap[feedback.status]?.label || feedback.status}
                                    </Badge>
                                )}
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <MessageCircle className="h-4 w-4 ml-1" />
                                    پاسخ
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* پجینیشن */}
            {pageCount > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm mx-4">
                        صفحه {currentPage} از {pageCount}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                        disabled={currentPage === pageCount}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
