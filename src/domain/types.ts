export type Club = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  strength: number;
  budget: number;
  morale: number;
  fanMood: number;
  colors: {
    primary: string;
    secondary: string;
  };
};

export type Match = {
  id: string;
  matchday: number;
  homeId: string;
  awayId: string;
  homeGoals?: number;
  awayGoals?: number;
  played: boolean;
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
};

export type GameState = {
  selectedClubId: string | null;
  currentMatchday: number;
  clubs: Club[];
  matches: Match[];
  lastMessage: string;
  updatedAt: string;
};
