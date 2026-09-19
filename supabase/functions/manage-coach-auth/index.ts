import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "npm:@supabase/server@^1"

type ManageCoachRequest = {
  action: "update" | "reset_pin" | "delete"
  coach_id: string
  full_name?: string
  team_id?: string
  pin?: string
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

        // Kontrollera att användaren verkligen är admin.
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
                "Kunde inte kontrollera din behörighet.",
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
                "Endast administratörer får hantera ledare.",
            },
            { status: 403 },
          )
        }

        const body =
          (await req.json()) as ManageCoachRequest

        const action = body.action
        const coachId = body.coach_id?.trim()

        if (!coachId) {
          return Response.json(
            { error: "Ledare saknas." },
            { status: 400 },
          )
        }

        if (
          action !== "update" &&
          action !== "reset_pin" &&
          action !== "delete"
        ) {
          return Response.json(
            { error: "Ogiltig åtgärd." },
            { status: 400 },
          )
        }

        // Kontrollera att kontot verkligen är en ledare.
        const {
          data: coachProfile,
          error: coachError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select(
            "id, full_name, role, team_id",
          )
          .eq("id", coachId)
          .maybeSingle()

        if (coachError) {
          console.error(
            "Coach lookup failed:",
            coachError,
          )

          return Response.json(
            {
              error:
                "Kunde inte kontrollera ledaren.",
            },
            { status: 500 },
          )
        }

        if (!coachProfile) {
          return Response.json(
            { error: "Ledaren finns inte." },
            { status: 404 },
          )
        }

        if (coachProfile.role !== "coach") {
          return Response.json(
            {
              error:
                "Kontot som valdes är inte ett ledarkonto.",
            },
            { status: 400 },
          )
        }

        // =================================================
        // REDIGERA NAMN / LAG
        // =================================================

        if (action === "update") {
          const fullName =
            body.full_name?.trim()

          const teamId =
            body.team_id?.trim()

          if (!fullName) {
            return Response.json(
              {
                error:
                  "Ledaren måste ha ett namn.",
              },
              { status: 400 },
            )
          }

          if (!teamId) {
            return Response.json(
              {
                error:
                  "Ledaren måste vara kopplad till ett lag.",
              },
              { status: 400 },
            )
          }

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
              "Team lookup failed:",
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

          const {
            error: updateError,
          } = await ctx.supabaseAdmin
            .from("profiles")
            .update({
              full_name: fullName,
              team_id: teamId,
            })
            .eq("id", coachId)
            .eq("role", "coach")

          if (updateError) {
            console.error(
              "Coach update failed:",
              updateError,
            )

            return Response.json(
              {
                error:
                  "Kunde inte uppdatera ledaren.",
              },
              { status: 500 },
            )
          }

          return Response.json({
            success: true,
            message:
              "Ledaren har uppdaterats.",
          })
        }

        // =================================================
        // NY PIN
        // =================================================

        if (action === "reset_pin") {
          const pin = body.pin?.trim()

          if (
            !pin ||
            !/^[0-9]{4}$/.test(pin)
          ) {
            return Response.json(
              {
                error:
                  "PIN-koden ska innehålla exakt fyra siffror.",
              },
              { status: 400 },
            )
          }

          const {
            data: pinHash,
            error: hashError,
          } = await ctx.supabaseAdmin.rpc(
            "hash_coach_pin",
            {
              p_pin: pin,
            },
          )

          if (hashError || !pinHash) {
            console.error(
              "Coach PIN hash failed:",
              hashError,
            )

            return Response.json(
              {
                error:
                  "Kunde inte skapa den nya PIN-koden.",
              },
              { status: 500 },
            )
          }

          const {
            error: credentialError,
          } = await ctx.supabaseAdmin
            .from("coach_credentials")
            .upsert(
              {
                coach_id: coachId,
                pin_hash: pinHash,
                failed_attempts: 0,
                locked_until: null,
                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict: "coach_id",
              },
            )

          if (credentialError) {
            console.error(
              "Coach credential update failed:",
              credentialError,
            )

            return Response.json(
              {
                error:
                  "Kunde inte uppdatera ledarens PIN-kod.",
              },
              { status: 500 },
            )
          }

          return Response.json({
            success: true,
            message:
              "Ledaren har fått en ny PIN-kod.",
          })
        }

        // =================================================
        // TA BORT LEDARE
        // =================================================

        if (action === "delete") {
          const {
            error: authDeleteError,
          } =
            await ctx.supabaseAdmin.auth.admin.deleteUser(
              coachId,
            )

          if (authDeleteError) {
            console.error(
              "Coach auth deletion failed:",
              authDeleteError,
            )

            return Response.json(
              {
                error:
                  "Kunde inte ta bort ledarens inloggning.",
              },
              { status: 500 },
            )
          }

          // Om profilen inte försvann genom FK/cascade
          // försöker vi städa den separat.
          const {
            data: remainingProfile,
            error: remainingError,
          } = await ctx.supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("id", coachId)
            .maybeSingle()

          if (remainingError) {
            console.error(
              "Coach cleanup check failed:",
              remainingError,
            )

            return Response.json({
              success: true,
              warning:
                "Inloggningen togs bort men profilrensningen kunde inte kontrolleras.",
            })
          }

          if (remainingProfile) {
            const {
              error: profileDeleteError,
            } = await ctx.supabaseAdmin
              .from("profiles")
              .delete()
              .eq("id", coachId)
              .eq("role", "coach")

            if (profileDeleteError) {
              console.error(
                "Coach profile cleanup failed:",
                profileDeleteError,
              )

              return Response.json({
                success: true,
                warning:
                  "Inloggningen togs bort men ledarprofilen kunde inte rensas automatiskt.",
              })
            }
          }

          return Response.json({
            success: true,
            message:
              `${coachProfile.full_name} har tagits bort.`,
          })
        }

        return Response.json(
          { error: "Ogiltig åtgärd." },
          { status: 400 },
        )
      } catch (error) {
        console.error(
          "Unexpected manage coach error:",
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
