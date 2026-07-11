import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  canCompleteCurrentMatchday,
  completeCurrentMatchday,
  currentMatchdayMatches,
  generateRandomMatch,
  hasResult,
  playersForClub,
  recalculateStats,
  setMatchResult,
  updateMatchDetails,
  validateMatchConsistency
} from "../domain/league";
import type { Club, GameState, Match, MatchDetails, Player, TeamSide } from "../domain/types";
import { createInitialState, loadGameState, resetGameState, saveGameState } from "../db/gameDb";

const clubName = (clubs: Club[], id: string) => clubs.find((club) => club.id === id)?.name ?? id;
const playerName = (players: Player[], id: string) => players.find((player) => player.id === id)?.name ?? id;

const resultLabel = (match: Match) => (hasResult(match) ? `${match.homeGoals}:${match.awayGoals}` : "-:-");

function ClubSelect({ state, onSelect }: { state: GameState; onSelect: (clubId: string) => void }) {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Spieltagweise Simulation</p>
          <h1>BuLi Simulator</h1>
          <p>Waehle einen Demo-Verein und bearbeite jedes Spiel des aktuellen Spieltags einzeln.</p>
        </div>
      </section>

      <section className="club-grid" aria-label="Vereinsauswahl">
        {state.clubs.map((club) => (
          <button
            className="club-card"
            key={club.id}
            onClick={() => onSelect(club.id)}
            style={{ borderColor: club.colors.primary }}
          >
            <span className="club-badge" style={{ background: club.colors.primary, color: club.colors.secondary }}>
              {club.shortName}
            </span>
            <strong>{club.name}</strong>
            <span>{club.city}</span>
            <span>Staerke {club.strength}</span>
          </button>
        ))}
      </section>
    </main>
  );
}

