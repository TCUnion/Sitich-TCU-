/**
 * Strava API v3 — 型別定義 + 端點 wrapper
 *
 * 所有呼叫透過 stravaApiProxy()（Supabase Edge Function 代理），
 * 自動 refresh token + rate limit 追蹤。
 *
 * 快取策略：staleWhileRevalidate（讀取端點），寫入端點 invalidate 相關快取。
 */

import { stravaApiProxy } from './api';
import {
  staleWhileRevalidate,
  invalidateCache,
  invalidateCacheByPrefix,
} from './stravaCache';

// ===================================================================
// 型別定義
// ===================================================================

/** 活動摘要（列表用） */
export interface StravaSummaryActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  suffer_score?: number;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  map: { id: string; summary_polyline: string | null };
  gear_id: string | null;
  has_heartrate: boolean;
  device_watts: boolean;
}

/** 活動詳情 */
export interface StravaDetailedActivity extends StravaSummaryActivity {
  description: string | null;
  calories: number;
  photos: { count: number; primary: { urls: Record<string, string> } | null };
  gear: StravaGear | null;
  segment_efforts: StravaSegmentEffort[];
  splits_metric: StravaSplit[];
  laps: StravaLap[];
  best_efforts: StravaBestEffort[];
  map: { id: string; polyline: string | null; summary_polyline: string | null };
  embed_token: string;
  device_name: string | null;
}

/** 分段 */
export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  average_heartrate?: number;
  pace_zone: number;
}

/** 最佳成績 */
export interface StravaBestEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  start_index: number;
  end_index: number;
}

/** 運動員詳情 */
export interface StravaDetailedAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: 'M' | 'F' | null;
  weight: number | null;
  ftp: number | null;
  clubs: StravaClub[];
  bikes: StravaGear[];
  shoes: StravaGear[];
  measurement_preference: 'feet' | 'meters';
}

/** 運動員統計 */
export interface StravaAthleteStats {
  recent_ride_totals: StravaActivityTotal;
  recent_run_totals: StravaActivityTotal;
  recent_swim_totals: StravaActivityTotal;
  ytd_ride_totals: StravaActivityTotal;
  ytd_run_totals: StravaActivityTotal;
  ytd_swim_totals: StravaActivityTotal;
  all_ride_totals: StravaActivityTotal;
  all_run_totals: StravaActivityTotal;
  all_swim_totals: StravaActivityTotal;
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
}

export interface StravaActivityTotal {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

/** 訓練區間 */
export interface StravaActivityZone {
  type: 'heartrate' | 'power';
  resource_state: number;
  sensor_based: boolean;
  distribution_buckets: { min: number; max: number; time: number }[];
}

/** 運動員訓練區間設定 */
export interface StravaAthleteZones {
  heart_rate: { custom_zones: boolean; zones: StravaZoneRange[] };
  power: { zones: StravaZoneRange[] } | null;
}

export interface StravaZoneRange {
  min: number;
  max: number;
}

/** 社團 */
export interface StravaClub {
  id: number;
  name: string;
  profile: string;
  profile_medium: string;
  cover_photo: string | null;
  cover_photo_small: string | null;
  sport_type: string;
  city: string | null;
  state: string | null;
  country: string | null;
  member_count: number;
  url: string;
}

/** 社團成員 */
export interface StravaClubMember {
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  membership: 'member' | 'pending';
  admin: boolean;
  owner: boolean;
}

/** 路線 */
export interface StravaRoute {
  id: number;
  name: string;
  description: string | null;
  distance: number;
  elevation_gain: number;
  map: { summary_polyline: string | null };
  type: number; // 1=ride, 2=run
  sub_type: number; // 1=road, 2=mtb, 3=cx, 4=trail, 5=mixed
  starred: boolean;
  timestamp: number;
  estimated_moving_time: number;
}

/** 路段詳情 */
export interface StravaDetailedSegment {
  id: number;
  name: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  climb_category: number;
  city: string | null;
  state: string | null;
  country: string | null;
  total_elevation_gain: number;
  effort_count: number;
  athlete_count: number;
  star_count: number;
  map: { polyline: string };
  athlete_segment_stats?: {
    pr_elapsed_time: number | null;
    pr_date: string | null;
    effort_count: number;
  };
}

/** 路段努力 */
export interface StravaSegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  segment: { id: number; name: string };
  pr_rank: number | null;
  achievements: { type_id: number; type: string; rank: number }[];
}

