import { z } from "zod";
import type { Club, Match, Player } from "../domain/types";

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

const playerSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  name: z.string(),
  position: z.enum(["TW", "ABW", "MIT", "ST"]),
  rating: z.number().min(1).max(100)
});

const matchSchema = z.object({
  id: z.string(),
  matchday: z.number().int().positive(),
  homeId: z.string(),
  awayId: z.string(),
  homeGoals: z.number().int().nonnegative().optional(),
  awayGoals: z.number().int().nonnegative().optional(),
  status: z.enum(["offen", "vorbereitet", "abgeschlossen"])
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

const playerNames: Record<string, string[]> = {
  muenchen: [
    "Jonas Berg", "Felix Maurer", "Mats Kern", "Leon Hartmann", "David Kaiser", "Anton Riedl", "Simon Vogt",
    "Nico Weber", "Timo Brandt", "Lukas Adler", "Emil Schuster", "Paul Neumann", "Armin Wolf", "Bennet Lang"
  ],
  dortmund: [
    "Milan Brand", "Noah Reuter", "Jan Heller", "Lennard Kruse", "Tom Albers", "Erik Vogler", "Finn Berger",
    "Mika Seidel", "Oskar Schmid", "Juri Winter", "Benno Roth", "Kian Stern", "Luis Faber", "Henri Graf"
  ],
  leipzig: [
    "Theo Falk", "Max Urban", "Ruben Kurz", "Ole Ritter", "Jakob Fink", "Aron Mai", "Levi Schenk", "Carlo Bauer",
    "Tim Grewe", "Nils Kramer", "Pepe Horn", "Miro Weise", "Sami Bergner", "Fritz Lenz"
  ],
  leverkusen: [
    "Moritz Stahl", "Jannes Pohl", "Elias Frank", "Robin Kuhn", "Leander Beck", "Silas Kopp", "Noel Jansen",
    "Matti Schulz", "Valentin Koch", "Jonte Sommer", "Lio Busch", "Karlo Stein", "Till Winkler", "Ivo Kunze"
  ],
  stuttgart: [
    "Luca Benz", "Philipp Ebert", "Hannes Kurz", "Fiete Braun", "Nolan Roth", "Marlon Haug", "Ole Pfeiffer",
    "Jaro Meier", "Tim Haller", "Julius Bock", "Linus Sauer", "Keno Reich", "Rico Barth", "Bela Ott"
  ],
  hamburg: [
    "Arvid Hansen", "Michel Jung", "Nick Petersen", "Tore Klein", "Jasper Holm", "Malte Krug", "Bjarne Frick",
    "Henrik Lorenzen", "Sven Lauer", "Peer Moller", "Caspar Hein", "Mattis Brand", "Tjark Holm", "Leif Seemann"
  ]
};

const positions = ["TW", "ABW", "ABW", "ABW", "ABW", "MIT", "MIT", "MIT", "MIT", "ST", "ST", "ABW", "MIT", "ST"] as const;

export const demoPlayers: Player[] = playerSchema.array().parse(
  demoClubs.flatMap((club) =>
    playerNames[club.id].map((name, index) => ({
      id: `${club.id}-p${index + 1}`,
      clubId: club.id,
      name,
      position: positions[index],
      rating: Math.max(52, club.strength - 10 + ((index * 7) % 14))
    }))
  )
);

export const demoMatches: Match[] = matchSchema.array().parse([
  { id: "md1-1", matchday: 1, homeId: "muenchen", awayId: "hamburg", status: "offen" },
  { id: "md1-2", matchday: 1, homeId: "dortmund", awayId: "stuttgart", status: "offen" },
  { id: "md1-3", matchday: 1, homeId: "leverkusen", awayId: "leipzig", status: "offen" },
  { id: "md2-1", matchday: 2, homeId: "stuttgart", awayId: "muenchen", status: "offen" },
  { id: "md2-2", matchday: 2, homeId: "hamburg", awayId: "leverkusen", status: "offen" },
  { id: "md2-3", matchday: 2, homeId: "leipzig", awayId: "dortmund", status: "offen" },
  { id: "md3-1", matchday: 3, homeId: "muenchen", awayId: "leverkusen", status: "offen" },
  { id: "md3-2", matchday: 3, homeId: "dortmund", awayId: "hamburg", status: "offen" },
  { id: "md3-3", matchday: 3, homeId: "stuttgart", awayId: "leipzig", status: "offen" }
]);
