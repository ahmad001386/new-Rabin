'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Video
} from 'lucide-react';
import { mockCalendarEvents, mockUsers, mockCustomers } from '@/lib/mock-data';

export default function CalendarPage() {
  const [events, setEvents] = useState(mockCalendarEvents);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'meeting',
    customerId: '',
    assignedTo: '',
    location: ''
  });

  const handleAddEvent = () => {
    const event = {
      id: (events.length + 1).toString(),
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      type: newEvent.type as 'meeting' | 'call' | 'task',
      customerId: newEvent.customerId,
      customerName: mockCustomers.find(c => c.id === newEvent.customerId)?.name || '',
      assignedTo: newEvent.assignedTo,
      status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
      location: newEvent.location
    };

    setEvents([event, ...events]);
    setShowAddEvent(false);
    setNewEvent({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: 'meeting',
      customerId: '',
      assignedTo: '',
      location: ''
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'call': return <Video className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'call': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'جلسه';
      case 'call': return 'تماس';
      default: return 'رویداد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'برنامه‌ریزی شده';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'نامشخص';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            تقویم رویدادها
          </h1>
          <p className="text-muted-foreground font-vazir mt-2">
            مدیریت جلسات، تماس‌ها و رویدادهای شما
          </p>
        </div>

        <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
          <DialogTrigger asChild>
            <Button className="font-vazir">
              <Plus className="h-4 w-4 ml-2" />
              رویداد جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-vazir">ایجاد رویداد جدید</DialogTitle>
              <DialogDescription className="font-vazir">
                اطلاعات رویداد را وارد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">عنوان</label>
                  <Input
                    placeholder="عنوان رویداد"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="font-vazir"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">نوع</label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger className="font-vazir">
                      <SelectValue placeholder="نوع رویداد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting" className="font-vazir">جلسه</SelectItem>
                      <SelectItem value="call" className="font-vazir">تماس</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium font-vazir">توضیحات</label>
                <Textarea
                  placeholder="توضیحات رویداد"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="font-vazir"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">تاریخ شروع</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="font-vazir"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">تاریخ پایان</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="font-vazir"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">مشتری</label>
                  <Select
                    value={newEvent.customerId}
                    onValueChange={(value) => setNewEvent({ ...newEvent, customerId: value })}
                  >
                    <SelectTrigger className="font-vazir">
                      <SelectValue placeholder="انتخاب مشتری" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id} className="font-vazir">
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium font-vazir">مسئول</label>
                  <Select
                    value={newEvent.assignedTo}
                    onValueChange={(value) => setNewEvent({ ...newEvent, assignedTo: value })}
                  >
                    <SelectTrigger className="font-vazir">
                      <SelectValue placeholder="انتخاب مسئول" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map(user => (
                        <SelectItem key={user.id} value={user.id} className="font-vazir">
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium font-vazir">مکان</label>
                <Input
                  placeholder="مکان برگزاری"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="font-vazir"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEvent(false)}
                  className="font-vazir"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleAddEvent}
                  disabled={!newEvent.title || !newEvent.startDate || !newEvent.endDate}
                  className="font-vazir bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  ایجاد رویداد
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              رویدادهای امروز
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {events.filter(event => {
                const today = new Date().toDateString();
                return new Date(event.startDate).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              جلسات این هفته
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {events.filter(event => event.type === 'meeting').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              تماس‌های برنامه‌ریزی شده
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {events.filter(event => event.type === 'call').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="border-border/50 hover:border-primary/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 space-x-reverse mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getEventTypeIcon(event.type)}
                      <h3 className="text-lg font-semibold font-vazir">{event.title}</h3>
                    </div>
                    <Badge variant="outline" className={`${getEventTypeColor(event.type)} font-vazir`}>
                      {getEventTypeLabel(event.type)}
                    </Badge>
                    <Badge variant="outline" className={`${getStatusColor(event.status)} font-vazir`}>
                      {getStatusLabel(event.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-vazir mb-4">{event.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-vazir">
                        {new Date(event.startDate).toLocaleDateString('fa-IR')} - {new Date(event.startDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-vazir">{event.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="font-vazir bg-primary/10 text-primary text-xs">
                          {getUserName(event.assignedTo).split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-vazir">{getUserName(event.assignedTo)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="font-vazir">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}