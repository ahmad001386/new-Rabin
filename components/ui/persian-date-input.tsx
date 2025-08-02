'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import moment from 'moment-jalaali';

interface PersianDateInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
}

export function PersianDateInput({ label, value, onChange, id, className }: PersianDateInputProps) {
    const [persianValue, setPersianValue] = useState('');

    useEffect(() => {
        if (value) {
            // Convert Gregorian to Persian
            const persianDate = moment(value).format('jYYYY/jMM/jDD');
            setPersianValue(persianDate);
        }
    }, [value]);

    const handlePersianChange = (persianDate: string) => {
        setPersianValue(persianDate);

        // Try to convert Persian to Gregorian
        try {
            // Parse Persian date
            const parts = persianDate.split('/');
            if (parts.length === 3) {
                const jYear = parseInt(parts[0]);
                const jMonth = parseInt(parts[1]);
                const jDay = parseInt(parts[2]);

                if (jYear && jMonth && jDay && jMonth <= 12 && jDay <= 31) {
                    const gregorianDate = moment(`${jYear}/${jMonth}/${jDay}`, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
                    onChange(gregorianDate);
                }
            }
        } catch (error) {
            // Invalid date, don't update
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type="text"
                    value={persianValue}
                    onChange={(e) => handlePersianChange(e.target.value)}
                    placeholder="۱۴۰۳/۰۱/۰۱"
                    className={className}
                    dir="ltr"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {value && moment(value).format('YYYY-MM-DD')}
                </div>
            </div>
        </div>
    );
}