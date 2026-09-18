import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import hovstaLogo from "./assets/300374317_580630103589064_157634585059629613_n.jpg"

type LoginProps = {
  onLogin: (playerId: string) => void
}

type Player = {
  id: string
  full_name: string
}

function Login({ onLogin }: LoginProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [playerId, setPlayerId] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const { data, error: functionError } =
          await supabase.functions.invoke("login-players")

        if (functionError) {
          console.error(
            "Could not load players:",
            functionError
          )

          setError("Kunde inte hämta spelarlistan.")
          return
        }

        if (!data?.success || !Array.isArray(data?.players)) {
          setError("Kunde inte hämta spelarlistan.")
          return
        }

        setPlayers(data.players)
      } catch (loadError) {
        console.error("Player loading error:", loadError)
        setError("Kunde inte hämta spelarlistan.")
      } finally {
        setLoadingPlayers(false)
      }
    }

    void loadPlayers()
  }, [])

  const handleLogin = async () => {
    setError("")

    if (!playerId) {
      setError("Välj en spelare.")
      return
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError("PIN-koden ska innehålla fyra siffror.")
      return
    }

    setLoading(true)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("player-login", {
          body: {
            player_id: playerId,
            pin,
          },
        })

      if (functionError) {
        console.error("Player login failed:", functionError)

        if (functionError.context?.status === 429) {
          setError(
            "För många felaktiga försök. Försök igen senare."
          )
        } else {
          setError(
            "Kunde inte logga in. Kontrollera PIN-koden."
          )
        }

        return
      }

      if (!data?.success || !data?.session) {
        setError(data?.error || "Inloggningen misslyckades.")
        return
      }

      const { error: sessionError } =
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

      if (sessionError) {
        console.error(
          "Could not start session:",
          sessionError
        )

        setError(
          "Kunde inte starta din inloggade session."
        )
        return
      }

      onLogin(playerId)
    } catch (loginError) {
      console.error("Login error:", loginError)
      setError("Något gick fel. Försök igen.")
    } finally {
      setLoading(false)
    }
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
          borderRadius: "0 0 28px 28px",
          boxShadow:
            "0 5px 18px rgba(18,59,42,0.18)",
          overflow: "hidden",
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
            padding: "28px 20px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "125px",
              height: "125px",
              margin: "0 auto 18px",
              background: "white",
              borderRadius: "20px",
              padding: "7px",
              boxSizing: "border-box",
              boxShadow:
                "0 4px 14px rgba(0,0,0,0.18)",
            }}
          >
            <img
              src={hovstaLogo}
              alt="Hovsta IF"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "13px",
              }}
            />
          </div>

          <p
            style={{
              margin: 0,
              color: "#f39200",
              fontSize: "22px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          >
            HOVSTA IF
          </p>

          <h1
            style={{
              margin: "7px 0 5px",
              color: "white",
              fontSize: "28px",
            }}
          >
            Välkommen
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "14px",
            }}
          >
            Logga in för att komma till laget
          </p>
        </div>
      </header>

      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "22px 20px",
        }}
      >
        <section
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "22px",
            boxShadow:
              "0 3px 14px rgba(18,59,42,0.07)",
            border: "1px solid #edf0ee",
          }}
        >
          <p
            style={{
              margin: "0 0 5px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Spelare
          </p>

          <h2
            style={{
              margin: "0 0 6px",
              color: "#123b2a",
              fontSize: "22px",
            }}
          >
            Spelarinloggning
          </h2>

          <p
            style={{
              margin: "0 0 22px",
              color: "#68716c",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Välj ditt namn och skriv din fyrsiffriga
            PIN-kod.
          </p>

          <label
            htmlFor="player"
            style={{
              display: "block",
              marginBottom: "7px",
              color: "#37413c",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Spelare
          </label>

          <select
            id="player"
            value={playerId}
            disabled={loadingPlayers}
            onChange={(event) => {
              setPlayerId(event.target.value)
              setError("")
            }}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d7ddd9",
              borderRadius: "12px",
              background: "white",
              color: "#17202a",
              fontSize: "16px",
              boxSizing: "border-box",
              outline: "none",
            }}
          >
            <option value="">
              {loadingPlayers
                ? "Hämtar spelare..."
                : players.length === 0
                  ? "Inga spelare hittades"
                  : "Välj ditt namn"}
            </option>

            {players.map((player) => (
              <option
                key={player.id}
                value={player.id}
              >
                {player.full_name}
              </option>
            ))}
          </select>

          <label
            htmlFor="pin"
            style={{
              display: "block",
              marginTop: "18px",
              marginBottom: "7px",
              color: "#37413c",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            PIN-kod
          </label>

          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 4)

              setPin(value)
              setError("")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleLogin()
              }
            }}
            placeholder="••••"
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d7ddd9",
              borderRadius: "12px",
              background: "white",
              color: "#17202a",
              fontSize: "20px",
              letterSpacing: "8px",
              textAlign: "center",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {error && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px 14px",
                background: "#fff0f0",
                border: "1px solid #efcaca",
                borderRadius: "11px",
                color: "#9b2c2c",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={() => void handleLogin()}
            disabled={loading || loadingPlayers}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background:
                loading || loadingPlayers
                  ? "#70877b"
                  : "#123b2a",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                loading || loadingPlayers
                  ? "default"
                  : "pointer",
            }}
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </section>

        <p
          style={{
            margin: "20px 0 4px",
            textAlign: "center",
            color: "#9aa29d",
            fontSize: "11px",
            letterSpacing: "0.5px",
          }}
        >
          HOVSTA IF • 1976
        </p>
      </main>
    </div>
  )
}

export default Login
