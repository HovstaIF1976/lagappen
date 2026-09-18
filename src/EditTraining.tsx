import { useState } from "react"

type Exercise = {
  id: number
  name: string
  description: string
}

export type TrainingData = {
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

type EditTrainingProps = {
  training: TrainingData
  onBack: () => void
  onSaved: () => void
}

function EditTraining({
  training,
  onBack,
  onSaved,
}: EditTrainingProps) {
  const [date, setDate] = useState(training.date)
  const [time, setTime] = useState(training.time)
  const [location, setLocation] = useState(training.location)
  const [focus, setFocus] = useState(training.focus)
  const [description, setDescription] = useState(
    training.description
  )
  const [notes, setNotes] = useState(training.notes)

  const [exercises, setExercises] = useState<Exercise[]>(
    training.exercises?.length > 0
      ? training.exercises
      : [{ id: Date.now(), name: "", description: "" }]
  )

  const [saved, setSaved] = useState(false)

  const normalizeTime = (value: string): string | null => {
    const cleanedValue = value.trim().replace(".", ":")

    let hours: number
    let minutes: number

    if (/^\d{1,2}$/.test(cleanedValue)) {
      hours = Number(cleanedValue)
      minutes = 0
    } else if (/^\d{1,2}:\d{1,2}$/.test(cleanedValue)) {
      const parts = cleanedValue.split(":")

      hours = Number(parts[0])
      minutes = Number(parts[1])
    } else {
      return null
    }

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null
    }

    const formattedHours = String(hours).padStart(2, "0")
    const formattedMinutes = String(minutes).padStart(2, "0")

    return `${formattedHours}:${formattedMinutes}`
  }

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now(),
      name: "",
      description: "",
    }

    setExercises([...exercises, newExercise])
  }

  const removeExercise = (id: number) => {
    setExercises(
      exercises.filter((exercise) => exercise.id !== id)
    )
  }

  const updateExercise = (
    id: number,
    field: "name" | "description",
    value: string
  ) => {
    setExercises(
      exercises.map((exercise) =>
        exercise.id === id
          ? { ...exercise, [field]: value }
          : exercise
      )
    )
  }

  const saveChanges = () => {
    if (!date || !time || !focus) {
      alert("Fyll i datum, tid och träningsfokus.")
      return
    }

    const normalizedTime = normalizeTime(time)

    if (!normalizedTime) {
      alert(
        "Tiden verkar inte stämma. Skriv till exempel 18, 18.00 eller 18:00."
      )
      return
    }

    const completedExercises = exercises.filter(
      (exercise) =>
        exercise.name.trim() !== "" ||
        exercise.description.trim() !== ""
    )

    const updatedTraining: TrainingData = {
      ...training,
      date,
      time: normalizedTime,
      location,
      focus,
      description,
      exercises: completedExercises,
      notes,
    }

    const savedTrainings = localStorage.getItem(
      "hovstaTrainings"
    )

    if (!savedTrainings) {
      alert("Kunde inte hitta träningslistan.")
      return
    }

    try {
      const trainings: TrainingData[] =
        JSON.parse(savedTrainings)

      const updatedTrainings = trainings.map(
        (savedTraining) => {
          if (
            training.id !== undefined &&
            savedTraining.id === training.id
          ) {
            return updatedTraining
          }

          if (
            training.id === undefined &&
            savedTraining.createdAt === training.createdAt
          ) {
            return updatedTraining
          }

          return savedTraining
        }
      )

      updatedTrainings.sort((a, b) => {
        const firstDate = new Date(
          `${a.date}T${a.time || "00:00"}`
        ).getTime()

        const secondDate = new Date(
          `${b.date}T${b.time || "00:00"}`
        ).getTime()

        return firstDate - secondDate
      })

      localStorage.setItem(
        "hovstaTrainings",
        JSON.stringify(updatedTrainings)
      )

      setSaved(true)

      setTimeout(() => {
        onSaved()
      }, 1200)
    } catch {
      alert("Något gick fel när träningen skulle sparas.")
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 3px 14px rgba(18,59,42,0.07)",
    border: "1px solid #edf0ee",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: "bold",
    marginBottom: "7px",
    color: "#29332e",
    fontSize: "14px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    borderRadius: "11px",
    border: "1px solid #d7ddd9",
    fontSize: "16px",
    background: "white",
    color: "#17202a",
    outlineColor: "#123b2a",
  }

  if (saved) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f5",
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
            width: "100%",
            maxWidth: "420px",
            background: "white",
            borderRadius: "24px",
            overflow: "hidden",
            textAlign: "center",
            boxShadow: "0 8px 28px rgba(18,59,42,0.12)",
            border: "1px solid #edf0ee",
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
              padding: "40px 24px",
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

            <p
              style={{
                margin: "0 0 7px",
                color: "#f39200",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              HOVSTA IF
            </p>

            <h1
              style={{
                margin: "0 0 10px",
                color: "#123b2a",
                fontSize: "26px",
              }}
            >
              Ändringarna är sparade!
            </h1>

            <p
              style={{
                margin: 0,
                color: "#5f6663",
                lineHeight: "1.5",
              }}
            >
              Träningspasset har uppdaterats.
            </p>
          </div>
        </div>
      </div>
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
          boxShadow: "0 5px 18px rgba(18,59,42,0.18)",
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
              border: "1px solid rgba(255,255,255,0.22)",
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
              letterSpacing: "-0.5px",
            }}
          >
            Redigera träning ✏️
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "15px",
              lineHeight: "1.5",
            }}
          >
            Uppdatera träningspasset och spara ändringarna.
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
        <section
          style={{
            ...cardStyle,
            borderTop: "4px solid #f39200",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Grundinformation
          </p>

          <h2
            style={{
              margin: "0 0 20px",
              color: "#123b2a",
              fontSize: "21px",
            }}
          >
            📅 När är träningen?
          </h2>

          <label style={labelStyle}>
            Datum
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              ...inputStyle,
              marginBottom: "17px",
            }}
          />

          <label style={labelStyle}>
            Tid
          </label>

          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Exempel: 18:00"
            inputMode="decimal"
            style={{
              ...inputStyle,
              marginBottom: "6px",
            }}
          />

          <p
            style={{
              margin: "0 0 17px",
              color: "#6b7280",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
          >
            Du kan skriva till exempel 18, 18.00 eller 18:00.
          </p>

          <label style={labelStyle}>
            Plats
          </label>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Exempel: Hovsta IP"
            style={inputStyle}
          />
        </section>

        <section style={cardStyle}>
          <p
            style={{
              margin: "0 0 6px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Innehåll
          </p>

          <h2
            style={{
              margin: "0 0 20px",
              color: "#123b2a",
              fontSize: "21px",
            }}
          >
            🎯 Träningsfokus
          </h2>

          <label style={labelStyle}>
            Vad fokuserar träningen på?
          </label>

          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Exempel: Återerövring och kontring"
            style={{
              ...inputStyle,
              marginBottom: "17px",
            }}
          />

          <label style={labelStyle}>
            Beskrivning
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv syftet med träningspasset..."
            rows={4}
            style={{
              ...inputStyle,
              fontSize: "15px",
              resize: "vertical",
              fontFamily: "Arial, sans-serif",
            }}
          />
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "4px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#6b7280",
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                }}
              >
                Träningsplan
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#123b2a",
                  fontSize: "21px",
                }}
              >
                🏃 Övningar
              </h2>
            </div>

            <span
              style={{
                background: "#edf4f0",
                color: "#123b2a",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {exercises.length} st
            </span>
          </div>

          <p
            style={{
              color: "#5f6663",
              lineHeight: "1.5",
              margin: "12px 0 18px",
              fontSize: "14px",
            }}
          >
            Ändra, lägg till eller ta bort övningar.
          </p>

          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#f7f9f8",
                border: "1px solid #e1e7e3",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <div
                    style={{
                      width: "29px",
                      height: "29px",
                      borderRadius: "9px",
                      background: "#123b2a",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </div>

                  <strong
                    style={{
                      color: "#123b2a",
                    }}
                  >
                    Övning {index + 1}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    removeExercise(exercise.id)
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#9b2c2c",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  Ta bort
                </button>
              </div>

              <input
                type="text"
                value={exercise.name}
                onChange={(e) =>
                  updateExercise(
                    exercise.id,
                    "name",
                    e.target.value
                  )
                }
                placeholder="Namn på övningen"
                style={{
                  ...inputStyle,
                  fontSize: "15px",
                  marginBottom: "10px",
                }}
              />

              <textarea
                value={exercise.description}
                onChange={(e) =>
                  updateExercise(
                    exercise.id,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Beskriv övningen..."
                rows={3}
                style={{
                  ...inputStyle,
                  fontSize: "15px",
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            </div>
          ))}

          <button
            onClick={addExercise}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px dashed #739080",
              borderRadius: "12px",
              background: "#edf4f0",
              color: "#123b2a",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            + Lägg till övning
          </button>
        </section>

        <section style={cardStyle}>
          <p
            style={{
              margin: "0 0 6px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Information till spelarna
          </p>

          <h2
            style={{
              margin: "0 0 16px",
              color: "#123b2a",
              fontSize: "21px",
            }}
          >
            📝 Övrigt
          </h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Exempel: Samling 17:45, ta med löparskor..."
            rows={4}
            style={{
              ...inputStyle,
              fontSize: "15px",
              resize: "vertical",
              fontFamily: "Arial, sans-serif",
            }}
          />
        </section>

        <button
          onClick={saveChanges}
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
            boxShadow: "0 4px 12px rgba(18,59,42,0.15)",
          }}
        >
          Spara ändringar
        </button>

        <p
          style={{
            margin: "20px 0 24px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
            letterSpacing: "0.5px",
          }}
        >
          HOVSTA IF • LEDARLÄGE
        </p>
      </main>
    </div>
  )
}

export default EditTraining