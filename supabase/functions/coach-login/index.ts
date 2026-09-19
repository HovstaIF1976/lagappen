import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@^2"

type CoachLoginRequest = {
  coach_id: string
  pin: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function createTechnicalPassword(
  coachId: string,
): Promise<string> {
  const secret = Deno.env.get("PLAYER_AUTH_SECRET")

  if (!secret) {
    throw new Error("PLAYER_AUTH_SECRET saknas.")
  }

  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(coachId),
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Endast POST är tillåtet." },
      {
        status: 405,
        headers: corsHeaders,
      },
    )
  }

  try {
    const body = (await req.json()) as CoachLoginRequest

    const coachId = body.coach_id?.trim()
    const pin = body.pin?.trim()

    if (!coachId) {
      return Response.json(
        { error: "Ledare saknas." },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    if (!pin || !/^[0-9]{4}$/.test(pin)) {
      return Response.json(
        { error: "PIN måste bestå av exakt fyra siffror." },
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Supabase-miljövariabler saknas.")
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    const {
      data: verification,
      error: verificationError,
    } = await supabaseAdmin
      .rpc("verify_coach_pin_server", {
        p_coach_id: coachId,
        p_pin: pin,
      })
      .maybeSingle()

    if (verificationError) {
      console.error(
        "Coach PIN verification failed:",
        verificationError,
      )

      return Response.json(
        { error: "Kunde inte kontrollera PIN-koden." },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const pinVerification = verification as {
      success: boolean
      coach_id: string
      locked_until: string | null
    } | null

    if (!pinVerification?.success) {
      if (pinVerification?.locked_until) {
        return Response.json(
          {
            error:
              "För många felaktiga försök. Kontot är tillfälligt låst.",
            locked_until: pinVerification.locked_until,
          },
          {
            status: 429,
            headers: corsHeaders,
          },
        )
      }

      return Response.json(
        { error: "Fel PIN-kod." },
        {
          status: 401,
          headers: corsHeaders,
        },
      )
    }

    const technicalEmail =
      `${coachId}@coaches.hovsta-if.internal`

    const technicalPassword =
      await createTechnicalPassword(coachId)

    const supabaseAuth = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    const {
      data: signInData,
      error: signInError,
    } = await supabaseAuth.auth.signInWithPassword({
      email: technicalEmail,
      password: technicalPassword,
    })

    if (
      signInError ||
      !signInData.session ||
      !signInData.user
    ) {
      console.error(
        "Coach Auth sign-in failed:",
        signInError,
      )

      return Response.json(
        { error: "Kunde inte logga in ledaren." },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    return Response.json(
      {
        success: true,
        user: {
          id: signInData.user.id,
        },
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_in: signInData.session.expires_in,
          expires_at: signInData.session.expires_at,
          token_type: signInData.session.token_type,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (error) {
    console.error(
      "Unexpected coach-login error:",
      error,
    )

    return Response.json(
      { error: "Ett oväntat fel uppstod." },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
