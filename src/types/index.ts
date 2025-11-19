export type Channel = 'whatsapp' | 'web';

export type ChatStatus = 'open' | 'needs_action' | 'resolved';

export type ChatMode = 'ai' | 'admin';

export interface Message {
  id: string;
  chatId: string;
  sender: 'customer' | 'ai' | 'admin';
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  customerName: string;
  customerAvatar?: string;
  channel: Channel;
  status: ChatStatus;
  mode: ChatMode;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  escalated: boolean;
  paymentRelated: boolean;
  tags: string[];
  notes?: string;
  firstSeen: Date;
  totalChats: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  channel: Channel;
  keyword: string;
  snippet: string;
  timestamp: Date;
  status: 'awaiting_check' | 'proof_received' | 'handled';
  handledBy?: string;
  handledAt?: Date;
  chatId: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  timezone: string;
  language: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'agent';
}

export interface QuickReply {
  id: string;
  name: string;
  content: string;
  channel?: Channel;
}

export interface DashboardStats {
  todayChats: number;
  needsActionChats: number;
  paymentAlerts: number;
  chatsThisWeek: { date: string; count: number }[];
  topIssue: { label: string; description: string };
}
