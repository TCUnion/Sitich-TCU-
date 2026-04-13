import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://service.criterium.tw';
const PRIMARY_API = import.meta.env.VITE_API_URL as string;
const BACKUP_API = import.meta.env.VITE_BACKUP_API_URL as string;

async function apiPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const tryFetch = async (base: string) => {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  };
  // 開發環境：先嘗試 localhost，失敗後走 Vite proxy（避免 CORS）
  const isDev = import.meta.env.DEV;
  try {
    return await tryFetch(PRIMARY_API);
  } catch {
    const backupBase = isDev ? '/api-proxy' : BACKUP_API;
    return await tryFetch(backupBase);
  }
}

// === 舊 Supabase（db.criterium.tw）— 現有資料 ===
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// === 新 Supabase（TCU 共用）— Token 管理 + 遷移目標 ===
const NEW_SUPABASE_URL = import.meta.env.VITE_NEW_SUPABASE_URL as string;
const NEW_SUPABASE_ANON_KEY = import.meta.env.VITE_NEW_SUPABASE_ANON_KEY as string;

export const supabaseNew = (NEW_SUPABASE_URL && NEW_SUPABASE_ANON_KEY)
  ? createClient(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY)
  : null;

const EDGE_FN_BASE = NEW_SUPABASE_URL
  ? `${NEW_SUPABASE_URL}/functions/v1`
  : null;

