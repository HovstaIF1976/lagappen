import { useState } from "react"

type CheckOutProps = {
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

type CheckOutStatus =
  | "waiting"
  | "open"
  | "completed"
  | "closed"

function CheckOut({ onBack }: CheckOutProps) {
  const [feeling, setFeeling] = useState<number | null>(null)
  const [effort, setEffort] = useState<number | null>(null)
  const [body, setBody] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [saved, setSaved] = useState(false)

  const playerName = "Testspelare"

  const getTrainings = (): TrainingData[] => {
    const savedTrainings =
      localStorage.getItem("hovstaTrainings")

    if (!savedTrainings) {
      return []
    }

    try {
      const trainings =
        JSON.parse(savedTrainings)

      if (Array.isArray(trainings)) {
        return trainings
      }

      return []
    } catch {
      return []
    }
  }

  const getTrainingId = (
    training: TrainingData
  ): number | string => {
    return training.id ?? training.createdAt
  }

  const getTrainingDateTime = (
    training: TrainingData
  ): Date => {
    const validTime =
      /^\d{1,2}:\d{2}$/.test(training.time)
        ? training.time
        : "23:59"

    return new Date(
      `${training.date}T${validTime}:00`
    )
  }

  const getCheckOutOpenTime = (
    training: TrainingData
  ): Date => {
    const trainingTime =
      getTrainingDateTime(training)

    return new Date(
      trainingTime.getTime() +
        30 * 60 * 1000
    )
  }

  const getCheckOutCloseTime = (
    training: TrainingData
  ): Date => {
    const trainingTime =
      getTrainingDateTime(training)

    return new Date(
      trainingTime.getTime() +
        7 * 60 * 60 * 1000
    )
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

  const hasCheckedOut = (
    training: TrainingData
  ): boolean => {
    const trainingId =
      getTrainingId(training)

    return getCheckOuts().some(
      (checkOut) =>
        String(checkOut.trainingId) ===
          String(trainingId) &&
        checkOut.playerName === playerName
    )
  }

  const getRelevantTraining =
    (): TrainingData | null => {
      const trainings = getTrainings()

      if (trainings.length === 0) {
        return null
      }

      const now = Date.now()

      const relevantTrainings = trainings
        .filter((training) => {
          const trainingStart =
            getTrainingDateTime(
              training
            ).getTime()

          const checkOutClose =
            getCheckOutCloseTime(
              training
            ).getTime()

          return (
            now >= trainingStart &&
            now < checkOutClose
          )
        })
        .sort(
          (a, b) =>
            getTrainingDateTime(b).getTime() -
            getTrainingDateTime(a).getTime()
        )

      return relevantTrainings[0] ?? null
    }

  const training = getRelevantTraining()

  const getCheckOutStatus = (
    selectedTraining: TrainingData
  ): CheckOutStatus => {
    if (hasCheckedOut(selectedTraining)) {
      return "completed"
    }

    const now = Date.now()

    const openTime =
      getCheckOutOpenTime(
        selectedTraining
      ).getTime()

    const closeTime =
      getCheckOutCloseTime(
        selectedTraining
      ).getTime()

    if (now < openTime) {
      return "waiting"
    }

    if (now >= closeTime) {
      return "closed"
    }

    return "open"
  }

  const formatTrainingDate = (
    selectedTraining: TrainingData
  ) => {
    const date = new Date(
      `${selectedTraining.date}T12:00:00`
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    ).format(date)
  }

  const formatCheckOutOpenTime = (
    selectedTraining: TrainingData
  ) => {
    const openTime =
      getCheckOutOpenTime(
        selectedTraining
      )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(openTime)
  }

  const formatCheckOutCloseTime = (
    selectedTraining: TrainingData
  ) => {
    const closeTime =
      getCheckOutCloseTime(
        selectedTraining
      )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(closeTime)
  }

  const saveCheckOut = () => {
    if (!training) {
      return
    }

    /*
      Statusen kontrolleras igen precis när
      spelaren trycker på Skicka.
    */
    const currentStatus =
      getCheckOutStatus(training)

    if (currentStatus === "waiting") {
      alert(
        `Check-out öppnar ${formatCheckOutOpenTime(
          training
        )}.`
      )
      return
    }

    if (currentStatus === "closed") {
      alert(
        "Check-out för den här träningen har stängt."
      )
      return
    }

    if (currentStatus === "completed") {
      alert(
        "Du har redan gjort check-out för den här träningen."
      )
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

    const currentCheckOuts =
      getCheckOuts()

    const trainingId =
      getTrainingId(training)

    /*
      Extra dubblettkontroll precis innan
      svaret sparas.
    */
    const duplicateCheckOut =
      currentCheckOuts.some(
        (checkOut) =>
          String(checkOut.trainingId) ===
            String(trainingId) &&
          checkOut.playerName === playerName
      )

    if (duplicateCheckOut) {
      alert(
        "Du har redan gjort check-out för den här träningen."
      )
      return
    }

    const newCheckOut: CheckOutData = {
      id: Date.now(),
      trainingId,
      playerName,
      feeling,
      effort,
      body,
      comment: comment.trim(),
      date: new Date().toISOString(),
    }

    const updatedCheckOuts = [
      ...currentCheckOuts,
      newCheckOut,
    ]

    localStorage.setItem(
      "hovstaCheckOuts",
      JSON.stringify(updatedCheckOuts)
    )

    setSaved(true)

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
    fontWeight: selected
      ? "bold"
      : "normal",
    cursor: "pointer",
  })

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

  if (!training) {
    return (
      <div style={pageStyle}>
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
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
            }}
          >
            ← Tillbaka
          </button>

          <h1
            style={{
              marginBottom: "4px",
            }}
          >
            Check-out
          </h1>
        </header>

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

            <h2
              style={{
                marginTop: 0,
              }}
            >
              Ingen aktuell check-out
            </h2>

            <p
              style={{
                color: "#666",
                lineHeight: "1.5",
                marginBottom: 0,
              }}
            >
              Check-out öppnar 30 minuter efter
              träningsstart och stänger 7 timmar
              efter träningsstart.
            </p>
          </section>
        </main>
      </div>
    )
  }

  const status =
    getCheckOutStatus(training)

  if (status === "waiting") {
    return (
      <div style={pageStyle}>
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
            onClick={onBack}
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
            HOVSTA IF
          </p>

          <h1
            style={{
              margin: "8px 0 4px",
              fontSize: "28px",
            }}
          >
            Check-out 👋
          </h1>
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
              ...cardStyle,
              background: "#fff8e6",
              border:
                "1px solid #f1d995",
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
              {formatCheckOutOpenTime(
                training
              )}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#75652f",
                lineHeight: "1.5",
              }}
            >
              Du kan göra din check-out 30
              minuter efter träningsstart.
            </p>
          </section>

          <section style={cardStyle}>
            <p
              style={{
                margin: "0 0 5px",
                color: "#52705f",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Pågående träning
            </p>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#123b2a",
              }}
            >
              {training.focus}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              {formatTrainingDate(
                training
              )}{" "}
              • {training.time}
            </p>

            <p
              style={{
                margin:
                  "10px 0 0",
                color: "#777",
                fontSize: "13px",
              }}
            >
              Check-out stänger{" "}
              {formatCheckOutCloseTime(
                training
              )}
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (status === "completed") {
    return (
      <div style={pageStyle}>
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
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
            }}
          >
            ← Tillbaka
          </button>

          <h1
            style={{
              marginBottom: "4px",
            }}
          >
            Check-out
          </h1>
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
              ...cardStyle,
              textAlign: "center",
              padding: "32px 20px",
            }}
          >
            <div
              style={{
                width: "62px",
                height: "62px",
                margin:
                  "0 auto 16px",
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

            <h2
              style={{
                margin: "0 0 8px",
              }}
            >
              Du har checkat ut
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                lineHeight: "1.5",
              }}
            >
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
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer",
            }}
          >
            ← Tillbaka
          </button>

          <h1
            style={{
              marginBottom: "4px",
            }}
          >
            Check-out
          </h1>
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
              ...cardStyle,
              background: "#f4f6f8",
              border:
                "1px solid #e1e4e6",
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
              }}
            >
              Check-out har stängt
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Check-out för den här träningen
              stängde{" "}
              {formatCheckOutCloseTime(
                training
              )}
              .
            </p>
          </section>
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
          borderRadius:
            "0 0 24px 24px",
        }}
      >
        <button
          onClick={onBack}
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
          HOVSTA IF
        </p>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "28px",
          }}
        >
          Check-out 👋
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Hur upplevde du dagens träning?
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
            ...cardStyle,
            background: "#f2f8f4",
            border:
              "1px solid #d8e8de",
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              color: "#52705f",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Träning
          </p>

          <h2
            style={{
              margin: "0 0 8px",
              color: "#123b2a",
              fontSize: "21px",
            }}
          >
            {training.focus}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#4b6255",
            }}
          >
            {formatTrainingDate(
              training
            )}{" "}
            • {training.time}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              color: "#52705f",
              fontSize: "13px",
            }}
          >
            Check-out är öppen till{" "}
            {formatCheckOutCloseTime(
              training
            )}
          </p>
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            🙂 Hur kändes träningen?
          </h2>

          <p
            style={{
              color: "#666",
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            Välj det som bäst beskriver din
            upplevelse.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            {[
              {
                value: 1,
                emoji: "😞",
              },
              {
                value: 2,
                emoji: "😕",
              },
              {
                value: 3,
                emoji: "😐",
              },
              {
                value: 4,
                emoji: "🙂",
              },
              {
                value: 5,
                emoji: "😄",
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFeeling(
                    option.value
                  )
                }
                style={optionButtonStyle(
                  feeling ===
                    option.value
                )}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            🔥 Hur ansträngande var
            träningen?
          </h2>

          <p
            style={{
              color: "#666",
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            1 är mycket lätt och 5 är mycket
            ansträngande.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            {[1, 2, 3, 4, 5].map(
              (value) => (
                <button
                  key={value}
                  onClick={() =>
                    setEffort(value)
                  }
                  style={optionButtonStyle(
                    effort === value
                  )}
                >
                  {value}
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginTop: "8px",
              color: "#777",
              fontSize: "12px",
            }}
          >
            <span>Mycket lätt</span>
            <span>
              Mycket ansträngande
            </span>
          </div>
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            🔋 Hur känns kroppen nu?
          </h2>

          <p
            style={{
              color: "#666",
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            1 är väldigt sliten och 5 är väldigt
            fräsch.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            {[1, 2, 3, 4, 5].map(
              (value) => (
                <button
                  key={value}
                  onClick={() =>
                    setBody(value)
                  }
                  style={optionButtonStyle(
                    body === value
                  )}
                >
                  {value}
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
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
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            💬 Något mer?
          </h2>

          <p
            style={{
              color: "#666",
              marginTop: 0,
              marginBottom: "14px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Frivilligt. Skriv något du vill att
            ledarna ska känna till efter
            träningen.
          </p>

          <textarea
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            placeholder="Exempel: Kände mig lite stel i baksida lår mot slutet..."
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border:
                "1px solid #d1d5db",
              fontSize: "15px",
              resize: "vertical",
              fontFamily:
                "Arial, sans-serif",
            }}
          />
        </section>

        <button
          onClick={saveCheckOut}
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
          Skicka check-out
        </button>
      </main>
    </div>
  )
}

export default CheckOut