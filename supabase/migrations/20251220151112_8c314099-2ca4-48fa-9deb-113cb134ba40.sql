-- Add UNIQUE constraint on contacts for (workspace_id, phone_number)
-- This is required for upsert operations to work correctly
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_workspace_phone_unique 
UNIQUE (workspace_id, phone_number);

-- Add widget API key columns to workspaces for website chat authentication
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS widget_api_key_hash text;

ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS widget_allowed_origins text[] DEFAULT '{}';

-- Create rate limiting table for website chat
CREATE TABLE public.website_chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, visitor_id)
);

-- Enable RLS on rate limits table (service role will bypass this)
ALTER TABLE public.website_chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table
COMMENT ON TABLE public.website_chat_rate_limits IS 'Rate limiting for website chat - managed by edge functions only';