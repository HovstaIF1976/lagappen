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
          HOVSTA IF • LEDARLÄGE
        </p>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "28px",
          }}
        >
          Hantera träningar ⚽
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Se och hantera lagets träningspass
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
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: "0 0 5px",
            }}
          >
            Alla träningar
          </h2>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            {sortedTrainings.length} träningspass
          </p>
        </div>

        {sortedTrainings.length > 0 ? (
          sortedTrainings.map((training) => (
            <div
              key={
                training.id ??
                `${training.date}-${training.time}-${training.createdAt}`
              }
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                {formatDate(training.date)} •{" "}
                {training.time}
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                }}
              >
                {training.focus}
              </h2>

              <p
                style={{
                  margin: "0 0 6px",
                  color: "#555",
                }}
              >
                📍 {training.location}
              </p>

              <p
                style={{
                  margin: "0 0 16px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                ⚽ {training.exercises?.length ?? 0} övningar
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() =>
                    setSelectedTraining(training)
                  }
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #123b2a",
                    borderRadius: "10px",
                    background: "white",
                    color: "#123b2a",
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
                    border: "1px solid #d7b1b1",
                    borderRadius: "10px",
                    background: "#fff7f7",
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
              }}
            >
              Skapa ett träningspass så kommer det att
              visas här.
            </p>
          </section>
        )}
      </main>

      {trainingToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.45)",
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
              padding: "24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "12px",
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
                color: "#555",
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
                fontSize: "18px",
                margin: "0 0 6px",
              }}
            >
              {trainingToDelete.focus}
            </p>

            <p
              style={{
                color: "#6b7280",
                margin: "0 0 22px",
                textTransform: "capitalize",
              }}
            >
              {formatDate(trainingToDelete.date)} •{" "}
              {trainingToDelete.time}
            </p>

            <p
              style={{
                background: "#fff7f7",
                border: "1px solid #ead0d0",
                color: "#8b3434",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "20px",
              }}
            >
              Träningspasset och informationen i passet
              kommer att tas bort.
            </p>

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
                  border: "1px solid #d1d5db",
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
      )}
    </div>
  )
}

export default ManageTrainings