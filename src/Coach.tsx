import { useState } from "react"
import CreateTraining from "./CreateTraining"
import ManageTrainings from "./ManageTrainings"
import CoachCheckIns from "./CoachCheckIns"
import Players from "./Players"
import hovstaLogo from "./assets/300374317_580630103589064_157634585059629613_n.jpg"

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
    return (
      <CreateTraining
        onBack={() => setPage("home")}
      />
    )
  }

  if (page === "manageTrainings") {
    return (
      <ManageTrainings
        onBack={() => setPage("home")}
      />
    )
  }

  if (page === "checkIns") {
    return (
      <CoachCheckIns
        onBack={() => setPage("home")}
      />
    )
  }

  if (page === "players") {
    return (
      <Players
        onBack={() => setPage("home")}
      />
    )
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

  const secondaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px",
    border: "1px solid #d7ddd9",
    borderRadius: "12px",
    background: "white",
    color: "#123b2a",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
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
            padding: "20px 20px 27px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.1)",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                minWidth: "100px",
                borderRadius: "17px",
                background: "white",
                padding: "6px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={hovstaLogo}
                alt="Hovsta IF"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "11px",
                }}
              />
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#f39200",
                  fontSize: "20px",
                  fontWeight: "bold",
                  letterSpacing: "1.2px",
                }}
              >
                HOVSTA IF
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                Ledarläge
              </p>
            </div>
          </div>

          <h1
            style={{
              margin: "0 0 7px",
              fontSize: "29px",
              letterSpacing: "-0.5px",
            }}
          >
            Ledarsida ⚽
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "15px",
              lineHeight: "1.5",
            }}
          >
            Planera träningar och följ laget.
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
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              color: "#123b2a",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            }}
          >
            Översikt
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            Vad vill du göra?
          </h2>
        </div>

        <section
          style={{
            ...cardStyle,
            borderTop: "4px solid #f39200",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                }}
              >
                Träningsplanering
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                }}
              >
                Skapa ny träning
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
              ＋
            </div>
          </div>

          <p
            style={{
              color: "#5f6663",
              lineHeight: "1.5",
              marginBottom: "18px",
            }}
          >
            Lägg till ett nytt träningspass med
            datum, tid, plats, träningsfokus och
            övningar.
          </p>

          <button
            onClick={() =>
              setPage("createTraining")
            }
            style={{
              width: "100%",
              padding: "14px",
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

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                }}
              >
                Planering
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                }}
              >
                Hantera träningar
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
              ⚽
            </div>
          </div>

          <p
            style={{
              color: "#5f6663",
              lineHeight: "1.5",
              marginBottom: "18px",
            }}
          >
            Se alla skapade träningspass, ändra
            innehåll och håll lagets planering
            uppdaterad.
          </p>

          <button
            onClick={() =>
              setPage("manageTrainings")
            }
            style={secondaryButtonStyle}
          >
            Hantera träningar →
          </button>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                }}
              >
                Spelarstatus
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                }}
              >
                Spelarnas svar
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

          <p
            style={{
              color: "#5f6663",
              lineHeight: "1.5",
              marginBottom: "18px",
            }}
          >
            Följ spelarnas check-in inför träningen
            och deras check-out efter genomfört
            träningspass.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
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
              Check-in
            </span>

            <span
              style={{
                background: "#fff4e5",
                color: "#8a5700",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              Check-out
            </span>
          </div>

          <button
            onClick={() =>
              setPage("checkIns")
            }
            style={secondaryButtonStyle}
          >
            Visa spelarnas svar →
          </button>
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "15px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "bold",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                }}
              >
                Truppen
              </p>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#123b2a",
                }}
              >
                Spelare
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
              👥
            </div>
          </div>

          <p
            style={{
              color: "#5f6663",
              lineHeight: "1.5",
              marginBottom: "18px",
            }}
          >
            Se lagets spelare, positioner och
            aktuell information från spelarnas
            senaste svar.
          </p>

          <button
            onClick={() =>
              setPage("players")
            }
            style={secondaryButtonStyle}
          >
            Visa spelare →
          </button>
        </section>

        <p
          style={{
            margin: "0 0 20px",
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

export default Coach