import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { buildTable, nextMatchForClub, simulateMatchday } from "../domain/league";
import type { Club, GameState } from "../domain/types";
import { createInitialState, loadGameState, resetGameState, saveGameState } from "../db/gameDb";

const clubName = (clubs: Club[], id: string) => clubs.find((club) => club.id === id)?.name ?? id;

function ClubSelect({
  state,
  onSelect
}: {
  state: GameState;
  onSelect: (clubId: string) => void;
}) {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Phase 1</p>
          <h1>BuLi Simulator</h1>
          <p>Waehle einen Demo-Verein und spiele die ersten simulierten Spieltage.</p>
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

function Dashboard({
  state,
  onPlayMatchday,
  onReset
}: {
  state: GameState;
  onPlayMatchday: () => void;
  onReset: () => void;
}) {
  const selectedClub = state.clubs.find((club) => club.id === state.selectedClubId);
  const table = useMemo(() => buildTable(state.clubs, state.matches), [state.clubs, state.matches]);

  if (!selectedClub) {
    return <Navigate to="/clubs" replace />;
  }

  const selectedRow = table.find((row) => row.clubId === selectedClub.id);
  const nextMatch = nextMatchForClub(state, selectedClub.id);
  const canPlay = state.matches.some((match) => match.matchday === state.currentMatchday && !match.played);

  return (
    <main className="page">
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">Spieltag {Math.min(state.currentMatchday, 3)} von 3</p>
          <h1>{selectedClub.name}</h1>
          <p>{state.lastMessage}</p>
        </div>
        <div className="actions">
          <button onClick={onPlayMatchday} disabled={!canPlay}>
            Spieltag simulieren
          </button>
          <button className="secondary" onClick={onReset}>
            Neu starten
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Vereinswerte">
        <article>
          <span>Budget</span>
          <strong>{selectedClub.budget.toFixed(1)} Mio.</strong>
        </article>
        <article>
          <span>Moral</span>
          <strong>{selectedClub.morale}</strong>
        </article>
        <article>
          <span>Fans</span>
          <strong>{selectedClub.fanMood}</strong>
        </article>
        <article>
          <span>Platz</span>
          <strong>{selectedRow ? table.indexOf(selectedRow) + 1 : "-"}</strong>
        </article>
      </section>

      <section className="split">
        <article className="panel">
          <h2>Naechstes Spiel</h2>
          {nextMatch ? (
            <p>
              Spieltag {nextMatch.matchday}: {clubName(state.clubs, nextMatch.homeId)} gegen{" "}
              {clubName(state.clubs, nextMatch.awayId)}
            </p>
          ) : (
            <p>Alle Demo-Spiele sind absolviert.</p>
          )}
        </article>

        <article className="panel">
          <h2>Letzte Ergebnisse</h2>
          <ul className="results">
            {state.matches
              .filter((match) => match.played)
              .slice(-4)
              .map((match) => (
                <li key={match.id}>
                  <span>{clubName(state.clubs, match.homeId)}</span>
                  <strong>
                    {match.homeGoals}:{match.awayGoals}
                  </strong>
                  <span>{clubName(state.clubs, match.awayId)}</span>
                </li>
              ))}
          </ul>
        </article>
      </section>

      <section className="panel table-panel">
        <h2>Tabelle</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pl.</th>
                <th>Club</th>
                <th>Sp.</th>
                <th>Diff.</th>
                <th>Pts.</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, index) => (
                <tr key={row.clubId} className={row.clubId === selectedClub.id ? "selected-row" : ""}>
                  <td>{index + 1}</td>
                  <td>{clubName(state.clubs, row.clubId)}</td>
                  <td>{row.played}</td>
                  <td>{row.goalDifference}</td>
                  <td>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      setState(savedState);
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
      lastMessage: "Der Vorstand erwartet einen mutigen Saisonstart.",
      updatedAt: new Date().toISOString()
    });
    navigate("/");
  };

  const playMatchday = async () => {
    await persist(simulateMatchday(state));
  };

  const reset = async () => {
    const resetState = await resetGameState();
    setState(resetState);
    navigate("/clubs");
  };

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
          <Link to="/">Dashboard</Link>
          <Link to="/clubs">Vereine</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard state={state} onPlayMatchday={playMatchday} onReset={reset} />} />
        <Route path="/clubs" element={<ClubSelect state={state} onSelect={selectClub} />} />
      </Routes>
    </>
  );
}
