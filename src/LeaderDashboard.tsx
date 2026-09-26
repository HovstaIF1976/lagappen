import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type LeaderDashboardProps = {
  onOpenResponses: () => void
}

type TrainingData = {
  id: string
  date: string
  time: string
  location: string
  focus: string
  team_id: string | null
}

type CheckInData = {
  id: string
  training_id: string
  player_id: string
  mood: number
  energy: number
  pain: string | null
}

type TeamData = {
  id: string
  name: string
}

type DashboardData = {
  training: TrainingData | null
  teamName: string
  totalPlayers: number
  checkIns: CheckInData[]
}

function LeaderDashboard({
  onOpenResponses,
}: LeaderDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    training: null,
    teamName: "",
    totalPlayers: 0,
    checkIns: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getTrainingDateTime = (training: TrainingData) => {
    const time = training.time?.slice(0, 5) || "23:59"

    const value = new Date(
      `${training.date}T${time}:00`
    ).getTime()

    return Number.isNaN(value) ? 0 : value
  }

  const hasPain = (checkIn: CheckInData) => {
    const pain = checkIn.pain?.trim().toLowerCase() ?? ""

    return (
      pain !== "" &&
      pain !== "inget" &&
      pain !== "nej" &&
      pain !== "ingen" &&
      pain !== "ingenting"
    )
  }

  const getStatusType = (checkIn: CheckInData) => {
    if (
      checkIn.mood <= 2 ||
      checkIn.energy <= 2 ||
      hasPain(checkIn)
    ) {
      return "attention"
    }

    if (
      checkIn.mood === 3 ||
      checkIn.energy === 3
    ) {
      return "followup"
    }

    return "good"
  }

  const formatTrainingDate = (date: string) => {
    const dateObject = new Date(`${date}T12:00:00`)

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObject)
  }

  const formatOpenTime = (training: TrainingData) => {
    const trainingTime = getTrainingDateTime(training)
    const openTime = new Date(
      trainingTime - 6 * 60 * 60 * 1000
    )

    return new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(openTime)
  }

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setLoading(true)
      setError("")

      try {
        const [
          trainingsResult,
          teamsResult,
          playersResult,
        ] = await Promise.all([
          supabase
            .from("trainings")
            .select(
              "id, date, time, location, focus, team_id"
            )
            .order("date", { ascending: true })
            .order("time", { ascending: true }),

          supabase
            .from("teams")
            .select("id, name"),

          supabase
            .from("profiles")
            .select("id, team_id")
            .eq("role", "player"),
        ])

        if (trainingsResult.error) {
          throw trainingsResult.error
        }

        if (teamsResult.error) {
          throw teamsResult.error
        }

        if (playersResult.error) {
          throw playersResult.error
        }

        const trainings =
          (trainingsResult.data ?? []) as TrainingData[]

        const now = Date.now()

        const nextTraining =
          trainings.find(
            (training) =>
              getTrainingDateTime(training) >= now
          ) ?? null

        if (!nextTraining) {
          if (!cancelled) {
            setData({
              training: null,
              teamName: "",
              totalPlayers: 0,
              checkIns: [],
            })
          }

          return
        }

        const teams =
          (teamsResult.data ?? []) as TeamData[]

        const teamName =
          teams.find(
            (team) => team.id === nextTraining.team_id
          )?.name ?? ""

        const players = playersResult.data ?? []

        const totalPlayers = players.filter(
          (player) =>
            player.team_id === nextTraining.team_id
        ).length

        const checkInsResult = await supabase
          .from("check_ins")
          .select(
            "id, training_id, player_id, mood, energy, pain"
          )
          .eq("training_id", nextTraining.id)

        if (checkInsResult.error) {
          throw checkInsResult.error
        }

        if (!cancelled) {
          setData({
            training: nextTraining,
            teamName,
            totalPlayers,
            checkIns:
              (checkInsResult.data ?? []) as CheckInData[],
          })
        }
      } catch (caughtError) {
        console.error(caughtError)

        if (!cancelled) {
          setError(
            "Kunde inte hämta översikten just nu."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #edf0ee",
    boxShadow: "0 3px 14px rgba(18,59,42,0.07)",
  }

  if (loading) {
    return (
      <section
        style={{
          ...cardStyle,
          textAlign: "center",
          color: "#6b7280",
          padding: "28px 20px",
        }}
      >
        Hämtar ledaröversikten...
      </section>
    )
  }

  if (error) {
    return (
      <section
        style={{
          ...cardStyle,
          background: "#fff8e7",
          border: "1px solid #ead9a5",
        }}
      >
        <strong
          style={{
            color: "#806522",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Översikten kunde inte hämtas
        </strong>

        <span
          style={{
            color: "#6b5b32",
            fontSize: "14px",
          }}
        >
          {error}
        </span>
      </section>
    )
  }

  if (!data.training) {
    return (
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
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          Nästa träning
        </p>

        <h2
          style={{
            margin: "0 0 8px",
            color: "#123b2a",
            fontSize: "21px",
          }}
        >
          Ingen kommande träning
        </h2>

        <p
          style={{
            margin: 0,
            color: "#5f6663",
            lineHeight: "1.5",
          }}
        >
          När en ny träning skapas visas den här.
        </p>
      </section>
    )
  }

  const training = data.training

  const goodCount = data.checkIns.filter(
    (checkIn) => getStatusType(checkIn) === "good"
  ).length

  const followupCount = data.checkIns.filter(
    (checkIn) =>
      getStatusType(checkIn) === "followup"
  ).length

  const attentionCount = data.checkIns.filter(
    (checkIn) =>
      getStatusType(checkIn) === "attention"
  ).length

  const trainingTime = getTrainingDateTime(training)
  const checkInOpenTime =
    trainingTime - 6 * 60 * 60 * 1000

  const checkInIsOpen =
    Date.now() >= checkInOpenTime &&
    Date.now() < trainingTime

  return (
    <>
      <section
        style={{
          ...cardStyle,
          borderTop: "4px solid #f39200",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#6b7280",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Nästa träning
            </p>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#123b2a",
                fontSize: "22px",
              }}
            >
              {training.focus}
            </h2>
          </div>

          <div
            style={{
              width: "44px",
              height: "44px",
              minWidth: "44px",
              borderRadius: "13px",
              background: "#fff4e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "21px",
            }}
          >
            ⚽
          </div>
        </div>

        {data.teamName && (
          <span
            style={{
              display: "inline-block",
              background: "#edf4f0",
              color: "#123b2a",
              borderRadius: "999px",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "13px",
            }}
          >
            {data.teamName}
          </span>
        )}

        <div
          style={{
            background: "#f4f6f5",
            borderRadius: "14px",
            padding: "14px",
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#123b2a",
              textTransform: "capitalize",
              marginBottom: "6px",
            }}
          >
            {formatTrainingDate(training.date)}
          </strong>

          <span
            style={{
              color: "#5f6663",
              fontSize: "14px",
            }}
          >
            {training.time.slice(0, 5)} •{" "}
            {training.location}
          </span>
        </div>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            marginBottom: "17px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "#6b7280",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Spelarstatus
            </p>

            <h2
              style={{
                margin: 0,
                color: "#123b2a",
                fontSize: "21px",
              }}
            >
              Check-in inför träningen
            </h2>
          </div>

          <div
            style={{
              width: "44px",
              height: "44px",
              minWidth: "44px",
              borderRadius: "13px",
              background: "#edf4f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "21px",
            }}
          >
            💚
          </div>
        </div>

        <div
          style={{
            background: "#f4f6f5",
            borderRadius: "14px",
            padding: "14px",
            marginBottom: "14px",
          }}
        >
          <strong
            style={{
              color: "#123b2a",
              fontSize: "18px",
            }}
          >
            {data.checkIns.length}
            {data.totalPlayers > 0
              ? ` av ${data.totalPlayers}`
              : ""}{" "}
            har svarat
          </strong>

          <p
            style={{
              margin: "5px 0 0",
              color: "#6b7280",
              fontSize: "13px",
              lineHeight: "1.4",
            }}
          >
            {checkInIsOpen
              ? "Check-in är öppen inför träningen."
              : Date.now() < checkInOpenTime
                ? `Check-in öppnar ${formatOpenTime(
                    training
                  )}.`
                : "Check-in är stängd för den här träningen."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "#e7f1eb",
              color: "#123b2a",
              borderRadius: "14px",
              padding: "14px 5px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              {goodCount}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              Ser bra ut
            </div>
          </div>

          <div
            style={{
              background: "#fff8e7",
              color: "#806522",
              borderRadius: "14px",
              padding: "14px 5px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              {followupCount}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              Följ upp
            </div>
          </div>

          <div
            style={{
              background: "#fff1f1",
              color: "#9b2c2c",
              borderRadius: "14px",
              padding: "14px 5px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              {attentionCount}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              Uppmärksamma
            </div>
          </div>
        </div>

        {attentionCount > 0 && (
          <div
            style={{
              background: "#fff7f7",
              border: "1px solid #ead0d0",
              borderRadius: "12px",
              padding: "11px 12px",
              marginBottom: "14px",
              color: "#8b3434",
              fontSize: "13px",
              lineHeight: "1.45",
            }}
          >
            <strong>
              {attentionCount}{" "}
              {attentionCount === 1
                ? "spelare har"
                : "spelare har"}{" "}
              ett svar som bör uppmärksammas.
            </strong>
          </div>
        )}

        <button
          onClick={onOpenResponses}
          style={{
            width: "100%",
            padding: "13px",
            border: "1px solid #d7ddd9",
            borderRadius: "12px",
            background: "white",
            color: "#123b2a",
            fontSize: "15px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Visa spelarnas svar →
        </button>
      </section>
    </>
  )
}

export default LeaderDashboard