/** 串流資料 */
export interface StravaStream {
  type: string;
  data: number[];
  series_type: 'time' | 'distance';
  original_size: number;
  resolution: 'low' | 'medium' | 'high';
}

/** 裝備 */
export interface StravaGear {
  id: string;
  name: string;
  primary: boolean;
  distance: number;
  brand_name?: string;
  model_name?: string;
  description?: string;
  frame_type?: number;
}

/** 上傳狀態 */
export interface StravaUploadStatus {
  id: number;
  external_id: string;
  error: string | null;
  status: string;
  activity_id: number | null;
}

/** 留言 */
export interface StravaComment {
  id: number;
  text: string;
  created_at: string;
  athlete: { id: number; firstname: string; lastname: string; profile: string };
}

/** 分圈 */
export interface StravaLap {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  lap_index: number;
  total_elevation_gain: number;
}

/** 按讚者 */
export interface StravaKudoser {
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
}

// ===================================================================
// 快取 key 工具
// ===================================================================

function cacheKey(endpoint: string, athleteId: number, params?: Record<string, unknown>): string {
  const base = `strava:${athleteId}:${endpoint}`;
  if (!params || Object.keys(params).length === 0) return base;
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${base}:${JSON.stringify(sorted)}`;
}

// ===================================================================
// 快取時間常數
// ===================================================================

const CACHE_1MIN = 60_000;
const CACHE_5MIN = 5 * 60_000;
const CACHE_15MIN = 15 * 60_000;
const CACHE_1HOUR = 60 * 60_000;

// ===================================================================
// Activities（7 GET + 1 POST + 1 PUT）
// ===================================================================

/** 取得登入運動員的活動列表 */
export function getAthleteActivities(
  athleteId: number,
  opts?: { page?: number; per_page?: number; before?: number; after?: number },
): Promise<StravaSummaryActivity[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  // 列表含分頁，短快取
  return staleWhileRevalidate(
    cacheKey('/athlete/activities', athleteId, params),
    () => stravaApiProxy<StravaSummaryActivity[]>(athleteId, '/athlete/activities', params),
    CACHE_1MIN,
  );
}

/** 取得活動詳情 */
export function getActivity(
  athleteId: number,
  activityId: number,
): Promise<StravaDetailedActivity | null> {
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}`, athleteId),
    () => stravaApiProxy<StravaDetailedActivity>(athleteId, `/activities/${activityId}`),
    CACHE_15MIN,
  );
}

/** 取得活動留言 */
export function getActivityComments(
  athleteId: number,
  activityId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaComment[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}/comments`, athleteId, params),
    () => stravaApiProxy<StravaComment[]>(athleteId, `/activities/${activityId}/comments`, params),
    CACHE_5MIN,
  );
}

/** 取得活動按讚者 */
export function getActivityKudos(
  athleteId: number,
  activityId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaKudoser[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}/kudos`, athleteId, params),
    () => stravaApiProxy<StravaKudoser[]>(athleteId, `/activities/${activityId}/kudos`, params),
    CACHE_5MIN,
  );
}

/** 取得活動分圈 */
export function getActivityLaps(
  athleteId: number,
  activityId: number,
): Promise<StravaLap[] | null> {
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}/laps`, athleteId),
    () => stravaApiProxy<StravaLap[]>(athleteId, `/activities/${activityId}/laps`),
    CACHE_15MIN,
  );
}

/** 取得活動心率/功率分佈 */
export function getActivityZones(
  athleteId: number,
  activityId: number,
): Promise<StravaActivityZone[] | null> {
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}/zones`, athleteId),
    () => stravaApiProxy<StravaActivityZone[]>(athleteId, `/activities/${activityId}/zones`),
    CACHE_15MIN,
  );
}

