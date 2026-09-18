import { useState } from "react"
import CreateTraining from "./CreateTraining"
import ManageTrainings from "./ManageTrainings"
import CoachCheckIns from "./CoachCheckIns"
import Players from "./Players"

type CoachProps = {
  onBack: () => void
}

function Coach({ onBack }: CoachProps) {
  const [page, setPage] = useState<
    | "home"
    | "createTraining"
    | "manageTrainings"
    | "checkIns"
    | "players"
  >("home")

  if (page === "createTraining") {
    return <CreateTraining onBack={() => setPage("home")} />
  }

  if (page === "manageTrainings") {
    return <ManageTrainings onBack={() => setPage("home")} />
  }

  if (page === "checkIns") {
    return <CoachCheckIns onBack={() => setPage("home")} />
  }

  if (page === "players") {
    return <Players onBack={() => setPage("home")} />
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
          Ledarsida ⚽
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
          }}
        >
          Hantera laget och följ spelarnas status
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
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Träningsplanering
          </p>

          <h2 style={{ margin: "8px 0" }}>
            Skapa ny träning
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Lägg till ett nytt träningspass med datum, tid,
            träningsfokus och övningar.
          </p>

          <button
            onClick={() => setPage("createTraining")}
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
            + Skapa ny träning
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
            ⚽ Träningar
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Se alla skapade träningspass och hantera lagets
            träningsplanering.
          </p>

          <button
            onClick={() => setPage("manageTrainings")}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              background: "white",
              color: "#17202a",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Hantera träningar
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
            💚 Spelarnas check-in
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Se spelarnas mående, energinivå, eventuella
            känningar och kommentarer inför träningen.
          </p>

          <button
            onClick={() => setPage("checkIns")}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              background: "white",
              color: "#17202a",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Visa check-ins
          </button>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            👥 Spelare
          </h2>

          <p
            style={{
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Se lagets spelare, positioner och senaste
            check-in-status.
          </p>

          <button
            onClick={() => setPage("players")}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              background: "white",
              color: "#17202a",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Visa spelare
          </button>
        </section>
      </main>
    </div>
  )
}

export default Coach