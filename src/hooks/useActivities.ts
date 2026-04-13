import { useState, useEffect, useCallback, useRef } from 'react';
import { getAthleteActivities, type StravaSummaryActivity } from '../services/stravaApi';

interface UseActivitiesResult {
  activities: StravaSummaryActivity[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

export function useActivities(athleteId: number | undefined, perPage = 20): UseActivitiesResult {
  const [activities, setActivities] = useState<StravaSummaryActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    if (!athleteId) return;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const data = await getAthleteActivities(athleteId, { page, per_page: perPage });
      const items = data ?? [];
      if (append) {
        setActivities(prev => [...prev, ...items]);
      } else {
        setActivities(items);
      }
      setHasMore(items.length >= perPage);
      pageRef.current = page;
    } catch {
      setError('無法載入活動');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [athleteId, perPage]);

  useEffect(() => {
    pageRef.current = 1;
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPage(pageRef.current + 1, true);
  }, [fetchPage, loadingMore, hasMore]);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    fetchPage(1, false);
  }, [fetchPage]);

  return { activities, loading, loadingMore, hasMore, error, loadMore, refresh };
}
