import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-workspace-key',
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000
const MAX_VISITOR_ID_LENGTH = 100
const MAX_VISITOR_NAME_LENGTH = 100
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per visitor

interface WebsiteChatMessage {
  workspace_id: string
  visitor_id: string
  visitor_name?: string
  message: string
  content_type?: 'text' | 'image' | 'document'
  media_url?: string
}

interface Workspace {
  id: string
  widget_api_key_hash: string | null
  widget_allowed_origins: string[] | null
}

// Simple hash comparison (for API key verification)
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Validate and sanitize input
function validatePayload(payload: unknown): { valid: boolean; error?: string; data?: WebsiteChatMessage } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const p = payload as Record<string, unknown>

  // Validate workspace_id - must be valid UUID
  if (typeof p.workspace_id !== 'string' || !UUID_REGEX.test(p.workspace_id)) {
    return { valid: false, error: 'Invalid workspace_id format - must be a valid UUID' }
  }

  // Validate visitor_id
  if (typeof p.visitor_id !== 'string' || p.visitor_id.trim().length === 0) {
    return { valid: false, error: 'visitor_id is required and must be a non-empty string' }
  }
  if (p.visitor_id.length > MAX_VISITOR_ID_LENGTH) {
    return { valid: false, error: `visitor_id must be at most ${MAX_VISITOR_ID_LENGTH} characters` }
  }

  // Validate message
  if (typeof p.message !== 'string' || p.message.trim().length === 0) {
    return { valid: false, error: 'message is required and must be a non-empty string' }
  }
  if (p.message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `message must be at most ${MAX_MESSAGE_LENGTH} characters` }
  }

  // Validate optional visitor_name
  let visitorName: string | undefined
  if (p.visitor_name !== undefined) {
    if (typeof p.visitor_name !== 'string') {
      return { valid: false, error: 'visitor_name must be a string' }
    }
    if (p.visitor_name.length > MAX_VISITOR_NAME_LENGTH) {
      return { valid: false, error: `visitor_name must be at most ${MAX_VISITOR_NAME_LENGTH} characters` }
    }
    visitorName = p.visitor_name.trim() || undefined
  }

  // Validate optional content_type
  const validContentTypes = ['text', 'image', 'document']
  let contentType: 'text' | 'image' | 'document' = 'text'
  if (p.content_type !== undefined) {
    if (typeof p.content_type !== 'string' || !validContentTypes.includes(p.content_type)) {
      return { valid: false, error: 'content_type must be one of: text, image, document' }
    }
    contentType = p.content_type as 'text' | 'image' | 'document'
  }

  // Validate optional media_url
  let mediaUrl: string | undefined
  if (p.media_url !== undefined) {
    if (typeof p.media_url !== 'string') {
      return { valid: false, error: 'media_url must be a string' }
    }
    // Basic URL validation
    try {
      new URL(p.media_url)
      mediaUrl = p.media_url
    } catch {
      return { valid: false, error: 'media_url must be a valid URL' }
    }
  }

  return {
    valid: true,
    data: {
      workspace_id: p.workspace_id,
      visitor_id: p.visitor_id.trim(),
      visitor_name: visitorName,
      message: p.message.trim(),
      content_type: contentType,
      media_url: mediaUrl,
    }
  }
}

