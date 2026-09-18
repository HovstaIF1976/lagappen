import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type CheckOutProps = {
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

type CheckOutStatus =
  | "loading"
  | "noTraining"
  | "waiting"
  | "open"
  | "completed"
  | "closed"

function CheckOut({ onBack }: CheckOutProps) {
  const [feeling, setFeeling] = useState<number | null>(null)
  const [effort, setEffort] = useState<number | null>(null)
  const [body, setBody] = useState<number | null>(null)
  const [comment, setComment] = useState("")

  const [training, setTraining] =
    useState<TrainingData | null>(null)

  const [playerId, setPlayerId] =
    useState<string | null>(null)

  const [status, setStatus] =
    useState<CheckOutStatus>("loading")

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const getTrainingDateTime = (
    selectedTraining: TrainingData
  ): Date => {
    const time =
      selectedTraining.time?.slice(0, 5) || "23:59"

    return new Date(
      `${selectedTraining.date}T${time}:00`
    )
  }

  const getCheckOutOpenTime = (
    selectedTraining: TrainingData
  ): Date => {
    return new Date(
      getTrainingDateTime(selectedTraining).getTime() +
        30 * 60 * 1000
    )
  }

  const getCheckOutCloseTime = (
    selectedTraining: TrainingData
  ): Date => {
    return new Date(
      getTrainingDateTime(selectedTraining).getTime() +
        7 * 60 * 60 * 1000
    )
  }

  const formatTrainingDate = (
    selectedTraining: TrainingData
  ) => {
    const date = new Date(
      `${selectedTraining.date}T12:00:00`
    )

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date)
  }

  const formatCheckOutOpenTime = (
    selectedTraining: TrainingData
  ) => {
    return new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(getCheckOutOpenTime(selectedTraining))
  }

  const formatCheckOutCloseTime = (
    selectedTraining: TrainingData
  ) => {
    return new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(getCheckOutCloseTime(selectedTraining))
  }

  useEffect(() => {
    let cancelled = false

    const loadCheckOut = async () => {
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
          .order("date", { ascending: false })
          .order("time", { ascending: false })

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

      const relevantTraining =
        (trainings as TrainingData[] | null)?.find(
          (item) => {
            const start =
              getTrainingDateTime(item).getTime()

            const close =
              getCheckOutCloseTime(item).getTime()

            return now >= start && now < close
          }
        ) ?? null

      if (!relevantTraining) {
        setTraining(null)
        setStatus("noTraining")
        return
      }

      setTraining(relevantTraining)

      const { data: existingCheckOut, error: checkOutError } =
        await supabase
          .from("check_outs")
          .select("id")
          .eq("training_id", relevantTraining.id)
          .eq("player_id", user.id)
          .maybeSingle()

      if (cancelled) return

      if (checkOutError) {
        console.error(checkOutError)
        setErrorMessage(
          "Kunde inte kontrollera din check-out."
        )
        setStatus("noTraining")
        return
      }

      if (existingCheckOut) {
        setStatus("completed")
        return
      }

      const openTime =
        getCheckOutOpenTime(relevantTraining).getTime()

      const closeTime =
        getCheckOutCloseTime(relevantTraining).getTime()

      if (now < openTime) {
        setStatus("waiting")
        return
      }

      if (now >= closeTime) {
        setStatus("closed")
        return
      }

      setStatus("open")
    }

    void loadCheckOut()

    return () => {
      cancelled = true
    }
  }, [])

  const saveCheckOut = async () => {
    if (!training || !playerId || saving) {
      return
    }

    const now = Date.now()

    if (
      now <
      getCheckOutOpenTime(training).getTime()
    ) {
      alert(
        `Check-out öppnar ${formatCheckOutOpenTime(
          training
        )}.`
      )
      return
    }

    if (
      now >=
      getCheckOutCloseTime(training).getTime()
    ) {
      alert(
        "Check-out för den här träningen har stängt."
      )
      setStatus("closed")
      return
    }

    if (
      feeling === null ||
      effort === null ||
      body === null
    ) {
      alert(
        "Svara på de tre frågorna innan du skickar."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    const { data: existingCheckOut, error: duplicateError } =
      await supabase
        .from("check_outs")
        .select("id")
        .eq("training_id", training.id)
        .eq("player_id", playerId)
        .maybeSingle()

    if (duplicateError) {
      console.error(duplicateError)
      setErrorMessage(
        "Kunde inte kontrollera din check-out."
      )
      setSaving(false)
      return
    }

    if (existingCheckOut) {
      setStatus("completed")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("check_outs")
      .insert({
        training_id: training.id,
        player_id: playerId,
        feeling,
        effort,
        body,
        comment: comment.trim() || null,
      })

    if (error) {
      console.error(error)
      setErrorMessage(
        "Check-out kunde inte sparas. Försök igen."
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
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.06)",
  }

  const optionButtonStyle = (
    selected: boolean
  ): React.CSSProperties => ({
    flex: 1,
    minWidth: "48px",
    height: "52px",
    borderRadius: "12px",
    border: selected
      ? "2px solid #123b2a"
      : "1px solid #d1d5db",
    background: selected
      ? "#e7f1eb"
      : "white",
    color: "#17202a",
    fontSize: "18px",
    fontWeight: selected ? "bold" : "normal",
    cursor: "pointer",
  })

  const header = (
    title: string,
    subtitle?: string
  ) => (
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
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  )

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
            Hämtar check-out...
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
            width: "100%",
            maxWidth: "420px",
            background: "white",
            borderRadius: "24px",
            padding: "40px 24px",
            textAlign: "center",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "#e7f1eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#123b2a",
              fontSize: "34px",
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
            Tack för din check-out!
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Dina svar är sparade för den här
            träningen.
          </p>
        </div>
      </div>
    )
  }

  if (!training || status === "noTraining") {
    return (
      <div style={pageStyle}>
        {header("Check-out")}

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <section style={cardStyle}>
            <div
              style={{
                fontSize: "38px",
                marginBottom: "12px",
              }}
            >
              ⚽
            </div>

            <h2 style={{ marginTop: 0 }}>
              Ingen aktuell check-out
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.5",
                marginBottom: 0,
              }}
            >
              {errorMessage ||
                "Check-out öppnar 30 minuter efter träningsstart och stänger 7 timmar efter träningsstart."}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "waiting") {
    return (
      <div style={pageStyle}>
        {header("Check-out 👋")}

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <section
            style={{
              ...cardStyle,
              background: "#fff8e6",
              border: "1px solid #f1d995",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "12px",
              }}
            >
              🔒
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#6f5714",
              }}
            >
              Check-out öppnar{" "}
              {formatCheckOutOpenTime(training)}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#75652f",
                lineHeight: "1.5",
              }}
            >
              Du kan göra din check-out 30 minuter
              efter träningsstart.
            </p>
          </section>

          <section style={cardStyle}>
            <h2
              style={{
                margin: "0 0 8px",
                color: "#123b2a",
              }}
            >
              {training.focus}
            </h2>

            <p style={{ margin: 0, color: "#666" }}>
              {formatTrainingDate(training)} •{" "}
              {training.time.slice(0, 5)}
            </p>

            <p
              style={{
                margin: "10px 0 0",
                color: "#777",
                fontSize: "13px",
              }}
            >
              Check-out stänger{" "}
              {formatCheckOutCloseTime(training)}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "completed") {
    return (
      <div style={pageStyle}>
        {header("Check-out")}

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "32px 20px",
            }}
          >
            <div
              style={{
                width: "62px",
                height: "62px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#e7f1eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#123b2a",
                fontSize: "30px",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <h2 style={{ margin: "0 0 8px" }}>
              Du har checkat ut
            </h2>

            <p style={{ margin: 0, color: "#666" }}>
              Din check-out för den här träningen
              är redan registrerad.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "closed") {
    return (
      <div style={pageStyle}>
        {header("Check-out")}

        <main
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <section style={cardStyle}>
            <div
              style={{
                fontSize: "36px",
                marginBottom: "12px",
              }}
            >
              🔒
            </div>

            <h2 style={{ margin: "0 0 8px" }}>
              Check-out har stängt
            </h2>

            <p style={{ margin: 0, color: "#666" }}>
              Check-out för den här träningen
              stängde{" "}
              {formatCheckOutCloseTime(training)}.
            </p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {header(
        "Check-out 👋",
        "Hur upplevde du dagens träning?"
      )}

      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <section
          style={{
            ...cardStyle,
            background: "#f2f8f4",
            border: "1px solid #d8e8de",
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
            Träning
          </p>

          <h2
            style={{
              margin: "0 0 8px",
              color: "#123b2a",
            }}
          >
            {training.focus}
          </h2>

          <p style={{ margin: 0, color: "#4b6255" }}>
            {formatTrainingDate(training)} •{" "}
            {training.time.slice(0, 5)}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              color: "#52705f",
              fontSize: "13px",
            }}
          >
            Check-out är öppen till{" "}
            {formatCheckOutCloseTime(training)}
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            🙂 Hur kändes träningen?
          </h2>

          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: 1, emoji: "😞" },
              { value: 2, emoji: "😕" },
              { value: 3, emoji: "😐" },
              { value: 4, emoji: "🙂" },
              { value: 5, emoji: "😄" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFeeling(option.value)
                }
                style={optionButtonStyle(
                  feeling === option.value
                )}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            🔥 Hur ansträngande var träningen?
          </h2>

          <p style={{ color: "#666" }}>
            1 är mycket lätt och 5 är mycket
            ansträngande.
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setEffort(value)}
                style={optionButtonStyle(
                  effort === value
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              color: "#777",
              fontSize: "12px",
            }}
          >
            <span>Mycket lätt</span>
            <span>Mycket ansträngande</span>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            🔋 Hur känns kroppen nu?
          </h2>

          <p style={{ color: "#666" }}>
            1 är väldigt sliten och 5 är väldigt
            fräsch.
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setBody(value)}
                style={optionButtonStyle(body === value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              color: "#777",
              fontSize: "12px",
            }}
          >
            <span>Väldigt sliten</span>
            <span>Väldigt fräsch</span>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            💬 Något mer?
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Frivilligt. Skriv något du vill att
            ledarna ska känna till efter träningen.
          </p>

          <textarea
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
            placeholder="Exempel: Kände mig lite stel i baksida lår mot slutet..."
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "15px",
              resize: "vertical",
              fontFamily: "Arial, sans-serif",
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
          onClick={() => void saveCheckOut()}
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
            : "Skicka check-out"}
        </button>
      </main>
    </div>
  )
}

export default CheckOut
