import { useEffect, useState, type CSSProperties } from "react"
import { supabase } from "./supabase"

type PlayersProps = {
  onBack: () => void
}

type Player = {
  id: string
  name: string
  number: number
  position: string
}

type CheckInData = {
  id: string
  playerId: string
  mood: number | null
  moodReason: string
  energy: number | null
  pain: string
  other: string
  date: string
}

type CheckOutData = {
  id: string
  playerId: string
  feeling: number
  effort: number
  body: number
  comment: string
  date: string
}

type ProfileTab = "checkin" | "checkout"

function Players({ onBack }: PlayersProps) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null)

  const [profileTab, setProfileTab] =
    useState<ProfileTab>("checkin")

  const [players, setPlayers] = useState<Player[]>([])
  const [checkIns, setCheckIns] = useState<CheckInData[]>([])
  const [checkOuts, setCheckOuts] = useState<CheckOutData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true)
      setError("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Du behöver vara inloggad för att se spelarna.")
        setLoading(false)
        return
      }

      const { data: ownProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", user.id)
          .single()

      if (profileError || !ownProfile) {
        setError("Kunde inte läsa din ledarprofil.")
        setLoading(false)
        return
      }

      if (
        ownProfile.role !== "coach" &&
        ownProfile.role !== "admin"
      ) {
        setError("Du har inte behörighet att se spelaröversikten.")
        setLoading(false)
        return
      }

      if (!ownProfile.team_id) {
        setError("Din ledarprofil är inte kopplad till något lag ännu.")
        setLoading(false)
        return
      }

      const [
        playersResult,
        checkInsResult,
        checkOutsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, shirt_number, position")
          .eq("team_id", ownProfile.team_id)
          .eq("role", "player")
          .order("shirt_number", {
            ascending: true,
            nullsFirst: false,
          }),
        supabase
          .from("check_ins")
          .select(
            "id, player_id, mood, mood_reason, energy, pain, other, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("check_outs")
          .select(
            "id, player_id, feeling, effort, body, comment, created_at"
          )
          .order("created_at", { ascending: false }),
      ])

      if (playersResult.error) {
        setError(
          `Kunde inte hämta spelartruppen: ${playersResult.error.message}`
        )
        setLoading(false)
        return
      }

      if (checkInsResult.error) {
        setError(
          `Kunde inte hämta check-ins: ${checkInsResult.error.message}`
        )
        setLoading(false)
        return
      }

      if (checkOutsResult.error) {
        setError(
          `Kunde inte hämta check-outs: ${checkOutsResult.error.message}`
        )
        setLoading(false)
        return
      }

      const loadedPlayers: Player[] = (
        playersResult.data ?? []
      ).map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        number: profile.shirt_number ?? 0,
        position: profile.position?.trim() || "Ej angiven",
      }))

      const playerIds = new Set(
        loadedPlayers.map((player) => player.id)
      )

      const loadedCheckIns: CheckInData[] = (
        checkInsResult.data ?? []
      )
        .filter((item) => playerIds.has(item.player_id))
        .map((item) => ({
          id: item.id,
          playerId: item.player_id,
          mood: item.mood,
          moodReason: item.mood_reason ?? "",
          energy: item.energy,
          pain: item.pain ?? "",
          other: item.other ?? "",
          date: item.created_at,
        }))

      const loadedCheckOuts: CheckOutData[] = (
        checkOutsResult.data ?? []
      )
        .filter((item) => playerIds.has(item.player_id))
        .map((item) => ({
          id: item.id,
          playerId: item.player_id,
          feeling: item.feeling,
          effort: item.effort,
          body: item.body,
          comment: item.comment ?? "",
          date: item.created_at,
        }))

      setPlayers(loadedPlayers)
      setCheckIns(loadedCheckIns)
      setCheckOuts(loadedCheckOuts)
      setLoading(false)
    }

    void loadPlayers()
  }, [])

  const getPlayerCheckIns = (player: Player) => {
    return checkIns
      .filter(
        (checkIn) => checkIn.playerId === player.id
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
  }

  const getPlayerCheckOuts = (player: Player) => {
    return checkOuts
      .filter(
        (checkOut) => checkOut.playerId === player.id
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
  }

  const getLatestCheckIn = (player: Player) => {
    return getPlayerCheckIns(player)[0] ?? null
  }

  const getLatestCheckOut = (player: Player) => {
    return getPlayerCheckOuts(player)[0] ?? null
  }

  const hasPain = (checkIn: CheckInData) => {
    const pain =
      checkIn.pain?.trim().toLowerCase() ?? ""

    return (
      pain !== "" &&
      pain !== "inget" &&
      pain !== "nej" &&
      pain !== "ingen" &&
      pain !== "ingenting"
    )
  }

  const getStatus = (
    checkIn: CheckInData | null
  ) => {
    if (!checkIn) {
      return {
        text: "Ingen check-in",
        background: "#f1f3f4",
        color: "#6b7280",
        border: "#e3e6e4",
      }
    }

    if (
      (checkIn.mood !== null &&
        checkIn.mood <= 2) ||
      (checkIn.energy !== null &&
        checkIn.energy <= 2) ||
      hasPain(checkIn)
    ) {
      return {
        text: "Behöver uppmärksamhet",
        background: "#fff1f1",
        color: "#9b2c2c",
        border: "#ead0d0",
      }
    }

    if (
      checkIn.mood === 3 ||
      checkIn.energy === 3
    ) {
      return {
        text: "Följ upp",
        background: "#fff8e7",
        color: "#806522",
        border: "#ead9a5",
      }
    }

    return {
      text: "Ser bra ut",
      background: "#e7f1eb",
      color: "#123b2a",
      border: "#cfe0d5",
    }
  }

  const getMoodEmoji = (
    mood: number | null
  ) => {
    if (mood === 1) return "😞"
    if (mood === 2) return "😕"
    if (mood === 3) return "😐"
    if (mood === 4) return "🙂"
    if (mood === 5) return "😄"

    return "–"
  }

  const getMoodText = (
    mood: number | null
  ) => {
    if (mood === 1) return "Inte bra"
    if (mood === 2) return "Sådär"
    if (mood === 3) return "Okej"
    if (mood === 4) return "Bra"
    if (mood === 5) return "Jättebra"

    return "Ej svarat"
  }

  const getEnergyEmoji = (
    energy: number | null
  ) => {
    if (energy === 1) return "🪫"
    if (energy === 2) return "🔋"
    if (energy === 3) return "🔋"
    if (energy === 4) return "🔋"
    if (energy === 5) return "⚡"

    return "–"
  }

  const getFeelingEmoji = (feeling: number) => {
    if (feeling === 1) return "😞"
    if (feeling === 2) return "😕"
    if (feeling === 3) return "😐"
    if (feeling === 4) return "🙂"
    if (feeling === 5) return "😄"

    return "–"
  }

  const formatResponseTime = (date: string) => {
    if (!date) {
      return ""
    }

    const dateObject = new Date(date)

    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObject)
  }

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "#f4f6f5",
    fontFamily: "Arial, sans-serif",
    color: "#17202a",
  }

  const mainStyle: CSSProperties = {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
  }

  const cardStyle: CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #edf0ee",
    boxShadow:
      "0 3px 14px rgba(18,59,42,0.07)",
  }

  const Header = ({
    eyebrow,
    title,
    subtitle,
    onHeaderBack,
    backText = "Tillbaka",
  }: {
    eyebrow: string
    title: string
    subtitle: string
    onHeaderBack: () => void
    backText?: string
  }) => {
    return (
      <header
        style={{
          background: "#123b2a",
          color: "white",
          borderRadius: "0 0 28px 28px",
          overflow: "hidden",
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
            onClick={onHeaderBack}
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
            ← {backText}
          </button>

          <p
            style={{
              margin: 0,
              color: "#f39200",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>

          <h1
            style={{
              margin: "7px 0 6px",
              fontSize: "29px",
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {subtitle}
          </p>
        </div>
      </header>
    )
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Hovsta IF • Ledarläge"
          title="Spelare 👥"
          subtitle="Hämtar truppen..."
          onHeaderBack={onBack}
        />
        <main style={mainStyle}>
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Hämtar spelare och svar...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Hovsta IF • Ledarläge"
          title="Spelare 👥"
          subtitle="Kunde inte läsa spelaröversikten."
          onHeaderBack={onBack}
        />
        <main style={mainStyle}>
          <section
            style={{
              ...cardStyle,
              borderTop: "4px solid #9b2c2c",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#9b2c2c",
                marginBottom: "8px",
              }}
            >
              Något gick fel
            </strong>
            <p style={{ margin: 0, color: "#666" }}>
              {error}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (selectedPlayer) {
    const latestCheckIn =
      getLatestCheckIn(selectedPlayer)

    const latestCheckOut =
      getLatestCheckOut(selectedPlayer)

    const playerCheckIns =
      getPlayerCheckIns(selectedPlayer)

    const playerCheckOuts =
      getPlayerCheckOuts(selectedPlayer)

    const status = getStatus(latestCheckIn)

    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Hovsta IF • Spelarprofil"
          title={selectedPlayer.name}
          subtitle={`#${selectedPlayer.number} • ${selectedPlayer.position}`}
          backText="Alla spelare"
          onHeaderBack={() => {
            setSelectedPlayer(null)
            setProfileTab("checkin")
          }}
        />

        <main style={mainStyle}>
          <section
            style={{
              ...cardStyle,
              borderTop: "4px solid #f39200",
            }}
          >
            <p
              style={{
                margin: "0 0 13px",
                color: "#6b7280",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Spelarinformation
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                style={{
                  width: "62px",
                  height: "62px",
                  minWidth: "62px",
                  borderRadius: "18px",
                  background: "#123b2a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  boxShadow:
                    "0 4px 12px rgba(18,59,42,0.16)",
                }}
              >
                {selectedPlayer.number}
              </div>

              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: "0 0 5px",
                    color: "#123b2a",
                    fontSize: "21px",
                  }}
                >
                  {selectedPlayer.name}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  #{selectedPlayer.number} •{" "}
                  {selectedPlayer.position}
                </p>
              </div>
            </div>
          </section>

          <section
            style={{
              ...cardStyle,
              padding: "7px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "7px",
            }}
          >
            <button
              onClick={() =>
                setProfileTab("checkin")
              }
              style={{
                padding: "13px 7px",
                border: "none",
                borderRadius: "12px",
                background:
                  profileTab === "checkin"
                    ? "#123b2a"
                    : "transparent",
                color:
                  profileTab === "checkin"
                    ? "white"
                    : "#5f6663",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💚 Check-in ({playerCheckIns.length})
            </button>

            <button
              onClick={() =>
                setProfileTab("checkout")
              }
              style={{
                padding: "13px 7px",
                border: "none",
                borderRadius: "12px",
                background:
                  profileTab === "checkout"
                    ? "#123b2a"
                    : "transparent",
                color:
                  profileTab === "checkout"
                    ? "white"
                    : "#5f6663",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              👋 Check-out ({playerCheckOuts.length})
            </button>
          </section>

          {profileTab === "checkin" ? (
            <>
              <div
                style={{
                  margin: "5px 0 14px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#123b2a",
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Före träning
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Senaste check-in
                </h2>
              </div>

              {latestCheckIn ? (
                <section
                  style={{
                    ...cardStyle,
                    borderTop: `4px solid ${status.color}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        Senast inskickad
                      </p>

                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#17202a",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        {formatResponseTime(
                          latestCheckIn.date
                        )}
                      </p>
                    </div>

                    <span
                      style={{
                        background:
                          status.background,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                        borderRadius: "999px",
                        padding: "7px 9px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {status.text}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 5px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          marginBottom: "7px",
                        }}
                      >
                        {getMoodEmoji(
                          latestCheckIn.mood
                        )}
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "10px",
                        }}
                      >
                        Mående
                      </p>

                      <strong
                        style={{
                          fontSize: "11px",
                        }}
                      >
                        {getMoodText(
                          latestCheckIn.mood
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 5px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          marginBottom: "7px",
                        }}
                      >
                        {getEnergyEmoji(
                          latestCheckIn.energy
                        )}
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "10px",
                        }}
                      >
                        Energi
                      </p>

                      <strong
                        style={{
                          fontSize: "11px",
                        }}
                      >
                        {latestCheckIn.energy ?? "–"}/5
                      </strong>
                    </div>

                    <div
                      style={{
                        background: hasPain(
                          latestCheckIn
                        )
                          ? "#fff1f1"
                          : "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 5px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          marginBottom: "7px",
                        }}
                      >
                        {hasPain(latestCheckIn)
                          ? "⚠️"
                          : "✓"}
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "10px",
                        }}
                      >
                        Känning
                      </p>

                      <strong
                        style={{
                          color: hasPain(
                            latestCheckIn
                          )
                            ? "#9b2c2c"
                            : "#123b2a",
                          fontSize: "11px",
                        }}
                      >
                        {hasPain(latestCheckIn)
                          ? "Angiven"
                          : "Ingen"}
                      </strong>
                    </div>
                  </div>

                  {hasPain(latestCheckIn) && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "13px",
                        borderRadius: "12px",
                        background: "#fff7f7",
                        border:
                          "1px solid #ead0d0",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#9b2c2c",
                          fontSize: "12px",
                          marginBottom: "5px",
                        }}
                      >
                        🩹 Angiven känning
                      </strong>

                      <p
                        style={{
                          margin: 0,
                          color: "#8b3434",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          fontSize: "14px",
                        }}
                      >
                        {latestCheckIn.pain}
                      </p>
                    </div>
                  )}

                  {latestCheckIn.moodReason
                    ?.trim() !== "" && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "13px",
                        borderRadius: "12px",
                        background: "#fff8e7",
                        border:
                          "1px solid #ead9a5",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#806522",
                          fontSize: "12px",
                          marginBottom: "5px",
                        }}
                      >
                        💬 Kommentar om måendet
                      </strong>

                      <p
                        style={{
                          margin: 0,
                          color: "#5f5743",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          fontSize: "14px",
                        }}
                      >
                        {latestCheckIn.moodReason}
                      </p>
                    </div>
                  )}

                  {latestCheckIn.other?.trim() !==
                    "" && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "13px",
                        borderRadius: "12px",
                        background: "#f7f9f8",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#555",
                          fontSize: "12px",
                          marginBottom: "5px",
                        }}
                      >
                        📝 Övrigt
                      </strong>

                      <p
                        style={{
                          margin: 0,
                          color: "#555",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          fontSize: "14px",
                        }}
                      >
                        {latestCheckIn.other}
                      </p>
                    </div>
                  )}
                </section>
              ) : (
                <section
                  style={{
                    ...cardStyle,
                    textAlign: "center",
                    padding: "30px 20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      marginBottom: "10px",
                    }}
                  >
                    💚
                  </div>

                  <h3
                    style={{
                      margin: "0 0 7px",
                      color: "#123b2a",
                    }}
                  >
                    Ingen check-in ännu
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Spelaren har ännu inte lämnat
                    någon check-in.
                  </p>
                </section>
              )}

              <div
                style={{
                  margin: "25px 0 13px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#123b2a",
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Historik
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "21px",
                  }}
                >
                  Senaste check-ins
                </h2>
              </div>

              {playerCheckIns.length > 0 ? (
                playerCheckIns.map((checkIn) => {
                  const checkInStatus =
                    getStatus(checkIn)

                  return (
                    <section
                      key={checkIn.id}
                      style={{
                        ...cardStyle,
                        padding: "16px",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "43px",
                            height: "43px",
                            minWidth: "43px",
                            borderRadius: "13px",
                            background: "#f4f6f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                          }}
                        >
                          {getMoodEmoji(
                            checkIn.mood
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <strong
                            style={{
                              display: "block",
                              color: "#123b2a",
                              fontSize: "14px",
                              marginBottom: "4px",
                            }}
                          >
                            {getMoodText(
                              checkIn.mood
                            )}{" "}
                            • Energi{" "}
                            {checkIn.energy ?? "–"}/5
                          </strong>

                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: "11px",
                            }}
                          >
                            {formatResponseTime(
                              checkIn.date
                            )}
                          </span>
                        </div>

                        {hasPain(checkIn) && (
                          <span
                            style={{
                              fontSize: "18px",
                            }}
                          >
                            ⚠️
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-block",
                            background:
                              checkInStatus.background,
                            color:
                              checkInStatus.color,
                            border: `1px solid ${checkInStatus.border}`,
                            borderRadius: "999px",
                            padding: "5px 8px",
                            fontSize: "9px",
                            fontWeight: "bold",
                          }}
                        >
                          {checkInStatus.text}
                        </span>
                      </div>
                    </section>
                  )
                })
              ) : (
                <section style={cardStyle}>
                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Ingen check-in-historik ännu.
                  </p>
                </section>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  margin: "5px 0 14px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#123b2a",
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Efter träning
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Senaste check-out
                </h2>
              </div>

              {latestCheckOut ? (
                <section
                  style={{
                    ...cardStyle,
                    borderTop:
                      "4px solid #f39200",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 17px",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    {formatResponseTime(
                      latestCheckOut.date
                    )}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 4px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "29px",
                          marginBottom: "7px",
                        }}
                      >
                        {getFeelingEmoji(
                          latestCheckOut.feeling
                        )}
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "9px",
                        }}
                      >
                        Känsla
                      </p>

                      <strong
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {latestCheckOut.feeling}/5
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 4px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "29px",
                          marginBottom: "7px",
                        }}
                      >
                        🔥
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "9px",
                        }}
                      >
                        Ansträngning
                      </p>

                      <strong
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {latestCheckOut.effort}/5
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9f8",
                        borderRadius: "14px",
                        padding: "15px 4px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "29px",
                          marginBottom: "7px",
                        }}
                      >
                        💪
                      </div>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#6b7280",
                          fontSize: "9px",
                        }}
                      >
                        Kropp
                      </p>

                      <strong
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {latestCheckOut.body}/5
                      </strong>
                    </div>
                  </div>

                  {latestCheckOut.comment?.trim() !==
                    "" && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "13px",
                        borderRadius: "12px",
                        background: "#fff8e7",
                        border:
                          "1px solid #ead9a5",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#806522",
                          fontSize: "12px",
                          marginBottom: "5px",
                        }}
                      >
                        💬 Kommentar
                      </strong>

                      <p
                        style={{
                          margin: 0,
                          color: "#5f5743",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          fontSize: "14px",
                        }}
                      >
                        {latestCheckOut.comment}
                      </p>
                    </div>
                  )}
                </section>
              ) : (
                <section
                  style={{
                    ...cardStyle,
                    textAlign: "center",
                    padding: "30px 20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      marginBottom: "10px",
                    }}
                  >
                    👋
                  </div>

                  <h3
                    style={{
                      margin: "0 0 7px",
                      color: "#123b2a",
                    }}
                  >
                    Ingen check-out ännu
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Spelaren har ännu inte lämnat
                    någon check-out.
                  </p>
                </section>
              )}

              <div
                style={{
                  margin: "25px 0 13px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#123b2a",
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Historik
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "21px",
                  }}
                >
                  Senaste check-outs
                </h2>
              </div>

              {playerCheckOuts.length > 0 ? (
                playerCheckOuts.map(
                  (checkOut) => (
                    <section
                      key={checkOut.id}
                      style={{
                        ...cardStyle,
                        padding: "16px",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "43px",
                            height: "43px",
                            minWidth: "43px",
                            borderRadius: "13px",
                            background: "#f4f6f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                          }}
                        >
                          {getFeelingEmoji(
                            checkOut.feeling
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <strong
                            style={{
                              display: "block",
                              color: "#123b2a",
                              fontSize: "14px",
                              marginBottom: "4px",
                            }}
                          >
                            Känsla{" "}
                            {checkOut.feeling}/5
                          </strong>

                          <span
                            style={{
                              display: "block",
                              color: "#6b7280",
                              fontSize: "11px",
                              lineHeight: "1.5",
                            }}
                          >
                            Ansträngning{" "}
                            {checkOut.effort}/5 •
                            Kropp{" "}
                            {checkOut.body}/5
                          </span>

                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "#9aa29d",
                              fontSize: "10px",
                            }}
                          >
                            {formatResponseTime(
                              checkOut.date
                            )}
                          </span>
                        </div>
                      </div>
                    </section>
                  )
                )
              ) : (
                <section style={cardStyle}>
                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Ingen check-out-historik ännu.
                  </p>
                </section>
              )}
            </>
          )}

          {(playerCheckIns.length > 0 ||
            playerCheckOuts.length > 0) && (
            <p
              style={{
                margin: "20px 5px 25px",
                color: "#8b938e",
                fontSize: "11px",
                lineHeight: "1.5",
                textAlign: "center",
              }}
            >
              Individuella
              svar endast så länge de finns kvar inom
              lagets gallringsperiod.
            </p>
          )}

          <p
            style={{
              margin: "0 0 20px",
              textAlign: "center",
              color: "#9aa29d",
              fontSize: "11px",
              letterSpacing: "0.5px",
            }}
          >
            HOVSTA IF • LEDARLÄGE
          </p>
        </main>
      </div>
    )
  }

  const playersWithAttention = players.filter(
    (player) => {
      const latest = getLatestCheckIn(player)

      if (!latest) return false

      return (
        getStatus(latest).text ===
        "Behöver uppmärksamhet"
      )
    }
  ).length

  const playersToFollowUp = players.filter(
    (player) => {
      const latest = getLatestCheckIn(player)

      if (!latest) return false

      return getStatus(latest).text === "Följ upp"
    }
  ).length

  const playersWithCheckIn = players.filter(
    (player) => getLatestCheckIn(player) !== null
  ).length

  return (
    <div style={pageStyle}>
      <Header
        eyebrow="Hovsta IF • Ledarläge"
        title="Spelare 👥"
        subtitle="Truppöversikt och aktuell spelarstatus."
        onHeaderBack={onBack}
      />

      <main style={mainStyle}>
        <section
          style={{
            ...cardStyle,
            borderTop: "4px solid #f39200",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              marginBottom: "17px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Truppen
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#123b2a",
                  fontSize: "22px",
                }}
              >
                {players.length} spelare
              </h2>
            </div>

            <span
              style={{
                background: "#edf4f0",
                color: "#123b2a",
                borderRadius: "999px",
                padding: "7px 10px",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              Aktuell trupp
            </span>
          </div>

          <p
            style={{
              margin: "0 0 17px",
              color: "#6b7280",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            Testspelarna ersätts senare av riktiga
            spelarkonton.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            <div
              style={{
                background: "#edf4f0",
                borderRadius: "13px",
                padding: "12px 5px",
                textAlign: "center",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#123b2a",
                  fontSize: "20px",
                  marginBottom: "3px",
                }}
              >
                {playersWithCheckIn}
              </strong>

              <span
                style={{
                  color: "#526158",
                  fontSize: "9px",
                }}
              >
                Med check-in
              </span>
            </div>

            <div
              style={{
                background: "#fff8e7",
                borderRadius: "13px",
                padding: "12px 5px",
                textAlign: "center",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#806522",
                  fontSize: "20px",
                  marginBottom: "3px",
                }}
              >
                {playersToFollowUp}
              </strong>

              <span
                style={{
                  color: "#806522",
                  fontSize: "9px",
                }}
              >
                Följ upp
              </span>
            </div>

            <div
              style={{
                background: "#fff1f1",
                borderRadius: "13px",
                padding: "12px 5px",
                textAlign: "center",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#9b2c2c",
                  fontSize: "20px",
                  marginBottom: "3px",
                }}
              >
                {playersWithAttention}
              </strong>

              <span
                style={{
                  color: "#9b2c2c",
                  fontSize: "9px",
                }}
              >
                Uppmärksamma
              </span>
            </div>
          </div>
        </section>

        <div
          style={{
            margin: "25px 0 14px",
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              color: "#123b2a",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            }}
          >
            Trupp
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            Alla spelare
          </h2>
        </div>

        {players.map((player) => {
          const latestCheckIn =
            getLatestCheckIn(player)

          const latestCheckOut =
            getLatestCheckOut(player)

          const status =
            getStatus(latestCheckIn)

          return (
            <button
              key={player.id}
              onClick={() => {
                setSelectedPlayer(player)
                setProfileTab("checkin")
              }}
              style={{
                width: "100%",
                display: "block",
                textAlign: "left",
                background: "white",
                border: `1px solid ${status.border}`,
                borderRadius: "18px",
                padding: "17px",
                marginBottom: "11px",
                boxShadow:
                  "0 3px 12px rgba(18,59,42,0.06)",
                cursor: "pointer",
                color: "#17202a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    minWidth: "50px",
                    borderRadius: "15px",
                    background: "#123b2a",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {player.number}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 4px",
                      color: "#123b2a",
                      fontSize: "17px",
                    }}
                  >
                    {player.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    #{player.number} •{" "}
                    {player.position}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: "26px",
                  }}
                >
                  {latestCheckIn
                    ? getMoodEmoji(
                        latestCheckIn.mood
                      )
                    : "–"}
                </div>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid #edf0ee",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background:
                      status.background,
                    color: status.color,
                    borderRadius: "999px",
                    padding: "6px 8px",
                    fontSize: "9px",
                    fontWeight: "bold",
                  }}
                >
                  {status.text}
                </span>

                {latestCheckIn && (
                  <span
                    style={{
                      background: "#f4f6f5",
                      color: "#526158",
                      borderRadius: "999px",
                      padding: "6px 8px",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  >
                    ⚡ {latestCheckIn.energy ?? "–"}/5
                  </span>
                )}

                {latestCheckOut && (
                  <span
                    style={{
                      background: "#fff4e5",
                      color: "#8a5700",
                      borderRadius: "999px",
                      padding: "6px 8px",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  >
                    👋 Check-out
                  </span>
                )}

                {latestCheckIn &&
                  hasPain(latestCheckIn) && (
                    <span
                      style={{
                        background: "#fff1f1",
                        color: "#9b2c2c",
                        borderRadius: "999px",
                        padding: "6px 8px",
                        fontSize: "9px",
                        fontWeight: "bold",
                      }}
                    >
                      🩹 Känning
                    </span>
                  )}

                <span
                  style={{
                    marginLeft: "auto",
                    color: "#123b2a",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  ›
                </span>
              </div>
            </button>
          )
        })}

        <p
          style={{
            margin: "24px 0 20px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
            letterSpacing: "0.5px",
          }}
        >
          HOVSTA IF • LEDARLÄGE
        </p>
      </main>
    </div>
  )
}

export default Players