/** 呼叫新 Supabase Edge Function（含 5 秒超時） */
async function callEdgeFunction<T = unknown>(
  fnName: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  if (!EDGE_FN_BASE) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${EDGE_FN_BASE}/${fnName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[EdgeFn] ${fnName} failed:`, res.status, errBody);
      return null;
    }
    return await res.json() as T;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn(`[EdgeFn] ${fnName} timeout (5s)`);
    } else {
      console.warn(`[EdgeFn] ${fnName} error:`, err);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// === Strava Token 集中管理 API ===

export interface TokenStatus {
  exists: boolean;
  athlete_id?: number;
  athlete_name?: string;
  athlete_profile?: string;
  token_status?: string;
  is_expired?: boolean;
  can_auto_refresh?: boolean;
  last_used_at?: string;
  source_project?: string;
}

/** 查詢 Strava token 狀態（透過 Edge Function，不暴露 token） */
export async function checkStravaTokenStatus(athleteId: number): Promise<TokenStatus | null> {
  return callEdgeFunction<TokenStatus>('strava-token-status', { athlete_id: athleteId });
}

/** 將 OAuth 取得的 token 存入新 Supabase（由 n8n callback 後前端轉發） */
export async function storeStravaToken(data: {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  athlete: { id: number; firstname?: string; lastname?: string; profile?: string; profile_medium?: string };
  source_project?: string;
}): Promise<boolean> {
  if (!EDGE_FN_BASE) return false;
  // 防止 n8n 模板渲染失敗導致的 "undefined" 字串
  const clean = (v: unknown) => (v && v !== 'undefined' && v !== 'null') ? v : null;
  const accessToken = clean(data.access_token);
  if (!accessToken || !data.athlete?.id) return false;
  try {
    const res = await fetch(`${EDGE_FN_BASE}/strava-oauth-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direct_store: true,
        access_token: accessToken,
        refresh_token: clean(data.refresh_token),
        expires_at: (data.expires_at && data.expires_at > 0) ? data.expires_at : Math.floor(Date.now() / 1000) + 21600,
        athlete: data.athlete,
        source_project: data.source_project ?? 'STRAVA TCU',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 透過 strava-proxy 呼叫 Strava API（自動 refresh token） */
export async function stravaApiProxy<T = unknown>(
  athleteId: number,
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<T | null> {
  return callEdgeFunction<T>('strava-proxy', {
    athlete_id: athleteId,
    endpoint,
    params,
  });
}

/** 取得 Strava 運動員基本資料（供 iOS fallback 使用，不需 accessToken） */
export async function fetchAthleteProfile(athleteId: number): Promise<{
  id: number; firstname: string; lastname: string;
  profile: string; profile_medium: string;
  city?: string; state?: string; country?: string;
} | null> {
  return stravaApiProxy(athleteId, '/athlete');
}

/** 入列同步任務 */
export async function enqueueStravaSync(data: {
  job_type: string;
  athlete_id?: number;
  segment_id?: number;
  reason?: string;
}): Promise<{ status: string; job_id?: string } | null> {
  return callEdgeFunction('strava-enqueue-sync', data);
}

export function openStravaAuth(): void {
  window.open(
    `${API_BASE}/webhook/strava/auth/start`,
    'strava-auth',
    'width=600,height=700,left=200,top=100'
  );
}

export async function getLeaderboard(segmentId: string, athleteId: number) {
  const data = await callEdgeFunction<Record<string, unknown>>('strava-proxy', {
    athlete_id: athleteId,
    endpoint: `/segments/${segmentId}/leaderboard`,
  });
  if (!data) throw new Error('Failed to fetch leaderboard');
  // API 可能回傳 { entries: [...] } 或直接陣列；統一為 { entries }
  const raw: unknown[] = Array.isArray(data) ? data : ((data.entries as unknown[]) ?? []);
  // 欄位映射：API 回傳 name/time_seconds/avg_power_value → 前端 athlete_name/elapsed_time/average_watts
  const entries = raw.map((e: unknown) => {
    const entry = e as Record<string, unknown>;
    return {
      rank: entry.rank as number | undefined,
      athlete_id: (entry.athlete_id ?? entry.id) as number | undefined,
      athlete_name: (entry.athlete_name ?? entry.name) as string | undefined,
      athlete_profile: entry.athlete_profile as string | undefined,
      elapsed_time: (entry.elapsed_time ?? entry.time_seconds) as number | undefined,
      start_date_local: (entry.start_date_local ?? entry.date) as string | undefined,
      average_watts: (entry.average_watts ?? entry.avg_power_value) as number | null | undefined,
      activity_id: (entry.activity_id ?? entry.strava_activity_id) as number | null | undefined,
    };
  });
  return { entries };
}

export interface CyclingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  distance: number;
  elevation: number;
  pace: string;
  max_participants: number;
  cover_image: string | null;
  region: string;
  tags: string[];
}

export interface OfficialEvent {
  id: string;
  title: string;
  title_en: string;
  status: string;
  category: string;
  event_date: string;
  cover_image_url: string | null;
  color: string | null;
  highlights: { label: string; content: string }[];
}

/** 取得近期約騎活動（今日起，日期正序，最多 10 筆） */
export async function getUpcomingCyclingEvents(limit = 10): Promise<CyclingEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('cycling_events')
    .select('id, title, description, date, time, distance, elevation, pace, max_participants, cover_image, region, tags')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** 取得指定運動員的報名路段 ID 清單 */
export async function getMyRegistrations(athleteId: number): Promise<number[]> {
  const { data } = await supabase
    .from('registrations')
    .select('segment_id')
    .eq('strava_athlete_id', athleteId);
  return (data ?? []).map(r => Number(r.segment_id));
}

/** 報名挑戰 */
export async function registerChallenge(
  athleteId: number,
  athleteName: string,
  segmentId: number,
  athleteProfile?: string | null,
  team?: string,
  tcuId?: string | null,
): Promise<void> {
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('strava_athlete_id', athleteId)
    .eq('segment_id', segmentId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase
    .from('registrations')
    .insert({
      id: crypto.randomUUID(),
      strava_athlete_id: athleteId,
      athlete_name: athleteName,
      segment_id: segmentId,
      athlete_profile: athleteProfile ?? null,
      team: team ?? '',
      tcu_id: tcuId ?? null,
      status: 'approved',
    });
  if (error) throw error;
}

export interface RegistrationRecord {
  strava_athlete_id: number;
  athlete_name: string;
  athlete_profile: string | null;
  team: string;
}

/** 取得指定路段的所有報名者（依報名時間正序） */
export async function getSegmentRegistrations(segmentId: number): Promise<RegistrationRecord[]> {
  const { data } = await supabase
    .from('registrations')
    .select('strava_athlete_id, athlete_name, athlete_profile, team')
    .eq('segment_id', segmentId)
    .order('registered_at', { ascending: true, nullsFirst: false });
  return (data ?? []) as RegistrationRecord[];
}

/** 取得指定路段的成績（來自 segment_elapsed_times 表） */
export async function getSegmentElapsedTimes(segmentId: number): Promise<Map<number, number>> {
  const { data } = await supabase
    .from('segment_elapsed_times')
    .select('strava_athlete_id, elapsed_time')
    .eq('segment_id', segmentId);
  const map = new Map<number, number>();
  (data ?? []).forEach(r => map.set(Number(r.strava_athlete_id), Number(r.elapsed_time)));
  return map;
}

/** 取得指定運動員在所有路段的成績（segment_id → elapsed_time） */
export async function getMySegmentElapsedTimes(athleteId: number): Promise<Map<number, number>> {
  const { data } = await supabase
    .from('segment_elapsed_times')
    .select('segment_id, elapsed_time')
    .eq('strava_athlete_id', athleteId);
  const map = new Map<number, number>();
  (data ?? []).forEach(r => map.set(Number(r.segment_id), Number(r.elapsed_time)));
  return map;
}

export interface MyBestEffort {
  elapsedTime: number;
  activityId: number | null;
  activityName: string | null;
  count: number;
}

/** 取得指定運動員在所有路段的最佳成績（含 activity_id 與挑戰次數，來自 segment_efforts_v2） */
export async function getMySegmentBestEfforts(athleteId: number): Promise<Map<number, MyBestEffort>> {
  const { data } = await supabase
    .from('segment_efforts_v2')
    .select('segment_id, elapsed_time, activity_id')
    .eq('athlete_id', athleteId)
    .gt('elapsed_time', 0);
  const map = new Map<number, MyBestEffort>();
  (data ?? []).forEach(r => {
    const segId = Number(r.segment_id);
    const existing = map.get(segId);
    if (!existing) {
      map.set(segId, {
        elapsedTime: Number(r.elapsed_time),
        activityId: r.activity_id ? Number(r.activity_id) : null,
        activityName: null,
        count: 1,
      });
    } else {
      const count = existing.count + 1;
      if (Number(r.elapsed_time) < existing.elapsedTime) {
        map.set(segId, {
          elapsedTime: Number(r.elapsed_time),
          activityId: r.activity_id ? Number(r.activity_id) : null,
          activityName: null,
          count,
        });
      } else {
        map.set(segId, { ...existing, count });
      }
    }
  });
  return map;
}

/** 批次計算多個路段的名次（segment_id → { rank, total }） */
export async function getSegmentRankMap(
  segmentIds: number[],
  myTimesMap: Map<number, number>,
): Promise<Map<number, { rank: number; total: number }>> {
  if (segmentIds.length === 0) return new Map();
  const { data } = await supabase
    .from('segment_elapsed_times')
    .select('segment_id, elapsed_time')
    .in('segment_id', segmentIds)
    .gt('elapsed_time', 0);
  const bySegment = new Map<number, number[]>();
  (data ?? []).forEach(r => {
    const segId = Number(r.segment_id);
    const list = bySegment.get(segId) ?? [];
    list.push(Number(r.elapsed_time));
    bySegment.set(segId, list);
  });
  const rankMap = new Map<number, { rank: number; total: number }>();
  for (const segId of segmentIds) {
    const myTime = myTimesMap.get(segId);
    if (myTime == null) continue;
    const times = bySegment.get(segId) ?? [];
    rankMap.set(segId, {
      rank: times.filter(t => t < myTime).length + 1,
      total: times.length,
    });
  }
  return rankMap;
}

/** 登入後補齊 placeholder 姓名與頭貼（僅更新 'Athlete {id}' 類型的佔位符） */
export async function refreshAthleteProfile(
  athleteId: number,
  athleteName: string,
  athleteProfile: string | null,
): Promise<void> {
  await supabase
    .from('registrations')
    .update({ athlete_name: athleteName, athlete_profile: athleteProfile })
    .eq('strava_athlete_id', athleteId)
    .like('athlete_name', 'Athlete %');
}

/** 取消報名 */
export async function unregisterChallenge(athleteId: number, segmentId: number): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('strava_athlete_id', athleteId)
    .eq('segment_id', segmentId);
  if (error) throw error;
}

export interface TCUMemberProfile {
  email: string;
  real_name: string | null;
  name: string | null;
  account: string | null;
  nickname: string | null;
  team: string | null;
  tcu_id: string | null;
  member_type: string | null;
  profile_photo: string | null;
  gender: string | null;
  birthday: string | null;
  nationality: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  self_introduction: string | null;
  skills: string | null;
}

/** 透過 Strava athlete ID 查詢 TCU 會員資料（兩步查詢：bindings → tcu_members） */
export async function getTCUMemberByStravaId(athleteId: number): Promise<TCUMemberProfile | null> {
  const { data: bindings, error: bindingError } = await supabase
    .from('strava_member_bindings')
    .select('tcu_member_email, tcu_account')
    .eq('strava_id', String(athleteId))
    .limit(1);
  if (bindingError) console.error('[TCU] strava_member_bindings error:', bindingError);
  if (!bindings || bindings.length === 0) return null;

  const { tcu_member_email, tcu_account } = bindings[0];
  let query = supabase.from('tcu_members').select('*');
  if (tcu_account) {
    query = query.eq('account', tcu_account);
  } else if (tcu_member_email) {
    query = query.eq('email', tcu_member_email);
  } else {
    return null;
  }
  const { data, error: memberError } = await query.limit(1);
  if (memberError) console.error('[TCU] tcu_members error:', memberError);
  return (data?.[0] as TCUMemberProfile) ?? null;
}

export interface TCUMemberSearch {
  email: string;
  real_name: string | null;
  name: string | null;
  account: string | null;
  tcu_id: string | null;
  team: string | null;
}

/** 透過 TCU 帳號或 TCU ID 搜尋會員（兩段查詢避免 PostgREST or 格式問題） */
export async function findTCUMemberByIdOrAccount(input: string): Promise<TCUMemberSearch | null> {
  const upper = input.toUpperCase();

  const { data: byAccount } = await supabase
    .from('tcu_members')
    .select('*')
    .eq('account', upper)
    .limit(1);
  if (byAccount && byAccount.length > 0) return byAccount[0] as TCUMemberSearch;

  const { data: byId } = await supabase
    .from('tcu_members')
    .select('*')
    .eq('tcu_id', input)
    .limit(1);
  if (byId && byId.length > 0) return byId[0] as TCUMemberSearch;

  return null;
}

/** 查詢 TCU 帳號是否已綁定（回傳已綁定的 strava_id，否則 null） */
export async function checkTcuAccountBinding(account: string | null, email: string): Promise<string | null> {
  if (account) {
    const { data } = await supabase
      .from('strava_member_bindings')
      .select('strava_id')
      .eq('tcu_account', account)
      .limit(1);
    if (data && data.length > 0) return String(data[0].strava_id);
  }
  const { data } = await supabase
    .from('strava_member_bindings')
    .select('strava_id')
    .eq('tcu_member_email', email)
    .limit(1);
  if (data && data.length > 0) return String(data[0].strava_id);
  return null;
}

/** 觸發 OTP 綁定郵件 */
export async function triggerMemberBindingOtp(
  email: string,
  memberName: string,
  stravaId: number,
  inputId: string,
): Promise<{ already_bound?: boolean }> {
  const res = await fetch(`${API_BASE}/webhook/member-binding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, memberName, stravaId, input_id: inputId, action: 'generate_otp' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as { already_bound?: boolean };
}

/** 驗證 OTP（查詢 tcu_members.otp_code） */
export async function verifyMemberOtp(email: string, otp: string): Promise<boolean> {
  const { data } = await supabase
    .from('tcu_members')
    .select('email')
    .eq('email', email)
    .eq('otp_code', otp)
    .maybeSingle();
  return data !== null;
}

/** 確認綁定（後端寫入 strava_member_bindings） */
export async function confirmMemberBinding(
  email: string,
  stravaId: number,
  tcuAccount: string,
  memberName: string,
): Promise<void> {
  await apiPost('/api/auth/confirm-binding', {
    email,
    stravaId,
    tcu_account: tcuAccount,
    member_name: memberName,
  });
}

/** 清除 OTP */
export async function clearMemberOtp(email: string): Promise<void> {
  await supabase
    .from('tcu_members')
    .update({ otp_code: null, otp_expires_at: null })
    .eq('email', email);
}

/** 更新或插入路段元資料（og_image、race_description、team_name） */
export async function upsertSegmentMetadata(
  segmentId: number,
  fields: { og_image?: string; race_description?: string; team_name?: string },
): Promise<void> {
  const { error } = await supabase
    .from('segment_metadata')
    .upsert({ segment_id: segmentId, ...fields }, { onConflict: 'segment_id' });
  if (error) throw error;
}

export interface SegmentEffortEntry {
  athlete_id: number;
  elapsed_time: number;
  average_watts: number | null;
  activity_id: number | null;
  start_date: string | null;
}

/** 取得路段成績（segment_efforts_v2），回傳每位運動員最佳時間與嘗試次數 */
export async function getSegmentEfforts(
  stravaId: number,
  startDate?: string | null,
  endDate?: string | null,
): Promise<{ bestEfforts: Map<number, SegmentEffortEntry>; attemptCounts: Map<number, number> }> {
  let query = supabase
    .from('segment_efforts_v2')
    .select('athlete_id, elapsed_time, average_watts, activity_id, start_date')
    .eq('segment_id', stravaId)
    .gt('elapsed_time', 0);
  if (startDate) query = query.gte('start_date', startDate);
  if (endDate) query = query.lte('start_date', endDate + 'T23:59:59');
  const { data } = await query;
  const bestEfforts = new Map<number, SegmentEffortEntry>();
  const attemptCounts = new Map<number, number>();
  (data ?? []).forEach(r => {
    const id = Number(r.athlete_id);
    attemptCounts.set(id, (attemptCounts.get(id) ?? 0) + 1);
    const existing = bestEfforts.get(id);
    if (!existing || r.elapsed_time < existing.elapsed_time) {
      bestEfforts.set(id, r as SegmentEffortEntry);
    }
  });
  return { bestEfforts, attemptCounts };
}

/** 取得官方賽事（published，日期倒序） */
export async function getOfficialEvents(limit = 5): Promise<OfficialEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, title_en, status, category, event_date, cover_image_url, color, highlights')
    .eq('status', 'published')
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
