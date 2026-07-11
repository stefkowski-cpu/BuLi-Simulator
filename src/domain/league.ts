import type {
  CardEvent,
  Club,
  ClubStat,
  GameState,
  GoalEvent,
  Match,
  MatchDetails,
  Player,
  PlayerStat,
  Substitution,
  TableRow,
  TeamSide
} from "./types";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const emptyRow = (clubId: string): TableRow => ({
  clubId,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  form: []
});

const emptyPlayerStat = (player: Player): PlayerStat => ({
  playerId: player.id,
  clubId: player.clubId,
  appearances: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  secondYellowCards: 0,
  redCards: 0,
  suspensions: 0,
  averageRating: 0,
  form: []
});

const emptyClubStat = (clubId: string): ClubStat => ({
  clubId,
  form: [],
  goalsFor: 0,
  goalsAgainst: 0,
  cards: 0
});

export const hasResult = (match: Match) => match.homeGoals !== undefined && match.awayGoals !== undefined;

export const currentMatchdayMatches = (state: GameState) =>
  state.matches.filter((match) => match.matchday === state.currentMatchday);

export const matchesForMatchday = (state: GameState, matchday: number) =>
  state.matches.filter((match) => match.matchday === matchday);

export const matchdaysList = (state: GameState): number[] =>
  Array.from(new Set(state.matches.map((match) => match.matchday))).sort((a, b) => a - b);

export const canCompleteCurrentMatchday = (state: GameState) =>
  currentMatchdayMatches(state).length > 0 && currentMatchdayMatches(state).every(hasResult);

export const playersForClub = (players: Player[], clubId: string) => players.filter((player) => player.clubId === clubId);

const UNKNOWN_PLAYER_NAME = "Unbekannter Spieler";

// Central place to render a player's display name. Missing/blank first or
// last names are dropped instead of producing "undefined ..." strings.
export const formatPlayerName = (player: Pick<Player, "firstName" | "name"> | undefined | null): string => {
  if (!player) return UNKNOWN_PLAYER_NAME;
  const first = player.firstName?.trim();
  const last = player.name?.trim();
  if (first && last) return `${first} ${last}`;
  return first || last || UNKNOWN_PLAYER_NAME;
};

export const findPlayerName = (players: Player[], playerId: string): string =>
  formatPlayerName(players.find((player) => player.id === playerId));

const seedFor = (text: string) => text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 17);

export const randomResultForMatch = (match: Match, clubs: Club[]) => {
  const home = clubs.find((club) => club.id === match.homeId);
  const away = clubs.find((club) => club.id === match.awayId);
  const seed = seedFor(`${match.id}-${match.homeGoals ?? 0}-${match.awayGoals ?? 0}`);
  const homeEdge = (home?.strength ?? 70) - (away?.strength ?? 70) + 5;
  const awayEdge = (away?.strength ?? 70) - (home?.strength ?? 70);
  const homeGoals = clamp(Math.round(1 + homeEdge / 24 + (seed % 3) - 1), 0, 5);
  const awayGoals = clamp(Math.round(1 + awayEdge / 26 + ((seed + 1) % 3) - 1), 0, 5);

  return { homeGoals, awayGoals };
};

const sortByRating = (players: Player[]) => [...players].sort((a, b) => b.rating - a.rating);

const defaultLineup = (players: Player[]) => sortByRating(players).slice(0, 11).map((player) => player.id);

const defaultBench = (players: Player[], lineup: string[]) =>
  sortByRating(players)
    .filter((player) => !lineup.includes(player.id))
    .slice(0, 3)
    .map((player) => player.id);

const activePlayersAtMinute = (lineup: string[], substitutions: Substitution[], cards: CardEvent[], side: TeamSide, minute: number) => {
  const active = new Set(lineup);

  for (const substitution of substitutions.filter((item) => item.team === side && item.minute <= minute)) {
    active.delete(substitution.playerOutId);
    active.add(substitution.playerInId);
  }

  for (const card of cards.filter((item) => item.team === side && item.minute < minute && (item.type === "rot" || item.type === "gelb-rot"))) {
    active.delete(card.playerId);
  }

  return Array.from(active);
};

const pick = <T,>(items: T[], seed: number) => items[Math.abs(seed) % items.length];

