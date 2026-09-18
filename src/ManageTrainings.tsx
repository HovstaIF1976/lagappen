import { useState } from "react"
import EditTraining from "./EditTraining"

type ManageTrainingsProps = {
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

function ManageTrainings({ onBack }: ManageTrainingsProps) {
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)

  const [trainingToDelete, setTrainingToDelete] =
    useState<TrainingData | null>(null)

  const [refreshKey, setRefreshKey] = useState(0)

  const getTrainings = (): TrainingData[] => {
    const savedTrainings = localStorage.getItem(
      "hovstaTrainings"
    )

    if (!savedTrainings) {
      return []
    }

    try {
      const parsedTrainings = JSON.parse(savedTrainings)

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

  const isSameTraining = (
    firstTraining: TrainingData,
    secondTraining: TrainingData
  ) => {
    if (
      firstTraining.id !== undefined &&
      secondTraining.id !== undefined
    ) {
      return firstTraining.id === secondTraining.id
    }

    return (
      firstTraining.createdAt === secondTraining.createdAt
    )
  }

  const handleSaved = () => {
    setSelectedTraining(null)
    setRefreshKey((current) => current + 1)
  }

  const deleteTraining = () => {
    if (!trainingToDelete) {
      return
    }

    const savedTrainings = localStorage.getItem(
      "hovstaTrainings"
    )

    if (!savedTrainings) {
      setTrainingToDelete(null)
      return
    }

    try {
      const currentTrainings: TrainingData[] =
        JSON.parse(savedTrainings)

      const remainingTrainings = currentTrainings.filter(
        (training) =>
          !isSameTraining(training, trainingToDelete)
      )

      localStorage.setItem(
        "hovstaTrainings",
        JSON.stringify(remainingTrainings)
      )

      setTrainingToDelete(null)
      setRefreshKey((current) => current + 1)
    } catch {
      alert("Något gick fel när träningen skulle tas bort.")
    }
  }

  if (selectedTraining) {
    return (
      <EditTraining
        training={selectedTraining}
        onBack={() => setSelectedTraining(null)}
        onSaved={handleSaved}
      />
    )
  }

  return (
    <div
      key={refreshKey}
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
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.1)",
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
              margin: 0,
              color: "#f39200",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            HOVSTA IF • LEDARLÄGE
          </p>

          <h1
            style={{
              margin: "8px 0 6px",
              fontSize: "29px",
              letterSpacing: "-0.5px",
            }}
          >
            Hantera träningar ⚽
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "15px",
              lineHeight: "1.5",
            }}
          >
            Se, redigera och hantera lagets träningspass.
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
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "15px",
            marginBottom: "18px",
          }}
        >
          <div>
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
              Träningsplanering
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              Alla träningar
            </h2>
          </div>

          <div
            style={{
              background: "#edf4f0",
              color: "#123b2a",
              borderRadius: "20px",
              padding: "7px 11px",
              fontSize: "12px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {sortedTrainings.length}{" "}
            {sortedTrainings.length === 1
              ? "träningspass"
              : "träningspass"}
          </div>
        </div>

        {sortedTrainings.length > 0 ? (
          sortedTrainings.map((training) => (
            <section
              key={
                training.id ??
                `${training.date}-${training.time}-${training.createdAt}`
              }
              style={{
                background: "white",
                borderRadius: "18px",
                marginBottom: "14px",
                boxShadow:
                  "0 3px 14px rgba(18,59,42,0.07)",
                border: "1px solid #edf0ee",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "4px",
                  background: "#f39200",
                }}
              />

              <div
                style={{
                  padding: "18px 20px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                    >
                      {formatDate(training.date)}
                    </p>

                    <h2
                      style={{
                        margin: "7px 0 5px",
                        color: "#123b2a",
                        fontSize: "21px",
                      }}
                    >
                      {training.focus}
                    </h2>
                  </div>

                  <div
                    style={{
                      background: "#edf4f0",
                      color: "#123b2a",
                      borderRadius: "11px",
                      padding: "8px 11px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🕒 {training.time}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    padding: "13px 14px",
                    borderRadius: "12px",
                    background: "#f7f9f8",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#526158",
                      fontSize: "14px",
                    }}
                  >
                    📍 {training.location}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#526158",
                      fontSize: "14px",
                    }}
                  >
                    ⚽ {training.exercises?.length ?? 0}{" "}
                    {training.exercises?.length === 1
                      ? "övning"
                      : "övningar"}
                  </p>
                </div>

                {training.description && (
                  <p
                    style={{
                      margin: "14px 0 0",
                      color: "#5f6663",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {training.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={() =>
                      setSelectedTraining(training)
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "none",
                      borderRadius: "11px",
                      background: "#123b2a",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Redigera
                  </button>

                  <button
                    onClick={() =>
                      setTrainingToDelete(training)
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "1px solid #ead0d0",
                      borderRadius: "11px",
                      background: "#fff8f8",
                      color: "#9b2c2c",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            </section>
          ))
        ) : (
          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "34px 20px",
              textAlign: "center",
              boxShadow:
                "0 3px 14px rgba(18,59,42,0.07)",
              border: "1px solid #edf0ee",
              borderTop: "4px solid #f39200",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                margin: "0 auto 14px",
                borderRadius: "17px",
                background: "#edf4f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "27px",
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
                color: "#5f6663",
                lineHeight: "1.5",
              }}
            >
              När du skapar ett träningspass kommer
              det att visas här.
            </p>
          </section>
        )}

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

      {trainingToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10,20,15,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "white",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow:
                "0 16px 50px rgba(0,0,0,0.25)",
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
                padding: "24px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "15px",
                  background: "#fff2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "25px",
                  marginBottom: "16px",
                }}
              >
                🗑️
              </div>

              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#17202a",
                }}
              >
                Ta bort träning?
              </h2>

              <p
                style={{
                  color: "#5f6663",
                  lineHeight: "1.6",
                  margin: "0 0 6px",
                }}
              >
                Är du säker på att du vill ta bort:
              </p>

              <p
                style={{
                  color: "#123b2a",
                  fontWeight: "bold",
                  fontSize: "19px",
                  margin: "0 0 6px",
                }}
              >
                {trainingToDelete.focus}
              </p>

              <p
                style={{
                  color: "#6b7280",
                  margin: "0 0 20px",
                  textTransform: "capitalize",
                  fontSize: "14px",
                }}
              >
                {formatDate(trainingToDelete.date)} •{" "}
                {trainingToDelete.time}
              </p>

              <div
                style={{
                  background: "#fff7f7",
                  border: "1px solid #ead0d0",
                  color: "#8b3434",
                  padding: "13px 14px",
                  borderRadius: "11px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                Träningspasset och informationen i
                passet kommer att tas bort.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() =>
                    setTrainingToDelete(null)
                  }
                  style={{
                    flex: 1,
                    padding: "13px",
                    border: "1px solid #d7ddd9",
                    borderRadius: "11px",
                    background: "white",
                    color: "#17202a",
                    fontSize: "15px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Avbryt
                </button>

                <button
                  onClick={deleteTraining}
                  style={{
                    flex: 1,
                    padding: "13px",
                    border: "none",
                    borderRadius: "11px",
                    background: "#9b2c2c",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Ta bort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageTrainings