'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern' });

interface PersianDatePickerProps {
    value?: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
}

export function PersianDatePicker({ value, onChange, placeholder = "انتخاب تاریخ", className }: PersianDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(moment().jMonth());
    const [currentYear, setCurrentYear] = useState(moment().jYear());

    // Format Persian date for display
    const formatPersianDate = (gregorianDate: string) => {
        if (!gregorianDate) return '';
        const date = moment(gregorianDate);
        return date.format('jYYYY/jMM/jDD');
    };

    // Convert Persian date to Gregorian
    const convertToGregorian = (jYear: number, jMonth: number, jDay: number) => {
        const gregorianDate = moment(`${jYear}/${jMonth + 1}/${jDay}`, 'jYYYY/jM/jD');
        return gregorianDate.format('YYYY-MM-DD');
    };

    // Get Persian month names
    const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    // Get days in Persian month
    const getDaysInMonth = (jYear: number, jMonth: number) => {
        if (jMonth < 6) return 31;
        if (jMonth < 11) return 30;
        return moment.jIsLeapYear(jYear) ? 30 : 29;
    };

    // Get first day of month
    const getFirstDayOfMonth = (jYear: number, jMonth: number) => {
        const firstDay = moment(`${jYear}/${jMonth + 1}/1`, 'jYYYY/jM/jD');
        return firstDay.day(); // 0 = Saturday in Persian calendar
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const handleDateSelect = (day: number) => {
        const gregorianDate = convertToGregorian(currentYear, currentMonth, day);
        onChange(gregorianDate);
        setIsOpen(false);
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const isSelectedDay = (day: number) => {
        if (!value || !day) return false;
        const selectedDate = moment(value);
        return selectedDate.jYear() === currentYear &&
            selectedDate.jMonth() === currentMonth &&
            selectedDate.jDate() === day;
    };

    const isToday = (day: number) => {
        if (!day) return false;
        const today = moment();
        return today.jYear() === currentYear &&
            today.jMonth() === currentMonth &&
            today.jDate() === day;
    };

    const calendarDays = generateCalendarDays();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-right font-vazir",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {value ? formatPersianDate(value) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={prevMonth}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="font-vazir font-medium">
                            {persianMonths[currentMonth]} {currentYear}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={nextMonth}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Week days */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
                            <div key={day} className="h-8 flex items-center justify-center text-sm font-vazir text-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => (
                            <div key={index} className="h-8 flex items-center justify-center">
                                {day && (
                                    <Button
                                        variant={isSelectedDay(day) ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => handleDateSelect(day)}
                                        className={cn(
                                            "h-8 w-8 p-0 font-vazir",
                                            isToday(day) && !isSelectedDay(day) && "bg-accent",
                                            isSelectedDay(day) && "bg-primary text-primary-foreground"
                                        )}
                                    >
                                        {day}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Today button */}
                    <div className="mt-4 pt-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const today = moment();
                                setCurrentYear(today.jYear());
                                setCurrentMonth(today.jMonth());
                                handleDateSelect(today.jDate());
                            }}
                            className="w-full font-vazir"
                        >
                            امروز
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}