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

function CoachCheckIns({
  onBack,
}: CoachCheckInsProps) {
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)

  const [selectedCheckIn, setSelectedCheckIn] =
    useState<CheckInData | null>(null)

  const [selectedCheckOut, setSelectedCheckOut] =
    useState<CheckOutData | null>(null)

  const [selectedTab, setSelectedTab] =
    useState<Tab>("checkin")

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
    if (training.id !== undefined) {
      return training.id
    }

    return training.createdAt
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
  const checkIns = getCheckIns()
  const checkOuts = getCheckOuts()

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

  const nextTraining =
    upcomingTrainings[0] ?? null

  const isNextTraining = (
    training: TrainingData
  ) => {
    if (!nextTraining) {
      return false
    }

    return (
      String(getTrainingId(training)) ===
      String(getTrainingId(nextTraining))
    )
  }

  const getCheckInsForTraining = (
    training: TrainingData
  ) => {
    const trainingId =
      getTrainingId(training)

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
    const trainingId =
      getTrainingId(training)

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

  const getStatusType = (
    checkIn: CheckInData
  ) => {
    if (
      (checkIn.mood !== null &&
        checkIn.mood <= 2) ||
      (checkIn.energy !== null &&
        checkIn.energy <= 2) ||
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

  const getStatus = (
    checkIn: CheckInData
  ) => {
    const statusType =
      getStatusType(checkIn)

    if (statusType === "attention") {
      return {
        text: "Behöver uppmärksamhet",
        background: "#fff1f1",
        color: "#9b2c2c",
      }
    }

    if (statusType === "followup") {
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

  const formatTrainingDate = (
    date: string
  ) => {
    if (!date) {
      return ""
    }

    const dateObject = new Date(
      `${date}T12:00:00`
    )

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  const formatResponseDate = (
    date: string
  ) => {
    const dateObject = new Date(date)

    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObject)
  }

  /*
    ENSKILD CHECK-IN
  */
  if (selectedCheckIn) {
    const status =
      getStatus(selectedCheckIn)

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
            borderRadius:
              "0 0 24px 24px",
          }}
        >
          <button
            onClick={() =>
              setSelectedCheckIn(null)
            }
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
            SPELARE • CHECK-IN
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "28px",
            }}
          >
            {selectedCheckIn.playerName}
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            {formatResponseDate(
              selectedCheckIn.date
            )}
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
                margin: "0 0 8px",
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
              }}
            >
              Bedömning
            </p>

            <span
              style={{
                display: "inline-block",
                padding: "8px 11px",
                borderRadius: "999px",
                background:
                  status.background,
                color: status.color,
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
                padding: "20px",
                textAlign: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "8px",
                }}
              >
                {getMoodEmoji(
                  selectedCheckIn.mood
                )}
              </div>

              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "12px",
                }}
              >
                Mående
              </p>

              <strong>
                {getMoodText(
                  selectedCheckIn.mood
                )}
              </strong>
            </section>

            <section
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "20px",
                textAlign: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "8px",
                }}
              >
                ⚡
              </div>

              <p
                style={{
                  margin: "0 0 4px",
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
              background: hasPain(
                selectedCheckIn
              )
                ? "#fff7f7"
                : "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              border: hasPain(
                selectedCheckIn
              )
                ? "1px solid #ead0d0"
                : "none",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: hasPain(
                  selectedCheckIn
                )
                  ? "#9b2c2c"
                  : "#17202a",
              }}
            >
              🩹 Skada / känning
            </h3>

            <p
              style={{
                marginBottom: 0,
                color: hasPain(
                  selectedCheckIn
                )
                  ? "#8b3434"
                  : "#666",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
              }}
            >
              {hasPain(selectedCheckIn)
                ? selectedCheckIn.pain
                : "Ingen känning angiven."}
            </p>
          </section>

          {selectedCheckIn.moodReason?.trim() !==
            "" && (
            <section
              style={{
                background: "#fff8e7",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "16px",
                border:
                  "1px solid #ead9a5",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#806522",
                }}
              >
                💬 Kommentar om måendet
              </h3>

              <p
                style={{
                  marginBottom: 0,
                  color: "#5f5743",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedCheckIn.moodReason}
              </p>
            </section>
          )}

          {selectedCheckIn.other?.trim() !==
            "" && (
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
              <h3 style={{ marginTop: 0 }}>
                📝 Övrigt
              </h3>

              <p
                style={{
                  marginBottom: 0,
                  color: "#555",
                  lineHeight: "1.5",
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

  /*
    ENSKILD CHECK-OUT
  */
  if (selectedCheckOut) {
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
            borderRadius:
              "0 0 24px 24px",
          }}
        >
          <button
            onClick={() =>
              setSelectedCheckOut(null)
            }
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
            SPELARE • CHECK-OUT
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "28px",
            }}
          >
            {selectedCheckOut.playerName}
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            {formatResponseDate(
              selectedCheckOut.date
            )}
          </p>
        </header>

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <section
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "18px 8px",
                textAlign: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "7px",
                }}
              >
                {getFeelingEmoji(
                  selectedCheckOut.feeling
                )}
              </div>

              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                Känsla
              </p>

              <strong>
                {selectedCheckOut.feeling}/5
              </strong>
            </section>

            <section
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "18px 8px",
                textAlign: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "7px",
                }}
              >
                🔥
              </div>

              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                Ansträngning
              </p>

              <strong>
                {selectedCheckOut.effort}/5
              </strong>
            </section>

            <section
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "18px 8px",
                textAlign: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "7px",
                }}
              >
                🔋
              </div>

              <p
                style={{
                  margin: "0 0 4px",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                Kropp
              </p>

              <strong>
                {selectedCheckOut.body}/5
              </strong>
            </section>
          </div>

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
            <h3
              style={{
                marginTop: 0,
              }}
            >
              💬 Kommentar
            </h3>

            <p
              style={{
                marginBottom: 0,
                color:
                  selectedCheckOut.comment?.trim()
                    ? "#555"
                    : "#888",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedCheckOut.comment?.trim()
                ? selectedCheckOut.comment
                : "Ingen kommentar."}
            </p>
          </section>
        </main>
      </div>
    )
  }

  /*
    SPECIFIK TRÄNING
  */
  if (selectedTraining) {
    const trainingCheckIns =
      getCheckInsForTraining(
        selectedTraining
      )

    const trainingCheckOuts =
      getCheckOutsForTraining(
        selectedTraining
      )

    const goodCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) === "good"
      ).length

    const followupCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) ===
          "followup"
      ).length

    const attentionCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) ===
          "attention"
      ).length

    const averageFeeling =
      trainingCheckOuts.length > 0
        ? (
            trainingCheckOuts.reduce(
              (sum, item) =>
                sum + item.feeling,
              0
            ) / trainingCheckOuts.length
          ).toFixed(1)
        : "–"

    const averageEffort =
      trainingCheckOuts.length > 0
        ? (
            trainingCheckOuts.reduce(
              (sum, item) =>
                sum + item.effort,
              0
            ) / trainingCheckOuts.length
          ).toFixed(1)
        : "–"

    const averageBody =
      trainingCheckOuts.length > 0
        ? (
            trainingCheckOuts.reduce(
              (sum, item) =>
                sum + item.body,
              0
            ) / trainingCheckOuts.length
          ).toFixed(1)
        : "–"

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
            borderRadius:
              "0 0 24px 24px",
          }}
        >
          <button
            onClick={() => {
              setSelectedTraining(null)
              setSelectedTab("checkin")
            }}
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
            ← Alla träningar
          </button>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.8,
            }}
          >
            HOVSTA IF • SPELARSVAR
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "26px",
            }}
          >
            {selectedTraining.focus}
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
              textTransform: "capitalize",
            }}
          >
            {formatTrainingDate(
              selectedTraining.date
            )}{" "}
            • {selectedTraining.time}
          </p>
        </header>

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {/* FLikar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "8px",
              background: "white",
              padding: "6px",
              borderRadius: "14px",
              marginBottom: "16px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <button
              onClick={() =>
                setSelectedTab("checkin")
              }
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "12px 8px",
                background:
                  selectedTab === "checkin"
                    ? "#123b2a"
                    : "transparent",
                color:
                  selectedTab === "checkin"
                    ? "white"
                    : "#526158",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💚 Check-in
              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                {trainingCheckIns.length} svar
              </span>
            </button>

            <button
              onClick={() =>
                setSelectedTab("checkout")
              }
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "12px 8px",
                background:
                  selectedTab === "checkout"
                    ? "#123b2a"
                    : "transparent",
                color:
                  selectedTab === "checkout"
                    ? "white"
                    : "#526158",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              👋 Check-out
              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                {trainingCheckOuts.length} svar
              </span>
            </button>
          </div>

          {selectedTab === "checkin" && (
            <>
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
                  Check-in
                </p>

                <h2
                  style={{
                    margin: "8px 0 4px",
                    color: "#123b2a",
                  }}
                >
                  {trainingCheckIns.length} spelare
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#666",
                  }}
                >
                  Svar inför just den här träningen.
                </p>
              </section>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "8px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    background: "#e7f1eb",
                    borderRadius: "14px",
                    padding: "14px 6px",
                    textAlign: "center",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "22px",
                      color: "#123b2a",
                    }}
                  >
                    {goodCount}
                  </strong>

                  <span
                    style={{
                      fontSize: "10px",
                      color: "#52705f",
                    }}
                  >
                    Ser bra ut
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff8e7",
                    borderRadius: "14px",
                    padding: "14px 6px",
                    textAlign: "center",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "22px",
                      color: "#806522",
                    }}
                  >
                    {followupCount}
                  </strong>

                  <span
                    style={{
                      fontSize: "10px",
                      color: "#806522",
                    }}
                  >
                    Följ upp
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff1f1",
                    borderRadius: "14px",
                    padding: "14px 6px",
                    textAlign: "center",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "22px",
                      color: "#9b2c2c",
                    }}
                  >
                    {attentionCount}
                  </strong>

                  <span
                    style={{
                      fontSize: "10px",
                      color: "#9b2c2c",
                    }}
                  >
                    Uppmärksamma
                  </span>
                </div>
              </div>

              {trainingCheckIns.length === 0 ? (
                <section
                  style={{
                    background: "white",
                    borderRadius: "18px",
                    padding: "30px 20px",
                    textAlign: "center",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.06)",
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
                    Inga check-ins
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Det finns inga kopplade check-ins
                    för den här träningen.
                  </p>
                </section>
              ) : (
                trainingCheckIns.map(
                  (checkIn) => {
                    const status =
                      getStatus(checkIn)

                    return (
                      <button
                        key={checkIn.id}
                        onClick={() =>
                          setSelectedCheckIn(
                            checkIn
                          )
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
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "30px",
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
                            <h3
                              style={{
                                margin:
                                  "0 0 4px",
                                color:
                                  "#123b2a",
                              }}
                            >
                              {checkIn.playerName}
                            </h3>

                            <p
                              style={{
                                margin: 0,
                                color:
                                  "#6b7280",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {getMoodText(
                                checkIn.mood
                              )}{" "}
                              • Energi{" "}
                              {checkIn.energy ??
                                "–"}
                              /5
                            </p>
                          </div>

                          {hasPain(
                            checkIn
                          ) && (
                            <span
                              style={{
                                fontSize:
                                  "20px",
                              }}
                            >
                              ⚠️
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "13px",
                            paddingTop:
                              "11px",
                            borderTop:
                              "1px solid #eee",
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                          }}
                        >
                          <span
                            style={{
                              padding:
                                "6px 9px",
                              borderRadius:
                                "999px",
                              background:
                                status.background,
                              color:
                                status.color,
                              fontSize:
                                "10px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {status.text}
                          </span>

                          <span
                            style={{
                              color:
                                "#123b2a",
                              fontSize:
                                "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            Visa svar →
                          </span>
                        </div>
                      </button>
                    )
                  }
                )
              )}
            </>
          )}

          {selectedTab === "checkout" && (
            <>
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
                  Check-out
                </p>

                <h2
                  style={{
                    margin:
                      "8px 0 4px",
                    color: "#123b2a",
                  }}
                >
                  {trainingCheckOuts.length} spelare
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#666",
                  }}
                >
                  Svar efter träningen.
                </p>
              </section>

              {trainingCheckOuts.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      background: "#e7f1eb",
                      borderRadius:
                        "14px",
                      padding:
                        "14px 6px",
                      textAlign:
                        "center",
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize:
                          "20px",
                        color:
                          "#123b2a",
                      }}
                    >
                      {averageFeeling}
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#52705f",
                      }}
                    >
                      Känsla /5
                    </span>
                  </div>

                  <div
                    style={{
                      background:
                        "#fff8e7",
                      borderRadius:
                        "14px",
                      padding:
                        "14px 6px",
                      textAlign:
                        "center",
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize:
                          "20px",
                        color:
                          "#806522",
                      }}
                    >
                      {averageEffort}
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#806522",
                      }}
                    >
                      Ansträngning /5
                    </span>
                  </div>

                  <div
                    style={{
                      background:
                        "#f2f8f4",
                      borderRadius:
                        "14px",
                      padding:
                        "14px 6px",
                      textAlign:
                        "center",
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        fontSize:
                          "20px",
                        color:
                          "#123b2a",
                      }}
                    >
                      {averageBody}
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#52705f",
                      }}
                    >
                      Kropp /5
                    </span>
                  </div>
                </div>
              )}

              {trainingCheckOuts.length === 0 ? (
                <section
                  style={{
                    background: "white",
                    borderRadius: "18px",
                    padding:
                      "30px 20px",
                    textAlign:
                      "center",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      marginBottom:
                        "10px",
                    }}
                  >
                    👋
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 7px",
                      color:
                        "#123b2a",
                    }}
                  >
                    Inga check-outs
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#666",
                      lineHeight:
                        "1.5",
                    }}
                  >
                    Det finns inga kopplade
                    check-outs för den här
                    träningen ännu.
                  </p>
                </section>
              ) : (
                trainingCheckOuts.map(
                  (checkOut) => (
                    <button
                      key={
                        checkOut.id
                      }
                      onClick={() =>
                        setSelectedCheckOut(
                          checkOut
                        )
                      }
                      style={{
                        width: "100%",
                        display:
                          "block",
                        textAlign:
                          "left",
                        background:
                          "white",
                        border:
                          "none",
                        borderRadius:
                          "18px",
                        padding:
                          "18px",
                        marginBottom:
                          "12px",
                        boxShadow:
                          "0 2px 8px rgba(0,0,0,0.06)",
                        cursor:
                          "pointer",
                        color:
                          "#17202a",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "30px",
                          }}
                        >
                          {getFeelingEmoji(
                            checkOut.feeling
                          )}
                        </span>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <h3
                            style={{
                              margin:
                                "0 0 4px",
                              color:
                                "#123b2a",
                            }}
                          >
                            {
                              checkOut.playerName
                            }
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color:
                                "#6b7280",
                              fontSize:
                                "12px",
                            }}
                          >
                            Känsla{" "}
                            {
                              checkOut.feeling
                            }
                            /5 • Ansträngning{" "}
                            {
                              checkOut.effort
                            }
                            /5
                          </p>
                        </div>

                        <span
                          style={{
                            color:
                              "#123b2a",
                            fontSize:
                              "12px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          Visa →
                        </span>
                      </div>
                    </button>
                  )
                )
              )}
            </>
          )}
        </main>
      </div>
    )
  }

  /*
    TRÄNINGSKORT
  */
  const renderTrainingCard = (
    training: TrainingData,
    type: "upcoming" | "previous"
  ) => {
    const trainingCheckIns =
      getCheckInsForTraining(
        training
      )

    const trainingCheckOuts =
      getCheckOutsForTraining(
        training
      )

    const goodCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) === "good"
      ).length

    const followupCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) ===
          "followup"
      ).length

    const attentionCount =
      trainingCheckIns.filter(
        (checkIn) =>
          getStatusType(checkIn) ===
          "attention"
      ).length

    const next =
      isNextTraining(training)

    return (
      <button
        key={String(
          getTrainingId(training)
        )}
        onClick={() =>
          setSelectedTraining(training)
        }
        style={{
          width: "100%",
          display: "block",
          textAlign: "left",
          background: next
            ? "#f4faf6"
            : "white",
          border: next
            ? "2px solid #123b2a"
            : "1px solid transparent",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
          cursor: "pointer",
          color: "#17202a",
          opacity:
            type === "previous"
              ? 0.9
              : 1,
        }}
      >
        {next && (
          <span
            style={{
              display:
                "inline-block",
              marginBottom:
                "10px",
              padding:
                "6px 9px",
              borderRadius:
                "999px",
              background:
                "#123b2a",
              color: "white",
              fontSize:
                "10px",
              fontWeight:
                "bold",
            }}
          >
            NÄSTA TRÄNING
          </span>
        )}

        {type === "previous" && (
          <span
            style={{
              display:
                "inline-block",
              marginBottom:
                "10px",
              padding:
                "5px 8px",
              borderRadius:
                "999px",
              background:
                "#f1f3f4",
              color:
                "#6b7280",
              fontSize:
                "10px",
              fontWeight:
                "bold",
            }}
          >
            GENOMFÖRD
          </span>
        )}

        <p
          style={{
            margin:
              "0 0 5px",
            color:
              "#6b7280",
            fontSize:
              "12px",
            textTransform:
              "capitalize",
          }}
        >
          {formatTrainingDate(
            training.date
          )}{" "}
          • {training.time}
        </p>

        <h2
          style={{
            margin:
              "0 0 5px",
            color:
              "#123b2a",
            fontSize:
              "19px",
          }}
        >
          {training.focus}
        </h2>

        <p
          style={{
            margin: 0,
            color:
              "#666",
            fontSize:
              "13px",
          }}
        >
          📍 {training.location}
        </p>

        <div
          style={{
            marginTop:
              "15px",
            paddingTop:
              "13px",
            borderTop:
              "1px solid #eee",
          }}
        >
          <div
            style={{
              display:
                "flex",
              gap:
                "8px",
              flexWrap:
                "wrap",
            }}
          >
            <span
              style={{
                background:
                  "#e7f1eb",
                color:
                  "#123b2a",
                padding:
                  "6px 9px",
                borderRadius:
                  "999px",
                fontSize:
                  "10px",
                fontWeight:
                  "bold",
              }}
            >
              💚{" "}
              {trainingCheckIns.length}{" "}
              check-in
            </span>

            <span
              style={{
                background:
                  "#f2f8f4",
                color:
                  "#123b2a",
                padding:
                  "6px 9px",
                borderRadius:
                  "999px",
                fontSize:
                  "10px",
                fontWeight:
                  "bold",
              }}
            >
              👋{" "}
              {trainingCheckOuts.length}{" "}
              check-out
            </span>
          </div>

          {trainingCheckIns.length >
            0 && (
            <div
              style={{
                display:
                  "flex",
                flexWrap:
                  "wrap",
                gap:
                  "6px",
                marginTop:
                  "9px",
              }}
            >
              <span
                style={{
                  background:
                    "#e7f1eb",
                  color:
                    "#123b2a",
                  padding:
                    "4px 7px",
                  borderRadius:
                    "999px",
                  fontSize:
                    "9px",
                  fontWeight:
                    "bold",
                }}
              >
                ✓ {goodCount} bra
              </span>

              <span
                style={{
                  background:
                    "#fff8e7",
                  color:
                    "#806522",
                  padding:
                    "4px 7px",
                  borderRadius:
                    "999px",
                  fontSize:
                    "9px",
                  fontWeight:
                    "bold",
                }}
              >
                ● {followupCount} följ upp
              </span>

              <span
                style={{
                  background:
                    "#fff1f1",
                  color:
                    "#9b2c2c",
                  padding:
                    "4px 7px",
                  borderRadius:
                    "999px",
                  fontSize:
                    "9px",
                  fontWeight:
                    "bold",
                }}
              >
                ! {attentionCount} uppmärksamma
              </span>
            </div>
          )}

          <div
            style={{
              marginTop:
                "12px",
              color:
                "#123b2a",
              fontSize:
                "13px",
              fontWeight:
                "bold",
            }}
          >
            Visa spelarsvar →
          </div>
        </div>
      </button>
    )
  }

  /*
    HUVUDSIDAN
  */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily:
          "Arial, sans-serif",
        color: "#17202a",
      }}
    >
      <header
        style={{
          background:
            "#123b2a",
          color: "white",
          padding:
            "24px 20px",
          borderRadius:
            "0 0 24px 24px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background:
              "rgba(255,255,255,0.15)",
            color:
              "white",
            border:
              "1px solid rgba(255,255,255,0.3)",
            borderRadius:
              "10px",
            padding:
              "9px 13px",
            cursor:
              "pointer",
            marginBottom:
              "18px",
          }}
        >
          ← Tillbaka
        </button>

        <p
          style={{
            margin: 0,
            fontSize:
              "13px",
            opacity:
              0.8,
          }}
        >
          HOVSTA IF • LEDARLÄGE
        </p>

        <h1
          style={{
            margin:
              "8px 0 4px",
            fontSize:
              "28px",
          }}
        >
          Spelarnas svar 💚
        </h1>

        <p
          style={{
            margin: 0,
            opacity:
              0.9,
          }}
        >
          Följ spelarnas status före och efter
          träning
        </p>
      </header>

      <main
        style={{
          maxWidth:
            "600px",
          margin:
            "0 auto",
          padding:
            "20px",
        }}
      >
        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <div
            style={{
              marginBottom:
                "14px",
            }}
          >
            <p
              style={{
                margin:
                  "0 0 4px",
                color:
                  "#6b7280",
                fontSize:
                  "11px",
                fontWeight:
                  "bold",
                letterSpacing:
                  "0.7px",
              }}
            >
              KOMMANDE
            </p>

            <h2
              style={{
                margin: 0,
                color:
                  "#123b2a",
                fontSize:
                  "22px",
              }}
            >
              Kommande träningar
            </h2>
          </div>

          {upcomingTrainings.length ===
          0 ? (
            <section
              style={{
                background:
                  "white",
                borderRadius:
                  "18px",
                padding:
                  "22px",
                textAlign:
                  "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    "#666",
                }}
              >
                Inga kommande
                träningar.
              </p>
            </section>
          ) : (
            upcomingTrainings.map(
              (training) =>
                renderTrainingCard(
                  training,
                  "upcoming"
                )
            )
          )}
        </section>

        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <div
            style={{
              marginBottom:
                "14px",
            }}
          >
            <p
              style={{
                margin:
                  "0 0 4px",
                color:
                  "#6b7280",
                fontSize:
                  "11px",
                fontWeight:
                  "bold",
                letterSpacing:
                  "0.7px",
              }}
            >
              HISTORIK
            </p>

            <h2
              style={{
                margin: 0,
                color:
                  "#123b2a",
                fontSize:
                  "22px",
              }}
            >
              Tidigare träningar
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",
                color:
                  "#6b7280",
                fontSize:
                  "13px",
                lineHeight:
                  "1.5",
              }}
            >
              Senaste genomförda träningen
              visas först.
            </p>
          </div>

          {previousTrainings.length ===
          0 ? (
            <section
              style={{
                background:
                  "white",
                borderRadius:
                  "18px",
                padding:
                  "22px",
                textAlign:
                  "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    "#666",
                }}
              >
                Det finns inga tidigare
                träningar ännu.
              </p>
            </section>
          ) : (
            previousTrainings.map(
              (training) =>
                renderTrainingCard(
                  training,
                  "previous"
                )
            )
          )}
        </section>
      </main>
    </div>
  )
}

export default CoachCheckIns