function MatchdayOverview({
  state,
  onComplete,
  onReset
}: {
  state: GameState;
  onComplete: () => void;
  onReset: () => void;
}) {
  const selectedClub = state.clubs.find((club) => club.id === state.selectedClubId);
  const matches = currentMatchdayMatches(state);

  if (!selectedClub) {
    return <Navigate to="/clubs" replace />;
  }

  return (
    <main className="page">
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">Aktueller Spieltag</p>
          <h1>Spieltag {state.currentMatchday}</h1>
          <p>{state.lastMessage}</p>
        </div>
        <div className="actions">
          <Link className={`button-link ${canCompleteCurrentMatchday(state) ? "" : "disabled-link"}`} to="/review">
            Kontrolluebersicht
          </Link>
          <button className="secondary" onClick={onReset}>
            Neu starten
          </button>
        </div>
      </section>

      <section className="match-list" aria-label="Partien des aktuellen Spieltags">
        {matches.map((match) => (
          <article className="match-card" key={match.id}>
            <div>
              <p className="eyebrow">{match.status}</p>
              <h2>
                {clubName(state.clubs, match.homeId)} <span>{resultLabel(match)}</span>{" "}
                {clubName(state.clubs, match.awayId)}
              </h2>
              <p>
                {match.details ? `${match.details.goals.length} Tore, ${match.details.cards.length} Karten` : "Noch kein Spielschema"}
              </p>
            </div>
            <Link className="button-link" to={`/matches/${match.id}`}>
              Spiel bearbeiten
            </Link>
          </article>
        ))}
      </section>

      <section className="panel table-panel">
        <h2>Tabelle nach abgeschlossenen Spieltagen</h2>
        <LeagueTable state={state} selectedClubId={selectedClub.id} />
      </section>

      <section className="panel">
        <h2>Top-Spielerstatistiken</h2>
        <ul className="stat-list">
          {state.playerStats
            .filter((stat) => stat.goals + stat.assists + stat.redCards + stat.yellowCards > 0)
            .slice(0, 8)
            .map((stat) => (
              <li key={stat.playerId}>
                <span>{playerName(state.players, stat.playerId)}</span>
                <strong>
                  {stat.goals} T / {stat.assists} A / Note {stat.averageRating || "-"}
                </strong>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

function LeagueTable({ state, selectedClubId }: { state: GameState; selectedClubId?: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pl.</th>
            <th>Club</th>
            <th>Sp.</th>
            <th>Diff.</th>
            <th>Pts.</th>
            <th>Form</th>
          </tr>
        </thead>
        <tbody>
          {state.table.map((row, index) => (
            <tr key={row.clubId} className={row.clubId === selectedClubId ? "selected-row" : ""}>
              <td>{index + 1}</td>
              <td>{clubName(state.clubs, row.clubId)}</td>
              <td>{row.played}</td>
              <td>{row.goalDifference}</td>
              <td>{row.points}</td>
              <td>{row.form.join(" ") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerPicker({
  label,
  value,
  players,
  onChange
}: {
  label: string;
  value: string;
  players: Player[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function MatchDetail({
  state,
  onSetResult,
  onRandom,
  onDetailsChange
}: {
  state: GameState;
  onSetResult: (matchId: string, homeGoals: number, awayGoals: number) => void;
  onRandom: (matchId: string) => void;
  onDetailsChange: (matchId: string, details: MatchDetails) => void;
}) {
  const { matchId } = useParams();
  const match = state.matches.find((item) => item.id === matchId);
  const [homeGoals, setHomeGoals] = useState(match?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(match?.awayGoals ?? 0);

  useEffect(() => {
    setHomeGoals(match?.homeGoals ?? 0);
    setAwayGoals(match?.awayGoals ?? 0);
  }, [match?.homeGoals, match?.awayGoals]);

  if (!match) {
    return <Navigate to="/" replace />;
  }

  const homePlayers = playersForClub(state.players, match.homeId);
  const awayPlayers = playersForClub(state.players, match.awayId);
  const errors = validateMatchConsistency(match);

  const updateGoal = (goalId: string, patch: Partial<MatchDetails["goals"][number]>) => {
    if (!match.details) return;
    onDetailsChange(match.id, {
      ...match.details,
      goals: match.details.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal))
    });
  };

  const updateCard = (cardId: string, patch: Partial<MatchDetails["cards"][number]>) => {
    if (!match.details) return;
    onDetailsChange(match.id, {
      ...match.details,
      cards: match.details.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card))
    });
  };

  const updateSub = (subId: string, patch: Partial<MatchDetails["substitutions"][number]>) => {
    if (!match.details) return;
    onDetailsChange(match.id, {
      ...match.details,
      substitutions: match.details.substitutions.map((sub) => (sub.id === subId ? { ...sub, ...patch } : sub))
    });
  };

  return (
    <main className="page">
      <section className="dashboard-head compact-head">
        <div>
          <p className="eyebrow">Spiel bearbeiten</p>
          <h1>
            {clubName(state.clubs, match.homeId)} {resultLabel(match)} {clubName(state.clubs, match.awayId)}
          </h1>
          <p>Status: {match.status}</p>
        </div>
        <Link className="button-link secondary-link" to="/">
          Zurueck
        </Link>
      </section>

      <section className="panel result-editor">
        <h2>Ergebnis</h2>
        <div className="form-row">
          <label>
            Heimtore
            <input min="0" type="number" value={homeGoals} onChange={(event) => setHomeGoals(Number(event.target.value))} />
          </label>
          <label>
            Auswaertstore
            <input min="0" type="number" value={awayGoals} onChange={(event) => setAwayGoals(Number(event.target.value))} />
          </label>
          <button onClick={() => onSetResult(match.id, homeGoals, awayGoals)}>Ergebnis speichern</button>
          <button className="secondary" onClick={() => onRandom(match.id)}>
            Zufallsergebnis
          </button>
        </div>
      </section>

      {match.details ? (
        <>
          <section className="split">
            <TeamSheet title="Heimaufstellung" playerIds={match.details.homeLineup} players={state.players} />
            <TeamSheet title="Auswaertsaufstellung" playerIds={match.details.awayLineup} players={state.players} />
            <TeamSheet title="Heim-Ersatzbank" playerIds={match.details.homeBench} players={state.players} />
            <TeamSheet title="Auswaerts-Ersatzbank" playerIds={match.details.awayBench} players={state.players} />
          </section>

          <section className="panel">
            <h2>Torschuetzen und Vorlagen</h2>
            <div className="edit-grid">
              {match.details.goals.map((goal) => {
                const sidePlayers = goal.team === "home" ? homePlayers : awayPlayers;
                return (
                  <div className="edit-card" key={goal.id}>
                    <label>
                      Minute
                      <input type="number" min="1" max="90" value={goal.minute} onChange={(event) => updateGoal(goal.id, { minute: Number(event.target.value) })} />
                    </label>
                    <label>
                      Team
                      <select value={goal.team} onChange={(event) => updateGoal(goal.id, { team: event.target.value as TeamSide })}>
                        <option value="home">Heim</option>
                        <option value="away">Auswaerts</option>
                      </select>
                    </label>
                    <PlayerPicker label="Torschuetze" value={goal.scorerId} players={sidePlayers} onChange={(value) => updateGoal(goal.id, { scorerId: value })} />
                    <PlayerPicker label="Vorlage" value={goal.assistId ?? sidePlayers[0].id} players={sidePlayers} onChange={(value) => updateGoal(goal.id, { assistId: value })} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>Wechsel</h2>
            <div className="edit-grid">
              {match.details.substitutions.map((sub) => {
                const sidePlayers = sub.team === "home" ? homePlayers : awayPlayers;
                return (
                  <div className="edit-card" key={sub.id}>
                    <label>
                      Minute
                      <input type="number" min="1" max="90" value={sub.minute} onChange={(event) => updateSub(sub.id, { minute: Number(event.target.value) })} />
                    </label>
                    <PlayerPicker label="Aus" value={sub.playerOutId} players={sidePlayers} onChange={(value) => updateSub(sub.id, { playerOutId: value })} />
                    <PlayerPicker label="Ein" value={sub.playerInId} players={sidePlayers} onChange={(value) => updateSub(sub.id, { playerInId: value })} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>Karten und Noten</h2>
            <div className="edit-grid">
              {match.details.cards.map((card) => {
                const sidePlayers = card.team === "home" ? homePlayers : awayPlayers;
                return (
                  <div className="edit-card" key={card.id}>
                    <label>
                      Minute
                      <input type="number" min="1" max="90" value={card.minute} onChange={(event) => updateCard(card.id, { minute: Number(event.target.value) })} />
                    </label>
                    <PlayerPicker label="Spieler" value={card.playerId} players={sidePlayers} onChange={(value) => updateCard(card.id, { playerId: value })} />
                    <label>
                      Karte
                      <select value={card.type} onChange={(event) => updateCard(card.id, { type: event.target.value as "gelb" | "gelb-rot" | "rot" })}>
                        <option value="gelb">Gelb</option>
                        <option value="gelb-rot">Gelb-Rot</option>
                        <option value="rot">Rot</option>
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="ratings-grid">
              {[...match.details.homeLineup, ...match.details.awayLineup].map((playerId) => (
                <label key={playerId}>
                  {playerName(state.players, playerId)}
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="6"
                    value={match.details?.ratings[playerId] ?? 3.5}
                    onChange={(event) =>
                      match.details &&
                      onDetailsChange(match.id, {
                        ...match.details,
                        ratings: { ...match.details.ratings, [playerId]: Number(event.target.value) }
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section className={`panel ${errors.length ? "warning-panel" : "ok-panel"}`}>
            <h2>Konsistenz</h2>
            {errors.length ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>Spielschema ist logisch konsistent.</p>}
          </section>
        </>
      ) : (
        <section className="panel">
          <h2>Noch kein Spielschema</h2>
          <p>Speichere ein Ergebnis oder erzeuge ein Zufallsergebnis.</p>
        </section>
      )}
    </main>
  );
}

function TeamSheet({ title, playerIds, players }: { title: string; playerIds: string[]; players: Player[] }) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <ol className="player-list">
        {playerIds.map((playerId) => (
          <li key={playerId}>{playerName(players, playerId)}</li>
        ))}
      </ol>
    </article>
  );
}

function Review({ state, onComplete }: { state: GameState; onComplete: () => void }) {
  const matches = currentMatchdayMatches(state);
  const canComplete = canCompleteCurrentMatchday(state);

  return (
    <main className="page">
      <section className="dashboard-head compact-head">
        <div>
          <p className="eyebrow">Kontrolluebersicht</p>
          <h1>Spieltag {state.currentMatchday}</h1>
          <p>Der Spieltag kann erst abgeschlossen werden, wenn fuer jede Partie ein Ergebnis vorliegt.</p>
        </div>
        <button onClick={onComplete} disabled={!canComplete}>
          Spieltag abschliessen
        </button>
      </section>

      <section className="match-list">
        {matches.map((match) => {
          const errors = validateMatchConsistency(match);
          return (
            <article className="match-card" key={match.id}>
              <div>
                <p className="eyebrow">{match.status}</p>
                <h2>
                  {clubName(state.clubs, match.homeId)} <span>{resultLabel(match)}</span>{" "}
                  {clubName(state.clubs, match.awayId)}
                </h2>
                <p>{errors.length ? `${errors.length} Konsistenzhinweise` : "bereit"}</p>
              </div>
              <Link className="button-link" to={`/matches/${match.id}`}>
                Spiel bearbeiten
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export function App() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    void loadGameState().then((savedState) => {
      const migrated = recalculateStats({
        ...createInitialState(),
        ...savedState,
        players: savedState.players ?? createInitialState().players
      });
      setState(migrated);
      setIsLoading(false);
    });
  }, []);

  const persist = async (nextState: GameState) => {
    setState(nextState);
    await saveGameState(nextState);
  };

  const selectClub = async (clubId: string) => {
    await persist({
      ...state,
      selectedClubId: clubId,
      lastMessage: "Der Spieltag ist bereit. Bearbeite jede Partie einzeln.",
      updatedAt: new Date().toISOString()
    });
    navigate("/");
  };

  const setResult = async (matchId: string, homeGoals: number, awayGoals: number) => {
    await persist(setMatchResult(state, matchId, homeGoals, awayGoals));
  };

  const random = async (matchId: string) => {
    await persist(generateRandomMatch(state, matchId));
  };

  const changeDetails = async (matchId: string, details: MatchDetails) => {
    await persist(updateMatchDetails(state, matchId, details));
  };

  const complete = async () => {
    await persist(completeCurrentMatchday(state));
    navigate("/");
  };

  const reset = async () => {
    const resetState = await resetGameState();
    setState(resetState);
    navigate("/clubs");
  };

  const selectedClubId = useMemo(() => state.selectedClubId ?? undefined, [state.selectedClubId]);

  if (isLoading) {
    return <main className="page loading">Lade Spielstand...</main>;
  }

  return (
    <>
      <header className="app-shell">
        <Link to="/" className="brand">
          BuLi Simulator
        </Link>
        <nav>
          <Link to="/">Spieltag</Link>
          <Link to="/clubs">Vereine</Link>
          <Link to="/review">Kontrolle</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<MatchdayOverview state={state} onComplete={complete} onReset={reset} />} />
        <Route path="/clubs" element={<ClubSelect state={state} onSelect={selectClub} />} />
        <Route
          path="/matches/:matchId"
          element={<MatchDetail state={state} onSetResult={setResult} onRandom={random} onDetailsChange={changeDetails} />}
        />
        <Route path="/review" element={<Review state={state} onComplete={complete} />} />
        <Route path="/table" element={<main className="page"><LeagueTable state={state} selectedClubId={selectedClubId} /></main>} />
      </Routes>
    </>
  );
}
