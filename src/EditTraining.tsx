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
            width: "100%",
            maxWidth: "420px",
            background: "white",
            borderRadius: "24px",
            padding: "40px 24px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
            Ändringarna är sparade!
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Träningspasset har uppdaterats.
          </p>
        </div>
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
          HOVSTA IF • LEDARLÄGE
        </p>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "28px",
          }}
        >
          Redigera träning ✏️
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Ändra träningspasset och spara
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
          <h2 style={{ marginTop: 0 }}>
            📅 När är träningen?
          </h2>

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "7px",
            }}
          >
            Datum
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
              marginBottom: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "7px",
            }}
          >
            Tid
          </label>

          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Exempel: 18:00"
            inputMode="decimal"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
              marginBottom: "6px",
            }}
          />

          <p
            style={{
              margin: "0 0 16px",
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            Du kan skriva till exempel 18, 18.00 eller 18:00.
          </p>

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "7px",
            }}
          >
            Plats
          </label>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Exempel: Hovsta IP"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
            }}
          />
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🎯 Träningsfokus
          </h2>

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "7px",
            }}
          >
            Vad fokuserar träningen på?
          </label>

          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Exempel: Återerövring och kontring"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
              marginBottom: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "7px",
            }}
          >
            Beskrivning
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv syftet med träningspasset..."
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🏃 Övningar
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.5",
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
                background: "#f7f8f8",
                border: "1px solid #e5e7eb",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <strong>
                  Övning {index + 1}
                </strong>

                <button
                  onClick={() =>
                    removeExercise(exercise.id)
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#a33",
                    cursor: "pointer",
                    fontSize: "14px",
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
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
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
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "15px",
                  resize: "vertical",
                }}
              />
            </div>
          ))}

          <button
            onClick={addExercise}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px dashed #123b2a",
              borderRadius: "12px",
              background: "#f2f8f4",
              color: "#123b2a",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            + Lägg till övning
          </button>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            💡 Att tänka på
          </h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Exempel: Samling 17:45, ta med löparskor..."
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "15px",
              resize: "vertical",
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
            marginBottom: "30px",
          }}
        >
          Spara ändringar
        </button>
      </main>
    </div>
  )
}

export default EditTraining