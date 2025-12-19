import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  chat_id: string
  message: string
  sender_user_id?: string
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
    const payload: SendMessageRequest = await req.json()
    console.log('Sending WhatsApp message:', JSON.stringify(payload, null, 2))

    if (!payload.chat_id || !payload.message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: chat_id, message' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get chat with contact info
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

    // Determine sender type
    const senderType = payload.sender_user_id ? 'human' : 'ai'

    // Store the outbound message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        workspace_id: chat.workspace_id,
        chat_id: chat.id,
        contact_id: contactData.id,
        direction: 'outbound',
        sender_type: senderType,
        sender_user_id: payload.sender_user_id || null,
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
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})