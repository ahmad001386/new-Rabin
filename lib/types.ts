export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'offline' | 'away' | 'active' | 'inactive';
  avatar?: string;
  team?: string;
  phone?: string;
  lastLogin?: string;
  lastActive?: string;
  createdAt?: string;
  password?: string;
}

export interface Contact extends Omit<User, 'status'> {
  status?: 'online' | 'offline' | 'away';
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatThread {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'follow_up' | 'rejected';
  segment: 'enterprise' | 'small_business' | 'individual';
  createdAt: string;
  lastInteraction?: string;
  totalTickets: number;
  satisfactionScore?: number;
  salesPipeline?: SalesPipelineStage;
  tags?: string[];
  projects?: string[];
  assignedTo?: string;
  potentialValue?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface SalesPipelineStage {
  currentStage: 'new_lead' | 'contacted' | 'needs_analysis' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';
  stageEntryDate: string;
  dealValue?: number;
  successProbability?: number;
  owner: string;
  activities: Activity[];
  notes: Note[];
  lossReason?: string;
  stageHistory?: Array<{
    stage: string;
    entryDate: string;
    exitDate?: string | null;
  }>;
  productSelected?: boolean;
  contactMade?: boolean;
  purchased?: boolean;
  nextAction?: string;
  lastContactDate?: string;
  contactAttempts?: number;
}

export interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'sms' | 'whatsapp' | 'follow_up' | 'system_task';
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  performedBy: string;
  outcome: 'successful' | 'follow_up_needed' | 'no_response' | 'completed' | 'cancelled';
  relatedDeal?: string;
  attachments?: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  customerId?: string;
  dealId?: string;
  title: string;
  content: string;
  category: 'customer_need' | 'sales_tip' | 'objection' | 'general' | 'technical' | 'pricing';
  tags: string[];
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  customerId?: string;
  dealId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  category: 'call' | 'meeting' | 'follow_up' | 'proposal' | 'admin' | 'other';
}

export interface Target {
  id: string;
  userId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  salesCount: number;
  salesAmount: number;
  callCount: number;
  dealCount: number;
  currentSalesCount: number;
  currentSalesAmount: number;
  currentCallCount: number;
  currentDealCount: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
  specifications?: string;
  isActive: boolean;
  inventory?: number;
  discounts?: Discount[];
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minQuantity?: number;
  validFrom: string;
  validTo: string;
}

export interface Deal {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  products: DealProduct[];
  totalValue: number;
  stage: SalesPipelineStage['currentStage'];
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  activities: Activity[];
  lossReason?: string;
}

export interface DealProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
}

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  category: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'email' | 'phone' | 'chat' | 'meeting';
  subject: string;
  description: string;
  date: string;
  duration?: number;
  outcome?: string;
}

export interface Opportunity {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  createdAt: string;
  notes?: string;
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  type: 'csat' | 'nps' | 'ces' | 'complaint' | 'suggestion' | 'praise';
  score: number;
  comment?: string;
  createdAt: string;
  category: string;
  title?: string;
  product?: string;
  channel?: 'email' | 'website' | 'phone' | 'chat';
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'inProgress' | 'completed';
  description?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  openTickets: number;
  avgSatisfactionScore: number;
  npsScore: number;
  totalOpportunities: number;
  monthlyRevenue: number;
  ticketResolutionTime: number;
  totalSales: number;
  userActivity: UserActivityStat[];
  importantLeads: Customer[];
  alerts: Alert[];
}

export interface UserActivityStat {
  userId: string;
  userName: string;
  callsToday: number;
  meetingsToday: number;
  dealsActive: number;
  targetProgress: number;
  lastActivity: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'call' | 'meeting' | 'follow_up' | 'task' | 'reminder';
  customerId?: string;
  customerName?: string;
  assignedTo: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  attendees?: string[];
}