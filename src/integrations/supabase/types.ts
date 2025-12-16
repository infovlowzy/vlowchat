export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          assigned_user_id: string | null
          contact_id: string
          created_at: string | null
          current_status: Database["public"]["Enums"]["chat_status"]
          id: string
          last_message_at: string | null
          unread_count_for_human: number | null
          workspace_id: string
        }
        Insert: {
          assigned_user_id?: string | null
          contact_id: string
          created_at?: string | null
          current_status?: Database["public"]["Enums"]["chat_status"]
          id?: string
          last_message_at?: string | null
          unread_count_for_human?: number | null
          workspace_id: string
        }
        Update: {
          assigned_user_id?: string | null
          contact_id?: string
          created_at?: string | null
          current_status?: Database["public"]["Enums"]["chat_status"]
          id?: string
          last_message_at?: string | null
          unread_count_for_human?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chats_old: {
        Row: {
          channel: Database["public"]["Enums"]["channel"]
          created_at: string | null
          customer_avatar: string | null
          customer_name: string
          escalated: boolean | null
          first_seen: string | null
          id: string
          last_message: string | null
          last_message_time: string | null
          mode: Database["public"]["Enums"]["chat_mode"] | null
          notes: string | null
          payment_related: boolean | null
          status: Database["public"]["Enums"]["chat_status_old"] | null
          tags: string[] | null
          total_chats: number | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel"]
          created_at?: string | null
          customer_avatar?: string | null
          customer_name: string
          escalated?: boolean | null
          first_seen?: string | null
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          mode?: Database["public"]["Enums"]["chat_mode"] | null
          notes?: string | null
          payment_related?: boolean | null
          status?: Database["public"]["Enums"]["chat_status_old"] | null
          tags?: string[] | null
          total_chats?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"]
          created_at?: string | null
          customer_avatar?: string | null
          customer_name?: string
          escalated?: boolean | null
          first_seen?: string | null
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          mode?: Database["public"]["Enums"]["chat_mode"] | null
          notes?: string | null
          payment_related?: boolean | null
          status?: Database["public"]["Enums"]["chat_status_old"] | null
          tags?: string[] | null
          total_chats?: number | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          last_seen_at: string | null
          phone_number: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone_number: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone_number?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          id: string
          invoice_id: string
          line_total: number | null
          name: string
          product_id: string | null
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          invoice_id: string
          line_total?: number | null
          name: string
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          invoice_id?: string
          line_total?: number | null
          name?: string
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          chat_id: string
          contact_id: string
          created_at: string | null
          created_by_type: Database["public"]["Enums"]["message_sender_type"]
          created_by_user_id: string | null
          currency_code: string | null
          discount_amount: number | null
          id: string
          invoice_number: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          chat_id: string
          contact_id: string
          created_at?: string | null
          created_by_type?: Database["public"]["Enums"]["message_sender_type"]
          created_by_user_id?: string | null
          currency_code?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          chat_id?: string
          contact_id?: string
          created_at?: string | null
          created_by_type?: Database["public"]["Enums"]["message_sender_type"]
          created_by_user_id?: string | null
          currency_code?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          contact_id: string
          content_type: Database["public"]["Enums"]["message_content_type"]
          created_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_mime_type: string | null
          media_url: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          sender_user_id: string | null
          text: string | null
          wa_message_id: string | null
          workspace_id: string
        }
        Insert: {
          chat_id: string
          contact_id: string
          content_type?: Database["public"]["Enums"]["message_content_type"]
          created_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          sender_user_id?: string | null
          text?: string | null
          wa_message_id?: string | null
          workspace_id: string
        }
        Update: {
          chat_id?: string
          contact_id?: string
          content_type?: Database["public"]["Enums"]["message_content_type"]
          created_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          sender_user_id?: string | null
          text?: string | null
          wa_message_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey1"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_old: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          sender: string
          timestamp: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender: string
          timestamp?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_old"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_explanation: string | null
          created_at: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          id: string
          is_deleted: boolean | null
          name: string
          price: number
          status: Database["public"]["Enums"]["product_status"] | null
          stock: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          ai_explanation?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          is_deleted?: boolean | null
          name: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          stock?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          ai_explanation?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          stock?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          id: string
          language: string | null
          phone: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          language?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          channel: Database["public"]["Enums"]["channel"] | null
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel"] | null
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"] | null
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          channel: Database["public"]["Enums"]["channel"]
          chat_id: string
          created_at: string | null
          customer_name: string
          handled_at: string | null
          handled_by: string | null
          id: string
          keyword: string
          snippet: string
          status: Database["public"]["Enums"]["transaction_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel"]
          chat_id: string
          created_at?: string | null
          customer_name: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          keyword: string
          snippet: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"]
          chat_id?: string
          created_at?: string | null
          customer_name?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          keyword?: string
          snippet?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_old"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_users: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["workspace_user_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_user_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_user_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_logo_url: string | null
          created_at: string | null
          currency_code: string | null
          id: string
          locale: string | null
          name: string
          timezone: string | null
          whatsapp_phone_number: string | null
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_logo_url?: string | null
          created_at?: string | null
          currency_code?: string | null
          id?: string
          locale?: string | null
          name: string
          timezone?: string | null
          whatsapp_phone_number?: string | null
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_logo_url?: string | null
          created_at?: string | null
          currency_code?: string | null
          id?: string
          locale?: string | null
          name?: string
          timezone?: string | null
          whatsapp_phone_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
      channel: "whatsapp" | "web"
      chat_mode: "ai" | "admin"
      chat_status: "ai" | "needs_action" | "human" | "resolved"
      chat_status_old: "open" | "needs_action" | "resolved"
      discount_type: "none" | "percentage" | "fixed"
      invoice_status: "waiting_for_payment" | "paid" | "approved"
      message_content_type:
        | "text"
        | "image"
        | "document"
        | "audio"
        | "video"
        | "other"
      message_direction: "inbound" | "outbound"
      message_sender_type: "customer" | "ai" | "human"
      notification_type:
        | "incoming_chat"
        | "payment_alert"
        | "customer_paid"
        | "needs_escalation"
      product_status: "active" | "inactive"
      transaction_status: "awaiting_check" | "proof_received" | "handled"
      workspace_user_role: "owner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agent"],
      channel: ["whatsapp", "web"],
      chat_mode: ["ai", "admin"],
      chat_status: ["ai", "needs_action", "human", "resolved"],
      chat_status_old: ["open", "needs_action", "resolved"],
      discount_type: ["none", "percentage", "fixed"],
      invoice_status: ["waiting_for_payment", "paid", "approved"],
      message_content_type: [
        "text",
        "image",
        "document",
        "audio",
        "video",
        "other",
      ],
      message_direction: ["inbound", "outbound"],
      message_sender_type: ["customer", "ai", "human"],
      notification_type: [
        "incoming_chat",
        "payment_alert",
        "customer_paid",
        "needs_escalation",
      ],
      product_status: ["active", "inactive"],
      transaction_status: ["awaiting_check", "proof_received", "handled"],
      workspace_user_role: ["owner", "admin"],
    },
  },
} as const
