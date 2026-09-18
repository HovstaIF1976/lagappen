import { useState } from "react"

type TrainingProps = {
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

function Training({ onBack }: TrainingProps) {
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)

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

  const trainings = getTrainings()

  const sortedTrainings = [...trainings].sort((a, b) => {
    const firstDate = new Date(
      `${a.date}T${a.time || "00:00"}`
    ).getTime()

    const secondDate = new Date(
      `${b.date}T${b.time || "00:00"}`
    ).getTime()

    return firstDate - secondDate
  })

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

  if (selectedTraining) {
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
            onClick={() => setSelectedTraining(null)}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
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
          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              📅 Träningsinformation
            </h2>

            <p
              style={{
                margin: "10px 0",
                textTransform: "capitalize",
              }}
            >
              <strong>Datum:</strong>{" "}
              {formatDate(selectedTraining.date)}
            </p>

            <p
              style={{
                margin: "10px 0",
              }}
            >
              <strong>Tid:</strong>{" "}
              {selectedTraining.time}
            </p>

            <p
              style={{
                margin: "10px 0",
              }}
            >
              <strong>Plats:</strong>{" "}
              {selectedTraining.location}
            </p>
          </section>

          {selectedTraining.description.trim() !== "" && (
            <section
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                🎯 Träningsfokus
              </h2>

              <p
                style={{
                  marginBottom: 0,
                  color: "#555",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedTraining.description}
              </p>
            </section>
          )}

          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              ⚽ Övningar
            </h2>

            {selectedTraining.exercises &&
            selectedTraining.exercises.length > 0 ? (
              selectedTraining.exercises.map(
                (exercise, index) => (
                  <div
                    key={exercise.id}
                    style={{
                      padding: "16px",
                      background: "#f7f8f8",
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      marginBottom:
                        index ===
                        selectedTraining.exercises.length - 1
                          ? "0"
                          : "12px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 5px",
                        color: "#6b7280",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Övning {index + 1}
                    </p>

                    {exercise.name.trim() !== "" && (
                      <h3
                        style={{
                          margin: "0 0 8px",
                          color: "#123b2a",
                        }}
                      >
                        {exercise.name}
                      </h3>
                    )}

                    {exercise.description.trim() !== "" && (
                      <p
                        style={{
                          margin: 0,
                          color: "#555",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {exercise.description}
                      </p>
                    )}
                  </div>
                )
              )
            ) : (
              <p
                style={{
                  marginBottom: 0,
                  color: "#666",
                }}
              >
                Inga övningar har lagts till ännu.
              </p>
            )}
          </section>

          {selectedTraining.notes.trim() !== "" && (
            <section
              style={{
                background: "#fff8e7",
                border: "1px solid #ead9a5",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                💡 Att tänka på
              </h2>

              <p
                style={{
                  marginBottom: 0,
                  color: "#5f5743",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedTraining.notes}
              </p>
            </section>
          )}
        </main>
      </div>
    )
  }

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
            border: "1px solid rgba(255,255,255,0.3)",
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
          Se lagets träningsplanering
        </p>
      </header>

      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {sortedTrainings.length > 0 ? (
          sortedTrainings.map((training) => (
            <button
              key={
                training.id ??
                `${training.date}-${training.time}-${training.createdAt}`
              }
              onClick={() => setSelectedTraining(training)}
              style={{
                width: "100%",
                display: "block",
                textAlign: "left",
                background: "white",
                border: "none",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                cursor: "pointer",
                color: "#17202a",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {formatDate(training.date)} • {training.time}
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                  fontSize: "21px",
                }}
              >
                {training.focus}
              </h2>

              <p
                style={{
                  margin: "0 0 14px",
                  color: "#555",
                }}
              >
                📍 {training.location}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: "1px solid #eee",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {training.exercises?.length ?? 0} övningar
                </span>

                <span
                  style={{
                    color: "#123b2a",
                    fontWeight: "bold",
                  }}
                >
                  Öppna →
                </span>
              </div>
            </button>
          ))
        ) : (
          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "30px 20px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "12px",
              }}
            >
              ⚽
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#123b2a",
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
              När ledarna publicerar träningspass kommer de att
              visas här.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default Training