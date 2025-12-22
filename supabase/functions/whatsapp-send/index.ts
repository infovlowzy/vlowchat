import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Exact allowed origins (production)
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://www.lovable.dev',
]

// Pre-compiled regex patterns for subdomain matching (safe patterns)
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-zA-Z0-9-]+\.lovable\.app$/, // *.lovable.app subdomains
  /^https:\/\/[a-zA-Z0-9-]+\.lovable\.dev$/, // *.lovable.dev subdomains
  /^https:\/\/id-preview--[a-zA-Z0-9-]+\.lovable\.app$/, // Preview domains
]

// Specific localhost ports allowed for development
const ALLOWED_DEV_ORIGINS = [
  'http://localhost:5173', // Vite default
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]

// Check if origin is allowed using secure patterns
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // Allow specific dev origins (limited ports)
  if (ALLOWED_DEV_ORIGINS.includes(origin)) {
    return true
  }
  
  // Exact match check for production origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true
  }
  
  // Enforce HTTPS for pattern matching (prevents HTTP attacks)
  if (!origin.startsWith('https://')) {
    return false
  }
  
  // Check pre-compiled safe regex patterns
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin))
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const allowedOrigin = isOriginAllowed(origin) ? origin : null
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface SendMessageRequest {
  chat_id: string
  message: string
  sender_user_id?: string
}

// Validate and sanitize input
function validatePayload(payload: unknown): { valid: boolean; error?: string; data?: SendMessageRequest } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const p = payload as Record<string, unknown>

  // Validate chat_id - must be valid UUID
  if (typeof p.chat_id !== 'string' || !UUID_REGEX.test(p.chat_id)) {
    return { valid: false, error: 'Invalid chat_id format - must be a valid UUID' }
  }

  // Validate message
  if (typeof p.message !== 'string' || p.message.trim().length === 0) {
    return { valid: false, error: 'message is required and must be a non-empty string' }
  }
  if (p.message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `message must be at most ${MAX_MESSAGE_LENGTH} characters` }
  }

  // Validate optional sender_user_id
  let senderUserId: string | undefined
  if (p.sender_user_id !== undefined) {
    if (typeof p.sender_user_id !== 'string' || !UUID_REGEX.test(p.sender_user_id)) {
      return { valid: false, error: 'Invalid sender_user_id format - must be a valid UUID' }
    }
    senderUserId = p.sender_user_id
  }

  return {
    valid: true,
    data: {
      chat_id: p.chat_id,
      message: p.message.trim(),
      sender_user_id: senderUserId,
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Check origin for non-OPTIONS requests
  const origin = req.headers.get('origin')
  if (!isOriginAllowed(origin)) {
    console.error('Request from unauthorized origin:', origin)
    return new Response('Forbidden', { 
      status: 403,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    // 1. Require authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    // 2. Create Supabase client and verify user token
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Invalid auth token:', authError?.message)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Authenticated user:', user.id)

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

    // 3. Validate sender_user_id matches authenticated user (if provided)
    if (payload.sender_user_id && payload.sender_user_id !== user.id) {
      console.error('Sender mismatch: provided', payload.sender_user_id, 'authenticated', user.id)
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Sending WhatsApp message:', JSON.stringify({
      chat_id: payload.chat_id,
      message_length: payload.message.length,
      sender_user_id: user.id,
    }))

    // 4. Get chat with contact info
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        id,
        workspace_id,
        contact:contacts(id, phone_number)
      `)
      .eq('id', payload.chat_id)
      .single()

    if (chatError || !chat) {
      console.error('Chat not found:', chatError)
      return new Response(JSON.stringify({ error: 'Chat not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Verify workspace membership - ensure user belongs to the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_users')
      .select('id')
      .eq('workspace_id', chat.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      console.error('User not a member of workspace:', membershipError?.message || 'No membership found')
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const contactData = chat.contact as unknown as { id: string; phone_number: string }
    
    // Check if this is a website chat (phone starts with "web-")
    const isWebsiteChat = contactData.phone_number.startsWith('web-')

    let waMessageId = null

    // Only send to WhatsApp if it's not a website chat and we have credentials
    if (!isWebsiteChat && whatsappToken && whatsappPhoneNumberId) {
      try {
        const waResponse = await fetch(
          `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: contactData.phone_number,
              type: 'text',
              text: { body: payload.message },
            }),
          }
        )

        if (!waResponse.ok) {
          const errorText = await waResponse.text()
          console.error('WhatsApp API error:', errorText)
          throw new Error(`WhatsApp API error: ${waResponse.status}`)
        }

        const waResult = await waResponse.json()
        waMessageId = waResult.messages?.[0]?.id
        console.log('WhatsApp message sent:', waMessageId)
      } catch (waError) {
        console.error('Failed to send WhatsApp message:', waError)
        // Continue to store message even if WA send fails
      }
    }

    // Sender is always the authenticated user (human)
    const senderType = 'human'

    // Store the outbound message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        workspace_id: chat.workspace_id,
        chat_id: chat.id,
        contact_id: contactData.id,
        direction: 'outbound',
        sender_type: senderType,
        sender_user_id: user.id, // Always use authenticated user
        content_type: 'text',
        text: payload.message,
        wa_message_id: waMessageId,
      })
      .select('id, created_at')
      .single()

    if (messageError) {
      console.error('Error storing message:', messageError)
      return new Response(JSON.stringify({ error: 'Failed to store message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update chat last_message_at
    await supabase
      .from('chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chat.id)

    return new Response(JSON.stringify({ 
      success: true,
      message_id: message.id,
      wa_message_id: waMessageId,
      created_at: message.created_at,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