/** 取得活動串流資料（心率/功率/速度/海拔/座標…） */
export function getActivityStreams(
  athleteId: number,
  activityId: number,
  keys: string[] = ['time', 'distance', 'altitude', 'heartrate', 'watts', 'velocity_smooth', 'latlng', 'cadence', 'temp', 'moving', 'grade_smooth'],
  resolution: 'low' | 'medium' | 'high' = 'medium',
): Promise<StravaStream[] | null> {
  const params = { keys: keys.join(','), key_by_type: true, resolution };
  return staleWhileRevalidate(
    cacheKey(`/activities/${activityId}/streams`, athleteId, params),
    () => stravaApiProxy<StravaStream[]>(athleteId, `/activities/${activityId}/streams`, params),
    CACHE_15MIN,
  );
}

/** 建立手動活動 */
export async function createActivity(
  athleteId: number,
  data: {
    name: string;
    type: string;
    sport_type: string;
    start_date_local: string;
    elapsed_time: number;
    description?: string;
    distance?: number;
    trainer?: boolean;
    commute?: boolean;
  },
): Promise<StravaDetailedActivity | null> {
  const result = await stravaApiProxy<StravaDetailedActivity>(
    athleteId,
    '/activities',
    { ...data, _method: 'POST' },
  );
  if (result) invalidateCacheByPrefix(`strava:${athleteId}:/athlete/activities`);
  return result;
}

/** 更新活動 */
export async function updateActivity(
  athleteId: number,
  activityId: number,
  data: {
    name?: string;
    type?: string;
    sport_type?: string;
    description?: string;
    gear_id?: string;
    trainer?: boolean;
    commute?: boolean;
    hide_from_home?: boolean;
  },
): Promise<StravaDetailedActivity | null> {
  const result = await stravaApiProxy<StravaDetailedActivity>(
    athleteId,
    `/activities/${activityId}`,
    { ...data, _method: 'PUT' },
  );
  if (result) {
    invalidateCache(cacheKey(`/activities/${activityId}`, athleteId));
    invalidateCacheByPrefix(`strava:${athleteId}:/athlete/activities`);
  }
  return result;
}

// ===================================================================
// Athletes（3 GET + 1 PUT）
// ===================================================================

/** 取得登入運動員詳細資料 */
export function getAuthenticatedAthlete(
  athleteId: number,
): Promise<StravaDetailedAthlete | null> {
  return staleWhileRevalidate(
    cacheKey('/athlete', athleteId),
    () => stravaApiProxy<StravaDetailedAthlete>(athleteId, '/athlete'),
    CACHE_15MIN,
  );
}

/** 取得運動員統計 */
export function getAthleteStats(
  athleteId: number,
): Promise<StravaAthleteStats | null> {
  return staleWhileRevalidate(
    cacheKey(`/athletes/${athleteId}/stats`, athleteId),
    () => stravaApiProxy<StravaAthleteStats>(athleteId, `/athletes/${athleteId}/stats`),
    CACHE_15MIN,
  );
}

/** 取得運動員訓練區間設定 */
export function getAthleteZones(
  athleteId: number,
): Promise<StravaAthleteZones | null> {
  return staleWhileRevalidate(
    cacheKey('/athlete/zones', athleteId),
    () => stravaApiProxy<StravaAthleteZones>(athleteId, '/athlete/zones'),
    CACHE_1HOUR,
  );
}

/** 更新運動員資料 */
export async function updateAthlete(
  athleteId: number,
  data: { weight?: number },
): Promise<StravaDetailedAthlete | null> {
  const result = await stravaApiProxy<StravaDetailedAthlete>(
    athleteId,
    '/athlete',
    { ...data, _method: 'PUT' },
  );
  if (result) invalidateCache(cacheKey('/athlete', athleteId));
  return result;
}

// ===================================================================
// Clubs（5 GET）
// ===================================================================

/** 取得登入運動員的社團列表 */
export function getAthleteClubs(
  athleteId: number,
): Promise<StravaClub[] | null> {
  return staleWhileRevalidate(
    cacheKey('/athlete/clubs', athleteId),
    () => stravaApiProxy<StravaClub[]>(athleteId, '/athlete/clubs'),
    CACHE_15MIN,
  );
}

