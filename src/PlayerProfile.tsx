type PlayerProfileProps = {
  onBack: () => void
}

type Exercise = {
  id: number
  name: string
  description: string
}

type TrainingData = {
  id?: number
  date: string
  time: string
  location: string
  focus: string
  description: string
  exercises: Exercise[]
  notes: string
  createdAt: string
}

type CheckInData = {
  id: number
  trainingId?: number | string
  playerName: string
  mood: number | null
  moodReason: string
  energy: number | null
  pain: string
  other: string
  date: string
}

type CheckOutData = {
  id: number
  trainingId: number | string
  playerName: string
  feeling: number
  effort: number
  body: number
  comment: string
  date: string
}

function PlayerProfile({
  onBack,
}: PlayerProfileProps) {
  const playerName = "Testspelare"

  const getTrainings = (): TrainingData[] => {
    const savedTrainings =
      localStorage.getItem("hovstaTrainings")

    if (!savedTrainings) {
      return []
    }

    try {
      const parsedTrainings =
        JSON.parse(savedTrainings)

      if (Array.isArray(parsedTrainings)) {
        return parsedTrainings
      }

      return []
    } catch {
      return []
    }
  }

  const getCheckIns = (): CheckInData[] => {
    const savedCheckIns =
      localStorage.getItem("hovstaCheckIns")

    if (!savedCheckIns) {
      return []
    }

    try {
      const parsedCheckIns =
        JSON.parse(savedCheckIns)

      if (Array.isArray(parsedCheckIns)) {
        return parsedCheckIns
      }

      return []
    } catch {
      return []
    }
  }

  const getCheckOuts = (): CheckOutData[] => {
    const savedCheckOuts =
      localStorage.getItem("hovstaCheckOuts")

    if (!savedCheckOuts) {
      return []
    }

    try {
      const parsedCheckOuts =
        JSON.parse(savedCheckOuts)

      if (Array.isArray(parsedCheckOuts)) {
        return parsedCheckOuts
      }

      return []
    } catch {
      return []
    }
  }

  const getTrainingId = (
    training: TrainingData
  ): number | string => {
    return training.id ?? training.createdAt
  }

  const getTrainingDateTime = (
    training: TrainingData
  ) => {
    if (!training.date) {
      return 0
    }

    const time =
      training.time &&
      /^\d{1,2}:\d{2}$/.test(training.time)
        ? training.time
        : "23:59"

    const dateTime = new Date(
      `${training.date}T${time}:00`
    ).getTime()

    if (Number.isNaN(dateTime)) {
      return 0
    }

    return dateTime
  }

  const trainings = getTrainings()

  const playerCheckIns = getCheckIns()
    .filter(
      (checkIn) =>
        checkIn.playerName === playerName
    )
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )

  const playerCheckOuts = getCheckOuts()
    .filter(
      (checkOut) =>
        checkOut.playerName === playerName
    )
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )

  const completedTrainings = trainings
    .filter(
      (training) =>
        getTrainingDateTime(training) <
        Date.now()
    )
    .sort(
      (a, b) =>
        getTrainingDateTime(b) -
        getTrainingDateTime(a)
    )

  const latestCheckIn =
    playerCheckIns[0] ?? null

  const latestCheckOut =
    playerCheckOuts[0] ?? null

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

  const hasPain = (
    checkIn: CheckInData
  ) => {
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

  const formatTrainingDate = (
    training: TrainingData
  ) => {
    const date = new Date(
      `${training.date}T12:00:00`
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    ).format(date)
  }

  const formatResponseDate = (
    date: string
  ) => {
    const dateObject = new Date(date)

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(dateObject)
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f4f6f8",
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

  return (
    <div style={pageStyle}>
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
          HOVSTA IF • SPELARE
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
          Din träningsöversikt
        </p>
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
                justifyContent: "center",
                fontSize: "30px",
              }}
            >
              👤
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Spelare
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#123b2a",
                }}
              >
                {playerName}
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                Hovsta IF
              </p>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "18px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Check-ins
            </p>

            <strong
              style={{
                fontSize: "26px",
                color: "#123b2a",
              }}
            >
              {playerCheckIns.length}
            </strong>
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "18px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Check-outs
            </p>

            <strong
              style={{
                fontSize: "26px",
                color: "#123b2a",
              }}
            >
              {playerCheckOuts.length}
            </strong>
          </section>
        </div>

        {(latestCheckIn ||
          latestCheckOut) && (
          <>
            <div
              style={{
                margin:
                  "26px 0 12px",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
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

            {latestCheckIn && (
              <section style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 5px",
                        color: "#52705f",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      CHECK-IN
                    </p>

                    <h3
                      style={{
                        margin: 0,
                        color: "#123b2a",
                      }}
                    >
                      Inför träning
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: "32px",
                    }}
                  >
                    {getMoodEmoji(
                      latestCheckIn.mood
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, 1fr)",
                    gap: "10px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#6b7280",
                        fontSize: "11px",
                        marginBottom: "4px",
                      }}
                    >
                      Mående
                    </span>

                    <strong>
                      {getMoodEmoji(
                        latestCheckIn.mood
                      )}{" "}
                      {latestCheckIn.mood ??
                        "–"}
                      /5
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#6b7280",
                        fontSize: "11px",
                        marginBottom: "4px",
                      }}
                    >
                      Energi
                    </span>

                    <strong>
                      ⚡{" "}
                      {latestCheckIn.energy ??
                        "–"}
                      /5
                    </strong>
                  </div>
                </div>

                {hasPain(latestCheckIn) && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      background: "#fff7f7",
                      borderRadius: "12px",
                      border:
                        "1px solid #ead0d0",
                      color: "#8b3434",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                      }}
                    >
                      🩹 Känning angiven
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        fontSize: "13px",
                      }}
                    >
                      {latestCheckIn.pain}
                    </span>
                  </div>
                )}

                <p
                  style={{
                    margin:
                      "14px 0 0",
                    color: "#777",
                    fontSize: "12px",
                  }}
                >
                  {formatResponseDate(
                    latestCheckIn.date
                  )}
                </p>
              </section>
            )}

            {latestCheckOut && (
              <section style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 5px",
                        color: "#52705f",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      CHECK-OUT
                    </p>

                    <h3
                      style={{
                        margin: 0,
                        color: "#123b2a",
                      }}
                    >
                      Efter träning
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: "32px",
                    }}
                  >
                    {getFeelingEmoji(
                      latestCheckOut.feeling
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, 1fr)",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      padding: "11px 6px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#6b7280",
                        fontSize: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      Känsla
                    </span>

                    <strong>
                      {latestCheckOut.feeling}/5
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      padding: "11px 6px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#6b7280",
                        fontSize: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      Ansträngning
                    </span>

                    <strong>
                      {latestCheckOut.effort}/5
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f4f6f8",
                      borderRadius: "12px",
                      padding: "11px 6px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#6b7280",
                        fontSize: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      Kropp
                    </span>

                    <strong>
                      {latestCheckOut.body}/5
                    </strong>
                  </div>
                </div>

                <p
                  style={{
                    margin:
                      "14px 0 0",
                    color: "#777",
                    fontSize: "12px",
                  }}
                >
                  {formatResponseDate(
                    latestCheckOut.date
                  )}
                </p>
              </section>
            )}
          </>
        )}

        <div
          style={{
            margin: "28px 0 12px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
            }}
          >
            TRÄNINGSHISTORIK
          </p>

          <h2
            style={{
              margin: 0,
              color: "#123b2a",
              fontSize: "22px",
            }}
          >
            Mina senaste träningar
          </h2>
        </div>

        {completedTrainings.length === 0 ? (
          <section style={cardStyle}>
            <p
              style={{
                margin: 0,
                color: "#666",
                textAlign: "center",
              }}
            >
              Det finns inga genomförda
              träningar ännu.
            </p>
          </section>
        ) : (
          completedTrainings
            .slice(0, 5)
            .map((training) => {
              const trainingId =
                getTrainingId(training)

              const checkIn =
                playerCheckIns.find(
                  (item) =>
                    String(
                      item.trainingId
                    ) ===
                    String(trainingId)
                )

              const checkOut =
                playerCheckOuts.find(
                  (item) =>
                    String(
                      item.trainingId
                    ) ===
                    String(trainingId)
                )

              return (
                <section
                  key={String(trainingId)}
                  style={cardStyle}
                >
                  <p
                    style={{
                      margin: "0 0 5px",
                      color: "#6b7280",
                      fontSize: "12px",
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {formatTrainingDate(
                      training
                    )}{" "}
                    • {training.time}
                  </p>

                  <h3
                    style={{
                      margin: "0 0 5px",
                      color: "#123b2a",
                    }}
                  >
                    {training.focus}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                      fontSize: "13px",
                    }}
                  >
                    📍 {training.location}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop:
                        "1px solid #eee",
                    }}
                  >
                    <span
                      style={{
                        padding:
                          "6px 9px",
                        borderRadius:
                          "999px",
                        background: checkIn
                          ? "#e7f1eb"
                          : "#f1f3f4",
                        color: checkIn
                          ? "#123b2a"
                          : "#777",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      {checkIn
                        ? "✓ Check-in"
                        : "– Ingen check-in"}
                    </span>

                    <span
                      style={{
                        padding:
                          "6px 9px",
                        borderRadius:
                          "999px",
                        background: checkOut
                          ? "#e7f1eb"
                          : "#f1f3f4",
                        color: checkOut
                          ? "#123b2a"
                          : "#777",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      {checkOut
                        ? "✓ Check-out"
                        : "– Ingen check-out"}
                    </span>
                  </div>
                </section>
              )
            })
        )}
      </main>
    </div>
  )
}

export default PlayerProfile