export const generateMatchDetails = (match: Match, players: Player[], homeGoals: number, awayGoals: number): MatchDetails => {
  const homePlayers = playersForClub(players, match.homeId);
  const awayPlayers = playersForClub(players, match.awayId);
  const homeLineup = match.details?.homeLineup.length ? match.details.homeLineup : defaultLineup(homePlayers);
  const awayLineup = match.details?.awayLineup.length ? match.details.awayLineup : defaultLineup(awayPlayers);
  const homeBench = match.details?.homeBench.length ? match.details.homeBench : defaultBench(homePlayers, homeLineup);
  const awayBench = match.details?.awayBench.length ? match.details.awayBench : defaultBench(awayPlayers, awayLineup);
  const seed = seedFor(match.id) + homeGoals * 13 + awayGoals * 19;

  const substitutions: Substitution[] = [
    ...(homeBench[0]
      ? [{ id: `${match.id}-sub-h1`, team: "home" as const, minute: 62, playerOutId: homeLineup[8], playerInId: homeBench[0] }]
      : []),
    ...(awayBench[0]
      ? [{ id: `${match.id}-sub-a1`, team: "away" as const, minute: 68, playerOutId: awayLineup[8], playerInId: awayBench[0] }]
      : [])
  ];

  const cards: CardEvent[] = [
    { id: `${match.id}-yc-h1`, team: "home", minute: 28 + (seed % 12), playerId: homeLineup[3], type: "gelb" },
    { id: `${match.id}-yc-a1`, team: "away", minute: 33 + (seed % 10), playerId: awayLineup[4], type: "gelb" },
    ...(seed % 4 === 0 ? [{ id: `${match.id}-rc-a1`, team: "away" as const, minute: 84, playerId: awayLineup[6], type: "rot" as const }] : [])
  ];

  const buildGoals = (count: number, side: TeamSide): GoalEvent[] =>
    Array.from({ length: count }, (_, index) => {
      const minute = Math.min(88, 12 + index * 21 + ((seed + index) % 8));
      const lineup = side === "home" ? homeLineup : awayLineup;
      const scorers = activePlayersAtMinute(lineup, substitutions, cards, side, minute).filter((id) => !id.endsWith("-p1"));
      const scorerId = pick(scorers, seed + index + (side === "home" ? 2 : 7));
      const assistCandidates = scorers.filter((id) => id !== scorerId);
      return {
        id: `${match.id}-goal-${side}-${index + 1}`,
        team: side,
        minute,
        scorerId,
        assistId: assistCandidates.length ? pick(assistCandidates, seed + index + 11) : undefined
      };
    });

  const goals = [...buildGoals(homeGoals, "home"), ...buildGoals(awayGoals, "away")].sort((a, b) => a.minute - b.minute);
  const ratings = Object.fromEntries(
    [...homeLineup, ...awayLineup, ...homeBench, ...awayBench].map((playerId, index) => [
      playerId,
      clamp(3 + ((seed + index) % 7) / 2, 1, 6)
    ])
  );

  return {
    homeLineup,
    awayLineup,
    homeBench,
    awayBench,
    substitutions,
    goals,
    cards,
    ratings
  };
};

export const validateMatchConsistency = (match: Match): string[] => {
  const errors: string[] = [];

  if (!match.details || !hasResult(match)) {
    return errors;
  }

  const homeGoalCount = match.details.goals.filter((goal) => goal.team === "home").length;
  const awayGoalCount = match.details.goals.filter((goal) => goal.team === "away").length;

  if (homeGoalCount !== match.homeGoals) errors.push("Anzahl der Heimtore passt nicht zum Ergebnis.");
  if (awayGoalCount !== match.awayGoals) errors.push("Anzahl der Auswaertstore passt nicht zum Ergebnis.");

  for (const substitution of match.details.substitutions) {
    const lineup = substitution.team === "home" ? match.details.homeLineup : match.details.awayLineup;
    const bench = substitution.team === "home" ? match.details.homeBench : match.details.awayBench;
    if (!lineup.includes(substitution.playerOutId)) errors.push("Auswechslung enthaelt keinen Startelfspieler.");
    if (!bench.includes(substitution.playerInId)) errors.push("Einwechslung enthaelt keinen Bankspieler.");
    if (substitution.playerInId === substitution.playerOutId) errors.push("Ein- und Auswechslung muessen verschiedene Spieler sein.");
  }

  for (const event of [...match.details.goals, ...match.details.cards]) {
    const side = event.team;
    const lineup = side === "home" ? match.details.homeLineup : match.details.awayLineup;
    const active = activePlayersAtMinute(lineup, match.details.substitutions, match.details.cards, side, event.minute);
    const playerId = "scorerId" in event ? event.scorerId : event.playerId;
    if (!active.includes(playerId)) errors.push(`Spieler ${playerId} steht in Minute ${event.minute} nicht auf dem Platz.`);
    if ("assistId" in event && event.assistId && !active.includes(event.assistId)) {
      errors.push(`Vorlagengeber ${event.assistId} steht in Minute ${event.minute} nicht auf dem Platz.`);
    }
  }

  return errors;
};

export const setMatchResult = (state: GameState, matchId: string, homeGoals: number, awayGoals: number): GameState => {
  const matches = state.matches.map((match) => {
    if (match.id !== matchId) return match;

    const details = generateMatchDetails(match, state.players, homeGoals, awayGoals);
    const status: Match["status"] = match.status === "abgeschlossen" ? "abgeschlossen" : "vorbereitet";
    return {
      ...match,
      homeGoals,
      awayGoals,
      status,
      details
    };
  });

  return recalculateStats({
    ...state,
    matches,
    lastMessage: "Spiel wurde vorbereitet. Das Schema kann jetzt geprueft und bearbeitet werden.",
    updatedAt: new Date().toISOString()
  });
};

