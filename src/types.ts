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
  // 原始數值，供 RaceDetailScreen 使用
  distanceM?: number;
  elevationGainM?: number;
  elevationLow?: number;
  elevationHigh?: number;
  stravaId?: number;
  polyline?: string;
  startDate?: string;
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
