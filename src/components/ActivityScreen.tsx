import React, { useEffect, useRef } from 'react';
import { Bike, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActivities } from '../hooks/useActivities';
import { ActivityCard } from './ActivityCard';

export function ActivityScreen({ onViewDetail }: { onViewDetail: (activityId: number) => void }) {
  const { athlete } = useAuth();
  const { activities, loading, loadingMore, hasMore, loadMore, refresh } = useActivities(athlete?.id);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Bike className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
          <p className="text-on-surface-variant">請先登入 Strava</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">我的活動</h1>
        <button
          onClick={refresh}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="重新整理"
        >
          <RefreshCw className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface-container-high rounded-2xl p-4 border border-white/5 animate-pulse">
              <div className="h-4 bg-surface-container-highest rounded w-3/4 mb-3" />
              <div className="h-3 bg-surface-container-highest rounded w-1/3 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-3 bg-surface-container-highest rounded" />
                <div className="h-3 bg-surface-container-highest rounded" />
                <div className="h-3 bg-surface-container-highest rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bike className="w-12 h-12 text-on-surface-variant/40 mb-4" />
          <p className="text-on-surface-variant">尚無活動紀錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(act => (
            <ActivityCard
              key={act.id}
              activity={act}
              onClick={() => onViewDetail(act.id)}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {!hasMore && activities.length > 0 && (
            <p className="text-center text-on-surface-variant text-xs py-4">已載入全部活動</p>
          )}
        </div>
      )}
    </div>
  );
}
