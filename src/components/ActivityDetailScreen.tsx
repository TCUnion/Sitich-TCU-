import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft, TrendingUp, Mountain, Clock, Zap, Heart,
  ExternalLink, ThumbsUp, MessageCircle, Award, Gauge,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getActivity, getActivityLaps, getActivityComments, getActivityKudos,
  type StravaDetailedActivity, type StravaLap, type StravaComment, type StravaKudoser,
} from '../services/stravaApi';
import { MapThumbnail } from './MapThumbnail';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(metersPerSec: number): string {
  return (metersPerSec * 3.6).toFixed(1);
}

type DetailTab = 'overview' | 'laps' | 'social';

export function ActivityDetailScreen({
  activityId,
  onBack,
}: {
  activityId: number;
  onBack: () => void;
}) {
  const { athlete } = useAuth();
  const [activity, setActivity] = useState<StravaDetailedActivity | null>(null);
  const [laps, setLaps] = useState<StravaLap[]>([]);
  const [comments, setComments] = useState<StravaComment[]>([]);
  const [kudosers, setKudosers] = useState<StravaKudoser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('overview');

  useEffect(() => {
    if (!athlete) return;
    setLoading(true);
    Promise.all([
      getActivity(athlete.id, activityId),
      getActivityLaps(athlete.id, activityId),
      getActivityComments(athlete.id, activityId),
      getActivityKudos(athlete.id, activityId),
    ]).then(([act, lapData, commentData, kudosData]) => {
      setActivity(act);
      setLaps(lapData ?? []);
      setComments(commentData ?? []);
      setKudosers(kudosData ?? []);
    }).finally(() => setLoading(false));
  }, [athlete?.id, activityId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-on-surface-variant mb-4">無法載入活動</p>
        <button onClick={onBack} className="text-primary text-sm">返回</button>
      </div>
    );
  }

  const date = new Date(activity.start_date_local);
  const dateStr = date.toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
  const timeStr = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-surface pb-28"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-surface-container-high transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-medium text-sm truncate flex-1">{activity.name}</h1>
        <a
          href={`https://www.strava.com/activities/${activity.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-primary"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Map */}
      {activity.map?.summary_polyline && (
        <div className="w-full h-48">
          <MapThumbnail
            polyline={activity.map.summary_polyline}
            width={window.innerWidth}
            height={192}
          />
        </div>
      )}

      {/* Date & Type */}
      <div className="px-4 py-3">
        <p className="text-xs text-on-surface-variant">{dateStr} · {timeStr}</p>
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
          {activity.sport_type} · {activity.device_name ?? 'Unknown device'}
        </p>
      </div>

      {/* Key Stats */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        {activity.distance > 0 && (
          <StatBlock icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />} label="距離" value={`${(activity.distance / 1000).toFixed(1)} km`} />
        )}
        <StatBlock icon={<Clock className="w-3.5 h-3.5 text-tertiary" />} label="時間" value={formatDuration(activity.moving_time)} />
        {activity.total_elevation_gain > 0 && (
          <StatBlock icon={<Mountain className="w-3.5 h-3.5 text-secondary" />} label="爬升" value={`${Math.round(activity.total_elevation_gain)} m`} />
        )}
        {activity.average_speed > 0 && (
          <StatBlock icon={<Gauge className="w-3.5 h-3.5 text-blue-400" />} label="均速" value={`${formatPace(activity.average_speed)} km/h`} />
        )}
        {activity.average_watts != null && (
          <StatBlock icon={<Zap className="w-3.5 h-3.5 text-amber-400" />} label="功率" value={`${Math.round(activity.average_watts)} W`} />
        )}
        {activity.average_heartrate != null && (
          <StatBlock icon={<Heart className="w-3.5 h-3.5 text-red-400" />} label="心率" value={`${Math.round(activity.average_heartrate)} bpm`} />
        )}
        {activity.calories > 0 && (
          <StatBlock icon={<span className="text-xs">🔥</span>} label="卡路里" value={`${Math.round(activity.calories)}`} />
        )}
        {activity.suffer_score != null && activity.suffer_score > 0 && (
          <StatBlock icon={<Award className="w-3.5 h-3.5 text-purple-400" />} label="強度" value={`${activity.suffer_score}`} />
        )}
      </div>

      {/* Tab bar */}
      <div className="px-4 flex gap-1 mb-4">
        {(['overview', 'laps', 'social'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors ${
              tab === t ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {t === 'overview' ? '總覽' : t === 'laps' ? `分圈 (${laps.length})` : `互動 (${kudosers.length + comments.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            {activity.description && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-on-surface-variant whitespace-pre-line">{activity.description}</p>
              </div>
            )}
            {activity.gear && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                <span className="text-lg">🚲</span>
                <div>
                  <p className="text-xs font-medium">{activity.gear.name}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {(activity.gear.distance / 1000).toLocaleString('zh-TW', { maximumFractionDigits: 0 })} km 總里程
                  </p>
                </div>
              </div>
            )}
            {/* Splits */}
            {activity.splits_metric && activity.splits_metric.length > 0 && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <h3 className="text-xs font-medium mb-3">分段 ({activity.splits_metric.length} km)</h3>
                <div className="space-y-1">
                  {activity.splits_metric.map((split, i) => {
                    const pace = split.average_speed > 0 ? (split.average_speed * 3.6).toFixed(1) : '—';
                    const maxSpeed = Math.max(...activity.splits_metric.map(s => s.average_speed));
                    const barPct = maxSpeed > 0 ? (split.average_speed / maxSpeed) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="w-5 text-on-surface-variant text-right">{split.split}</span>
                        <div className="flex-1 h-4 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-medium">{pace} km/h</span>
                        {split.elevation_difference !== 0 && (
                          <span className={`w-10 text-right ${split.elevation_difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Best efforts */}
            {activity.best_efforts && activity.best_efforts.length > 0 && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <h3 className="text-xs font-medium mb-3 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> 最佳成績
                </h3>
                <div className="space-y-2">
                  {activity.best_efforts.slice(0, 8).map(effort => (
                    <div key={effort.id} className="flex justify-between text-[10px]">
                      <span className="text-on-surface-variant">{effort.name}</span>
                      <span className="font-medium">{formatDuration(effort.elapsed_time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'laps' && (
          <div className="space-y-2">
            {laps.length === 0 ? (
              <p className="text-center text-on-surface-variant text-xs py-8">無分圈資料</p>
            ) : (
              laps.map(lap => (
                <div key={lap.id} className="bg-surface-container-high rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {lap.lap_index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{lap.name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {(lap.distance / 1000).toFixed(1)} km · {formatDuration(lap.moving_time)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{(lap.average_speed * 3.6).toFixed(1)} km/h</p>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                      {lap.average_heartrate && (
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 text-red-400" />{Math.round(lap.average_heartrate)}
                        </span>
                      )}
                      {lap.average_watts && (
                        <span className="flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />{Math.round(lap.average_watts)}W
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-4">
            {/* Kudos */}
            {kudosers.length > 0 && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <h3 className="text-xs font-medium mb-3 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" /> 按讚 ({kudosers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kudosers.map((k, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-surface-container rounded-full pl-1 pr-2.5 py-1">
                      <img
                        src={k.profile_medium || k.profile}
                        alt={`${k.firstname} ${k.lastname}`}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-[10px]">{k.firstname}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Comments */}
            {comments.length > 0 && (
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <h3 className="text-xs font-medium mb-3 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-secondary" /> 留言 ({comments.length})
                </h3>
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <img
                        src={c.athlete.profile}
                        alt={c.athlete.firstname}
                        className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-[10px] font-medium">{c.athlete.firstname} {c.athlete.lastname}</p>
                        <p className="text-[10px] text-on-surface-variant">{c.text}</p>
                        <p className="text-[9px] text-on-surface-variant/50 mt-0.5">
                          {new Date(c.created_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {kudosers.length === 0 && comments.length === 0 && (
              <p className="text-center text-on-surface-variant text-xs py-8">尚無互動</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-container-high rounded-xl p-3 border border-white/5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[9px] text-on-surface-variant uppercase">{label}</p>
    </div>
  );
}
