import { describe, expect, it } from "vitest";
import { createInitialState } from "../db/gameDb";
import { buildTable, simulateMatchday } from "./league";

describe("league logic", () => {
  it("starts with an empty table", () => {
    const state = createInitialState();
    const table = buildTable(state.clubs, state.matches);

    expect(table).toHaveLength(state.clubs.length);
    expect(table.every((row) => row.points === 0)).toBe(true);
  });

  it("simulates one complete matchday", () => {
    const state = { ...createInitialState(), selectedClubId: "dortmund" };
    const nextState = simulateMatchday(state);

    expect(nextState.currentMatchday).toBe(2);
    expect(nextState.matches.filter((match) => match.played)).toHaveLength(3);
    expect(buildTable(nextState.clubs, nextState.matches).some((row) => row.played > 0)).toBe(true);
  });
});
