import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type ManageLeadersProps = {
  onBack: () => void
}

type Team = {
  id: string
  name: string
}

type Leader = {
  id: string
  full_name: string
  team_id: string | null
}

type LeaderAction =
  | "edit"
  | "pin"
  | "delete"
  | null

function ManageLeaders({
  onBack,
}: ManageLeadersProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])

  const [fullName, setFullName] = useState("")
  const [teamId, setTeamId] = useState("")
  const [pin, setPin] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")
  const [successMessage, setSuccessMessage] =
    useState("")

  const [selectedLeader, setSelectedLeader] =
    useState<Leader | null>(null)

  const [leaderAction, setLeaderAction] =
    useState<LeaderAction>(null)

  const [editName, setEditName] = useState("")
  const [editTeamId, setEditTeamId] =
    useState("")
  const [newPin, setNewPin] = useState("")

  const [actionSaving, setActionSaving] =
    useState(false)
  const [actionError, setActionError] =
    useState("")

  const loadData = async () => {
    setLoading(true)
    setErrorMessage("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(userError)
      setErrorMessage(
        "Din inloggning kunde inte verifieras."
      )
      setLoading(false)
      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      profileError ||
      !profile ||
      profile.role !== "admin"
    ) {
      console.error(profileError)
      setErrorMessage(
        "Endast administratörer får hantera ledare."
      )
      setLoading(false)
      return
    }

    const [
      { data: teamData, error: teamError },
      { data: leaderData, error: leaderError },
    ] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("role", "coach")
        .order("full_name"),
    ])

    if (teamError) {
      console.error(teamError)
      setErrorMessage(
        "Kunde inte hämta föreningens lag."
      )
      setLoading(false)
      return
    }

    if (leaderError) {
      console.error(leaderError)
      setErrorMessage(
        "Kunde inte hämta ledarna."
      )
      setLoading(false)
      return
    }

    const loadedTeams = teamData ?? []

    setTeams(loadedTeams)
    setLeaders(leaderData ?? [])

    if (
      !teamId &&
      loadedTeams.length > 0
    ) {
      setTeamId(loadedTeams[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const getFunctionError = async (
    functionError: unknown,
    fallback: string
  ) => {
    let message = fallback

    try {
      const context = (
        functionError as {
          context?: Response
        }
      ).context

      if (context) {
        const body = await context.json()

        if (body?.error) {
          message = body.error
        }
      }
    } catch {
      // Behåll standardmeddelandet.
    }

    return message
  }

  const createLeader = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    const cleanName = fullName.trim()
    const cleanPin = pin.trim()

    if (!cleanName) {
      setErrorMessage(
        "Skriv ledarens namn."
      )
      return
    }

    if (!teamId) {
      setErrorMessage(
        "Välj vilket lag ledaren tillhör."
      )
      return
    }

    if (!/^[0-9]{4}$/.test(cleanPin)) {
      setErrorMessage(
        "PIN-koden ska innehålla exakt fyra siffror."
      )
      return
    }

    setSaving(true)

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "create-coach-auth",
        {
          body: {
            full_name: cleanName,
            team_id: teamId,
            pin: cleanPin,
          },
        }
      )

      if (functionError) {
        console.error(
          "Kunde inte skapa ledare:",
          functionError
        )

        setErrorMessage(
          await getFunctionError(
            functionError,
            "Kunde inte skapa ledaren."
          )
        )
        return
      }

      if (!data?.success) {
        setErrorMessage(
          data?.error ||
            "Kunde inte skapa ledaren."
        )
        return
      }

      setFullName("")
      setPin("")

      setSuccessMessage(
        `${cleanName} har lagts till som ledare.`
      )

      await loadData()
    } catch (error) {
      console.error(error)
      setErrorMessage(
        "Något gick fel när ledaren skulle skapas."
      )
    } finally {
      setSaving(false)
    }
  }

  const getTeamName = (
    leaderTeamId: string | null
  ) => {
    if (!leaderTeamId) {
      return "Inget lag"
    }

    return (
      teams.find(
        (team) =>
          team.id === leaderTeamId
      )?.name ?? "Okänt lag"
    )
  }

  const closeLeaderAction = () => {
    if (actionSaving) {
      return
    }

    setSelectedLeader(null)
    setLeaderAction(null)
    setEditName("")
    setEditTeamId("")
    setNewPin("")
    setActionError("")
  }

  const openEditLeader = (
    leader: Leader
  ) => {
    setSelectedLeader(leader)
    setLeaderAction("edit")
    setEditName(leader.full_name)
    setEditTeamId(leader.team_id ?? "")
    setNewPin("")
    setActionError("")
    setSuccessMessage("")
  }

  const openPinLeader = (
    leader: Leader
  ) => {
    setSelectedLeader(leader)
    setLeaderAction("pin")
    setNewPin("")
    setActionError("")
    setSuccessMessage("")
  }

  const openDeleteLeader = (
    leader: Leader
  ) => {
    setSelectedLeader(leader)
    setLeaderAction("delete")
    setActionError("")
    setSuccessMessage("")
  }

  const saveLeaderChanges = async () => {
    if (
      !selectedLeader ||
      actionSaving
    ) {
      return
    }

    const cleanName = editName.trim()

    if (!cleanName) {
      setActionError(
        "Ledaren måste ha ett namn."
      )
      return
    }

    if (!editTeamId) {
      setActionError(
        "Välj vilket lag ledaren tillhör."
      )
      return
    }

    setActionSaving(true)
    setActionError("")

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "manage-coach-auth",
        {
          body: {
            action: "update",
            coach_id: selectedLeader.id,
            full_name: cleanName,
            team_id: editTeamId,
          },
        }
      )

      if (functionError) {
        setActionError(
          await getFunctionError(
            functionError,
            "Kunde inte uppdatera ledaren."
          )
        )
        return
      }

      if (!data?.success) {
        setActionError(
          data?.error ||
            "Kunde inte uppdatera ledaren."
        )
        return
      }

      const leaderName = cleanName

      closeLeaderAction()
      await loadData()

      setSuccessMessage(
        `${leaderName} har uppdaterats.`
      )
    } catch (error) {
      console.error(error)
      setActionError(
        "Något gick fel när ledaren skulle uppdateras."
      )
    } finally {
      setActionSaving(false)
    }
  }

  const saveNewPin = async () => {
    if (
      !selectedLeader ||
      actionSaving
    ) {
      return
    }

    const cleanPin = newPin.trim()

    if (!/^[0-9]{4}$/.test(cleanPin)) {
      setActionError(
        "PIN-koden ska innehålla exakt fyra siffror."
      )
      return
    }

    setActionSaving(true)
    setActionError("")

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "manage-coach-auth",
        {
          body: {
            action: "reset_pin",
            coach_id: selectedLeader.id,
            pin: cleanPin,
          },
        }
      )

      if (functionError) {
        setActionError(
          await getFunctionError(
            functionError,
            "Kunde inte byta PIN-koden."
          )
        )
        return
      }

      if (!data?.success) {
        setActionError(
          data?.error ||
            "Kunde inte byta PIN-koden."
        )
        return
      }

      const leaderName =
        selectedLeader.full_name

      closeLeaderAction()

      setSuccessMessage(
        `Ny PIN-kod är sparad för ${leaderName}.`
      )
    } catch (error) {
      console.error(error)
      setActionError(
        "Något gick fel när PIN-koden skulle bytas."
      )
    } finally {
      setActionSaving(false)
    }
  }

  const deleteLeader = async () => {
    if (
      !selectedLeader ||
      actionSaving
    ) {
      return
    }

    setActionSaving(true)
    setActionError("")

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "manage-coach-auth",
        {
          body: {
            action: "delete",
            coach_id: selectedLeader.id,
          },
        }
      )

      if (functionError) {
        setActionError(
          await getFunctionError(
            functionError,
            "Kunde inte ta bort ledaren."
          )
        )
        return
      }

      if (!data?.success) {
        setActionError(
          data?.error ||
            "Kunde inte ta bort ledaren."
        )
        return
      }

      const leaderName =
        selectedLeader.full_name

      closeLeaderAction()
      await loadData()

      setSuccessMessage(
        `${leaderName} och ledarens inloggning har tagits bort.`
      )
    } catch (error) {
      console.error(error)
      setActionError(
        "Något gick fel när ledaren skulle tas bort."
      )
    } finally {
      setActionSaving(false)
    }
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d7ddd9",
    borderRadius: "11px",
    fontSize: "16px",
    background: "white",
    color: "#17202a",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "7px",
    color: "#123b2a",
    fontSize: "14px",
    fontWeight: "bold",
  }

  const actionButtonStyle:
    React.CSSProperties = {
      flex: 1,
      padding: "10px 8px",
      borderRadius: "10px",
      fontSize: "12px",
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
          borderRadius:
            "0 0 28px 28px",
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
              margin: "0 0 5px",
              color: "#f39200",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            HOVSTA IF
          </p>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "29px",
            }}
          >
            Hantera ledare 👥
          </h1>

          <p
            style={{
              margin: 0,
              color: "#dbe6df",
              lineHeight: "1.5",
            }}
          >
            Lägg till, redigera och hantera
            föreningens ledare.
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
            borderTop:
              "4px solid #f39200",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Ny ledare
          </p>

          <h2
            style={{
              margin: "8px 0 18px",
              color: "#123b2a",
            }}
          >
            Lägg till ledare
          </h2>

          <label
            htmlFor="leader-name"
            style={labelStyle}
          >
            Namn
          </label>

          <input
            id="leader-name"
            type="text"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              setErrorMessage("")
              setSuccessMessage("")
            }}
            placeholder="Exempel: Anna Andersson"
            style={inputStyle}
          />

          <label
            htmlFor="leader-team"
            style={{
              ...labelStyle,
              marginTop: "17px",
            }}
          >
            Lag
          </label>

          <select
            id="leader-team"
            value={teamId}
            onChange={(event) => {
              setTeamId(event.target.value)
              setErrorMessage("")
              setSuccessMessage("")
            }}
            style={inputStyle}
          >
            {teams.length === 0 && (
              <option value="">
                Inga lag finns
              </option>
            )}

            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="leader-pin"
            style={{
              ...labelStyle,
              marginTop: "17px",
            }}
          >
            PIN-kod
          </label>

          <input
            id="leader-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              const value =
                event.target.value.replace(
                  /\D/g,
                  ""
                )

              setPin(value.slice(0, 4))
              setErrorMessage("")
              setSuccessMessage("")
            }}
            placeholder="4 siffror"
            style={inputStyle}
          />

          <p
            style={{
              margin: "8px 0 0",
              color: "#6b7280",
              fontSize: "13px",
              lineHeight: "1.45",
            }}
          >
            Ledaren loggar in med sitt namn
            och sin fyrsiffriga PIN-kod.
          </p>

          {errorMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#fff0f0",
                border:
                  "1px solid #efcaca",
                borderRadius: "11px",
                color: "#9b2c2c",
                fontSize: "14px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#edf7f1",
                border:
                  "1px solid #cfe4d7",
                borderRadius: "11px",
                color: "#123b2a",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          <button
            onClick={() =>
              void createLeader()
            }
            disabled={
              saving ||
              loading ||
              teams.length === 0
            }
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background:
                saving ||
                loading ||
                teams.length === 0
                  ? "#70877b"
                  : "#123b2a",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              cursor:
                saving ||
                loading ||
                teams.length === 0
                  ? "default"
                  : "pointer",
            }}
          >
            {saving
              ? "Skapar ledare..."
              : "+ Lägg till ledare"}
          </button>
        </section>

        <section style={cardStyle}>
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
            }}
          >
            Föreningen
          </p>

          <h2
            style={{
              margin: "8px 0 16px",
              color: "#123b2a",
            }}
          >
            Ledare
          </h2>

          {loading ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              Laddar ledare...
            </p>
          ) : leaders.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Det finns inga ledare
              registrerade ännu.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {leaders.map(
                (leader) => (
                  <div
                    key={leader.id}
                    style={{
                      padding: "15px",
                      border:
                        "1px solid #e2e7e4",
                      borderRadius: "14px",
                      background: "#fafbfa",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#123b2a",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      {leader.full_name}
                    </p>

                    <p
                      style={{
                        margin: "5px 0 13px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      🏟️{" "}
                      {getTeamName(
                        leader.team_id
                      )}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "7px",
                      }}
                    >
                      <button
                        onClick={() =>
                          openEditLeader(
                            leader
                          )
                        }
                        style={{
                          ...actionButtonStyle,
                          border:
                            "1px solid #d7ddd9",
                          background: "white",
                          color: "#123b2a",
                        }}
                      >
                        ✏️ Redigera
                      </button>

                      <button
                        onClick={() =>
                          openPinLeader(
                            leader
                          )
                        }
                        style={{
                          ...actionButtonStyle,
                          border:
                            "1px solid #d7ddd9",
                          background: "white",
                          color: "#123b2a",
                        }}
                      >
                        🔑 Byt PIN
                      </button>

                      <button
                        onClick={() =>
                          openDeleteLeader(
                            leader
                          )
                        }
                        style={{
                          ...actionButtonStyle,
                          border:
                            "1px solid #ead0d0",
                          background: "#fff8f8",
                          color: "#9b2c2c",
                        }}
                      >
                        🗑️ Ta bort
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
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
          HOVSTA IF • ADMIN
        </p>
      </main>

      {selectedLeader && leaderAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(10,20,15,0.58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "white",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow:
                "0 16px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                height: "5px",
                background:
                  leaderAction === "delete"
                    ? "#9b2c2c"
                    : "#f39200",
              }}
            />

            <div
              style={{
                padding: "23px",
              }}
            >
              {leaderAction === "edit" && (
                <>
                  <h2
                    style={{
                      margin: "0 0 5px",
                      color: "#123b2a",
                    }}
                  >
                    ✏️ Redigera ledare
                  </h2>

                  <p
                    style={{
                      margin: "0 0 20px",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Ändra namn eller vilket lag
                    ledaren tillhör.
                  </p>

                  <label style={labelStyle}>
                    Namn
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(event) => {
                      setEditName(
                        event.target.value
                      )
                      setActionError("")
                    }}
                    style={{
                      ...inputStyle,
                      marginBottom: "16px",
                    }}
                  />

                  <label style={labelStyle}>
                    Lag
                  </label>

                  <select
                    value={editTeamId}
                    onChange={(event) => {
                      setEditTeamId(
                        event.target.value
                      )
                      setActionError("")
                    }}
                    style={inputStyle}
                  >
                    <option value="">
                      Välj lag
                    </option>

                    {teams.map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {leaderAction === "pin" && (
                <>
                  <h2
                    style={{
                      margin: "0 0 5px",
                      color: "#123b2a",
                    }}
                  >
                    🔑 Byt PIN
                  </h2>

                  <p
                    style={{
                      margin: "0 0 20px",
                      color: "#6b7280",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    Ange en ny PIN-kod för{" "}
                    <strong>
                      {selectedLeader.full_name}
                    </strong>
                    .
                  </p>

                  <label style={labelStyle}>
                    Ny PIN-kod
                  </label>

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(event) => {
                      const value =
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )

                      setNewPin(
                        value.slice(0, 4)
                      )
                      setActionError("")
                    }}
                    placeholder="4 siffror"
                    style={inputStyle}
                  />

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    Den gamla PIN-koden slutar
                    fungera direkt.
                  </p>
                </>
              )}

              {leaderAction === "delete" && (
                <>
                  <h2
                    style={{
                      margin: "0 0 8px",
                      color: "#9b2c2c",
                    }}
                  >
                    🗑️ Ta bort ledare?
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#5f6663",
                      lineHeight: "1.55",
                    }}
                  >
                    Är du säker på att du vill
                    ta bort{" "}
                    <strong>
                      {selectedLeader.full_name}
                    </strong>
                    ?
                  </p>

                  <div
                    style={{
                      marginTop: "16px",
                      padding: "13px",
                      borderRadius: "11px",
                      background: "#fff1f1",
                      border:
                        "1px solid #ead0d0",
                      color: "#8b3434",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    Ledarprofilen och
                    inloggningen tas bort.
                    Träningar som redan skapats
                    raderas inte.
                  </div>
                </>
              )}

              {actionError && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#fff1f1",
                    border:
                      "1px solid #ead0d0",
                    color: "#9b2c2c",
                    fontSize: "13px",
                  }}
                >
                  {actionError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "9px",
                  marginTop: "21px",
                }}
              >
                <button
                  onClick={
                    closeLeaderAction
                  }
                  disabled={actionSaving}
                  style={{
                    flex: 1,
                    padding: "13px",
                    border:
                      "1px solid #d7ddd9",
                    borderRadius: "11px",
                    background: "white",
                    color: "#555",
                    fontWeight: "bold",
                    cursor: actionSaving
                      ? "default"
                      : "pointer",
                  }}
                >
                  Avbryt
                </button>

                <button
                  onClick={() => {
                    if (
                      leaderAction ===
                      "edit"
                    ) {
                      void saveLeaderChanges()
                    }

                    if (
                      leaderAction ===
                      "pin"
                    ) {
                      void saveNewPin()
                    }

                    if (
                      leaderAction ===
                      "delete"
                    ) {
                      void deleteLeader()
                    }
                  }}
                  disabled={actionSaving}
                  style={{
                    flex: 1,
                    padding: "13px",
                    border: "none",
                    borderRadius: "11px",
                    background:
                      actionSaving
                        ? "#7b8b83"
                        : leaderAction ===
                            "delete"
                          ? "#9b2c2c"
                          : "#123b2a",
                    color: "white",
                    fontWeight: "bold",
                    cursor: actionSaving
                      ? "default"
                      : "pointer",
                  }}
                >
                  {actionSaving
                    ? "Sparar..."
                    : leaderAction ===
                        "edit"
                      ? "Spara"
                      : leaderAction ===
                          "pin"
                        ? "Byt PIN"
                        : "Ja, ta bort"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageLeaders
