export type Club = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  league: "bundesliga" | "zweite";
  strength: number;
  budget: number;
  trainer: string;
  manager: string;
  squadMarketValue: number;
  morale: number;
  fanMood: number;
  colors: {
    primary: string;
    secondary: string;
  };
};

export type PlayerPosition = "TW" | "ABW" | "MIT" | "ST";

export type Player = {
  id: string;
  clubId: string;
  firstName: string;
  name: string;
  birthDate: string;
  age: number;
  nationalities: Nationality[];
  position: PlayerPosition;
  secondaryPositions: PlayerPosition[];
  shirtNumber: number;
  rating: number;
  form: number;
  fitness: number;
  morale: number;
  marketValue: number;
  contractUntil: string;
  previousClubs: string[];
  nationalTeamCaps: number;
};

export type Nationality = {
  isoCode: string;
  countryName: string;
};

export type MatchStatus = "offen" | "vorbereitet" | "abgeschlossen";
export type TeamSide = "home" | "away";
export type CardType = "gelb" | "gelb-rot" | "rot";

export type Substitution = {
  id: string;
  team: TeamSide;
  minute: number;
  playerOutId: string;
  playerInId: string;
};

export type GoalEvent = {
  id: string;
  team: TeamSide;
  minute: number;
  scorerId: string;
  assistId?: string;
};

export type CardEvent = {
  id: string;
  team: TeamSide;
  minute: number;
  playerId: string;
  type: CardType;
};

export type MatchDetails = {
  homeLineup: string[];
  awayLineup: string[];
  homeBench: string[];
  awayBench: string[];
  substitutions: Substitution[];
  goals: GoalEvent[];
  cards: CardEvent[];
  ratings: Record<string, number>;
};

export type Match = {
  id: string;
  matchday: number;
  homeId: string;
  awayId: string;
  homeGoals?: number;
  awayGoals?: number;
  status: MatchStatus;
  details?: MatchDetails;
};

export type TableRow = {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
};

export type PlayerStat = {
  playerId: string;
  clubId: string;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  secondYellowCards: number;
  redCards: number;
  suspensions: number;
  averageRating: number;
  form: number[];
};

export type ClubStat = {
  clubId: string;
  form: string[];
  goalsFor: number;
  goalsAgainst: number;
  cards: number;
};

export type GameState = {
  selectedClubId: string | null;
  currentMatchday: number;
  clubs: Club[];
  players: Player[];
  matches: Match[];
  table: TableRow[];
  clubStats: ClubStat[];
  playerStats: PlayerStat[];
  lastMessage: string;
  updatedAt: string;
};
