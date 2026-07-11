import { Dice5 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  canCompleteCurrentMatchday,
  completeCurrentMatchday,
  currentMatchdayMatches,
  findPlayerName,
  formatPlayerName,
  generateRandomMatch,
  hasResult,
  matchesForMatchday,
  matchdaysList,
  playersForClub,
  recalculateStats,
  setMatchResult,
  simulateOpenMatchesForCurrentMatchday,
  updateMatchDetails,
  validateMatchConsistency
} from "../domain/league";
import type { Club, GameState, Match, MatchDetails, Nationality, Player, PlayerPosition, TeamSide } from "../domain/types";
import { createInitialState, loadGameState, resetGameState, saveGameState } from "../db/gameDb";

type LeagueId = "bundesliga" | "zweite";

const leagueLabels: Record<LeagueId, string> = {
  bundesliga: "1. Bundesliga",
  zweite: "2. Bundesliga"
};

const clubName = (clubs: Club[], id: string) => clubs.find((club) => club.id === id)?.name ?? id;
const resultLabel = (match: Match) => (hasResult(match) ? `${match.homeGoals}:${match.awayGoals}` : "-:-");

const flagEmoji = (isoCode: string) => {
  if (!/^[A-Z]{2}$/.test(isoCode)) return "◻";
  return isoCode
    .split("")
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
};

function FlagList({ nationalities }: { nationalities: Nationality[] }) {
  if (!nationalities.length) {
    return (
      <span className="flag" title="Unbekannt" aria-label="Nationalitaet unbekannt">
        ◻
      </span>
    );
  }

  return (
    <span className="flags">
      {nationalities.map((nationality) => (
        <span
          className="flag"
          key={nationality.isoCode}
          title={nationality.countryName}
          aria-label={nationality.countryName}
        >
          {flagEmoji(nationality.isoCode)}
        </span>
      ))}
    </span>
  );
}

function DiceButton({
  children,
  onClick,
  title,
  disabled = false
}: {
  children: string;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button className="dice-button" onClick={onClick} title={title} aria-label={children} disabled={disabled}>
      <Dice5 aria-hidden="true" size={20} />
      <span>{children}</span>
    </button>
  );
}

