// Chat status enum matching database
export type ChatStatus = 'ai' | 'needs_action' | 'human' | 'resolved';

// Message enums matching database
export type MessageDirection = 'inbound' | 'outbound';
export type MessageSenderType = 'customer' | 'ai' | 'human';
export type MessageContentType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'other';

// Invoice status enum
export type InvoiceStatus = 'waiting_for_payment' | 'paid' | 'approved';

// Discount type enum
export type DiscountType = 'none' | 'percentage' | 'fixed';

// Product status enum
export type ProductStatus = 'active' | 'inactive';

// Workspace user role enum
export type WorkspaceUserRole = 'owner' | 'admin';

export interface Workspace {
  id: string;
  name: string;
  whatsapp_phone_number: string | null;
  business_address: string | null;
  business_email: string | null;
  business_logo_url: string | null;
  currency_code: string | null;
  locale: string | null;
  timezone: string | null;
  created_at: string | null;
}

export interface Contact {
  id: string;
  workspace_id: string;
  phone_number: string;
  display_name: string | null;
  created_at: string | null;
  last_seen_at: string | null;
}

export interface Chat {
  id: string;
  workspace_id: string;
  contact_id: string;
  current_status: ChatStatus;
  assigned_user_id: string | null;
  unread_count_for_human: number;
  last_message_at: string | null;
  created_at: string | null;
  // Joined from contacts
  contact?: Contact;
}

export interface Message {
  id: string;
  workspace_id: string;
  chat_id: string;
  contact_id: string;
  direction: MessageDirection;
  sender_type: MessageSenderType;
  sender_user_id: string | null;
  content_type: MessageContentType;
  text: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  wa_message_id: string | null;
  created_at: string | null;
}

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  price: number;
  discount_type: DiscountType;
  discount_value: number;
  stock: number;
  status: ProductStatus;
  ai_explanation: string | null;
  is_deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  chat_id: string;
  contact_id: string;
  created_by_type: MessageSenderType;
  created_by_user_id: string | null;
  status: InvoiceStatus;
  invoice_number: string | null;
  currency_code: string | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: string | null;
  updated_at: string | null;
  // Joined from contacts
  contact?: Contact;
  // Joined from chats
  chat?: Chat;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  unit_price: number;
  quantity: number;
  discount_type: DiscountType;
  discount_value: number;
  line_total: number;
}

export interface DashboardStats {
  todayChats: number;
  needsActionChats: number;
  paymentAlerts: number;
}
