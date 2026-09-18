import { useState } from "react"
import CheckIn from "./CheckIn"
import CheckOut from "./CheckOut"
import Training from "./Training"
import Coach from "./Coach"
import PlayerProfile from "./PlayerProfile"

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

function App() {
  const [page, setPage] = useState<
    | "home"
    | "checkin"
    | "checkout"
    | "training"
    | "coach"
    | "profile"
  >("home")

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

  const getTrainingDateTime = (
    training: TrainingData
  ) => {
    if (!training.date) {
      return Number.POSITIVE_INFINITY
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
      return Number.POSITIVE_INFINITY
    }

    return dateTime
  }

  const getTrainingId = (
    training: TrainingData
  ): number | string => {
    if (training.id !== undefined) {
      return training.id
    }

    return training.createdAt
  }

  const getNextTraining = (): TrainingData | null => {
    const trainings = getTrainings()
    const now = Date.now()

    const upcomingTrainings = trainings
      .filter(
        (training) =>
          getTrainingDateTime(training) >= now
      )
      .sort(
        (a, b) =>
          getTrainingDateTime(a) -
          getTrainingDateTime(b)
      )

    return upcomingTrainings[0] ?? null
  }

  const getCurrentCheckOutTraining =
    (): TrainingData | null => {
      const trainings = getTrainings()
      const now = Date.now()

      const sevenHours =
        7 * 60 * 60 * 1000

      const relevantTrainings = trainings
        .filter((training) => {
          const trainingTime =
            getTrainingDateTime(training)

          const closeTime =
            trainingTime + sevenHours

          return (
            trainingTime <= now &&
            now < closeTime
          )
        })
        .sort(
          (a, b) =>
            getTrainingDateTime(b) -
            getTrainingDateTime(a)
        )

      return relevantTrainings[0] ?? null
    }

  const nextTraining = getNextTraining()
  const checkOutTraining =
    getCurrentCheckOutTraining()

  const hasCheckedIn = (
    training: TrainingData
  ) => {
    const trainingId = getTrainingId(training)

    return getCheckIns().some(
      (checkIn) =>
        String(checkIn.trainingId) ===
          String(trainingId) &&
        checkIn.playerName === playerName
    )
  }

  const hasCheckedOut = (
    training: TrainingData
  ) => {
    const trainingId = getTrainingId(training)

    return getCheckOuts().some(
      (checkOut) =>
        String(checkOut.trainingId) ===
          String(trainingId) &&
        checkOut.playerName === playerName
    )
  }

  const getCheckInStatus = (
    training: TrainingData | null
  ) => {
    if (!training) {
      return "noTraining"
    }

    const now = Date.now()
    const trainingTime =
      getTrainingDateTime(training)

    const sixHours =
      6 * 60 * 60 * 1000

    const openTime =
      trainingTime - sixHours

    if (now < openTime) {
      return "locked"
    }

    if (now >= trainingTime) {
      return "closed"
    }

    if (hasCheckedIn(training)) {
      return "completed"
    }

    return "open"
  }

  const getCheckOutStatus = (
    training: TrainingData | null
  ) => {
    if (!training) {
      return "noTraining"
    }

    if (hasCheckedOut(training)) {
      return "completed"
    }

    const now = Date.now()
    const trainingTime =
      getTrainingDateTime(training)

    const openTime =
      trainingTime + 30 * 60 * 1000

    const closeTime =
      trainingTime + 7 * 60 * 60 * 1000

    if (now < openTime) {
      return "locked"
    }

    if (now >= closeTime) {
      return "closed"
    }

    return "open"
  }

  const checkInStatus =
    getCheckInStatus(nextTraining)

  const checkOutStatus =
    getCheckOutStatus(checkOutTraining)

  const getCheckInOpenTime = (
    training: TrainingData
  ) => {
    const trainingTime =
      getTrainingDateTime(training)

    const openTime = new Date(
      trainingTime -
        6 * 60 * 60 * 1000
    )

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(openTime)
  }

  const getCheckOutOpenTime = (
    training: TrainingData
  ) => {
    const trainingTime =
      getTrainingDateTime(training)

    const openTime = new Date(
      trainingTime +
        30 * 60 * 1000
    )

    return new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(openTime)
  }

  const getCheckOutCloseTime = (
    training: TrainingData
  ) => {
    const trainingTime =
      getTrainingDateTime(training)

    const closeTime = new Date(
      trainingTime +
        7 * 60 * 60 * 1000
    )

    return new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(closeTime)
  }

  const formatDate = (date: string) => {
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

  if (page === "checkin") {
    return (
      <CheckIn onBack={() => setPage("home")} />
    )
  }

  if (page === "checkout") {
    return (
      <CheckOut onBack={() => setPage("home")} />
    )
  }

  if (page === "training") {
    return (
      <Training onBack={() => setPage("home")} />
    )
  }

  if (page === "coach") {
    return (
      <Coach onBack={() => setPage("home")} />
    )
  }

  if (page === "profile") {
    return (
      <PlayerProfile
        onBack={() => setPage("home")}
      />
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
        <p
          style={{
            margin: 0,
            fontSize: "14px",
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
          Hej! 👋
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Välkommen till lagappen
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
              fontSize: "13px",
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Nästa träning
          </p>

          {nextTraining ? (
            <>
              <h2
                style={{
                  margin: "8px 0",
                  textTransform: "capitalize",
                }}
              >
                {formatDate(nextTraining.date)} •{" "}
                {nextTraining.time}
              </h2>

              <p
                style={{
                  margin: "4px 0",
                  color: "#555",
                }}
              >
                📍 {nextTraining.location}
              </p>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#123b2a",
                  fontWeight: "bold",
                }}
              >
                ⚽ {nextTraining.focus}
              </p>

              {checkInStatus === "locked" && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "15px",
                    borderRadius: "14px",
                    background: "#f4f6f8",
                    border: "1px solid #e1e4e6",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                      }}
                    >
                      🔒
                    </span>

                    <div>
                      <strong
                        style={{
                          display: "block",
                          color: "#444",
                        }}
                      >
                        Check-in är inte öppen ännu
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          color: "#6b7280",
                          fontSize: "13px",
                          textTransform: "capitalize",
                        }}
                      >
                        Öppnar{" "}
                        {getCheckInOpenTime(
                          nextTraining
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {checkInStatus === "open" && (
                <>
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "14px",
                      background: "#e7f1eb",
                      border:
                        "1px solid #c9ded1",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#123b2a",
                      }}
                    >
                      💚 Check-in är öppen
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#526158",
                        fontSize: "13px",
                      }}
                    >
                      Berätta hur du mår inför
                      träningen.
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setPage("checkin")
                    }
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "14px",
                      border: "none",
                      borderRadius: "12px",
                      background: "#123b2a",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Gör check-in
                  </button>
                </>
              )}

              {checkInStatus ===
                "completed" && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "15px",
                    borderRadius: "14px",
                    background: "#e7f1eb",
                    border:
                      "1px solid #c9ded1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        minWidth: "34px",
                        borderRadius: "50%",
                        background: "#123b2a",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </div>

                    <div>
                      <strong
                        style={{
                          display: "block",
                          color: "#123b2a",
                        }}
                      >
                        Du har checkat in
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          color: "#526158",
                          fontSize: "13px",
                        }}
                      >
                        Din check-in inför träningen
                        är registrerad.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2
                style={{
                  margin: "8px 0",
                }}
              >
                Ingen kommande träning
              </h2>

              <p
                style={{
                  margin: "4px 0",
                  color: "#555",
                }}
              >
                Det finns ingen kommande träning
                publicerad ännu.
              </p>
            </>
          )}
        </section>

        {checkOutTraining && (
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
                fontSize: "13px",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Efter träningen
            </p>

            <h2
              style={{
                margin: "8px 0",
                color: "#123b2a",
              }}
            >
              Check-out 👋
            </h2>

            <p
              style={{
                margin: "4px 0",
                color: "#555",
                textTransform: "capitalize",
              }}
            >
              {formatDate(
                checkOutTraining.date
              )}{" "}
              • {checkOutTraining.time}
            </p>

            <p
              style={{
                margin: "8px 0 0",
                color: "#555",
              }}
            >
              ⚽ {checkOutTraining.focus}
            </p>

            {checkOutStatus === "locked" && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "15px",
                  borderRadius: "14px",
                  background: "#fff8e6",
                  border: "1px solid #f1d995",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#6f5714",
                  }}
                >
                  🔒 Check-out öppnar{" "}
                  {getCheckOutOpenTime(
                    checkOutTraining
                  )}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: "4px",
                    color: "#75652f",
                    fontSize: "13px",
                  }}
                >
                  Check-out blir tillgänglig 30
                  minuter efter träningsstart.
                </span>
              </div>
            )}

            {checkOutStatus === "open" && (
              <>
                <div
                  style={{
                    marginTop: "18px",
                    padding: "14px",
                    borderRadius: "14px",
                    background: "#e7f1eb",
                    border: "1px solid #c9ded1",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: "#123b2a",
                    }}
                  >
                    💚 Check-out är öppen
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#526158",
                      fontSize: "13px",
                    }}
                  >
                    Berätta hur du upplevde
                    träningen.
                  </span>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#526158",
                      fontSize: "13px",
                    }}
                  >
                    Öppen till{" "}
                    {getCheckOutCloseTime(
                      checkOutTraining
                    )}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setPage("checkout")
                  }
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "14px",
                    border: "none",
                    borderRadius: "12px",
                    background: "#123b2a",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Gör check-out
                </button>
              </>
            )}

            {checkOutStatus ===
              "completed" && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "15px",
                  borderRadius: "14px",
                  background: "#e7f1eb",
                  border: "1px solid #c9ded1",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      minWidth: "34px",
                      borderRadius: "50%",
                      background: "#123b2a",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#123b2a",
                      }}
                    >
                      Du har checkat ut
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        color: "#526158",
                        fontSize: "13px",
                      }}
                    >
                      Din check-out är registrerad.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

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
              fontSize: "13px",
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Träningsplan
          </p>

          {nextTraining ? (
            <>
              <h2
                style={{
                  margin: "8px 0",
                }}
              >
                {nextTraining.focus}
              </h2>

              <p
                style={{
                  color: "#555",
                  lineHeight: "1.5",
                }}
              >
                Se träningsplanen och förbered dig
                inför nästa träning.
              </p>

              <button
                onClick={() =>
                  setPage("training")
                }
                style={{
                  padding: "10px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Se träningar
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  color: "#666",
                }}
              >
                Ingen kommande träningsplan finns
                tillgänglig.
              </p>

              <button
                onClick={() =>
                  setPage("training")
                }
                style={{
                  padding: "10px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Se alla träningar
              </button>
            </>
          )}
        </section>

        <section
          style={{
            background: "#e7f1eb",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "16px",
            border: "1px solid #c9ded1",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#52705f",
              textTransform: "uppercase",
            }}
          >
            Ledare
          </p>

          <h2
            style={{
              margin: "8px 0",
              color: "#123b2a",
            }}
          >
            Ledarläge
          </h2>

          <p
            style={{
              color: "#526158",
              lineHeight: "1.5",
            }}
          >
            Hantera träningar, spelare och
            check-ins.
          </p>

          <button
            onClick={() =>
              setPage("coach")
            }
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "12px",
              background: "#123b2a",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Öppna ledarläge
          </button>
        </section>

        <nav
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "14px 8px",
            display: "flex",
            justifyContent: "space-around",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              textAlign: "center",
              fontSize: "13px",
            }}
          >
            🏠
            <br />
            Hem
          </span>

          <span
            onClick={() => {
              if (
                checkInStatus === "open" ||
                checkInStatus === "completed"
              ) {
                setPage("checkin")
              }
            }}
            style={{
              textAlign: "center",
              fontSize: "13px",
              cursor:
                checkInStatus === "open" ||
                checkInStatus === "completed"
                  ? "pointer"
                  : "default",
              opacity:
                checkInStatus === "open" ||
                checkInStatus === "completed"
                  ? 1
                  : 0.45,
            }}
          >
            💚
            <br />
            Check-in
          </span>

          <span
            onClick={() => {
              if (
                checkOutStatus === "open" ||
                checkOutStatus === "completed"
              ) {
                setPage("checkout")
              }
            }}
            style={{
              textAlign: "center",
              fontSize: "13px",
              cursor:
                checkOutStatus === "open" ||
                checkOutStatus === "completed"
                  ? "pointer"
                  : "default",
              opacity:
                checkOutStatus === "open" ||
                checkOutStatus === "completed"
                  ? 1
                  : 0.45,
            }}
          >
            👋
            <br />
            Check-out
          </span>

          <span
            onClick={() =>
              setPage("training")
            }
            style={{
              textAlign: "center",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ⚽
            <br />
            Träningar
          </span>

          <span
            onClick={() =>
              setPage("profile")
            }
            style={{
              textAlign: "center",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            👤
            <br />
            Profil
          </span>
        </nav>
      </main>
    </div>
  )
}

export default App