import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type TrainingProps = {
  onBack: () => void
}

type TrainingData = {
  id: string
  date: string
  time: string
  location: string
  focus: string
  description: string | null
  notes: string | null
  created_at: string
}

function Training({ onBack }: TrainingProps) {
  const [trainings, setTrainings] = useState<TrainingData[]>([])
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadTrainings = async () => {
      setLoading(true)
      setErrorMessage("")

      const { data, error } = await supabase
        .from("trainings")
        .select(
          "id, date, time, location, focus, description, notes, created_at"
        )
        .order("date", { ascending: true })
        .order("time", { ascending: true })

      if (cancelled) {
        return
      }

      if (error) {
        console.error(error)
        setErrorMessage("Kunde inte hämta träningarna.")
        setLoading(false)
        return
      }

      setTrainings((data as TrainingData[] | null) ?? [])
      setLoading(false)
    }

    void loadTrainings()

    return () => {
      cancelled = true
    }
  }, [])

  const getTrainingDateTime = (
    training: TrainingData
  ) => {
    const time = training.time?.slice(0, 5) || "00:00"

    return new Date(
      `${training.date}T${time}:00`
    ).getTime()
  }

  const sortedTrainings = [...trainings].sort(
    (a, b) =>
      getTrainingDateTime(a) -
      getTrainingDateTime(b)
  )

  const upcomingTrainings = sortedTrainings.filter(
    (training) =>
      getTrainingDateTime(training) >= Date.now()
  )

  const previousTrainings = sortedTrainings
    .filter(
      (training) =>
        getTrainingDateTime(training) < Date.now()
    )
    .reverse()

  const formatDate = (date: string) => {
    if (!date) {
      return "Datum saknas"
    }

    const dateObject = new Date(`${date}T12:00:00`)

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || "Tid saknas"
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
    marginBottom: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  }

  if (selectedTraining) {
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
            onClick={() => setSelectedTraining(null)}
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
            ← Alla träningar
          </button>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.8,
            }}
          >
            HOVSTA IF • TRÄNING
          </p>

          <h1
            style={{
              margin: "8px 0 6px",
              fontSize: "28px",
              color: "white",
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
            {formatDate(selectedTraining.date)}
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
            <h2
              style={{
                margin: "0 0 16px",
                color: "#123b2a",
              }}
            >
              Träningsinformation
            </h2>

            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Datum
                </div>

                <div
                  style={{
                    textTransform: "capitalize",
                  }}
                >
                  📅 {formatDate(selectedTraining.date)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Tid
                </div>

                <div>
                  🕒 {formatTime(selectedTraining.time)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Plats
                </div>

                <div>
                  📍 {selectedTraining.location}
                </div>
              </div>
            </div>
          </section>

          {selectedTraining.description && (
            <section style={cardStyle}>
              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#123b2a",
                }}
              >
                Om träningen
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#555",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedTraining.description}
              </p>
            </section>
          )}

          {selectedTraining.notes && (
            <section
              style={{
                ...cardStyle,
                background: "#fff8e6",
                border: "1px solid #f1d995",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#6f5714",
                }}
              >
                Viktigt inför träningen
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#6f6030",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedTraining.notes}
              </p>
            </section>
          )}

          <button
            onClick={() => setSelectedTraining(null)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #123b2a",
              background: "white",
              color: "#123b2a",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "30px",
            }}
          >
            ← Till alla träningar
          </button>
        </main>
      </div>
    )
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
          HOVSTA IF
        </p>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "28px",
            color: "white",
          }}
        >
          Träningar ⚽
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Se kommande och tidigare träningar
        </p>
      </header>

      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {loading && (
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "35px 20px",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "12px",
              }}
            >
              ⚽
            </div>

            <strong style={{ color: "#123b2a" }}>
              Hämtar träningar...
            </strong>
          </section>
        )}

        {!loading && errorMessage && (
          <section
            style={{
              ...cardStyle,
              background: "#fff1f0",
              border: "1px solid #f1c0bc",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                color: "#8a2820",
              }}
            >
              Något gick fel
            </h2>

            <p
              style={{
                margin: 0,
                color: "#8a2820",
              }}
            >
              {errorMessage}
            </p>
          </section>
        )}

        {!loading &&
          !errorMessage &&
          trainings.length === 0 && (
            <section
              style={{
                ...cardStyle,
                textAlign: "center",
                padding: "35px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                📅
              </div>

              <h2
                style={{
                  color: "#123b2a",
                  margin: "0 0 8px",
                }}
              >
                Inga träningar ännu
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#666",
                  lineHeight: "1.5",
                }}
              >
                När ledarna lägger in träningar
                visas de här.
              </p>
            </section>
          )}

        {!loading &&
          !errorMessage &&
          upcomingTrainings.length > 0 && (
            <>
              <h2
                style={{
                  color: "#123b2a",
                  fontSize: "20px",
                  margin: "4px 0 12px",
                }}
              >
                Kommande träningar
              </h2>

              {upcomingTrainings.map(
                (training, index) => (
                  <button
                    key={training.id}
                    onClick={() =>
                      setSelectedTraining(training)
                    }
                    style={{
                      ...cardStyle,
                      width: "100%",
                      border:
                        index === 0
                          ? "2px solid #123b2a"
                          : "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    {index === 0 && (
                      <div
                        style={{
                          display: "inline-block",
                          background: "#e7f1eb",
                          color: "#123b2a",
                          borderRadius: "999px",
                          padding: "5px 9px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          marginBottom: "10px",
                        }}
                      >
                        NÄSTA TRÄNING
                      </div>
                    )}

                    <h3
                      style={{
                        margin: "0 0 8px",
                        color: "#123b2a",
                        fontSize: "19px",
                      }}
                    >
                      {training.focus}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#555",
                        textTransform: "capitalize",
                      }}
                    >
                      📅 {formatDate(training.date)}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: "#666",
                      }}
                    >
                      🕒 {formatTime(training.time)} • 📍{" "}
                      {training.location}
                    </p>
                  </button>
                )
              )}
            </>
          )}

        {!loading &&
          !errorMessage &&
          previousTrainings.length > 0 && (
            <>
              <h2
                style={{
                  color: "#123b2a",
                  fontSize: "20px",
                  margin: "28px 0 12px",
                }}
              >
                Tidigare träningar
              </h2>

              {previousTrainings.map((training) => (
                <button
                  key={training.id}
                  onClick={() =>
                    setSelectedTraining(training)
                  }
                  style={{
                    ...cardStyle,
                    width: "100%",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    opacity: 0.82,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px",
                      color: "#123b2a",
                      fontSize: "18px",
                    }}
                  >
                    {training.focus}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#555",
                      textTransform: "capitalize",
                    }}
                  >
                    📅 {formatDate(training.date)}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    🕒 {formatTime(training.time)} • 📍{" "}
                    {training.location}
                  </p>
                </button>
              ))}
            </>
          )}
      </main>
    </div>
  )
}

export default Training
