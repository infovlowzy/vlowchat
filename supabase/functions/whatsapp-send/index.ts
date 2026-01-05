import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const allowedOrigins = new Set([
  "https://vlowchat.vlowzy.com",
  "http://localhost:5173",
])

function buildCors(req: Request) {
  const origin = req.headers.get("origin") ?? ""
  const allowOrigin = allowedOrigins.has(origin)
    ? origin
    : "https://vlowchat.vlowzy.com"

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  }
}

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  const cors = buildCors(req)

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors)
  }

  try {
    /* ------------------------------------------------------------------ */
    /* ENV CHECK                                                           */
    /* ------------------------------------------------------------------ */
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")
    const waPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(
        { error: "Server misconfigured", details: "Missing Supabase keys" },
        500,
        cors
      )
    }

    if (!waToken || !waPhoneNumberId) {
      return json(
        {
          error: "Server misconfigured",
          details: "Missing WhatsApp credentials",
        },
        500,
        cors
      )
    }

    /* ------------------------------------------------------------------ */
    /* AUTH                                                                */
    /* ------------------------------------------------------------------ */
    // Check for authorization header (Supabase sends it automatically)
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")

    if (!authHeader) {
      console.error("Missing authorization header")
      return json(
        { error: "Unauthorized", details: "Missing authorization header" },
        401,
        cors
      )
    }

    // Ensure the authorization header is properly formatted
    // Supabase client sends it as "Bearer <token>"
    const authToken = authHeader.startsWith("Bearer ")
      ? authHeader
      : `Bearer ${authHeader}`

    // Create Supabase client with user's JWT token
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authToken } },
    })

    // Verify the JWT token and get the user
    const { data: authData, error: authErr } =
      await supabaseUser.auth.getUser()

    if (authErr || !authData?.user) {
      console.error("Auth verification failed:", {
        error: authErr?.message,
        hasUser: !!authData?.user,
        authHeaderPresent: !!authHeader,
      })
      return json(
        {
          error: "Unauthorized",
          details: authErr?.message ?? "Invalid or expired session",
        },
        401,
        cors
      )
    }

    const user = authData.user
    console.log("Authenticated user:", user.id)

    /* ------------------------------------------------------------------ */
    /* BODY VALIDATION                                                     */
    /* ------------------------------------------------------------------ */
    let body: any
    try {
      body = await req.json()
    } catch {
      return json({ error: "Invalid JSON body" }, 400, cors)
    }

    const { chat_id, message } = body

    if (
      !chat_id ||
      typeof chat_id !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      return json(
        {
          error: "Invalid payload",
          details: "chat_id and message must be strings",
        },
        400,
        cors
      )
    }

    /* ------------------------------------------------------------------ */
    /* ADMIN CLIENT                                                        */
    /* ------------------------------------------------------------------ */
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    /* ------------------------------------------------------------------ */
    /* LOAD CHAT                                                           */
    /* ------------------------------------------------------------------ */
    const { data: chat, error: chatErr } = await supabaseAdmin
      .from("chats")
      .select(
        "id, workspace_id, current_status, contact:contacts(id, phone_number)"
      )
      .eq("id", chat_id)
      .single()

    if (chatErr || !chat) {
      return json({ error: "Chat not found" }, 404, cors)
    }

    if (chat.current_status !== "human") {
      return json(
        {
          error: "Chat not available",
          details: "Chat is not in human mode",
        },
        409,
        cors
      )
    }

    /* ------------------------------------------------------------------ */
    /* WORKSPACE MEMBERSHIP                                                */
    /* ------------------------------------------------------------------ */
    const { data: membership } = await supabaseAdmin
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", chat.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return json(
        { error: "Forbidden", details: "Not a workspace member" },
        403,
        cors
      )
    }

    /* ------------------------------------------------------------------ */
    /* SEND WHATSAPP                                                       */
    /* ------------------------------------------------------------------ */
    const contact = chat.contact as { id: string; phone_number: string }
    const isWebsiteChat = contact.phone_number.startsWith("web-")

    let waMessageId: string | null = null

    if (!isWebsiteChat) {
      const waRes = await fetch(
        `https://graph.facebook.com/v18.0/${waPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: contact.phone_number,
            type: "text",
            text: { body: message },
          }),
        }
      )

      const waJson = await waRes.json().catch(() => null)

      if (!waRes.ok) {
        return json(
          {
            error: "WhatsApp API error",
            details: waJson,
          },
          502,
          cors
        )
      }

      waMessageId = waJson?.messages?.[0]?.id ?? null
    }

    /* ------------------------------------------------------------------ */
    /* STORE MESSAGE                                                       */
    /* ------------------------------------------------------------------ */
    const { data: saved, error: saveErr } = await supabaseAdmin
      .from("messages")
      .insert({
        workspace_id: chat.workspace_id,
        chat_id: chat.id,
        contact_id: contact.id,
        direction: "outbound",
        sender_type: "human",
        sender_user_id: user.id,
        content_type: "text",
        text: message,
        wa_message_id: waMessageId,
      })
      .select("id, created_at")
      .single()

    if (saveErr || !saved) {
      return json(
        {
          error: "Database error",
          details: saveErr?.message ?? "Failed to store message",
        },
        500,
        cors
      )
    }

    await supabaseAdmin
      .from("chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", chat.id)

    /* ------------------------------------------------------------------ */
    /* SUCCESS                                                             */
    /* ------------------------------------------------------------------ */
    return json(
      {
        success: true,
        message_id: saved.id,
        wa_message_id: waMessageId,
      },
      200,
      cors
    )
  } catch (err) {
    return json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      500,
      cors
    )
  }
})
