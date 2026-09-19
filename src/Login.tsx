import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import hovstaLogo from "./assets/300374317_580630103589064_157634585059629613_n.jpg"

type LoginProps = {
  onLogin: (userId: string) => void
}

type Player = {
  id: string
  full_name: string
}

type Coach = {
  id: string
  full_name: string
  team_id: string | null
  team_name: string | null
}

type LoginMode = "player" | "leader" | "admin"

function Login({ onLogin }: LoginProps) {
  const [loginMode, setLoginMode] =
    useState<LoginMode>("player")

  const [players, setPlayers] =
    useState<Player[]>([])

  const [coaches, setCoaches] =
    useState<Coach[]>([])

  const [playerId, setPlayerId] =
    useState("")

  const [coachId, setCoachId] =
    useState("")

  const [pin, setPin] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [error, setError] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [loadingPlayers, setLoadingPlayers] =
    useState(true)

  const [loadingCoaches, setLoadingCoaches] =
    useState(true)

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const {
          data,
          error: functionError,
        } = await supabase.functions.invoke(
          "login-players"
        )

        if (functionError) {
          console.error(
            "Could not load players:",
            functionError
          )

          return
        }

        if (
          data?.success &&
          Array.isArray(data?.players)
        ) {
          setPlayers(data.players)
        }
      } catch (loadError) {
        console.error(
          "Player loading error:",
          loadError
        )
      } finally {
        setLoadingPlayers(false)
      }
    }

    const loadCoaches = async () => {
      try {
        const {
          data,
          error: functionError,
        } = await supabase.functions.invoke(
          "login-coaches"
        )

        if (functionError) {
          console.error(
            "Could not load coaches:",
            functionError
          )

          return
        }

        if (
          data?.success &&
          Array.isArray(data?.coaches)
        ) {
          setCoaches(data.coaches)
        }
      } catch (loadError) {
        console.error(
          "Coach loading error:",
          loadError
        )
      } finally {
        setLoadingCoaches(false)
      }
    }

    void loadPlayers()
    void loadCoaches()
  }, [])

  const changeLoginMode = (
    mode: LoginMode
  ) => {
    setLoginMode(mode)
    setError("")
    setPin("")
    setPassword("")
  }

  const startReturnedSession = async (
    accessToken: string,
    refreshToken: string
  ) => {
    const { error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

    if (sessionError) {
      console.error(
        "Could not start session:",
        sessionError
      )

      throw new Error(
        "Kunde inte starta den inloggade sessionen."
      )
    }
  }

  const handlePlayerLogin = async () => {
    setError("")

    if (!playerId) {
      setError("Välj en spelare.")
      return
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError(
        "PIN-koden ska innehålla fyra siffror."
      )
      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "player-login",
        {
          body: {
            player_id: playerId,
            pin,
          },
        }
      )

      if (functionError) {
        console.error(
          "Player login failed:",
          functionError
        )

        if (
          functionError.context?.status === 429
        ) {
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

      if (
        !data?.success ||
        !data?.session
      ) {
        setError(
          data?.error ||
            "Inloggningen misslyckades."
        )
        return
      }

      await startReturnedSession(
        data.session.access_token,
        data.session.refresh_token
      )

      onLogin(playerId)
    } catch (loginError) {
      console.error(
        "Player login error:",
        loginError
      )

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Något gick fel. Försök igen."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCoachLogin = async () => {
    setError("")

    if (!coachId) {
      setError("Välj en ledare.")
      return
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError(
        "PIN-koden ska innehålla fyra siffror."
      )
      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "coach-login",
        {
          body: {
            coach_id: coachId,
            pin,
          },
        }
      )

      if (functionError) {
        console.error(
          "Coach login failed:",
          functionError
        )

        if (
          functionError.context?.status === 429
        ) {
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

      if (
        !data?.success ||
        !data?.session
      ) {
        setError(
          data?.error ||
            "Inloggningen misslyckades."
        )
        return
      }

      await startReturnedSession(
        data.session.access_token,
        data.session.refresh_token
      )

      onLogin(coachId)
    } catch (loginError) {
      console.error(
        "Coach login error:",
        loginError
      )

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Något gick fel. Försök igen."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    setError("")

    const normalizedEmail =
      email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError("Skriv din e-postadress.")
      return
    }

    if (!password) {
      setError("Skriv ditt lösenord.")
      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth
        .signInWithPassword({
          email: normalizedEmail,
          password,
        })

      if (
        loginError ||
        !data.user
      ) {
        console.error(
          "Admin login failed:",
          loginError
        )

        setError(
          "Fel e-postadress eller lösenord."
        )
        return
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", data.user.id)
        .single()

      if (
        profileError ||
        !profile
      ) {
        console.error(
          "Could not load admin profile:",
          profileError
        )

        await supabase.auth.signOut()

        setError(
          "Kunde inte läsa din adminprofil."
        )
        return
      }

      if (profile.role !== "admin") {
        await supabase.auth.signOut()

        setError(
          "Det här kontot har inte adminbehörighet."
        )
        return
      }

      onLogin(data.user.id)
    } catch (loginError) {
      console.error(
        "Admin login error:",
        loginError
      )

      await supabase.auth.signOut()

      setError(
        "Något gick fel. Försök igen."
      )
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "14px",
    border: "1px solid #d7ddd9",
    borderRadius: "12px",
    background: "white",
    color: "#17202a",
    fontSize: "16px",
    boxSizing: "border-box" as const,
    outline: "none",
  }

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#37413c",
    fontSize: "14px",
    fontWeight: "bold" as const,
  }

  const pinInput = (
    id: string,
    loginHandler: () => Promise<void>
  ) => (
    <>
      <label
        htmlFor={id}
        style={{
          ...labelStyle,
          marginTop: "18px",
        }}
      >
        PIN-kod
      </label>

      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(event) => {
          const value =
            event.target.value
              .replace(/\D/g, "")
              .slice(0, 4)

          setPin(value)
          setError("")
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            void loginHandler()
          }
        }}
        placeholder="••••"
        style={{
          ...inputStyle,
          fontSize: "20px",
          letterSpacing: "8px",
          textAlign: "center",
        }}
      />
    </>
  )

  const isListLoading =
    loginMode === "player"
      ? loadingPlayers
      : loginMode === "leader"
        ? loadingCoaches
        : false

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
            padding: "7px",
            marginBottom: "14px",
            boxShadow:
              "0 3px 14px rgba(18,59,42,0.07)",
            border: "1px solid #edf0ee",
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "7px",
          }}
        >
          {(
            [
              ["player", "⚽ Spelare"],
              ["leader", "👤 Ledare"],
              ["admin", "🔐 Admin"],
            ] as const
          ).map(([mode, text]) => (
            <button
              key={mode}
              onClick={() =>
                changeLoginMode(mode)
              }
              style={{
                padding: "13px 5px",
                border: "none",
                borderRadius: "12px",
                background:
                  loginMode === mode
                    ? "#123b2a"
                    : "transparent",
                color:
                  loginMode === mode
                    ? "white"
                    : "#5f6663",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {text}
            </button>
          ))}
        </section>

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
          {loginMode === "player" && (
            <>
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
                Välj ditt namn och skriv din
                fyrsiffriga PIN-kod.
              </p>

              <label
                htmlFor="player"
                style={labelStyle}
              >
                Spelare
              </label>

              <select
                id="player"
                value={playerId}
                disabled={loadingPlayers}
                onChange={(event) => {
                  setPlayerId(
                    event.target.value
                  )
                  setError("")
                }}
                style={inputStyle}
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

              {pinInput(
                "player-pin",
                handlePlayerLogin
              )}
            </>
          )}

          {loginMode === "leader" && (
            <>
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
                Ledare
              </p>

              <h2
                style={{
                  margin: "0 0 6px",
                  color: "#123b2a",
                  fontSize: "22px",
                }}
              >
                Ledarinloggning
              </h2>

              <p
                style={{
                  margin: "0 0 22px",
                  color: "#68716c",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                Välj ditt namn och skriv din
                fyrsiffriga PIN-kod.
              </p>

              <label
                htmlFor="coach"
                style={labelStyle}
              >
                Ledare
              </label>

              <select
                id="coach"
                value={coachId}
                disabled={loadingCoaches}
                onChange={(event) => {
                  setCoachId(
                    event.target.value
                  )
                  setError("")
                }}
                style={inputStyle}
              >
                <option value="">
                  {loadingCoaches
                    ? "Hämtar ledare..."
                    : coaches.length === 0
                      ? "Inga ledare hittades"
                      : "Välj ditt namn"}
                </option>

                {coaches.map((coach) => (
                  <option
                    key={coach.id}
                    value={coach.id}
                  >
                    {coach.full_name}
                    {coach.team_name
                      ? ` – ${coach.team_name}`
                      : ""}
                  </option>
                ))}
              </select>

              {pinInput(
                "coach-pin",
                handleCoachLogin
              )}
            </>
          )}

          {loginMode === "admin" && (
            <>
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
                Administration
              </p>

              <h2
                style={{
                  margin: "0 0 6px",
                  color: "#123b2a",
                  fontSize: "22px",
                }}
              >
                Admininloggning
              </h2>

              <p
                style={{
                  margin: "0 0 22px",
                  color: "#68716c",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                Logga in med din e-postadress
                och ditt lösenord.
              </p>

              <label
                htmlFor="email"
                style={labelStyle}
              >
                E-postadress
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  )
                  setError("")
                }}
                placeholder="namn@exempel.se"
                style={inputStyle}
              />

              <label
                htmlFor="password"
                style={{
                  ...labelStyle,
                  marginTop: "18px",
                }}
              >
                Lösenord
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  )
                  setError("")
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    void handleAdminLogin()
                  }
                }}
                placeholder="Ditt lösenord"
                style={inputStyle}
              />
            </>
          )}

          {error && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px 14px",
                background: "#fff0f0",
                border:
                  "1px solid #efcaca",
                borderRadius: "11px",
                color: "#9b2c2c",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={() => {
              if (
                loginMode === "player"
              ) {
                void handlePlayerLogin()
              } else if (
                loginMode === "leader"
              ) {
                void handleCoachLogin()
              } else {
                void handleAdminLogin()
              }
            }}
            disabled={
              loading ||
              isListLoading
            }
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background:
                loading ||
                isListLoading
                  ? "#70877b"
                  : "#123b2a",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                loading ||
                isListLoading
                  ? "default"
                  : "pointer",
            }}
          >
            {loading
              ? "Loggar in..."
              : "Logga in"}
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
