import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type PlayerProfileProps = {
  onBack: () => void
}

type Profile = {
  id: string
  full_name: string
  role: string
  shirt_number: number | null
  position: string | null
  team_id: string | null
}

type Team = {
  id: string
  name: string
  club_name: string
}

type CheckIn = {
  id: string
  mood: number
  energy: number
  pain: string | null
  other: string | null
  created_at: string
}

type CheckOut = {
  id: string
  feeling: number
  effort: number
  body: number
  comment: string | null
  created_at: string
}

function PlayerProfile({
  onBack,
}: PlayerProfileProps) {
  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [team, setTeam] =
    useState<Team | null>(null)

  const [checkIns, setCheckIns] =
    useState<CheckIn[]>([])

  const [checkOuts, setCheckOuts] =
    useState<CheckOut[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    const loadProfile = async () => {
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
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, shirt_number, position, team_id"
        )
        .eq("id", user.id)
        .single()

      if (profileError || !profileData) {
        console.error(
          "Profile error:",
          profileError
        )

        setError(
          "Kunde inte hämta din profil."
        )
        setLoading(false)
        return
      }

      setProfile(profileData)

      if (profileData.team_id) {
        const {
          data: teamData,
          error: teamError,
        } = await supabase
          .from("teams")
          .select(
            "id, name, club_name"
          )
          .eq(
            "id",
            profileData.team_id
          )
          .maybeSingle()

        if (teamError) {
          console.error(
            "Team error:",
            teamError
          )
        }

        if (teamData) {
          setTeam(teamData)
        }
      }

      if (profileData.role === "player") {
        const [
          checkInsResult,
          checkOutsResult,
        ] = await Promise.all([
          supabase
            .from("check_ins")
            .select(
              "id, mood, energy, pain, other, created_at"
            )
            .eq(
              "player_id",
              profileData.id
            )
            .order(
              "created_at",
              { ascending: false }
            ),

          supabase
            .from("check_outs")
            .select(
              "id, feeling, effort, body, comment, created_at"
            )
            .eq(
              "player_id",
              profileData.id
            )
            .order(
              "created_at",
              { ascending: false }
            ),
        ])

        if (checkInsResult.error) {
          console.error(
            "Check-in error:",
            checkInsResult.error
          )
        } else {
          setCheckIns(
            checkInsResult.data ?? []
          )
        }

        if (checkOutsResult.error) {
          console.error(
            "Check-out error:",
            checkOutsResult.error
          )
        } else {
          setCheckOuts(
            checkOutsResult.data ?? []
          )
        }
      }

      setLoading(false)
    }

    void loadProfile()
  }, [])

  const getRoleName = (
    role: string
  ) => {
    if (role === "admin") {
      return "Administratör"
    }

    if (role === "coach") {
      return "Ledare"
    }

    return "Spelare"
  }

  const getRoleIcon = (
    role: string
  ) => {
    if (role === "admin") {
      return "🛡️"
    }

    if (role === "coach") {
      return "📋"
    }

    return "⚽"
  }

  const getMoodEmoji = (
    mood: number
  ) => {
    if (mood === 1) return "😞"
    if (mood === 2) return "😕"
    if (mood === 3) return "😐"
    if (mood === 4) return "🙂"
    if (mood === 5) return "😄"

    return "–"
  }

  const getFeelingEmoji = (
    feeling: number
  ) => {
    if (feeling === 1) return "😞"
    if (feeling === 2) return "😕"
    if (feeling === 3) return "😐"
    if (feeling === 4) return "🙂"
    if (feeling === 5) return "😄"

    return "–"
  }

  const formatDate = (
    date: string
  ) => {
    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(date))
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f4f6f5",
    fontFamily: "Arial, sans-serif",
    color: "#17202a",
  }

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.06)",
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
            }}
          >
            Hämtar din profil...
          </section>
        </main>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={pageStyle}>
        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <section style={cardStyle}>
            <h2
              style={{
                color: "#123b2a",
                marginTop: 0,
              }}
            >
              Profil
            </h2>

            <p
              style={{
                color: "#9b2c2c",
              }}
            >
              {error ||
                "Profilen kunde inte hämtas."}
            </p>

            <button
              onClick={onBack}
              style={{
                border: "none",
                borderRadius: "10px",
                background: "#123b2a",
                color: "white",
                padding: "11px 15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ← Tillbaka
            </button>
          </section>
        </main>
      </div>
    )
  }

  const isPlayer =
    profile.role === "player"

  const latestCheckIn =
    checkIns[0] ?? null

  const latestCheckOut =
    checkOuts[0] ?? null

  return (
    <div style={pageStyle}>
      <header
        style={{
          background: "#123b2a",
          color: "white",
          padding: "24px 20px",
          borderRadius:
            "0 0 24px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
              marginBottom: "18px",
            }}
          >
            ← Tillbaka
          </button>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.8,
            }}
          >
            HOVSTA IF •{" "}
            {getRoleName(
              profile.role
            ).toUpperCase()}
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "28px",
            }}
          >
            Min profil 👤
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            Mina uppgifter
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
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                minWidth: "64px",
                borderRadius: "50%",
                background: "#e7f1eb",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                fontSize: "30px",
              }}
            >
              {getRoleIcon(
                profile.role
              )}
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform:
                    "uppercase",
                  fontWeight: "bold",
                }}
              >
                {getRoleName(
                  profile.role
                )}
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#123b2a",
                  wordBreak:
                    "break-word",
                }}
              >
                {profile.full_name}
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                {team
                  ? `${team.club_name} • ${team.name}`
                  : "Hovsta IF"}
              </p>
            </div>
          </div>
        </section>

        {isPlayer ? (
          <>
            <section style={cardStyle}>
              <p
                style={{
                  margin: "0 0 14px",
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing:
                    "0.7px",
                }}
              >
                SPELARUPPGIFTER
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background:
                      "#f4f6f5",
                    borderRadius:
                      "12px",
                    padding: "14px",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "11px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Tröjnummer
                  </span>

                  <strong
                    style={{
                      color:
                        "#123b2a",
                    }}
                  >
                    {profile.shirt_number ??
                      "Inget nr"}
                  </strong>
                </div>

                <div
                  style={{
                    background:
                      "#f4f6f5",
                    borderRadius:
                      "12px",
                    padding: "14px",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#6b7280",
                      fontSize:
                        "11px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Position
                  </span>

                  <strong
                    style={{
                      color:
                        "#123b2a",
                    }}
                  >
                    {profile.position?.trim() ||
                      "Ej angiven"}
                  </strong>
                </div>
              </div>
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
                marginBottom:
                  "16px",
              }}
            >
              <section
                style={{
                  ...cardStyle,
                  marginBottom: 0,
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 6px",
                    color:
                      "#6b7280",
                    fontSize:
                      "12px",
                  }}
                >
                  Check-ins
                </p>

                <strong
                  style={{
                    fontSize:
                      "26px",
                    color:
                      "#123b2a",
                  }}
                >
                  {checkIns.length}
                </strong>
              </section>

              <section
                style={{
                  ...cardStyle,
                  marginBottom: 0,
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 6px",
                    color:
                      "#6b7280",
                    fontSize:
                      "12px",
                  }}
                >
                  Check-outs
                </p>

                <strong
                  style={{
                    fontSize:
                      "26px",
                    color:
                      "#123b2a",
                  }}
                >
                  {checkOuts.length}
                </strong>
              </section>
            </div>

            <div
              style={{
                margin:
                  "28px 0 12px",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing:
                    "0.7px",
                }}
              >
                SENASTE STATUS
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#123b2a",
                  fontSize: "22px",
                }}
              >
                Mina senaste svar
              </h2>
            </div>

            {!latestCheckIn &&
            !latestCheckOut ? (
              <section style={cardStyle}>
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                    textAlign:
                      "center",
                  }}
                >
                  Du har inga
                  registrerade svar
                  ännu.
                </p>
              </section>
            ) : (
              <>
                {latestCheckIn && (
                  <section
                    style={cardStyle}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            color:
                              "#52705f",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          SENASTE CHECK-IN
                        </p>

                        <h3
                          style={{
                            margin: 0,
                            color:
                              "#123b2a",
                          }}
                        >
                          Mående{" "}
                          {
                            latestCheckIn.mood
                          }
                          /5
                        </h3>
                      </div>

                      <span
                        style={{
                          fontSize:
                            "32px",
                        }}
                      >
                        {getMoodEmoji(
                          latestCheckIn.mood
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: "10px",
                        marginTop:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "#f4f6f5",
                          borderRadius:
                            "12px",
                          padding:
                            "12px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6b7280",
                            fontSize:
                              "11px",
                            marginBottom:
                              "4px",
                          }}
                        >
                          Mående
                        </span>

                        <strong>
                          {getMoodEmoji(
                            latestCheckIn.mood
                          )}{" "}
                          {
                            latestCheckIn.mood
                          }
                          /5
                        </strong>
                      </div>

                      <div
                        style={{
                          background:
                            "#f4f6f5",
                          borderRadius:
                            "12px",
                          padding:
                            "12px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6b7280",
                            fontSize:
                              "11px",
                            marginBottom:
                              "4px",
                          }}
                        >
                          Energi
                        </span>

                        <strong>
                          ⚡{" "}
                          {
                            latestCheckIn.energy
                          }
                          /5
                        </strong>
                      </div>
                    </div>

                    <p
                      style={{
                        margin:
                          "14px 0 0",
                        color:
                          "#777",
                        fontSize:
                          "12px",
                      }}
                    >
                      {formatDate(
                        latestCheckIn.created_at
                      )}
                    </p>
                  </section>
                )}

                {latestCheckOut && (
                  <section
                    style={cardStyle}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            color:
                              "#52705f",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          SENASTE CHECK-OUT
                        </p>

                        <h3
                          style={{
                            margin: 0,
                            color:
                              "#123b2a",
                          }}
                        >
                          Efter träning
                        </h3>
                      </div>

                      <span
                        style={{
                          fontSize:
                            "32px",
                        }}
                      >
                        {getFeelingEmoji(
                          latestCheckOut.feeling
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(3, 1fr)",
                        gap: "8px",
                        marginTop:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "#f4f6f5",
                          borderRadius:
                            "12px",
                          padding:
                            "11px 5px",
                          textAlign:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6b7280",
                            fontSize:
                              "10px",
                            marginBottom:
                              "4px",
                          }}
                        >
                          Känsla
                        </span>

                        <strong>
                          {
                            latestCheckOut.feeling
                          }
                          /5
                        </strong>
                      </div>

                      <div
                        style={{
                          background:
                            "#f4f6f5",
                          borderRadius:
                            "12px",
                          padding:
                            "11px 5px",
                          textAlign:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6b7280",
                            fontSize:
                              "10px",
                            marginBottom:
                              "4px",
                          }}
                        >
                          Ansträngning
                        </span>

                        <strong>
                          {
                            latestCheckOut.effort
                          }
                          /5
                        </strong>
                      </div>

                      <div
                        style={{
                          background:
                            "#f4f6f5",
                          borderRadius:
                            "12px",
                          padding:
                            "11px 5px",
                          textAlign:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6b7280",
                            fontSize:
                              "10px",
                            marginBottom:
                              "4px",
                          }}
                        >
                          Kropp
                        </span>

                        <strong>
                          {
                            latestCheckOut.body
                          }
                          /5
                        </strong>
                      </div>
                    </div>

                    <p
                      style={{
                        margin:
                          "14px 0 0",
                        color:
                          "#777",
                        fontSize:
                          "12px",
                      }}
                    >
                      {formatDate(
                        latestCheckOut.created_at
                      )}
                    </p>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
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
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing:
                  "0.7px",
              }}
            >
              {profile.role === "admin"
                ? "ADMINISTRATÖR"
                : "LEDARPROFIL"}
            </p>

            <h2
              style={{
                margin:
                  "0 0 8px",
                color: "#123b2a",
                fontSize: "20px",
              }}
            >
              {profile.full_name}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {profile.role === "admin"
                ? "Du har administratörsbehörighet för Hovsta IF. Spelarhantering och lagfunktioner finns under Ledarläge."
                : `Du är ledare${
                    team
                      ? ` för ${team.name}`
                      : ""
                  }. Spelarhantering och lagfunktioner finns under Ledarläge.`}
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default PlayerProfile
