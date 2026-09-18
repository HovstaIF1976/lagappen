import { useState } from "react"

type PlayersProps = {
  onBack: () => void
}

type Player = {
  id: number
  name: string
  number: number
  position: string
}

type CheckInData = {
  id: number
  playerName: string
  mood: number | null
  moodReason: string
  energy: number | null
  pain: string
  other: string
  date: string
}

function Players({ onBack }: PlayersProps) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null)

  const players: Player[] = [
    {
      id: 1,
      name: "Testspelare",
      number: 8,
      position: "Mittfältare",
    },
    {
      id: 2,
      name: "Erik Test",
      number: 1,
      position: "Målvakt",
    },
    {
      id: 3,
      name: "Anton Test",
      number: 4,
      position: "Försvarare",
    },
    {
      id: 4,
      name: "William Test",
      number: 10,
      position: "Mittfältare",
    },
    {
      id: 5,
      name: "Lucas Test",
      number: 9,
      position: "Anfallare",
    },
  ]

  const getCheckIns = (): CheckInData[] => {
    const savedCheckIns =
      localStorage.getItem("hovstaCheckIns")

    if (!savedCheckIns) {
      return []
    }

    try {
      const parsedCheckIns = JSON.parse(savedCheckIns)

      if (Array.isArray(parsedCheckIns)) {
        return parsedCheckIns
      }

      return []
    } catch {
      return []
    }
  }

  const checkIns = getCheckIns()

  const getPlayerCheckIns = (player: Player) => {
    return checkIns
      .filter(
        (checkIn) =>
          checkIn.playerName === player.name
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
  }

  const getLatestCheckIn = (player: Player) => {
    const playerCheckIns = getPlayerCheckIns(player)

    return playerCheckIns[0] ?? null
  }

  const hasPain = (checkIn: CheckInData) => {
    const pain = checkIn.pain.trim().toLowerCase()

    return (
      pain !== "" &&
      pain !== "inget" &&
      pain !== "nej" &&
      pain !== "ingen" &&
      pain !== "ingenting"
    )
  }

  const getStatus = (checkIn: CheckInData | null) => {
    if (!checkIn) {
      return {
        text: "Ingen check-in",
        background: "#f1f3f4",
        color: "#6b7280",
      }
    }

    if (
      (checkIn.mood !== null && checkIn.mood <= 2) ||
      (checkIn.energy !== null && checkIn.energy <= 2) ||
      hasPain(checkIn)
    ) {
      return {
        text: "Behöver uppmärksamhet",
        background: "#fff1f1",
        color: "#9b2c2c",
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
      }
    }

    return {
      text: "Ser bra ut",
      background: "#e7f1eb",
      color: "#123b2a",
    }
  }

  const getMoodEmoji = (mood: number | null) => {
    if (mood === 1) return "😞"
    if (mood === 2) return "😕"
    if (mood === 3) return "😐"
    if (mood === 4) return "🙂"
    if (mood === 5) return "😄"

    return "–"
  }

  const getMoodText = (mood: number | null) => {
    if (mood === 1) return "Inte bra"
    if (mood === 2) return "Sådär"
    if (mood === 3) return "Okej"
    if (mood === 4) return "Bra"
    if (mood === 5) return "Jättebra"

    return "Ej svarat"
  }

  const getEnergyEmoji = (energy: number | null) => {
    if (energy === 1) return "🪫"
    if (energy === 2) return "🔋"
    if (energy === 3) return "🔋"
    if (energy === 4) return "🔋"
    if (energy === 5) return "⚡"

    return "–"
  }

  const formatCheckInTime = (date: string) => {
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

  /*
    SPELARPROFIL
  */
  if (selectedPlayer) {
    const latestCheckIn =
      getLatestCheckIn(selectedPlayer)

    const playerCheckIns =
      getPlayerCheckIns(selectedPlayer)

    const status = getStatus(latestCheckIn)

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          fontFamily: "Arial, sans-serif",
          color: "#17202a",
        }}
      >
        <header
          style={{
            background: "#123b2a",
            color: "white",
            padding: "24px 20px",
            borderRadius: "0 0 24px 24px",
          }}
        >
          <button
            onClick={() => setSelectedPlayer(null)}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
              marginBottom: "18px",
            }}
          >
            ← Alla spelare
          </button>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.8,
            }}
          >
            HOVSTA IF • SPELARE
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "28px",
            }}
          >
            {selectedPlayer.name}
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            #{selectedPlayer.number} •{" "}
            {selectedPlayer.position}
          </p>
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
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "13px",
                textTransform: "uppercase",
              }}
            >
              Spelarinformation
            </p>

            <h2
              style={{
                margin: "10px 0 14px",
                color: "#123b2a",
              }}
            >
              {selectedPlayer.name}
            </h2>

            <p style={{ margin: "8px 0" }}>
              <strong>Tröjnummer:</strong>{" "}
              {selectedPlayer.number}
            </p>

            <p style={{ margin: "8px 0" }}>
              <strong>Position:</strong>{" "}
              {selectedPlayer.position}
            </p>
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: "13px",
                    textTransform: "uppercase",
                  }}
                >
                  Senaste check-in
                </p>

                {latestCheckIn && (
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    {formatCheckInTime(
                      latestCheckIn.date
                    )}
                  </p>
                )}
              </div>

              <span
                style={{
                  background: status.background,
                  color: status.color,
                  borderRadius: "999px",
                  padding: "7px 10px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {status.text}
              </span>
            </div>

            {latestCheckIn ? (
              <>
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
                      background: "#f7f8f8",
                      borderRadius: "14px",
                      padding: "14px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        marginBottom: "6px",
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
                        fontSize: "11px",
                      }}
                    >
                      Mående
                    </p>

                    <strong
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      {getMoodText(
                        latestCheckIn.mood
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f7f8f8",
                      borderRadius: "14px",
                      padding: "14px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        marginBottom: "6px",
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
                        fontSize: "11px",
                      }}
                    >
                      Energi
                    </p>

                    <strong
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      {latestCheckIn.energy ?? "–"}/5
                    </strong>
                  </div>

                  <div
                    style={{
                      background: hasPain(latestCheckIn)
                        ? "#fff1f1"
                        : "#f7f8f8",
                      borderRadius: "14px",
                      padding: "14px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        marginBottom: "6px",
                      }}
                    >
                      {hasPain(latestCheckIn)
                        ? "⚠️"
                        : "✅"}
                    </div>

                    <p
                      style={{
                        margin: "0 0 4px",
                        color: "#6b7280",
                        fontSize: "11px",
                      }}
                    >
                      Skada
                    </p>

                    <strong
                      style={{
                        fontSize: "12px",
                        color: hasPain(
                          latestCheckIn
                        )
                          ? "#9b2c2c"
                          : "#123b2a",
                      }}
                    >
                      {hasPain(latestCheckIn)
                        ? "Känning"
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
                      border: "1px solid #ead0d0",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#9b2c2c",
                        fontSize: "13px",
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
                      }}
                    >
                      {latestCheckIn.pain}
                    </p>
                  </div>
                )}

                {latestCheckIn.moodReason.trim() !== "" && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "13px",
                      borderRadius: "12px",
                      background: "#fff8e7",
                      border: "1px solid #ead9a5",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#806522",
                        fontSize: "13px",
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
                      }}
                    >
                      {latestCheckIn.moodReason}
                    </p>
                  </div>
                )}

                {latestCheckIn.other.trim() !== "" && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "13px",
                      borderRadius: "12px",
                      background: "#f7f8f8",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#555",
                        fontSize: "13px",
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
                      }}
                    >
                      {latestCheckIn.other}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p
                style={{
                  marginBottom: 0,
                  color: "#666",
                  lineHeight: "1.5",
                }}
              >
                Spelaren har inte gjort någon
                check-in ännu.
              </p>
            )}
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              💚 Senaste check-ins
            </h2>

            {playerCheckIns.length > 0 ? (
              playerCheckIns.map((checkIn) => {
                const checkInStatus =
                  getStatus(checkIn)

                return (
                  <div
                    key={checkIn.id}
                    style={{
                      padding: "14px 0",
                      borderBottom:
                        "1px solid #eeeeee",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "26px",
                        }}
                      >
                        {getMoodEmoji(
                          checkIn.mood
                        )}
                      </span>

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                          }}
                        >
                          {getMoodText(
                            checkIn.mood
                          )}{" "}
                          • Energi{" "}
                          {checkIn.energy ?? "–"}/5
                        </strong>

                        <div
                          style={{
                            marginTop: "3px",
                            color: "#6b7280",
                            fontSize: "12px",
                          }}
                        >
                          {formatCheckInTime(
                            checkIn.date
                          )}
                        </div>
                      </div>

                      {hasPain(checkIn) && (
                        <span
                          title="Spelaren har angett en känning"
                          style={{
                            fontSize: "19px",
                          }}
                        >
                          ⚠️
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: "9px",
                      }}
                    >
                      <span
                        style={{
                          background:
                            checkInStatus.background,
                          color:
                            checkInStatus.color,
                          borderRadius: "999px",
                          padding: "5px 8px",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        {checkInStatus.text}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p
                style={{
                  marginBottom: 0,
                  color: "#666",
                }}
              >
                Ingen check-in-historik ännu.
              </p>
            )}

            {playerCheckIns.length > 0 && (
              <p
                style={{
                  margin: "16px 0 0",
                  color: "#6b7280",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                I den färdiga appen visas endast
                check-ins som fortfarande finns inom
                lagets gallringsperiod.
              </p>
            )}
          </section>
        </main>
      </div>
    )
  }

  /*
    TRUPPÖVERSIKT
  */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily: "Arial, sans-serif",
        color: "#17202a",
      }}
    >
      <header
        style={{
          background: "#123b2a",
          color: "white",
          padding: "24px 20px",
          borderRadius: "0 0 24px 24px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.15)",
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
          HOVSTA IF • LEDARLÄGE
        </p>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "28px",
          }}
        >
          Spelare 👥
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Truppöversikt och spelarstatus
        </p>
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
            background: "white",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "18px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Truppen
          </p>

          <h2
            style={{
              margin: "8px 0 4px",
              color: "#123b2a",
            }}
          >
            {players.length} spelare
          </h2>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Testtrupp – ersätts senare av riktiga
            spelarkonton.
          </p>
        </section>

        {players.map((player) => {
          const latestCheckIn =
            getLatestCheckIn(player)

          const status = getStatus(latestCheckIn)

          return (
            <button
              key={player.id}
              onClick={() =>
                setSelectedPlayer(player)
              }
              style={{
                width: "100%",
                display: "block",
                textAlign: "left",
                background: "white",
                border: "none",
                borderRadius: "18px",
                padding: "18px",
                marginBottom: "12px",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
                cursor: "pointer",
                color: "#17202a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "50%",
                    background: "#e7f1eb",
                    color: "#123b2a",
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
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 4px",
                      color: "#123b2a",
                      fontSize: "18px",
                    }}
                  >
                    {player.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    #{player.number} •{" "}
                    {player.position}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: "24px",
                  }}
                >
                  {latestCheckIn
                    ? getMoodEmoji(
                        latestCheckIn.mood
                      )
                    : "–"}
                </span>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    background: status.background,
                    color: status.color,
                    borderRadius: "999px",
                    padding: "6px 9px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {status.text}
                </span>

                {latestCheckIn && (
                  <span
                    style={{
                      color: "#555",
                      fontSize: "12px",
                    }}
                  >
                    {latestCheckIn.energy ?? "–"}/5 ⚡
                    {hasPain(latestCheckIn)
                      ? " • ⚠️"
                      : ""}
                  </span>
                )}

                <span
                  style={{
                    color: "#123b2a",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  Öppna →
                </span>
              </div>
            </button>
          )
        })}
      </main>
    </div>
  )
}

export default Players