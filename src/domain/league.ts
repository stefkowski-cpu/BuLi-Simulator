import type { Club, GameState, Match, TableRow } from "./types";

const emptyRow = (clubId: string): TableRow => ({
  clubId,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0
});

export const buildTable = (clubs: Club[], matches: Match[]): TableRow[] => {
  const rows = new Map(clubs.map((club) => [club.id, emptyRow(club.id)]));

  for (const match of matches) {
    if (!match.played || match.homeGoals === undefined || match.awayGoals === undefined) {
      continue;
    }

    const home = rows.get(match.homeId);
    const away = rows.get(match.awayId);

    if (!home || !away) {
      continue;
    }

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
    } else if (match.homeGoals < match.awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.clubId.localeCompare(b.clubId);
    });
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const scoreFor = (strength: number, opponentStrength: number, seed: number, homeBonus: number) => {
  const pressure = strength - opponentStrength + homeBonus;
  const base = pressure > 12 ? 2 : pressure > -8 ? 1 : 0;
  const swing = seed % 3;
  return clamp(base + swing, 0, 5);
};

export const simulateMatchday = (state: GameState): GameState => {
  const matchdayMatches = state.matches.filter((match) => match.matchday === state.currentMatchday);

  if (matchdayMatches.length === 0 || matchdayMatches.every((match) => match.played)) {
    return {
      ...state,
      lastMessage: "Die Demo-Saison ist beendet. Starte neu, um eine weitere Runde zu spielen.",
      updatedAt: new Date().toISOString()
    };
  }

  const clubById = new Map(state.clubs.map((club) => [club.id, club]));
  let selectedDelta = 0;

  const matches = state.matches.map((match) => {
    if (match.matchday !== state.currentMatchday || match.played) {
      return match;
    }

    const home = clubById.get(match.homeId);
    const away = clubById.get(match.awayId);

    if (!home || !away) {
      return match;
    }

    const seed = match.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), state.currentMatchday);
    const homeGoals = scoreFor(home.strength + home.morale / 8, away.strength + away.morale / 10, seed, 5);
    const awayGoals = scoreFor(away.strength + away.morale / 8, home.strength + home.morale / 10, seed + 1, 0);

    if (state.selectedClubId === home.id) {
      selectedDelta = homeGoals > awayGoals ? 6 : homeGoals === awayGoals ? 1 : -5;
    }

    if (state.selectedClubId === away.id) {
      selectedDelta = awayGoals > homeGoals ? 7 : awayGoals === homeGoals ? 1 : -4;
    }

    return {
      ...match,
      homeGoals,
      awayGoals,
      played: true
    };
  });

  const clubs = state.clubs.map((club) => {
    if (club.id !== state.selectedClubId) {
      return club;
    }

    return {
      ...club,
      morale: clamp(club.morale + selectedDelta, 20, 100),
      fanMood: clamp(club.fanMood + selectedDelta, 15, 100),
      budget: Math.round((club.budget + Math.max(selectedDelta, 0) * 0.9 + 2.4) * 10) / 10
    };
  });

  const selectedClub = clubs.find((club) => club.id === state.selectedClubId);
  const nextMatchday = state.currentMatchday + 1;

  return {
    ...state,
    clubs,
    matches,
    currentMatchday: nextMatchday,
    lastMessage: selectedClub
      ? `${selectedClub.name} hat Spieltag ${state.currentMatchday} abgeschlossen.`
      : `Spieltag ${state.currentMatchday} wurde simuliert.`,
    updatedAt: new Date().toISOString()
  };
};

export const nextMatchForClub = (state: GameState, clubId: string) =>
  state.matches.find((match) => !match.played && (match.homeId === clubId || match.awayId === clubId));
