/**
 * Persian Date Utilities
 * توابع کمکی برای کار با تاریخ فارسی
 */

// Persian months names
const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian weekday names
const persianWeekdays = [
    'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

/**
 * Convert Gregorian date to Persian date string
 * تبدیل تاریخ میلادی به فارسی
 */
export function toPersianDate(date: Date): string {
    try {
        const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);

        // Ensure consistent format: YYYY/MM/DD in Persian numerals
        return persianDate;
    } catch (error) {
        console.error('Error converting to Persian date:', error);
        // Fallback to basic Persian date
        return date.toLocaleDateString('fa-IR');
    }
}

/**
 * Convert Gregorian date to Persian date with month name
 * تبدیل تاریخ میلادی به فارسی با نام ماه
 */
export function toPersianDateWithMonthName(date: Date): string {
    try {
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);

        return persianDate;
    } catch (error) {
        console.error('Error converting to Persian date with month name:', error);
        return date.toLocaleDateString('fa-IR');
    }
}

/**
 * Get Persian weekday name
 * دریافت نام روز هفته به فارسی
 */
export function getPersianWeekday(date: Date): string {
    const dayIndex = date.getDay();
    return persianWeekdays[dayIndex];
}

/**
 * Format date for database storage (YYYY-MM-DD)
 * فرمت کردن تاریخ برای ذخیره در دیتابیس
 */
export function formatDateForDB(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Parse Persian date string to Gregorian date
 * تبدیل تاریخ فارسی به میلادی
 */
export function parsePersianDate(persianDateStr: string): Date | null {
    try {
        // This is a simple implementation
        // For production, consider using a library like moment-jalaali
        const parts = persianDateStr.split('/');
        if (parts.length !== 3) return null;

        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const day = parseInt(parts[2]);

        // Convert Persian to Gregorian (approximate)
        // This is a simplified conversion - for accurate conversion use a proper library
        const gregorianYear = year + 622;
        return new Date(gregorianYear, month, day);
    } catch (error) {
        console.error('Error parsing Persian date:', error);
        return null;
    }
}

/**
 * Get today's date in Persian format
 * دریافت تاریخ امروز به فارسی
 */
export function getTodayPersian(): string {
    return toPersianDate(new Date());
}

/**
 * Get current Persian date and time
 * دریافت تاریخ و زمان فعلی به فارسی
 */
export function getCurrentPersianDateTime(): string {
    const now = new Date();
    const date = toPersianDate(now);
    const time = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return `${date} - ${time}`;
}

/**
 * Check if a date is today
 * بررسی اینکه آیا یک تاریخ امروز is
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return formatDateForDB(date) === formatDateForDB(today);
}

/**
 * Get date range for Persian calendar
 * دریافت بازه تاریخ برای تقویم فارسی
 */
export function getDateRange(startDate: Date, endDate: Date): string {
    const start = toPersianDate(startDate);
    const end = toPersianDate(endDate);

    if (start === end) {
        return start;
    }

    return `${start} تا ${end}`;
}

/**
 * Convert time to Persian numerals
 * تبدیل زمان به اعداد فارسی
 */
export function toPersianTime(date: Date): string {
    return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get relative time in Persian
 * دریافت زمان نسبی به فارسی
 */
export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return 'هم اکنون';
    } else if (diffMins < 60) {
        return `${diffMins} دقیقه پیش`;
    } else if (diffHours < 24) {
        return `${diffHours} ساعت پیش`;
    } else if (diffDays < 7) {
        return `${diffDays} روز پیش`;
    } else {
        return toPersianDate(date);
    }
}