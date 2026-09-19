import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@^2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
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

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        team_id,
        teams (
          name
        )
      `)
      .eq("role", "coach")
      .order("full_name", {
        ascending: true,
      })

    if (error) {
      console.error("Could not load coaches:", error)

      return Response.json(
        {
          error: "Kunde inte hämta ledarna.",
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }

    const coaches = (data ?? []).map((coach) => {
      const teamData = coach.teams as
        | { name: string }
        | { name: string }[]
        | null

      const teamName = Array.isArray(teamData)
        ? teamData[0]?.name ?? null
        : teamData?.name ?? null

      return {
        id: coach.id,
        full_name: coach.full_name,
        team_id: coach.team_id,
        team_name: teamName,
      }
    })

    return Response.json(
      {
        success: true,
        coaches,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    )
  } catch (error) {
    console.error("login-coaches error:", error)

    return Response.json(
      {
        error: "Ett oväntat fel uppstod.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
