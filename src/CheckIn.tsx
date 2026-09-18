import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type CheckInProps = {
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
}

type CheckInStatus =
  | "loading"
  | "noTraining"
  | "tooEarly"
  | "closed"
  | "completed"
  | "open"

function CheckIn({ onBack }: CheckInProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [pain, setPain] = useState("")
  const [moodReason, setMoodReason] = useState("")
  const [other, setOther] = useState("")

  const [training, setTraining] =
    useState<TrainingData | null>(null)

  const [playerId, setPlayerId] =
    useState<string | null>(null)

  const [status, setStatus] =
    useState<CheckInStatus>("loading")

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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

  const getTrainingDateTime = (
    selectedTraining: TrainingData
  ) => {
    const time =
      selectedTraining.time?.slice(0, 5) || "23:59"

    return new Date(
      `${selectedTraining.date}T${time}:00`
    ).getTime()
  }

  const formatTrainingDate = (date: string) => {
    const dateObject = new Date(`${date}T12:00:00`)

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  useEffect(() => {
    let cancelled = false

    const loadCheckIn = async () => {
      setStatus("loading")
      setErrorMessage("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (userError || !user) {
        setErrorMessage(
          "Din inloggning kunde inte hämtas. Logga in igen."
        )
        setStatus("noTraining")
        return
      }

      setPlayerId(user.id)

      const { data: trainings, error: trainingError } =
        await supabase
          .from("trainings")
          .select(
            "id, date, time, location, focus, description, notes"
          )
          .order("date", { ascending: true })
          .order("time", { ascending: true })

      if (cancelled) return

      if (trainingError) {
        console.error(trainingError)
        setErrorMessage(
          "Kunde inte hämta träningarna."
        )
        setStatus("noTraining")
        return
      }

      const now = Date.now()

      const nextTraining =
        (trainings as TrainingData[] | null)?.find(
          (item) => getTrainingDateTime(item) >= now
        ) ?? null

      if (!nextTraining) {
        setTraining(null)
        setStatus("noTraining")
        return
      }

      setTraining(nextTraining)

      const trainingTime =
        getTrainingDateTime(nextTraining)

      const openTime =
        trainingTime - 6 * 60 * 60 * 1000

      if (now < openTime) {
        setStatus("tooEarly")
        return
      }

      if (now >= trainingTime) {
        setStatus("closed")
        return
      }

      const { data: existingCheckIn, error: checkInError } =
        await supabase
          .from("check_ins")
          .select("id")
          .eq("training_id", nextTraining.id)
          .eq("player_id", user.id)
          .maybeSingle()

      if (cancelled) return

      if (checkInError) {
        console.error(checkInError)
        setErrorMessage(
          "Kunde inte kontrollera din check-in."
        )
        setStatus("noTraining")
        return
      }

      if (existingCheckIn) {
        setStatus("completed")
        return
      }

      setStatus("open")
    }

    void loadCheckIn()

    return () => {
      cancelled = true
    }
  }, [])

  const saveCheckIn = async () => {
    if (!training || !playerId || saving) {
      return
    }

    const now = Date.now()
    const trainingTime =
      getTrainingDateTime(training)

    const openTime =
      trainingTime - 6 * 60 * 60 * 1000

    if (now < openTime) {
      alert("Check-in har inte öppnat ännu.")
      return
    }

    if (now >= trainingTime) {
      alert(
        "Check-in är stängd eftersom träningen har börjat."
      )
      setStatus("closed")
      return
    }

    if (mood === null || energy === null) {
      alert(
        "Välj hur du mår och hur mycket energi du har."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    const { data: existingCheckIn, error: duplicateError } =
      await supabase
        .from("check_ins")
        .select("id")
        .eq("training_id", training.id)
        .eq("player_id", playerId)
        .maybeSingle()

    if (duplicateError) {
      console.error(duplicateError)
      setErrorMessage(
        "Kunde inte kontrollera din check-in."
      )
      setSaving(false)
      return
    }

    if (existingCheckIn) {
      setStatus("completed")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("check_ins")
      .insert({
        training_id: training.id,
        player_id: playerId,
        mood,
        mood_reason: moodReason.trim() || null,
        energy,
        pain: pain.trim() || null,
        other: other.trim() || null,
      })

    if (error) {
      console.error(error)
      setErrorMessage(
        "Check-in kunde inte sparas. Försök igen."
      )
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)

    setTimeout(() => {
      onBack()
    }, 1500)
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
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  }

  if (status === "loading") {
    return (
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "38px",
              marginBottom: "12px",
            }}
          >
            ⚽
          </div>

          <strong style={{ color: "#123b2a" }}>
            Hämtar check-in...
          </strong>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
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

  if (!training || status === "noTraining") {
    return (
      <div style={pageStyle}>
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
              ...cardStyle,
              textAlign: "center",
              padding: "35px 20px",
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
              {errorMessage ||
                "Check-in blir tillgänglig när det finns en kommande träning."}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "tooEarly") {
    const trainingTime =
      getTrainingDateTime(training)

    const openTime = new Date(
      trainingTime - 6 * 60 * 60 * 1000
    )

    const formattedOpenTime =
      new Intl.DateTimeFormat("sv-SE", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(openTime)

    return (
      <div style={pageStyle}>
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
              ...cardStyle,
              textAlign: "center",
              padding: "35px 20px",
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

            <p style={{ color: "#555" }}>
              Check-in öppnar 6 timmar före träningen.
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
                ⚽ {training.time.slice(0, 5)} •{" "}
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

  if (status === "closed") {
    return (
      <div style={pageStyle}>
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
              ...cardStyle,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "42px" }}>🔒</div>

            <h2 style={{ color: "#123b2a" }}>
              Check-in har stängt
            </h2>

            <p style={{ color: "#666" }}>
              Träningen har redan börjat.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "completed") {
    return (
      <div style={pageStyle}>
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
              ...cardStyle,
              textAlign: "center",
              padding: "35px 20px",
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
                ⚽ {training.time.slice(0, 5)} •{" "}
                {training.location}
              </span>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
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
            color: "white",
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
            {training.time.slice(0, 5)} •{" "}
            {training.location}
          </p>
        </section>

        <section style={cardStyle}>
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
                onClick={() => setMood(option.value)}
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
              onChange={(event) =>
                setMoodReason(event.target.value)
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

        <section style={cardStyle}>
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

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            Har du ont någonstans?
          </h2>

          <textarea
            value={pain}
            onChange={(event) =>
              setPain(event.target.value)
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

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            Är det något annat du vill lyfta?
          </h2>

          <textarea
            value={other}
            onChange={(event) =>
              setOther(event.target.value)
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

        {errorMessage && (
          <div
            style={{
              background: "#fff1f0",
              border: "1px solid #f1c0bc",
              color: "#8a2820",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "14px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <button
          onClick={() => void saveCheckIn()}
          disabled={saving}
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            borderRadius: "14px",
            background: saving
              ? "#6b8277"
              : "#123b2a",
            color: "white",
            fontSize: "17px",
            fontWeight: "bold",
            cursor: saving
              ? "not-allowed"
              : "pointer",
            marginBottom: "30px",
          }}
        >
          {saving
            ? "Sparar..."
            : "Skicka check-in"}
        </button>
      </main>
    </div>
  )
}

export default CheckIn
