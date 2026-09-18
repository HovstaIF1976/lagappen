import { useEffect, useState } from "react"
import EditTraining, {
  type TrainingData,
} from "./EditTraining"
import { supabase } from "./supabase"

type ManageTrainingsProps = {
  onBack: () => void
}

function ManageTrainings({
  onBack,
}: ManageTrainingsProps) {
  const [trainings, setTrainings] = useState<
    TrainingData[]
  >([])
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingData | null>(null)
  const [trainingToDelete, setTrainingToDelete] =
    useState<TrainingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const loadTrainings = async () => {
    setLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("trainings")
      .select(
        "id, date, time, location, focus, description, notes"
      )
      .order("date", { ascending: true })
      .order("time", { ascending: true })

    if (error) {
      console.error(
        "Kunde inte hämta träningar:",
        error
      )
      setTrainings([])
      setErrorMessage(
        "Kunde inte hämta lagets träningar."
      )
      setLoading(false)
      return
    }

    setTrainings(
      (data as TrainingData[] | null) ?? []
    )
    setLoading(false)
  }

  useEffect(() => {
    void loadTrainings()
  }, [])

  const formatDate = (date: string) => {
    if (!date) {
      return "Datum saknas"
    }

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${date}T12:00:00`))
  }

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || ""
  }

  const countExercises = (
    description: string | null
  ) => {
    if (!description) {
      return 0
    }

    const marker = "ÖVNINGAR\n"
    const markerIndex = description.indexOf(marker)

    if (markerIndex === -1) {
      return 0
    }

    const exerciseSection = description
      .slice(markerIndex + marker.length)
      .trim()

    if (!exerciseSection) {
      return 0
    }

    return exerciseSection
      .split(/\n\n(?=\d+\.\s)/)
      .filter((item) => /^\d+\.\s/.test(item.trim()))
      .length
  }

  const getMainDescription = (
    description: string | null
  ) => {
    if (!description) {
      return ""
    }

    const markerIndex =
      description.indexOf("\n\nÖVNINGAR\n")

    if (markerIndex === -1) {
      if (description.startsWith("ÖVNINGAR\n")) {
        return ""
      }

      return description
    }

    return description.slice(0, markerIndex).trim()
  }

  const handleSaved = async () => {
    setSelectedTraining(null)
    await loadTrainings()
  }

  const deleteTraining = async () => {
    if (!trainingToDelete || deleting) {
      return
    }

    setDeleting(true)
    setErrorMessage("")

    const { error } = await supabase
      .from("trainings")
      .delete()
      .eq("id", trainingToDelete.id)

    if (error) {
      console.error(
        "Kunde inte ta bort träning:",
        error
      )
      setErrorMessage(
        "Träningen kunde inte tas bort."
      )
      setDeleting(false)
      return
    }

    setTrainingToDelete(null)
    setDeleting(false)
    await loadTrainings()
  }

  if (selectedTraining) {
    return (
      <EditTraining
        training={selectedTraining}
        onBack={() => setSelectedTraining(null)}
        onSaved={() => {
          void handleSaved()
        }}
      />
    )
  }

  return (
    <div
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
            }}
          >
            HOVSTA IF • LEDARLÄGE
          </p>

          <h1
            style={{
              margin: "8px 0 6px",
              fontSize: "29px",
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
            Se, redigera och hantera lagets
            träningspass.
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
            {trainings.length} träningspass
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "#fff1f0",
              border: "1px solid #f1c0bc",
              color: "#8a2820",
              borderRadius: "12px",
              padding: "13px",
              marginBottom: "16px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {loading ? (
          <section
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "30px 20px",
              textAlign: "center",
              border: "1px solid #edf0ee",
            }}
          >
            <strong style={{ color: "#123b2a" }}>
              Hämtar träningar...
            </strong>
          </section>
        ) : trainings.length > 0 ? (
          trainings.map((training) => {
            const exerciseCount = countExercises(
              training.description
            )
            const mainDescription =
              getMainDescription(training.description)

            return (
              <section
                key={training.id}
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
                    <div style={{ flex: 1 }}>
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
                      🕒 {formatTime(training.time)}
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
                      ⚽ {exerciseCount}{" "}
                      {exerciseCount === 1
                        ? "övning"
                        : "övningar"}
                    </p>
                  </div>

                  {mainDescription && (
                    <p
                      style={{
                        margin: "14px 0 0",
                        color: "#5f6663",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {mainDescription}
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
            )
          })
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
              }}
            >
              När ett träningspass skapas visas
              det här.
            </p>
          </section>
        )}

        <p
          style={{
            margin: "24px 0 20px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
          }}
        >
          HOVSTA IF • LEDARLÄGE
        </p>
      </main>

      {trainingToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
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

            <div style={{ padding: "24px" }}>
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

              <h2 style={{ margin: "0 0 10px" }}>
                Ta bort träning?
              </h2>

              <p style={{ color: "#5f6663" }}>
                Är du säker på att du vill ta bort:
              </p>

              <p
                style={{
                  color: "#123b2a",
                  fontWeight: "bold",
                  fontSize: "19px",
                }}
              >
                {trainingToDelete.focus}
              </p>

              <p
                style={{
                  color: "#6b7280",
                  textTransform: "capitalize",
                  fontSize: "14px",
                }}
              >
                {formatDate(trainingToDelete.date)} •{" "}
                {formatTime(trainingToDelete.time)}
              </p>

              <div
                style={{
                  background: "#fff7f7",
                  border: "1px solid #ead0d0",
                  color: "#8b3434",
                  padding: "13px 14px",
                  borderRadius: "11px",
                  fontSize: "14px",
                  marginBottom: "20px",
                }}
              >
                Träningspasset kommer att tas bort.
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
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: "13px",
                    border: "1px solid #d7ddd9",
                    borderRadius: "11px",
                    background: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Avbryt
                </button>

                <button
                  onClick={() => void deleteTraining()}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: "13px",
                    border: "none",
                    borderRadius: "11px",
                    background: "#9b2c2c",
                    color: "white",
                    fontWeight: "bold",
                    cursor: deleting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {deleting
                    ? "Tar bort..."
                    : "Ta bort"}
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
