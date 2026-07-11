import { describe, expect, it } from "vitest";
import { createInitialState } from "../db/gameDb";
import {
  canCompleteCurrentMatchday,
  completeCurrentMatchday,
  generateRandomMatch,
  recalculateStats,
  setMatchResult,
  simulateOpenMatchesForCurrentMatchday,
  validateMatchConsistency
} from "./league";

describe("matchday flow", () => {
  it("captures a single match manually", () => {
    const state = createInitialState();
    const nextState = setMatchResult(state, "md1-1", 2, 1);
    const match = nextState.matches.find((item) => item.id === "md1-1");

    expect(match?.homeGoals).toBe(2);
    expect(match?.awayGoals).toBe(1);
    expect(match?.status).toBe("vorbereitet");
    expect(match?.details?.goals).toHaveLength(3);
  });

  it("generates a random single match result", () => {
    const state = createInitialState();
    const nextState = generateRandomMatch(state, "md1-2");
    const match = nextState.matches.find((item) => item.id === "md1-2");

    expect(match?.homeGoals).toBeGreaterThanOrEqual(0);
    expect(match?.awayGoals).toBeGreaterThanOrEqual(0);
    expect(match?.details).toBeDefined();
  });

  it("simulates all open matches without overwriting prepared matches", () => {
    const prepared = setMatchResult(createInitialState(), "md1-1", 5, 0);
    const simulated = simulateOpenMatchesForCurrentMatchday(prepared);
    const protectedMatch = simulated.matches.find((item) => item.id === "md1-1");
    const matchday = simulated.matches.filter((item) => item.matchday === 1);

    expect(protectedMatch?.homeGoals).toBe(5);
    expect(protectedMatch?.awayGoals).toBe(0);
    expect(matchday.every((match) => match.status === "vorbereitet")).toBe(true);
  });

  it("generates a consistent match scheme", () => {
    const state = setMatchResult(createInitialState(), "md1-3", 3, 2);
    const match = state.matches.find((item) => item.id === "md1-3");

    expect(match).toBeDefined();
    expect(validateMatchConsistency(match!)).toEqual([]);
    expect(match?.details?.goals.filter((goal) => goal.team === "home")).toHaveLength(3);
    expect(match?.details?.goals.filter((goal) => goal.team === "away")).toHaveLength(2);
  });

  it("blocks matchday completion until all results exist", () => {
    const partial = setMatchResult(createInitialState(), "md1-1", 1, 0);

    expect(canCompleteCurrentMatchday(partial)).toBe(false);
    expect(completeCurrentMatchday(partial).currentMatchday).toBe(1);
  });

  it("updates table and player statistics when the matchday is completed", () => {
    const state = ["md1-1", "md1-2", "md1-3"].reduce(
      (current, matchId) => setMatchResult(current, matchId, 2, 1),
      createInitialState()
    );

    const completed = completeCurrentMatchday(state);

    expect(completed.currentMatchday).toBe(2);
    expect(completed.table.reduce((sum, row) => sum + row.played, 0)).toBe(6);
    expect(completed.playerStats.some((stat) => stat.goals > 0)).toBe(true);
    expect(completed.playerStats.some((stat) => stat.assists > 0)).toBe(true);
  });

  it("recalculates completed match statistics after a later result change", () => {
    const state = ["md1-1", "md1-2", "md1-3"].reduce(
      (current, matchId) => setMatchResult(current, matchId, 1, 0),
      createInitialState()
    );
    const completed = completeCurrentMatchday(state);
    const recalculated = recalculateStats(setMatchResult(completed, "md1-1", 0, 4));
    const hamburg = recalculated.table.find((row) => row.clubId === "hamburg");

    expect(hamburg?.goalsFor).toBe(4);
  });
});
