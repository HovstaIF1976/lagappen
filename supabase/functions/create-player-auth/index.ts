import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "npm:@supabase/server@^1"

type CreatePlayerRequest = {
  full_name: string
  shirt_number?: number | null
  position?: string | null
  team_id?: string | null
  pin: string
}

async function createTechnicalPassword(
  playerId: string,
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
    encoder.encode(playerId),
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        const adminId = ctx.userClaims?.id

        if (!adminId) {
          return Response.json(
            { error: "Obehörig åtkomst." },
            { status: 401 },
          )
        }

        const { data: adminProfile, error: adminError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .select("id, role")
            .eq("id", adminId)
            .maybeSingle()

        if (adminError) {
          console.error("Admin check failed:", adminError)

          return Response.json(
            { error: "Kunde inte kontrollera adminbehörighet." },
            { status: 500 },
          )
        }

        if (!adminProfile || adminProfile.role !== "admin") {
          return Response.json(
            { error: "Endast administratörer får skapa spelare." },
            { status: 403 },
          )
        }

        const body = (await req.json()) as CreatePlayerRequest

        const fullName = body.full_name?.trim()
        const pin = body.pin?.trim()
        const position = body.position?.trim() || null
        const shirtNumber = body.shirt_number ?? null
        const teamId = body.team_id ?? null

        if (!fullName) {
          return Response.json(
            { error: "Spelarens namn saknas." },
            { status: 400 },
          )
        }

        if (!pin || !/^[0-9]{4}$/.test(pin)) {
          return Response.json(
            { error: "PIN måste bestå av exakt fyra siffror." },
            { status: 400 },
          )
        }

        if (
          shirtNumber !== null &&
          (
            !Number.isInteger(shirtNumber) ||
            shirtNumber < 0 ||
            shirtNumber > 999
          )
        ) {
          return Response.json(
            { error: "Ogiltigt tröjnummer." },
            { status: 400 },
          )
        }

        const playerId = crypto.randomUUID()

        const technicalEmail =
          `${playerId}@players.hovsta-if.internal`

        const technicalPassword =
          await createTechnicalPassword(playerId)

        const {
          data: createdAuthUser,
          error: authError,
        } = await ctx.supabaseAdmin.auth.admin.createUser({
          id: playerId,
          email: technicalEmail,
          password: technicalPassword,
          email_confirm: true,
          user_metadata: {
            profile_id: playerId,
            player_name: fullName,
          },
        })

        if (authError || !createdAuthUser.user) {
          console.error("Auth creation failed:", authError)

          return Response.json(
            { error: "Kunde inte skapa spelarens Auth-konto." },
            { status: 500 },
          )
        }

        const { error: profileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .insert({
              id: playerId,
              full_name: fullName,
              role: "player",
              shirt_number: shirtNumber,
              position,
              team_id: teamId,
            })

        if (profileError) {
          console.error("Profile creation failed:", profileError)

          await ctx.supabaseAdmin.auth.admin.deleteUser(playerId)

          return Response.json(
            { error: "Kunde inte skapa spelarprofilen." },
            { status: 500 },
          )
        }

        const { data: pinHash, error: hashError } =
          await ctx.supabaseAdmin.rpc("hash_player_pin", {
            p_pin: pin,
          })

        if (hashError || !pinHash) {
          console.error("PIN hashing failed:", hashError)

          await ctx.supabaseAdmin.auth.admin.deleteUser(playerId)

          return Response.json(
            { error: "Kunde inte skapa spelarens PIN." },
            { status: 500 },
          )
        }

        const { error: credentialsError } =
          await ctx.supabaseAdmin
            .from("player_credentials")
            .insert({
              player_id: playerId,
              pin_hash: pinHash,
            })

        if (credentialsError) {
          console.error(
            "Credential creation failed:",
            credentialsError,
          )

          await ctx.supabaseAdmin.auth.admin.deleteUser(playerId)

          return Response.json(
            { error: "Kunde inte spara spelarens PIN." },
            { status: 500 },
          )
        }

        return Response.json(
          {
            success: true,
            player_id: playerId,
            message: "Spelaren skapades.",
          },
          { status: 201 },
        )
      } catch (error) {
        console.error("Unexpected error:", error)

        return Response.json(
          { error: "Ett oväntat fel uppstod." },
          { status: 500 },
        )
      }
    },
  ),
}
