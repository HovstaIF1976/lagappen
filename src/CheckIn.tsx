import { useState } from "react"

type CheckInProps = {
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

function CheckIn({ onBack }: CheckInProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [pain, setPain] = useState("")
  const [moodReason, setMoodReason] = useState("")
  const [other, setOther] = useState("")
  const [saved, setSaved] = useState(false)

  const playerName = "Testspelare"

  const moodOptions = [
    { value: 1, emoji: "😞", label: "Inte bra" },
    { value: 2, emoji: "😕", label: "Sådär" },
    { value: 3, emoji: "😐", label: "Okej" },
    { value: 4, emoji: "🙂", label: "Bra" },
    { value: 5, emoji: "😄", label: "Jättebra" },
  ]

  const energyOptions = [
    { value: 1, emoji: "🪫", label: "Helt slut" },
    { value: 2, emoji: "🔋", label: "Lite energi" },
    { value: 3, emoji: "🔋", label: "Okej" },
    { value: 4, emoji: "🔋", label: "Bra energi" },
    { value: 5, emoji: "⚡", label: "Massor av energi" },
  ]

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
    const now = Date.now()

    const upcomingTrainings = getTrainings()
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

  const training = getNextTraining()

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

  const formatTrainingDate = (date: string) => {
    const dateObject = new Date(
      `${date}T12:00:00`
    )

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  const hasAlreadyCheckedIn = () => {
    if (!training) {
      return false
    }

    const trainingId = getTrainingId(training)

    return getCheckIns().some(
      (checkIn) =>
        String(checkIn.trainingId) ===
          String(trainingId) &&
        checkIn.playerName === playerName
    )
  }

  const alreadyCheckedIn =
    hasAlreadyCheckedIn()

  const getCheckInStatus = () => {
    if (!training) {
      return {
        status: "noTraining",
        hoursUntilOpen: 0,
      }
    }

    const now = Date.now()
    const trainingTime =
      getTrainingDateTime(training)

    const sixHours =
      6 * 60 * 60 * 1000

    const openTime =
      trainingTime - sixHours

    if (now < openTime) {
      return {
        status: "tooEarly",
        hoursUntilOpen:
          (openTime - now) /
          (60 * 60 * 1000),
      }
    }

    if (now >= trainingTime) {
      return {
        status: "closed",
        hoursUntilOpen: 0,
      }
    }

    if (alreadyCheckedIn) {
      return {
        status: "completed",
        hoursUntilOpen: 0,
      }
    }

    return {
      status: "open",
      hoursUntilOpen: 0,
    }
  }

  const checkInStatus = getCheckInStatus()

  const saveCheckIn = () => {
    if (!training) {
      return
    }

    /*
      Vi kontrollerar tiden igen precis när
      spelaren trycker på Skicka.
    */
    const now = Date.now()
    const trainingTime =
      getTrainingDateTime(training)

    const openTime =
      trainingTime -
      6 * 60 * 60 * 1000

    if (now < openTime) {
      alert(
        "Check-in har inte öppnat ännu."
      )
      return
    }

    if (now >= trainingTime) {
      alert(
        "Check-in är stängd eftersom träningen har börjat."
      )
      return
    }

    if (mood === null || energy === null) {
      alert(
        "Välj hur du mår och hur mycket energi du har."
      )
      return
    }

    const currentCheckIns = getCheckIns()

    const trainingId =
      getTrainingId(training)

    const duplicateCheckIn =
      currentCheckIns.some(
        (checkIn) =>
          String(checkIn.trainingId) ===
            String(trainingId) &&
          checkIn.playerName === playerName
      )

    if (duplicateCheckIn) {
      alert(
        "Du har redan gjort din check-in inför den här träningen."
      )
      return
    }

    const newCheckIn: CheckInData = {
      id: Date.now(),
      trainingId,
      playerName,
      mood,
      moodReason,
      energy,
      pain,
      other,
      date: new Date().toISOString(),
    }

    const updatedCheckIns = [
      ...currentCheckIns,
      newCheckIn,
    ]

    localStorage.setItem(
      "hovstaCheckIns",
      JSON.stringify(updatedCheckIns)
    )

    setSaved(true)

    setTimeout(() => onBack(), 1500)
  }

  if (saved) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          color: "#17202a",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "40px 24px",
            textAlign: "center",
            width: "100%",
            maxWidth: "400px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "#e6f4ea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "36px",
              color: "#123b2a",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              color: "#123b2a",
              fontSize: "26px",
            }}
          >
            Check-in registrerad!
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "16px",
            }}
          >
            Tack! Vi ses på träningen ⚽
          </p>
        </div>
      </div>
    )
  }

  if (
    !training ||
    checkInStatus.status === "noTraining"
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          fontFamily: "Arial, sans-serif",
          color: "#17202a",
        }}
      >
        <button
          onClick={onBack}
          style={{
            margin: "16px 20px 0",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          ← Tillbaka
        </button>

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "35px 20px",
              textAlign: "center",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "46px",
                marginBottom: "14px",
              }}
            >
              ⚽
            </div>

            <h2
              style={{
                color: "#123b2a",
                margin: "0 0 8px",
              }}
            >
              Ingen kommande träning
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Check-in blir tillgänglig när det finns
              en kommande träning.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (checkInStatus.status === "tooEarly") {
    const trainingTime =
      getTrainingDateTime(training)

    const openTime = new Date(
      trainingTime -
        6 * 60 * 60 * 1000
    )

    const formattedOpenTime =
      new Intl.DateTimeFormat("sv-SE", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(openTime)

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          fontFamily: "Arial, sans-serif",
          color: "#17202a",
        }}
      >
        <button
          onClick={onBack}
          style={{
            margin: "16px 20px 0",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          ← Tillbaka
        </button>

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "35px 20px",
              textAlign: "center",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "46px",
                marginBottom: "14px",
              }}
            >
              🔒
            </div>

            <h2
              style={{
                color: "#123b2a",
                margin: "0 0 8px",
              }}
            >
              Check-in är inte öppen ännu
            </h2>

            <p
              style={{
                color: "#555",
                lineHeight: "1.6",
              }}
            >
              Check-in öppnar 6 timmar före
              träningen.
            </p>

            <div
              style={{
                background: "#f4f6f8",
                borderRadius: "14px",
                padding: "16px",
                marginTop: "20px",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#123b2a",
                  marginBottom: "6px",
                  textTransform: "capitalize",
                }}
              >
                {formatTrainingDate(training.date)}
              </strong>

              <span style={{ color: "#555" }}>
                ⚽ {training.time} •{" "}
                {training.location}
              </span>
            </div>

            <p
              style={{
                margin: "20px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                textTransform: "capitalize",
              }}
            >
              💚 Öppnar {formattedOpenTime}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (checkInStatus.status === "completed") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          fontFamily: "Arial, sans-serif",
          color: "#17202a",
        }}
      >
        <button
          onClick={onBack}
          style={{
            margin: "16px 20px 0",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          ← Tillbaka
        </button>

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "35px 20px",
              textAlign: "center",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: "65px",
                height: "65px",
                margin: "0 auto 18px",
                borderRadius: "50%",
                background: "#e7f1eb",
                color: "#123b2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <h2
              style={{
                color: "#123b2a",
                margin: "0 0 8px",
              }}
            >
              Du har checkat in
            </h2>

            <p
              style={{
                margin: "0 0 20px",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Din check-in inför den här träningen
              är registrerad.
            </p>

            <div
              style={{
                background: "#f4f6f8",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#123b2a",
                  marginBottom: "6px",
                  textTransform: "capitalize",
                }}
              >
                {formatTrainingDate(training.date)}
              </strong>

              <span style={{ color: "#555" }}>
                ⚽ {training.time} •{" "}
                {training.location}
              </span>
            </div>
          </section>
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
      <button
        onClick={onBack}
        style={{
          margin: "16px 20px 0",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "10px 14px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        ← Tillbaka
      </button>

      <header
        style={{
          background: "#123b2a",
          color: "white",
          padding: "24px 20px",
          marginTop: "12px",
          borderRadius: "24px",
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
          Check-in 💚
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Hur känns det inför träningen?
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
            background: "#e7f1eb",
            border: "1px solid #c9ded1",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              color: "#52705f",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            Check-in för
          </p>

          <h2
            style={{
              margin: "0 0 7px",
              color: "#123b2a",
            }}
          >
            {training.focus}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#526158",
              textTransform: "capitalize",
            }}
          >
            {formatTrainingDate(training.date)} •{" "}
            {training.time} • {training.location}
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
          <h2 style={{ marginTop: 0 }}>
            Hur mår du idag?
          </h2>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "6px",
            }}
          >
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setMood(option.value)
                }
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: "12px",
                  border:
                    mood === option.value
                      ? "3px solid #123b2a"
                      : "1px solid #ddd",
                  background:
                    mood === option.value
                      ? "#e7f1eb"
                      : "white",
                  cursor: "pointer",
                  fontSize: "28px",
                }}
              >
                {option.emoji}

                <div
                  style={{
                    fontSize: "11px",
                    marginTop: "5px",
                    color: "#555",
                  }}
                >
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        {mood !== null && mood <= 3 && (
          <section
            style={{
              background: "#fffaf0",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "16px",
              border: "1px solid #f0dfb0",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Vill du berätta lite mer?
            </h3>

            <p
              style={{
                color: "#666",
                fontSize: "14px",
              }}
            >
              Berätta gärna om det är något som
              påverkar hur du mår idag.
            </p>

            <textarea
              value={moodReason}
              onChange={(e) =>
                setMoodReason(e.target.value)
              }
              placeholder="Skriv här..."
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "15px",
                resize: "vertical",
              }}
            />
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
          <h2 style={{ marginTop: 0 }}>
            Hur mycket energi har du?
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: "14px",
            }}
          >
            Välj det som stämmer bäst just nu.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "6px",
            }}
          >
            {energyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setEnergy(option.value)
                }
                style={{
                  flex: 1,
                  padding: "12px 4px",
                  borderRadius: "12px",
                  border:
                    energy === option.value
                      ? "3px solid #123b2a"
                      : "1px solid #ddd",
                  background:
                    energy === option.value
                      ? "#e7f1eb"
                      : "white",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "25px" }}>
                  {option.emoji}
                </div>

                <strong style={{ fontSize: "18px" }}>
                  {option.value}
                </strong>

                <div
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    color: "#555",
                  }}
                >
                  {option.label}
                </div>
              </button>
            ))}
          </div>
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
          <h2 style={{ marginTop: 0 }}>
            Har du ont någonstans?
          </h2>

          <textarea
            value={pain}
            onChange={(e) =>
              setPain(e.target.value)
            }
            placeholder="Exempel: ont i knät, stel i baksida lår, inget..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "15px",
              resize: "vertical",
            }}
          />
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
          <h2 style={{ marginTop: 0 }}>
            Är det något annat du vill lyfta?
          </h2>

          <textarea
            value={other}
            onChange={(e) =>
              setOther(e.target.value)
            }
            placeholder="Det här är frivilligt..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "15px",
              resize: "vertical",
            }}
          />
        </section>

        <button
          onClick={saveCheckIn}
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            borderRadius: "14px",
            background: "#123b2a",
            color: "white",
            fontSize: "17px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "30px",
          }}
        >
          Skicka check-in
        </button>
      </main>
    </div>
  )
}

export default CheckIn