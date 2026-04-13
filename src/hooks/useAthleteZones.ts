import { useState, useEffect } from 'react';
import { getAthleteZones, type StravaAthleteZones } from '../services/stravaApi';

interface UseAthleteZonesResult {
  zones: StravaAthleteZones | null;
  loading: boolean;
  error: string | null;
}

export function useAthleteZones(athleteId: number | undefined): UseAthleteZonesResult {
  const [zones, setZones] = useState<StravaAthleteZones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);
    setError(null);
    getAthleteZones(athleteId)
      .then(data => setZones(data))
      .catch(() => setError('無法載入訓練區間'))
      .finally(() => setLoading(false));
  }, [athleteId]);

  return { zones, loading, error };
}
