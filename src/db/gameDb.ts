import Dexie, { type Table } from "dexie";
import { demoClubs, demoMatches, demoPlayers } from "../data/demoLeague";
import { buildTable } from "../domain/league";
import type { GameState } from "../domain/types";

const GAME_ID = "current";

// Bump whenever the shape of GameState/Club/Player/Match changes.
// Persisted records from an older version are discarded on load instead of
// being merged in, since a partial/legacy shape leads to broken rendering
// (e.g. missing Player.firstName or Club.league).
const SCHEMA_VERSION = 2;

type PersistedGame = GameState & {
  id: string;
  schemaVersion: number;
};

class BuliDatabase extends Dexie {
  games!: Table<PersistedGame, string>;

  constructor() {
    super("buli-simulator");
    this.version(1).stores({
      games: "id, updatedAt"
    });
  }
}

export const db = new BuliDatabase();

export const createInitialState = (): GameState => ({
  selectedClubId: null,
  currentMatchday: 1,
  clubs: demoClubs,
  players: demoPlayers,
  matches: demoMatches,
  table: buildTable(demoClubs, demoMatches),
  clubStats: demoClubs.map((club) => ({ clubId: club.id, form: [], goalsFor: 0, goalsAgainst: 0, cards: 0 })),
  playerStats: demoPlayers.map((player) => ({
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
  })),
  lastMessage: "Waehle deinen Verein und fuehre den Spieltag Spiel fuer Spiel.",
  updatedAt: new Date().toISOString()
});

export const loadGameState = async (): Promise<GameState> => {
  const saved = await db.games.get(GAME_ID);

  if (!saved || saved.schemaVersion !== SCHEMA_VERSION) {
    if (saved) await db.games.delete(GAME_ID);
    return createInitialState();
  }

  const { id: _id, schemaVersion: _schemaVersion, ...state } = saved;
  return state;
};

export const saveGameState = async (state: GameState) => {
  await db.games.put({ ...state, id: GAME_ID, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() });
};

export const resetGameState = async () => {
  const state = createInitialState();
  await saveGameState(state);
  return state;
};
