# راهنمای Migration به Supabase

## وضعیت فعلی
✅ پیکربندی Supabase انجام شد
✅ اتصال به Supabase برقرار است  
✅ فایل‌های کد به‌روزرسانی شدند
✅ صفحه تست ایجاد شد

## مراحل باقی‌مانده

### 1. اجرای Migration Script در Supabase Dashboard

شما باید وارد Supabase Dashboard شوید و SQL زیر را اجرا کنید:

**لینک Dashboard شما:** https://supabase.com/dashboard/project/gskpezavozdiitxffpyb

**مراحل:**
1. وارد Dashboard شوید
2. به بخش "SQL Editor" بروید  
3. محتوای فایل `/app/supabase/migrations/20250120000000_migrate_to_supabase.sql` را copy کنید
4. در SQL Editor paste کنید و "Run" کنید

### 2. بررسی نتیجه
پس از اجرای migration، صفحه تست را مجدداً بررسی کنید:
http://localhost:3000/supabase-test

### 3. تست API Migration
API status migration:
```bash
curl -X GET http://localhost:3000/api/migrate/supabase
```

### 4. Migration داده‌ها (اختیاری)
اگر داده‌های موجود در MySQL دارید، می‌توانید آنها را export کرده و به Supabase import کنید.

## فایل‌های تغییر یافته:
- ✅ `/app/.env.local` - پیکربندی Supabase
- ✅ `/app/lib/database.ts` - client Supabase  
- ✅ `/app/lib/auth.ts` - authentication با Supabase
- ✅ `/app/supabase/migrations/20250120000000_migrate_to_supabase.sql` - migration script
- ✅ `/app/app/supabase-test/page.tsx` - صفحه تست
- ✅ `/app/app/api/migrate/supabase/route.ts` - API endpoint برای بررسی وضعیت
- ✅ `/app/middleware.ts` - اجازه دسترسی به صفحات تست

## نکات مهم:
1. **Local Development**: همه چیز برای development محلی آماده است
2. **Production**: در production نیز کار خواهد کرد چون از environment variables استفاده می‌کند
3. **Authentication**: سیستم auth هم با Supabase و هم با JWT سنتی کار می‌کند
4. **Data Migration**: داده‌های موجود باید manually منتقل شوند

## تست نهایی:
1. مراجعه به http://localhost:3000/supabase-test
2. باید پیام موفقیت نشان دهد
3. سپس می‌توانید از dashboard اصلی استفاده کنید

## پشتیبانی:
اگر مشکلی داشتید، logs را بررسی کنید:
```bash
tail -f /tmp/nextjs.log
```