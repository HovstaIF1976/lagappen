import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "npm:@supabase/server@^1"

type DeletePlayerRequest = {
  player_id: string
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        const userId = ctx.userClaims?.id

        if (!userId) {
          return Response.json(
            { error: "Obehörig åtkomst." },
            { status: 401 },
          )
        }

        const {
          data: userProfile,
          error: userError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id, role, team_id")
          .eq("id", userId)
          .maybeSingle()

        if (userError) {
          console.error(
            "User permission check failed:",
            userError,
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
          !userProfile ||
          (
            userProfile.role !== "admin" &&
            userProfile.role !== "coach"
          )
        ) {
          return Response.json(
            {
              error:
                "Du har inte behörighet att ta bort spelare.",
            },
            { status: 403 },
          )
        }

        const body =
          (await req.json()) as DeletePlayerRequest

        const playerId =
          body.player_id?.trim()

        if (!playerId) {
          return Response.json(
            { error: "Spelare saknas." },
            { status: 400 },
          )
        }

        if (playerId === userId) {
          return Response.json(
            {
              error:
                "Du kan inte ta bort ditt eget konto här.",
            },
            { status: 400 },
          )
        }

        const {
          data: playerProfile,
          error: playerError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select(
            "id, full_name, role, team_id",
          )
          .eq("id", playerId)
          .maybeSingle()

        if (playerError) {
          console.error(
            "Player lookup failed:",
            playerError,
          )

          return Response.json(
            {
              error:
                "Kunde inte kontrollera spelaren.",
            },
            { status: 500 },
          )
        }

        if (!playerProfile) {
          return Response.json(
            { error: "Spelaren finns inte." },
            { status: 404 },
          )
        }

        if (playerProfile.role !== "player") {
          return Response.json(
            {
              error:
                "Kontot som valdes är inte ett spelarkonto.",
            },
            { status: 400 },
          )
        }

        if (userProfile.role === "coach") {
          if (!userProfile.team_id) {
            return Response.json(
              {
                error:
                  "Din ledarprofil är inte kopplad till något lag.",
              },
              { status: 403 },
            )
          }

          if (
            playerProfile.team_id !==
            userProfile.team_id
          ) {
            return Response.json(
              {
                error:
                  "Du får bara ta bort spelare från ditt eget lag.",
              },
              { status: 403 },
            )
          }
        }

        /*
         * Vi tar bort Auth-användaren.
         *
         * Spelarprofilen är kopplad till samma UUID.
         * Därefter kontrollerar vi om profilen fortfarande
         * finns och städar den vid behov.
         */

        const {
          error: authDeleteError,
        } =
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            playerId,
          )

        if (authDeleteError) {
          console.error(
            "Auth deletion failed:",
            authDeleteError,
          )

          return Response.json(
            {
              error:
                "Kunde inte ta bort spelarens inloggning.",
            },
            { status: 500 },
          )
        }

        /*
         * Om profilen inte försvinner automatiskt via
         * databasens relationer försöker vi ta bort den.
         */

        const {
          data: remainingProfile,
          error: remainingProfileError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", playerId)
          .maybeSingle()

        if (remainingProfileError) {
          console.error(
            "Profile cleanup check failed:",
            remainingProfileError,
          )

          return Response.json(
            {
              success: true,
              player_id: playerId,
              warning:
                "Inloggningen togs bort men profilrensningen kunde inte kontrolleras.",
            },
            { status: 200 },
          )
        }

        if (remainingProfile) {
          const {
            error: profileDeleteError,
          } = await ctx.supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", playerId)

          if (profileDeleteError) {
            console.error(
              "Profile cleanup failed:",
              profileDeleteError,
            )

            return Response.json(
              {
                success: true,
                player_id: playerId,
                warning:
                  "Inloggningen togs bort men spelarprofilen kunde inte rensas automatiskt.",
              },
              { status: 200 },
            )
          }
        }

        return Response.json(
          {
            success: true,
            player_id: playerId,
            message: `${playerProfile.full_name} har tagits bort.`,
          },
          { status: 200 },
        )
      } catch (error) {
        console.error(
          "Unexpected delete player error:",
          error,
        )

        return Response.json(
          {
            error:
              "Ett oväntat fel uppstod när spelaren skulle tas bort.",
          },
          { status: 500 },
        )
      }
    },
  ),
}
