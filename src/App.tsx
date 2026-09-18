import { useEffect, useState } from "react"
import CheckIn from "./CheckIn"
import CheckOut from "./CheckOut"
import Training from "./Training"
import Coach from "./Coach"
import PlayerProfile from "./PlayerProfile"
import Login from "./Login"
import { supabase } from "./supabase"
import hovstaLogo from "./assets/300374317_580630103589064_157634585059629613_n.jpg"

type UserRole = "player" | "coach" | "admin"

type TrainingData = {
  id: string
  date: string
  time: string
  location: string
  focus: string
  description: string | null
  notes: string | null
}

type Page =
  | "home"
  | "checkin"
  | "checkout"
  | "training"
  | "coach"
  | "profile"

type CheckStatus =
  | "noTraining"
  | "locked"
  | "open"
  | "completed"
  | "closed"

function App() {
  const [loggedInPlayerId, setLoggedInPlayerId] =
    useState<string | null>(null)

  const [playerName, setPlayerName] = useState("")
  const [userRole, setUserRole] =
    useState<UserRole | null>(null)

  const [checkingSession, setCheckingSession] =
    useState(true)

  const [homeLoading, setHomeLoading] =
    useState(true)

  const [homeError, setHomeError] = useState("")

  const [nextTraining, setNextTraining] =
    useState<TrainingData | null>(null)

  const [checkOutTraining, setCheckOutTraining] =
    useState<TrainingData | null>(null)

  const [hasCheckedIn, setHasCheckedIn] =
    useState(false)

  const [hasCheckedOut, setHasCheckedOut] =
    useState(false)

  const [page, setPage] =
    useState<Page>("home")

  const getTrainingDateTime = (
    training: TrainingData
  ) => {
    const time =
      training.time?.slice(0, 5) || "23:59"

    const dateTime = new Date(
      `${training.date}T${time}:00`
    ).getTime()

    if (Number.isNaN(dateTime)) {
      return Number.POSITIVE_INFINITY
    }

    return dateTime
  }

  const formatDate = (date: string) => {
    if (!date) {
      return ""
    }

    const dateObject = new Date(
      `${date}T12:00:00`
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    ).format(dateObject)
  }

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || ""
  }

  const getCheckInOpenTime = (
    training: TrainingData
  ) => {
    const openTime = new Date(
      getTrainingDateTime(training) -
        6 * 60 * 60 * 1000
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(openTime)
  }

  const getCheckOutOpenTime = (
    training: TrainingData
  ) => {
    const openTime = new Date(
      getTrainingDateTime(training) +
        30 * 60 * 1000
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(openTime)
  }

  const getCheckOutCloseTime = (
    training: TrainingData
  ) => {
    const closeTime = new Date(
      getTrainingDateTime(training) +
        7 * 60 * 60 * 1000
    )

    return new Intl.DateTimeFormat(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(closeTime)
  }

  useEffect(() => {
    let active = true

    const loadProfile = async (
      userId: string
    ) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .single()

      if (!active) {
        return
      }

      if (
        error ||
        !data?.full_name ||
        !data?.role
      ) {
        console.error(
          "Kunde inte hämta profil:",
          error
        )

        await supabase.auth.signOut()

        if (!active) {
          return
        }

        setLoggedInPlayerId(null)
        setPlayerName("")
        setUserRole(null)
        setCheckingSession(false)
        return
      }

      setLoggedInPlayerId(userId)
      setPlayerName(data.full_name)
      setUserRole(data.role as UserRole)
      setCheckingSession(false)
    }

    const restoreSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (
        error ||
        !session?.user?.id
      ) {
        setLoggedInPlayerId(null)
        setPlayerName("")
        setUserRole(null)
        setCheckingSession(false)
        return
      }

      await loadProfile(session.user.id)
    }

    void restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) {
          return
        }

        if (
          event === "SIGNED_OUT" ||
          !session?.user?.id
        ) {
          setLoggedInPlayerId(null)
          setPlayerName("")
          setUserRole(null)
          setCheckingSession(false)
          setPage("home")
          return
        }

        if (event === "SIGNED_IN") {
          void loadProfile(
            session.user.id
          )
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!loggedInPlayerId) {
      setHomeLoading(false)
      return
    }

    let active = true

    const loadHomeData = async () => {
      setHomeLoading(true)
      setHomeError("")

      const { data, error } = await supabase
        .from("trainings")
        .select(
          "id, date, time, location, focus, description, notes"
        )
        .order("date", {
          ascending: true,
        })
        .order("time", {
          ascending: true,
        })

      if (!active) {
        return
      }

      if (error) {
        console.error(
          "Kunde inte hämta träningar:",
          error
        )
        setHomeError(
          "Kunde inte hämta lagets träningar."
        )
        setNextTraining(null)
        setCheckOutTraining(null)
        setHasCheckedIn(false)
        setHasCheckedOut(false)
        setHomeLoading(false)
        return
      }

      const trainings =
        (data as TrainingData[] | null) ??
        []

      const now = Date.now()

      const upcoming = trainings
        .filter(
          (training) =>
            getTrainingDateTime(
              training
            ) >= now
        )
        .sort(
          (a, b) =>
            getTrainingDateTime(a) -
            getTrainingDateTime(b)
        )

      const next =
        upcoming[0] ?? null

      const currentCheckOut =
        [...trainings]
          .filter((training) => {
            const trainingTime =
              getTrainingDateTime(
                training
              )

            const closeTime =
              trainingTime +
              7 * 60 * 60 * 1000

            return (
              trainingTime <= now &&
              now < closeTime
            )
          })
          .sort(
            (a, b) =>
              getTrainingDateTime(b) -
              getTrainingDateTime(a)
          )[0] ?? null

      setNextTraining(next)
      setCheckOutTraining(
        currentCheckOut
      )

      if (next) {
        const {
          data: checkInData,
          error: checkInError,
        } = await supabase
          .from("check_ins")
          .select("id")
          .eq(
            "training_id",
            next.id
          )
          .eq(
            "player_id",
            loggedInPlayerId
          )
          .maybeSingle()

        if (!active) {
          return
        }

        if (checkInError) {
          console.error(
            "Kunde inte hämta check-in:",
            checkInError
          )
          setHasCheckedIn(false)
        } else {
          setHasCheckedIn(
            Boolean(checkInData)
          )
        }
      } else {
        setHasCheckedIn(false)
      }

      if (currentCheckOut) {
        const {
          data: checkOutData,
          error: checkOutError,
        } = await supabase
          .from("check_outs")
          .select("id")
          .eq(
            "training_id",
            currentCheckOut.id
          )
          .eq(
            "player_id",
            loggedInPlayerId
          )
          .maybeSingle()

        if (!active) {
          return
        }

        if (checkOutError) {
          console.error(
            "Kunde inte hämta check-out:",
            checkOutError
          )
          setHasCheckedOut(false)
        } else {
          setHasCheckedOut(
            Boolean(checkOutData)
          )
        }
      } else {
        setHasCheckedOut(false)
      }

      if (active) {
        setHomeLoading(false)
      }
    }

    void loadHomeData()

    return () => {
      active = false
    }
  }, [loggedInPlayerId, page])

  const getCheckInStatus = (
    training: TrainingData | null
  ): CheckStatus => {
    if (!training) {
      return "noTraining"
    }

    if (hasCheckedIn) {
      return "completed"
    }

    const now = Date.now()

    const trainingTime =
      getTrainingDateTime(training)

    const openTime =
      trainingTime -
      6 * 60 * 60 * 1000

    if (now < openTime) {
      return "locked"
    }

    if (now >= trainingTime) {
      return "closed"
    }

    return "open"
  }

  const getCheckOutStatus = (
    training: TrainingData | null
  ): CheckStatus => {
    if (!training) {
      return "noTraining"
    }

    if (hasCheckedOut) {
      return "completed"
    }

    const now = Date.now()

    const trainingTime =
      getTrainingDateTime(training)

    const openTime =
      trainingTime +
      30 * 60 * 1000

    const closeTime =
      trainingTime +
      7 * 60 * 60 * 1000

    if (now < openTime) {
      return "locked"
    }

    if (now >= closeTime) {
      return "closed"
    }

    return "open"
  }

  const checkInStatus =
    getCheckInStatus(nextTraining)

  const checkOutStatus =
    getCheckOutStatus(
      checkOutTraining
    )

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
          color: "#123b2a",
        }}
      >
        <strong>
          Laddar Hovsta IF...
        </strong>
      </div>
    )
  }

  if (
    !loggedInPlayerId ||
    !playerName ||
    !userRole
  ) {
    return (
      <Login
        onLogin={(playerId) => {
          setCheckingSession(true)
          setLoggedInPlayerId(
            playerId
          )
        }}
      />
    )
  }

  if (page === "checkin") {
    return (
      <CheckIn
        onBack={() =>
          setPage("home")
        }
      />
    )
  }

  if (page === "checkout") {
    return (
      <CheckOut
        onBack={() =>
          setPage("home")
        }
      />
    )
  }

  if (page === "training") {
    return (
      <Training
        onBack={() =>
          setPage("home")
        }
      />
    )
  }

  if (
    page === "coach" &&
    (userRole === "coach" ||
      userRole === "admin")
  ) {
    return (
      <Coach
        onBack={() =>
          setPage("home")
        }
      />
    )
  }

  if (page === "profile") {
    return (
      <PlayerProfile
        onBack={() =>
          setPage("home")
        }
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
              "20px 20px 26px",
          }}
        >
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
                width: "120px",
                height: "120px",
                minWidth: "120px",
                borderRadius: "17px",
                background: "white",
                padding: "6px",
                boxSizing:
                  "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
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
                  objectFit:
                    "contain",
                  borderRadius:
                    "11px",
                }}
              />
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#f39200",
                  fontSize: "22px",
                  fontWeight: "bold",
                  letterSpacing:
                    "1.4px",
                }}
              >
                HOVSTA IF
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "white",
                  fontSize: "22px",
                  fontWeight: "bold",
                }}
              >
                Lagappen
              </p>
            </div>
          </div>

          <h1
            style={{
              margin: "0 0 7px",
              fontSize: "29px",
              letterSpacing:
                "-0.5px",
              color: "white",
            }}
          >
            Hej, {playerName}! 👋
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              fontSize: "15px",
            }}
          >
            Här är det senaste från
            laget.
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
        {homeLoading && (
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
            }}
          >
            <strong
              style={{
                color: "#123b2a",
              }}
            >
              Hämtar lagets
              information...
            </strong>
          </section>
        )}

        {homeError && (
          <section
            style={{
              ...cardStyle,
              background: "#fff1f0",
              border:
                "1px solid #f1c0bc",
            }}
          >
            <strong
              style={{
                color: "#8a2820",
              }}
            >
              {homeError}
            </strong>
          </section>
        )}

        {!homeLoading && (
          <>
            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: "bold",
                    letterSpacing:
                      "0.7px",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Nästa träning
                </p>

                <span
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius:
                      "50%",
                    background:
                      "#f39200",
                  }}
                />
              </div>

              {nextTraining ? (
                <>
                  <h2
                    style={{
                      margin:
                        "10px 0 8px",
                      color:
                        "#17202a",
                      fontSize: "22px",
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {formatDate(
                      nextTraining.date
                    )}{" "}
                    •{" "}
                    {formatTime(
                      nextTraining.time
                    )}
                  </h2>

                  <p
                    style={{
                      margin: "4px 0",
                      color: "#5f6663",
                    }}
                  >
                    📍{" "}
                    {
                      nextTraining.location
                    }
                  </p>

                  <div
                    style={{
                      marginTop: "14px",
                      padding:
                        "12px 14px",
                      borderRadius:
                        "12px",
                      background:
                        "#f7f9f8",
                      borderLeft:
                        "4px solid #f39200",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color:
                          "#123b2a",
                        fontWeight:
                          "bold",
                      }}
                    >
                      ⚽{" "}
                      {
                        nextTraining.focus
                      }
                    </p>
                  </div>

                  {checkInStatus ===
                    "locked" && (
                    <div
                      style={{
                        marginTop:
                          "18px",
                        padding: "15px",
                        borderRadius:
                          "14px",
                        background:
                          "#f4f6f8",
                        border:
                          "1px solid #e1e4e6",
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",
                          color: "#444",
                        }}
                      >
                        🔒 Check-in är
                        inte öppen ännu
                      </strong>

                      <span
                        style={{
                          display:
                            "block",
                          marginTop:
                            "4px",
                          color:
                            "#6b7280",
                          fontSize:
                            "13px",
                          textTransform:
                            "capitalize",
                        }}
                      >
                        Öppnar{" "}
                        {getCheckInOpenTime(
                          nextTraining
                        )}
                      </span>
                    </div>
                  )}

                  {checkInStatus ===
                    "open" && (
                    <>
                      <div
                        style={{
                          marginTop:
                            "18px",
                          padding:
                            "14px",
                          borderRadius:
                            "14px",
                          background:
                            "#e7f1eb",
                          border:
                            "1px solid #c9ded1",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#123b2a",
                          }}
                        >
                          ✓ Check-in är
                          öppen
                        </strong>
                      </div>

                      <button
                        onClick={() =>
                          setPage(
                            "checkin"
                          )
                        }
                        style={{
                          width: "100%",
                          marginTop:
                            "12px",
                          padding:
                            "14px",
                          border: "none",
                          borderRadius:
                            "12px",
                          background:
                            "#123b2a",
                          color: "white",
                          fontSize:
                            "15px",
                          fontWeight:
                            "bold",
                          cursor:
                            "pointer",
                        }}
                      >
                        Gör check-in
                      </button>
                    </>
                  )}

                  {checkInStatus ===
                    "completed" && (
                    <div
                      style={{
                        marginTop:
                          "18px",
                        padding: "15px",
                        borderRadius:
                          "14px",
                        background:
                          "#e7f1eb",
                        border:
                          "1px solid #c9ded1",
                        color:
                          "#123b2a",
                      }}
                    >
                      <strong>
                        ✓ Du har checkat
                        in
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "13px",
                        }}
                      >
                        Din check-in är
                        registrerad.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2
                    style={{
                      margin:
                        "10px 0 8px",
                    }}
                  >
                    Ingen kommande
                    träning
                  </h2>

                  <p
                    style={{
                      color: "#555",
                    }}
                  >
                    Det finns ingen
                    kommande träning
                    publicerad ännu.
                  </p>
                </>
              )}
            </section>

            {checkOutTraining && (
              <section
                style={cardStyle}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: "bold",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Efter träningen
                </p>

                <h2
                  style={{
                    margin:
                      "9px 0",
                    color:
                      "#123b2a",
                  }}
                >
                  Check-out 👋
                </h2>

                <p
                  style={{
                    color: "#555",
                    textTransform:
                      "capitalize",
                  }}
                >
                  {formatDate(
                    checkOutTraining.date
                  )}{" "}
                  •{" "}
                  {formatTime(
                    checkOutTraining.time
                  )}
                </p>

                <p
                  style={{
                    color: "#555",
                  }}
                >
                  ⚽{" "}
                  {
                    checkOutTraining.focus
                  }
                </p>

                {checkOutStatus ===
                  "locked" && (
                  <div
                    style={{
                      marginTop:
                        "18px",
                      padding: "15px",
                      borderRadius:
                        "14px",
                      background:
                        "#fff8e6",
                      border:
                        "1px solid #f1d995",
                      color:
                        "#6f5714",
                    }}
                  >
                    <strong>
                      🔒 Check-out
                      öppnar{" "}
                      {getCheckOutOpenTime(
                        checkOutTraining
                      )}
                    </strong>
                  </div>
                )}

                {checkOutStatus ===
                  "open" && (
                  <>
                    <div
                      style={{
                        marginTop:
                          "18px",
                        padding:
                          "14px",
                        borderRadius:
                          "14px",
                        background:
                          "#e7f1eb",
                        border:
                          "1px solid #c9ded1",
                        color:
                          "#123b2a",
                      }}
                    >
                      <strong>
                        ✓ Check-out är
                        öppen
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "13px",
                        }}
                      >
                        Öppen till{" "}
                        {getCheckOutCloseTime(
                          checkOutTraining
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPage(
                          "checkout"
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop:
                          "12px",
                        padding: "14px",
                        border: "none",
                        borderRadius:
                          "12px",
                        background:
                          "#123b2a",
                        color: "white",
                        fontSize:
                          "15px",
                        fontWeight:
                          "bold",
                        cursor:
                          "pointer",
                      }}
                    >
                      Gör check-out
                    </button>
                  </>
                )}

                {checkOutStatus ===
                  "completed" && (
                  <div
                    style={{
                      marginTop:
                        "18px",
                      padding: "15px",
                      borderRadius:
                        "14px",
                      background:
                        "#e7f1eb",
                      border:
                        "1px solid #c9ded1",
                      color:
                        "#123b2a",
                    }}
                  >
                    <strong>
                      ✓ Du har checkat ut
                    </strong>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "13px",
                      }}
                    >
                      Din check-out är
                      registrerad.
                    </div>
                  </div>
                )}
              </section>
            )}

            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: "bold",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Träningsplan
                </p>

                <span
                  style={{
                    color: "#f39200",
                    fontSize: "18px",
                  }}
                >
                  ⚽
                </span>
              </div>

              {nextTraining ? (
                <>
                  <h2
                    style={{
                      margin:
                        "9px 0",
                      color:
                        "#123b2a",
                    }}
                  >
                    {
                      nextTraining.focus
                    }
                  </h2>

                  <p
                    style={{
                      color:
                        "#5f6663",
                      lineHeight:
                        "1.5",
                    }}
                  >
                    Se träningsplanen
                    och förbered dig
                    inför nästa
                    träning.
                  </p>
                </>
              ) : (
                <p
                  style={{
                    color: "#666",
                  }}
                >
                  Ingen kommande
                  träningsplan finns
                  tillgänglig.
                </p>
              )}

              <button
                onClick={() =>
                  setPage("training")
                }
                style={{
                  padding:
                    "10px 16px",
                  border:
                    "1px solid #d7ddd9",
                  borderRadius:
                    "10px",
                  background: "white",
                  color: "#123b2a",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Se träningar →
              </button>
            </section>

            {(userRole === "coach" ||
              userRole ===
                "admin") && (
              <section
                style={{
                  background:
                    "#edf4f0",
                  borderRadius:
                    "18px",
                  padding: "20px",
                  marginBottom:
                    "16px",
                  border:
                    "1px solid #d4e2da",
                  borderTop:
                    "3px solid #f39200",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color:
                      "#52705f",
                    fontWeight:
                      "bold",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Ledare
                </p>

                <h2
                  style={{
                    margin:
                      "8px 0",
                    color:
                      "#123b2a",
                  }}
                >
                  Ledarläge
                </h2>

                <p
                  style={{
                    color:
                      "#526158",
                    lineHeight:
                      "1.5",
                  }}
                >
                  Hantera träningar,
                  spelare och
                  spelarnas svar.
                </p>

                <button
                  onClick={() =>
                    setPage("coach")
                  }
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "none",
                    borderRadius:
                      "12px",
                    background:
                      "#123b2a",
                    color: "white",
                    fontSize:
                      "15px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  Öppna ledarläge
                </button>
              </section>
            )}

            <nav
              style={{
                background: "white",
                borderRadius:
                  "18px",
                padding:
                  "13px 6px",
                display: "flex",
                justifyContent:
                  "space-around",
                boxShadow:
                  "0 3px 14px rgba(18,59,42,0.08)",
                border:
                  "1px solid #edf0ee",
              }}
            >
              <span
                style={{
                  textAlign:
                    "center",
                  fontSize: "12px",
                  color:
                    "#123b2a",
                  fontWeight:
                    "bold",
                  borderTop:
                    "2px solid #f39200",
                  paddingTop:
                    "5px",
                }}
              >
                🏠
                <br />
                Hem
              </span>

              <span
                onClick={() => {
                  if (
                    checkInStatus ===
                      "open" ||
                    checkInStatus ===
                      "completed"
                  ) {
                    setPage(
                      "checkin"
                    )
                  }
                }}
                style={{
                  textAlign:
                    "center",
                  fontSize: "12px",
                  cursor:
                    checkInStatus ===
                      "open" ||
                    checkInStatus ===
                      "completed"
                      ? "pointer"
                      : "default",
                  opacity:
                    checkInStatus ===
                      "open" ||
                    checkInStatus ===
                      "completed"
                      ? 1
                      : 0.4,
                }}
              >
                💚
                <br />
                Check-in
              </span>

              <span
                onClick={() => {
                  if (
                    checkOutStatus ===
                      "open" ||
                    checkOutStatus ===
                      "completed"
                  ) {
                    setPage(
                      "checkout"
                    )
                  }
                }}
                style={{
                  textAlign:
                    "center",
                  fontSize: "12px",
                  cursor:
                    checkOutStatus ===
                      "open" ||
                    checkOutStatus ===
                      "completed"
                      ? "pointer"
                      : "default",
                  opacity:
                    checkOutStatus ===
                      "open" ||
                    checkOutStatus ===
                      "completed"
                      ? 1
                      : 0.4,
                }}
              >
                👋
                <br />
                Check-out
              </span>

              <span
                onClick={() =>
                  setPage(
                    "training"
                  )
                }
                style={{
                  textAlign:
                    "center",
                  fontSize: "12px",
                  cursor:
                    "pointer",
                }}
              >
                ⚽
                <br />
                Träningar
              </span>

              <span
                onClick={() =>
                  setPage(
                    "profile"
                  )
                }
                style={{
                  textAlign:
                    "center",
                  fontSize: "12px",
                  cursor:
                    "pointer",
                }}
              >
                👤
                <br />
                Profil
              </span>
            </nav>
          </>
        )}

        <p
          style={{
            margin: "18px 0 4px",
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

export default App