function Dashboard({ state }: { state: GameState }) {
  const entries = [
    { to: "/tables/bundesliga", label: "Tabelle 1. Bundesliga", value: `${state.clubs.filter((club) => club.league === "bundesliga").length} Vereine` },
    { to: "/tables/zweite", label: "Tabelle 2. Bundesliga", value: `${state.clubs.filter((club) => club.league === "zweite").length} Vereine` },
    { to: `/matchdays/${state.currentMatchday}`, label: "Aktueller Spieltag", value: `Spieltag ${state.currentMatchday}` },
    { to: "/clubs", label: "Vereine", value: `${state.clubs.length} Clubs` },
    { to: "/players", label: "Spieler", value: `${state.players.length} Profis` },
    { to: "/stats/scorers", label: "Torschuetzenliste", value: `${state.playerStats.filter((stat) => stat.goals > 0).length} Torschuetzen` },
    { to: "/stats/scorers", label: "Scorerliste", value: "Tore + Assists" },
    { to: "/stats/form", label: "Formtabelle", value: "Letzte Spiele" },
    { to: "/stats/suspensions", label: "Verletzte und Gesperrte", value: `${state.playerStats.filter((stat) => stat.suspensions > 0).length} Sperren` },
    { to: "/transfers", label: "Transferuebersicht", value: "Demo-Transfers" }
  ];

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Liga-Zentrale</p>
          <h1>BuLi Simulator</h1>
          <p>Bearbeite Spieltage, Tabellen, Vereine, Spieler und Statistiken der gesamten Liga.</p>
        </div>
      </section>
      <section className="dashboard-grid" aria-label="Dashboard-Navigation">
        {entries.map((entry) => (
          <Link className="dashboard-tile" key={entry.label} to={entry.to}>
            <span>{entry.label}</span>
            <strong>{entry.value}</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}

function MatchdaysPage({
  state,
  onComplete,
  onReset,
  onSimulateOpen
}: {
  state: GameState;
  onComplete: () => void;
  onReset: () => void;
  onSimulateOpen: () => void;
}) {
  const { matchday } = useParams();
  const navigate = useNavigate();
  const matchdayNumber = Number(matchday);
  const available = matchdaysList(state);

  if (!Number.isInteger(matchdayNumber) || matchdayNumber < 1) {
    return <Navigate to={`/matchdays/${state.currentMatchday}`} replace />;
  }

  const matches = matchesForMatchday(state, matchdayNumber);
  const isCurrent = matchdayNumber === state.currentMatchday;
  const prevMatchday = [...available].reverse().find((day) => day < matchdayNumber) ?? null;
  const nextMatchday = available.find((day) => day > matchdayNumber) ?? null;

  return (
    <main className="page">
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">{isCurrent ? "Aktueller Spieltag" : "Spieltagsansicht"}</p>
          <h1>Spieltag {matchdayNumber}</h1>
          <p>{isCurrent ? state.lastMessage : "Nur der aktuelle Spieltag kann abgeschlossen werden."}</p>
        </div>
        {isCurrent ? (
          <div className="actions">
            <DiceButton title="Alle offenen Spiele dieses Spieltags simulieren" onClick={onSimulateOpen}>
              Alle Spiele simulieren
            </DiceButton>
            <Link className={`button-link ${canCompleteCurrentMatchday(state) ? "" : "disabled-link"}`} to="/review">
              Kontrolluebersicht
            </Link>
            <button className="secondary" onClick={onReset}>
              Neu starten
            </button>
          </div>
        ) : null}
      </section>

      <nav className="matchday-nav" aria-label="Spieltagsnavigation">
        <button
          type="button"
          onClick={() => prevMatchday && navigate(`/matchdays/${prevMatchday}`)}
          disabled={prevMatchday === null}
        >
          Vorheriger Spieltag
        </button>
        <label>
          Spieltag waehlen
          <select
            value={available.includes(matchdayNumber) ? matchdayNumber : ""}
            onChange={(event) => navigate(`/matchdays/${event.target.value}`)}
          >
            {!available.includes(matchdayNumber) && <option value="">Spieltag {matchdayNumber}</option>}
            {available.map((day) => (
              <option key={day} value={day}>
                Spieltag {day}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => nextMatchday && navigate(`/matchdays/${nextMatchday}`)}
          disabled={nextMatchday === null}
        >
          Naechster Spieltag
        </button>
      </nav>

      <section className="match-list" aria-label={`Partien des Spieltags ${matchdayNumber}`}>
        {matches.length === 0 && <p>Fuer diesen Spieltag liegen noch keine Partien vor.</p>}
        {matches.map((match) => (
          <article className="match-card" key={match.id}>
            <div>
              <p className="eyebrow">{match.status}</p>
              <h2>
                {clubName(state.clubs, match.homeId)} <span>{resultLabel(match)}</span> {clubName(state.clubs, match.awayId)}
              </h2>
              <p>{match.details ? `${match.details.goals.length} Tore, ${match.details.cards.length} Karten` : "Noch kein Spielschema"}</p>
            </div>
            <Link className="button-link" to={`/matches/${match.id}`}>
              Spiel bearbeiten
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function LeagueTablePage({ state }: { state: GameState }) {
  const { leagueId } = useParams();
  const league = leagueId === "zweite" ? "zweite" : "bundesliga";
  const clubIds = new Set(state.clubs.filter((club) => club.league === league).map((club) => club.id));
  const rows = state.table.filter((row) => clubIds.has(row.clubId));

  return (
    <main className="page">
      <section className="page-head">
        <p className="eyebrow">Tabellenansicht</p>
        <h1>{leagueLabels[league]}</h1>
      </section>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pl.</th>
                <th>Verein</th>
                <th>Sp.</th>
                <th>S</th>
                <th>U</th>
                <th>N</th>
                <th>Tore</th>
                <th>GT</th>
                <th>Diff.</th>
                <th>Pts.</th>
                <th>Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.clubId} className={index === 0 ? "zone-title" : index >= rows.length - 1 ? "zone-danger" : ""}>
                  <td>{index + 1}</td>
                  <td>
                    <Link to={`/clubs/${row.clubId}`}>{clubName(state.clubs, row.clubId)}</Link>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference}</td>
                  <td>{row.points}</td>
                  <td>{row.form.join(" ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ClubsPage({ state }: { state: GameState }) {
  return (
    <main className="page">
      <section className="page-head">
        <p className="eyebrow">Vereinsuebersicht</p>
        <h1>Alle Vereine</h1>
      </section>
      {(["bundesliga", "zweite"] as LeagueId[]).map((league) => (
        <section className="panel" key={league}>
          <h2>{leagueLabels[league]}</h2>
          <div className="club-grid">
            {state.clubs
              .filter((club) => club.league === league)
              .map((club) => {
                const row = state.table.find((item) => item.clubId === club.id);
                return (
                  <Link className="club-card link-card" key={club.id} to={`/clubs/${club.id}`}>
                    <span className="club-badge" style={{ background: club.colors.primary, color: club.colors.secondary }}>
                      {club.shortName}
                    </span>
                    <strong>{club.name}</strong>
                    <span>{leagueLabels[club.league]}</span>
                    <span>Platz {row ? state.table.filter((item) => state.clubs.find((c) => c.id === item.clubId)?.league === club.league).indexOf(row) + 1 : "-"}</span>
                    <span>Staerke {club.strength}</span>
                    <span>Form {row?.form.join(" ") || "-"}</span>
                    <span>Kader {playersForClub(state.players, club.id).length}</span>
                    <span>Trainer {club.trainer}</span>
                    <span>Marktwert {club.squadMarketValue} Mio.</span>
                    <span>Budget {club.budget} Mio.</span>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </main>
  );
}

function ClubDetailPage({ state }: { state: GameState }) {
  const { clubId } = useParams();
  const club = state.clubs.find((item) => item.id === clubId);
  if (!club) return <Navigate to="/clubs" replace />;

  const squad = playersForClub(state.players, club.id);
  const row = state.table.find((item) => item.clubId === club.id);
  const matches = state.matches.filter((match) => match.homeId === club.id || match.awayId === club.id);
  const lastMatch = [...matches].reverse().find((match) => match.status === "abgeschlossen");
  const nextMatch = matches.find((match) => match.status !== "abgeschlossen");
  const homePlayed = matches.filter((match) => match.homeId === club.id && match.status === "abgeschlossen");
  const awayPlayed = matches.filter((match) => match.awayId === club.id && match.status === "abgeschlossen");

  return (
    <main className="page">
      <section className="dashboard-head compact-head">
        <div>
          <p className="eyebrow">{leagueLabels[club.league]}</p>
          <h1>{club.name}</h1>
          <p>{club.city} · Trainer {club.trainer} · Manager {club.manager}</p>
        </div>
      </section>
      <section className="metric-grid">
        <article><span>Tabellenplatz</span><strong>{row ? state.table.filter((item) => state.clubs.find((c) => c.id === item.clubId)?.league === club.league).indexOf(row) + 1 : "-"}</strong></article>
        <article><span>Torverhaeltnis</span><strong>{row?.goalsFor ?? 0}:{row?.goalsAgainst ?? 0}</strong></article>
        <article><span>Heimbilanz</span><strong>{homePlayed.length} Spiele</strong></article>
        <article><span>Auswaertsbilanz</span><strong>{awayPlayed.length} Spiele</strong></article>
      </section>
      <section className="split">
        <article className="panel">
          <h2>Vereinsdaten</h2>
          <p>Staerke {club.strength}, Budget {club.budget} Mio., Marktwert {club.squadMarketValue} Mio.</p>
          <p>Letzte Partie: {lastMatch ? `${clubName(state.clubs, lastMatch.homeId)} ${resultLabel(lastMatch)} ${clubName(state.clubs, lastMatch.awayId)}` : "-"}</p>
          <p>Naechste Partie: {nextMatch ? `${clubName(state.clubs, nextMatch.homeId)} gegen ${clubName(state.clubs, nextMatch.awayId)}` : "-"}</p>
          <p>Transfers: Demo-Transferfenster vorbereitet.</p>
          <p>Verletzte: keine Demo-Verletzungen.</p>
          <p>Gesperrte: {state.playerStats.filter((stat) => stat.clubId === club.id && stat.suspensions > 0).length}</p>
        </article>
        <article className="panel">
          <h2>Saisonspiele</h2>
          <ul className="stat-list">
            {matches.map((match) => (
              <li key={match.id}>
                <Link to={`/matches/${match.id}`}>{clubName(state.clubs, match.homeId)} - {clubName(state.clubs, match.awayId)}</Link>
                <strong>{resultLabel(match)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section className="panel">
        <h2>Kader</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              {squad.map((player) => (
                <tr key={player.id}>
                  <td><Link to={`/players/${player.id}`}>{formatPlayerName(player)}</Link></td>
                  <td><FlagList nationalities={player.nationalities} /></td>
                  <td>{player.position}</td>
                  <td>{player.rating}</td>
                  <td>{player.marketValue} Mio.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function PlayersPage({ state }: { state: GameState }) {
  const [league, setLeague] = useState("alle");
  const [clubId, setClubId] = useState("alle");
  const [position, setPosition] = useState("alle");
  const [nationality, setNationality] = useState("alle");
  const [sortKey, setSortKey] = useState("rating");

  const nationalities = Array.from(new Map(state.players.flatMap((player) => player.nationalities).map((item) => [item.isoCode, item])).values());
  const filtered = [...state.players]
    .filter((player) => league === "alle" || state.clubs.find((club) => club.id === player.clubId)?.league === league)
    .filter((player) => clubId === "alle" || player.clubId === clubId)
    .filter((player) => position === "alle" || player.position === position)
    .filter((player) => nationality === "alle" || player.nationalities.some((item) => item.isoCode === nationality))
    .sort((a, b) => {
      if (sortKey === "marketValue") return b.marketValue - a.marketValue;
      if (sortKey === "form") return b.form - a.form;
      if (sortKey === "age") return a.age - b.age;
      return b.rating - a.rating;
    });

  return (
    <main className="page">
      <section className="page-head">
        <p className="eyebrow">Spielerliste</p>
        <h1>Alle Spieler</h1>
      </section>
      <section className="panel filters">
        <label>Liga<select value={league} onChange={(event) => setLeague(event.target.value)}><option value="alle">Alle</option><option value="bundesliga">1. Bundesliga</option><option value="zweite">2. Bundesliga</option></select></label>
        <label>Verein<select value={clubId} onChange={(event) => setClubId(event.target.value)}><option value="alle">Alle</option>{state.clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
        <label>Position<select value={position} onChange={(event) => setPosition(event.target.value)}><option value="alle">Alle</option>{(["TW", "ABW", "MIT", "ST"] as PlayerPosition[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Nationalitaet<select value={nationality} onChange={(event) => setNationality(event.target.value)}><option value="alle">Alle</option>{nationalities.map((item) => <option key={item.isoCode} value={item.isoCode}>{item.countryName}</option>)}</select></label>
        <label>Sortierung<select value={sortKey} onChange={(event) => setSortKey(event.target.value)}><option value="rating">Staerke</option><option value="form">Form</option><option value="marketValue">Marktwert</option><option value="age">Alter</option></select></label>
      </section>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Flagge</th><th>Alter</th><th>Verein</th><th>Pos.</th><th>Staerke</th><th>Form</th><th>Fitness</th><th>Marktwert</th><th>Sp.</th><th>T</th><th>A</th><th>Note</th></tr></thead>
            <tbody>
              {filtered.map((player) => {
                const stat = state.playerStats.find((item) => item.playerId === player.id);
                return (
                  <tr key={player.id}>
                    <td><Link to={`/players/${player.id}`}>{formatPlayerName(player)}</Link></td>
                    <td><FlagList nationalities={player.nationalities} /></td>
                    <td>{player.age}</td>
                    <td><Link to={`/clubs/${player.clubId}`}>{clubName(state.clubs, player.clubId)}</Link></td>
                    <td>{player.position}</td>
                    <td>{player.rating}</td>
                    <td>{player.form}</td>
                    <td>{player.fitness}</td>
                    <td>{player.marketValue} Mio.</td>
                    <td>{stat?.appearances ?? 0}</td>
                    <td>{stat?.goals ?? 0}</td>
                    <td>{stat?.assists ?? 0}</td>
                    <td>{stat?.averageRating || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function PlayerDetailPage({ state }: { state: GameState }) {
  const { playerId } = useParams();
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return <Navigate to="/players" replace />;
  const stat = state.playerStats.find((item) => item.playerId === player.id);
  const club = state.clubs.find((item) => item.id === player.clubId);

  return (
    <main className="page">
      <section className="dashboard-head compact-head">
        <div>
          <p className="eyebrow">{club ? leagueLabels[club.league] : "Spieler"}</p>
          <h1>{formatPlayerName(player)}</h1>
          <p><FlagList nationalities={player.nationalities} /> · {club?.name} · Rueckennummer {player.shirtNumber}</p>
        </div>
      </section>
      <section className="metric-grid">
        <article><span>Staerke</span><strong>{player.rating}</strong></article>
        <article><span>Form</span><strong>{player.form}</strong></article>
        <article><span>Fitness</span><strong>{player.fitness}</strong></article>
        <article><span>Marktwert</span><strong>{player.marketValue} Mio.</strong></article>
      </section>
      <section className="split">
        <article className="panel">
          <h2>Spielerdaten</h2>
          <p>Geburtsdatum {player.birthDate}, Alter {player.age}</p>
          <p>Position {player.position}, Nebenpositionen {player.secondaryPositions.join(", ") || "-"}</p>
          <p>Moral {player.morale}, Vertrag bis {player.contractUntil}</p>
          <p>Bisherige Vereine: {player.previousClubs.join(", ")}</p>
          <p>Nationalmannschaft: {player.nationalTeamCaps} Einsaetze</p>
        </article>
        <article className="panel">
          <h2>Statistik</h2>
          <p>Bundesliga-/Zweitligastatistik nach Liga des Vereins.</p>
          <p>Einsaetze {stat?.appearances ?? 0}, Tore {stat?.goals ?? 0}, Assists {stat?.assists ?? 0}</p>
          <p>Karten: Gelb {stat?.yellowCards ?? 0}, Gelb-Rot {stat?.secondYellowCards ?? 0}, Rot {stat?.redCards ?? 0}</p>
          <p>Notenschnitt {stat?.averageRating || "-"}, Sperren {stat?.suspensions ?? 0}</p>
          <p>Marktwertentwicklung und Formentwicklung: Demo-Zeitreihe aus aktuellen Werten.</p>
          <p>Transferhistorie: {`${player.previousClubs.join(" -> ")} -> ${club?.name ?? ""}`}</p>
        </article>
      </section>
    </main>
  );
}

function StatsPage({ state, kind }: { state: GameState; kind: "scorers" | "form" | "suspensions" }) {
  const rows = [...state.playerStats].sort((a, b) => {
    if (kind === "form") return b.averageRating - a.averageRating;
    if (kind === "suspensions") return b.suspensions - a.suspensions;
    return b.goals + b.assists - (a.goals + a.assists);
  });
  const title = kind === "form" ? "Formtabelle" : kind === "suspensions" ? "Verletzte und Gesperrte" : "Torschuetzen- und Scorerliste";

  return (
    <main className="page">
      <section className="page-head"><p className="eyebrow">Statistiken</p><h1>{title}</h1></section>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Spieler</th><th>Verein</th><th>Tore</th><th>Assists</th><th>Sperren</th><th>Note</th></tr></thead>
            <tbody>{rows.slice(0, 30).map((stat) => <tr key={stat.playerId}><td><Link to={`/players/${stat.playerId}`}>{findPlayerName(state.players, stat.playerId)}</Link></td><td>{clubName(state.clubs, stat.clubId)}</td><td>{stat.goals}</td><td>{stat.assists}</td><td>{stat.suspensions}</td><td>{stat.averageRating || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
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

  if (!match) return <Navigate to={`/matchdays/${state.currentMatchday}`} replace />;

  const homePlayers = playersForClub(state.players, match.homeId);
  const awayPlayers = playersForClub(state.players, match.awayId);
  const errors = validateMatchConsistency(match);
  const updateGoal = (goalId: string, patch: Partial<MatchDetails["goals"][number]>) => match.details && onDetailsChange(match.id, { ...match.details, goals: match.details.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)) });
  const updateCard = (cardId: string, patch: Partial<MatchDetails["cards"][number]>) => match.details && onDetailsChange(match.id, { ...match.details, cards: match.details.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)) });
  const updateSub = (subId: string, patch: Partial<MatchDetails["substitutions"][number]>) => match.details && onDetailsChange(match.id, { ...match.details, substitutions: match.details.substitutions.map((sub) => (sub.id === subId ? { ...sub, ...patch } : sub)) });

  return (
    <main className="page">
      <section className="dashboard-head compact-head">
        <div><p className="eyebrow">Spiel bearbeiten</p><h1>{clubName(state.clubs, match.homeId)} {resultLabel(match)} {clubName(state.clubs, match.awayId)}</h1><p>Status: {match.status}</p></div>
        <Link className="button-link secondary-link" to={`/matchdays/${match.matchday}`}>Zurueck</Link>
      </section>
      <section className="panel result-editor">
        <h2>Ergebnis</h2>
        <div className="form-row">
          <label>Heimtore<input min="0" type="number" value={homeGoals} onChange={(event) => setHomeGoals(Number(event.target.value))} /></label>
          <label>Auswaertstore<input min="0" type="number" value={awayGoals} onChange={(event) => setAwayGoals(Number(event.target.value))} /></label>
          <button onClick={() => onSetResult(match.id, homeGoals, awayGoals)}>Ergebnis speichern</button>
          <DiceButton title="Einzelnes Spiel zufaellig simulieren" onClick={() => onRandom(match.id)}>Spiel simulieren</DiceButton>
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
          <section className="panel"><h2>Torschuetzen und Vorlagen</h2><div className="edit-grid">{match.details.goals.map((goal) => {
            const sidePlayers = goal.team === "home" ? homePlayers : awayPlayers;
            return <div className="edit-card" key={goal.id}><label>Minute<input type="number" min="1" max="90" value={goal.minute} onChange={(event) => updateGoal(goal.id, { minute: Number(event.target.value) })} /></label><label>Team<select value={goal.team} onChange={(event) => updateGoal(goal.id, { team: event.target.value as TeamSide })}><option value="home">Heim</option><option value="away">Auswaerts</option></select></label><PlayerPicker label="Torschuetze" value={goal.scorerId} players={sidePlayers} onChange={(value) => updateGoal(goal.id, { scorerId: value })} /><PlayerPicker label="Vorlage" value={goal.assistId ?? sidePlayers[0].id} players={sidePlayers} onChange={(value) => updateGoal(goal.id, { assistId: value })} /></div>;
          })}</div></section>
          <section className="panel"><h2>Wechsel</h2><div className="edit-grid">{match.details.substitutions.map((sub) => {
            const sidePlayers = sub.team === "home" ? homePlayers : awayPlayers;
            return <div className="edit-card" key={sub.id}><label>Minute<input type="number" min="1" max="90" value={sub.minute} onChange={(event) => updateSub(sub.id, { minute: Number(event.target.value) })} /></label><PlayerPicker label="Aus" value={sub.playerOutId} players={sidePlayers} onChange={(value) => updateSub(sub.id, { playerOutId: value })} /><PlayerPicker label="Ein" value={sub.playerInId} players={sidePlayers} onChange={(value) => updateSub(sub.id, { playerInId: value })} /></div>;
          })}</div></section>
          <section className="panel"><h2>Karten und Noten</h2><div className="edit-grid">{match.details.cards.map((card) => {
            const sidePlayers = card.team === "home" ? homePlayers : awayPlayers;
            return <div className="edit-card" key={card.id}><label>Minute<input type="number" min="1" max="90" value={card.minute} onChange={(event) => updateCard(card.id, { minute: Number(event.target.value) })} /></label><PlayerPicker label="Spieler" value={card.playerId} players={sidePlayers} onChange={(value) => updateCard(card.id, { playerId: value })} /><label>Karte<select value={card.type} onChange={(event) => updateCard(card.id, { type: event.target.value as "gelb" | "gelb-rot" | "rot" })}><option value="gelb">Gelb</option><option value="gelb-rot">Gelb-Rot</option><option value="rot">Rot</option></select></label></div>;
          })}</div><div className="ratings-grid">{[...match.details.homeLineup, ...match.details.awayLineup].map((playerId) => <label key={playerId}>{findPlayerName(state.players, playerId)}<input type="number" step="0.1" min="1" max="6" value={match.details?.ratings[playerId] ?? 3.5} onChange={(event) => match.details && onDetailsChange(match.id, { ...match.details, ratings: { ...match.details.ratings, [playerId]: Number(event.target.value) } })} /></label>)}</div></section>
          <section className={`panel ${errors.length ? "warning-panel" : "ok-panel"}`}><h2>Konsistenz</h2>{errors.length ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>Spielschema ist logisch konsistent.</p>}</section>
        </>
      ) : <section className="panel"><h2>Noch kein Spielschema</h2><p>Speichere ein Ergebnis oder erzeuge ein Zufallsergebnis.</p></section>}
    </main>
  );
}

function PlayerPicker({ label, value, players, onChange }: { label: string; value: string; players: Player[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{players.map((player) => <option key={player.id} value={player.id}>{formatPlayerName(player)}</option>)}</select></label>;
}

function TeamSheet({ title, playerIds, players }: { title: string; playerIds: string[]; players: Player[] }) {
  return <article className="panel"><h2>{title}</h2><ol className="player-list">{playerIds.map((playerId) => <li key={playerId}>{findPlayerName(players, playerId)}</li>)}</ol></article>;
}

function Review({ state, onComplete }: { state: GameState; onComplete: () => void }) {
  const matches = currentMatchdayMatches(state);
  return <main className="page"><section className="dashboard-head compact-head"><div><p className="eyebrow">Kontrolluebersicht</p><h1>Spieltag {state.currentMatchday}</h1><p>Der Spieltag kann erst abgeschlossen werden, wenn fuer jede Partie ein Ergebnis vorliegt.</p></div><button onClick={onComplete} disabled={!canCompleteCurrentMatchday(state)}>Spieltag abschliessen</button></section><section className="match-list">{matches.map((match) => <article className="match-card" key={match.id}><div><p className="eyebrow">{match.status}</p><h2>{clubName(state.clubs, match.homeId)} <span>{resultLabel(match)}</span> {clubName(state.clubs, match.awayId)}</h2><p>{validateMatchConsistency(match).length ? "Konsistenzhinweise vorhanden" : "bereit"}</p></div><Link className="button-link" to={`/matches/${match.id}`}>Spiel bearbeiten</Link></article>)}</section></main>;
}

export function App() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    void loadGameState().then((savedState) => {
      setState(recalculateStats(savedState));
      setIsLoading(false);
    });
  }, []);

  const persist = async (nextState: GameState) => {
    setState(nextState);
    await saveGameState(nextState);
  };

  const setResult = async (matchId: string, homeGoals: number, awayGoals: number) => persist(setMatchResult(state, matchId, homeGoals, awayGoals));
  const random = async (matchId: string) => persist(generateRandomMatch(state, matchId));
  const changeDetails = async (matchId: string, details: MatchDetails) => persist(updateMatchDetails(state, matchId, details));
  const complete = async () => {
    await persist(completeCurrentMatchday(state));
    navigate("/matchdays");
  };
  const reset = async () => {
    const resetState = await resetGameState();
    setState(resetState);
    navigate("/");
  };
  const simulateOpen = async () => {
    const prepared = currentMatchdayMatches(state).some((match) => match.status === "vorbereitet");
    if (prepared && !window.confirm("Es gibt bereits vorbereitete Spiele. Nur offene Spiele werden simuliert; fortfahren?")) return;
    await persist(simulateOpenMatchesForCurrentMatchday(state));
  };

  if (isLoading) return <main className="page loading">Lade Ligadaten...</main>;

  return (
    <>
      <header className="app-shell">
        <Link to="/" className="brand">BuLi Simulator</Link>
        <nav aria-label="Hauptnavigation">
          <Link to="/">Dashboard</Link>
          <Link to="/matchdays">Spieltage</Link>
          <Link to="/tables/bundesliga">Tabellen</Link>
          <Link to="/clubs">Vereine</Link>
          <Link to="/players">Spieler</Link>
          <Link to="/stats/scorers">Statistiken</Link>
          <Link to="/transfers">Transfers</Link>
          <Link to="/national-teams">Nationalmannschaften</Link>
          <Link to="/history">Historie</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard state={state} />} />
        <Route path="/matchdays" element={<Navigate to={`/matchdays/${state.currentMatchday}`} replace />} />
        <Route path="/matchdays/:matchday" element={<MatchdaysPage state={state} onComplete={complete} onReset={reset} onSimulateOpen={simulateOpen} />} />
        <Route path="/tables/:leagueId" element={<LeagueTablePage state={state} />} />
        <Route path="/clubs" element={<ClubsPage state={state} />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage state={state} />} />
        <Route path="/players" element={<PlayersPage state={state} />} />
        <Route path="/players/:playerId" element={<PlayerDetailPage state={state} />} />
        <Route path="/matches/:matchId" element={<MatchDetail state={state} onSetResult={setResult} onRandom={random} onDetailsChange={changeDetails} />} />
        <Route path="/review" element={<Review state={state} onComplete={complete} />} />
        <Route path="/stats/scorers" element={<StatsPage state={state} kind="scorers" />} />
        <Route path="/stats/form" element={<StatsPage state={state} kind="form" />} />
        <Route path="/stats/suspensions" element={<StatsPage state={state} kind="suspensions" />} />
        <Route path="/transfers" element={<main className="page"><section className="page-head"><p className="eyebrow">Transfers</p><h1>Transferuebersicht</h1><p>Demo-Transferuebersicht fuer kommende Ausbaustufen.</p></section></main>} />
        <Route path="/national-teams" element={<main className="page"><section className="page-head"><p className="eyebrow">Nationalmannschaften</p><h1>Nationalmannschaftsdaten</h1><p>Caps und Nationalitaeten sind in den Spielerdetails sichtbar.</p></section></main>} />
        <Route path="/history" element={<main className="page"><section className="page-head"><p className="eyebrow">Historie</p><h1>Saisonhistorie</h1><p>Historische Wettbewerbe werden in einer spaeteren Phase ausgebaut.</p></section></main>} />
      </Routes>
    </>
  );
}
