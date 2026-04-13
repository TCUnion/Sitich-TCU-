import { useState, useEffect } from 'react';
import { getAthleteStats, type StravaAthleteStats } from '../services/stravaApi';

interface UseAthleteStatsResult {
  stats: StravaAthleteStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAthleteStats(athleteId: number | undefined): UseAthleteStatsResult {
  const [stats, setStats] = useState<StravaAthleteStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);
    setError(null);
    getAthleteStats(athleteId)
      .then(data => setStats(data))
      .catch(() => setError('無法載入統計資料'))
      .finally(() => setLoading(false));
  }, [athleteId, refreshKey]);

  return { stats, loading, error, refresh: () => setRefreshKey(k => k + 1) };
}
