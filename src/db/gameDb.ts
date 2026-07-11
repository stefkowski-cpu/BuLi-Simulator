import Dexie, { type Table } from "dexie";
import { demoClubs, demoMatches } from "../data/demoLeague";
import type { GameState } from "../domain/types";

const GAME_ID = "current";

type PersistedGame = GameState & {
  id: string;
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
  matches: demoMatches,
  lastMessage: "Waehle deinen Verein und starte in die Demo-Saison.",
  updatedAt: new Date().toISOString()
});

export const loadGameState = async (): Promise<GameState> => {
  const saved = await db.games.get(GAME_ID);

  if (!saved) {
    return createInitialState();
  }

  const { id: _id, ...state } = saved;
  return state;
};

export const saveGameState = async (state: GameState) => {
  await db.games.put({ ...state, id: GAME_ID, updatedAt: new Date().toISOString() });
};

export const resetGameState = async () => {
  const state = createInitialState();
  await saveGameState(state);
  return state;
};
