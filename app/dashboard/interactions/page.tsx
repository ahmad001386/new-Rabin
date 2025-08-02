'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockInteractions } from '@/lib/mock-data';
import { Interaction } from '@/lib/types';
import { Plus, MessageCircle, Phone, Mail, Calendar } from 'lucide-react';

export default function InteractionsPage() {
  const [interactions] = useState<Interaction[]>(mockInteractions);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'meeting': return Calendar;
      default: return MessageCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'phone': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'ایمیل';
      case 'phone': return 'تلفن';
      case 'meeting': return 'جلسه';
      case 'chat': return 'چت';
      default: return type;
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'نوع',
      sortable: true,
      render: (value: string) => {
        const Icon = getTypeIcon(value);
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Icon className="h-4 w-4" />
            <Badge className={`${getTypeColor(value)} font-vazir`}>{getTypeLabel(value)}</Badge>
          </div>
        );
      },
    },
    {
      key: 'subject',
      label: 'موضوع',
      sortable: true,
      render: (value: string, row: Interaction) => (
        <div>
          <p className="font-medium font-vazir">{value}</p>
          <p className="text-sm text-muted-foreground font-vazir">{row.customerName}</p>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'توضیحات',
      render: (value: string) => (
        <div className="max-w-xs truncate font-vazir" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'مدت زمان',
      sortable: true,
      render: (value: number) => value ? (
        <span className="font-vazir">{value.toLocaleString('fa-IR')} دقیقه</span>
      ) : 'ندارد',
    },
    {
      key: 'outcome',
      label: 'نتیجه',
      render: (value: string) => (
        <Badge variant={value === 'مثبت' || value === 'Positive' ? 'default' : 'secondary'} className="font-vazir">
          {value === 'Positive' ? 'مثبت' : 
           value === 'Resolved' ? 'حل شده' : 
           value === 'تحویل شده' ? 'تحویل شده' : value || 'ندارد'}
        </Badge>
      ),
    },
    {
      key: 'date',
      label: 'تاریخ',
      sortable: true,
      render: (value: string) => (
        <span className="font-vazir">{new Date(value).toLocaleDateString('fa-IR')}</span>
      ),
    },
  ];

  const handleEditInteraction = (interaction: Interaction) => {
    console.log('ویرایش تعامل:', interaction);
  };

  const handleDeleteInteraction = (interaction: Interaction) => {
    console.log('حذف تعامل:', interaction);
  };

  const emailInteractions = interactions.filter(i => i.type === 'email');
  const phoneInteractions = interactions.filter(i => i.type === 'phone');
  const meetingInteractions = interactions.filter(i => i.type === 'meeting');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            تعاملات مشتریان
          </h1>
          <p className="text-muted-foreground font-vazir mt-2">پیگیری همه ارتباطات و نقاط تماس مشتریان</p>
        </div>
        <Button className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
          <Plus className="h-4 w-4 ml-2" />
          ثبت تعامل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">کل تعاملات</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{interactions.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 hover:border-blue-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">ایمیل‌ها</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{emailInteractions.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 hover:border-green-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">تماس‌های تلفنی</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{phoneInteractions.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 hover:border-purple-400 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">جلسات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{meetingInteractions.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Interactions Timeline */}
      <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-vazir">تعاملات اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interactions.map((interaction) => {
              const Icon = getTypeIcon(interaction.type);
              return (
                <div key={interaction.id} className="flex items-start space-x-4 space-x-reverse p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-all duration-300">
                  <div className={`p-2 rounded-full ${getTypeColor(interaction.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium font-vazir">{interaction.subject}</h4>
                      <span className="text-sm text-muted-foreground font-vazir">
                        {new Date(interaction.date).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 font-vazir">{interaction.customerName}</p>
                    <p className="text-sm mt-2 font-vazir">{interaction.description}</p>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      {interaction.duration && (
                        <span className="text-xs text-muted-foreground font-vazir">
                          مدت زمان: {interaction.duration.toLocaleString('fa-IR')} دقیقه
                        </span>
                      )}
                      {interaction.outcome && (
                        <Badge variant="secondary" className="text-xs font-vazir">
                          {interaction.outcome === 'Positive' ? 'مثبت' : 
                           interaction.outcome === 'Resolved' ? 'حل شده' : 
                           interaction.outcome === 'تحویل شده' ? 'تحویل شده' : interaction.outcome}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interactions Table */}
      <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-vazir">همه تعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={interactions}
            columns={columns}
            onEdit={handleEditInteraction}
            onDelete={handleDeleteInteraction}
          />
        </CardContent>
      </Card>
    </div>
  );
}