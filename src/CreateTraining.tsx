import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type CreateTrainingProps = {
  onBack: () => void
}

type Exercise = {
  id: number
  name: string
  description: string
}

type Team = {
  id: string
  name: string
  club_name: string
}

function CreateTraining({
  onBack,
}: CreateTrainingProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] =
    useState("Hovsta IP")
  const [focus, setFocus] = useState("")
  const [description, setDescription] =
    useState("")
  const [notes, setNotes] = useState("")

  const [saved, setSaved] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [role, setRole] =
    useState<"coach" | "admin" | null>(null)

  const [coachTeamId, setCoachTeamId] =
    useState<string | null>(null)

  const [teams, setTeams] =
    useState<Team[]>([])

  const [selectedTeamId, setSelectedTeamId] =
    useState("")

  const [loadingAccess, setLoadingAccess] =
    useState(true)

  const [exercises, setExercises] =
    useState<Exercise[]>([
      {
        id: 1,
        name: "",
        description: "",
      },
    ])

  useEffect(() => {
    const loadAccess = async () => {
      setLoadingAccess(true)
      setErrorMessage("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setErrorMessage(
          "Du behöver vara inloggad som ledare eller admin."
        )
        setLoadingAccess(false)
        return
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role, team_id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        setErrorMessage(
          "Kunde inte hämta din ledarprofil."
        )
        setLoadingAccess(false)
        return
      }

      if (
        profile.role !== "coach" &&
        profile.role !== "admin"
      ) {
        setErrorMessage(
          "Du har inte behörighet att skapa träningar."
        )
        setLoadingAccess(false)
        return
      }

      setRole(profile.role)
      setCoachTeamId(profile.team_id)

      if (profile.role === "coach") {
        if (!profile.team_id) {
          setErrorMessage(
            "Din ledarprofil är inte kopplad till något lag ännu."
          )
        } else {
          setSelectedTeamId(profile.team_id)
        }

        setLoadingAccess(false)
        return
      }

      const {
        data: teamData,
        error: teamError,
      } = await supabase
        .from("teams")
        .select("id, name, club_name")
        .order("name", {
          ascending: true,
        })

      if (teamError) {
        console.error(teamError)

        setErrorMessage(
          "Kunde inte hämta lagen."
        )
        setLoadingAccess(false)
        return
      }

      const loadedTeams =
        teamData ?? []

      setTeams(loadedTeams)

      if (loadedTeams.length === 1) {
        setSelectedTeamId(
          loadedTeams[0].id
        )
      }

      setLoadingAccess(false)
    }

    void loadAccess()
  }, [])

  const normalizeTime = (
    value: string
  ): string | null => {
    const cleanedValue = value
      .trim()
      .replace(".", ":")

    let hours: number
    let minutes: number

    if (/^\d{1,2}$/.test(cleanedValue)) {
      hours = Number(cleanedValue)
      minutes = 0
    } else if (
      /^\d{1,2}:\d{1,2}$/.test(
        cleanedValue
      )
    ) {
      const parts =
        cleanedValue.split(":")

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

    const formattedHours =
      String(hours).padStart(2, "0")

    const formattedMinutes =
      String(minutes).padStart(2, "0")

    return `${formattedHours}:${formattedMinutes}`
  }

  const addExercise = () => {
    setExercises((current) => [
      ...current,
      {
        id: Date.now(),
        name: "",
        description: "",
      },
    ])
  }

  const removeExercise = (
    id: number
  ) => {
    setExercises((current) =>
      current.filter(
        (exercise) =>
          exercise.id !== id
      )
    )
  }

  const updateExercise = (
    id: number,
    field: "name" | "description",
    value: string
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      )
    )
  }

  const buildDescription = () => {
    const completedExercises =
      exercises.filter(
        (exercise) =>
          exercise.name.trim() !== "" ||
          exercise.description.trim() !== ""
      )

    const sections: string[] = []

    if (description.trim()) {
      sections.push(
        description.trim()
      )
    }

    if (
      completedExercises.length > 0
    ) {
      const exerciseText =
        completedExercises
          .map(
            (exercise, index) => {
              const name =
                exercise.name.trim() ||
                `Övning ${index + 1}`

              const exerciseDescription =
                exercise.description.trim()

              if (
                exerciseDescription
              ) {
                return `${index + 1}. ${name}\n${exerciseDescription}`
              }

              return `${index + 1}. ${name}`
            }
          )
          .join("\n\n")

      sections.push(
        `ÖVNINGAR\n${exerciseText}`
      )
    }

    return sections.join("\n\n")
  }

  const saveTraining = async () => {
    if (saving) {
      return
    }

    setErrorMessage("")

    if (
      !date ||
      !time.trim() ||
      !focus.trim()
    ) {
      alert(
        "Fyll i datum, tid och träningsfokus."
      )
      return
    }

    const normalizedTime =
      normalizeTime(time)

    if (!normalizedTime) {
      alert(
        "Tiden verkar inte stämma. Skriv till exempel 18, 18.00 eller 18:00."
      )
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(userError)

      setErrorMessage(
        "Din inloggning kunde inte verifieras. Logga in igen."
      )
      setSaving(false)
      return
    }

    const teamId =
      role === "admin"
        ? selectedTeamId
        : coachTeamId

    if (!teamId) {
      setErrorMessage(
        role === "admin"
          ? "Välj vilket lag träningen gäller."
          : "Din ledarprofil är inte kopplad till något lag ännu."
      )
      setSaving(false)
      return
    }

    const finalDescription =
      buildDescription()

    const { error } = await supabase
      .from("trainings")
      .insert({
        date,
        time: normalizedTime,
        location:
          location.trim() ||
          "Hovsta IP",
        focus: focus.trim(),
        description:
          finalDescription || null,
        notes:
          notes.trim() || null,
        created_by: user.id,
        team_id: teamId,
      })

    if (error) {
      console.error(
        "Kunde inte skapa träning:",
        error
      )

      setErrorMessage(
        "Träningen kunde inte sparas. Försök igen."
      )
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)

    setTimeout(() => {
      onBack()
    }, 1500)
  }

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow:
      "0 3px 14px rgba(18,59,42,0.07)",
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
          fontFamily:
            "Arial, sans-serif",
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
            boxShadow:
              "0 8px 28px rgba(18,59,42,0.12)",
            border:
              "1px solid #edf0ee",
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
                margin:
                  "0 auto 20px",
                borderRadius: "50%",
                background: "#e7f1eb",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
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
              Träningen är sparad!
            </h1>

            <p
              style={{
                margin: 0,
                color: "#5f6663",
                lineHeight: "1.5",
              }}
            >
              Träningspasset har
              publicerats till laget.
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
        fontFamily:
          "Arial, sans-serif",
        color: "#17202a",
      }}
    >
      <header
        style={{
          background: "#123b2a",
          color: "white",
          borderRadius:
            "0 0 28px 28px",
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
            padding:
              "20px 20px 27px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background:
                "rgba(255,255,255,0.1)",
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
            Skapa träning ⚽
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "15px",
            }}
          >
            Planera och publicera
            ett nytt träningspass.
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
        {role === "admin" && (
          <section
            style={{
              ...cardStyle,
              borderTop:
                "4px solid #f39200",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                color: "#6b7280",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform:
                  "uppercase",
              }}
            >
              Admin
            </p>

            <h2
              style={{
                margin: "0 0 16px",
                color: "#123b2a",
              }}
            >
              👥 Välj lag
            </h2>

            <label style={labelStyle}>
              Vilket lag gäller träningen?
            </label>

            <select
              value={selectedTeamId}
              onChange={(event) =>
                setSelectedTeamId(
                  event.target.value
                )
              }
              style={inputStyle}
              disabled={loadingAccess}
            >
              <option value="">
                Välj lag
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.club_name} •{" "}
                  {team.name}
                </option>
              ))}
            </select>
          </section>
        )}

        <section
          style={{
            ...cardStyle,
            borderTop:
              "4px solid #f39200",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform:
                "uppercase",
            }}
          >
            Grundinformation
          </p>

          <h2
            style={{
              margin: "0 0 20px",
              color: "#123b2a",
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
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
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
            onChange={(event) =>
              setTime(
                event.target.value
              )
            }
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
            }}
          >
            Du kan skriva till
            exempel 18, 18.00 eller
            18:00.
          </p>

          <label style={labelStyle}>
            Plats
          </label>

          <input
            type="text"
            value={location}
            onChange={(event) =>
              setLocation(
                event.target.value
              )
            }
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
              textTransform:
                "uppercase",
            }}
          >
            Innehåll
          </p>

          <h2
            style={{
              margin: "0 0 20px",
              color: "#123b2a",
            }}
          >
            🎯 Träningsfokus
          </h2>

          <label style={labelStyle}>
            Vad fokuserar träningen
            på?
          </label>

          <input
            type="text"
            value={focus}
            onChange={(event) =>
              setFocus(
                event.target.value
              )
            }
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
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Beskriv syftet med träningspasset..."
            rows={4}
            style={{
              ...inputStyle,
              fontSize: "15px",
              resize: "vertical",
              fontFamily:
                "Arial, sans-serif",
            }}
          />
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#123b2a",
              }}
            >
              🏃 Övningar
            </h2>

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

          {exercises.map(
            (exercise, index) => (
              <div
                key={exercise.id}
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background:
                    "#f7f9f8",
                  border:
                    "1px solid #e1e7e3",
                  marginBottom:
                    "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "13px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#123b2a",
                    }}
                  >
                    Övning {index + 1}
                  </strong>

                  {exercises.length >
                    1 && (
                    <button
                      onClick={() =>
                        removeExercise(
                          exercise.id
                        )
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        color:
                          "#9b2c2c",
                        cursor:
                          "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      Ta bort
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={
                    exercise.name
                  }
                  onChange={(event) =>
                    updateExercise(
                      exercise.id,
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Namn på övningen"
                  style={{
                    ...inputStyle,
                    marginBottom:
                      "10px",
                  }}
                />

                <textarea
                  value={
                    exercise.description
                  }
                  onChange={(event) =>
                    updateExercise(
                      exercise.id,
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Beskriv övningen..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily:
                      "Arial, sans-serif",
                  }}
                />
              </div>
            )
          )}

          <button
            onClick={addExercise}
            style={{
              width: "100%",
              padding: "13px",
              border:
                "1px dashed #739080",
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
          <h2
            style={{
              margin: "0 0 16px",
              color: "#123b2a",
            }}
          >
            📝 Övrigt
          </h2>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Information som spelarna behöver känna till, till exempel samlingstid eller vad de ska ta med..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily:
                "Arial, sans-serif",
            }}
          />
        </section>

        {errorMessage && (
          <div
            style={{
              background: "#fff1f0",
              border:
                "1px solid #f1c0bc",
              color: "#8a2820",
              borderRadius: "12px",
              padding: "13px",
              marginBottom: "16px",
              lineHeight: "1.5",
            }}
          >
            {errorMessage}
          </div>
        )}

        <button
          onClick={() =>
            void saveTraining()
          }
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
            boxShadow:
              "0 4px 12px rgba(18,59,42,0.15)",
          }}
        >
          {saving
            ? "Sparar..."
            : "Spara och publicera träning"}
        </button>

        <p
          style={{
            margin:
              "20px 0 24px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
          }}
        >
          HOVSTA IF • LEDARLÄGE
        </p>
      </main>
    </div>
  )
}

export default CreateTraining
