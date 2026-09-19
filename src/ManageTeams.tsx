import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type ManageTeamsProps = {
  onBack: () => void
}

type Team = {
  id: string
  name: string
  club_name: string
  created_at: string
}

function ManageTeams({
  onBack,
}: ManageTeamsProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [newTeamName, setNewTeamName] =
    useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [isAdmin, setIsAdmin] =
    useState(false)

  const loadTeams = async () => {
    setLoading(true)
    setError("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError(
        "Kunde inte hitta den inloggade användaren."
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
      setError(
        "Endast administratörer kan hantera lag."
      )
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(true)

    const {
      data: teamData,
      error: teamError,
    } = await supabase
      .from("teams")
      .select(
        "id, name, club_name, created_at"
      )
      .order("name", {
        ascending: true,
      })

    if (teamError) {
      console.error(
        "Kunde inte hämta lag:",
        teamError
      )

      setError(
        `Kunde inte hämta lagen: ${teamError.message}`
      )
      setLoading(false)
      return
    }

    setTeams(teamData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadTeams()
  }, [])

  const handleCreateTeam = async () => {
    const name = newTeamName.trim()

    setError("")
    setSuccess("")

    if (!name) {
      setError(
        "Skriv ett namn på laget."
      )
      return
    }

    const alreadyExists =
      teams.some(
        (team) =>
          team.name
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      )

    if (alreadyExists) {
      setError(
        "Det finns redan ett lag med det namnet."
      )
      return
    }

    setCreating(true)

    const {
      data,
      error: createError,
    } = await supabase
      .from("teams")
      .insert({
        name,
        club_name: "Hovsta IF",
      })
      .select(
        "id, name, club_name, created_at"
      )

    setCreating(false)

    if (createError) {
      console.error(
        "Kunde inte skapa lag:",
        createError
      )

      setError(
        `Kunde inte skapa laget: ${createError.message}`
      )
      return
    }

    const createdTeam =
      data?.[0] ?? null

    if (!createdTeam) {
      setError(
        "Laget skapades inte som förväntat."
      )
      return
    }

    setTeams((current) =>
      [...current, createdTeam].sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "sv"
          )
      )
    )

    setNewTeamName("")
    setSuccess(
      `${createdTeam.name} har lagts till.`
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
            padding: "20px 20px 27px",
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
              fontWeight: "bold",
            }}
          >
            ← Tillbaka
          </button>

          <p
            style={{
              margin: 0,
              color: "#f39200",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            HOVSTA IF • ADMIN
          </p>

          <h1
            style={{
              margin: "8px 0 5px",
              fontSize: "29px",
            }}
          >
            Hantera lag 🏟️
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              lineHeight: 1.5,
            }}
          >
            Lägg till och se föreningens lag.
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
        {loading ? (
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
            }}
          >
            <strong
              style={{
                color: "#123b2a",
              }}
            >
              Hämtar lag...
            </strong>
          </section>
        ) : !isAdmin ? (
          <section style={cardStyle}>
            <strong
              style={{
                color: "#9b2c2c",
              }}
            >
              {error}
            </strong>
          </section>
        ) : (
          <>
            <section
              style={{
                ...cardStyle,
                borderTop:
                  "4px solid #f39200",
              }}
            >
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform:
                    "uppercase",
                }}
              >
                Nytt lag
              </p>

              <h2
                style={{
                  margin:
                    "7px 0 16px",
                  color: "#123b2a",
                }}
              >
                + Lägg till lag
              </h2>

              <label
                style={{
                  display: "block",
                  color: "#123b2a",
                  fontWeight: "bold",
                  fontSize: "13px",
                  marginBottom: "7px",
                }}
              >
                Lagnamn
              </label>

              <input
                value={newTeamName}
                onChange={(event) => {
                  setNewTeamName(
                    event.target.value
                  )
                  setError("")
                  setSuccess("")
                }}
                placeholder="Exempel: P2013/2014"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  padding: "13px",
                  borderRadius: "11px",
                  border:
                    "1px solid #d7ddd9",
                  fontSize: "16px",
                  marginBottom: "12px",
                }}
              />

              <div
                style={{
                  background: "#f4f6f5",
                  borderRadius: "11px",
                  padding: "12px",
                  marginBottom: "15px",
                  color: "#526158",
                  fontSize: "13px",
                }}
              >
                Klubb:{" "}
                <strong>
                  Hovsta IF
                </strong>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fff1f1",
                    border:
                      "1px solid #ead0d0",
                    color: "#9b2c2c",
                    padding: "11px",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    background: "#e7f1eb",
                    border:
                      "1px solid #c9ded1",
                    color: "#123b2a",
                    padding: "11px",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  ✓ {success}
                </div>
              )}

              <button
                onClick={() =>
                  void handleCreateTeam()
                }
                disabled={creating}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "none",
                  borderRadius: "12px",
                  background:
                    creating
                      ? "#80958a"
                      : "#123b2a",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor:
                    creating
                      ? "default"
                      : "pointer",
                }}
              >
                {creating
                  ? "Skapar lag..."
                  : "+ Skapa lag"}
              </button>
            </section>

            <div
              style={{
                margin:
                  "28px 0 13px",
              }}
            >
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#123b2a",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.7px",
                }}
              >
                Föreningen
              </p>

              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                }}
              >
                Alla lag ({teams.length})
              </h2>
            </div>

            {teams.length === 0 ? (
              <section style={cardStyle}>
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                    textAlign: "center",
                  }}
                >
                  Inga lag finns ännu.
                </p>
              </section>
            ) : (
              teams.map((team) => (
                <section
                  key={team.id}
                  style={cardStyle}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        minWidth:
                          "48px",
                        borderRadius:
                          "14px",
                        background:
                          "#edf4f0",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize:
                          "22px",
                      }}
                    >
                      ⚽
                    </div>

                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 4px",
                          color:
                            "#123b2a",
                          fontSize:
                            "17px",
                        }}
                      >
                        {team.name}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color:
                            "#6b7280",
                          fontSize:
                            "13px",
                        }}
                      >
                        {team.club_name}
                      </p>
                    </div>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ManageTeams
