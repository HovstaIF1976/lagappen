import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type ManageLeadersProps = {
  onBack: () => void
}

type Team = {
  id: string
  name: string
}

type Leader = {
  id: string
  full_name: string
  team_id: string | null
}

function ManageLeaders({
  onBack,
}: ManageLeadersProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])

  const [fullName, setFullName] = useState("")
  const [teamId, setTeamId] = useState("")
  const [pin, setPin] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] =
    useState("")
  const [successMessage, setSuccessMessage] =
    useState("")

  const loadData = async () => {
    setLoading(true)
    setErrorMessage("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(userError)
      setErrorMessage(
        "Din inloggning kunde inte verifieras."
      )
      setLoading(false)
      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      profileError ||
      !profile ||
      profile.role !== "admin"
    ) {
      console.error(profileError)
      setErrorMessage(
        "Endast administratörer får hantera ledare."
      )
      setLoading(false)
      return
    }

    const [
      { data: teamData, error: teamError },
      { data: leaderData, error: leaderError },
    ] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("role", "coach")
        .order("full_name"),
    ])

    if (teamError) {
      console.error(teamError)
      setErrorMessage(
        "Kunde inte hämta föreningens lag."
      )
      setLoading(false)
      return
    }

    if (leaderError) {
      console.error(leaderError)
      setErrorMessage(
        "Kunde inte hämta ledarna."
      )
      setLoading(false)
      return
    }

    setTeams(teamData ?? [])
    setLeaders(leaderData ?? [])

    if (
      !teamId &&
      teamData &&
      teamData.length > 0
    ) {
      setTeamId(teamData[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const createLeader = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    const cleanName = fullName.trim()
    const cleanPin = pin.trim()

    if (!cleanName) {
      setErrorMessage(
        "Skriv ledarens namn."
      )
      return
    }

    if (!teamId) {
      setErrorMessage(
        "Välj vilket lag ledaren tillhör."
      )
      return
    }

    if (!/^[0-9]{4}$/.test(cleanPin)) {
      setErrorMessage(
        "PIN-koden ska innehålla exakt fyra siffror."
      )
      return
    }

    setSaving(true)

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "create-coach-auth",
        {
          body: {
            full_name: cleanName,
            team_id: teamId,
            pin: cleanPin,
          },
        }
      )

      if (functionError) {
        console.error(
          "Kunde inte skapa ledare:",
          functionError
        )

        let message =
          "Kunde inte skapa ledaren."

        try {
          const context =
            functionError.context

          if (context) {
            const body =
              await context.json()

            if (body?.error) {
              message = body.error
            }
          }
        } catch {
          // Behåll standardmeddelandet.
        }

        setErrorMessage(message)
        setSaving(false)
        return
      }

      if (!data?.success) {
        setErrorMessage(
          data?.error ||
            "Kunde inte skapa ledaren."
        )
        setSaving(false)
        return
      }

      setFullName("")
      setPin("")

      setSuccessMessage(
        `${cleanName} har lagts till som ledare.`
      )

      await loadData()
    } catch (error) {
      console.error(error)
      setErrorMessage(
        "Något gick fel när ledaren skulle skapas."
      )
    } finally {
      setSaving(false)
    }
  }

  const getTeamName = (
    leaderTeamId: string | null
  ) => {
    if (!leaderTeamId) {
      return "Inget lag"
    }

    return (
      teams.find(
        (team) =>
          team.id === leaderTeamId
      )?.name ?? "Okänt lag"
    )
  }

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow:
      "0 3px 14px rgba(18,59,42,0.07)",
    border: "1px solid #edf0ee",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d7ddd9",
    borderRadius: "11px",
    fontSize: "16px",
    background: "white",
    color: "#17202a",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "7px",
    color: "#123b2a",
    fontSize: "14px",
    fontWeight: "bold",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f5",
        fontFamily: "Arial, sans-serif",
        color: "#17202a",
      }}
    >
      <header
        style={{
          background: "#123b2a",
          color: "white",
          borderRadius:
            "0 0 28px 28px",
          boxShadow:
            "0 5px 18px rgba(18,59,42,0.18)",
        }}
      >
        <div
          style={{
            height: "5px",
            background: "#f39200",
          }}
        />

        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding:
              "20px 20px 27px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.1)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.22)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
              marginBottom: "22px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            ← Tillbaka
          </button>

          <p
            style={{
              margin: "0 0 5px",
              color: "#f39200",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            HOVSTA IF
          </p>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "29px",
            }}
          >
            Hantera ledare 👥
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              lineHeight: "1.5",
            }}
          >
            Lägg till ledare och koppla
            dem till rätt lag.
          </p>
        </div>
      </header>

      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <section
          style={{
            ...cardStyle,
            borderTop:
              "4px solid #f39200",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Ny ledare
          </p>

          <h2
            style={{
              margin: "8px 0 18px",
              color: "#123b2a",
            }}
          >
            Lägg till ledare
          </h2>

          <label
            htmlFor="leader-name"
            style={labelStyle}
          >
            Namn
          </label>

          <input
            id="leader-name"
            type="text"
            value={fullName}
            onChange={(event) => {
              setFullName(
                event.target.value
              )
              setErrorMessage("")
              setSuccessMessage("")
            }}
            placeholder="Exempel: Anna Andersson"
            style={inputStyle}
          />

          <label
            htmlFor="leader-team"
            style={{
              ...labelStyle,
              marginTop: "17px",
            }}
          >
            Lag
          </label>

          <select
            id="leader-team"
            value={teamId}
            onChange={(event) => {
              setTeamId(
                event.target.value
              )
              setErrorMessage("")
              setSuccessMessage("")
            }}
            style={inputStyle}
          >
            {teams.length === 0 && (
              <option value="">
                Inga lag finns
              </option>
            )}

            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="leader-pin"
            style={{
              ...labelStyle,
              marginTop: "17px",
            }}
          >
            PIN-kod
          </label>

          <input
            id="leader-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              const value =
                event.target.value.replace(
                  /\D/g,
                  ""
                )

              setPin(value.slice(0, 4))
              setErrorMessage("")
              setSuccessMessage("")
            }}
            placeholder="4 siffror"
            style={inputStyle}
          />

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#6b7280",
              fontSize: "13px",
              lineHeight: "1.45",
            }}
          >
            Ledaren kommer senare att
            kunna logga in med sitt namn
            och denna PIN-kod.
          </p>

          {errorMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#fff0f0",
                border:
                  "1px solid #efcaca",
                borderRadius: "11px",
                color: "#9b2c2c",
                fontSize: "14px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#edf7f1",
                border:
                  "1px solid #cfe4d7",
                borderRadius: "11px",
                color: "#123b2a",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          <button
            onClick={() =>
              void createLeader()
            }
            disabled={
              saving ||
              loading ||
              teams.length === 0
            }
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background:
                saving ||
                loading ||
                teams.length === 0
                  ? "#70877b"
                  : "#123b2a",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              cursor:
                saving ||
                loading ||
                teams.length === 0
                  ? "default"
                  : "pointer",
            }}
          >
            {saving
              ? "Skapar ledare..."
              : "+ Lägg till ledare"}
          </button>
        </section>

        <section style={cardStyle}>
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Föreningen
          </p>

          <h2
            style={{
              margin: "8px 0 16px",
              color: "#123b2a",
            }}
          >
            Ledare
          </h2>

          {loading ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              Laddar ledare...
            </p>
          ) : leaders.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Det finns inga ledare
              registrerade ännu.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {leaders.map(
                (leader) => (
                  <div
                    key={leader.id}
                    style={{
                      padding:
                        "14px 15px",
                      border:
                        "1px solid #e2e7e4",
                      borderRadius:
                        "12px",
                      background:
                        "#fafbfa",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color:
                          "#123b2a",
                        fontWeight:
                          "bold",
                        fontSize:
                          "15px",
                      }}
                    >
                      {leader.full_name}
                    </p>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      {getTeamName(
                        leader.team_id
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <p
          style={{
            margin: "0 0 20px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
            letterSpacing: "0.5px",
          }}
        >
          HOVSTA IF • ADMIN
        </p>
      </main>
    </div>
  )
}

export default ManageLeaders
