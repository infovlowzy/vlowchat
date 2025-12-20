import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000
const MAX_VISITOR_ID_LENGTH = 100
const MAX_VISITOR_NAME_LENGTH = 100
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface WebsiteChatMessage {
  workspace_id: string
  visitor_id: string
  visitor_name?: string
  message: string
  content_type?: 'text' | 'image' | 'document'
  media_url?: string
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

    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', payload.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      console.error('Workspace not found:', payload.workspace_id)
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
