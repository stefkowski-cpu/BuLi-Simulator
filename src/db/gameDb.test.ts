import { beforeEach, describe, expect, it } from "vitest";
import { db, createInitialState, loadGameState, saveGameState } from "./gameDb";

describe("loadGameState", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("returns freshly saved state unchanged", async () => {
    const state = createInitialState();
    await saveGameState(state);
    const loaded = await loadGameState();

    expect(loaded.clubs).toEqual(state.clubs);
    expect(loaded.players).toEqual(state.players);
  });

  it("discards state persisted under an older, incompatible schema instead of merging it", async () => {
    // Shape saved by an earlier version of the app: Club has no `league`
    // field and Player.name held the *full* name with no `firstName` field.
    await db.games.put({
      id: "current",
      selectedClubId: null,
      currentMatchday: 1,
      clubs: [
        {
          id: "muenchen",
          name: "FC Muenchen",
          shortName: "FCM",
          city: "Muenchen",
          strength: 91,
          budget: 210,
          morale: 78,
          fanMood: 82,
          colors: { primary: "#b5162d", secondary: "#f4f4f4" }
        }
      ],
      players: [{ id: "muenchen-p1", clubId: "muenchen", name: "Jonas Berg", position: "TW", rating: 80 }],
      matches: [],
      lastMessage: "alt",
      updatedAt: new Date().toISOString()
      // no schemaVersion field at all
    } as never);

    const loaded = await loadGameState();
    const fresh = createInitialState();

    expect(loaded.clubs).toEqual(fresh.clubs);
    expect(loaded.players).toEqual(fresh.players);
    expect(loaded.clubs.every((club) => typeof club.league === "string")).toBe(true);
    expect(loaded.players.every((player) => typeof player.firstName === "string" && player.firstName.length > 0)).toBe(
      true
    );
  });
});