// Check rate limit for visitor
async function checkRateLimit(
  supabase: any,
  workspaceId: string,
  visitorId: string
): Promise<{ exceeded: boolean; remaining: number }> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)

  // Try to get existing rate limit record
  const { data: existing, error: fetchError } = await supabase
    .from('website_chat_rate_limits')
    .select('id, request_count, window_start')
    .eq('workspace_id', workspaceId)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error checking rate limit:', fetchError)
    // Fail open - allow request if we can't check rate limit
    return { exceeded: false, remaining: RATE_LIMIT_MAX_REQUESTS }
  }

  if (!existing) {
    // Create new rate limit record
    const { error: insertError } = await supabase
      .from('website_chat_rate_limits')
      .insert({
        workspace_id: workspaceId,
        visitor_id: visitorId,
        request_count: 1,
        window_start: now.toISOString(),
      })

    if (insertError) {
      console.error('Error creating rate limit record:', insertError)
    }
    return { exceeded: false, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  const existingWindowStart = new Date(existing.window_start)
  
  if (existingWindowStart < windowStart) {
    // Window has expired, reset counter
    const { error: updateError } = await supabase
      .from('website_chat_rate_limits')
      .update({
        request_count: 1,
        window_start: now.toISOString(),
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Error resetting rate limit:', updateError)
    }
    return { exceeded: false, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  // Check if limit exceeded
  if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
    return { exceeded: true, remaining: 0 }
  }

  // Increment counter
  const { error: updateError } = await supabase
    .from('website_chat_rate_limits')
    .update({
      request_count: existing.request_count + 1,
    })
    .eq('id', existing.id)

  if (updateError) {
    console.error('Error incrementing rate limit:', updateError)
  }

  return { exceeded: false, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 }
}

// Validate origin against allowed origins
function validateOrigin(origin: string | null, allowedOrigins: string[] | null): boolean {
  // If no allowed origins configured, allow all (backwards compatibility)
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true
  }

  if (!origin) {
    return false
  }

  // Check if origin matches any allowed origin (with wildcard support)
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      // Wildcard subdomain match
      const domain = allowed.slice(2)
      return origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`
    }
    return origin === allowed
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    // Get origin for validation
    const origin = req.headers.get('origin')

    // Parse JSON with error handling
    let rawPayload: unknown
    try {
      rawPayload = await req.json()
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate payload
    const validation = validatePayload(rawPayload)
    if (!validation.valid || !validation.data) {
      console.error('Validation failed:', validation.error)
      return new Response(JSON.stringify({ 
        error: validation.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = validation.data
    console.log('Received validated website chat message:', JSON.stringify({
      workspace_id: payload.workspace_id,
      visitor_id: payload.visitor_id,
      message_length: payload.message.length,
    }))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify workspace exists and get security settings
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, widget_api_key_hash, widget_allowed_origins')
      .eq('id', payload.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      console.error('Workspace not found:', payload.workspace_id)
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const typedWorkspace = workspace as Workspace

    // Validate API key if workspace has one configured
    if (typedWorkspace.widget_api_key_hash) {
      const apiKey = req.headers.get('x-workspace-key')
      if (!apiKey) {
        console.error('Missing API key for workspace:', payload.workspace_id)
        return new Response(JSON.stringify({ error: 'Unauthorized - API key required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const providedHash = await hashApiKey(apiKey)
      if (providedHash !== typedWorkspace.widget_api_key_hash) {
        console.error('Invalid API key for workspace:', payload.workspace_id)
        return new Response(JSON.stringify({ error: 'Unauthorized - Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Validate origin if allowed origins are configured
    if (!validateOrigin(origin, typedWorkspace.widget_allowed_origins)) {
      console.error('Origin not allowed:', origin, 'for workspace:', payload.workspace_id)
      return new Response(JSON.stringify({ error: 'Forbidden - Origin not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, payload.workspace_id, payload.visitor_id)
    if (rateLimit.exceeded) {
      console.error('Rate limit exceeded for visitor:', payload.visitor_id, 'workspace:', payload.workspace_id)
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded - please try again later',
        retry_after_seconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
        },
      })
    }

    // Create visitor ID as phone number placeholder (web-{visitor_id})
    const visitorPhoneNumber = `web-${payload.visitor_id}`

    // Upsert contact for the website visitor
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        workspace_id: payload.workspace_id,
        phone_number: visitorPhoneNumber,
        display_name: payload.visitor_name || `Visitor ${payload.visitor_id.slice(0, 8)}`,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id,phone_number',
      })
      .select('id')
      .single()

    if (contactError) {
      console.error('Error upserting contact:', contactError)
      return new Response(JSON.stringify({ error: 'Failed to create contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find or create chat
    let { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, current_status')
      .eq('workspace_id', payload.workspace_id)
      .eq('contact_id', contact.id)
      .single()

    if (chatError && chatError.code === 'PGRST116') {
      // Chat doesn't exist, create one
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert({
          workspace_id: payload.workspace_id,
          contact_id: contact.id,
          current_status: 'ai',
          last_message_at: new Date().toISOString(),
        })
        .select('id, current_status')
        .single()

      if (newChatError) {
        console.error('Error creating chat:', newChatError)
        return new Response(JSON.stringify({ error: 'Failed to create chat' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      chat = newChat
    } else if (chatError) {
      console.error('Error finding chat:', chatError)
      return new Response(JSON.stringify({ error: 'Failed to find chat' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        workspace_id: payload.workspace_id,
        chat_id: chat!.id,
        contact_id: contact.id,
        direction: 'inbound',
        sender_type: 'customer',
        content_type: payload.content_type || 'text',
        text: payload.message,
        media_url: payload.media_url || null,
      })
      .select('id, created_at')
      .single()

    if (messageError) {
      console.error('Error inserting message:', messageError)
      return new Response(JSON.stringify({ error: 'Failed to send message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update chat with last message time
    await supabase
      .from('chats')
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', chat!.id)

    console.log(`Website message processed successfully for chat ${chat!.id}`)

    return new Response(JSON.stringify({ 
      success: true,
      chat_id: chat!.id,
      message_id: message.id,
      created_at: message.created_at,
      rate_limit_remaining: rateLimit.remaining,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing website chat:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
