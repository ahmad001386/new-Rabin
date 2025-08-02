'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { 
  Settings, 
  Palette, 
  Bell, 
  Mail, 
  Shield, 
  Database,
  Upload
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  const [branding, setBranding] = useState({
    companyName: 'شرکت شما',
    primaryColor: '#00BCD4',
    secondaryColor: '#4CAF50',
    logo: null,
  });

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
  };

  const handleBrandingChange = (field: string, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    console.log('تنظیمات ذخیره شد:', { theme, notifications, branding });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            تنظیمات
          </h1>
          <p className="text-muted-foreground font-vazir mt-2">مدیریت تنظیمات و پیکربندی برنامه</p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 font-vazir">
          ذخیره تغییرات
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Settings className="h-5 w-5" />
              <span>تنظیمات عمومی</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="font-vazir">نام شرکت</Label>
              <Input
                id="company-name"
                value={branding.companyName}
                onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                className="font-vazir"
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-vazir">تم</Label>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="font-vazir"
                >
                  روشن
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="font-vazir"
                >
                  تیره
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="font-vazir"
                >
                  سیستم
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-vazir">منطقه زمانی</Label>
              <select className="w-full px-3 py-2 border border-border rounded-md font-vazir" dir="rtl">
                <option>تهران (ایران)</option>
                <option>UTC (زمان جهانی)</option>
                <option>EST (زمان شرق آمریکا)</option>
                <option>PST (زمان غرب آمریکا)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Palette className="h-5 w-5" />
              <span>برندسازی</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-vazir">لوگوی شرکت</Label>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <Button variant="outline" size="sm" className="font-vazir">
                  <Upload className="h-4 w-4 ml-2" />
                  آپلود لوگو
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color" className="font-vazir">رنگ اصلی</Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  id="primary-color"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="w-12 h-10"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="flex-1 font-vazir"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="font-vazir">رنگ ثانویه</Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  id="secondary-color"
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  className="w-12 h-10"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  className="flex-1 font-vazir"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50 hover:border-accent/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Bell className="h-5 w-5" />
              <span>اعلان‌ها</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-vazir">اعلان‌های ایمیل</Label>
                <p className="text-sm text-muted-foreground font-vazir">
                  دریافت اعلان‌ها از طریق ایمیل
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-vazir">اعلان‌های فوری</Label>
                <p className="text-sm text-muted-foreground font-vazir">
                  دریافت اعلان‌های فوری مرورگر
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={(checked) => handleNotificationChange('push', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications" className="font-vazir">اعلان‌های پیامکی</Label>
                <p className="text-sm text-muted-foreground font-vazir">
                  دریافت اعلان‌ها از طریق پیامک
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={notifications.sms}
                onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-notifications" className="font-vazir">ایمیل‌های بازاریابی</Label>
                <p className="text-sm text-muted-foreground font-vazir">
                  دریافت ایمیل‌های بازاریابی و تبلیغاتی
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={notifications.marketing}
                onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
              <Shield className="h-5 w-5" />
              <span>امنیت</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-vazir">احراز هویت دو مرحله‌ای</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                افزودن لایه امنیتی اضافی به حساب شما
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                فعال‌سازی 2FA
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-vazir">مدیریت جلسات</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                مدیریت جلسات فعال شما
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                مشاهده جلسات
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-vazir">رمز عبور</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                تغییر رمز عبور حساب
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                تغییر رمز عبور
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse font-vazir">
            <Database className="h-5 w-5" />
            <span>مدیریت داده‌ها</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-vazir">خروجی داده‌ها</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                دانلود داده‌های شما در فرمت‌های مختلف
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                خروجی همه داده‌ها
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="font-vazir">وارد کردن داده‌ها</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                وارد کردن داده‌ها از CSV یا منابع دیگر
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                وارد کردن داده‌ها
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="font-vazir">پشتیبان‌گیری داده‌ها</Label>
              <p className="text-sm text-muted-foreground font-vazir">
                ایجاد و مدیریت پشتیبان‌گیری داده‌ها
              </p>
              <Button variant="outline" size="sm" className="font-vazir">
                ایجاد پشتیبان
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}