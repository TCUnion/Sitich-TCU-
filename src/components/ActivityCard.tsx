import React from 'react';
import { TrendingUp, Mountain, Clock, Zap, Heart, ChevronRight, ThumbsUp } from 'lucide-react';
import type { StravaSummaryActivity } from '../services/stravaApi';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatSpeed(metersPerSec: number): string {
  return (metersPerSec * 3.6).toFixed(1);
}

const sportIcons: Record<string, string> = {
  Ride: '🚴',
  Run: '🏃',
  Swim: '🏊',
  Walk: '🚶',
  Hike: '🥾',
  WeightTraining: '🏋️',
  Workout: '💪',
};

export function ActivityCard({
  activity,
  onClick,
}: {
  activity: StravaSummaryActivity;
  onClick: () => void;
}) {
  const icon = sportIcons[activity.sport_type] ?? sportIcons[activity.type] ?? '🏃';
  const date = new Date(activity.start_date_local);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  const dateStr = diffDays === 0 ? '今天'
    : diffDays === 1 ? '昨天'
    : diffDays < 7 ? `${diffDays} 天前`
    : date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-container-high rounded-2xl p-4 border border-white/5 hover:bg-surface-container-highest transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <h3 className="font-medium text-sm truncate">{activity.name}</h3>
          </div>
          <p className="text-[10px] text-on-surface-variant mb-3">{dateStr}</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {activity.distance > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">{(activity.distance / 1000).toFixed(1)} km</span>
              </div>
            )}
            {activity.total_elevation_gain > 0 && (
              <div className="flex items-center gap-1">
                <Mountain className="w-3 h-3 text-secondary" />
                <span className="text-xs font-medium">{Math.round(activity.total_elevation_gain)} m</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-tertiary" />
              <span className="text-xs font-medium">{formatDuration(activity.moving_time)}</span>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="flex flex-wrap gap-3 text-[10px] text-on-surface-variant">
            {activity.average_speed > 0 && (
              <span className="flex items-center gap-0.5">
                🏎️ {formatSpeed(activity.average_speed)} km/h
              </span>
            )}
            {activity.average_watts && (
              <span className="flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-400" /> {Math.round(activity.average_watts)} W
              </span>
            )}
            {activity.average_heartrate && (
              <span className="flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 text-red-400" /> {Math.round(activity.average_heartrate)} bpm
              </span>
            )}
            {activity.kudos_count > 0 && (
              <span className="flex items-center gap-0.5">
                <ThumbsUp className="w-2.5 h-2.5 text-primary" /> {activity.kudos_count}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-on-surface-variant/40 mt-1 shrink-0" />
      </div>
    </button>
  );
}