export const generateRandomMatch = (state: GameState, matchId: string): GameState => {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return state;
  const result = randomResultForMatch(match, state.clubs);
  return setMatchResult(state, matchId, result.homeGoals, result.awayGoals);
};

export const simulateOpenMatchesForCurrentMatchday = (state: GameState): GameState =>
  currentMatchdayMatches(state)
    .filter((match) => match.status === "offen")
    .reduce((currentState, match) => generateRandomMatch(currentState, match.id), state);

export const updateMatchDetails = (state: GameState, matchId: string, details: MatchDetails): GameState => {
  const matches = state.matches.map((match) => (match.id === matchId ? { ...match, details } : match));
  return recalculateStats({ ...state, matches, updatedAt: new Date().toISOString() });
};

export const completeCurrentMatchday = (state: GameState): GameState => {
  if (!canCompleteCurrentMatchday(state)) {
    return { ...state, lastMessage: "Der Spieltag kann erst mit Ergebnissen fuer alle Spiele abgeschlossen werden." };
  }

  const matches = state.matches.map((match) =>
    match.matchday === state.currentMatchday ? { ...match, status: "abgeschlossen" as const } : match
  );

  return recalculateStats({
    ...state,
    matches,
    currentMatchday: state.currentMatchday + 1,
    lastMessage: "Spieltag abgeschlossen. Tabelle und Statistiken wurden neu berechnet.",
    updatedAt: new Date().toISOString()
  });
};

export const buildTable = (clubs: Club[], matches: Match[]): TableRow[] => {
  const rows = new Map(clubs.map((club) => [club.id, emptyRow(club.id)]));

  for (const match of matches.filter((item) => item.status === "abgeschlossen" && hasResult(item))) {
    const home = rows.get(match.homeId);
    const away = rows.get(match.awayId);
    if (!home || !away || match.homeGoals === undefined || match.awayGoals === undefined) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;
    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
      home.form.push("S");
      away.form.push("N");
    } else if (match.homeGoals < match.awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
      away.form.push("S");
      home.form.push("N");
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push("U");
      away.form.push("U");
    }
  }

  return Array.from(rows.values())
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst, form: row.form.slice(-5) }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.clubId.localeCompare(b.clubId);
    });
};

export const recalculateStats = (state: GameState): GameState => {
  const table = buildTable(state.clubs, state.matches);
  const playerStats = new Map(state.players.map((player) => [player.id, emptyPlayerStat(player)]));
  const clubStats = new Map(state.clubs.map((club) => [club.id, emptyClubStat(club.id)]));

  for (const match of state.matches.filter((item) => item.status === "abgeschlossen" && item.details && hasResult(item))) {
    const homeClub = clubStats.get(match.homeId);
    const awayClub = clubStats.get(match.awayId);
    if (!homeClub || !awayClub || match.homeGoals === undefined || match.awayGoals === undefined || !match.details) continue;

    homeClub.goalsFor += match.homeGoals;
    homeClub.goalsAgainst += match.awayGoals;
    awayClub.goalsFor += match.awayGoals;
    awayClub.goalsAgainst += match.homeGoals;
    homeClub.cards += match.details.cards.filter((card) => card.team === "home").length;
    awayClub.cards += match.details.cards.filter((card) => card.team === "away").length;

    const homeResult = match.homeGoals > match.awayGoals ? "S" : match.homeGoals === match.awayGoals ? "U" : "N";
    const awayResult = match.awayGoals > match.homeGoals ? "S" : match.homeGoals === match.awayGoals ? "U" : "N";
    homeClub.form.push(homeResult);
    awayClub.form.push(awayResult);

    const participants = new Set([
      ...match.details.homeLineup,
      ...match.details.awayLineup,
      ...match.details.substitutions.map((item) => item.playerInId)
    ]);

    for (const playerId of participants) {
      const stat = playerStats.get(playerId);
      if (!stat) continue;
      stat.appearances += 1;
      stat.form.push(match.details.ratings[playerId] ?? 3.5);
      stat.averageRating = Number((stat.form.reduce((sum, rating) => sum + rating, 0) / stat.form.length).toFixed(2));
    }

    for (const goal of match.details.goals) {
      const scorer = playerStats.get(goal.scorerId);
      if (scorer) scorer.goals += 1;
      if (goal.assistId) {
        const assister = playerStats.get(goal.assistId);
        if (assister) assister.assists += 1;
      }
    }

    for (const card of match.details.cards) {
      const stat = playerStats.get(card.playerId);
      if (!stat) continue;
      if (card.type === "gelb") stat.yellowCards += 1;
      if (card.type === "gelb-rot") stat.secondYellowCards += 1;
      if (card.type === "rot") stat.redCards += 1;
      if (card.type === "gelb-rot" || card.type === "rot") stat.suspensions += 1;
    }
  }

  return {
    ...state,
    table,
    playerStats: Array.from(playerStats.values()),
    clubStats: Array.from(clubStats.values()).map((stat) => ({ ...stat, form: stat.form.slice(-5) }))
  };
};
