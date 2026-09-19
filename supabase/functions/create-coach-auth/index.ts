import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "npm:@supabase/server@^1"

type CreateCoachRequest = {
  full_name: string
  team_id: string
  pin: string
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
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("")
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        const adminId =
          ctx.userClaims?.id

        if (!adminId) {
          return Response.json(
            {
              error:
                "Obehörig åtkomst.",
            },
            { status: 401 },
          )
        }

        /*
          Kontrollera på serversidan att
          personen verkligen är admin.
        */
        const {
          data: adminProfile,
          error: adminError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id, role")
          .eq("id", adminId)
          .maybeSingle()

        if (adminError) {
          console.error(
            "Admin check failed:",
            adminError,
          )

          return Response.json(
            {
              error:
                "Kunde inte kontrollera adminbehörighet.",
            },
            { status: 500 },
          )
        }

        if (
          !adminProfile ||
          adminProfile.role !== "admin"
        ) {
          return Response.json(
            {
              error:
                "Endast administratörer får skapa ledare.",
            },
            { status: 403 },
          )
        }

        const body =
          (await req.json()) as CreateCoachRequest

        const fullName =
          body.full_name?.trim()

        const teamId =
          body.team_id?.trim()

        const pin =
          body.pin?.trim()

        if (!fullName) {
          return Response.json(
            {
              error:
                "Ledarens namn saknas.",
            },
            { status: 400 },
          )
        }

        if (!teamId) {
          return Response.json(
            {
              error:
                "Du måste välja ett lag.",
            },
            { status: 400 },
          )
        }

        if (
          !pin ||
          !/^[0-9]{4}$/.test(pin)
        ) {
          return Response.json(
            {
              error:
                "PIN måste bestå av exakt fyra siffror.",
            },
            { status: 400 },
          )
        }

        /*
          Kontrollera att laget faktiskt finns.
        */
        const {
          data: team,
          error: teamError,
        } = await ctx.supabaseAdmin
          .from("teams")
          .select("id")
          .eq("id", teamId)
          .maybeSingle()

        if (teamError) {
          console.error(
            "Team check failed:",
            teamError,
          )

          return Response.json(
            {
              error:
                "Kunde inte kontrollera laget.",
            },
            { status: 500 },
          )
        }

        if (!team) {
          return Response.json(
            {
              error:
                "Det valda laget finns inte.",
            },
            { status: 400 },
          )
        }

        const coachId =
          crypto.randomUUID()

        /*
          Detta är endast ett tekniskt Auth-konto.
          Ledaren behöver aldrig känna till eller
          använda den här adressen.
        */
        const technicalEmail =
          `${coachId}@coaches.hovsta-if.internal`

        const technicalPassword =
          await createTechnicalPassword(
            coachId
          )

        const {
          data: createdAuthUser,
          error: authError,
        } =
          await ctx.supabaseAdmin.auth.admin
            .createUser({
              id: coachId,
              email: technicalEmail,
              password:
                technicalPassword,
              email_confirm: true,
              user_metadata: {
                profile_id: coachId,
                coach_name: fullName,
              },
            })

        if (
          authError ||
          !createdAuthUser.user
        ) {
          console.error(
            "Coach Auth creation failed:",
            authError,
          )

          return Response.json(
            {
              error:
                "Kunde inte skapa ledarens Auth-konto.",
            },
            { status: 500 },
          )
        }

        /*
          Skapa själva ledarprofilen.
        */
        const { error: profileError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .insert({
              id: coachId,
              full_name: fullName,
              role: "coach",
              shirt_number: null,
              position: null,
              team_id: teamId,
            })

        if (profileError) {
          console.error(
            "Coach profile creation failed:",
            profileError,
          )

          await ctx.supabaseAdmin.auth.admin
            .deleteUser(coachId)

          return Response.json(
            {
              error:
                "Kunde inte skapa ledarprofilen.",
            },
            { status: 500 },
          )
        }

        /*
          Hasha PIN-koden i databasen.
        */
        const {
          data: pinHash,
          error: hashError,
        } = await ctx.supabaseAdmin.rpc(
          "hash_coach_pin",
          {
            p_pin: pin,
          }
        )

        if (
          hashError ||
          !pinHash
        ) {
          console.error(
            "Coach PIN hashing failed:",
            hashError,
          )

          await ctx.supabaseAdmin.auth.admin
            .deleteUser(coachId)

          return Response.json(
            {
              error:
                "Kunde inte skapa ledarens PIN.",
            },
            { status: 500 },
          )
        }

        /*
          Spara endast den hashade PIN-koden.
        */
        const {
          error: credentialsError,
        } = await ctx.supabaseAdmin
          .from("coach_credentials")
          .insert({
            coach_id: coachId,
            pin_hash: pinHash,
          })

        if (credentialsError) {
          console.error(
            "Coach credential creation failed:",
            credentialsError,
          )

          await ctx.supabaseAdmin.auth.admin
            .deleteUser(coachId)

          return Response.json(
            {
              error:
                "Kunde inte spara ledarens PIN.",
            },
            { status: 500 },
          )
        }

        return Response.json(
          {
            success: true,
            coach_id: coachId,
            message:
              "Ledaren skapades.",
          },
          { status: 201 },
        )
      } catch (error) {
        console.error(
          "Unexpected create-coach-auth error:",
          error,
        )

        return Response.json(
          {
            error:
              "Ett oväntat fel uppstod.",
          },
          { status: 500 },
        )
      }
    },
  ),
}
