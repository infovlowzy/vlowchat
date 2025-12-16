
-- Create new enums
DO $$ BEGIN
  CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_sender_type AS ENUM ('customer', 'ai', 'human');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_content_type AS ENUM ('text', 'image', 'document', 'audio', 'video', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('waiting_for_payment', 'paid', 'approved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('none', 'percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_user_role AS ENUM ('owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('incoming_chat', 'payment_alert', 'customer_paid', 'needs_escalation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update chat_status enum to new values
ALTER TYPE public.chat_status RENAME TO chat_status_old;
CREATE TYPE public.chat_status AS ENUM ('ai', 'needs_action', 'human', 'resolved');

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp_phone_number text,
  business_address text,
  business_email text,
  business_logo_url text,
  currency_code text DEFAULT 'IDR',
  locale text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Jakarta',
  created_at timestamptz DEFAULT now()
);

-- Create workspace_users table
CREATE TABLE IF NOT EXISTS public.workspace_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_user_role NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

-- Create new chats table (renamed from old one)
ALTER TABLE public.chats RENAME TO chats_old;

CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_status chat_status NOT NULL DEFAULT 'ai',
  assigned_user_id uuid REFERENCES auth.users(id),
  unread_count_for_human int DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create new messages table (renamed from old one)
ALTER TABLE public.messages RENAME TO messages_old;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender_type message_sender_type NOT NULL,
  sender_user_id uuid REFERENCES auth.users(id),
  content_type message_content_type NOT NULL DEFAULT 'text',
  text text,
  media_url text,
  media_mime_type text,
  wa_message_id text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(18,2) NOT NULL DEFAULT 0,
  discount_type discount_type DEFAULT 'none',
  discount_value numeric(18,2) DEFAULT 0,
  stock int DEFAULT 0,
  status product_status DEFAULT 'active',
  ai_explanation text,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_by_type message_sender_type NOT NULL DEFAULT 'human',
  created_by_user_id uuid REFERENCES auth.users(id),
  status invoice_status NOT NULL DEFAULT 'waiting_for_payment',
  invoice_number text,
  currency_code text DEFAULT 'IDR',
  subtotal_amount numeric(18,2) DEFAULT 0,
  discount_amount numeric(18,2) DEFAULT 0,
  tax_amount numeric(18,2) DEFAULT 0,
  total_amount numeric(18,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  name text NOT NULL,
  description text,
  unit_price numeric(18,2) DEFAULT 0,
  quantity numeric(18,2) DEFAULT 1,
  discount_type discount_type DEFAULT 'none',
  discount_value numeric(18,2) DEFAULT 0,
  line_total numeric(18,2) DEFAULT 0
);

-- Enable RLS on all new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create helper function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_users
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (is_workspace_member(id, auth.uid()));

CREATE POLICY "Users can update workspaces they belong to"
  ON public.workspaces FOR UPDATE
  USING (is_workspace_member(id, auth.uid()));

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (true);

-- RLS Policies for workspace_users
CREATE POLICY "Users can view workspace members"
  ON public.workspace_users FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can add members to their workspaces"
  ON public.workspace_users FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()) OR user_id = auth.uid());

-- RLS Policies for contacts
CREATE POLICY "Users can view contacts in their workspaces"
  ON public.contacts FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create contacts in their workspaces"
  ON public.contacts FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update contacts in their workspaces"
  ON public.contacts FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for chats
CREATE POLICY "Users can view chats in their workspaces"
  ON public.chats FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create chats in their workspaces"
  ON public.chats FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update chats in their workspaces"
  ON public.chats FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their workspaces"
  ON public.messages FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create messages in their workspaces"
  ON public.messages FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for products
CREATE POLICY "Users can view products in their workspaces"
  ON public.products FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage products in their workspaces"
  ON public.products FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their workspaces"
  ON public.invoices FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage invoices in their workspaces"
  ON public.invoices FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_id AND is_workspace_member(i.workspace_id, auth.uid())
  ));

CREATE POLICY "Users can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_id AND is_workspace_member(i.workspace_id, auth.uid())
  ));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update handle_new_user to create a default workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, business_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    NEW.email
  );
  
  -- Give user admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, business_email)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Workspace'), NEW.email)
  RETURNING id INTO new_workspace_id;
  
  -- Add user to workspace as owner
  INSERT INTO public.workspace_users (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;
