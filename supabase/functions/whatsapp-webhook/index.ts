import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string; mime_type: string; caption?: string }
  document?: { id: string; mime_type: string; filename?: string }
  audio?: { id: string; mime_type: string }
  video?: { id: string; mime_type: string }
}

interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: WhatsAppMessage[]
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)

  // WhatsApp webhook verification (GET request)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified successfully')
      return new Response(challenge, { 
        status: 200,
        headers: corsHeaders 
      })
    } else {
      console.error('WhatsApp webhook verification failed')
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders 
      })
    }
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      const payload: WhatsAppWebhookPayload = await req.json()
      console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2))

      // Validate it's from WhatsApp
      if (payload.object !== 'whatsapp_business_account') {
        return new Response('Invalid payload', { 
          status: 400,
          headers: corsHeaders 
        })
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') continue

          const value = change.value
          const phoneNumberId = value.metadata.phone_number_id
          const businessPhoneNumber = value.metadata.display_phone_number

          // Find workspace by WhatsApp phone number
          const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('whatsapp_phone_number', businessPhoneNumber)
            .single()

          if (workspaceError || !workspace) {
            console.error('Workspace not found for phone:', businessPhoneNumber)
            continue
          }

          const workspaceId = workspace.id

          // Process contacts and messages
          const contacts = value.contacts || []
          const messages = value.messages || []

          for (const message of messages) {
            const contactWaId = message.from
            const contactProfile = contacts.find(c => c.wa_id === contactWaId)
            const contactName = contactProfile?.profile?.name || contactWaId

            // Upsert contact
            const { data: contact, error: contactError } = await supabase
              .from('contacts')
              .upsert({
                workspace_id: workspaceId,
                phone_number: contactWaId,
                display_name: contactName,
                last_seen_at: new Date().toISOString(),
              }, {
                onConflict: 'workspace_id,phone_number',
              })
              .select('id')
              .single()

            if (contactError) {
              console.error('Error upserting contact:', contactError)
              continue
            }

            // Find or create chat
            let { data: chat, error: chatError } = await supabase
              .from('chats')
              .select('id, current_status')
              .eq('workspace_id', workspaceId)
              .eq('contact_id', contact.id)
              .single()

            if (chatError && chatError.code === 'PGRST116') {
              // Chat doesn't exist, create one
              const { data: newChat, error: newChatError } = await supabase
                .from('chats')
                .insert({
                  workspace_id: workspaceId,
                  contact_id: contact.id,
                  current_status: 'ai',
                  last_message_at: new Date().toISOString(),
                })
                .select('id, current_status')
                .single()

              if (newChatError) {
                console.error('Error creating chat:', newChatError)
                continue
              }
              chat = newChat
            } else if (chatError) {
              console.error('Error finding chat:', chatError)
              continue
            }

            // Determine content type
            let contentType = 'text'
            let textContent = ''
            let mediaUrl = ''
            let mediaMimeType = ''

            if (message.text) {
              contentType = 'text'
              textContent = message.text.body
            } else if (message.image) {
              contentType = 'image'
              mediaMimeType = message.image.mime_type
              textContent = message.image.caption || ''
              // TODO: Download media from WhatsApp and store
            } else if (message.document) {
              contentType = 'document'
              mediaMimeType = message.document.mime_type
              textContent = message.document.filename || ''
            } else if (message.audio) {
              contentType = 'audio'
              mediaMimeType = message.audio.mime_type
            } else if (message.video) {
              contentType = 'video'
              mediaMimeType = message.video.mime_type
            } else {
              contentType = 'other'
            }

            // Insert message
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                workspace_id: workspaceId,
                chat_id: chat!.id,
                contact_id: contact.id,
                direction: 'inbound',
                sender_type: 'customer',
                content_type: contentType,
                text: textContent,
                media_url: mediaUrl || null,
                media_mime_type: mediaMimeType || null,
                wa_message_id: message.id,
              })

            if (messageError) {
              console.error('Error inserting message:', messageError)
              continue
            }

            // Update chat with last message time and increment unread
            const currentStatus = chat!.current_status
            const { error: updateChatError } = await supabase
              .from('chats')
              .update({
                last_message_at: new Date().toISOString(),
                unread_count_for_human: (currentStatus === 'human' || currentStatus === 'needs_action') 
                  ? supabase.rpc('increment_unread', { chat_id: chat!.id })
                  : 0,
              })
              .eq('id', chat!.id)

            if (updateChatError) {
              console.error('Error updating chat:', updateChatError)
            }

            console.log(`Message ${message.id} processed successfully for chat ${chat!.id}`)
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error)
      const errMessage = error instanceof Error ? error.message : 'Unknown error'
      return new Response(JSON.stringify({ error: errMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  })
})