import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebsiteChatMessage {
  workspace_id: string
  visitor_id: string
  visitor_name?: string
  message: string
  content_type?: 'text' | 'image' | 'document'
  media_url?: string
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
    const payload: WebsiteChatMessage = await req.json()
    console.log('Received website chat message:', JSON.stringify(payload, null, 2))

    // Validate required fields
    if (!payload.workspace_id || !payload.visitor_id || !payload.message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: workspace_id, visitor_id, message' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})