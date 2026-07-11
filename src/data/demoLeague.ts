import { z } from "zod";
import type { Club, Match, Player } from "../domain/types";

const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  league: z.enum(["bundesliga", "zweite"]),
  strength: z.number().min(1).max(100),
  budget: z.number().nonnegative(),
  trainer: z.string(),
  manager: z.string(),
  squadMarketValue: z.number().nonnegative(),
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
  firstName: z.string(),
  name: z.string(),
  birthDate: z.string(),
  age: z.number().int().positive(),
  nationalities: z
    .object({
      isoCode: z.string(),
      countryName: z.string()
    })
    .array(),
  position: z.enum(["TW", "ABW", "MIT", "ST"]),
  secondaryPositions: z.enum(["TW", "ABW", "MIT", "ST"]).array(),
  shirtNumber: z.number().int().positive(),
  rating: z.number().min(1).max(100),
  form: z.number().min(0).max(100),
  fitness: z.number().min(0).max(100),
  morale: z.number().min(0).max(100),
  marketValue: z.number().nonnegative(),
  contractUntil: z.string(),
  previousClubs: z.string().array(),
  nationalTeamCaps: z.number().int().nonnegative()
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
    league: "bundesliga",
    strength: 91,
    budget: 210,
    trainer: "Rafael Berger",
    manager: "Klara Stein",
    squadMarketValue: 890,
    morale: 78,
    fanMood: 82,
    colors: { primary: "#b5162d", secondary: "#f4f4f4" }
  },
  {
    id: "dortmund",
    name: "Borussia Dortmund",
    shortName: "BVB",
    city: "Dortmund",
    league: "bundesliga",
    strength: 86,
    budget: 145,
    trainer: "Matteo Keller",
    manager: "Svenja Kruse",
    squadMarketValue: 620,
    morale: 74,
    fanMood: 86,
    colors: { primary: "#f5c518", secondary: "#161616" }
  },
  {
    id: "leipzig",
    name: "RB Leipzig",
    shortName: "RBL",
    city: "Leipzig",
    league: "bundesliga",
    strength: 84,
    budget: 132,
    trainer: "Tomas Urban",
    manager: "Ben Falk",
    squadMarketValue: 540,
    morale: 70,
    fanMood: 65,
    colors: { primary: "#ffffff", secondary: "#d21f3c" }
  },
  {
    id: "leverkusen",
    name: "Bayer Leverkusen",
    shortName: "B04",
    city: "Leverkusen",
    league: "bundesliga",
    strength: 88,
    budget: 118,
    trainer: "Daniel Costa",
    manager: "Mira Pohl",
    squadMarketValue: 705,
    morale: 82,
    fanMood: 80,
    colors: { primary: "#d0021b", secondary: "#101010" }
  },
  {
    id: "stuttgart",
    name: "VfB Stuttgart",
    shortName: "VFB",
    city: "Stuttgart",
    league: "bundesliga",
    strength: 78,
    budget: 82,
    trainer: "Jonas Ebert",
    manager: "Nora Benz",
    squadMarketValue: 315,
    morale: 76,
    fanMood: 79,
    colors: { primary: "#e30613", secondary: "#ffffff" }
  },
  {
    id: "hamburg",
    name: "Hamburger SV",
    shortName: "HSV",
    city: "Hamburg",
    league: "zweite",
    strength: 72,
    budget: 64,
    trainer: "Arvid Lorenz",
    manager: "Mette Holm",
    squadMarketValue: 148,
    morale: 68,
    fanMood: 88,
    colors: { primary: "#005ca9", secondary: "#ffffff" }
  }
]);

const nationalities = [
  { isoCode: "DE", countryName: "Deutschland" },
  { isoCode: "FR", countryName: "Frankreich" },
  { isoCode: "TR", countryName: "Tuerkei" },
  { isoCode: "NL", countryName: "Niederlande" },
  { isoCode: "AT", countryName: "Oesterreich" }
];

const splitName = (fullName: string) => {
  const [firstName, ...rest] = fullName.split(" ");
  return { firstName, lastName: rest.join(" ") };
};

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
      ...splitName(name),
      id: `${club.id}-p${index + 1}`,
      clubId: club.id,
      name: splitName(name).lastName,
      birthDate: `${1995 + (index % 9)}-${String((index % 12) + 1).padStart(2, "0")}-15`,
      age: 22 + (index % 12),
      nationalities: index % 9 === 0 ? [nationalities[0], nationalities[2]] : [nationalities[index % nationalities.length]],
      position: positions[index],
      secondaryPositions: positions[index] === "TW" ? [] : [positions[(index + 1) % positions.length]].filter((position) => position !== "TW"),
      shirtNumber: index + 1,
      rating: Math.max(52, club.strength - 10 + ((index * 7) % 14)),
      form: 55 + ((index * 5) % 35),
      fitness: 68 + ((index * 3) % 28),
      morale: 58 + ((index * 4) % 32),
      marketValue: Math.round((club.strength * 0.6 + index * 1.7) * 10) / 10,
      contractUntil: `${2027 + (index % 4)}-06-30`,
      previousClubs: index % 3 === 0 ? ["Jugendakademie", "Leihstation West"] : ["Jugendakademie"],
      nationalTeamCaps: index % 5 === 0 ? index + 2 : 0
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
