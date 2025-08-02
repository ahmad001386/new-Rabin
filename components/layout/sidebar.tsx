'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  Contact,
  Ticket,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
  ChevronLeft,
  Activity,
  Calendar,
  Briefcase,
  Target,
  FileText,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
}

interface Module {
  id: string;
  name: string;
  display_name: string;
  route: string;
  icon: string;
  sort_order: number;
  parent_id?: string;
}

// Icon mapping
const iconMap: { [key: string]: any } = {
  'Home': LayoutDashboard,
  'LayoutDashboard': LayoutDashboard,
  'Users': Users,
  'Users2': Target,
  'UserCheck': Contact,
  'Activity': Activity,
  'MessageCircle': MessageCircle,
  'MessageCircle2': MessageCircle,
  'DollarSign': TrendingUp,
  'BarChart3': BarChart3,
  'Calendar': Calendar,
  'User': Contact,
  'Settings': Settings,
  'Target': Target,
  'Briefcase': Briefcase,
  'Ticket': Ticket,
  'ChevronRight': ChevronRight,
  'Building2': Building2,
  'TrendingUp': TrendingUp,
  'FileText': FileText,
  'Brain': Brain,
};

// Route to display name mapping for better UX
const routeDisplayNames: { [key: string]: string } = {
  '/dashboard': 'داشبورد',
  '/dashboard/customers': 'مشتریان',
  '/dashboard/contacts': 'مخاطبین',
  '/dashboard/coworkers': 'همکاران',
  '/dashboard/activities': 'فعالیت‌ها',
  '/dashboard/interactions': 'تعاملات',
  '/dashboard/interactions/chat': 'چت',
  '/dashboard/deals': 'معاملات',
  '/dashboard/feedback': 'بازخوردها',
  '/dashboard/reports': 'گزارش‌ها',
  '/dashboard/daily-reports': 'گزارش‌های روزانه',
  '/dashboard/insights/reports-analysis': 'تحلیل گزارشات',
  '/dashboard/calendar': 'تقویم',
  '/dashboard/profile': 'پروفایل',
  '/dashboard/settings': 'تنظیمات',
  '/dashboard/projects': 'پروژه‌ها و محصولات',
  '/dashboard/projects/products': 'محصولات',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();

    // Listen for refresh events
    const handleRefreshSidebar = () => {
      console.log('🔄 Refreshing sidebar permissions...');
      fetchUserPermissions();
    };

    window.addEventListener('refreshSidebar', handleRefreshSidebar);

    return () => {
      window.removeEventListener('refreshSidebar', handleRefreshSidebar);
    };
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/permissions');
      const data = await response.json();

      if (data.success) {
        const modules: Module[] = data.data;
        const convertedNavItems = convertModulesToNavItems(modules);
        setNavItems(convertedNavItems);
      } else {
        console.error('Failed to fetch permissions:', data.message);
        // Fallback to basic items
        setNavItems([
          {
            title: 'داشبورد',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'پروفایل',
            href: '/dashboard/profile',
            icon: Contact,
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fallback to basic items
      setNavItems([
        {
          title: 'داشبورد',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'پروفایل',
          href: '/dashboard/profile',
          icon: Contact,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const convertModulesToNavItems = (modules: Module[]): NavItem[] => {
    const filteredModules = modules
      .filter(module => module.route && module.route !== '#')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Create hierarchical menu structure
    const navItems: NavItem[] = [];

    // Group modules into main categories
    // Sales Management modules
    const salesModules = filteredModules.filter(m =>
      ['sales', 'sales_opportunities', 'deals', 'products'].includes(m.name)
    );

    // Customer Experience Management modules
    const cemModules = filteredModules.filter(m =>
      ['customers', 'contacts', 'interactions', 'chat', 'feedback', 'feedback_new', 'surveys', 'csat', 'nps', 'customer_health'].includes(m.name)
    );

    // Team Management modules
    const teamModules = filteredModules.filter(m =>
      ['coworkers', 'activities', 'tasks', 'calendar'].includes(m.name)
    );

    // AI & Analytics modules
    const aiAnalyticsModules = filteredModules.filter(m =>
      ['emotions', 'insights', 'reports_analysis', 'touchpoints', 'alerts', 'voice_of_customer'].includes(m.name)
    );

    const settingsModules = filteredModules.filter(m =>
      ['settings', 'cem_settings'].includes(m.name)
    );

    // Projects and Products modules
    const projectModules = filteredModules.filter(m =>
      ['projects', 'products'].includes(m.name)
    );

    const otherModules = filteredModules.filter(m =>
      !['customers', 'contacts', 'coworkers', 'activities', 'interactions', 'chat',
        'sales', 'sales_opportunities', 'feedback', 'feedback_new', 'surveys', 'csat', 'nps',
        'emotions', 'insights', 'reports_analysis', 'touchpoints', 'customer_health', 'alerts', 'voice_of_customer',
        'settings', 'cem_settings', 'projects', 'products'].includes(m.name)
    );

    // Add dashboard first if exists
    const dashboardModule = filteredModules.find(m => m.name === 'dashboard');
    if (dashboardModule) {
      navItems.push({
        title: routeDisplayNames[dashboardModule.route] || dashboardModule.display_name,
        href: dashboardModule.route,
        icon: iconMap[dashboardModule.icon] || LayoutDashboard,
      });
    }

    // Add Sales Management mega menu
    if (salesModules.length > 0) {
      navItems.push({
        title: 'مدیریت فروش',
        href: '/dashboard/sales',
        icon: TrendingUp,
        children: salesModules.map(module => ({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || TrendingUp,
        })),
      });
    }

    // Add Customer Experience Management mega menu
    if (cemModules.length > 0) {
      navItems.push({
        title: 'مدیریت تجربه مشتری',
        href: '/dashboard/cem',
        icon: Users,
        children: cemModules.map(module => ({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || Users,
        })),
      });
    }

    // Add Team Management mega menu
    if (teamModules.length > 0) {
      navItems.push({
        title: 'مدیریت همکاران',
        href: '/dashboard/coworkers',
        icon: Activity,
        children: [
          ...teamModules.map(module => ({
            title: routeDisplayNames[module.route] || module.display_name,
            href: module.route,
            icon: iconMap[module.icon] || Activity,
          })),
          // Add reports route as a child
          {
            title: routeDisplayNames['/dashboard/reports'] || 'گزارش‌ها',
            href: '/dashboard/reports',
            icon: BarChart3,
          }
        ],
      });
    }

    // Add AI & Analytics mega menu
    if (aiAnalyticsModules.length > 0) {
      navItems.push({
        title: 'هوش مصنوعی و تحلیل',
        href: '/dashboard/insights',
        icon: BarChart3,
        children: [
          ...aiAnalyticsModules.map(module => ({
            title: routeDisplayNames[module.route] || module.display_name,
            href: module.route,
            icon: iconMap[module.icon] || BarChart3,
          })),
          {
            title: 'تحلیل صوتی',
            href: '/dashboard/insights/audio-analysis',
            icon: Brain,
          }
        ],
      });
    }

    // Add Projects & Products group if has modules
    if (projectModules.length > 0) {
      navItems.push({
        title: 'پروژه‌ها و محصولات',
        href: '/dashboard/projects',
        icon: Briefcase,
        children: projectModules.map(module => ({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || Briefcase,
        })),
      });
    }

    // جمع‌آوری روت‌های همه آیتم‌های children برای جلوگیری از تکرار
    const megaMenuRoutes = [
      ...salesModules,
      ...cemModules,
      ...teamModules,
      ...aiAnalyticsModules,
      ...projectModules,
    ].map(m => m.route);

    // Add other individual modules (فقط اگر در هیچ مگامنو نباشد)
    otherModules.forEach(module => {
      if (
        !['dashboard', 'settings', 'cem_settings'].includes(module.name) &&
        !megaMenuRoutes.includes(module.route)
      ) {
        navItems.push({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || LayoutDashboard,
        });
      }
    });

    // Add Settings group if has modules
    if (settingsModules.length > 0) {
      if (settingsModules.length === 1) {
        // If only one settings module, add directly
        const module = settingsModules[0];
        navItems.push({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || Settings,
        });
      } else {
        // If multiple settings, create group
        navItems.push({
          title: 'تنظیمات',
          href: '/dashboard/settings',
          icon: Settings,
          children: settingsModules.map(module => ({
            title: routeDisplayNames[module.route] || module.display_name,
            href: module.route,
            icon: iconMap[module.icon] || Settings,
          })),
        });
      }
    }

    return navItems;
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => {
      // اگر آیتم در لیست باز شده‌ها باشد، آن را ببند
      if (prev.includes(title)) {
        return prev.filter(item => item !== title);
      }
      // در غیر این صورت، همه را ببند و فقط این یکی را باز کن
      return [title];
    });
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.title} className="animate-fade-in-up">
        <div
          className={cn(
            'flex items-center space-x-3 space-x-reverse rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
            level > 0 && 'mr-4',
            isActive
              ? 'bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-primary shadow-lg border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-secondary/5 hover:to-accent/5 hover:shadow-md',
            sidebarCollapsed && 'justify-center px-2',
            'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-secondary/10 before:to-accent/10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100'
          )}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-inherit hover:bg-transparent relative z-10"
              onClick={() => toggleExpanded(item.title)}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 font-vazir">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="mr-auto bg-accent/20 text-accent border-accent/30">
                        {item.badge}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                    )}
                  </>
                )}
              </div>
            </Button>
          ) : (
            <Link href={item.href} className="flex items-center space-x-3 space-x-reverse flex-1 relative z-10">
              <item.icon className={cn(
                "h-5 w-5 transition-colors duration-300",
                isActive ? "text-primary" : "group-hover:text-primary"
              )} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 font-vazir">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="mr-auto bg-accent/20 text-accent border-accent/30">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mr-4 space-y-1 animate-slide-in-right">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full bg-card/95 backdrop-blur-xl border-l border-border/50 transition-all duration-300 lg:relative lg:z-0 shadow-2xl',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                داشبورد مدیریت
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden hover:bg-primary/10"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="space-y-2 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            navItems.map(item => renderNavItem(item))
          )}
        </nav>

        {/* Collapse button for desktop */}
        <div className="hidden lg:block absolute bottom-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-primary/10"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}