/** 取得社團詳情 */
export function getClub(
  athleteId: number,
  clubId: number,
): Promise<StravaClub | null> {
  return staleWhileRevalidate(
    cacheKey(`/clubs/${clubId}`, athleteId),
    () => stravaApiProxy<StravaClub>(athleteId, `/clubs/${clubId}`),
    CACHE_15MIN,
  );
}

/** 取得社團成員 */
export function getClubMembers(
  athleteId: number,
  clubId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaClubMember[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/clubs/${clubId}/members`, athleteId, params),
    () => stravaApiProxy<StravaClubMember[]>(athleteId, `/clubs/${clubId}/members`, params),
    CACHE_15MIN,
  );
}

/** 取得社團活動 */
export function getClubActivities(
  athleteId: number,
  clubId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaSummaryActivity[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/clubs/${clubId}/activities`, athleteId, params),
    () => stravaApiProxy<StravaSummaryActivity[]>(athleteId, `/clubs/${clubId}/activities`, params),
    CACHE_5MIN,
  );
}

/** 取得社團管理員 */
export function getClubAdmins(
  athleteId: number,
  clubId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaClubMember[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/clubs/${clubId}/admins`, athleteId, params),
    () => stravaApiProxy<StravaClubMember[]>(athleteId, `/clubs/${clubId}/admins`, params),
    CACHE_15MIN,
  );
}

// ===================================================================
// Segments（6 GET + 1 PUT）
// ===================================================================

/** 取得路段詳情 */
export function getSegment(
  athleteId: number,
  segmentId: number,
): Promise<StravaDetailedSegment | null> {
  return staleWhileRevalidate(
    cacheKey(`/segments/${segmentId}`, athleteId),
    () => stravaApiProxy<StravaDetailedSegment>(athleteId, `/segments/${segmentId}`),
    CACHE_15MIN,
  );
}

/** 探索附近路段 */
export function exploreSegments(
  athleteId: number,
  bounds: [number, number, number, number], // [sw_lat, sw_lng, ne_lat, ne_lng]
  opts?: { activity_type?: 'riding' | 'running'; min_cat?: number; max_cat?: number },
): Promise<{ segments: StravaDetailedSegment[] } | null> {
  const params = { bounds: bounds.join(','), ...opts };
  return staleWhileRevalidate(
    cacheKey('/segments/explore', athleteId, params),
    () => stravaApiProxy<{ segments: StravaDetailedSegment[] }>(athleteId, '/segments/explore', params),
    CACHE_5MIN,
  );
}

/** 取得星標路段 */
export function getStarredSegments(
  athleteId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaDetailedSegment[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey('/segments/starred', athleteId, params),
    () => stravaApiProxy<StravaDetailedSegment[]>(athleteId, '/segments/starred', params),
    CACHE_5MIN,
  );
}

/** 星標/取消星標路段 */
export async function starSegment(
  athleteId: number,
  segmentId: number,
  starred: boolean,
): Promise<StravaDetailedSegment | null> {
  const result = await stravaApiProxy<StravaDetailedSegment>(
    athleteId,
    `/segments/${segmentId}/starred`,
    { starred, _method: 'PUT' },
  );
  if (result) {
    invalidateCache(cacheKey(`/segments/${segmentId}`, athleteId));
    invalidateCacheByPrefix(`strava:${athleteId}:/segments/starred`);
  }
  return result;
}

/** 取得路段個人成績歷史 */
export function getSegmentAllEfforts(
  athleteId: number,
  segmentId: number,
  opts?: { page?: number; per_page?: number; start_date_local?: string; end_date_local?: string },
): Promise<StravaSegmentEffort[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/segments/${segmentId}/all_efforts`, athleteId, params),
    () => stravaApiProxy<StravaSegmentEffort[]>(athleteId, `/segments/${segmentId}/all_efforts`, params),
    CACHE_5MIN,
  );
}

