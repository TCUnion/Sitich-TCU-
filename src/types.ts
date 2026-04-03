export type Screen = 'login' | 'explore' | 'ranking' | 'register' | 'profile' | 'race-detail';

export interface Challenge {
  id: string;
  title: string;
  distance: string;
  elevation: string;
  image: string;
  status?: 'hot' | 'new' | 'live' | 'locked';
  participants?: string;
  time?: string;
  reward?: string;
}

export interface User {
  name: string;
  team: string;
  rank: string;
  personalBest: string;
  percentile: string;
  avatar: string;
  stats: {
    timing: number;
    road: number;
    climbing: number;
    criterium: number;
  };
}
