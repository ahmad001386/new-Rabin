'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Filter states
  customerFilter: {
    search: string;
    status: string;
    segment: string;
  };
  setCustomerFilter: (filter: Partial<AppState['customerFilter']>) => void;
  
  ticketFilter: {
    search: string;
    status: string;
    priority: string;
  };
  setTicketFilter: (filter: Partial<AppState['ticketFilter']>) => void;
  
  // UI states
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      customerFilter: {
        search: '',
        status: '',
        segment: '',
      },
      setCustomerFilter: (filter) => 
        set((state) => ({ 
          customerFilter: { ...state.customerFilter, ...filter } 
        })),
      
      ticketFilter: {
        search: '',
        status: '',
        priority: '',
      },
      setTicketFilter: (filter) => 
        set((state) => ({ 
          ticketFilter: { ...state.ticketFilter, ...filter } 
        })),
      
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      notifications: [
        {
          id: '1',
          title: 'تیکت جدید',
          message: 'تیکت با اولویت بالا از شرکت آکمه',
          type: 'warning',
          timestamp: '2024-01-20T16:00:00Z',
          read: false,
        },
        {
          id: '2',
          title: 'بازخورد مشتری',
          message: 'نظر ۵ ستاره جدید از راه‌حل‌های فناوری پارس',
          type: 'success',
          timestamp: '2024-01-20T15:30:00Z',
          read: false,
        },
        {
          id: '3',
          title: 'فرصت فروش',
          message: 'فرصت جدید با ارزش ۱۰۰ میلیون تومان',
          type: 'info',
          timestamp: '2024-01-20T14:15:00Z',
          read: true,
        },
      ],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-store',
    }
  )
);