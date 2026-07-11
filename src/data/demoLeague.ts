import { z } from "zod";
import type { Club, Match } from "../domain/types";

const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  strength: z.number().min(1).max(100),
  budget: z.number().nonnegative(),
  morale: z.number().min(0).max(100),
  fanMood: z.number().min(0).max(100),
  colors: z.object({
    primary: z.string(),
    secondary: z.string()
  })
});

const matchSchema = z.object({
  id: z.string(),
  matchday: z.number().int().positive(),
  homeId: z.string(),
  awayId: z.string(),
  homeGoals: z.number().int().nonnegative().optional(),
  awayGoals: z.number().int().nonnegative().optional(),
  played: z.boolean()
});

export const demoClubs: Club[] = clubSchema.array().parse([
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
  },
  {
    id: "dortmund",
    name: "Borussia Dortmund",
    shortName: "BVB",
    city: "Dortmund",
    strength: 86,
    budget: 145,
    morale: 74,
    fanMood: 86,
    colors: { primary: "#f5c518", secondary: "#161616" }
  },
  {
    id: "leipzig",
    name: "RB Leipzig",
    shortName: "RBL",
    city: "Leipzig",
    strength: 84,
    budget: 132,
    morale: 70,
    fanMood: 65,
    colors: { primary: "#ffffff", secondary: "#d21f3c" }
  },
  {
    id: "leverkusen",
    name: "Bayer Leverkusen",
    shortName: "B04",
    city: "Leverkusen",
    strength: 88,
    budget: 118,
    morale: 82,
    fanMood: 80,
    colors: { primary: "#d0021b", secondary: "#101010" }
  },
  {
    id: "stuttgart",
    name: "VfB Stuttgart",
    shortName: "VFB",
    city: "Stuttgart",
    strength: 78,
    budget: 82,
    morale: 76,
    fanMood: 79,
    colors: { primary: "#e30613", secondary: "#ffffff" }
  },
  {
    id: "hamburg",
    name: "Hamburger SV",
    shortName: "HSV",
    city: "Hamburg",
    strength: 72,
    budget: 64,
    morale: 68,
    fanMood: 88,
    colors: { primary: "#005ca9", secondary: "#ffffff" }
  }
]);

export const demoMatches: Match[] = matchSchema.array().parse([
  { id: "md1-1", matchday: 1, homeId: "muenchen", awayId: "hamburg", played: false },
  { id: "md1-2", matchday: 1, homeId: "dortmund", awayId: "stuttgart", played: false },
  { id: "md1-3", matchday: 1, homeId: "leverkusen", awayId: "leipzig", played: false },
  { id: "md2-1", matchday: 2, homeId: "stuttgart", awayId: "muenchen", played: false },
  { id: "md2-2", matchday: 2, homeId: "hamburg", awayId: "leverkusen", played: false },
  { id: "md2-3", matchday: 2, homeId: "leipzig", awayId: "dortmund", played: false },
  { id: "md3-1", matchday: 3, homeId: "muenchen", awayId: "leverkusen", played: false },
  { id: "md3-2", matchday: 3, homeId: "dortmund", awayId: "hamburg", played: false },
  { id: "md3-3", matchday: 3, homeId: "stuttgart", awayId: "leipzig", played: false }
]);
