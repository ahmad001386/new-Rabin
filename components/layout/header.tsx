'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAppStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    notifications,
    markNotificationAsRead
  } = useAppStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.data);
      } else {
        console.error('Failed to fetch user:', data.message);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-card/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/40 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 bg-gradient-to-l from-primary/5 via-transparent to-secondary/5">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-primary/10"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>

          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی مشتریان، تیکت‌ها..."
              className="w-64 pr-10 font-vazir border-border/50 focus:border-primary/50 focus:ring-primary/20"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="hover:bg-primary/10 relative group"
          >
            {!mounted ? (
              <Sun className="h-4 w-4 transition-transform group-hover:scale-110" />
            ) : theme === 'light' ? (
              <Moon className="h-4 w-4 transition-transform group-hover:scale-110" />
            ) : (
              <Sun className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
          </Button>

          {/* Color Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-vazir">تم رنگی</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-vazir">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"></div>
                  <span>پیش‌فرض</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hover:bg-primary/10">
                <Bell className="h-4 w-4" />
                {unreadNotifications.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse-glow"
                  >
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-medium leading-none font-vazir">اعلان‌ها</h4>
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-vazir">اعلان جدیدی وجود ندارد</p>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex items-start space-x-2 space-x-reverse rounded-lg p-3 text-sm transition-colors cursor-pointer',
                          !notification.read && 'bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-primary/20'
                        )}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className={cn(
                          'mt-1 h-2 w-2 rounded-full',
                          notification.type === 'success' && 'bg-secondary',
                          notification.type === 'warning' && 'bg-accent',
                          notification.type === 'error' && 'bg-destructive',
                          notification.type === 'info' && 'bg-primary'
                        )} />
                        <div className="flex-1">
                          <p className="font-medium font-vazir">{notification.title}</p>
                          <p className="text-muted-foreground font-vazir">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary/10">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  {currentUser?.avatar ? (
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-white font-vazir">
                      {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || '؟'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none font-vazir">
                    {currentUser?.name || 'کاربر'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-vazir" onClick={() => router.push('/dashboard/profile')}>
                <User className="ml-2 h-4 w-4" />
                <span>پروفایل</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="font-vazir" onClick={() => router.push('/dashboard/settings')}>
                <Settings className="ml-2 h-4 w-4" />
                <span>تنظیمات</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-vazir text-destructive"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/logout', {
                      method: 'POST',
                    });
                    if (response.ok) {
                      router.push('/login');
                    }
                  } catch (error) {
                    console.error('Error logging out:', error);
                  }
                }}
              >
                <LogOut className="ml-2 h-4 w-4" />
                <span>خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}