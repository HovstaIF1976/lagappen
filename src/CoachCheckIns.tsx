import { useState } from "react"

type CoachCheckInsProps = {
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
  trainingId: number | string
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

type Tab = "checkin" | "checkout"

function CoachCheckIns({ onBack }: CoachCheckInsProps) {
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)

  const [selectedCheckIn, setSelectedCheckIn] =
    useState<CheckInData | null>(null)

  const [selectedCheckOut, setSelectedCheckOut] =
    useState<CheckOutData | null>(null)

  const [selectedTab, setSelectedTab] =
    useState<Tab>("checkin")

  const getTrainings = (): TrainingData[] => {
    const saved = localStorage.getItem("hovstaTrainings")

    if (!saved) return []

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const getCheckIns = (): CheckInData[] => {
    const saved = localStorage.getItem("hovstaCheckIns")

    if (!saved) return []

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const getCheckOuts = (): CheckOutData[] => {
    const saved = localStorage.getItem("hovstaCheckOuts")

    if (!saved) return []

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const trainings = getTrainings()
  const checkIns = getCheckIns()
  const checkOuts = getCheckOuts()

  const getTrainingId = (
    training: TrainingData
  ): number | string => {
    return training.id ?? training.createdAt
  }

  const getTrainingDateTime = (training: TrainingData) => {
    if (!training.date) return 0

    const time =
      training.time &&
      /^\d{1,2}:\d{2}$/.test(training.time)
        ? training.time
        : "23:59"

    const value = new Date(
      `${training.date}T${time}:00`
    ).getTime()

    return Number.isNaN(value) ? 0 : value
  }

  const upcomingTrainings = trainings
    .filter(
      (training) =>
        getTrainingDateTime(training) >= Date.now()
    )
    .sort(
      (a, b) =>
        getTrainingDateTime(a) -
        getTrainingDateTime(b)
    )

  const previousTrainings = trainings
    .filter(
      (training) =>
        getTrainingDateTime(training) < Date.now()
    )
    .sort(
      (a, b) =>
        getTrainingDateTime(b) -
        getTrainingDateTime(a)
    )

  const nextTraining = upcomingTrainings[0] ?? null

  const isNextTraining = (training: TrainingData) => {
    if (!nextTraining) return false

    return (
      String(getTrainingId(training)) ===
      String(getTrainingId(nextTraining))
    )
  }

  const getCheckInsForTraining = (
    training: TrainingData
  ) => {
    const trainingId = getTrainingId(training)

    return checkIns
      .filter(
        (checkIn) =>
          String(checkIn.trainingId) ===
          String(trainingId)
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
  }

  const getCheckOutsForTraining = (
    training: TrainingData
  ) => {
    const trainingId = getTrainingId(training)

    return checkOuts
      .filter(
        (checkOut) =>
          String(checkOut.trainingId) ===
          String(trainingId)
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
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

  const getStatusType = (checkIn: CheckInData) => {
    if (
      (checkIn.mood !== null && checkIn.mood <= 2) ||
      (checkIn.energy !== null && checkIn.energy <= 2) ||
      hasPain(checkIn)
    ) {
      return "attention"
    }

    if (
      checkIn.mood === 3 ||
      checkIn.energy === 3
    ) {
      return "followup"
    }

    return "good"
  }

  const getStatus = (checkIn: CheckInData) => {
    const type = getStatusType(checkIn)

    if (type === "attention") {
      return {
        text: "Behöver uppmärksamhet",
        background: "#fff1f1",
        color: "#9b2c2c",
        border: "#ead0d0",
      }
    }

    if (type === "followup") {
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

  const getFeelingEmoji = (feeling: number) => {
    if (feeling === 1) return "😞"
    if (feeling === 2) return "😕"
    if (feeling === 3) return "😐"
    if (feeling === 4) return "🙂"
    if (feeling === 5) return "😄"
    return "–"
  }

  const formatTrainingDate = (date: string) => {
    if (!date) return ""

    const dateObject = new Date(`${date}T12:00:00`)

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  const formatResponseDate = (date: string) => {
    const dateObject = new Date(date)

    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObject)
  }

  const getAverage = (
    values: number[]
  ): string => {
    if (values.length === 0) return "–"

    const sum = values.reduce(
      (total, value) => total + value,
      0
    )

    return (sum / values.length).toFixed(1)
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f4f6f5",
    fontFamily: "Arial, sans-serif",
    color: "#17202a",
  }

  const mainStyle: React.CSSProperties = {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
  }

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #edf0ee",
    boxShadow:
      "0 3px 14px rgba(18,59,42,0.07)",
  }

  const backButtonStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "10px",
    padding: "9px 13px",
    cursor: "pointer",
    marginBottom: "22px",
    fontSize: "14px",
    fontWeight: "bold",
  }

  const Header = ({
    eyebrow,
    title,
    subtitle,
    back,
  }: {
    eyebrow: string
    title: string
    subtitle?: string
    back: () => void
  }) => (
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
          onClick={back}
          style={backButtonStyle}
        >
          ← Tillbaka
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

        {subtitle && (
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
        )}
      </div>
    </header>
  )

  if (selectedCheckIn) {
    const status = getStatus(selectedCheckIn)

    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Spelare • Check-in"
          title={selectedCheckIn.playerName}
          subtitle={formatResponseDate(
            selectedCheckIn.date
          )}
          back={() => setSelectedCheckIn(null)}
        />

        <main style={mainStyle}>
          <section
            style={{
              ...cardStyle,
              borderTop: `4px solid ${status.color}`,
            }}
          >
            <p
              style={{
                margin: "0 0 9px",
                color: "#6b7280",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Samlad bedömning
            </p>

            <span
              style={{
                display: "inline-block",
                padding: "8px 11px",
                borderRadius: "999px",
                background: status.background,
                color: status.color,
                border: `1px solid ${status.border}`,
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {status.text}
            </span>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <section
              style={{
                ...cardStyle,
                marginBottom: 0,
                padding: "20px 12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "8px",
                }}
              >
                {getMoodEmoji(selectedCheckIn.mood)}
              </div>

              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "12px",
                }}
              >
                Mående
              </p>

              <strong>
                {getMoodText(selectedCheckIn.mood)}
              </strong>
            </section>

            <section
              style={{
                ...cardStyle,
                marginBottom: 0,
                padding: "20px 12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  marginBottom: "8px",
                }}
              >
                ⚡
              </div>

              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "12px",
                }}
              >
                Energi
              </p>

              <strong>
                {selectedCheckIn.energy ?? "–"}/5
              </strong>
            </section>
          </div>

          <section
            style={{
              ...cardStyle,
              background: hasPain(selectedCheckIn)
                ? "#fff7f7"
                : "white",
              border: hasPain(selectedCheckIn)
                ? "1px solid #ead0d0"
                : "1px solid #edf0ee",
            }}
          >
            <h3
              style={{
                margin: "0 0 9px",
                color: hasPain(selectedCheckIn)
                  ? "#9b2c2c"
                  : "#123b2a",
              }}
            >
              🩹 Skada / känning
            </h3>

            <p
              style={{
                margin: 0,
                color: hasPain(selectedCheckIn)
                  ? "#8b3434"
                  : "#5f6663",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {hasPain(selectedCheckIn)
                ? selectedCheckIn.pain
                : "Ingen känning angiven."}
            </p>
          </section>

          {selectedCheckIn.moodReason?.trim() !== "" && (
            <section
              style={{
                ...cardStyle,
                background: "#fffaf0",
                border: "1px solid #f0dfb8",
              }}
            >
              <h3
                style={{
                  margin: "0 0 9px",
                  color: "#806522",
                }}
              >
                💬 Kommentar om måendet
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#5f5743",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedCheckIn.moodReason}
              </p>
            </section>
          )}

          {selectedCheckIn.other?.trim() !== "" && (
            <section style={cardStyle}>
              <h3
                style={{
                  margin: "0 0 9px",
                  color: "#123b2a",
                }}
              >
                📝 Övrigt
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#555",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedCheckIn.other}
              </p>
            </section>
          )}
        </main>
      </div>
    )
  }

  if (selectedCheckOut) {
    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Spelare • Check-out"
          title={selectedCheckOut.playerName}
          subtitle={formatResponseDate(
            selectedCheckOut.date
          )}
          back={() => setSelectedCheckOut(null)}
        />

        <main style={mainStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {[
              {
                label: "Känsla",
                value: selectedCheckOut.feeling,
                icon: getFeelingEmoji(
                  selectedCheckOut.feeling
                ),
              },
              {
                label: "Ansträngning",
                value: selectedCheckOut.effort,
                icon: "🔥",
              },
              {
                label: "Kropp",
                value: selectedCheckOut.body,
                icon: "💪",
              },
            ].map((item) => (
              <section
                key={item.label}
                style={{
                  ...cardStyle,
                  marginBottom: 0,
                  padding: "18px 7px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "29px",
                    marginBottom: "7px",
                  }}
                >
                  {item.icon}
                </div>

                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#6b7280",
                    fontSize: "10px",
                  }}
                >
                  {item.label}
                </p>

                <strong>{item.value}/5</strong>
              </section>
            ))}
          </div>

          <section
            style={{
              ...cardStyle,
              borderTop: "4px solid #f39200",
            }}
          >
            <h3
              style={{
                margin: "0 0 9px",
                color: "#123b2a",
              }}
            >
              📝 Spelarens kommentar
            </h3>

            <p
              style={{
                margin: 0,
                color: "#555",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedCheckOut.comment?.trim()
                ? selectedCheckOut.comment
                : "Ingen kommentar lämnades."}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (selectedTraining) {
    const trainingCheckIns =
      getCheckInsForTraining(selectedTraining)

    const trainingCheckOuts =
      getCheckOutsForTraining(selectedTraining)

    const goodCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "good"
    ).length

    const followupCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "followup"
    ).length

    const attentionCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "attention"
    ).length

    const averageFeeling = getAverage(
      trainingCheckOuts.map(
        (checkOut) => checkOut.feeling
      )
    )

    const averageEffort = getAverage(
      trainingCheckOuts.map(
        (checkOut) => checkOut.effort
      )
    )

    const averageBody = getAverage(
      trainingCheckOuts.map(
        (checkOut) => checkOut.body
      )
    )

    return (
      <div style={pageStyle}>
        <Header
          eyebrow="Träning • Spelarnas svar"
          title={selectedTraining.focus}
          subtitle={`${formatTrainingDate(
            selectedTraining.date
          )} • ${selectedTraining.time} • ${
            selectedTraining.location
          }`}
          back={() => {
            setSelectedTraining(null)
            setSelectedTab("checkin")
          }}
        />

        <main style={mainStyle}>
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
              onClick={() => setSelectedTab("checkin")}
              style={{
                padding: "13px 8px",
                border: "none",
                borderRadius: "12px",
                background:
                  selectedTab === "checkin"
                    ? "#123b2a"
                    : "transparent",
                color:
                  selectedTab === "checkin"
                    ? "white"
                    : "#5f6663",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💚 Check-in ({trainingCheckIns.length})
            </button>

            <button
              onClick={() => setSelectedTab("checkout")}
              style={{
                padding: "13px 8px",
                border: "none",
                borderRadius: "12px",
                background:
                  selectedTab === "checkout"
                    ? "#123b2a"
                    : "transparent",
                color:
                  selectedTab === "checkout"
                    ? "white"
                    : "#5f6663",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              👋 Check-out ({trainingCheckOuts.length})
            </button>
          </section>

          {selectedTab === "checkin" ? (
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
                  Inför träningen
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Check-in
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "9px",
                  marginBottom: "18px",
                }}
              >
                {[
                  {
                    number: goodCount,
                    label: "Ser bra ut",
                    background: "#e7f1eb",
                    color: "#123b2a",
                  },
                  {
                    number: followupCount,
                    label: "Följ upp",
                    background: "#fff8e7",
                    color: "#806522",
                  },
                  {
                    number: attentionCount,
                    label: "Uppmärksamma",
                    background: "#fff1f1",
                    color: "#9b2c2c",
                  },
                ].map((item) => (
                  <section
                    key={item.label}
                    style={{
                      borderRadius: "16px",
                      padding: "16px 7px",
                      textAlign: "center",
                      background: item.background,
                      color: item.color,
                      border:
                        "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "25px",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    >
                      {item.number}
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.label}
                    </div>
                  </section>
                ))}
              </div>

              {trainingCheckIns.length === 0 ? (
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
                    Inga check-ins ännu
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                      lineHeight: "1.5",
                    }}
                  >
                    Spelarnas svar inför träningen
                    kommer att visas här.
                  </p>
                </section>
              ) : (
                trainingCheckIns.map((checkIn) => {
                  const status = getStatus(checkIn)

                  return (
                    <button
                      key={checkIn.id}
                      onClick={() =>
                        setSelectedCheckIn(checkIn)
                      }
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
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            minWidth: "44px",
                            borderRadius: "14px",
                            background: "#f4f6f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "25px",
                          }}
                        >
                          {getMoodEmoji(checkIn.mood)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              margin: "0 0 5px",
                              color: "#123b2a",
                              fontSize: "16px",
                            }}
                          >
                            {checkIn.playerName}
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color: "#6b7280",
                              fontSize: "12px",
                            }}
                          >
                            Mående{" "}
                            {checkIn.mood ?? "–"}/5 •
                            Energi{" "}
                            {checkIn.energy ?? "–"}/5
                            {hasPain(checkIn)
                              ? " • 🩹 Känning"
                              : ""}
                          </p>
                        </div>

                        <span
                          style={{
                            padding: "6px 8px",
                            borderRadius: "999px",
                            background:
                              status.background,
                            color: status.color,
                            fontSize: "9px",
                            fontWeight: "bold",
                          }}
                        >
                          {status.text}
                        </span>
                      </div>
                    </button>
                  )
                })
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
                  Efter träningen
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Check-out
                </h2>
              </div>

              {trainingCheckOuts.length > 0 && (
                <section
                  style={{
                    ...cardStyle,
                    borderTop: "4px solid #f39200",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 14px",
                      color: "#6b7280",
                      fontSize: "11px",
                      fontWeight: "bold",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Lagets snitt
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, 1fr)",
                      gap: "8px",
                      textAlign: "center",
                    }}
                  >
                    {[
                      {
                        label: "Känsla",
                        value: averageFeeling,
                      },
                      {
                        label: "Ansträngning",
                        value: averageEffort,
                      },
                      {
                        label: "Kropp",
                        value: averageBody,
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <strong
                          style={{
                            display: "block",
                            color: "#123b2a",
                            fontSize: "22px",
                            marginBottom: "4px",
                          }}
                        >
                          {item.value}
                        </strong>

                        <span
                          style={{
                            color: "#6b7280",
                            fontSize: "10px",
                          }}
                        >
                          {item.label} /5
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {trainingCheckOuts.length === 0 ? (
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
                    Inga check-outs ännu
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                      lineHeight: "1.5",
                    }}
                  >
                    Spelarnas svar efter träningen
                    kommer att visas här.
                  </p>
                </section>
              ) : (
                trainingCheckOuts.map((checkOut) => (
                  <button
                    key={checkOut.id}
                    onClick={() =>
                      setSelectedCheckOut(checkOut)
                    }
                    style={{
                      width: "100%",
                      display: "block",
                      textAlign: "left",
                      background: "white",
                      border: "1px solid #edf0ee",
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
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          minWidth: "44px",
                          borderRadius: "14px",
                          background: "#f4f6f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "25px",
                        }}
                      >
                        {getFeelingEmoji(
                          checkOut.feeling
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            margin: "0 0 5px",
                            color: "#123b2a",
                            fontSize: "16px",
                          }}
                        >
                          {checkOut.playerName}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "12px",
                          }}
                        >
                          Känsla {checkOut.feeling}/5 •
                          Ansträngning{" "}
                          {checkOut.effort}/5 • Kropp{" "}
                          {checkOut.body}/5
                        </p>
                      </div>

                      <span
                        style={{
                          color: "#123b2a",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        ›
                      </span>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </main>
      </div>
    )
  }

  const renderTrainingCard = (
    training: TrainingData,
    type: "upcoming" | "previous"
  ) => {
    const trainingCheckIns =
      getCheckInsForTraining(training)

    const trainingCheckOuts =
      getCheckOutsForTraining(training)

    const attentionCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "attention"
    ).length

    const followupCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "followup"
    ).length

    const goodCount = trainingCheckIns.filter(
      (checkIn) =>
        getStatusType(checkIn) === "good"
    ).length

    const next = isNextTraining(training)

    return (
      <button
        key={String(getTrainingId(training))}
        onClick={() => {
          setSelectedTraining(training)
          setSelectedTab("checkin")
        }}
        style={{
          width: "100%",
          display: "block",
          textAlign: "left",
          background: "white",
          border: next
            ? "2px solid #123b2a"
            : "1px solid #edf0ee",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "12px",
          boxShadow:
            next
              ? "0 5px 18px rgba(18,59,42,0.12)"
              : "0 3px 12px rgba(18,59,42,0.06)",
          cursor: "pointer",
          color: "#17202a",
          opacity: type === "previous" ? 0.92 : 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {next && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "#f39200",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
            marginTop: next ? "4px" : 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "9px",
              }}
            >
              {next && (
                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: "999px",
                    background: "#123b2a",
                    color: "white",
                    fontSize: "9px",
                    fontWeight: "bold",
                    letterSpacing: "0.4px",
                  }}
                >
                  NÄSTA TRÄNING
                </span>
              )}

              {type === "previous" && (
                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: "999px",
                    background: "#f1f3f2",
                    color: "#6b7280",
                    fontSize: "9px",
                    fontWeight: "bold",
                  }}
                >
                  GENOMFÖRD
                </span>
              )}
            </div>

            <p
              style={{
                margin: "0 0 5px",
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "capitalize",
              }}
            >
              {formatTrainingDate(training.date)} •{" "}
              {training.time}
            </p>

            <h2
              style={{
                margin: "0 0 6px",
                color: "#123b2a",
                fontSize: "19px",
              }}
            >
              {training.focus}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "13px",
              }}
            >
              📍 {training.location}
            </p>
          </div>

          <span
            style={{
              color: "#123b2a",
              fontSize: "22px",
              fontWeight: "bold",
            }}
          >
            ›
          </span>
        </div>

        <div
          style={{
            marginTop: "15px",
            paddingTop: "13px",
            borderTop: "1px solid #edf0ee",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "7px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#edf4f0",
                color: "#123b2a",
                padding: "6px 9px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              💚 {trainingCheckIns.length} check-in
            </span>

            <span
              style={{
                background: "#fff4e5",
                color: "#8a5700",
                padding: "6px 9px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              👋 {trainingCheckOuts.length} check-out
            </span>
          </div>

          {trainingCheckIns.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                marginTop: "9px",
              }}
            >
              <span
                style={{
                  color: "#123b2a",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ✓ {goodCount} bra
              </span>

              <span
                style={{
                  color: "#806522",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ● {followupCount} följ upp
              </span>

              <span
                style={{
                  color: "#9b2c2c",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ! {attentionCount} uppmärksamma
              </span>
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div style={pageStyle}>
      <Header
        eyebrow="Hovsta IF • Ledarläge"
        title="Spelarnas svar 💚"
        subtitle="Följ lagets status före och efter träning."
        back={onBack}
      />

      <main style={mainStyle}>
        {nextTraining && (() => {
          const nextCheckIns =
            getCheckInsForTraining(nextTraining)

          const attentionCount =
            nextCheckIns.filter(
              (checkIn) =>
                getStatusType(checkIn) === "attention"
            ).length

          const followupCount =
            nextCheckIns.filter(
              (checkIn) =>
                getStatusType(checkIn) === "followup"
            ).length

          return (
            <section
              style={{
                ...cardStyle,
                borderTop: "4px solid #f39200",
                marginBottom: "25px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#123b2a",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Snabböverblick
              </p>

              <h2
                style={{
                  margin: "0 0 5px",
                  color: "#123b2a",
                  fontSize: "20px",
                }}
              >
                Nästa träning
              </h2>

              <p
                style={{
                  margin: "0 0 15px",
                  color: "#5f6663",
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {formatTrainingDate(nextTraining.date)} •{" "}
                {nextTraining.time} •{" "}
                {nextTraining.location}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "7px",
                }}
              >
                <span
                  style={{
                    background: "#edf4f0",
                    color: "#123b2a",
                    padding: "7px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {nextCheckIns.length} check-ins
                </span>

                {attentionCount > 0 && (
                  <span
                    style={{
                      background: "#fff1f1",
                      color: "#9b2c2c",
                      padding: "7px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {attentionCount} behöver
                    uppmärksamhet
                  </span>
                )}

                {followupCount > 0 && (
                  <span
                    style={{
                      background: "#fff8e7",
                      color: "#806522",
                      padding: "7px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {followupCount} att följa upp
                  </span>
                )}
              </div>
            </section>
          )
        })()}

        <section
          style={{
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
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
              Kommande
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              Kommande träningar
            </h2>
          </div>

          {upcomingTrainings.length === 0 ? (
            <section
              style={{
                ...cardStyle,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#666",
                }}
              >
                Inga kommande träningar.
              </p>
            </section>
          ) : (
            upcomingTrainings.map((training) =>
              renderTrainingCard(
                training,
                "upcoming"
              )
            )
          )}
        </section>

        <section
          style={{
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
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
                fontSize: "22px",
              }}
            >
              Tidigare träningar
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6b7280",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              Senaste genomförda träningen visas först.
            </p>
          </div>

          {previousTrainings.length === 0 ? (
            <section
              style={{
                ...cardStyle,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#666",
                }}
              >
                Det finns inga tidigare träningar ännu.
              </p>
            </section>
          ) : (
            previousTrainings.map((training) =>
              renderTrainingCard(
                training,
                "previous"
              )
            )
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
          HOVSTA IF • LEDARLÄGE
        </p>
      </main>
    </div>
  )
}

export default CoachCheckIns