/** 取得路段努力詳情 */
export function getSegmentEffortDetail(
  athleteId: number,
  effortId: number,
): Promise<StravaSegmentEffort | null> {
  return staleWhileRevalidate(
    cacheKey(`/segment_efforts/${effortId}`, athleteId),
    () => stravaApiProxy<StravaSegmentEffort>(athleteId, `/segment_efforts/${effortId}`),
    CACHE_15MIN,
  );
}

/** 取得路段串流資料 */
export function getSegmentStreams(
  athleteId: number,
  segmentId: number,
  keys: string[] = ['distance', 'altitude', 'latlng'],
  resolution: 'low' | 'medium' | 'high' = 'medium',
): Promise<StravaStream[] | null> {
  const params = { keys: keys.join(','), key_by_type: true, resolution };
  return staleWhileRevalidate(
    cacheKey(`/segments/${segmentId}/streams`, athleteId, params),
    () => stravaApiProxy<StravaStream[]>(athleteId, `/segments/${segmentId}/streams`, params),
    CACHE_1HOUR,
  );
}

// ===================================================================
// Routes（5 GET）
// ===================================================================

/** 取得運動員的路線列表 */
export function getAthleteRoutes(
  athleteId: number,
  opts?: { page?: number; per_page?: number },
): Promise<StravaRoute[] | null> {
  const params = { page: 1, per_page: 30, ...opts };
  return staleWhileRevalidate(
    cacheKey(`/athletes/${athleteId}/routes`, athleteId, params),
    () => stravaApiProxy<StravaRoute[]>(athleteId, `/athletes/${athleteId}/routes`, params),
    CACHE_15MIN,
  );
}

/** 取得路線詳情 */
export function getRoute(
  athleteId: number,
  routeId: number,
): Promise<StravaRoute | null> {
  return staleWhileRevalidate(
    cacheKey(`/routes/${routeId}`, athleteId),
    () => stravaApiProxy<StravaRoute>(athleteId, `/routes/${routeId}`),
    CACHE_15MIN,
  );
}

/** 取得路線串流資料 */
export function getRouteStreams(
  athleteId: number,
  routeId: number,
): Promise<StravaStream[] | null> {
  return staleWhileRevalidate(
    cacheKey(`/routes/${routeId}/streams`, athleteId),
    () => stravaApiProxy<StravaStream[]>(athleteId, `/routes/${routeId}/streams`),
    CACHE_1HOUR,
  );
}

/** 匯出路線為 GPX */
export function exportRouteGPX(
  athleteId: number,
  routeId: number,
): Promise<string | null> {
  // GPX 回傳 XML 文字，不快取
  return stravaApiProxy<string>(athleteId, `/routes/${routeId}/export_gpx`);
}

/** 匯出路線為 TCX */
export function exportRouteTCX(
  athleteId: number,
  routeId: number,
): Promise<string | null> {
  return stravaApiProxy<string>(athleteId, `/routes/${routeId}/export_tcx`);
}

// ===================================================================
// Gear（1 GET）
// ===================================================================

/** 取得裝備詳情 */
export function getGear(
  athleteId: number,
  gearId: string,
): Promise<StravaGear | null> {
  return staleWhileRevalidate(
    cacheKey(`/gear/${gearId}`, athleteId),
    () => stravaApiProxy<StravaGear>(athleteId, `/gear/${gearId}`),
    CACHE_1HOUR,
  );
}

// ===================================================================
// Uploads（1 POST + 1 GET）
// ===================================================================

/** 上傳活動檔案 */
export async function uploadActivity(
  athleteId: number,
  data: {
    file: string; // base64
    name?: string;
    description?: string;
    data_type: 'fit' | 'fit.gz' | 'tcx' | 'tcx.gz' | 'gpx' | 'gpx.gz';
    external_id?: string;
  },
): Promise<StravaUploadStatus | null> {
  return stravaApiProxy<StravaUploadStatus>(
    athleteId,
    '/uploads',
    { ...data, _method: 'POST' },
  );
}

/** 取得上傳狀態 */
export function getUploadStatus(
  athleteId: number,
  uploadId: number,
): Promise<StravaUploadStatus | null> {
  // 上傳狀態不快取（輪詢用）
  return stravaApiProxy<StravaUploadStatus>(athleteId, `/uploads/${uploadId}`);
}
